---
title: 项目技术说明书（Firefly / Astro）
published: 2026-03-10
updated: 2026-03-10
description: 本站（Firefly）从内容组织、发文、标签/分类到部署发布的完整技术说明。作为你的第一篇文章发布。
image: ""
tags: [Firefly, Astro, 技术说明书, 写作, 配置]
category: 博客指南
draft: false
pinned: true
comment: false
slug: tech-manual
---

> 目标：这篇文章作为“第一篇正式发布”的说明书，写清楚 **以后如何发文章**、**怎么配置标签/属性**、以及 **部署发布流程**。

## 0. 你现在拿到的是什么项目

- 这是一个基于 **Astro** 的静态博客主题模板（Firefly）。
- 文章通过 **Astro Content Collections** 读取：内容目录在 `src/content/posts/`。
- 本项目支持 `.md`（Markdown）和 `.mdx`（MDX）。

参考（官方）：
- Astro Content Collections：<https://docs.astro.build/en/guides/content-collections/>  
- `astro:content` API（`defineCollection/getCollection/render`）：<https://docs.astro.build/en/reference/modules/astro-content/>  
- Markdown in Astro：<https://docs.astro.build/en/guides/markdown-content/>  
- MDX integration：<https://docs.astro.build/en/guides/integrations-guide/mdx/>  
- Deploy your Astro Site：<https://docs.astro.build/en/guides/deploy/>  

## 1. 内容目录结构（写文章放哪）

本项目的文章目录：

```text
src/content/posts/
  tech-manual.md              # 你正在看的这篇
  some-post.md                # 单文件文章
  series-a/
    index.md                  # 目录型文章（资源与文章同目录）
    cover.avif
    images/
      1.avif
```

### 1.1 文件名、路由、slug 规则

- 默认情况下：文章 URL = 文件路径（去掉扩展名）
  - `src/content/posts/hello.md` → `/posts/hello/`
  - `src/content/posts/series-a/index.md` → `/posts/series-a/index/`（注意：这里会带 `index`）
- 如果你不想 URL 暴露文件名，或者你写中文文件名但想要英文 URL：使用 `slug`。

本项目已支持 `slug` 字段：

```yaml
---
slug: how-to-publish
---
```

> 建议：
> - **正式发布的文章都写 slug**（英文、小写、用 `-` 连接），避免以后改文件名导致 URL 变化。

## 2. Frontmatter（文章头部元数据）——你最常用的配置

本主题对文章 frontmatter 的字段校验定义在：
- `src/content.config.ts`

核心字段（推荐每篇都写）：

```yaml
---
title: 文章标题
published: 2026-03-10
updated: 2026-03-10          # 可选，没写就只显示 published
description: 一句话摘要
image: ""                   # 封面（详见 2.2）
tags: [标签1, 标签2]
category: 分类名
slug: my-post-slug
pinned: false                # 是否置顶
comment: true                # 是否开启评论
draft: false                 # 草稿不发布
---
```

### 2.1 tags 与 category 的行为（站内如何用）

- `tags`：数组，展示为 `#tag`；点击后进入归档页筛选（URL 为 `/archive/?tag=...`）。
- `category`：单个字符串；点击后进入归档页按分类筛选（URL 为 `/archive/?category=...`）。

实现入口：
- 标签统计：`src/utils/content-utils.ts` → `getTagList()`
- 分类统计：`src/utils/content-utils.ts` → `getCategoryList()`
- 标签 Widget：`src/components/widget/Tags.astro`
- 分类 Widget：`src/components/widget/Categories.astro`

### 2.2 image（封面图）支持哪些写法

`image` 的解析逻辑在：
- `src/components/common/CoverImage.astro`

你可以这样写：

1) **相对路径**（推荐，资源放在文章同目录或子目录）
```yaml
image: ./cover.avif
```

2) **public 目录图片**
```yaml
image: /assets/images/xxx.webp
```

3) **远程 URL**
```yaml
image: https://example.com/cover.png
```

4) **随机封面图（API 模式）**
```yaml
image: api
```
- 配置：`src/config/coverImageConfig.ts`
- 注意：默认 `randomCoverImage.enable` 是 `false`，需要你自己打开。

### 2.3 draft（草稿）与开发预览策略

- 生产构建（`pnpm build`）永远不会输出 `draft: true` 的文章。
- 本项目已调整为：**开发环境（`pnpm dev`）默认也不展示 draft**，避免模板自带示例文章干扰。
  - 如要在开发环境预览草稿：在 `src/config/siteConfig.ts` 设置：

```ts
export const siteConfig = {
  // ...
  dev: {
    showDrafts: true,
  },
}
```

## 3. 发文流程（你以后照着做就行）

### 3.1 创建一篇新文章（推荐用脚本）

项目提供了脚本：

```bash
pnpm new-post my-new-post
```

