import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
await loadEnvFile(path.join(rootDir, '.env'));

const sourceDir = path.join(rootDir, 'source');
const dataDir = path.join(sourceDir, '_data');
const projectsDir = path.join(sourceDir, 'projects');
const resumeDir = path.join(sourceDir, 'resume');
const aiResumeDir = path.join(resumeDir, 'ai');

const DEEPSEEK_BASE_URL = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '');
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || `${DEEPSEEK_BASE_URL}/chat/completions`;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
const DEEPSEEK_MAX_TOKENS = Number(process.env.DEEPSEEK_MAX_TOKENS || 4000);
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
let deepSeekSuccessCount = 0;
let deepSeekFailureCount = 0;

const RELEVANCE_ALIASES = {
  'C++': ['cpp', 'c plus plus'],
  'STL 容器': ['stl'],
  '内存管理': ['memory'],
  '面向对象设计': ['oop', '对象'],
  'MVP 变换': ['mvp', 'model', 'view', 'projection'],
  '重心坐标插值': ['重心坐标', '插值'],
  '深度测试': ['z-buffer', 'z buffer', '深度缓冲'],
  'Lambert 漫反射': ['lambert', '漫反射'],
  'Blinn-Phong 光照模型': ['blinn-phong', 'phong'],
  '线性代数': ['矩阵', '向量', '坐标变换', '齐次坐标', '投影', 'mvp'],
  '矩阵变换': ['矩阵', 'mvp', '变换'],
  '向量运算': ['向量', 'vector'],
  '数据结构': ['数据结构', '容器'],
  '算法分析': ['算法', '光栅化', 'aabb', '遍历', '预筛', '重心坐标', 'z-buffer'],
  '微积分': ['微积分'],
  '离散数学': ['离散数学'],
  'C++ 程序设计': ['c++', 'cpp'],
  'GAMES101': ['games101', 'graphics', '图形学', '渲染管线', '光栅化']
};

