#!/usr/bin/env node
// build-ebook.js -- Assemble HiveHelm e-book from template + chapters + front matter
// Uses pandoc for markdown-to-HTML conversion (safe: no user input in commands)

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const CHAPTERS_DIR = path.join(ROOT, 'chapters');
const TEMPLATE_PATH = path.join(ROOT, 'ebook-template.html');
const OUTPUT_HTML = path.join(ROOT, 'hivehelm-ebook.html');

// ─── Writer's content (from the copywriter agent) ───

const PREFACE_MD = `
This guide was extracted from a real system. Not transcribed from notes or assembled from blog posts -- extracted, the way you'd pull a component from a working piece of machinery to understand how it actually works.

The system it came from runs 30 agents organized into departments, executes 83 distinct skills, and runs 16 team blueprints that coordinate between 3 and 13 agents at a time. It runs a morning briefing every day. It manages work calendars, tracks health data, drafts content, and handles knowledge capture across seven life domains. It's been running in production, every day, for months.

This is not a research prototype. The patterns in this guide emerged from using this system until it broke, figuring out why it broke, fixing it, and using it until it broke again. The six-dimension skill scorecard in Chapter 7 exists because there was a need to know which of 83 skills were actually reliable and which were running on hope. The policy file in Chapter 4 exists because three agents had three different understandings of where content should go. The coordinator pattern in Chapter 2 exists because a coordinator that started implementing tasks degraded the whole system.

Every chapter is an answer to a real problem.

---

**Who this is for**

Three kinds of people tend to find this useful.

The first is someone who's running a few agents and starting to feel the friction. Things mostly work, but some tasks get misrouted, some agents do redundant work, and you spend more time herding agents than you should. You're looking for a structural approach, not more prompting tricks.

The second is someone building multi-agent systems for other people -- a team lead, an automation specialist, someone who's been asked to "make the AI stuff work" at their company. You need something you can explain, defend, and hand off. A methodology, not a magic configuration.

The third is the person who's not traditionally a developer but has figured out that these systems are within reach. You understand automation, you understand workflows, and you've been quietly building things other people said required an engineering degree. This guide is particularly for you. Chapter 8 makes the case explicitly: the skill set that makes agent systems reliable isn't primarily an engineering skill set. It's an organizational one.

---

**What you'll get**

Each chapter builds on the last. The book starts with structure (departments, personas, policies) and moves through operation (blueprints, observability) to continuous improvement (quality scoring, health dashboards).

What you'll get specifically: a department model for structuring agents into divisions, a persona framework that makes agent behavior predictable, a policy file format that centralizes governance, blueprint definitions for composable team assembly, an observability architecture that catches silent failures, a six-dimension skill scorecard, and a system health dashboard.

These are not theoretical constructs. They're files you can write today, adapted to whatever tools you're using. The methodology works in Claude Code, in custom agent frameworks, in production orchestration systems. It's independent of the tooling.

---

**What this is not**

This is not a framework. There's nothing to install, configure, or sign up for. The only dependencies are files.

This is not a complete theory of multi-agent systems. It doesn't cover formal verification, agent alignment at scale, or distributed consensus. Those are real topics. They're not what this guide is about.

This is not a beginner's introduction to AI agents. The chapters assume you've run at least one agent and have some sense of what goes wrong. If you haven't, they'll still make sense, but they'll feel more abstract than they need to.

What this is: a practitioner's guide, extracted from a working system, written for people who want to build something that keeps working next month.
`;

const ABOUT_AUTHOR_MD = `
Tolga Oral builds multi-agent systems at DeepL, the translation and AI company, where he works as Digital Lifecycle Manager and on their Agentic team. He is transitioning into a Head of Applied AI & Automation role, which he is building from scratch.

He is not a traditional software developer. His background is automation and operations: designing workflows, connecting systems, and building tools that other people rely on. The system described in this guide -- 30 agents, 83 skills, 16 team blueprints -- runs every day and handles his work operations, personal knowledge management, health tracking, content production, and consultancy work.

He has run more than 80 Claude Code sessions and exchanged more than 44,000 messages in three months. He does not consider this impressive. He considers it the cost of learning by building.

He is speaking at the Prompt developer conference about AI coding as a non-developer. He has strong opinions on the subject.

Outside of DeepL, he runs Verluna, a GTM Engineering consultancy based in Berlin focused on automation-led go-to-market operations.

He lives in Berlin.
`;

