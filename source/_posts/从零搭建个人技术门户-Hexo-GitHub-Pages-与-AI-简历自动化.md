---
title: 从零搭建个人技术门户：Hexo、GitHub Pages 与 AI 简历自动化
date: 2026-05-31
tags:
  - Hexo
  - GitHub Pages
  - CI/CD
  - AI
  - 简历自动化
categories:
  - 工程实践
---

# 从零搭建个人技术门户：Hexo、GitHub Pages 与 AI 简历自动化

这个项目最初只是一个很朴素的想法：我需要一个能够长期维护的个人技术门户，用来放技术文章、项目经历和在线简历。

但真正做下来以后，它不只是一个静态博客。它逐渐变成了一个围绕个人技术资产展开的小型工程系统：内容用 Markdown 管理，页面由 Hexo 生成，通过 GitHub Actions 自动部署到 GitHub Pages；后续又进一步探索了用 AI 从项目文章中提取结构化信息，并按不同求职方向自动生成简历页面。

这篇文章是对整个搭建过程的一次复盘，主要依据项目的 Git 提交历史、代码变更，以及开发过程中和 AI 协作排障留下的记录整理而来。

## 项目目标

我对这个站点的定位不是一份一次性写完的在线简历，而是一个可以持续生长的个人技术空间。

它需要承担几类内容：

- 技术文章：记录学习过程、项目实践和踩坑总结。
- 项目经历：把做过的项目沉淀成结构化、可复用的经历资产。
- 在线简历：根据不同方向展示不同版本，而不是只维护一份固定简历。
- 个人说明：通过关于页面解释这个站点为什么存在，以及我希望它承载什么。

因此，项目一开始就不是单纯追求页面好看，而是更关注内容组织、部署闭环和后续扩展能力。

## 技术选型

这个项目采用了比较轻量的静态站点方案：

- Hexo：负责把 Markdown 内容生成静态网页。
- Butterfly：作为 Hexo 主题，提供导航、搜索、评论、响应式布局等能力。
- GitHub Pages：负责托管生成后的静态站点。
- GitHub Actions：负责自动安装依赖、构建和部署。
- Markdown：作为文章、项目经历和简历内容的统一源格式。
- Git：记录每一次内容结构和工程配置的演进。

这个组合的优点很明显：部署成本低、维护方式简单、内容和代码都能纳入版本管理。对个人技术博客来说，它足够轻，也足够稳定。

## 第一阶段：初始化 Hexo 站点

项目的第一个提交完成了基础站点初始化：加入 Hexo 配置、Butterfly 主题配置、页面脚手架、基础图片资源、`package.json` 和依赖锁文件。

当时建立的基础目录大致是这样：

```text
source/
  _posts/        # 技术文章
  about/         # 关于页面
  projects/      # 项目经历页面
  resume/        # 简历页面
  categories/
  tags/
scaffolds/       # Hexo 页面模板
_config.yml
_config.butterfly.yml
package.json
```

`package.json` 中保留了几个核心命令：

```json
{
  "build": "hexo generate",
  "clean": "hexo clean",
  "deploy": "hexo deploy",
  "server": "hexo server"
}
```

这里有一个关键理解：`npm run build` 本质上就是执行 `hexo generate`，把 `source/` 和主题配置生成到 `public/`；`npm run server` 则是启动本地预览服务。用 npm scripts 包一层的好处是后续可以把更多构建步骤串进去，而不需要改变日常使用命令。

## 第二阶段：接入 GitHub Pages 自动部署

初始化站点后，我很快加入了 GitHub Actions 工作流。这个工作流在推送到 `main` 分支时自动执行：

```text
checkout -> setup node -> npm ci -> hexo generate -> upload pages artifact -> deploy pages
```

这一步的意义是把发布流程从本地机器中解放出来。之后我只需要提交源码和 Markdown 内容，GitHub Actions 就会在云端重新安装依赖并构建静态文件。

这也明确了 `.gitignore` 的边界：

```gitignore
node_modules/
public/
db.json
*.log
.deploy*/
.env
.vscode/
```

其中 `node_modules/` 是依赖目录，应该由 CI 通过 `npm ci` 重新安装；`public/` 是构建产物，应该由 CI 重新生成；`db.json` 是 Hexo 的本地缓存；`.env` 则可能包含 API Key，必须避免提交。

这里也区分了两个容易混淆的命令：

