import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { success, error, ErrorCode } from '../utils/response';

function parseTags(tags: unknown): string[] {
  if (typeof tags !== 'string') return [];
  try {
    const arr = JSON.parse(tags);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export const toolsRouter = new Hono<{ Bindings: Env }>();

toolsRouter.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, title, icon, description, url, tags, type, sort_order FROM tools ORDER BY sort_order ASC, id ASC`
  ).all<Record<string, unknown>>();
  const list = (results || []).map((row) => ({ ...row, tags: parseTags(row.tags) }));
  return success(list);
});

toolsRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const row = await c.env.DB.prepare(
    `SELECT * FROM tools WHERE id = ?`
  ).bind(id).first<Record<string, unknown>>();
  if (!row) {
    return error(ErrorCode.NOT_FOUND, '工具不存在');
  }
  return success({ ...row, tags: parseTags(row.tags) });
});

toolsRouter.post('/', authMiddleware, async (c) => {
  const { title, icon, description, url, tags, sort_order, type, body } = await c.req.json();
  const t = type === 'embed' ? 'embed' : 'link';
  if (!title || (t === 'link' && !url)) {
    return error(ErrorCode.BAD_REQUEST, 'title 和 url 为必填项');
  }
  const result = await c.env.DB.prepare(
    `INSERT INTO tools (title, icon, description, url, tags, sort_order, type, body) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(title, icon || '🔧', description || '', url || '', JSON.stringify(tags || []), sort_order || 0, t, body || '').run();
  return success({ id: result.meta.last_row_id }, '创建成功');
});

toolsRouter.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const { title, icon, description, url, tags, sort_order, type, body } = await c.req.json();
  const t = type === 'embed' ? 'embed' : 'link';
  await c.env.DB.prepare(
    `UPDATE tools SET title=?, icon=?, description=?, url=?, tags=?, sort_order=?, type=?, body=? WHERE id=?`
  ).bind(title, icon, description, url || '', JSON.stringify(tags || []), sort_order, t, body || '', id).run();
  return success(null, '更新成功');
});

toolsRouter.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare(`DELETE FROM tools WHERE id = ?`).bind(id).run();
  return success(null, '删除成功');
});