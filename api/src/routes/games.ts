import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { success, error, ErrorCode } from '../utils/response';
import { unzipSync } from 'fflate';

export const gamesRouter = new Hono<{ Bindings: Env }>();

function parseTags(tags: unknown): string[] {
  if (typeof tags !== 'string') return [];
  try {
    const arr = JSON.parse(tags);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

const SLUG_RE = /^[a-z0-9][a-z0-9-_]{0,63}$/;
const MAX_ZIP_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILE_COUNT = 300;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 单文件解压后 20MB

// 扩展名 -> MIME 类型（缺失时兜底 application/octet-stream）
const MIME_MAP: Record<string, string> = {
  html: 'text/html', htm: 'text/html',
  js: 'application/javascript', mjs: 'application/javascript',
  css: 'text/css', json: 'application/json', map: 'application/json',
  wasm: 'application/wasm',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  webp: 'image/webp', svg: 'image/svg+xml', ico: 'image/x-icon',
  txt: 'text/plain', xml: 'application/xml',
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', oga: 'audio/ogg',
  mp4: 'video/mp4', webm: 'video/webm',
  glb: 'model/gltf-binary', gltf: 'model/gltf+json',
  woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf', eot: 'application/vnd.ms-fontobject',
  bin: 'application/octet-stream', dat: 'application/octet-stream',
};

const cacheControlFor = (path: string): string => {
  const isEntry = path === 'index.html' || path.endsWith('/index.html');
  return isEntry ? 'public, max-age=300, must-revalidate' : 'public, max-age=31536000, immutable';
};

function listObjects(bucket: R2Bucket, prefix: string): Promise<string[]> {
  return bucket.list({ prefix }).then(async (r) => {
    const keys = r.objects.map((o) => o.key);
    if (r.truncated) {
      const more = await listObjects(bucket, prefix);
      return [...keys, ...more];
    }
    return keys;
  });
}

// POST /api/games/upload-zip — 上传游戏 zip 包，解压到 R2 games/<slug>/ 并写入 games 表（需认证）
gamesRouter.post('/upload-zip', authMiddleware, async (c) => {
  const form = await c.req.formData();
  const zipFile = form.get('zip') as File | null;
  const slug = ((form.get('slug') as string) || '').trim().toLowerCase();
  const title = (form.get('title') as string) || '';
  const icon = (form.get('icon') as string) || '🎮';
  const description = (form.get('description') as string) || '';
  const tags = ((form.get('tags') as string) || '').split(',').map((t) => t.trim()).filter(Boolean);

  if (!zipFile || !slug) return error(ErrorCode.BAD_REQUEST, 'zip 文件和 slug 为必填项');
  if (!SLUG_RE.test(slug)) return error(ErrorCode.BAD_REQUEST, 'slug 仅支持小写字母、数字、中划线、下划线，长度为 1-64 位');
  if (zipFile.size > MAX_ZIP_SIZE) return error(ErrorCode.BAD_REQUEST, 'zip 文件不能超过 50MB');

  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(new Uint8Array(await zipFile.arrayBuffer()));
  } catch {
    return error(ErrorCode.BAD_REQUEST, 'zip 文件解析失败，请重新打包（zip 格式）');
  }

  const entries = Object.entries(files).filter(([name, data]) => {
    if (!data || data.length === 0) return false;
    if (name.endsWith('/') || name.startsWith('__MACOSX/') || name.startsWith('.DS_Store')) return false;
    return true;
  });

  if (entries.length === 0) return error(ErrorCode.BAD_REQUEST, 'zip 包内没有文件');
  if (entries.length > MAX_FILE_COUNT) return error(ErrorCode.BAD_REQUEST, `文件数不能超过 ${MAX_FILE_COUNT} 个`);

  const prefix = `games/${slug}`;
  const rootFiles = entries.map(([name]) => name).filter((n) => !n.includes('/'));
  if (!rootFiles.includes('index.html') && !entries.some(([name]) => name.endsWith('/index.html'))) {
    return error(ErrorCode.BAD_REQUEST, 'zip 包根目录必须包含 index.html（游戏入口）');
  }

  // 路径安全校验：拒绝绝对路径、../ 穿越
  for (const [name] of entries) {
    const parts = name.split('/');
    if (parts.some((p) => p === '..') || name.startsWith('/') || name.includes('\\') || /^[A-Za-z]:/.test(name)) {
      return error(ErrorCode.BAD_REQUEST, `zip 包内包含非法路径: ${name}`);
    }
  }

  // 清理旧版本残留
  const oldKeys = await listObjects(c.env.BUCKET, prefix + '/');
  if (oldKeys.length) await c.env.BUCKET.delete(oldKeys);

  // 解压写入 R2，自动 MIME + 分层缓存
  for (const [name, data] of entries) {
    if (data.length > MAX_FILE_SIZE) return error(ErrorCode.BAD_REQUEST, `单文件 ${name} 超过 20MB 限制`);
    const ext = name.split('.').pop()?.toLowerCase() || '';
    await c.env.BUCKET.put(`${prefix}/${name}`, data, {
      httpMetadata: {
        contentType: MIME_MAP[ext] || 'application/octet-stream',
        cacheControl: cacheControlFor(name),
      },
    });
  }

  const src = `${c.env.PUBLIC_CDN_URL}/${prefix}/index.html`;
  const finalTitle = title || slug;

  // upsert 游戏记录
  const existing = await c.env.DB.prepare(`SELECT id FROM games WHERE slug = ?`).bind(slug).first();
  if (existing) {
    await c.env.DB.prepare(
      `UPDATE games SET title=?, icon=?, description=?, src=?, tags=? WHERE slug=?`
    ).bind(finalTitle, icon, description, src, JSON.stringify(tags), slug).run();
  } else {
    await c.env.DB.prepare(
      `INSERT INTO games (title, icon, description, src, tags, slug) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(finalTitle, icon, description, src, JSON.stringify(tags), slug).run();
  }

  return success({ slug, src, files: entries.map(([n]) => `${prefix}/${n}`) }, '游戏上传成功');
});

// GET /api/games — 获取游戏列表（公开）
gamesRouter.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM games ORDER BY sort_order ASC, id ASC`
  ).all<Record<string, unknown>>();
  const list = (results || []).map((row) => ({ ...row, tags: parseTags(row.tags) }));
  return success(list);
});

// POST /api/games — 创建游戏（需认证，src 省略时按 slug 自动拼接 CDN URL）
gamesRouter.post('/', authMiddleware, async (c) => {
  const { title, icon, description, src, tags, sort_order, slug } = await c.req.json();
  if (!title || (!src && !slug)) {
    return error(ErrorCode.BAD_REQUEST, 'title 必填，src 或 slug 至少提供一个');
  }
  if (slug && !SLUG_RE.test(slug)) {
    return error(ErrorCode.BAD_REQUEST, 'slug 仅支持小写字母、数字、中划线、下划线，长度为 1-64 位');
  }

  const finalSrc = src || `${c.env.PUBLIC_CDN_URL}/games/${slug}/index.html`;
  const result = await c.env.DB.prepare(
    `INSERT INTO games (title, icon, description, src, tags, slug, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(title, icon || '🎮', description || '', finalSrc, JSON.stringify(tags || []), slug || '', sort_order || 0).run();

  return success({ id: result.meta.last_row_id }, '创建成功');
});

// PUT /api/games/:id — 更新游戏（需认证）
gamesRouter.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const { title, icon, description, src, tags, sort_order, slug } = await c.req.json();
  if (slug && !SLUG_RE.test(slug)) {
    return error(ErrorCode.BAD_REQUEST, 'slug 格式不合法');
  }

  await c.env.DB.prepare(
    `UPDATE games SET title=?, icon=?, description=?, src=?, tags=?, slug=?, sort_order=? WHERE id=?`
  ).bind(title, icon, description, src, JSON.stringify(tags || []), slug || '', sort_order, id).run();

  return success(null, '更新成功');
});

// DELETE /api/games/:id — 删除游戏（需认证，连带清理 R2 文件）
gamesRouter.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const row = await c.env.DB.prepare(`SELECT slug FROM games WHERE id = ?`).bind(id).first<{ slug: string }>();
  if (row?.slug) {
    const keys = await listObjects(c.env.BUCKET, `games/${row.slug}/`);
    if (keys.length) await c.env.BUCKET.delete(keys);
  }
  await c.env.DB.prepare(`DELETE FROM games WHERE id = ?`).bind(id).run();
  return success(null, '删除成功');
});
