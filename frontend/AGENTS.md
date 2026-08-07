# AGENTS.md

## 项目概述

NavHub 是一个个人导航站项目，两级页面结构（首页入口 → 内容页）。聚合博客文章、在线小游戏、实用工具和友情链接四大模块。

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Astro | ^7.2.0 |
| 样式 | Tailwind CSS | ^4.3.3 (Vite 插件) |
| 内容 | MDX (Content Collections) | ^7.0.5 |
| 数据 | YAML (js-yaml) | ^5.2.3 |
| 语言 | TypeScript (strict) | - |
| 运行时 | Node.js | >=22.12.0 |

## 目录结构

```
my-nav-site/
├── public/                      # 静态资源，直接映射到站点根路径
│   ├── favicon.ico
│   ├── favicon.svg
│   └── games/                   # (Day 4) 游戏 HTML 文件 (public/games/xxx/index.html)
├── src/
│   ├── components/              # 可复用 Astro 组件
│   │   ├── SectionCard.astro    # 首页大分区卡片
│   │   ├── ThemeToggle.astro    # 暗色模式切换按钮
│   │   ├── BlogCard.astro       # 博客文章卡片
│   │   ├── BlogSearch.astro     # 博客搜索组件 (客户端 JS)
│   │   ├── GameCard.astro       # 游戏选择卡片
│   │   ├── GamePlayer.astro     # iframe 游戏播放器
│   │   ├── ToolCard.astro       # 工具卡片
│   │   └── LinkCard.astro       # 友链卡片
│   ├── content/                 # Content Collections
│   │   └── blog/                # (Day 2) MDX 文章 (slug = 文件名)
│   ├── content.config.ts        # (Day 2) 博客 schema (defineCollection + Zod + glob loader) *Astro 7 路径*
│   ├── data/                    # YAML 数据文件
│   │   ├── games.yml            # 游戏列表
│   │   ├── tools.yml            # 工具列表
│   │   └── links.yml            # 友链列表
│   ├── layouts/
│   │   └── BaseLayout.astro     # 全局布局 (HTML5 + Header/Nav/Footer/SEO)
│   ├── pages/                   # 基于文件路径的路由
│   │   ├── index.astro          # 首页 (Hero + 4 分区卡片)
│   │   ├── blog/
│   │   │   ├── index.astro      # 博客列表 + 搜索
│   │   │   └── [slug].astro     # 博客详情动态路由
│   │   ├── games/
│   │   │   └── index.astro      # 游戏列表 + 播放器
│   │   ├── tools/
│   │   │   └── index.astro      # 工具列表
│   │   ├── links/
│   │   │   └── index.astro      # 友链列表
│   │   └── about/
│   │       └── index.astro      # 关于页
│   ├── styles/
│   │   └── global.css           # Tailwind v4 入口 (@import + @plugin typography)
│   └── env.d.ts                 # ?raw 导入类型声明
├── astro.config.mjs             # Astro 配置 (vite tailwindcss + mdx)
├── content.config.ts            # (根目录) Content Collection 配置文件 *Astro 7 约定*
├── tsconfig.json                # TypeScript 严格模式
├── package.json
└── todo.md                      # (项目根目录) 8 天开发计划 TOMD
```

## 编码规范

### Astro 组件

- 使用 `.astro` 单文件组件，不加 React/Vue 等 UI 框架
- Props 通过 `export interface Props { ... }` 声明类型
- 模板中的 Props 通过 `Astro.props` 解构获取
- 全局样式在 `BaseLayout.astro` 的 frontmatter 中导入 `../styles/global.css`
- 客户端脚本写组件内的 `<script>` 标签（不含 `client:*` 指令）
- 需要防闪烁的逻辑用 `is:inline`（见 BaseLayout 中的暗色初始化脚本）

### Tailwind CSS v4

- 无需 `tailwind.config.mjs`，在 `global.css` 中使用 `@import "tailwindcss"` 和 `@plugin "@tailwindcss/typography"`
- 暗色模式通过 `dark:` 前缀 + `class` 策略实现（BaseLayout 中的 `is:inline` 脚本在 `<html>` 上设置 `dark` class）
- 主题色/自定义颜色通过 `@theme` 块配置
- 响应式使用 Tailwind 断点类：`sm:`(640px)、`md:`(768px)、`lg:`(1024px)

### 数据模式

