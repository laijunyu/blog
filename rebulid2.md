根据搜索结果，我发现了一个重要的优化点：**Hono 框架**（14KB，TypeScript 原生，Cloudflare 官方推荐）比手写路由更合适。同时确认了 Cloudflare 官方支持 Monorepo 部署（Pages 和 Workers 都可以指定 Root Directory）。

以下是完整的可执行 MD 文件：

---

```markdown
# 📋 后端开发执行文档：Cloudflare Workers + D1 + R2 + Hono

> **项目代号**：my-blog-api  
> **版本**：v1.0  
> **创建日期**：2026-08-08  
> **前置条件**：前端（Astro）已完成并部署在 Cloudflare Pages  
> **本文档目标**：搭建完整后端 API + 管理界面，Agent 可逐步执行  
> **预计工期**：6 天

---

## 一、技术栈总览

| 层级 | 技术 | 版本/说明 |
|------|------|-----------|
| 运行时 | Cloudflare Workers | V8 Isolate，全球边缘 |
| 语言 | TypeScript | 5.x |
| Web 框架 | **Hono** | ^4.x，14KB，Cloudflare 官方推荐，TypeScript 原生 |
| 数据库 | Cloudflare D1 | SQLite，通过 wrangler.toml 绑定 |
| 文件存储 | Cloudflare R2 | 通过 wrangler.toml 绑定 |
| 认证 | HMAC-SHA256 Token | Web Crypto API，零依赖 |
| 部署 | GitHub → Cloudflare Workers | 自动部署，无需本地 Wrangler CLI |
| 前端管理界面 | Astro 隐藏路由 `/admin/*` | 集成在现有 web/ 项目中 |
| Markdown 编辑器 | **Milkdown** | 插件驱动，所见即所得，类 Typora 体验 |
| 包管理 | npm | 前后端统一 |

### 为什么选 Hono 而不是手写路由？

- Hono 作者 Yusuke Wada 在 Cloudflare 工作，框架与 Workers 天然兼容
- 14KB 核心，402,820 次/秒路由匹配
- 内置中间件系统（CORS、Bearer Auth、Logger 等开箱即用）
- TypeScript 强类型，环境变量类型推导
- 支持 `app.get()` / `app.post()` 等 Express 风格 API
- 参考项目：[ZYG-h5game](https://github.com/zunyuange/ZYG-h5game)（Workers + Hono + D1 全栈实战）

---

## 二、Monorepo 目录结构

```
my-blog/                          ← GitHub 仓库根目录（已创建）
│
├── web/                          ← 前端（Astro，已有代码）
│   ├── astro.config.mjs
│   ├── package.json
│   ├── tsconfig.json
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   │   ├── index.astro
│   │   │   ├── posts/[slug].astro
│   │   │   ├── games/index.astro
│   │   │   ├── tools/index.astro
│   │   │   ├── links/index.astro
│   │   │   └── admin/              ← 🆕 管理界面（本阶段新增）
│   │   │       ├── index.astro      ← 仪表盘
│   │   │       ├── login.astro      ← 登录页
│   │   │       ├── posts/
│   │   │       │   ├── index.astro  ← 文章列表
│   │   │       │   └── edit.astro   ← 文章编辑器
│   │   │       ├── games/index.astro
│   │   │       ├── tools/index.astro
│   │   │       ├── links/index.astro
│   │   │       └── media/index.astro
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── ...
│
├── api/                          ← 后端（Cloudflare Workers，本阶段新建）
│   ├── wrangler.toml             ← Workers 配置（D1/R2 绑定）
│   ├── package.json
│   ├── tsconfig.json
│   ├── schema.sql                ← D1 建表语句
│   ├── src/
│   │   ├── index.ts              ← 入口：Hono app 实例 + 路由挂载
│   │   ├── routes/
│   │   │   ├── posts.ts          ← /api/posts CRUD
│   │   │   ├── games.ts          ← /api/games CRUD
│   │   │   ├── tools.ts          ← /api/tools CRUD
│   │   │   ├── links.ts          ← /api/links CRUD
│   │   │   ├── site.ts           ← /api/site-meta
│   │   │   ├── tags.ts           ← /api/tags
│   │   │   ├── upload.ts         ← /api/upload（R2 写入）
│   │   │   └── auth.ts           ← /api/auth/login
│   │   ├── middleware/
│   │   │   └── auth.ts           ← Bearer Token 验证中间件
│   │   └── utils/
│   │       ├── response.ts       ← 统一响应格式
│   │       └── token.ts          ← HMAC-SHA256 Token 生成/验证
│   └── types/
│       └── env.d.ts              ← WorkerEnv 类型声明
│
├── .gitignore                    ← 仓库级
└── README.md
```

---

## 三、安全规范（⚠️ 必须遵守）

### 3.1 绝对禁止硬编码的内容

```typescript
// ❌ 以下写法绝对不允许出现在任何代码文件中：
const password = "admin123";
const secret = "my-secret-key";
const dbUrl = "sqlite://xxx";
const apiKey = "cf_xxxxx";

// ✅ 正确写法：全部通过 env 读取
const password = env.ADMIN_PASSWORD;
const secret = env.TOKEN_SECRET;
```

### 3.2 Secrets 配置位置

所有敏感信息 **只在 Cloudflare Dashboard 中配置**：

路径：`Cloudflare Dashboard → Workers & Pages → [你的Worker] → Settings → Variables and Secrets`

| 变量名 | 类型 | 说明 |
|--------|------|------|
| `ADMIN_USERNAME` | **Secret** 🔒 | 管理员用户名 |
| `ADMIN_PASSWORD` | **Secret** 🔒 | 管理员密码（强密码，≥16位） |
| `TOKEN_SECRET` | **Secret** 🔒 | HMAC 签名密钥（随机 64 位字符串） |

> 🔒 Secret 类型：加密存储，Dashboard 中不可查看明文，代码中通过 `env.XXX` 读取。

### 3.3 非敏感环境变量（Plain Text）

| 变量名 | 类型 | 示例值 |
|--------|------|--------|
| `PUBLIC_CDN_URL` | Plain text | `https://cdn.yoursite.com` |
| `FRONTEND_ORIGIN` | Plain text | `https://myblog.pages.dev` |

### 3.4 .gitignore（仓库根目录）

```gitignore
# Dependencies
node_modules/

# Build outputs
dist/
.astro/

# Environment files（绝对不能提交）
.env
.env.*
.dev.vars

# Cloudflare local cache
.wrangler/

# Logs
*.log

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
```

---

## 四、Day 1 — 后端骨架搭建

### 4.1 初始化 api/ 项目

在仓库根目录执行：

```bash
mkdir api
cd api
npm init -y
npm install hono
npm install -D typescript @cloudflare/workers-types wrangler
```

### 4.2 wrangler.toml

```toml
name = "my-blog-api"
main = "src/index.ts"
compatibility_date = "2025-06-01"

# D1 数据库绑定

binding = "DB"
database_name = "my-blog-db"
database_id = "<在Dashboard创建D1后填入>"

# R2 存储绑定

binding = "BUCKET"
bucket_name = "my-blog-cdn"

# 非敏感环境变量（也可在 Dashboard 中设置）
[vars]
PUBLIC_CDN_URL = "https://cdn.yoursite.com"
FRONTEND_ORIGIN = "https://myblog.pages.dev"
```

> ⚠️ `database_id` 在 Dashboard 创建 D1 数据库后自动生成，复制填入。

### 4.3 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src/**/*.ts", "types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 4.4 types/env.d.ts — WorkerEnv 类型声明

