rebuild-web.md

指令类型：前端重构执行规范  
执行者：AI Coding Agent / 开发者  
目标：将 Astro 静态站点从"构建时读取本地文件"重构为"运行时客户端 fetch 后端 API"架构，并部署至 Cloudflare Pages。后端未就绪时，页面显示骨架屏 + 加载失败状态，不白屏、不报错。  
约束：仅修改前端代码，不涉及后端开发。  
日期：2026-08-07

架构变更说明

1.1 变更前

数据源：本地 MDX 文件（src/content/blog/）+ 本地 YAML 文件（src/data/）
渲染方式：Astro 构建时读取文件 → 生成包含完整数据的静态 HTML
游戏资源：存放在 public/games/ 目录
依赖：@astrojs/mdx、js-yaml

1.2 变更后

数据源：后端 RESTful API（Cloudflare Workers），当前阶段不可用
渲染方式：Astro 构建时仅生成页面壳子（布局 + 骨架屏占位）→ 浏览器端 JS 调用 API → 动态渲染内容
游戏资源：未来由 Cloudflare R2 托管，当前阶段 src 字段为空或占位
依赖：移除 @astrojs/mdx、js-yaml，新增 marked
环境变量：通过 PUBLIC_API_BASE_URL 控制 API 地址，留空时跳过请求直接返回 null

1.3 预期行为（后端未就绪时）
页面区域   表现
Header / Footer / 导航栏   正常渲染（纯静态 HTML）

首页 Hero 区域   正常渲染（纯静态 HTML）

首页分区卡片   卡片结构正常，统计数字显示 "···" 或兜底文案

博客列表页   骨架屏 → 加载失败提示 + 重试按钮

博客详情页   骨架屏 → "文章不存在或加载失败" + 返回链接

游戏 / 工具 / 友链页   骨架屏 → 加载失败提示 + 重试按钮

关于页   正常渲染（纯静态 HTML，不依赖 API）

暗色模式切换   正常工作

浏览器 Console   无红色错误，仅有 console.warn（预期行为）

Network 面板   无 API 请求发出（因 PUBLIC_API_BASE_URL 为空）

执行步骤

2.1 清理旧依赖与旧文件

卸载依赖包 @astrojs/mdx 和 js-yaml
打开 astro.config.mjs，从 integrations 数组中移除 mdx() 引用，仅保留 tailwind()
删除目录 src/content/（含所有 MDX 文件及 config.ts）
删除目录 src/data/（含 games.yml、tools.yml、links.yml）
删除目录 public/games/
此时运行 npm run dev 预期会报错（页面仍引用已删除文件），属正常现象，后续步骤修复

2.2 安装新依赖与环境变量配置

安装依赖包 marked
在项目根目录创建 .env 文件，内容为：
      PUBLIC_API_BASE_URL=
   
   值留空，表示后端不可用
创建 .env.example 文件，内容为：
      # 后端 API 根地址，留空则使用 Mock 数据或显示加载失败
   PUBLIC_API_BASE_URL=
   
   此文件需提交至 Git
确认 .gitignore 中包含 .env

2.3 创建 TypeScript 类型定义

创建文件 src/types/index.ts，定义以下接口：

ApiResponse<T>：字段 code (number)、data (T)、message (string)
PostItem：字段 slug (string)、title (string)、date (string)、tags (string[])、summary (string)
PostDetail：继承 PostItem 全部字段，新增 body (string)
GameItem：字段 id (string)、title (string)、icon (string)、description (string)、src (string)、tags (string[])
ToolItem：字段 title (string)、icon (string)、description (string)、url (string)、tags (string[])
LinkItem：字段 name (string)、url (string)、avatar (string)、description (string)
SiteMeta：字段 siteName (string)、slogan (string)、postCount (number)、gameCount (number)、toolCount (number)、linkCount (number)

2.4 创建 Mock 数据文件（占位）

在 src/mocks/ 目录下创建以下文件，全部导出空数据：

