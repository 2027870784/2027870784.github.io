---
title: Giscus 评论系统接入与 AI 审核方案
date: 2026-06-01
tags:
  - Giscus
  - GitHub Discussions
  - GitHub Actions
  - AI
  - 静态网站
categories:
  - 项目经历
resume: true
directions:
  - web
  - static-site
  - software-engineering
  - tooling
tech_stack:
  - Hexo
  - Butterfly
  - Giscus
  - GitHub Discussions
  - GitHub Actions
  - YAML
role: 独立设计与配置
weight: 82
---

# Giscus 评论系统接入与 AI 审核方案

## 项目概览

**项目类型：** 静态站点互动能力扩展  
**项目角色：** 独立设计与配置  
**技术栈：** Hexo、Butterfly、Giscus、GitHub Discussions、GitHub Actions、YAML  
**项目定位：** 为个人技术门户接入评论能力，并规划后续评论审核流程

本项目为 Hexo 技术门户接入 Giscus 评论系统，使静态站点具备基于 GitHub Discussions 的互动能力。同时结合静态站点没有后端的特点，设计后续通过 GitHub Actions 或 Webhook 实现 AI 异步审核的方案。

## 项目背景

静态博客适合内容展示，但天然缺少评论、登录和审核等后端能力。直接自建评论服务成本较高，也会增加维护负担。

Giscus 基于 GitHub Discussions，可以让访问者使用 GitHub 账号发表评论，评论数据也存储在 GitHub 生态中。对于托管在 GitHub Pages 上的个人技术站点，这是一种较轻量的选择。

## 核心功能

- 在 Butterfly 主题配置中启用 Giscus 评论系统。
- 使用 GitHub Discussions 作为评论数据承载位置。
- 按页面路径映射评论讨论，保证不同文章评论相互独立。
- 配置中文界面、浅色和深色主题适配。
- 分析静态站点评论审核边界，规划 AI 异步审核方案。

## 关键配置

项目中评论配置位于 `_config.butterfly.yml`：

```yaml
comments:
  use: Giscus
  text: true
  lazyload: false

giscus:
  repo: 2027870784/2027870784.github.io
  light_theme: light
  dark_theme: dark
  option:
    data-mapping: pathname
    data-strict: 1
    data-reactions-enabled: 0
    data-input-position: top
    data-lang: zh-CN
```

配置重点是保持 YAML 对象结构清晰，避免把 Giscus 官方页面生成的 HTML 属性直接粘贴进配置文件。

## 工程边界分析

静态站点没有服务器端提交入口，因此无法像传统后端一样在评论写入前进行审核。

更现实的流程是：

```text
用户发表评论
-> 评论进入 GitHub Discussions
-> GitHub Actions / Webhook 获取新评论
-> 调用 AI 或规则模型审核
-> 对可疑评论执行隐藏、删除、打标或人工复核
```

这个方案承认静态站点的边界，把审核放在评论提交后的异步治理阶段。

## AI 审核策略

后续 AI 审核可以采用分级策略：

- 正常技术讨论：不处理
- 疑似广告：打标或隐藏
- 明显垃圾内容：删除
- 不确定内容：保留并进入人工复核

AI 在这里不应替代最终决策，而是降低人工筛查成本。对于个人博客，这种轻量治理方式已经足够。

## 项目亮点

- 在不引入自建后端的情况下，为静态站点加入评论互动能力。
- 使用 GitHub Discussions 存储评论，保持站点部署架构轻量。
- 明确了 Giscus 与静态站点的能力边界，避免把异步审核误认为前置拦截。
- 为后续 AI 评论审核设计了可扩展流程。
- 配置内容可直接纳入项目验收展示，体现站点互动和扩展设计。

## 项目成果

- 完成 Butterfly 主题中的 Giscus 评论配置。
- 梳理出评论系统接入文档和审核方案文章。
- 明确后续基于 GitHub Actions 或 Webhook 的异步审核方向。
- 沉淀技术复盘：[Giscus 评论系统接入与审核方案](/2026/06/01/Giscus-评论系统接入与审核方案/)。

## 个人收获

这个项目让我更清楚地认识到静态网站的扩展方式。静态站点不适合硬加传统后端逻辑，但可以通过 GitHub 生态和第三方服务补齐互动能力。

工程设计中最重要的是尊重边界：评论由 Giscus 处理，内容由 GitHub Discussions 存储，审核作为后续异步流程扩展。