```typescript
interface Env {
  // D1 数据库绑定
  DB: D1Database;
  // R2 存储绑定
  BUCKET: R2Bucket;
  // Secrets（Dashboard 中配置）
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
  TOKEN_SECRET: string;
  // Plain text 环境变量
  PUBLIC_CDN_URL: string;
  FRONTEND_ORIGIN: string;
}
```

### 4.5 schema.sql — D1 建表语句

```sql
-- ============================================
-- my-blog D1 Database Schema
-- 执行方式：Dashboard → D1 → Console → 粘贴执行
-- ============================================

-- 博客文章表
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  tags TEXT DEFAULT '[]',
  summary TEXT DEFAULT '',
  body TEXT DEFAULT '',
  cover_image TEXT DEFAULT '',
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 游戏表
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  icon TEXT DEFAULT '🎮',
  description TEXT DEFAULT '',
  src TEXT NOT NULL,
  tags TEXT DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 工具表
CREATE TABLE IF NOT EXISTS tools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  icon TEXT DEFAULT '🔧',
  description TEXT DEFAULT '',
  url TEXT NOT NULL,
  tags TEXT DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 友链表
CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  avatar TEXT DEFAULT '',
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 站点配置表
CREATE TABLE IF NOT EXISTS site_config (
  key TEXT PRIMARY KEY,
  value TEXT DEFAULT ''
);

-- 初始站点配置
INSERT OR IGNORE INTO site_config (key, value) VALUES
  ('siteName', 'My Blog'),
  ('slogan', '记录生活与代码'),
  ('author', 'Admin');

-- 索引
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(date DESC);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_games_sort ON games(sort_order);
CREATE INDEX IF NOT EXISTS idx_tools_sort ON tools(sort_order);
CREATE INDEX IF NOT EXISTS idx_links_sort ON links(sort_order);
```

