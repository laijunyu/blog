import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { success, error, ErrorCode } from '../utils/response';

export const linksRouter = new Hono<{ Bindings: Env }>();

linksRouter.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM links ORDER BY sort_order ASC, id ASC`
  ).all();
  return success(results);
});

linksRouter.post('/', authMiddleware, async (c) => {
  const { name, url, avatar, description, sort_order } = await c.req.json();
  if (!name || !url) {
    return error(ErrorCode.BAD_REQUEST, 'name 和 url 为必填项');
  }
  const result = await c.env.DB.prepare(
    `INSERT INTO links (name, url, avatar, description, sort_order) VALUES (?, ?, ?, ?, ?)`
  ).bind(name, url, avatar || '', description || '', sort_order || 0).run();
  return success({ id: result.meta.last_row_id }, '创建成功');
});

linksRouter.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const { name, url, avatar, description, sort_order } = await c.req.json();
  await c.env.DB.prepare(
    `UPDATE links SET name=?, url=?, avatar=?, description=?, sort_order=? WHERE id=?`
  ).bind(name, url, avatar, description, sort_order, id).run();
  return success(null, '更新成功');
});

linksRouter.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare(`DELETE FROM links WHERE id = ?`).bind(id).run();
  return success(null, '删除成功');
});