它会在 `src/content/posts/` 下生成 `my-new-post.md` 并写好基础 frontmatter（脚本见 `scripts/new-post.js`）。

### 3.2 写作（Markdown / MDX）

- 普通文章用 Markdown：`.md`
- 需要在文章中直接写组件/JSX：用 MDX：`.mdx`

参考（官方）：
- Markdown：<https://docs.astro.build/en/guides/markdown-content/>
- MDX：<https://docs.astro.build/en/guides/integrations-guide/mdx/>

### 3.3 本地预览

```bash
pnpm dev
```

打开：<http://localhost:4321>

### 3.4 发布（取消草稿）

把文章 frontmatter 中：

```yaml
draft: false
```

然后执行构建验证：

```bash
pnpm check
pnpm build
pnpm preview
```

## 4. 站点搜索（Pagefind）与写作注意点

本主题使用 Pagefind 做静态全文检索，构建脚本里会在 `dist` 上生成索引：
- `package.json` → `pnpm build` 里包含 `pagefind --site dist`

Pagefind 官方：
- Getting Started：<https://pagefind.app/docs/>

写作建议：
- 标题（`#`/`##`）会影响目录与搜索结果结构。
- 如果某段内容不希望被索引（例如密钥、内部信息），应避免写入文章。

## 5. 推送云端自动更新（CI/CD）

你之前配置的“推送到云端自动更新博客”，本质是 **Git 推送触发云端构建与部署**。

### 5.1 当前项目已内置的自动部署（GitHub Actions → GitHub Pages）

本仓库已包含 GitHub Actions 工作流：
- `.github/workflows/deploy.yml`：当 `master` 分支有 push 时，自动构建并部署到 GitHub Pages。
  - 使用：`withastro/action@v4`（内部会安装依赖、执行构建并上传构建产物；默认 build 命令是 `<package-manager> run build`，输出目录默认 `dist`）
  - 部署：`actions/deploy-pages@v4`

这意味着：**只要你把改动 push 到 `origin/master`，线上站点会自动更新**。

参考（官方）：
- withastro/action（输入项与默认行为）：<https://github.com/withastro/action/blob/main/README.md>

### 5.2 另一个可选的自动部署：Vercel

仓库根目录有 `vercel.json`，其中声明了：
- buildCommand: `pnpm build`
- outputDirectory: `dist`

如果你把仓库连接到 Vercel：每次 push 也会自动构建并发布。

### 5.3 一键同步脚本（本地 → 云端 → 自动更新）

项目已新增脚本：
- `scripts/sync-blog.js`
- package scripts：
  - `pnpm sync`：执行 `pnpm check` → `pnpm build` → `git add -A` → `git commit` → `git push`
  - `pnpm sync:content`：只 stage `src/content`（适合只改文章/页面内容时）

常用用法：

```bash
# 全量同步（包含代码/配置/文章）
pnpm sync -- -m "content: publish new post"

# 只同步内容目录（src/content）
pnpm sync:content -- -m "content: update posts"

# 只 push，不做本地 build（不推荐，但有时临时用）
pnpm sync -- --no-build -m "chore: quick sync"

# 只做检查与构建，不 commit/push（用于本地验证）
pnpm sync -- --no-commit --no-push
```

> 注意：脚本不会保存任何账号密码；git 推送鉴权依赖你本机已配置的 GitHub 登录（HTTPS token / SSH key）。

> 协作提示：如果你以后让“助手”直接帮你完成同步（commit/push），需要你在对话里**明确要求执行 push**（因为 push 属于破坏性较强的远程操作）。

## 6. 部署发布（通用概念：Build / Dist / Preview）

Astro 官方部署指南：<https://docs.astro.build/en/guides/deploy/>

本项目的默认设置：
- Build Command：`pnpm run build`
- Output / Publish Directory：`dist`

> 发布建议：每次发布前本地先 `pnpm build && pnpm preview` 看一遍。

## 6. 常见问题（FAQ）

### Q1：为什么我写了文章但首页看不到？

检查：
- `draft: true`（草稿不会显示）
- `published` 是否是合法日期（建议用 `YYYY-MM-DD`）
- 是否放在 `src/content/posts/`（放错目录不会被收集）

### Q2：我想中文文件名，但 URL 用英文

给文章加：

```yaml
slug: my-english-slug
```

### Q3：标签/分类怎么“统一风格”？

- `tags` 建议使用固定大小写（例如全中文、或英文首字母大写）。
- `category` 建议少而精，避免过度碎片化。

---

## 附：本主题文章 Schema（摘录）

文章 schema 位于 `src/content.config.ts`，包含（节选）：
- `title`（必填）
- `published`（必填，日期）
- `updated`（可选）
- `draft`（默认 false）
- `tags`（默认 []）
- `category`（默认 ""）
- `slug`（可选）
- `pinned`、`comment`、`password/passwordHint` 等

完。
