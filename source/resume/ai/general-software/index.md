---
title: 通用软件开发方向简历
date: 2026-06-06
---

<div class="resume-doc">

# DemoDog

<div class="resume-contact">
2027870784@qq.com · [GitHub](https://github.com/2027870784)
</div>

<div class="resume-target">面向通用软件开发、工程实践、工具链和自驱动项目经验展示。</div>

## 教育背景

### 东北大学秦皇岛分校 · 计算机科学与技术 · 本科
2024.09 - 至今
- 相关课程：算法分析、线性代数、C++ 程序设计
- 独立完成现代图形学入门课程 GAMES101，学习渲染管线理论与工程实现

## 核心技能

- **编程语言**：C++
- **开发工具**：Git、CMake
- **图形学基础**：MVP 变换、重心坐标插值、深度测试、Lambert 漫反射
- **数学基础**：线性代数、矩阵变换、向量运算
- **项目技术栈**：Hexo、Butterfly、Markdown、GitHub Pages、GitHub Actions、YAML、Node.js、Giscus、GitHub Discussions、YAML Front Matter、JSON、AI Prompt、Z-Buffer、PPM、信息架构

## 项目经历

### 个人技术门户与自驱动简历系统

*独立开发*  
**技术栈：** Hexo、Butterfly、Markdown、GitHub Pages、GitHub Actions、Git、YAML、Node.js  
本项目基于 Hexo 静态网站生成器搭建个人技术门户，使用 Markdown 统一管理技术文章、项目经历、关于页面和在线简历，并通过 GitHub Actions 自动构建后部署到 GitHub Pages。项目后续规划并实验了 AI 简历自动化流程：从项目经历文章中提取结构化 JSON 数据，再按不同求职方向生成多版本简历页面。

- 技术文章用于记录学习过程和项目复盘
- 项目经历用于结构化展示个人实践成果
- 在线简历用于按不同方向展示能力画像
- GitHub Actions 用于完成从源码提交到线上发布的自动化闭环

### Giscus 评论系统接入与 AI 审核方案

*独立设计与配置*  
**技术栈：** Hexo、Butterfly、Giscus、GitHub Discussions、GitHub Actions、YAML  
本项目为 Hexo 技术门户接入 Giscus 评论系统，使静态站点具备基于 GitHub Discussions 的互动能力。同时结合静态站点没有后端的特点，设计后续通过 GitHub Actions 或 Webhook 实现 AI 异步审核的方案。

- 在 Butterfly 主题配置中启用 Giscus 评论系统
- 使用 GitHub Discussions 作为评论数据承载位置
- 按页面路径映射评论讨论，保证不同文章评论相互独立
- 配置中文界面、浅色和深色主题适配

### AI 辅助多方向简历生成系统

*方案设计与原型开发*  
**技术栈：** Markdown、YAML Front Matter、Node.js、JSON、Hexo、AI Prompt  
本项目围绕个人技术门户中的项目经历和简历模块展开，目标是把已经沉淀的项目 Markdown 内容进一步结构化，并探索通过 AI 或本地规则生成不同方向的在线简历页面。

- 将项目页从普通 Markdown 扩展为可被程序识别的内容数据源
- 使用 front matter 标注项目是否进入简历、适合方向、技术栈和排序权重
- 设计“项目内容 -> 结构化 JSON -> 多方向简历页面”的生成流程
- 在 AI 不可用时保留本地规则降级，保证站点构建稳定

### 从零构建 C++ 3D 软光栅渲染器

*独立开发*  
**技术栈：** C++、CMake、MVP 变换、重心坐标插值、Z-Buffer、Lambert 漫反射、PPM  
本项目是一个从零实现的 C++ 软件 3D 渲染器。在不依赖 OpenGL、DirectX 等高级图形 API 的前提下，手写数学库、三角形网格、帧缓冲、光栅化器和基础渲染管线，完成从模型数据到像素图像输出的完整闭环。

- 数学基础库：实现 Vector3、Vector4、Matrix4 等基础类型，支持点乘、叉乘、归一化和矩阵运算
- 几何数据建模：使用 Triangle 和 Mesh 组织三角形、顶点颜色和法线信息
- MVP 渲染管线：完成 Model、View、Projection 矩阵变换，以及透视除法和屏幕空间映射
- 三角形光栅化：基于屏幕空间包围盒、叉积判定和重心坐标插值完成三角形填充

[GitHub 链接](https://github.com/2027870784/soft_render3d)

### 技术门户内容体系与验收展示优化

*内容结构设计与页面维护*  
**技术栈：** Hexo、Markdown、Butterfly、Git、信息架构  
本项目围绕个人技术门户的内容体系展开，重点不是新增复杂功能，而是让博客、项目经历、简历和关于页面形成清晰结构，使站点在项目验收时能够完整展示学习过程、技术实践和阶段性成果。

- 梳理现有 source/ 目录结构，确认博客、项目和简历的维护方式
- 新增围绕 Hexo、GitHub Actions、AI 简历生成、Giscus 评论系统的技术文章
- 在 source/projects/ 下新增项目详情页，使项目列表有更多可点击内容
- 在 source/resume/ 下新增 Web / 前端方向和通用软件开发方向简历

## 其他

- 英语能力：通过英语六级，可独立阅读英文技术文档与图形学相关资料
- 技术兴趣：持续学习渲染管线、图形学基础、数学计算与 C++ 工程实现

<div class="resume-meta">由 AI/规则在构建期根据项目文章自动生成。更新时间：2026/6/6 20:40:08</div>

</div>
