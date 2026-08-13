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
  views INTEGER NOT NULL DEFAULT 0,
  pinned INTEGER NOT NULL DEFAULT 0,
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