const CHAPTER_SUMMARIES = [
  { num: 1, title: 'The Problem: Agent Chaos', summary: 'Why multi-agent systems fail not from bad AI but from the same coordination failures that break any fast-growing organization, and what the five failure patterns look like in practice.' },
  { num: 2, title: 'The Department Model', summary: 'How to divide agents into divisions with clear ownership, which of four division structures fits which kind of work, and why the coordinator pattern is the most important structural decision you will make.' },
  { num: 3, title: 'Agent Personas That Work', summary: 'The identity framework that separates who an agent is from what it\'s told to do, and why a well-written persona governs behavior in every situation your instructions didn\'t anticipate.' },
  { num: 4, title: 'Policies as Code', summary: 'How to pull routing rules, write scopes, constraints, and approval gates out of individual agent definitions and into a single auditable JSONL file that every agent and hook in the system can read and enforce.' },
  { num: 5, title: 'Composing Teams', summary: 'Blueprint definitions that encode which agents run, in what order, under what conditions, so recurring workflows execute identically every time without reassembling the team from scratch.' },
  { num: 6, title: 'Observability', summary: 'JSONL event streams, distributed tracing across swarms, and semantic outcome classification that surfaces the silent failures traditional uptime monitoring will never catch.' },
  { num: 7, title: 'Quality and Health', summary: 'A six-dimension skill scorecard and system health dashboard that turn event data into specific, ranked actions for improving the whole system quarter over quarter.' },
  { num: 8, title: 'The Non-Developer Advantage', summary: 'Why operations thinking, not engineering instinct, is the primary skill agent systems require, and what both developers and non-developers each need to add to their toolkit.' },
];

// ─── Helpers ───

function mdToHtml(md) {
  // pandoc for markdown -> HTML fragment (no user input, safe static content)
  return execFileSync('pandoc', ['-f', 'markdown', '-t', 'html', '--no-highlight'], {
    input: md,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  }).trim();
}

function parseChapter(md) {
  const lines = md.split('\n');
  let title = '';
  let epigraph = '';
  let contentStart = 0;

  // Line 0: # Chapter N: Title
  if (lines[0].startsWith('# ')) {
    title = lines[0].replace(/^#\s*/, '');
    contentStart = 1;
  }

  // Skip blank lines after title
  while (contentStart < lines.length && lines[contentStart].trim() === '') {
    contentStart++;
  }

  // Check for epigraph (italic line: *text*)
  if (contentStart < lines.length && /^\*[^*]/.test(lines[contentStart].trim())) {
    epigraph = lines[contentStart].trim().replace(/^\*/, '').replace(/\*$/, '');
    contentStart++;
  }

  // Skip blank lines and leading ---
  while (contentStart < lines.length && (lines[contentStart].trim() === '' || lines[contentStart].trim() === '---')) {
    contentStart++;
  }

  // Strip web navigation links from chapter endings
  let content = lines.slice(contentStart).join('\n');
  content = content.replace(/\n---\n+\*\*(?:Previous|Next|Back to).*$/gms, '');
  content = content.replace(/\n\*\*(?:Previous|Next|Back to Table of Contents).*$/gm, '');
  return { title, epigraph, content };
}

// ─── Build ───

console.log('Building HiveHelm e-book...');

let html = fs.readFileSync(TEMPLATE_PATH, 'utf8');

// 1. Build TOC
const tocHtml = `
  <ul class="toc-list">
    <li><span class="toc-front-matter">Preface</span></li>
    ${CHAPTER_SUMMARIES.map(ch => `
    <li>
      <span class="toc-chapter-num">Chapter ${ch.num}</span>
      <span class="toc-chapter-title">${ch.title}</span>
      <span class="toc-chapter-summary">${ch.summary}</span>
    </li>`).join('')}
    <li><span class="toc-front-matter">About the Author</span></li>
  </ul>
`;
html = html.replace('<!-- TOC_CONTENT -->', tocHtml);

// 2. Inject preface
const prefaceHtml = mdToHtml(PREFACE_MD);
html = html.replace('<!-- PREFACE_CONTENT -->', prefaceHtml);

// 3. Inject about the author
const aboutHtml = mdToHtml(ABOUT_AUTHOR_MD);
html = html.replace('<!-- ABOUT_AUTHOR -->', aboutHtml);

// 4. Process and inject chapters
for (let i = 1; i <= 8; i++) {
  const num = String(i).padStart(2, '0');
  const files = fs.readdirSync(CHAPTERS_DIR).filter(f => f.startsWith(num));
  if (files.length === 0) {
    console.error(`Chapter ${i} not found`);
    process.exit(1);
  }

  const md = fs.readFileSync(path.join(CHAPTERS_DIR, files[0]), 'utf8');
  const { title, epigraph, content } = parseChapter(md);
  const contentHtml = mdToHtml(content);

  const chapterHtml = `
<article class="chapter">
  <header class="chapter-header">
    <span class="chapter-number">Chapter ${i}</span>
    <h1 class="chapter-title">${title.replace(/^Chapter\s+\d+:\s*/, '')}</h1>
    ${epigraph ? `<p class="chapter-epigraph">${epigraph}</p>` : ''}
  </header>
  <div class="content">
    ${contentHtml}
  </div>
</article>`;

  html = html.replace(`<!-- CHAPTER_${i} -->`, chapterHtml);
  console.log(`  Chapter ${i}: ${title}`);
}

// 5. Write output
fs.writeFileSync(OUTPUT_HTML, html, 'utf8');
console.log(`\nE-book HTML written to: ${OUTPUT_HTML}`);
console.log(`Size: ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);
