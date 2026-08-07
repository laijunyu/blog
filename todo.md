# 📋 个人导航站项目 TODO（详细步骤版）

> **技术栈**：Astro 5 + Tailwind CSS 4 + MDX  
> **结构**：两级（首页入口 → 内容页）  
> **预计工期**：8 天  
> **最后更新**：2026-08-07  

---

## Day 1：项目初始化 + 全局布局 + 首页

### 1.1 创建 Astro 项目

- [ ] 打开终端，进入你存放项目的父目录
- [ ] 执行 `npm create astro@latest my-nav-site`
- [ ] 交互式提示中选择 **Empty** 模板（不要选博客/文档模板，避免引入多余文件）
- [ ] 选择 **Yes** 安装依赖
- [ ] 选择 **Yes** 初始化 Git 仓库
- [ ] 等待脚手架生成完毕，确认终端无报错
- [ ] 用编辑器打开 `my-nav-site` 文件夹，浏览生成的文件结构，确认包含 `astro.config.mjs`、`package.json`、`src/` 目录

### 1.2 安装并配置 Tailwind CSS

- [ ] 在项目根目录终端执行 `npx astro add tailwind`
- [ ] 提示是否创建 `tailwind.config.mjs` 时选 **Yes**
- [ ] 提示是否创建 `src/styles/global.css` 时选 **Yes**
- [ ] 提示是否修改 `astro.config.mjs` 时选 **Yes**
- [ ] 打开 `astro.config.mjs`，确认 `integrations` 数组中包含 `tailwind()`
- [ ] 打开 `tailwind.config.mjs`，在 `darkMode` 字段中设置为 `'class'`（这是暗色模式切换的前提）
- [ ] 打开 `src/styles/global.css`，确认已包含 Tailwind 的三条指令（`@tailwind base/components/utilities` 或 v4 等效写法）

### 1.3 安装额外依赖

- [ ] 执行 `npm install js-yaml`（用于读取 YAML 数据文件）
- [ ] 执行 `npx astro add mdx`（用于支持 MDX 博客文章）
- [ ] 确认 `astro.config.mjs` 的 `integrations` 中同时出现 `tailwind()` 和 `mdx()`
- [ ] 执行 `npm run dev` 验证项目能正常启动，浏览器访问 `localhost:4321` 看到默认页面后停止服务

### 1.4 编写全局布局 BaseLayout

- [ ] 在 `src/layouts/` 目录下新建 `BaseLayout.astro`
- [ ] 定义 Props 接口，包含 `title`（必填）和 `description`（可选，带默认值）两个字段
- [ ] 编写完整的 HTML5 文档结构（doctype、html、head、body）
- [ ] `<head>` 中设置 charset、viewport、title、meta description、favicon、OG 标签（og:title / og:description / og:image）
- [ ] `<body>` 上添加 `min-h-screen` 确保短页面也能撑满屏幕，添加背景色和文字色的亮/暗双套 class
- [ ] 编写 Header 区域：使用 sticky 定位 + backdrop-blur 毛玻璃效果，内部用 flex 布局放置 Logo（链接到 `/`）和导航链接（博客/游戏/工具/友链/关于），右侧预留暗色切换按钮位置
- [ ] 编写 Main 区域：设置 max-width 居中 + 水平 padding + 垂直 padding，使用 `<slot />` 接收子页面内容
- [ ] 编写 Footer 区域：顶部边框分隔，居中显示版权信息、RSS 链接、GitHub 链接
- [ ] 保存文件，确认无语法错误

### 1.5 编写暗色切换组件 ThemeToggle

- [ ] 在 `src/components/` 目录下新建 `ThemeToggle.astro`
- [ ] 编写一个 button 元素，包含月亮和太阳两个图标 span，通过 `dark:hidden` / `hidden dark:inline` 控制显隐
- [ ] 在 `<script>` 标签中编写客户端逻辑：
  - 获取 html 元素引用
  - 读取 localStorage 中的 theme 值，若存在则据此设置 dark class
  - 若不存在，检测系统偏好 `prefers-color-scheme: dark`，匹配则添加 dark class
  - 给按钮绑定 click 事件：切换 dark class，并将新状态写入 localStorage
