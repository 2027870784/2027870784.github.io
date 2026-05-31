---
title: 从零构建 C++ 3D 软光栅渲染器
date: 2026-05-30
resume: true
directions:
  - cpp
  - graphics
  - game-client
tech_stack:
  - C++
  - MVP 变换
  - 重心坐标插值
  - Z-Buffer
  - Lambert 漫反射
role: 独立开发
weight: 95
github: https://github.com/2027870784/soft_render3d
---

# 从零构建 C++ 3D 软光栅渲染器

## 项目背景

为深入理解图形渲染与游戏客户端图像绘制相关基础，在不依赖 OpenGL/DirectX 等高级图形 API 的前提下，独立使用 C++ 实现软件渲染器。

## 核心实现

- 手写向量与矩阵运算库，完成模型坐标变换、空间位置计算等基础能力搭建。
- 基于重心坐标插值完成三角形填充算法，并通过深度测试（Z-Buffer）解决像素遮挡问题。
- 完成 MVP 变换（Model -> World -> View -> Projection），并实现简易 Lambert 漫反射，构建基础光照计算流程。
- 使用 AABB 包围盒预筛减少无效三角形遍历，提升光栅化阶段处理效率。
- 支持加载自定义模型并输出 `.ppm` 图像，形成从模型输入到像素生成的完整闭环。
- 按几何、光栅化、管线流程进行模块拆分并开源至 GitHub，加深对渲染管线各阶段协作关系的理解。

## 项目收获

通过该项目系统理解了渲染管线、坐标变换、像素插值、遮挡处理和基础光照模型，也强化了 C++ 工程组织、调试和模块拆分能力。