### 4.6 src/utils/response.ts — 统一响应

```typescript
// 统一响应格式
export function success(data: unknown, message = 'ok') {
  return new Response(JSON.stringify({ code: 0, data, message }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export function error(code: number, message: string, status = 400) {
  return new Response(JSON.stringify({ code, data: null, message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// 错误码约定
export const ErrorCode = {
  SUCCESS: 0,
  BAD_REQUEST: 40001,
  UNAUTHORIZED: 40101,
  NOT_FOUND: 40401,
  INTERNAL_ERROR: 50001,
  UPLOAD_FAILED: 50002,
} as const;
```

### 4.7 src/utils/token.ts — HMAC-SHA256 Token

```typescript
// 使用 Web Crypto API 生成/验证 Token，零依赖
// 参考：https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/sign

const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24小时

async function getKey(secret: string): Promise {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function generateToken(secret: string): Promise {
  const payload = {
    exp: Date.now() + TOKEN_EXPIRY,
    iat: Date.now(),
  };
  const payloadStr = btoa(JSON.stringify(payload));
  const key = await getKey(secret);
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payloadStr)
  );
  const sigStr = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${payloadStr}.${sigStr}`;
}

export async function verifyToken(token: string, secret: string): Promise {
  try {
    const [payloadStr, sigStr] = token.split('.');
    if (!payloadStr || !sigStr) return false;

    const payload = JSON.parse(atob(payloadStr));
    if (payload.exp < Date.now()) return false;

    const key = await getKey(secret);
    const encoder = new TextEncoder();
    const sigBytes = Uint8Array.from(atob(sigStr), c => c.charCodeAt(0));

    return crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      encoder.encode(payloadStr)
    );
  } catch {
    return false;
  }
}
```

### 4.8 src/middleware/auth.ts — 认证中间件

```typescript
import { Context, Next } from 'hono';
import { verifyToken } from '../utils/token';
import { error, ErrorCode } from '../utils/response';

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(ErrorCode.UNAUTHORIZED, '缺少认证信息', 401);
  }

  const token = authHeader.slice(7);
  const valid = await verifyToken(token, c.env.TOKEN_SECRET);

  if (!valid) {
    return error(ErrorCode.UNAUTHORIZED, 'Token 无效或已过期', 401);
  }

  await next();
}
```

### 4.9 src/index.ts — 入口文件

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { postsRouter } from './routes/posts';
import { gamesRouter } from './routes/games';
import { toolsRouter } from './routes/tools';
import { linksRouter } from './routes/links';
import { siteRouter } from './routes/site';
import { tagsRouter } from './routes/tags';
import { uploadRouter } from './routes/upload';
import { authRouter } from './routes/auth';

const app = new Hono<{ Bindings: Env }>();

// 全局中间件
app.use('*', logger());
app.use('/api/*', cors({
  origin: (origin, c) => {
    // 允许前端域名和 localhost 开发
    const allowed = [c.env.FRONTEND_ORIGIN, 'http://localhost:4321'];
    return allowed.includes(origin) ? origin : '';
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

// 健康检查
app.get('/', (c) => c.json({ status: 'ok', timestamp: Date.now() }));

// 公开路由（无需认证）
app.route('/api/auth', authRouter);
app.route('/api/posts', postsRouter);
app.route('/api/games', gamesRouter);
app.route('/api/tools', toolsRouter);
app.route('/api/links', linksRouter);
app.route('/api/site-meta', siteRouter);
app.route('/api/tags', tagsRouter);

// 需要认证的路由
app.route('/api/upload', uploadRouter);

// 404 处理
app.notFound((c) => c.json({ code: 40401, data: null, message: 'Not Found' }, 404));

// 错误处理
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ code: 50001, data: null, message: 'Internal Server Error' }, 500);
});

export default app;
```