- [ ] 回到 BaseLayout，import 该组件并放在 Header 导航区域末尾，添加 `client:load` 指令使其在客户端激活

### 1.6 编写首页大分区卡片 SectionCard

- [ ] 在 `src/components/` 目录下新建 `SectionCard.astro`
- [ ] 定义 Props 接口：icon（emoji）、title、description、stat（统计文案）、url（跳转地址）、accent（主题色，带默认值）
- [ ] 编写一个 `<a>` 标签包裹整个卡片，href 指向 url
- [ ] 卡片样式：圆角、边框、白色背景（暗色适配）、内边距、hover 时上浮 + 阴影动画
- [ ] 通过 CSS 变量 `--accent` 传入主题色，标题 hover 时使用该颜色
- [ ] 内部依次排列：大号 emoji 图标、标题、描述文案、统计信息 + 箭头指示

### 1.7 编写首页 index.astro

- [ ] 在 `src/pages/` 目录下新建 `index.astro`
- [ ] import BaseLayout 和 SectionCard
- [ ] 用 BaseLayout 包裹，传入 title
- [ ] 编写 Hero 区域：居中大标题 + Slogan 副标题
- [ ] 编写分区入口网格：使用 CSS Grid，移动端单列、sm 断点双列，gap 间距
- [ ] 放置 4 个 SectionCard，分别对应博客（蓝色）、游戏（绿色）、工具（橙色）、友链（紫色），每个填入对应的 icon、标题、描述、统计数据、跳转 URL
- [ ] 保存并运行 `npm run dev`

### 1.8 Day 1 验证清单

- [ ] 首页正常渲染，4 个大卡片排列正确
- [ ] 点击暗色切换按钮，整站颜色切换，刷新后保持
- [ ] Header 导航链接指向正确路径（此时点击会 404，属正常）
- [ ] Footer 显示正常
- [ ] 移动端宽度下卡片变为单列
- [ ] 控制台无报错

---

## Day 2：博客系统（数据模型 + 文章列表页）

### 2.1 配置 Content Collection 数据模型

- [ ] 在 `src/content/` 目录下新建 `config.ts`
- [ ] 从 `astro:content` 导入 `defineCollection` 和 `z`（Zod）
- [ ] 定义 blog 集合的 schema，包含以下字段及类型约束：
  - `title`：string，必填
  - `date`：coerce.date()，自动将字符串转为 Date 对象
  - `tags`：string 数组
  - `summary`：string，设默认空字符串
  - `draft`：boolean，设默认 false
- [ ] 导出 collections 对象，注册 blog 集合
- [ ] 保存文件，确认 TypeScript 无类型错误

### 2.2 编写测试文章

- [ ] 在 `src/content/blog/` 目录下新建第一篇 MDX 文件（文件名即 slug，如 `hello-world.mdx`）
- [ ] 在文件顶部用 `---` 包裹 frontmatter，填写 title、date、tags、summary
- [ ] 在 frontmatter 下方写 Markdown 正文，包含至少一个二级标题和一段正文
- [ ] 再创建 2-3 篇测试文章，确保：
  - 日期各不相同
  - tags 有重叠也有独立项（用于后续测试搜索）
  - 其中一篇设置 `draft: true`（用于测试草稿过滤）
- [ ] 保存所有文件

### 2.3 编写博客文章卡片 BlogCard

