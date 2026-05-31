---
title: 个人技术门户与自驱动简历系统
date: 2026-05-31
tags:
  - Hexo
  - GitHub Pages
  - CI/CD
  - Markdown
  - AI
  - 简历自动化
categories:
  - 项目经历
resume: true
directions:
  - web
  - frontend
  - static-site
  - tooling
tech_stack:
  - Hexo
  - Butterfly
  - Markdown
  - GitHub Pages
  - GitHub Actions
  - Git
  - YAML
  - Node.js
role: 独立开发
weight: 90
---

# 个人技术门户与自驱动简历系统

## 项目概览

**项目类型：** 个人工程实践项目  
**项目角色：** 独立开发  
**技术栈：** Hexo、Butterfly、Markdown、GitHub Pages、GitHub Actions、Git、YAML、Node.js  
**项目定位：** 面向技术文章、项目经历和在线简历的个人技术门户

本项目基于 Hexo 静态网站生成器搭建个人技术门户，使用 Markdown 统一管理技术文章、项目经历、关于页面和在线简历，并通过 GitHub Actions 自动构建后部署到 GitHub Pages。项目后续规划并实验了 AI 简历自动化流程：从项目经历文章中提取结构化 JSON 数据，再按不同求职方向生成多版本简历页面。

## 项目背景

在学习和实践过程中，技术文章、项目总结和简历内容往往分散在不同文件或平台中，后续维护成本较高。这个项目希望把它们统一沉淀到一个可持续更新的站点中：

- 技术文章用于记录学习过程和项目复盘。
- 项目经历用于结构化展示个人实践成果。
- 在线简历用于按不同方向展示能力画像。
- GitHub Actions 用于完成从源码提交到线上发布的自动化闭环。

## 核心功能

- **技术博客管理**：使用 Hexo 和 Markdown 管理文章内容，支持分类、标签、归档和本地搜索。
- **项目经历展示**：在 `source/projects/` 下维护项目页面，集中展示项目背景、职责、实现和收获。
- **在线简历页面**：通过 `source/resume/` 维护简历入口和方向化简历详情页。
- **自动化部署**：配置 GitHub Actions，在推送到主分支后自动安装依赖、执行 Hexo 构建并发布到 GitHub Pages。
- **评论能力接入**：基于 Giscus 接入 GitHub Discussions 评论系统，并为后续 AI 评论审核预留方案。
- **AI 简历自动化探索**：在实验分支中设计项目文章到结构化 JSON、再到多方向简历页面的生成流程。

## 主要工作

- 初始化 Hexo 项目结构，配置 Butterfly 主题、导航栏、站点图标、头像、社交链接和搜索能力。
- 设计博客、项目经历、简历、关于页面等内容模块，使站点从默认博客扩展为个人技术门户。
- 配置 GitHub Actions 工作流，完成 `npm ci -> hexo generate -> GitHub Pages deploy` 的自动部署链路。
- 梳理 `.gitignore` 规则，排除 `node_modules/`、`public/`、`db.json`、`.env` 等依赖、构建产物和敏感配置。
- 将简历从单个 Markdown 文件调整为“简历列表页 + 多个详情页”的结构，支持未来维护多份方向化简历。
- 排查 Hexo 和 Butterfly 配置问题，包括 YAML 重复键、中文编码异常、页面路由和 Markdown 渲染格式问题。
- 接入 Giscus 评论配置，明确静态站点中评论系统与后续 AI 审核能力的边界。
- 设计 AI 简历生成方案，使用项目文章 front matter 标注方向、技术栈和权重，为自动化生成简历数据提供输入。

## 技术实现

### 1. 静态站点生成

项目使用 Hexo 作为静态站点生成器，将 `source/` 目录下的 Markdown 内容转换为可部署的 HTML 页面。Butterfly 主题提供了导航、搜索、归档、标签和响应式布局等基础能力。

常用脚本封装在 `package.json` 中：

```json
{
  "build": "hexo generate",
  "clean": "hexo clean",
  "server": "hexo server",
  "deploy": "hexo deploy"
}
```

通过 npm scripts 统一命令入口，后续可以继续把简历数据生成、资源处理等步骤串入构建流程。

### 2. GitHub Actions 自动部署

