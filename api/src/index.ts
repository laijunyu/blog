import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { postsRouter } from './routes/posts';
import { gamesRouter } from './routes/games';
import { toolsRouter } from './routes/tools';
import { linksRouter } from './routes/links';
import { siteRouter, aboutRouter } from './routes/site';
import { tagsRouter } from './routes/tags';
import { uploadRouter } from './routes/upload';
import { authRouter } from './routes/auth';
import { feedRouter } from './routes/feed';

const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', logger());
app.use('/api/*', cors({
  origin: (origin, c) => {
    // Allow frontend domain (from env, with http fallback) and localhost
    const frontend = c.env.FRONTEND_ORIGIN;
    const allowed = [
      frontend,
      frontend ? frontend.replace(/^https:\/\//i, 'http://') : undefined,
      'http://localhost:4321',
    ].filter(Boolean) as string[];
    return allowed.includes(origin) ? origin : '';
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

// Health check
app.get('/', (c) => c.json({ status: 'ok', timestamp: Date.now() }));

// Public routes
app.route('/api/auth', authRouter);
app.route('/api/posts', postsRouter);
app.route('/api/games', gamesRouter);
app.route('/api/tools', toolsRouter);
app.route('/api/links', linksRouter);
app.route('/api/site-meta', siteRouter);
app.route('/api/about', aboutRouter);
app.route('/api/tags', tagsRouter);

// Authenticated route
app.route('/feed.xml', feedRouter);
app.route('/api/upload', uploadRouter);

// 404 handling — 非 API 路径先尝试静态资产（后台 admin.html），未命中再返回 JSON
app.notFound(async (c) => {
  const url = new URL(c.req.url);
  if (!url.pathname.startsWith('/api/') && url.pathname !== '/feed.xml') {
    try {
      const res = await c.env.ASSETS.fetch(c.req.raw);
      if (res && res.status < 500) return res;
    } catch {
      // ignore
    }
  }
  return c.json({ code: 40401, data: null, message: 'Not Found' }, 404);
});

// Error handling
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ code: 50001, data: null, message: 'Internal Server Error' }, 500);
});

export default app;