### 4.10 src/routes/auth.ts — 登录

```typescript
import { Hono } from 'hono';
import { generateToken } from '../utils/token';
import { success, error, ErrorCode } from '../utils/response';

export const authRouter = new Hono<{ Bindings: Env }>();

authRouter.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json<{
      username: string;
      password: string;
    }>();

    if (!username || !password) {
      return error(ErrorCode.BAD_REQUEST, '用户名和密码不能为空');
    }

    if (username !== c.env.ADMIN_USERNAME || password !== c.env.ADMIN_PASSWORD) {
      return error(ErrorCode.UNAUTHORIZED, '用户名或密码错误', 401);
    }

    const token = await generateToken(c.env.TOKEN_SECRET);
    return success({ token, expiresIn: 86400 });
  } catch {
    return error(ErrorCode.BAD_REQUEST, '请求格式错误');
  }
});
```

### 4.11 src/routes/posts.ts — 文章 CRUD

```typescript
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
```

### 4.12 src/routes/games.ts — 游戏 CRUD

```typescript
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
```

### 4.13 src/routes/tools.ts — 工具 CRUD

```typescript
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
```

### 4.14 src/routes/links.ts — 友链 CRUD

```typescript
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
```

### 4.15 src/routes/site.ts — 站点元信息

```typescript
import { Hono } from 'hono';
import { success } from '../utils/response';

export const siteRouter = new Hono<{ Bindings: Env }>();

siteRouter.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(`SELECT key, value FROM site_config`).all();
  const config: Record = {};
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
```

### 4.16 src/routes/tags.ts — 标签聚合

```typescript
import { Hono } from 'hono';
import { success } from '../utils/response';

export const tagsRouter = new Hono<{ Bindings: Env }>();

tagsRouter.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT tags FROM posts WHERE status = 'published'`
  ).all();

  const tagMap: Record = {};
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
```

### 4.17 src/routes/upload.ts — 文件上传到 R2

```typescript
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { success, error, ErrorCode } from '../utils/response';

export const uploadRouter = new Hono<{ Bindings: Env }>();

// POST /api/upload — 上传文件（需认证）
uploadRouter.post('/', authMiddleware, async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file') as File | null;
  const folder = (formData.get('folder') as string) || 'images';

  if (!file) {
    return error(ErrorCode.BAD_REQUEST, '缺少 file 字段');
  }

  // 限制文件大小（10MB）
  if (file.size > 10 * 1024 * 1024) {
    return error(ErrorCode.BAD_REQUEST, '文件大小不能超过 10MB');
  }

  // 允许的文件类型
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'text/html', 'application/zip',
  ];
  if (!allowedTypes.includes(file.type)) {
    return error(ErrorCode.BAD_REQUEST, `不支持的文件类型: ${file.type}`);
  }

  // 生成唯一文件名
  const ext = file.name.split('.').pop() || 'bin';
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).slice(2, 8);
  const key = `${folder}/${timestamp}-${randomStr}.${ext}`;

  // 写入 R2
  await c.env.BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const publicUrl = `${c.env.PUBLIC_CDN_URL}/${key}`;
  return success({ url: publicUrl, key }, '上传成功');
});

// GET /api/upload/list — 列出文件（需认证）
uploadRouter.get('/list', authMiddleware, async (c) => {
  const prefix = c.req.query('prefix') || '';
  const listed = await c.env.BUCKET.list({ prefix, limit: 100 });

  const files = listed.objects.map(obj => ({
    key: obj.key,
    size: obj.size,
    uploaded: obj.uploaded,
    url: `${c.env.PUBLIC_CDN_URL}/${obj.key}`,
  }));

  return success(files);
});