- [ ] 在 `src/components/` 目录下新建 `BlogCard.astro`
- [ ] 定义 Props：title、url、date（Date 类型）、summary、tags（string[]）
- [ ] 将 date 格式化为 YYYY-MM-DD 字符串
- [ ] 编写 `<a>` 标签包裹卡片，样式与 SectionCard 类似但更紧凑
- [ ] 标题限制最多显示 2 行（line-clamp-2）
- [ ] 摘要同样限制 2 行
- [ ] tags 区域用 flex-wrap 排列小圆角标签，使用蓝色系配色
- [ ] 底部显示日期

### 2.4 编写博客列表页

- [ ] 在 `src/pages/blog/` 目录下新建 `index.astro`
- [ ] 从 `astro:content` 导入 `getCollection`
- [ ] 调用 `getCollection('blog', filter)` 获取所有文章，filter 函数排除 draft 为 true 的文章
- [ ] 对结果按 date 降序排序
- [ ] 提取所有不重复的 tags，排序后存入 allTags 变量
- [ ] 将文章数据序列化为 JSON 字符串（只保留前端搜索需要的字段：title/url/date/summary/tags），存入 postsJSON 变量
- [ ] import BaseLayout 和 BlogCard
- [ ] 页面顶部显示标题和文章总数
- [ ] 预留搜索区域占位 div（id 为 `blog-search-area`，Day 3 填充）
- [ ] 用 CSS Grid 渲染文章卡片列表（1/2/3 列响应式）
- [ ] 在页面底部用 `<script define:vars>` 将 postsJSON 和 allTags 注入到 window 全局变量，供客户端搜索脚本使用

### 2.5 Day 2 验证清单

- [ ] 访问 `/blog/`，文章卡片按日期倒序排列
- [ ] draft 文章不显示
- [ ] 每张卡片的标题、摘要、标签、日期均正确
- [ ] 标签颜色和小圆角样式正常
- [ ] 移动端单列、桌面端三列
- [ ] 控制台无报错，window.__BLOG_POSTS__ 和 window.__ALL_TAGS__ 有值

---

## Day 3：博客搜索功能 + 文章详情页

### 3.1 编写搜索组件 BlogSearch

- [ ] 在 `src/components/` 目录下新建 `BlogSearch.astro`
- [ ] 编写搜索输入框：全宽、圆角、边框、focus 时蓝色 ring，placeholder 提示"搜索标题或标签"
- [ ] 编写 Tag 筛选栏容器 div（id 为 `blog-tag-bar`），内容由 JS 动态生成
- [ ] 编写搜索结果计数段落（id 为 `blog-search-count`）
- [ ] 在 `<script>` 中实现完整搜索逻辑，分四个函数：
  - **renderTagBar()**：清空容器，生成"全部"按钮和各 tag 按钮；activeTags 为空时"全部"高亮，否则对应 tag 按钮高亮；每个按钮绑定 click 事件，点击后 toggle 该 tag 到 activeTags Set 中，然后调用 filter()
  - **filter()**：读取输入框 query，遍历 posts 数组，同时满足文本匹配（标题或 tags 包含 query）和标签匹配（activeTags 为空或文章 tags 与 activeTags 有交集）的文章进入 filtered 数组；调用 renderCards(filtered)、renderTagBar()、更新计数文案
  - **renderCards(list)**：用模板字符串拼接卡片 HTML，替换 grid 容器的 innerHTML；卡片结构与 BlogCard.astro 保持一致
  - **事件绑定**：input 监听 input 事件触发 filter()
- [ ] 脚本末尾调用 renderTagBar() 和初始计数显示完成初始化

### 3.2 集成搜索组件到博客列表页

- [ ] 回到 `src/pages/blog/index.astro`
- [ ] import BlogSearch 组件
- [ ] 将之前的搜索区占位 div 替换为 `<BlogSearch />`
- [ ] 保存并刷新页面

### 3.3 编写文章详情页

