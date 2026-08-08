import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { success, error, ErrorCode } from '../utils/response';

export const gamesRouter = new Hono<{ Bindings: Env }>();

// GET /api/games — 获取游戏列表（公开）
gamesRouter.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM games ORDER BY sort_order ASC, id ASC`
  ).all();
  return success(results);
});

// POST /api/games — 创建游戏（需认证）
gamesRouter.post('/', authMiddleware, async (c) => {
  const { title, icon, description, src, tags, sort_order } = await c.req.json();
  if (!title || !src) {
    return error(ErrorCode.BAD_REQUEST, 'title 和 src 为必填项');
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO games (title, icon, description, src, tags, sort_order) VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(title, icon || '🎮', description || '', src, JSON.stringify(tags || []), sort_order || 0).run();

  return success({ id: result.meta.last_row_id }, '创建成功');
});

// PUT /api/games/:id — 更新游戏（需认证）
gamesRouter.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const { title, icon, description, src, tags, sort_order } = await c.req.json();

  await c.env.DB.prepare(
    `UPDATE games SET title=?, icon=?, description=?, src=?, tags=?, sort_order=? WHERE id=?`
  ).bind(title, icon, description, src, JSON.stringify(tags || []), sort_order, id).run();

  return success(null, '更新成功');
});

// DELETE /api/games/:id — 删除游戏（需认证）
gamesRouter.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare(`DELETE FROM games WHERE id = ?`).bind(id).run();
  return success(null, '删除成功');
});