async function loadEnvFile(filePath) {
  let content;
  try {
    content = await readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function main() {
  await mkdir(dataDir, { recursive: true });
  await mkdir(aiResumeDir, { recursive: true });

  const profile = await readJson(path.join(dataDir, 'resume-profile.json'));
  const directions = await readJson(path.join(dataDir, 'resume-directions.json'));
  const projectSources = await readProjectSources(projectsDir);

  const projects = [];
  for (const source of projectSources) {
    projects.push(await summarizeProject(source));
  }

  projects.sort((a, b) => (b.weight || 0) - (a.weight || 0));

  const resumes = directions.map((direction) => buildResume(direction, profile, projects));

  await writeJson(path.join(dataDir, 'projects.generated.json'), projects);
  await writeJson(path.join(dataDir, 'resumes.generated.json'), resumes);
  for (const resume of resumes) {
    await writeResumePage(resume);
  }

  if (DEEPSEEK_API_KEY && deepSeekSuccessCount > 0) {
    console.log(`Generated ${projects.length} projects and ${resumes.length} resumes with DeepSeek API. Success: ${deepSeekSuccessCount}, fallback: ${deepSeekFailureCount}.`);
  } else if (DEEPSEEK_API_KEY) {
    console.log(`Generated ${projects.length} projects and ${resumes.length} resumes with local fallback. DeepSeek attempts failed: ${deepSeekFailureCount}.`);
  } else {
    console.log(`Generated ${projects.length} projects and ${resumes.length} resumes with local fallback.`);
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function readProjectSources(dir) {
  const files = await listMarkdownFiles(dir);
  const sources = [];

  for (const file of files) {
    const relativeFile = path.relative(dir, file).replace(/\\/g, '/');
    if (relativeFile.toLowerCase() === 'index.md') continue;

    const raw = await readFile(file, 'utf8');
    const { frontMatter, content } = parseMarkdown(raw);
    if (frontMatter.resume === false || frontMatter.resume === 'false') continue;

    sources.push({
      id: projectIdFromFile(relativeFile),
      file: path.relative(rootDir, file).replace(/\\/g, '/'),
      frontMatter,
      content: content.trim()
    });
  }

  return sources;
}

function projectIdFromFile(relativeFile) {
  const normalized = relativeFile.replace(/\.md$/i, '');
  if (normalized.toLowerCase().endsWith('/index')) {
    return slugify(path.dirname(normalized).replace(/\\/g, '/'));
  }
  return slugify(normalized);
}

async function listMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

function parseMarkdown(raw) {
  if (!raw.startsWith('---')) return { frontMatter: {}, content: raw };

  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { frontMatter: {}, content: raw };

  const yaml = raw.slice(3, end).trim();
  const content = raw.slice(end + 4).trimStart();
  return { frontMatter: parseSimpleYaml(yaml), content };
}

function parseSimpleYaml(yaml) {
  const result = {};
  const lines = yaml.split(/\r?\n/);
  let activeKey = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    const listMatch = line.match(/^\s*-\s+(.+)$/);
    if (listMatch && activeKey) {
      result[activeKey].push(cleanYamlValue(listMatch[1]));
      continue;
    }

    const pairMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!pairMatch) continue;

    const [, key, rawValue] = pairMatch;
    if (rawValue === '') {
      result[key] = [];
      activeKey = key;
    } else {
      result[key] = cleanYamlValue(rawValue);
      activeKey = null;
    }
  }

  return result;
}

function cleanYamlValue(value) {
  const trimmed = value.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed);
  return trimmed.replace(/^['"]|['"]$/g, '');
}

async function summarizeProject(source) {
  const fallback = buildFallbackProject(source);
  if (!DEEPSEEK_API_KEY) return fallback;

  try {
    const aiProject = await callDeepSeek(source, fallback);
    deepSeekSuccessCount += 1;
    return normalizeProject({ ...fallback, ...aiProject, sourceFile: source.file });
  } catch (error) {
    deepSeekFailureCount += 1;
    console.warn(`DeepSeek failed for ${source.file}, using fallback. ${error.message}`);
    return fallback;
  }
}

function buildFallbackProject(source) {
  const frontMatter = source.frontMatter;
  const bullets = extractBullets(source.content);
  const paragraphs = extractParagraphs(source.content);

  const name = frontMatter.title || firstHeading(source.content) || source.id;
  const techStack = toArray(frontMatter.tech_stack || frontMatter.techStack);
  const summary = firstMeaningfulText(paragraphs, bullets, `${name} 项目实践。`);
  const highlights = bullets.slice(0, 6);

  return normalizeProject({
    id: source.id,
    name,
    role: frontMatter.role || '独立开发',
    directions: toArray(frontMatter.directions),
    techStack,
    summary,
    highlights,
    resumeBullets: highlights.slice(0, 4),
    links: frontMatter.github ? { github: frontMatter.github } : {},
    weight: Number(frontMatter.weight || 50),
    sourceFile: source.file
  });
}

function extractBullets(content) {
  return content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.match(/^\s*-\s+(.+)$/)?.[1]?.trim())
    .filter(Boolean)
    .map(cleanMarkdownText)
    .filter((line) => line.length >= 8)
    .map((line) => line.replace(/。?$/, ''));
}

function extractParagraphs(content) {
  return content
    .replace(/\r\n/g, '\n')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^#.*$/gm, '')
    .split(/\n{2,}/)
    .map(cleanMarkdownText)
    .filter((item) => item.length >= 20)
    .filter((item) => !/(项目类型|项目角色|项目定位|项目仓库|技术栈)[：:]/.test(item));
}

function cleanMarkdownText(value) {
  return String(value || '')
    .replace(/\*\*([^*：:]+)[：:]\*\*\s*/g, '$1：')
    .replace(/\*\*([^*]+)\*\*[：:]\s*/g, '$1：')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstHeading(content) {
  return content.match(/^#\s+(.+)$/m)?.[1]?.trim();
}

function firstMeaningfulText(paragraphs, bullets, fallback) {
  const paragraph = paragraphs.find((item) => !item.startsWith('-') && item.length >= 20);
  return paragraph || bullets[0] || fallback;
}

async function callDeepSeek(source, fallback) {
  const messages = [
    {
      role: 'system',
      content: `你是资深中文技术简历顾问。请把项目经历文章提炼为严格 JSON，不要输出 Markdown，不要输出解释。内容要真实克制，不要编造数字。

EXAMPLE JSON OUTPUT:
{
  "id": "soft-renderer",
  "name": "从零构建 C++ 3D 软光栅渲染器",
  "role": "独立开发",
  "directions": ["cpp", "graphics"],
  "techStack": ["C++", "MVP 变换", "Z-Buffer"],
  "summary": "独立实现软件渲染器，完成从模型输入到像素输出的基础渲染流程。",
  "highlights": ["实现 MVP 变换与三角形光栅化", "使用 Z-Buffer 处理遮挡关系"],
  "resumeBullets": ["独立使用 C++ 实现软件光栅渲染器，完成 MVP 变换、三角形光栅化和深度测试"],
  "links": {"github": "https://github.com/example/repo"},
  "weight": 90
}`
    },
    {
      role: 'user',
      content: JSON.stringify({
        task: '根据项目文章生成结构化简历项目 JSON。resumeBullets 应该是 2-4 条适合简历的一句话成果描述。',
        schema: {
          id: 'string',
          name: 'string',
          role: 'string',
          directions: ['string'],
          techStack: ['string'],
          summary: 'string',
          highlights: ['string'],
          resumeBullets: ['string'],
          links: { github: 'string optional' },
          weight: 'number'
        },
        fallback,
        frontMatter: source.frontMatter,
        content: source.content
      }, null, 2)
    }
  ];

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: DEEPSEEK_MAX_TOKENS,
      stream: false,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 300)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('empty response');

  return JSON.parse(content);
}

function normalizeProject(project) {
  return {
    id: slugify(project.id || project.name || 'project'),
    name: String(project.name || '未命名项目'),
    role: String(project.role || '独立开发'),
    directions: unique(toArray(project.directions).map(slugify).filter(Boolean)),
    techStack: unique(toArray(project.techStack || project.tech_stack).map(String).filter(Boolean)),
    summary: String(project.summary || ''),
    highlights: toArray(project.highlights).map(String).filter(Boolean).slice(0, 8),
    resumeBullets: toArray(project.resumeBullets).map(String).filter(Boolean).slice(0, 5),
    links: project.links || {},
    weight: Number(project.weight || 50),
    sourceFile: project.sourceFile || ''
  };
}

function buildResume(direction, profile, projects) {
  const scoredProjects = projects
    .map((project) => ({ project, score: scoreProject(project, direction) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || (b.project.weight || 0) - (a.project.weight || 0))
    .slice(0, direction.projectLimit || 4)
    .map(({ project }) => project);

  return {
    id: direction.id,
    title: direction.title,
    summary: direction.summary,
    generatedAt: new Date().toISOString(),
    profile,
    direction,
    projects: scoredProjects
  };
}

function scoreProject(project, direction) {
  const preferred = new Set(toArray(direction.preferredDirections).map(slugify));
  const keywords = toArray(direction.keywords).map((item) => item.toLowerCase());
  const projectDirections = toArray(project.directions).map(slugify);
  const hasPreferredDirection = projectDirections.some((item) => preferred.has(item));
  if (direction.id !== 'general-software' && preferred.size && projectDirections.length && !hasPreferredDirection) {
    return 0;
  }

  const haystack = [project.name, project.summary, ...project.techStack, ...project.highlights, ...project.resumeBullets]
    .join(' ')
    .toLowerCase();

  let score = 0;
  for (const item of projectDirections) {
    if (preferred.has(item)) score += 100;
  }
  for (const keyword of keywords) {
    if (haystack.includes(keyword)) score += 10;
  }
  if (score > 0) score += project.weight || 0;
  return score;
}

async function writeResumePage(resume) {
  const dir = path.join(aiResumeDir, resume.id);
  await mkdir(dir, { recursive: true });

  const profile = resume.profile;
  const education = profile.education.map((item) => renderEducation(item, resume)).join('\n\n');
  const skills = renderSkills(resume);

  const projects = resume.projects.map(renderProject).join('\n\n');
  const extras = toArray(profile.extras).map((item) => `- ${item}`).join('\n');

  const content = `---\ntitle: ${resume.title}\ndate: ${formatDate()}\n---\n\n<div class="resume-doc">\n\n# ${profile.name}\n\n<div class="resume-contact">\n${profile.contact.email} · [GitHub](${profile.contact.github})\n</div>\n\n<div class="resume-target">${resume.summary}</div>\n\n## 教育背景\n\n${education}\n\n## 核心技能\n\n${skills}\n\n## 项目经历\n\n${projects || '- 暂无匹配项目，请为项目文章补充 directions 或 tech_stack。'}\n\n## 其他\n\n${extras}\n\n<div class="resume-meta">由 AI/规则在构建期根据项目文章自动生成。更新时间：${formatDateTime(resume.generatedAt)}</div>\n\n</div>\n`;

  await writeFile(path.join(dir, 'index.md'), content, 'utf8');
}

function renderEducation(item, resume) {
  const evidence = createProjectEvidence(resume);
  const highlights = toArray(item.highlights).flatMap((highlight) => renderEducationHighlight(highlight, evidence));

  return [
    `### ${item.school} · ${item.major} · ${item.degree}`,
    item.period,
    ...highlights
  ].join('\n');
}

function renderEducationHighlight(highlight, evidence) {
  const courseMatch = String(highlight).match(/^相关课程[：:]\s*(.+)$/);
  if (courseMatch) {
    const courses = courseMatch[1]
      .split(/[、,，]/)
      .map((course) => course.trim())
      .filter(Boolean)
      .filter((course) => matchesEvidence(course, evidence));

    return courses.length ? [`- 相关课程：${courses.join('、')}`] : [];
  }

  return matchesEvidence(highlight, evidence) ? [`- ${highlight}`] : [];
}

function renderSkills(resume) {
  const evidence = createProjectEvidence(resume);
  const lines = [];
  const coveredItems = [];

  for (const skill of toArray(resume.profile.skills)) {
    const items = toArray(skill.items)
      .filter((item) => matchesEvidence(item, evidence));
    if (!items.length) continue;

    coveredItems.push(...items);
    lines.push(`- **${skill.category}**：${items.join('、')}`);
  }

  const projectTechStack = unique(resume.projects.flatMap((project) => toArray(project.techStack)))
    .filter((item) => !coveredItems.some((covered) => sameNormalizedTerm(covered, item)));
  if (projectTechStack.length) {
    lines.push(`- **项目技术栈**：${projectTechStack.join('、')}`);
  }

  return lines.join('\n') || '- 暂无匹配技能，请为项目文章补充 tech_stack。';
}

function createProjectEvidence(resume) {
  const text = resume.projects.map((project) => [
    project.name,
    ...toArray(project.directions),
    ...toArray(project.techStack),
    ...toArray(project.resumeBullets)
  ].join(' ')).join(' ');

  return normalizeForMatch(text);
}

function matchesEvidence(value, evidence) {
  const terms = relevanceTerms(value);
  return terms
    .map(normalizeForMatch)
    .filter(Boolean)
    .some((term) => evidence.includes(term));
}

function relevanceTerms(value) {
  const text = String(value || '');
  const terms = [text, ...toArray(RELEVANCE_ALIASES[text])];
  for (const [key, aliases] of Object.entries(RELEVANCE_ALIASES)) {
    if (key !== text && text.includes(key)) {
      terms.push(key, ...aliases);
    }
  }
  return terms;
}

function sameNormalizedTerm(a, b) {
  return normalizeForMatch(a) === normalizeForMatch(b);
}

function normalizeForMatch(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function renderProject(project) {
  const bullets = (project.resumeBullets.length ? project.resumeBullets : project.highlights)
    .slice(0, 4)
    .map((item) => `- ${item}`)
    .join('\n');
  const techStack = project.techStack.length ? `**技术栈：** ${project.techStack.join('、')}  \n` : '';
  const link = project.links?.github ? `\n\n[GitHub 链接](${project.links.github})` : '';

  return `### ${project.name}\n\n*${project.role}*  \n${techStack}${project.summary}\n\n${bullets}${link}`;
}

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function unique(items) {
  return [...new Set(items)];
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fa5_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