- [ ] 在 `src/pages/blog/` 目录下新建 `[slug].astro`（方括号表示动态路由）
- [ ] 导出 `getStaticPaths` 异步函数：调用 getCollection 获取所有文章，map 为 `{ params: { slug }, props: { post } }` 数组返回
- [ ] 从 Astro.props 解构出 post
- [ ] 调用 `post.render()` 获取 Content 组件
- [ ] import BaseLayout，传入 post.data.title 作为页面标题
- [ ] 编写面包屑导航：首页 > 博客 > 当前文章标题，前两项为链接
- [ ] 编写 header 区域：大标题 + 日期 + tags 链接列表
- [ ] 用 `<Content />` 渲染 MDX 正文，外层包裹 prose 类（Tailwind Typography 排版）
- [ ] 底部添加"返回博客列表"链接

### 3.4 安装并配置 Tailwind Typography

- [ ] 执行 `npm install @tailwindcss/typography`
- [ ] 在 `tailwind.config.mjs` 的 plugins 数组中添加 typography 插件
- [ ] 重启 dev server 使配置生效

### 3.5 Day 3 验证清单

- [ ] 搜索框输入关键词，文章列表实时过滤
- [ ] 输入不存在的关键词，显示"0 / N 篇"
- [ ] 清空搜索框，恢复全部文章
- [ ] 点击某个 Tag 按钮，只显示含该 tag 的文章，按钮高亮
- [ ] 再次点击同一 Tag 按钮，取消筛选
- [ ] 同时选中多个 Tag，取并集过滤
- [ ] 搜索 + Tag 组合筛选正常工作
- [ ] 点击文章卡片进入详情页，正文排版正常（标题层级、代码块、列表等）
- [ ] 详情页面包屑链接可点击跳转
- [ ] 详情页 tags 点击可跳回博客列表并自动筛选（可选增强）
- [ ] 暗色模式下搜索和详情页样式正常

---

## Day 4：游戏页（选择列表 + iframe 内嵌游玩）

### 4.1 准备游戏数据文件

- [ ] 在 `src/data/` 目录下新建 `games.yml`
- [ ] 按约定结构填写每个游戏的 id、title、icon（emoji）、description、src（iframe 地址）、tags
- [ ] 先填 3 个测试条目，src 指向 `/games/xxx/index.html`
- [ ] 保存文件

### 4.2 准备测试游戏静态文件

- [ ] 在 `public/games/` 下为每个游戏创建独立目录
- [ ] 每个目录中放置 `index.html`，内容为该游戏的最小可运行版本（可以是占位页面，写明游戏名称即可）
- [ ] 确认这些 HTML 文件是独立的（不依赖外部 CDN 或父页面资源），因为将通过 iframe sandbox 加载
- [ ] 在浏览器中直接访问 `localhost:4321/games/snake/index.html` 确认能打开

### 4.3 编写游戏选择卡片 GameCard

- [ ] 在 `src/components/` 目录下新建 `GameCard.astro`
- [ ] 定义 Props：id、title、icon、description、src、tags
- [ ] 编写卡片容器 div，添加 `game-card` class 和 data-src / data-title 属性（供 JS 读取）
- [ ] 绑定 onclick 事件调用全局函数 `playGame(this)`
- [ ] 内部排列：emoji 图标、标题、描述、tags 标签（绿色系）、"▶ 开始玩"按钮
- [ ] 按钮设置 `pointer-events-none` 防止双重触发（由父 div 的 onclick 统一处理）

### 4.4 编写游戏播放器 GamePlayer

- [ ] 在 `src/components/` 目录下新建 `GamePlayer.astro`
- [ ] 编写外层容器 div（id 为 `game-player`），初始 hidden
- [ ] 内部上方：标题显示区 + 关闭按钮
- [ ] 内部下方：aspect-video 比例的黑色圆角容器，内嵌 iframe（id 为 `game-frame`），设置 sandbox 属性允许 scripts / same-origin / pointer-lock
- [ ] 在 `<script>` 中实现：
  - **playGame(card)** 函数：从 card 的 dataset 读取 src 和 title，设置 iframe.src，更新标题，移除 hidden，scrollIntoView 平滑滚动到播放器，给当前卡片添加高亮 ring，移除其他卡片的高亮
  - **关闭按钮** click 事件：清空 iframe.src（停止游戏运行），添加 hidden，移除所有卡片高亮
  - 将 playGame 挂载到 window 全局对象
