import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { success, error, ErrorCode } from '../utils/response';

export const toolsRouter = new Hono<{ Bindings: Env }>();

toolsRouter.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM tools ORDER BY sort_order ASC, id ASC`
  ).all();
  return success(results);
});

toolsRouter.post('/', authMiddleware, async (c) => {
  const { title, icon, description, url, tags, sort_order } = await c.req.json();
  if (!title || !url) {
    return error(ErrorCode.BAD_REQUEST, 'title 和 url 为必填项');
  }
  const result = await c.env.DB.prepare(
    `INSERT INTO tools (title, icon, description, url, tags, sort_order) VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(title, icon || '🔧', description || '', url, JSON.stringify(tags || []), sort_order || 0).run();
  return success({ id: result.meta.last_row_id }, '创建成功');
});

toolsRouter.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const { title, icon, description, url, tags, sort_order } = await c.req.json();
  await c.env.DB.prepare(
    `UPDATE tools SET title=?, icon=?, description=?, url=?, tags=?, sort_order=? WHERE id=?`
  ).bind(title, icon, description, url, JSON.stringify(tags || []), sort_order, id).run();
  return success(null, '更新成功');
});

toolsRouter.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare(`DELETE FROM tools WHERE id = ?`).bind(id).run();
  return success(null, '删除成功');
});