// DELETE /api/upload — 删除文件（需认证）
uploadRouter.delete('/', authMiddleware, async (c) => {
  const { key } = await c.req.json<{ key: string }>();
  if (!key) {
    return error(ErrorCode.BAD_REQUEST, '缺少 key 参数');
  }
  await c.env.BUCKET.delete(key);
  return success(null, '删除成功');
});
```

### 4.18 package.json（api/）

```json
{
  "name": "my-blog-api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "types": "tsc --noEmit"
  },
  "dependencies": {
    "hono": "^4.8.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20250601.0",
    "typescript": "^5.5.0",
    "wrangler": "^4.0.0"
  }
}
```

---

## 五、Day 2 — Cloudflare Dashboard 配置

### 5.1 创建 D1 数据库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 左侧菜单 → **Workers & Pages** → **D1** → **Create database**
3. 名称填 `my-blog-db`，位置选 `Automatic`
4. 创建完成后复制 **Database ID**
5. 将 ID 填入 `api/wrangler.toml` 的 `database_id` 字段
6. 点击 **Console** 标签 → 粘贴 `schema.sql` 全部内容 → 点击 **Execute**

### 5.2 创建 R2 Bucket

1. 左侧菜单 → **R2 Object Storage** → **Create bucket**
2. 名称填 `my-blog-cdn`，位置选 `Automatic`
3. （后续）绑定自定义域名 `cdn.yoursite.com`：
   - Bucket → Settings → Custom Domains → Connect Domain
   - 输入 `cdn.yoursite.com` → 确认

### 5.3 创建 Worker 并连接 GitHub

1. 左侧菜单 → **Workers & Pages** → **Create** → **Create Worker**
2. 名称填 `my-blog-api`
3. 点击 **Connect to Git** → 选择你的 GitHub 仓库 `my-blog`
4. 配置：
   - **Root directory**: `api`
   - **Build command**: `npx wrangler deploy`
   - **Production branch**: `main`
5. 点击 **Save and Deploy**

### 5.4 配置 Secrets

Worker → Settings → Variables and Secrets → Add variable：

| 操作 | 变量名 | 类型 | 值 |
|------|--------|------|-----|
| Add | `ADMIN_USERNAME` | Secret | 你设定的用户名 |
| Add | `ADMIN_PASSWORD` | Secret | 你设定的强密码 |
| Add | `TOKEN_SECRET` | Secret | 随机64位字符串（用 `openssl rand -hex 32` 生成） |

### 5.5 验证部署

部署成功后，访问：
```
https://my-blog-api..workers.dev/
```

应返回：
```json
{"status":"ok","timestamp":1723046400000}
```

### 5.6 前端环境变量更新

Cloudflare Pages → 前端项目 → Settings → Environment variables：

| 变量名 | 值 |
|--------|-----|
| `PUBLIC_API_BASE_URL` | `https://my-blog-api.<your-subdomain>.workers.dev` |

重新触发部署。

---

## 六、Day 3 — 数据填充

### 6.1 迁移现有数据到 D1

在 D1 Console 中执行 INSERT 语句，将现有 MDX 文章和 YAML 数据导入。

示例（根据你的实际数据调整）：

```sql
-- 示例：导入一篇文章
INSERT INTO posts (slug, title, date, tags, summary, body, status) VALUES (
  'my-first-post',
  '我的第一篇文章',
  '2026-01-15',
  '["生活","随笔"]',
  '这是摘要...',
  '# 标题\n\n这是正文内容...',
  'published'
);

-- 示例：导入游戏
INSERT INTO games (title, icon, description, src, tags, sort_order) VALUES (
  '贪吃蛇',
  '🐍',
  '经典贪吃蛇游戏',
  'https://cdn.yoursite.com/games/snake/index.html',
  '["经典","休闲"]',
  1
);
```

### 6.2 上传游戏文件到 R2

通过 Dashboard → R2 → `my-blog-cdn` → Upload objects：
- 创建 `games/snake/` 文件夹
- 上传 `index.html`

或通过管理界面的上传接口（Day 3 完成后可用）。

### 6.3 验证前端渲染

访问前端各页面，确认数据正确显示。

---

## 七、Day 4-5 — 管理界面（集成到 Astro）