- [ ] 注意：iframe src 设为空字符串而非 removeAttribute，确保游戏进程真正终止

### 4.5 编写游戏列表页

- [ ] 在 `src/pages/games/` 目录下新建 `index.astro`
- [ ] 用 Node.js fs 模块同步读取 `src/data/games.yml`
- [ ] 用 js-yaml 解析为 JS 对象
- [ ] import BaseLayout、GameCard、GamePlayer
- [ ] 页面顶部显示标题和游戏总数
- [ ] 用 CSS Grid 渲染 GameCard 列表
- [ ] 在列表下方放置 `<GamePlayer />`

### 4.6 Day 4 验证清单

- [ ] 访问 `/games/`，游戏卡片正确显示
- [ ] 点击任意游戏卡片，下方展开 iframe 并加载对应游戏
- [ ] 页面平滑滚动到播放器区域
- [ ] 被选中的卡片有绿色高亮边框
- [ ] 点击另一个游戏卡片，iframe 内容切换，高亮转移
- [ ] 点击关闭按钮，iframe 收起，高亮清除
- [ ] 关闭后再点同一个游戏，能重新加载
- [ ] 游戏内的交互（点击/键盘）不被 iframe sandbox 阻止
- [ ] 暗色模式下样式正常

---

## Day 5：工具页 + 友链页 + 关于页

### 5.1 工具页

- [ ] 在 `src/data/` 下新建 `tools.yml`，按结构填写工具条目（title/icon/description/url/tags）
- [ ] 在 `src/components/` 下新建 `ToolCard.astro`，结构与 BlogCard 类似，字段替换为工具的 icon/title/description/url，外链加 target="_blank" rel="noopener"
- [ ] 在 `src/pages/tools/` 下新建 `index.astro`，读取 yml 数据，用 Grid 渲染 ToolCard 列表
- [ ] 用 BaseLayout 包裹，传入标题

### 5.2 友链页

- [ ] 在 `src/data/` 下新建 `links.yml`，每条包含 name/url/avatar/description
- [ ] 在 `src/components/` 下新建 `LinkCard.astro`，采用横向布局：左侧圆形头像 + 右侧名称和描述，整体为外链
- [ ] 头像 img 标签添加 loading="lazy" 和 alt 属性
- [ ] 在 `src/pages/links/` 下新建 `index.astro`，读取 yml 渲染 LinkCard 网格
- [ ] 可在页面底部添加"申请友链"说明和联系方式

### 5.3 关于页

- [ ] 在 `src/pages/about/` 下新建 `index.astro`
- [ ] 用 BaseLayout 包裹
- [ ] 编写自我介绍内容：头像、昵称、职业/身份、一段话介绍
- [ ] 列出技能标签或技术栈
- [ ] 放置社交链接（GitHub / Twitter / Email 等）
- [ ] 可直接用 HTML/Tailwind 编写，也可改用 MDX 以获得更好的排版

### 5.4 全站联通验证

- [ ] 首页 4 个大卡片分别跳转到对应二级页
- [ ] Header 导航所有链接可达
- [ ] 各二级页面包屑或返回链接可回到首页/上级
- [ ] 所有页面 Footer 一致
- [ ] 无死链（可用 `npm run build` 检查构建是否报错）

---

## Day 6：视觉打磨 + 响应式 + SEO

### 6.1 分区配色确认

- [ ] 逐一检查首页 4 个 SectionCard 的 accent 色值是否正确传入
- [ ] 检查博客页标签、游戏页标签、工具页标签各自使用了区分度足够的配色
- [ ] 暗色模式下各颜色对比度足够（可用浏览器 DevTools 的 Contrast Checker）

