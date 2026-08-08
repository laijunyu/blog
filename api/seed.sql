-- Sample seed data for My Blog API
-- Insert a demo post
INSERT INTO posts (slug, title, date, tags, summary, body, status) VALUES (
  'my-first-post',
  '我的第一篇文章',
  '2026-01-15',
  '["生活","随笔"]',
  '这是摘要...',
  '# 标题\n\n这是正文内容...',
  'published'
);

-- Insert a demo game
INSERT INTO games (title, icon, description, src, tags, sort_order) VALUES (
  '贪吃蛇',
  '🐍',
  '经典贪吃蛇游戏',
  'https://cdn.yoursite.com/games/snake/index.html',
  '["经典","休闲"]',
  1
);
