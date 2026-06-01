---
title: GitHub Actions 自动部署 Hexo 站点实践
date: 2026-06-01 10:10:00
tags:
  - GitHub Actions
  - GitHub Pages
  - Hexo
  - CI/CD
categories:
  - 工程实践
description: 复盘 Hexo 站点通过 GitHub Actions 自动部署到 GitHub Pages 的流程，以及源码、构建产物和配置文件之间的边界。
---

Hexo 站点本身是静态网站，但从写文章到线上可访问，中间仍然有一条完整的工程链路。为了避免每次都手动构建和上传，我在项目中使用 GitHub Actions 自动部署到 GitHub Pages。

这篇文章整理自动部署的工作方式，以及搭建过程中需要注意的边界。

# 自动部署解决了什么问题

手动部署的流程一般是：

```text
本地修改 Markdown
-> 本地执行 hexo generate
-> 得到 public 目录
-> 上传或推送构建产物
```

这个流程可以工作，但维护成本比较高。特别是当构建环境、主题依赖或 Node.js 版本变化时，本地机器和线上结果可能不一致。

使用 GitHub Actions 后，日常流程变成：

```text
提交源码
-> 推送到 main
-> GitHub Actions 自动安装依赖
-> 执行 Hexo 构建
-> 发布到 GitHub Pages
```

这样仓库只需要维护源码和内容，构建产物由 CI 统一生成。

# 工作流结构

当前项目中的工作流位于：

```text
.github/workflows/pages.yml
```

核心步骤可以概括为：

```text
checkout
-> setup node
-> npm ci
-> configure pages
-> npx hexo generate
-> upload pages artifact
-> deploy pages
```

其中 `npm ci` 会严格按照 `package-lock.json` 安装依赖，比 `npm install` 更适合 CI 环境。`npx hexo generate` 会读取 `_config.yml`、主题配置和 `source/` 目录，生成最终的静态文件。

# 源码和构建产物的边界

静态站点项目里最容易混淆的是源码和产物。

在这个项目中，应该提交的是：

- `source/` 下的文章、项目页、简历页和图片资源
- `_config.yml` 与 `_config.butterfly.yml`
- `package.json` 和 `package-lock.json`
- `.github/workflows/pages.yml`

不应该提交的是：

- `node_modules/`
- `public/`
- `db.json`
- `.env`
- 日志文件

这些规则已经写入 `.gitignore`。这样做的原因很直接：依赖可以重新安装，静态文件可以重新生成，缓存没有必要进入版本管理，密钥更不能提交。

# 为什么用 GitHub Pages

对于个人技术门户，GitHub Pages 的优势是足够轻量：

- 不需要自己维护服务器
- 和 GitHub 仓库天然集成
- 适合托管 Hexo 这类静态站点
- 可以配合 Actions 完成自动发布

它也有边界：没有传统后端能力。因此评论、搜索、AI 审核这类功能要通过第三方服务、前端索引或 GitHub Actions 异步流程完成。

# 本地预览和线上部署的关系

本地开发时主要使用：

```bash
npm run server
```

这个命令适合预览页面和检查链接。真正生成静态文件时使用：

```bash
npm run build
```

线上部署则由 GitHub Actions 执行类似构建流程。也就是说，本地预览是为了快速验证，线上部署才是最终发布路径。

# 常见问题

## 页面本地能看，线上没有更新

通常需要检查三件事：

- 代码是否已经推送到触发分支
- GitHub Actions 是否执行成功
- GitHub Pages 是否指向 Actions 部署结果

如果只是本地执行了 `hexo generate`，但没有推送源码，线上页面不会自动变化。

## 构建产物被误提交

如果把 `public/` 提交到源码仓库，后续会让差异变得混乱。这个项目采用 Actions 部署，所以 `public/` 应该由 CI 生成，不进入 Git 历史。

## 配置文件导致构建失败

Hexo 和 Butterfly 都依赖 YAML 配置。YAML 对缩进、重复 key 和编码问题很敏感。遇到构建失败时，除了看 Markdown，也要检查 `_config.yml` 和主题配置。

# 总结

自动部署让这个技术门户从“本地能跑”变成了“可持续发布”。每次新增博客、项目经历或简历，只要内容进入仓库，CI 就能生成最终页面。

对个人项目来说，这条链路的价值不只是省时间，更重要的是让项目具备工程完整性：源码、依赖、构建和发布都有明确边界，也更适合在项目验收时展示。