### 6.2 微交互动效

- [ ] 确认所有可点击卡片有 hover 上浮 + 阴影过渡
- [ ] 确认按钮有 hover 颜色变化
- [ ] 确认暗色切换有平滑过渡（transition-colors）
- [ ] 如需页面切换动画，查阅 Astro 5 View Transitions 文档，在 BaseLayout 中启用

### 6.3 移动端全面适配

- [ ] 用 Chrome DevTools 切换到 iPhone SE（375px）视口
- [ ] 检查首页卡片是否为单列且间距合理
- [ ] 检查博客搜索框是否全宽且不溢出
- [ ] 检查 Tag 按钮栏是否自动换行
- [ ] 检查游戏 iframe 是否保持比例且不超出屏幕
- [ ] 检查 Header 导航在窄屏下是否溢出，若溢出则实现汉堡菜单或横向滚动
- [ ] 检查 Footer 文字不换行错乱
- [ ] 在真实手机上访问 localhost（或用 ngrok）做最终确认

### 6.4 SEO 与元信息

- [ ] 制作 favicon.svg 放入 public/
- [ ] 制作 OG 图片（1200×630）放入 public/og-image.png
- [ ] 逐页检查 `<title>` 是否唯一且有意义
- [ ] 逐页检查 meta description 是否准确
- [ ] 确认所有外链有 rel="noopener"
- [ ] 确认图片都有 alt 属性
- [ ] 运行 `npm run build`，检查是否有 missing alt / broken link 警告

---

## Day 7：内容填充 + 全面测试 + 性能优化

### 7.1 填充真实内容

- [ ] 将所有测试文章替换/补充为真实 MDX 文章
- [ ] 每篇文章的 summary 认真撰写（会显示在列表卡和搜索结果中）
- [ ] tags 命名统一（避免同义词如 "JS" 和 "JavaScript" 并存）
- [ ] 填入所有真实游戏、工具、友链数据
- [ ] 完善关于页内容

### 7.2 功能回归测试

- [ ] 博客搜索：标题关键词 / 标签关键词 / Tag 按钮单选 / 多选 / 组合 / 无结果 / 清空恢复
- [ ] 博客详情：每篇文章都能打开 / 排版正常 / 代码高亮正常 / 返回链接正常
- [ ] 游戏：每个游戏可加载可玩 / 切换不残留 / 关闭后释放 / 移动端触控正常
- [ ] 工具 & 友链：外链可打开 / 头像加载正常
- [ ] 暗色模式：所有页面切换无闪烁 / 刷新保持 / 所有组件暗色样式完整
- [ ] 移动端：所有页面可正常浏览和操作

### 7.3 性能优化

- [ ] 执行 `npm run build`，记录构建时间和产物大小
- [ ] 用 Lighthouse（Chrome DevTools）对首页、博客页、游戏页分别跑分
- [ ] Performance 目标 > 90：若未达标，检查图片尺寸、未使用 JS/CSS、阻塞资源
- [ ] Accessibility 目标 > 90：修复 contrast / aria-label / heading order 等问题
- [ ] SEO 目标 > 90：修复 meta / canonical / structured data 等问题
- [ ] 确认所有图片有 width/height 或 aspect-ratio 防止 CLS
- [ ] 确认字体使用 font-display: swap

---

## Day 8：部署上线 + 域名 + 最终验收

### 8.1 代码推送至 GitHub

- [ ] 检查 `.gitignore` 包含 node_modules/、dist/、.astro/、.env
- [ ] 如有敏感配置（API Key 等），确认已放入 .env 且未被提交
- [ ] 执行 git add / commit / push 推送到远程仓库
- [ ] 在 GitHub 仓库页面确认文件完整

### 8.2 部署到托管平台