### 7.1 安装 Milkdown 编辑器

在 `web/` 目录：

```bash
cd web
npm install @milkdown/core @milkdown/preset-commonmark @milkdown/preset-gfm @milkdown/theme-nord @milkdown/plugin-listener @milkdown/react
```

### 7.2 管理界面页面结构

所有管理页面放在 `web/src/pages/admin/` 下。

#### 登录页 `web/src/pages/admin/login.astro`

```astro
---
// 纯 HTML 壳子，客户端 JS 处理逻辑
---



  

  
    const API_BASE = import.meta.env.PUBLIC_API_BASE_URL;

    async function handleLogin() {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        
        if (data.code === 0) {
          localStorage.setItem('admin_token', data.data.token);
          window.location.href = '/admin/';
        } else {
          document.getElementById('error').textContent = data.message;
          document.getElementById('error').style.display = 'block';
        }
      } catch (e) {
        document.getElementById('error').textContent = '网络错误';
        document.getElementById('error').style.display = 'block';
      }
    }
  


```

#### 仪表盘 `web/src/pages/admin/index.astro`

显示各分区计数、最近文章列表、快捷操作入口。

#### 文章编辑器 `web/src/pages/admin/posts/edit.astro`

集成 Milkdown 编辑器，支持：
- 所见即所得 Markdown 编辑
- 图片上传（调用 `/api/upload`，自动插入 Markdown 图片链接）
- 标签管理
- 封面图上传
- 发布/草稿切换
- 保存

### 7.3 管理界面鉴权逻辑

```javascript
// 每个管理页面加载时检查 Token
const token = localStorage.getItem('admin_token');
if (!token) {
  window.location.href = '/admin/login';
}

// API 调用时携带 Token
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
};
```

### 7.4 管理界面功能清单

| 页面 | 路径 | 核心功能 |
|------|------|---------|
| 登录 | `/admin/login` | 用户名密码登录 |
| 仪表盘 | `/admin/` | 计数概览 + 最近文章 |
| 文章列表 | `/admin/posts/` | 搜索 + 状态筛选 + 编辑/删除 |
| 文章编辑 | `/admin/posts/edit?id=x` | Milkdown 编辑器 + 图片上传 + 发布 |
| 游戏管理 | `/admin/games/` | 列表 + CRUD + 文件上传 |
| 工具管理 | `/admin/tools/` | 列表 + CRUD |
| 友链管理 | `/admin/links/` | 列表 + CRUD |
| 媒体库 | `/admin/media/` | R2 文件列表 + 上传 + 复制URL + 删除 |

---

## 八、Day 6 — 联调与完善

### 8.1 测试清单

- [ ] 前端首页能正确显示文章列表
- [ ] 文章详情页能渲染 Markdown
- [ ] 游戏页面 iframe 能加载 R2 中的游戏
- [ ] 搜索功能返回正确结果
- [ ] 管理后台登录/登出正常
- [ ] 文章创建/编辑/删除/发布正常
- [ ] 图片上传后能在编辑器中插入
- [ ] 游戏文件上传后能通过 CDN URL 访问
- [ ] Token 过期后自动跳转登录页
- [ ] CORS 配置正确，无跨域报错

### 8.2 性能优化（可选）

- D1 查询结果缓存（Workers Cache API）
- 图片压缩（上传时转 WebP）
- 文章列表只返回摘要，不返回 body

---

