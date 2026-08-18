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
    `SELECT slug, title, date, summary, body FROM posts WHERE status = 'published' ORDER BY date DESC LIMIT 20`
  ).all();

  // Helper to escape XML special characters
  const esc = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  // Strip markdown/images/HTML, collapse whitespace, then truncate
  const toPlainText = (md: string, maxLen: number) => {
    let text = md
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[[^\]]*\]\([^)]*\)/g, '$1')
      .replace(/<[^>]*>/g, ' ')
      .replace(/[#>*_~\-|]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
  };

  const siteUrl = c.env.FRONTEND_ORIGIN || 'https://example.com';

  // Load site config for dynamic title/description (falls back to defaults)
  const defaults = { siteName: 'NavHub', slogan: '个人导航站 - 博客、游戏、工具、友链' };
  const { results: configRows } = await c.env.DB.prepare(
    `SELECT key, value FROM site_config WHERE key IN ('siteName', 'slogan')`
  ).all();
  const config = { ...defaults };
  for (const row of configRows as { key: string; value: string }[]) {
    if (row.value) config[row.key as 'siteName' | 'slogan'] = row.value;
  }

  const items = (results as any[]).map((row) => {
    const link = `${siteUrl}/blog/${row.slug}/`;
    const pubDate = new Date(row.date).toUTCString();
    const title = esc(row.title);
    const bodyText = toPlainText(row.body ?? '', 500);
    const description = esc(row.summary && row.summary.trim() ? `${row.summary} ${bodyText}` : bodyText);
    return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
    </item>`;
  }).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(config.siteName)}</title>
    <link>${siteUrl}/</link>
    <description>${esc(config.slogan)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${c.req.url}" rel="self" type="application/rss+xml"/>
    <generator>my-blog-feed</generator>
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