- [ ] 根据所选平台（Cloudflare Pages / Vercel / GitHub Pages）登录控制台
- [ ] 关联 GitHub 仓库
- [ ] 配置构建命令为 `npm run build`，输出目录为 `dist`
- [ ] 若选 GitHub Pages，提前安装 `@astrojs/github-pages` 适配器并在 astro.config.mjs 中配置 base 路径
- [ ] 触发首次部署，等待构建完成
- [ ] 访问平台提供的预览 URL，确认站点可访问

### 8.3 绑定自定义域名（可选）

- [ ] 在托管平台添加自定义域名
- [ ] 在域名服务商 DNS 设置中添加 CNAME 或 A 记录
- [ ] 等待 DNS 传播（5-30 分钟）
- [ ] 确认 HTTPS 证书自动签发成功
- [ ] 访问自定义域名验证

### 8.4 线上最终验收

- [ ] 在线上环境（非 localhost）完整走一遍 Day 7 的测试清单
- [ ] 重点检查：搜索功能、游戏 iframe 加载、暗色模式持久化
- [ ] 用不同浏览器（Chrome / Safari / Firefox）各访问一次
- [ ] 用手机真实访问一次
- [ ] 用 Lighthouse 对线上 URL 跑分确认
- [ ] 确认 RSS feed 可访问（如已配置）

### 8.5 收尾

- [ ] 在 README.md 中写明项目简介、技术栈、本地运行方式
- [ ] 添加 LICENSE 文件
- [ ] 庆祝 🎉

---

## 📎 附录

### A. 日常操作速查

| 操作 | 步骤 |
|------|------|
| 新增博客文章 | 在 src/content/blog/ 新建 .mdx → 写 frontmatter + 正文 → 保存即生效 |
| 新增游戏 | 游戏文件放 public/games/xxx/ → games.yml 加一条 → 保存即生效 |
| 新增工具 | tools.yml 加一条 → 保存即生效 |
| 新增友链 | links.yml 加一条 → 保存即生效 |
| 新增分区 | 首页加 SectionCard → 新建 pages/xxx/index.astro → Header 加导航链接 |
| 修改标签 | 直接改 MDX frontmatter 中的 tags 数组 → 搜索栏自动更新 |
| 本地预览 | npm run dev |
| 生产构建 | npm run build && npm run preview |
| 类型检查 | npx astro check |

### B. 常见问题排查

| 问题 | 排查方向 |
|------|---------|
| 文章不显示 | 检查 frontmatter 是否符合 schema / draft 是否为 true / 文件名是否在正确目录 |
| 搜索不工作 | 检查 window.__BLOG_POSTS__ 是否有值 / script 是否加了 define:vars |
| 游戏 iframe 空白 | 检查 src 路径是否正确 / 游戏 HTML 是否独立可运行 / sandbox 是否过严 |
| 暗色切换无效 | 检查 tailwind.config 的 darkMode 是否为 'class' / script 是否有 client:load |
| 构建失败 | 运行 npx astro check 查看类型错误 / 检查 getStaticPaths 返回值格式 |
| 样式丢失 | 确认 global.css 已在全局引入 / Tailwind 插件已注册 |

### C. 后续迭代路线

| 优先级 | 方向 | 关键动作 |
|--------|------|---------|
| P1 | RSS 订阅 | 安装 @astrojs/rss，创建 rss.xml.ts |
| P1 | 阅读时间 | frontmatter 加 readingTime 或用 remark 插件自动计算 |
| P2 | 访问统计 | 接入 Umami / Plausible，在 BaseLayout 加追踪脚本 |
| P2 | 游戏存档 | 各游戏内部用 localStorage 读写进度 |
| P2 | 评论系统 | 接入 Giscus，在文章详情页底部嵌入 |
| P3 | 全文搜索 | 安装 Pagefind，构建时生成索引 |
| P3 | i18n | 使用 astro:i18n 或独立多语言路由 |
| P3 | CMS 管理 | 接入 Keystatic / TinaCMS 实现可视化编辑 |