---
title: Giscus 评论系统接入与审核方案
date: 2026-06-01 11:40:00
tags:
  - Giscus
  - GitHub Discussions
  - 静态网站
  - 评论系统
categories:
  - 工程设计
description: 记录静态博客接入 Giscus 评论系统的思路，并分析后续基于 GitHub Actions 和 AI 做评论审核的可行边界。
---

静态网站没有自己的后端，因此评论系统通常需要借助第三方服务。这个站点选择了 Giscus，因为它基于 GitHub Discussions，和 GitHub Pages、Hexo 这类静态站点组合比较自然。

这篇文章记录 Giscus 的接入思路，以及后续如果加入 AI 评论审核，应该采用什么样的工程边界。

# 为什么选择 Giscus

Giscus 的核心特点是把评论存储在 GitHub Discussions 中。对个人技术博客来说，它有几个优点：

- 不需要自建数据库
- 可以复用 GitHub 账号体系
- 评论数据留在 GitHub 仓库关联的 Discussions 中
- 适合 GitHub Pages 静态站点
- Butterfly 主题已经提供了配置入口

它也有前提：仓库需要开启 Discussions，并通过 Giscus 配置页获取 `repo_id` 和 `category_id`。

# Butterfly 中的配置方式

Butterfly 主题支持多种评论系统。当前项目的评论配置集中在 `_config.butterfly.yml` 中：

```yaml
comments:
  use: Giscus
  text: true
  lazyload: false

giscus:
  repo: 2027870784/2027870784.github.io
  repo_id: R_kgDOSsGr1w
  category_id: DIC_kwDOSsGr184C-Mb1
  light_theme: light
  dark_theme: dark
  option:
    data-category: Announcements
    data-mapping: pathname
    data-strict: 1
    data-reactions-enabled: 0
    data-emit-metadata: 0
    data-input-position: top
    data-lang: zh-CN
```

这里最容易出错的是 `option` 的写法。它应该保持为 YAML 对象，而不是直接粘贴一段 HTML 属性字符串。

# 静态站点的限制

Giscus 很适合静态站点，但它不能提供传统后端中的“提交前审核”。

在普通后端系统里，评论提交流程可能是：

```text
用户提交评论
-> 后端审核
-> 审核通过后写入数据库
-> 前端展示
```

而 Giscus 的流程更接近：

```text
用户提交评论
-> 评论进入 GitHub Discussions
-> 页面从 Giscus 加载评论
```

站点本身没有机会在评论进入 GitHub 之前拦截它。因此，如果要做审核，更现实的方式是提交后处理。

# AI 审核的可行方案

后续可以设计一个异步审核流程：

```text
GitHub Discussions 新评论
-> GitHub Actions 或 Webhook 触发
-> 调用 AI 审核评论内容
-> 对可疑评论打标签、隐藏、删除或回复提醒
```

这个方案的重点是承认静态站点的边界：AI 审核不是前置网关，而是异步治理流程。

如果使用 GitHub Actions，需要继续确认 Discussions 事件是否满足触发需求；如果 Actions 触发能力不足，也可以考虑外部 Webhook 服务。

# 审核策略

评论审核不应该只依赖一个“通过 / 不通过”的判断。更合理的策略是分级：

- 正常评论：不处理
- 可疑广告：打标或隐藏
- 明显垃圾内容：删除
- 可能误判内容：保留并通知人工复核

AI 的作用是降低人工筛查压力，但最终策略仍然需要人来设定。

# 与项目验收的关系

在项目验收展示中，评论系统可以说明这个站点不只是静态内容展示，也考虑了互动能力。

更重要的是，它体现了对工程边界的理解：

- 静态站点适合内容分发
- 评论交互交给 Giscus
- 后续审核通过 GitHub Actions 或 Webhook 异步完成
- AI 能增强治理能力，但不应该伪装成不存在的后端

这种设计比简单说“加入 AI 审核”更可信，也更容易继续落地。

# 总结

Giscus 让 Hexo 静态站点具备了评论能力，GitHub Discussions 则负责评论数据存储和账号体系。

如果后续继续扩展 AI 审核，关键不是把静态站点改造成后端系统，而是利用 GitHub 生态做异步处理。这样既保持了静态站点的轻量，也为内容互动和治理留下了扩展空间。

