import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { success, error, ErrorCode } from '../utils/response';

export const postsRouter = new Hono<{ Bindings: Env }>();

// GET /api/posts — 获取已发布文章列表（公开）
postsRouter.get('/', async (c) => {
  const q = c.req.query('q') || '';
  const tag = c.req.query('tag') || '';

  let sql = `SELECT id, slug, title, date, tags, summary, cover_image, status 
             FROM posts WHERE status = 'published'`;
  const params: string[] = [];

  if (q) {
    sql += ` AND (title LIKE ? OR summary LIKE ? OR tags LIKE ?)`;
    const keyword = `%${q}%`;
    params.push(keyword, keyword, keyword);
  }

  if (tag) {
    sql += ` AND tags LIKE ?`;
    params.push(`%"${tag}"%`);
  }

  sql += ` ORDER BY date DESC`;

  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  return success(results);
});

// GET /api/posts/:slug — 获取单篇文章（公开）
postsRouter.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const result = await c.env.DB.prepare(
    `SELECT * FROM posts WHERE slug = ? AND status = 'published'`
  ).bind(slug).first();

  if (!result) {
    return error(ErrorCode.NOT_FOUND, '文章不存在', 404);
  }
  return success(result);
});

// POST /api/posts — 创建文章（需认证）
postsRouter.post('/', authMiddleware, async (c) => {
  const body = await c.req.json();
  const { slug, title, date, tags, summary, body: content, cover_image, status } = body;

  if (!slug || !title) {
    return error(ErrorCode.BAD_REQUEST, 'slug 和 title 为必填项');
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO posts (slug, title, date, tags, summary, body, cover_image, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    slug, title, date || new Date().toISOString(),
    JSON.stringify(tags || []), summary || '', content || '',
    cover_image || '', status || 'draft'
  ).run();

  return success({ id: result.meta.last_row_id }, '创建成功');
});

// PUT /api/posts/:id — 更新文章（需认证）
postsRouter.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { title, date, tags, summary, body: content, cover_image, status, slug } = body;

  await c.env.DB.prepare(
    `UPDATE posts SET title=?, date=?, tags=?, summary=?, body=?, cover_image=?, status=?, slug=?, updated_at=datetime('now')
     WHERE id=?`
  ).bind(
    title, date, JSON.stringify(tags || []), summary || '',
    content || '', cover_image || '', status || 'draft', slug, id
  ).run();

  return success(null, '更新成功');
});

// DELETE /api/posts/:id — 删除文章（需认证）
postsRouter.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare(`DELETE FROM posts WHERE id = ?`).bind(id).run();
  return success(null, '删除成功');
});
