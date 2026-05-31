---
title: 项目经历
date: 2026-05-29
---

# 项目经历

这里集中维护可被简历生成器读取的项目经历。新增项目时，建议在 `source/projects/` 下创建独立 Markdown 文件，并在 front-matter 中设置 `resume: true`、`directions`、`tech_stack`、`role` 和 `weight`。

## 项目列表

- [从零构建 C++ 3D 软光栅渲染器](./soft-renderer.html)
- [个人技术门户与自驱动简历系统](./tech-portal.html)

## 自动简历生成说明

构建前运行 `npm run resume:generate` 会读取这些项目文章，调用 DeepSeek API 生成结构化 JSON，并更新不同方向的简历页面。