posts.ts：导出空数组 [] as PostItem[]
games.ts：导出空数组 [] as GameItem[]
tools.ts：导出空数组 [] as ToolItem[]
links.ts：导出空数组 [] as LinkItem[]
site.ts：导出对象 { siteName: '你的站名', slogan: '', postCount: 0, gameCount: 0, toolCount: 0, linkCount: 0 } as SiteMeta

当前阶段 Mock 数据为空，仅建立文件结构供后续填充。

2.5 创建 Service 层

2.5.1 通用请求客户端

创建文件 src/services/client.ts，导出异步函数 fetchApi<T>(path: string): Promise<T | null>，逻辑如下：

读取 import.meta.env.PUBLIC_API_BASE_URL
若该值为空字符串或 undefined，直接返回 null
拼接完整 URL：baseUrl + path
创建 AbortController，设置 5000ms 超时
发起 fetch 请求，携带 signal
响应状态非 200 → console.warn 并返回 null
解析 JSON，提取 data 字段返回
任何异常（网络错误、超时、JSON 解析失败）→ console.warn 并返回 null

关键原则：函数永远不抛出异常，永远返回 T 或 null。

2.5.2 各模块 Service

创建以下文件，每个文件导出对应的 fetch 函数：

src/services/posts.ts
  fetchAllPosts(): Promise<PostItem[]> → 调用 fetchApi('/api/posts')，null 时返回 []
  fetchPostBySlug(slug: string): Promise<PostDetail | null> → 调用 fetchApi('/api/posts/' + slug)
src/services/games.ts
  fetchAllGames(): Promise<GameItem[]> → 同上模式
src/services/tools.ts
  fetchAllTools(): Promise<ToolItem[]> → 同上模式
src/services/links.ts
  fetchAllLinks(): Promise<LinkItem[]> → 同上模式
src/services/site.ts
  fetchSiteMeta(): Promise<SiteMeta | null> → 同上模式

2.6 创建 UI 状态组件

2.6.1 骨架屏组件

创建文件 src/components/Skeleton.astro：

Props：count (number, 默认 6)、type (string, 可选值 'card' | 'detail')
渲染：循环 count 次输出灰色圆角矩形 div
样式：Tailwind class animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg
type='card' 时高度约 160px，模拟卡片形状
type='detail' 时输出标题骨架 + 多行正文骨架

2.6.2 错误状态组件

创建文件 src/components/ErrorState.astro：

Props：message (string, 默认 '加载失败')
渲染：居中容器 + ⚠️ 图标 + message 文案 + 重试按钮
重试按钮 id 为 retry-btn，由页面 JS 绑定 click 事件
样式：灰色文字，按钮带边框和 hover 效果

2.6.3 空状态组件

创建文件 src/components/EmptyState.astro：

Props：message (string, 默认 '暂无数据')
渲染：居中容器 + 📭 图标 + message 文案

2.7 改造页面

2.7.1 博客列表页 src/pages/blog/index.astro

删除 frontmatter 中所有 getCollection、本地数据读取、排序、tags 提取、JSON 序列化逻辑
frontmatter 仅保留：import BaseLayout、Skeleton、ErrorState、EmptyState
页面 HTML 结构重写为：
   BaseLayout 包裹，title="博客"
   h1 标题 "博客" + span#post-count（初始文本 "加载中..."）
   input#search-input（placeholder="搜索标题或标签"）+ div#tag-bar（初始为空）+ p#search-count（初始为空）
   div#post-grid（grid 布局 class），内部放置 <Skeleton count={6} type="card" />
页面底部 <script> 逻辑：
   定义闭包变量 allPosts = []
   定义 loadPosts 异步函数：调用 fetchAllPosts()
   返回空数组 → post-grid innerHTML 替换为 EmptyState HTML
   返回 null → post-grid innerHTML 替换为 ErrorState HTML，给 retry-btn 绑定 click 重新调用 loadPosts
   有数据 → 遍历拼接卡片 HTML 替换 post-grid，更新 post-count 文案，提取 tags 渲染到 tag-bar
   绑定 search-input input 事件和 tag 点击事件（筛选逻辑不变，数据来源改为闭包变量 allPosts）
   脚本末尾调用 loadPosts()