- `git push` 推送的是 Hexo 源码、Markdown、配置和工作流。
- `hexo deploy` 通常推送的是已经生成好的 `public/` 静态文件。

这个项目采用的是 GitHub Actions 部署，所以日常发布的主路径是 `git push`，而不是依赖本地 `hexo deploy`。

## 第三阶段：把简历从单文件调整为页面系统

最早的简历是以 `resume_final.md` 这样的单文件形式出现的。很快我就遇到了一个问题：文件存在于仓库里，并不意味着它一定能按预期路径出现在网站上。

Hexo 的页面路由和文件位置强相关。例如：

```text
source/resume/cpp-graphics.md
```

通常会生成：

```text
/resume/cpp-graphics.html
```

而如果希望访问路径变成更自然的目录形式：

```text
/resume/cpp-graphics/
```

更合适的结构是：

```text
source/resume/cpp-graphics/index.md
```

于是项目逐步从“单份简历文件”调整为“简历入口页 + 多个简历详情页”的布局：

```text
source/resume/index.md
source/resume/cpp-graphics/index.md
```

`source/resume/index.md` 负责展示简历版本列表，具体方向的简历则放到独立目录中。这个结构给后续扩展多份简历留下了空间，比如 C++ / 图形学方向、Web / 前端方向、通用软件开发方向等。

这个阶段还处理过一个 Markdown 渲染的小问题：部分预览器会对 `**加粗内容：**后面紧跟中文` 的写法比较敏感，导致星号原样显示。更稳妥的写法是把标点放到加粗外部：

```md
- **实现几何阶段**：手写向量与矩阵运算库
```

这类细节不大，但会影响最终页面的专业感。

## 第四阶段：完善站点配置和内容入口

站点能跑起来以后，我开始把它从“默认博客”调整成更像个人品牌和技术门户的形态。

主要改动包括：

- 修改 Butterfly 导航，只保留项目、简历、关于等核心入口。
- 配置头像、站点图标、GitHub 和邮箱链接。
- 将搜索范围从文章扩展到更完整的内容范围，使项目页和简历页也能被搜索。
- 优化关于页面，让它更像站点说明，而不是重复一份简历。
- 删除默认测试文章，避免首页出现无关内容。

这个阶段也排查过一个比较典型的 YAML 问题：`_config.butterfly.yml` 中菜单项曾因编码异常变成重复键，Hexo 启动时报：

```text
YAMLException: duplicated mapping key
```

问题本质是 YAML 对重复 key 非常敏感，而配置文件里的中文菜单项被错误编码后变成了相同的占位字符。修复方式是把菜单项恢复成有效的 UTF-8 文本，并保持 YAML 层级正确。

这给我的提醒是：静态站点虽然看起来简单，但配置文件其实就是项目的核心代码之一。主题配置、路由、搜索、评论这些能力都依赖 YAML 的正确结构。

## 第五阶段：接入评论系统，并预留 AI 审核空间

在评论系统上，我选择了 Giscus。它基于 GitHub Discussions，和 GitHub Pages 的静态站点形态比较匹配，不需要自建后端。

Giscus 的配置重点有几个：

- 评论仓库可以和静态网站仓库使用同一个仓库。
- 需要在 GitHub 仓库中开启 Discussions。
- `repo_id` 和 `category_id` 应通过 Giscus 官方配置页获取。
- Butterfly 中的 `option` 需要写成 YAML 对象，而不是 HTML 属性字符串。

例如更合理的配置形式是：

```yaml
option:
  data-mapping: pathname
  data-strict: 1
  data-reactions-enabled: 0
  data-input-position: top
  data-lang: zh-CN
```

当时还考虑过后续加入 AI 评论过滤。这里有一个静态站点的天然限制：Giscus 评论会直接进入 GitHub Discussions，站点本身没有后端，因此无法在“提交前”拦截评论。

更现实的方案是提交后审核：

```text
用户发表评论
-> GitHub Discussions 收到评论
-> GitHub Actions 或 Webhook 触发
-> 调用 AI 审核
-> 对可疑评论隐藏、删除、打标签或回复提醒
```

也就是说，AI 审核可以作为后处理流程存在，但不能伪装成传统后端表单里的提交前过滤。

## 第六阶段：探索 AI 自动简历生成

项目后期我在 `test_ai_resume` 分支上做了一次更进一步的探索：把项目经历文章变成结构化 JSON，再根据不同方向自动生成简历页面。

这个分支的核心目标是：

