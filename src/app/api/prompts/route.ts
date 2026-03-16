import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';
import { getActiveDataSource, getImportDir } from '@/lib/claude-data/data-source';
import type { SessionMessage } from '@/lib/claude-data/types';

export const dynamic = 'force-dynamic';

// ── Classification heuristics ──────────────────────────────────

const CATEGORY_RULES: [string, RegExp[]][] = [
  // Short confirmations / acknowledgements (must be early to catch before broader patterns)
  ['Confirmation',         [/^yes\b/i, /^no\b/i, /^ok\b/i, /^okay\b/i, /^sure\b/i, /^yea\b/i, /^ya\b/i, /^yeah\b/i, /^yep\b/i, /^nope\b/i, /^done\b/i, /^thanks\b/i, /^thank you/i, /^great\b/i, /^go ahead/i, /^do it/i, /^I'll do it/i, /^keep it/i, /^this is great/i, /^that's right/i, /^correct\b/i, /^exactly\b/i, /^looks great/i]],
  // Continuation & flow control
  ['Continuation',         [/continue/i, /\bresume\b/i, /\bpause\b/i, /\bstop\b/i, /from where you left off/i, /keep going/i, /carry on/i, /please do/i]],
  // Editing existing content (update, change, undo, replace, adjust, shorten, indent)
  ['Editing & revision',   [/\bupdate\b/i, /\bchange\b/i, /\bundo\b/i, /\breplace\b/i, /\badjust\b/i, /\brevert\b/i, /\bshorter\b/i, /\bindent/i, /\bunindent/i, /\bcredit\b/i, /\bconsistent\b/i, /\bget rid of\b/i, /\bremove\b/i, /please also\b/i, /back to\b/i, /it's not\b.*it's\b/i, /change it back/i, /can you adjust/i, /please use\b/i]],
  // Status & context questions
  ['Status & context',     [/what happened/i, /current status/i, /what did I do/i, /did it work/i, /what changes/i, /what's the (current|different)/i, /which files/i, /how many/i, /can you show/i, /where did/i, /do you see/i, /show up/i, /which .* do you/i, /what tools/i, /can you give/i]],
  ['Code & debugging',     [/debug/i, /error/i, /fix\b/i, /bug/i, /why does(n't)?/i, /not work/i, /traceback/i, /stack trace/i, /fails?\b/i, /crash/i, /wrong/i, /issue/i, /broken/i, /doesn't seem right/i, /that doesn't/i]],
  ['Code generation',      [/create a/i, /generate/i, /implement/i, /can you make/i, /write a script/i, /write a function/i, /add a\b/i, /add the\b/i, /add to\b/i, /scaffold/i, /set up/i, /new file/i]],
  ['Writing & drafting',   [/draft/i, /email/i, /\bwrite\b(?! a (script|function|test))/i, /rewrite/i, /rephrase/i, /wordsmith/i, /shorten/i, /summarize/i, /one-pager/i, /readme/i, /documentation/i, /docs\b/i, /docx/i, /memo\b/i, /executive summary/i, /appendix/i, /conclusion/i]],
  ['Explanation',          [/explain/i, /how does/i, /what is/i, /difference between/i, /why is/i, /why did/i, /what does/i, /what are/i, /how do/i, /how can/i, /\bis it possible/i, /\bis there a/i, /\bdoes (this|it|that)\b/i, /\bdo I need/i, /\bdo the\b/i, /\bwhich .* use/i, /\bare you sure/i, /\bwhy do\b/i, /\bwhat endian/i, /\bwhat kind/i, /\bis .* compatible/i, /\bwhat('s| is) the\b/i, /\?$/]],
  ['Refactoring',          [/refactor/i, /improve/i, /clean up/i, /optimize/i, /make it/i, /rename/i, /move\b/i, /restructure/i, /reorganize/i, /simplify/i]],
  ['Git & version control',[/\bcommit/i, /\bpush\b/i, /\bpull request/i, /\bPR\b/, /\bbranch/i, /\bmerge/i, /\brebase/i, /\bgit\b/i, /gitignore/i, /co-author/i, /\bopen PRs\b/i, /license/i]],
  ['Testing & CI',         [/\btest/i, /\brun\b/i, /\bbuild\b/i, /make\s+\w+/i, /pass(es|ing)?\b/i, /pytest/i, /mypy/i, /lint/i, /ci\b/i, /check\b/i, /coverage/i, /example/i]],
  ['Research & lookup',    [/search/i, /find\b/i, /look up/i, /what are the/i, /compare/i, /\blist\b/i, /investigate/i, /research/i, /look into/i, /competitive analysis/i, /study\b/i]],
  ['Review & feedback',    [/review/i, /feedback/i, /is this valid/i, /anything missing/i, /can you check/i, /is this (correct|right|ok)/i, /looks? good/i]],
  ['DevOps & config',      [/docker/i, /kubernetes/i, /minikube/i, /gcloud/i, /npm/i, /pip/i, /install/i, /deploy/i, /config/i, /makefile/i, /\.env\b/i, /cluster/i, /pod/i, /container/i, /cloud/i, /start\.sh/i]],
  ['Data & analysis',      [/analyze/i, /\bdata\b/i, /csv/i, /chart/i, /visuali/i, /table/i, /graph/i, /plot/i]],
  ['Task & planning',      [/\btask/i, /\bplan\b/i, /\bprep\b/i, /prepare/i, /meeting/i, /weekly/i, /schedule/i, /roadmap/i, /do my\b/i, /do today/i]],
];

const TONE_RULES: [string, RegExp[]][] = [
  // Confirmatory (including extended: "yes please...", "sure, ...")
  ['Confirmatory',         [/^yes\b/i, /^no\b/i, /^ok\b/i, /^okay\b/i, /^sure\b/i, /^go ahead/i, /^do it/i, /^yep\b/i, /^nope\b/i, /^yeah\b/i, /^yea\b/i, /^ya\b/i, /^looks good/i, /^that's right/i, /^correct\b/i, /^exactly\b/i, /^done\b/i, /^great\b/i, /^thanks\b/i, /^thank you/i, /^this is great/i, /^looks great/i]],
  // Polite directives ("can you...", "please...", "how do I...")
  ['Direct & polite',     [/^can you/i, /^please/i, /^how do I/i, /^what is/i, /^is this/i, /^help\b/i]],
  // Terse imperatives — bare verb commands without politeness markers
  ['Terse / imperative',  [/^do\b/i, /^prepare/i, /^install/i, /^set up/i, /^submit/i, /^put\b/i, /^open\b/i, /^clone/i, /^source\b/i, /^use\b/i, /^give\b/i, /^convert/i, /^turn\b/i, /^stop\b/i, /^start/i, /^get\b/i, /^upload/i, /^close/i, /^continue/i, /^resume/i, /^pause/i, /^keep\b/i, /^skip/i, /^import/i, /^update/i, /^add\b/i, /^run\b/i, /^show\b/i, /^make\b/i, /^rename/i, /^remove/i, /^move\b/i, /^create\b/i, /^implement/i, /^build\b/i, /^deploy/i, /^commit/i, /^push\b/i, /^pull\b/i, /^merge/i, /^revert/i, /^prep\b/i]],
  // Questioning — asking why, how, what, whether
  ['Questioning',          [/^why\b/i, /^when\b/i, /^where\b/i, /^which\b/i, /^how\b/i, /^is\b/i, /^does\b/i, /^did\b/i, /^are\b/i, /^what\b/i, /^could\b/i, /^has\b/i, /^have\b/i, /^will\b/i, /^was\b/i, /\?$/]],
  // Providing context / correction (user gives info rather than asks)
  ['Contextual',           [/^the\b/i, /^I\b/i, /^it's\b/i, /^its\b/i, /^so\b/i, /^we\b/i, /^this\b/i, /^that\b/i, /^there\b/i, /^I've\b/i, /^I'm\b/i, /^I think/i]],
  // Exploratory — open-ended brainstorming
  ['Exploratory',          [/what if/i, /I've been thinking/i, /how about/i, /good name/i, /recommend/i, /suggest/i, /should I/i, /would it/i, /could we/i]],
  // Collaborative
  ['Collaborative',        [/can we/i, /let's/i, /together/i, /iterate/i, /I was thinking/i, /we need/i, /we should/i]],
  // Urgent / unblocking
  ['Urgent / unblocking',  [/help:/i, /not work/i, /broken/i, /blocked/i, /asap/i, /urgent/i, /quick question/i, /doesn't work/i]],
];

function classify(text: string, rules: [string, RegExp[]][]): string {
  for (const [label, patterns] of rules) {
    if (patterns.some((p) => p.test(text))) return label;
  }
  return 'Other';
}

function qualitySignals(text: string) {
  return {
    hasContext:      text.length > 200 || /```/.test(text) || /http/i.test(text),
    hasSpecificAsk: /can you|please|how do|what is|help me/i.test(text),
    hasExamples:    /```/.test(text) || /example/i.test(text) || /attached/i.test(text),
    isVague:        text.length < 40 && !/\?/.test(text),
  };
}

// Patterns for system/machine-generated messages that aren't real user prompts
const SYSTEM_NOISE_PATTERNS = [
  /^<local-command/,
  /^<command-name>/,
  /^<command-message>/,
  /^<task-notification>/,
  /^<bash-stdout>/,
  /^<bash-stderr>/,
  /^<bash-input>/,
  /^<system-reminder>/,
  /^\[Request interrupted/,
  /^\[Image:/,
  /^This session is being continued from a previous conversation/,
  /^Tool loaded/,
  /^Base directory for this skill:/,
  /^Unknown skill:/,
  /^Skip to content\b/,
];

function isSystemNoise(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (SYSTEM_NOISE_PATTERNS.some(p => p.test(trimmed))) return true;
  // Filter very short non-word gibberish (typos, partial commands like "ext", "la", "gst", "~ls")
  if (trimmed.length <= 5 && !/\?/.test(trimmed) && !/^(yes|no|ok|yea|ya|yep|done|sure)$/i.test(trimmed)) return true;
  return false;
}

function extractUserText(msg: SessionMessage): string | null {
  if (msg.type !== 'user' || msg.message?.role !== 'user') return null;
  const content = msg.message.content;
  let text = '';
  if (typeof content === 'string') {
    text = content;
  } else if (Array.isArray(content)) {
    const parts = content
      .map((c: Record<string, unknown>) => {
        if (c.type === 'text') return c.text as string;
        return '';
      })
      .filter(Boolean);
    text = parts.join('\n');
  }
  if (!text || text.startsWith('[Tool Result]') || isSystemNoise(text)) return null;
  return text;
}

// ── Route handler ──────────────────────────────────────────────

function getClaudeDir(): string {
  if (getActiveDataSource() === 'imported') {
    return path.join(getImportDir(), 'claude-data');
  }
  return path.join(os.homedir(), '.claude');
}

function getProjectsDir(): string {
  return path.join(getClaudeDir(), 'projects');
}

export async function GET() {
  const projectsDir = getProjectsDir();
  if (!fs.existsSync(projectsDir)) {
    return NextResponse.json({ totalPrompts: 0, avgLength: 0, topCategory: 'N/A', qualityScore: '0%', categories: [], tones: [], qualityBreakdown: [], weeklyActivity: [] });
  }

  const userMessages: { text: string; timestamp: string }[] = [];
  const tokenEvents: { timestamp: string; input: number; output: number }[] = [];

  const projectEntries = fs.readdirSync(projectsDir);
  for (const entry of projectEntries) {
    const projectPath = path.join(projectsDir, entry);
    if (!fs.statSync(projectPath).isDirectory()) continue;

    const jsonlFiles = fs.readdirSync(projectPath).filter(f => f.endsWith('.jsonl'));
    for (const file of jsonlFiles) {
      const filePath = path.join(projectPath, file);
      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

      for await (const line of rl) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line) as SessionMessage;
          const text = extractUserText(msg);
          if (text) {
            userMessages.push({ text, timestamp: msg.timestamp });
          }
          // Collect token usage from assistant messages
          if (msg.type === 'assistant' && msg.message?.usage && msg.timestamp) {
            const u = msg.message.usage as { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number };
            tokenEvents.push({
              timestamp: msg.timestamp,
              input: (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0),
              output: u.output_tokens || 0,
            });
          }
        } catch { /* skip malformed */ }
      }
    }
  }

  // Classify each message
  const catCounts: Record<string, number> = {};
  const toneCounts: Record<string, number> = {};
  const qualCounts = { hasContext: 0, hasSpecificAsk: 0, hasExamples: 0, isVague: 0 };
  const weeklyQual: Record<string, { total: number; hasContext: number; hasSpecificAsk: number; hasExamples: number; isVague: number }> = {};
  let totalLength = 0;

  for (const { text, timestamp } of userMessages) {
    const cat = classify(text, CATEGORY_RULES);
    catCounts[cat] = (catCounts[cat] || 0) + 1;

    const tone = classify(text, TONE_RULES);
    toneCounts[tone] = (toneCounts[tone] || 0) + 1;

    const q = qualitySignals(text);
    if (q.hasContext)      qualCounts.hasContext++;
    if (q.hasSpecificAsk)  qualCounts.hasSpecificAsk++;
    if (q.hasExamples)     qualCounts.hasExamples++;
    if (q.isVague)         qualCounts.isVague++;

    // Track quality per week
    const d = new Date(timestamp);
    const ws = new Date(d);
    ws.setDate(d.getDate() - d.getDay());
    const wk = ws.toISOString().slice(0, 10);
    if (!weeklyQual[wk]) weeklyQual[wk] = { total: 0, hasContext: 0, hasSpecificAsk: 0, hasExamples: 0, isVague: 0 };
    weeklyQual[wk].total++;
    if (q.hasContext)      weeklyQual[wk].hasContext++;
    if (q.hasSpecificAsk)  weeklyQual[wk].hasSpecificAsk++;
    if (q.hasExamples)     weeklyQual[wk].hasExamples++;
    if (q.isVague)         weeklyQual[wk].isVague++;

    totalLength += text.length;
  }

  // Build weekly activity buckets
  const weekBuckets: Record<string, number> = {};
  for (const { timestamp } of userMessages) {
    const d = new Date(timestamp);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    weekBuckets[key] = (weekBuckets[key] || 0) + 1;
  }

  const total = userMessages.length || 1;
  const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

  return NextResponse.json({
    totalPrompts: userMessages.length,
    avgLength: Math.round(totalLength / total),
    topCategory,
    qualityScore: `${Math.round(((qualCounts.hasContext + qualCounts.hasSpecificAsk) / (2 * total)) * 100)}%`,
    categories: Object.entries(catCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    tones: Object.entries(toneCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    qualityBreakdown: [
      { name: 'Clear context provided',   pct: Math.round((qualCounts.hasContext / total) * 100) },
      { name: 'Specific ask',             pct: Math.round((qualCounts.hasSpecificAsk / total) * 100) },
      { name: 'Includes examples / refs',  pct: Math.round((qualCounts.hasExamples / total) * 100) },
      { name: 'Vague / underspecified',    pct: Math.round((qualCounts.isVague / total) * 100) },
    ],
    weeklyActivity: Object.entries(weekBuckets)
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week)),
    weeklyQuality: Object.entries(weeklyQual)
      .map(([week, w]) => ({
        week,
        qualityScore: Math.round(((w.hasContext + w.hasSpecificAsk) / (2 * (w.total || 1))) * 100),
        contextPct: Math.round((w.hasContext / (w.total || 1)) * 100),
        specificAskPct: Math.round((w.hasSpecificAsk / (w.total || 1)) * 100),
        examplesPct: Math.round((w.hasExamples / (w.total || 1)) * 100),
        vaguePct: Math.round((w.isVague / (w.total || 1)) * 100),
      }))
      .sort((a, b) => a.week.localeCompare(b.week)),
    weeklyTokens: buildWeeklyTokens(tokenEvents),
    tips: generateTips(qualCounts, total, totalLength, catCounts, toneCounts),
  });
}

// ── Weekly token aggregation ───────────────────────────────────

function buildWeeklyTokens(events: { timestamp: string; input: number; output: number }[]) {
  const buckets: Record<string, { input: number; output: number }> = {};
  for (const { timestamp, input, output } of events) {
    const d = new Date(timestamp);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    if (!buckets[key]) buckets[key] = { input: 0, output: 0 };
    buckets[key].input += input;
    buckets[key].output += output;
  }
  return Object.entries(buckets)
    .map(([week, { input, output }]) => ({ week, input, output, total: input + output }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

// ── Tips generation ────────────────────────────────────────────

interface Tip {
  area: string;
  observation: string;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
}

function generateTips(
  qual: { hasContext: number; hasSpecificAsk: number; hasExamples: number; isVague: number },
  total: number,
  totalLength: number,
  cats: Record<string, number>,
  tones: Record<string, number>,
): Tip[] {
  const tips: Tip[] = [];
  const pctContext = Math.round((qual.hasContext / total) * 100);
  const pctSpecific = Math.round((qual.hasSpecificAsk / total) * 100);
  const pctExamples = Math.round((qual.hasExamples / total) * 100);
  const pctVague = Math.round((qual.isVague / total) * 100);
  const avgLen = Math.round(totalLength / total);

  if (pctVague > 15) {
    tips.push({
      area: 'Specificity',
      observation: `${pctVague}% of your prompts are short and vague (under 40 chars, no question mark).`,
      suggestion: 'Add what you want changed and why — e.g., instead of "fix this", try "fix the null check in parseUser — it crashes when email is missing".',
      impact: 'high',
    });
  }

  if (pctContext < 40) {
    tips.push({
      area: 'Context',
      observation: `Only ${pctContext}% of prompts include context (code snippets, URLs, or 200+ chars of detail).`,
      suggestion: 'Paste the relevant code block, error message, or link directly into your prompt. Claude can\'t see your screen — the more context you provide, the less back-and-forth.',
      impact: 'high',
    });
  }

  if (pctExamples < 20) {
    tips.push({
      area: 'Examples',
      observation: `Only ${pctExamples}% of prompts include examples or references (code blocks, sample output, "like this").`,
      suggestion: 'Show an example of what you want. "Format it like this: ..." or "here\'s the expected output: ..." gives Claude a concrete target to hit.',
      impact: 'medium',
    });
  }

  if (pctSpecific < 50) {
    tips.push({
      area: 'Clear ask',
      observation: `Only ${pctSpecific}% of prompts contain a clear, explicit ask.`,
      suggestion: 'Start with what you need: "Please refactor X to Y" or "Can you explain why Z happens?" An explicit ask avoids guesswork.',
      impact: 'medium',
    });
  }

  if (avgLen < 80) {
    tips.push({
      area: 'Prompt length',
      observation: `Your average prompt is ${avgLen} characters — quite terse.`,
      suggestion: 'Slightly longer prompts (100–300 chars) that include the "what" and "why" tend to get better first-try results and reduce follow-up rounds.',
      impact: 'medium',
    });
  }

  const confirmPct = Math.round(((tones['Confirmatory'] || 0) / total) * 100);
  if (confirmPct > 20) {
    tips.push({
      area: 'Confirmation overhead',
      observation: `${confirmPct}% of your messages are simple confirmations ("yes", "sure", "ok").`,
      suggestion: 'When confirming, add your next instruction in the same message — e.g., "Yes, and also add a test for the edge case." This cuts round-trips in half.',
      impact: 'low',
    });
  }

  const continuePct = Math.round(((cats['Continuation'] || 0) / total) * 100);
  if (continuePct > 5) {
    tips.push({
      area: 'Continuation prompts',
      observation: `${continuePct}% of your prompts are continuation requests ("continue", "resume", "keep going").`,
      suggestion: 'When continuing, restate the goal with any new constraints — "Continue, but skip the migration step and focus on the API tests." This prevents drift.',
      impact: 'low',
    });
  }

  const debugPct = Math.round(((cats['Code & debugging'] || 0) / total) * 100);
  if (debugPct > 15) {
    tips.push({
      area: 'Debugging',
      observation: `${debugPct}% of your prompts are debugging-related.`,
      suggestion: 'Include the full error message and the command that triggered it. If there\'s a stack trace, paste it — Claude can pinpoint the issue much faster with the raw output.',
      impact: 'medium',
    });
  }

  // Always include at least one general tip
  if (tips.length === 0) {
    tips.push({
      area: 'Overall',
      observation: 'Your prompts are well-structured across the board.',
      suggestion: 'Consider adding acceptance criteria to complex requests — "Done when: tests pass, no new warnings, and the README is updated." This sets a clear finish line.',
      impact: 'low',
    });
  }

  return tips.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.impact] - order[b.impact];
  });
}