2.7.2 博客详情页

删除 src/pages/blog/[slug].astro
新建 src/pages/blog/[...slug].astro（catch-all 路由）
frontmatter：import BaseLayout、Skeleton、ErrorState
页面 HTML：
   BaseLayout 包裹，title="文章"
   面包屑：首页 > 博客 > 加载中...
   div#article-container，内部放置 <Skeleton type="detail" />
<script> 逻辑：
   从 window.location.pathname 提取 slug（去除 /blog/ 前缀和末尾斜杠）
   调用 fetchPostBySlug(slug)
   返回 null → 替换容器为 "文章不存在或加载失败" + 返回博客列表链接
   返回数据 → 渲染标题、日期、tags，调用 marked.parse(body) 渲染正文，正文外层加 prose dark:prose-invert max-w-none
   更新 document.title 为文章标题
script 顶部 import { marked } from 'marked'

2.7.3 游戏页 src/pages/games/index.astro

删除 frontmatter 中 fs.readFileSync、js-yaml、yaml.load 相关代码
页面 HTML：标题 + span#game-count（初始 "加载中..."）+ div#game-grid（内含 <Skeleton count={3} type="card" />）+ div#game-player（初始 hidden，含标题 span + 关闭按钮 + iframe）
<script>：调用 fetchAllGames() → null 时 ErrorState + 重试 → 空数组时 EmptyState → 有数据时渲染卡片并绑定 playGame/closeGame 事件（逻辑与之前一致）

2.7.4 工具页 src/pages/tools/index.astro

同游戏页模式：删除 yml 读取 → 壳子 + 骨架屏 → script fetch → 渲染卡片。外链加 target="_blank" rel="noopener"。

2.7.5 友链页 src/pages/links/index.astro

同工具页模式。头像 img 加 loading="lazy"，onerror 替换为默认头像。

2.7.6 首页 src/pages/index.astro

Hero 区域不动
4 个 SectionCard 的 stat 属性初始传 "···"
给每个 stat 元素加 id：stat-blog、stat-games、stat-tools、stat-links
<script>：调用 fetchSiteMeta() → 成功时更新各 stat 文本 → 失败时将 "···" 改为 "探索 →"

2.7.7 关于页

无需修改（纯静态内容）。

2.8 SEO 保底与收尾

打开 src/layouts/BaseLayout.astro，确认 <head> 中包含以下静态 meta（由 Props 传入，不依赖 JS）：
   <title>
   <meta name="description">
   <meta property="og:title"> / og:description / og:image / og:url
   <meta name="twitter:card" content="summary_large_image">
在 <body> 最顶部添加 <noscript> 标签，内容为："本站需要启用 JavaScript 才能加载内容。" 及各分区纯文本链接
创建 public/robots.txt：
      User-agent: *
   Allow: /
   Sitemap: https://yoursite.com/sitemap.xml
   
   将 yoursite.com 替换为实际域名
创建 public/sitemap.xml，仅包含固定页面 URL：首页、/blog/、/games/、/tools/、/links/、/about/

本地验证清单

在执行推送前，逐项确认：

[ ] npm run dev 启动无报错
[ ] 首页：Header/Footer/Hero/分区卡片正常，stat 显示 "···" 或 "探索 →"，暗色切换正常
[ ] /blog/：骨架屏闪现 → 变为 "加载失败 + 重试按钮"，点击重试再次失败，不白屏
[ ] /blog/test-slug/：骨架屏 → "文章不存在或加载失败" + 返回链接
[ ] /games/、/tools/、/links/：骨架屏 → 加载失败
[ ] /about/：正常显示
[ ] DevTools Console 无红色错误（console.warn 为预期行为）
[ ] DevTools Network 无 API 请求发出
[ ] 右键查看源代码，meta 标签和 noscript 存在
[ ] 移动端视口 375px 布局正常
[ ] npm run build 构建成功
[ ] npm run preview 构建产物验证通过