项目使用 GitHub Actions 将构建和发布流程放到云端执行。推送到 `main` 分支后，工作流会自动拉取代码、安装依赖、生成静态页面，并上传到 GitHub Pages。

这种方式避免了手动提交 `public/` 构建产物，也让站点发布流程更稳定、可追踪。

### 3. 简历页面结构调整

早期简历以单文件形式维护，容易出现访问路径不符合预期的问题。后续将简历调整为目录式结构：

```text
source/resume/index.md
source/resume/cpp-graphics/index.md
```

这样可以生成更自然的访问路径：

```text
/resume/
/resume/cpp-graphics/
```

同时，简历入口页只负责维护不同版本的链接，具体内容放到独立详情页中，便于后续扩展 Web 前端、通用软件开发等方向。

### 4. AI 简历自动化方案

在实验分支中，项目进一步探索了自动化简历生成：

```text
项目经历 Markdown
-> 解析 front matter 和正文
-> 调用 AI 或本地规则生成结构化项目 JSON
-> 根据方向配置筛选项目
-> 生成多份方向化简历页面
```

项目文章可以通过 front matter 标注是否参与简历生成：

```yaml
resume: true
directions:
  - web
  - frontend
  - static-site
tech_stack:
  - Hexo
  - Markdown
  - GitHub Pages
role: 独立开发
weight: 90
```

该方案的重点不是完全依赖 AI，而是让 AI 作为内容提炼能力接入构建流程。当 API 不可用时，脚本仍可回退到本地规则，保证站点构建不会中断。

## 问题与解决方案

### 页面路径不符合预期

**问题：** 简历 Markdown 文件已经提交，但线上访问路径与预期不一致。  
**原因：** Hexo 根据文件位置生成 HTML，`source/resume/cpp-graphics.md` 更容易生成 `/resume/cpp-graphics.html`，而不是 `/resume/cpp-graphics/`。  
**解决：** 将文件调整为 `source/resume/cpp-graphics/index.md`，使用目录式页面结构。

### Hexo 启动时 YAML 报错

**问题：** `hexo server` 报 `YAMLException: duplicated mapping key`。  
**原因：** Butterfly 配置中的中文菜单项出现编码异常，被 YAML 解析为重复键。  
**解决：** 修复 `_config.butterfly.yml` 中的菜单文本和 YAML 层级，保证配置文件为有效 UTF-8 内容。

### Markdown 加粗符号原样显示

**问题：** 部分 Markdown 预览中出现 `**` 原样显示。  
**原因：** `**加粗内容：**后接中文` 在部分解析器下不够稳定。  
**解决：** 统一改为 `**加粗内容**：正文` 的写法，提高不同渲染器下的一致性。

### AI API 配置安全

**问题：** AI 简历生成需要 API Key，但不能把密钥提交到仓库。  
**解决：** 本地使用 `.env` 管理密钥，并加入 `.gitignore`；线上构建通过 GitHub Actions Secrets 注入环境变量。

## 项目亮点

- 将博客、项目经历和在线简历统一到同一个静态站点中，形成可持续维护的个人技术资产库。
- 建立了从本地写作、Git 提交、CI 构建到 GitHub Pages 发布的完整自动化链路。
- 使用目录式页面结构组织多版本简历，提升后续扩展性和访问路径可读性。
- 对 Giscus、搜索、主题配置、评论审核等能力进行了边界分析和工程化配置。
- 探索 AI 与静态站点构建流程结合，使项目经历可以进一步转化为结构化简历数据。

## 项目成果

- 完成个人技术门户基础搭建，并支持博客文章、项目经历、简历页面和关于页面展示。
- 完成 GitHub Pages 自动部署流程，降低站点发布维护成本。
- 整理出可复用的简历页面结构，为不同求职方向维护多份简历提供基础。
- 沉淀了 Hexo 配置、GitHub Actions、Giscus 评论、Markdown 渲染和 AI 自动化相关实践经验。

## 个人收获

通过该项目，我系统理解了静态站点生成器的工作流，也实践了从内容组织、主题配置、页面路由、自动部署到功能扩展的完整流程。相比只写一个展示页，这个项目更像是一次个人内容工程化实践：把分散的文章、项目和简历统一纳入版本管理，并通过自动化流程降低长期维护成本。

