import { Hono } from 'hono';
import { success } from '../utils/response';

export const tagsRouter = new Hono<{ Bindings: Env }>();

tagsRouter.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT tags FROM posts WHERE status = 'published'`
  ).all();

  const tagMap: Record<string, number> = {};
  for (const row of results as { tags: string }[]) {
    try {
      const tags: string[] = JSON.parse(row.tags);
      for (const tag of tags) {
        tagMap[tag] = (tagMap[tag] || 0) + 1;
      }
    } catch { /* skip invalid JSON */ }
  }

  const tagList = Object.entries(tagMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return success(tagList);
});
