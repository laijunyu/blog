import { Hono } from 'hono';
import { success } from '../utils/response';

export const siteRouter = new Hono<{ Bindings: Env }>();

siteRouter.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(`SELECT key, value FROM site_config`).all();
  const config: Record<string, string> = {};
  for (const row of results as { key: string; value: string }[]) {
    config[row.key] = row.value;
  }

  // 获取各分区计数
  const postsCount = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM posts WHERE status = 'published'`
  ).first<{ count: number }>();
  const gamesCount = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM games`).first<{ count: number }>();
  const toolsCount = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM tools`).first<{ count: number }>();
  const linksCount = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM links`).first<{ count: number }>();

  return success({
    ...config,
    counts: {
      posts: postsCount?.count || 0,
      games: gamesCount?.count || 0,
      tools: toolsCount?.count || 0,
      links: linksCount?.count || 0,
    },
  });
});