```text
项目文章
-> AI / 规则提取结构化项目数据
-> 生成 projects.generated.json
-> 按方向生成 resumes.generated.json
-> 写入多个简历页面
-> Hexo 构建并发布
```

为此新增了几类文件：

```text
source/projects/*.md
source/_data/resume-profile.json
source/_data/resume-directions.json
source/_data/projects.generated.json
source/_data/resumes.generated.json
tools/generate-resume-data.mjs
source/css/resume.css
```

项目文章通过 front matter 标注是否参与简历生成，以及适合的方向和技术栈：

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
weight: 80
```

生成脚本会读取 `source/projects/` 下的 Markdown，解析 front matter 和正文内容。如果配置了 DeepSeek API Key，就尝试调用 DeepSeek 生成结构化项目 JSON；如果 API 不可用，则回退到本地规则提取，保证构建流程不中断。

这个设计里我最看重的是“可降级”。AI 生成的内容质量可能更好，但个人站点的构建不能因为 API 临时失败就完全中断。因此脚本中保留了本地 fallback，并在输出中区分：

```text
Generated ... with DeepSeek API
Generated ... with local fallback
```

后来又进一步把 API Key 配置从临时终端环境变量调整为项目根目录 `.env`：

```env
DEEPSEEK_API_KEY=你的真实 DeepSeek API Key
```

本地脚本会读取 `.env`，而 GitHub Actions 中则通过仓库 Secrets 注入：

```yaml
env:
  DEEPSEEK_API_KEY: ${{ secrets.DEEPSEEK_API_KEY }}
run: npm run build
```

同时，`package.json` 的构建流程也可以升级为：

```json
{
  "resume:generate": "node tools/generate-resume-data.mjs",
  "build": "npm run resume:generate && hexo generate"
}
```

这样新增项目文章以后，只要执行构建，简历数据和简历页面就会一起更新。

## 这次搭建中踩过的坑

这个项目虽然不大，但很适合暴露静态站点搭建中常见的几个问题。

第一，源码文件路径不等于线上访问路径。Hexo 会根据 `source/` 下的文件结构生成 HTML，`.md` 文件本身不会直接作为网页暴露出来。

第二，构建产物不应该当作源码提交。`public/`、`db.json`、`node_modules/` 都应该由本地或 CI 重新生成。

第三，YAML 配置要当代码看待。缩进、重复键、编码异常都会直接导致站点无法启动。

第四，静态站点没有后端，不适合假装自己有提交前的服务端逻辑。评论审核、AI 过滤这类能力要么依赖第三方平台，要么通过 GitHub Actions / Webhook 做异步处理。

第五，AI 能增强内容生产，但不能替代工程兜底。API Key、调用失败、输出格式不稳定都需要被考虑进构建流程。

## 最终收获

这次项目让我重新理解了“个人技术门户”这件事。

它不只是一个展示页面，而是一个小型内容工程：文章、项目、简历、搜索、评论、部署和自动化脚本都在同一个工作流里协作。

从工程角度看，这个项目完成了几件事：

- 用 Hexo 和 Butterfly 搭建了可维护的个人技术门户。
- 用 GitHub Actions 建立了从源码提交到线上部署的自动化闭环。
- 将简历从单文件整理成可扩展的多版本页面系统。
- 通过 Giscus 接入评论能力，并理解了静态站点评论审核的边界。
- 在实验分支中实现了从项目文章到结构化 JSON、再到多方向简历页面的自动生成流程。

更重要的是，它让我把“写博客”和“维护个人经历”放进了同一个系统里。以后新增一个项目，不只是多写一篇文章，也可以沉淀为项目页、简历经历和搜索内容的一部分。

这就是我希望这个站点长期具备的能力：它不是一次性完成的作品，而是一个会随着学习、项目和复盘不断更新的个人技术资产库。

## 后续计划

接下来这个项目还可以继续往几个方向演进：

- 将 `test_ai_resume` 分支中的 AI 简历生成能力稳定合并到主线。
- 为简历页面增加打印样式，支持更友好的 PDF 导出。
- 为项目文章补充统一模板，让 AI 提取结果更加稳定。
- 为 Giscus 评论增加 GitHub Actions 异步审核流程。
- 继续完善搜索、标签和项目分类，让内容之间的关联更清晰。

从一个 Hexo 初始化站点走到这里，过程并不复杂，但每一步都在把它从“能访问”推进到“可维护、可扩展、可复用”。这也是我觉得这个项目真正有价值的地方。