- 博客文章：MDX 文件 + Content Collection (`src/content/blog/xxx.mdx`)，frontmatter 用 Zod schema
- Content Collection 配置在根目录 `content.config.ts`（Astro 7 不再使用 `src/content/config.ts`），需通过 `glob({ pattern: '**/*.mdx', base: './src/content/blog' })` 定义 loader
- 文章详情页用 `import { render } from 'astro:content'` 替代已废弃的 `post.render()`
- 静态列表数据 (游戏/工具/友链)：YAML 文件 (`src/data/xxx.yml`)，通过 Vite `?raw` import + `js-yaml.load()` 加载（不需 fs/readFileSync）
- 搜索数据：通过 `<script define:vars>` 注入到 `window` 全局变量供客户端使用
- 暗色模式状态：通过 `localStorage.getItem('theme')` + `prefers-color-scheme` 初始化，toggle 按钮 `dark` 切换 class

### 命名约定

- 组件文件：PascalCase (e.g. `SectionCard.astro`, `BaseLayout.astro`)
- 页面路由：按 Astro 文件约定，index.astro 对应目录根路径，`[slug].astro` 表示动态参数
- CSS 类名：纯 Tailwind 工具类，不写自定义 class
- 变量/常量：camelCase

### TypeScript

- `tsconfig.json` 扩展 `astro/tsconfigs/strict`
- 选择 Zod 而不是手动类型断言来验证数据结构
- 不在 .astro frontmatter 中使用相对路径导入（eds `import` 始终相对于项目根）

### 可访问性与 SEO

- 所有页面使用 `BaseLayout` 包裹提供统一的 title/description/OG 标签
- 所有链接都有 `aria-label` 或可见的文本标签
- 外链添加 `target="_blank" rel="noopener noreferrer`
- 图片添加 `alt` 属性 (如果是友链头像等动态内容)

## Git 提交规范

采用中文描述 + 简洁的格式，提交信息结构：

```
<type>: 版本号 -- 接地气描述

- key change 1
- key change 2
```

- Current branches: `main` (已提交 Day 1), `dev` (当前工作分支)
- 日常开发工作在 `dev` 分支进行，Day 完成后合并回 `main`

## 当前进度

- [x] Day 1: 项目初始化 + 全局布局 + 首页
- [x] Day 2: 博客系统 (Content Collection + BlogCard + 列表页)
- [x] Day 3: 博客搜索功能 + 文章详情页
- [x] Day 4: 游戏页 (YAML 数据 + GameCard + GamePlayer + 列表页)
- [x] Day 5: 工具页 + 友链页 + 关于页
- [x] Day 6: 视觉打磨 + 响应式 + SEO (OG 图片/favicon/响应式适配)
- [x] Day 7: 全站构建验证通过 (10 页面零报错)
- [ ] Day 8: 部署上线 (待配置)

详细 TODD 清单见项目根目录 `todo.md`。

## Agent 核心规则

1. **遵循现有代码风格** - 所有成员/组件都按照已有模式编写(Props 接口、frontmatter 导入、Tailwind 工具类)
2. **不引入新的依赖** - 除非 TODD.md 明确要求，否则不要安装任何新 npm 包
3. **每一天的工作完成后执行 `npm run build`** - 确保零报错零警告
4. **修改前先阅读已有代码** - 特别理解 BaseLayout, ThemeToggle, SectionCard 的接口和样式约定
5. **不要关闭失败的 dev server** - 使用 `npx astro dev stop` 正常退出
6. **不要执行 git 操作** - 除非用户显式要求提交
7. **当用户说"继续做下一步/Day N"时** - 自动定位 `todo.md` 中对应 Day 的内容，按条目逐项执行
8. **Tailwind v4 注意事项**：无 `tailwind.config.mjs`；typography 用 `@plugin` 引入；自定义颜色用 `@theme {}` 块
9. **Astro 7 适配要点**：
   - Content Collection 配置在根目录 `src/content.config.ts`（非 `src/content/config.ts`）
   - 必须定义 `loader`（用 `glob({ pattern, base })` 从 `astro/loaders` 导入）
   - 文章渲染用 `import { render } from 'astro:content'`（`post.render()` 已废弃）
   - YAML 数据用 Vite `?raw` import + `js-yaml.load()` 加载，避免运行时 fs 路径问题
10. **判断已完成 vs 未完成功能** - 每次任务结束后做验证：`npm run build` + 检查关键HTML输出

### 目录创建规则

开始新的 Day 任务时，按照目录结构说明创建尚未存在的文件夹和文件。先检查存在性，再创建。