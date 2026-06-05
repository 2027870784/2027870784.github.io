import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
await loadEnvFile(path.join(rootDir, '.env'));

const promptFile = path.join(rootDir, 'prompts', 'resume.json');
const projectsDir = path.join(rootDir, 'source', 'projects');

const DEEPSEEK_BASE_URL = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '');
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || `${DEEPSEEK_BASE_URL}/chat/completions`;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

async function main() {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('Missing DEEPSEEK_API_KEY. Set it in .env or the environment before running this script.');
  }

  const config = await readJson(promptFile);
  const projects = await readProjectSources(projectsDir);
  if (projects.length === 0) {
    throw new Error('No resume projects found under source/projects.');
  }

  const markdown = await callDeepSeek(config, projects);
  const output = normalizeMarkdown(markdown, config);
  validateMarkdown(output);

  const outputPath = path.resolve(rootDir, config.output || 'source/resume/ai/index.md');
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${output.trim()}\n`, 'utf8');

  console.log(`Generated AI resume from ${projects.length} project(s): ${path.relative(rootDir, outputPath).replace(/\\/g, '/')}`);
}

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
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function readProjectSources(dir) {
  const files = await listMarkdownFiles(dir);
  const sources = [];

  for (const file of files) {
    if (path.basename(file).toLowerCase() === 'index.md') continue;

    const raw = await readFile(file, 'utf8');
    const { frontMatter, content } = parseMarkdown(raw);
    if (frontMatter.resume === false || frontMatter.resume === 'false') continue;

    sources.push({
      file: path.relative(rootDir, file).replace(/\\/g, '/'),
      title: frontMatter.title || firstHeading(content) || path.basename(file, '.md'),
      role: frontMatter.role || '',
      weight: Number(frontMatter.weight || 50),
      directions: toArray(frontMatter.directions),
      techStack: toArray(frontMatter.tech_stack || frontMatter.techStack),
      github: frontMatter.github || '',
      content: content.trim()
    });
  }

  return sources.sort((a, b) => b.weight - a.weight || a.title.localeCompare(b.title, 'zh-CN'));
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
  return trimmed.replace(/^["']|["']$/g, '');
}

function firstHeading(content) {
  return content.match(/^#\s+(.+)$/m)?.[1]?.trim();
}

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

async function callDeepSeek(config, projects) {
  const modelOptions = config.modelOptions || {};
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || config.model || DEEPSEEK_MODEL,
      messages: [
        {
          role: 'system',
          content: config.systemPrompt || '你是中文技术简历顾问。请只输出 Markdown。'
        },
        {
          role: 'user',
          content: buildUserPrompt(config, projects)
        }
      ],
      temperature: Number(modelOptions.temperature ?? 0.2),
      max_tokens: Number(process.env.DEEPSEEK_MAX_TOKENS || modelOptions.maxTokens || 4000),
      stream: false
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DeepSeek request failed: HTTP ${response.status}: ${text.slice(0, 300)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('DeepSeek returned empty content.');
  return content;
}

function buildUserPrompt(config, projects) {
  return [
    `当前日期：${formatDate()}`,
    '',
    '个人信息：',
    formatObject(config.profile || {}),
    '',
    '生成要求：',
    formatList(config.requirements || []),
    '',
    '建议输出结构：',
    formatList(config.structure || []),
    '',
    '输出要求补充：',
    `- Hexo front-matter 的 title 使用：${config.title || 'AI 生成简历'}`,
    '- 只返回最终 Markdown 内容，不要解释生成过程。',
    '- 不要使用 ``` 包裹 Markdown。',
    '',
    '项目经历原文：',
    projects.map(formatProject).join('\n\n---\n\n')
  ].join('\n');
}

function formatObject(value) {
  return Object.entries(value)
    .map(([key, item]) => `- ${key}: ${Array.isArray(item) ? item.join('、') : item}`)
    .join('\n');
}

function formatList(items) {
  return toArray(items).map((item) => `- ${item}`).join('\n');
}

function formatProject(project) {
  return [
    `文件：${project.file}`,
    `标题：${project.title}`,
    project.role ? `角色：${project.role}` : '',
    project.techStack.length ? `技术栈：${project.techStack.join('、')}` : '',
    project.directions.length ? `方向：${project.directions.join('、')}` : '',
    project.github ? `GitHub：${project.github}` : '',
    `权重：${project.weight}`,
    '',
    project.content
  ].filter(Boolean).join('\n');
}

function normalizeMarkdown(markdown, config) {
  let output = markdown.trim();
  output = output.replace(/^```(?:markdown|md)?\s*/i, '').replace(/\s*```$/i, '').trim();

  if (!output.startsWith('---')) {
    output = `---\ntitle: ${config.title || 'AI 生成简历'}\ndate: ${formatDate()}\n---\n\n${output}`;
  }

  output = output.replace(/date:\s*\{\{date\}\}/, `date: ${formatDate()}`);
  return output;
}

function validateMarkdown(markdown) {
  if (markdown.length < 300) {
    throw new Error('AI resume output is too short. Refusing to overwrite output file.');
  }

  const requiredSections = ['## 教育背景', '## 核心技能', '## 项目经历'];
  const missing = requiredSections.filter((section) => !markdown.includes(section));
  if (missing.length > 0) {
    throw new Error(`AI resume output is missing required section(s): ${missing.join(', ')}`);
  }
}

function formatDate() {
  return new Date().toISOString().slice(0, 10);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