## 九、API 接口速查表

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/posts` | ❌ | 文章列表，支持 `?q=搜索&tag=标签` |
| GET | `/api/posts/:slug` | ❌ | 单篇文章详情 |
| POST | `/api/posts` | ✅ | 创建文章 |
| PUT | `/api/posts/:id` | ✅ | 更新文章 |
| DELETE | `/api/posts/:id` | ✅ | 删除文章 |
| GET | `/api/games` | ❌ | 游戏列表 |
| POST | `/api/games` | ✅ | 创建游戏 |
| PUT | `/api/games/:id` | ✅ | 更新游戏 |
| DELETE | `/api/games/:id` | ✅ | 删除游戏 |
| GET | `/api/tools` | ❌ | 工具列表 |
| POST | `/api/tools` | ✅ | 创建工具 |
| PUT | `/api/tools/:id` | ✅ | 更新工具 |
| DELETE | `/api/tools/:id` | ✅ | 删除工具 |
| GET | `/api/links` | ❌ | 友链列表 |
| POST | `/api/links` | ✅ | 创建友链 |
| PUT | `/api/links/:id` | ✅ | 更新友链 |
| DELETE | `/api/links/:id` | ✅ | 删除友链 |
| GET | `/api/site-meta` | ❌ | 站点配置 + 计数 |
| GET | `/api/tags` | ❌ | 标签聚合 |
| POST | `/api/auth/login` | ❌ | 登录获取 Token |
| POST | `/api/upload` | ✅ | 上传文件到 R2 |
| GET | `/api/upload/list` | ✅ | 列出 R2 文件 |
| DELETE | `/api/upload` | ✅ | 删除 R2 文件 |

---

## 十、Cloudflare Dashboard 配置汇总

| 配置项 | 位置 | 值 |
|--------|------|-----|
| D1 数据库名 | D1 → Create | `my-blog-db` |
| R2 Bucket 名 | R2 → Create | `my-blog-cdn` |
| Worker 名 | Workers → Create | `my-blog-api` |
| GitHub 连接 | Worker → Settings → Git | 仓库 `my-blog`，Root: `api` |
| ADMIN_USERNAME | Worker → Variables → Secret | 你设定 |
| ADMIN_PASSWORD | Worker → Variables → Secret | 你设定 |
| TOKEN_SECRET | Worker → Variables → Secret | 随机64位 |
| PUBLIC_CDN_URL | Worker → Variables → Plain | `https://cdn.yoursite.com` |
| FRONTEND_ORIGIN | Worker → Variables → Plain | `https://myblog.pages.dev` |
| 前端 API 地址 | Pages → Env vars | `PUBLIC_API_BASE_URL` = Worker URL |

---

## 十一、常见问题排查

| 问题 | 原因 | 解决 |
|------|------|------|
| Worker 部署失败 | wrangler.toml 中 database_id 错误 | 重新从 D1 Dashboard 复制 |
| CORS 报错 | FRONTEND_ORIGIN 不匹配 | 检查环境变量中的域名 |
| 401 Unauthorized | Token 过期或未携带 | 重新登录获取 Token |
| D1 查询报错 | 表未创建 | 在 D1 Console 执行 schema.sql |
| R2 上传 403 | BUCKET 绑定名不匹配 | 检查 wrangler.toml 中 binding 名 |
| 前端拿不到数据 | PUBLIC_API_BASE_URL 未设置 | Pages 环境变量中添加 |

---

## 十二、后续扩展（不在本期范围）

- [ ] SQLite FTS5 全文搜索（文章 > 200 篇时升级）
- [ ] 文章版本历史
- [ ] 评论系统
- [ ] RSS 生成
- [ ] 访问统计
- [ ] 图片自动压缩 + WebP 转换
- [ ] 管理界面暗色模式

---

## 附录：参考资源

| 资源 | 链接 |
|------|------|
| Hono 官方文档 | https://hono.dev |
| Cloudflare D1 文档 | https://developers.cloudflare.com/d1/ |
| Cloudflare R2 文档 | https://developers.cloudflare.com/r2/ |
| Workers TypeScript 配置 | https://developers.cloudflare.com/workers/languages/typescript/ |
| Milkdown 编辑器 | https://milkdown.dev |
| Web Crypto API HMAC | https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/sign |
| Cloudflare Monorepo 支持 | https://blog.cloudflare.com/pages-workers-integrations-monorepos-nextjs-wrangler |
| Workers + Hono + D1 实战参考 | https://github.com/zunyuange/ZYG-h5game |

---

> **文档结束。按 Day 1 → Day 6 顺序执行即可。**
```

---

以上就是完整的后端 + 管理界面执行文档。核心变更点总结：

1. **引入 Hono 框架**替代手写路由（搜索确认为 Cloudflare 官方推荐方案，14KB，TypeScript 原生）
2. **Milkdown 编辑器**用于管理后台写作（插件驱动，所见即所得，类 Typora）
3. **所有代码零硬编码敏感数据**，Secrets 全部通过 Dashboard 注入
4. **Monorepo 结构**，Cloudflare 官方支持 Root Directory 配置