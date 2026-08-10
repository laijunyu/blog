import { Hono } from 'hono';
import { success } from '../utils/response';

export const feedRouter = new Hono<{ Bindings: Env }>();

/**
 * GET /feed.xml – RSS 2.0 feed for published blog posts
 * Returns XML with appropriate Content-Type header.
 */
feedRouter.get('/', async (c) => {
  // Fetch latest published posts (limit to 20 for brevity)
  const { results } = await c.env.DB.prepare(
    `SELECT slug, title, date, summary FROM posts WHERE status = 'published' ORDER BY date DESC LIMIT 20`
  ).all();

  // Helper to escape XML special characters
  const esc = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const items = (results as any[]).map((row) => {
    const link = `https://your-domain.example.com/blog/${row.slug}/`;
    const pubDate = new Date(row.date).toUTCString();
    const title = esc(row.title);
    const description = esc(row.summary ?? '');
    return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
    </item>`;
  }).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>NavHub</title>
    <link>https://your-domain.example.com/</link>
    <description>个人导航站 - 博客、游戏、工具、友链</description>
    <language>zh-CN</language>
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
});

export default feedRouter;