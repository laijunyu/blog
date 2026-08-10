import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { success, error, ErrorCode } from '../utils/response';

export const siteRouter = new Hono<{ Bindings: Env }>();

const DEFAULT_CONFIG: Record<string, string> = {
  siteName: 'NavHub',
  slogan: '个人导航站 - 博客、游戏、工具、友链',
  author: '',
  avatar: '',
  aboutTitle: '你好，我是',
  aboutSubtitle: '全栈开发者 / 终身学习者',
  aboutBio: '热爱技术和开源，喜欢捣鼓各种有趣的项目。',
  skills: 'Astro, TypeScript, Tailwind CSS',
  socials: '[]',
};

const ALLOWED_KEYS = new Set(Object.keys(DEFAULT_CONFIG));

async function loadConfig(c: { env: Env }): Promise<Record<string, string>> {
  const config: Record<string, string> = { ...DEFAULT_CONFIG };
  const { results } = await c.env.DB.prepare(`SELECT key, value FROM site_config`).all();
  for (const row of results as { key: string; value: string }[]) {
    config[row.key] = row.value;
  }
  return config;
}

// GET /api/site-meta — 站点元信息 + 各分区计数（公开）
siteRouter.get('/', async (c) => {
  const config = await loadConfig(c);

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

// GET /api/about — 关于页站点设置（公开）
export const aboutRouter = new Hono<{ Bindings: Env }>();

aboutRouter.get('/', async (c) => {
  const config = await loadConfig(c);
  let socials: unknown[] = [];
  try {
    socials = JSON.parse(config.socials || '[]');
  } catch {
    socials = [];
  }
  return success({
    siteName: config.siteName,
    avatar: config.avatar,
    aboutTitle: config.aboutTitle,
    aboutSubtitle: config.aboutSubtitle,
    aboutBio: config.aboutBio,
    skills: (config.skills || '').split(',').map((s) => s.trim()).filter(Boolean),
    socials,
  });
});

// PUT /api/admin — 更新站点设置（需认证，白名单 upsert）
siteRouter.put('/admin', authMiddleware, async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const entries = Object.entries(body).filter(([key, value]) => {
    if (!ALLOWED_KEYS.has(key)) return false;
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value) !== undefined;
      } catch {
        return false;
      }
    }
    return typeof value === 'string' || typeof value === 'number';
  });

  if (entries.length === 0) {
    return error(ErrorCode.BAD_REQUEST, '没有可更新的合法字段');
  }

  for (const [key, value] of entries) {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    await c.env.DB.prepare(
      `INSERT INTO site_config (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    ).bind(key, str).run();
  }

  return success(null, '更新成功');
});

export default siteRouter;