Git 推送

确认 .gitignore 包含 node_modules/、dist/、.astro/、.env
执行 git status，确认 .env 不在变更列表中
执行 git add .
执行 git commit -m "refactor: 前后端分离，改为客户端 fetch 架构"
若未关联远程仓库：在 GitHub 新建仓库（不勾选 README/gitignore/license），执行 git remote add origin <仓库URL>
执行 git push -u origin main

Cloudflare Pages 部署

登录 Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git
选择 GitHub 仓库
构建设置：
   Project name：my-nav-site
   Production branch：main
   Framework preset：Astro
   Build command：npm run build
   Build output directory：dist
环境变量：添加 PUBLIC_API_BASE_URL，值留空
点击 Save and Deploy
等待构建完成，获取预览 URL（格式 https://my-nav-site.pages.dev）
打开预览 URL 验证效果（同第 3 节验证清单）

后端上线后的切换操作（备忘）

当 Workers API 部署完成后：

Cloudflare Dashboard → Pages → 项目 → Settings → Environment variables
将 PUBLIC_API_BASE_URL 值改为 Workers 地址（如 https://api.yoursite.com）
触发重新部署（推送空 commit 或手动 Retry）
无需修改任何前端代码

文件变更清单

新增
路径   用途
src/types/index.ts   TypeScript 类型定义

src/services/client.ts   通用 fetch 封装

src/services/posts.ts   博客 API 调用

src/services/games.ts   游戏 API 调用

src/services/tools.ts   工具 API 调用

src/services/links.ts   友链 API 调用

src/services/site.ts   站点元信息 API 调用

src/mocks/posts.ts   Mock 数据（空）

src/mocks/games.ts   Mock 数据（空）

src/mocks/tools.ts   Mock 数据（空）

src/mocks/links.ts   Mock 数据（空）

src/mocks/site.ts   Mock 数据（空）

src/components/Skeleton.astro   骨架屏组件

src/components/ErrorState.astro   加载失败组件

src/components/EmptyState.astro   空数据组件

src/utils/format.ts   日期格式化工具

src/utils/markdown.ts   Markdown 渲染工具

.env   环境变量（不提交）

.env.example   环境变量模板（提交）

public/robots.txt   爬虫规则

public/sitemap.xml   站点地图

修改
路径   改动
astro.config.mjs   移除 mdx 插件

package.json   移除 @astrojs/mdx、js-yaml，新增 marked

src/layouts/BaseLayout.astro   添加 noscript，确认 meta 完整

src/pages/index.astro   stat 改为动态加载

src/pages/blog/index.astro   重写为客户端 fetch

src/pages/games/index.astro   重写为客户端 fetch

src/pages/tools/index.astro   重写为客户端 fetch

src/pages/links/index.astro   重写为客户端 fetch

删除
路径   原因
src/content/   不再使用 Content Collection

src/data/   不再读取本地 YAML

public/games/   游戏文件改由 R2 托管

src/pages/blog/[slug].astro   被 [...slug].astro 替代

异常排查
现象   原因   解决方案
构建报错找不到 getCollection   页面仍引用已删除的 content 目录   确认所有页面已改为 service 调用

构建报错找不到 js-yaml   页面仍 import js-yaml   删除相关 import

页面白屏   script 中存在未捕获异常   检查 Console，确保 fetchApi 永不 throw

骨架屏持续显示不变为错误状态   fetchApi 未正确处理超时   检查 AbortController 超时逻辑

环境变量读取不到   变量名缺少 PUBLIC_ 前缀   确认为 PUBLIC_API_BASE_URL

Cloudflare Pages 构建失败   构建命令或输出目录配置错误   确认为 npm run build 和 dist

线上环境变量修改后未生效   未触发重新部署   推送空 commit 或手动 Retry

暗色模式下骨架屏颜色异常   Skeleton 组件缺少 dark: 样式   添加 dark:bg-gray-700