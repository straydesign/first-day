/**
 * Real-model eval of level-shaped plans. Spends Anthropic credits on the key in
 * .env.local (about $0.05-0.10 a call), so it is capped at MAX_CALLS.
 *
 *   npx tsx scripts/plan-eval.ts                 # run everything, write JSON + HTML
 *   npx tsx scripts/plan-eval.ts --render        # rebuild the HTML from the saved JSON (free)
 *   npx tsx scripts/plan-eval.ts --only guitar@50,guitar:easy   # re-run just these cases
 *
 * Week 1: 6 goals x levels 10 / 50 / 90 = 18 calls.
 * Week 2: 3 goals x (all "too easy" | all "too hard") after their level-50 week 1 = 6 calls.
 * Rewrites (non-action or repeated activities) are allowed only while the
 * budget still covers every first attempt that is left.
 *
 * Output: appstore/plan-eval.json (raw) and appstore/plan-eval.html (for Tom).
 */
import { AsyncLocalStorage } from "node:async_hooks";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { generateSprintWithAI, planIssues, type SprintGenContext } from "../src/lib/anthropic";
import { isDirectAction } from "../src/lib/plan-rules";
import { levelLabel, nextLevel, skillBand } from "../src/lib/skill-level";
import type { DayPlan, GoalFormData, SprintMeta } from "../src/types";

const ROOT = process.cwd();
const JSON_OUT = path.join(ROOT, "appstore/plan-eval.json");
const HTML_OUT = path.join(ROOT, "appstore/plan-eval.html");
/** Total model calls allowed across every run that shares plan-eval.json. */
const MAX_CALLS = 42; // 30 first run + 12 for the level-90 re-test (Tom OK 10-05)
let callCap = MAX_CALLS;
/** Sonnet-class list price, $ per million tokens (input, output). */
const PRICE = { input: 2, output: 10 };

const out = (s: string) => process.stdout.write(`${s}\n`);

// ---------------------------------------------------------------- env

function loadEnv(file: string): void {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]]) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

// ---------------------------------------------------------------- cases

interface GoalCase {
  id: string;
  input: GoalFormData;
}

const GOALS: GoalCase[] = [
  { id: "guitar", input: { goal: "Learn to play guitar", why: "I want to play songs with friends", timeCommitment: "20 minutes a day" } },
  { id: "5k", input: { goal: "Run a 5K", why: "I want to finish a race this year", timeCommitment: "30 minutes a day" } },
  { id: "spanish", input: { goal: "Hold a conversation in Spanish", why: "I'm traveling to Mexico", timeCommitment: "20 minutes a day" } },
  { id: "cooking", input: { goal: "Cook healthy weeknight dinners", why: "I want to stop ordering takeout", timeCommitment: "45 minutes a day" } },
  { id: "portraits", input: { goal: "Draw realistic portraits", why: "I want to draw my family", timeCommitment: "30 minutes a day" } },
  { id: "morning", input: { goal: "Build a morning routine", why: "I want calmer, more focused mornings", timeCommitment: "30 minutes a day" } },
];
const LEVELS = [10, 50, 90] as const;
const WEEK2_GOALS = ["guitar", "5k", "spanish"];
const WEEK2_BASE_LEVEL = 50;

type Path = "easy" | "hard";

interface CaseResult {
  key: string;
  goalId: string;
  goal: string;
  week: 1 | 2;
  level: number;
  priorLevel?: number;
  path?: Path;
  ok: boolean;
  rewrite: boolean;
  calls: number;
  days?: Record<number, DayPlan>;
  sprints?: SprintMeta[];
  checks?: Checks;
}

interface Checks {
  sevenDays: boolean;
  activityCounts: boolean;
  allActions: boolean;
  noRepeats: boolean;
  lastDayTest: boolean;
  levelMoves?: boolean;
  badDays: number[];
  nonActions: string[];
  repeats: string[];
  avgMinutes: number | null;
  avgNumbers: number;
}

const keyOf = (goalId: string, level: number, p?: Path) => (p ? `${goalId}@${level}:${p}` : `${goalId}@${level}`);

// ---------------------------------------------------------------- checks

function textOf(a: string | { text: string }): string {
  return typeof a === "string" ? a : a.text;
}

/** Heuristic only: does the last day read like a small test of the week? */
const TEST_WORDS = /start to finish|without stopping|from memory|full |whole |entire|all the way|test|time yourself|record yourself|in one go|nonstop|non-stop|no notes|perform|unbroken/i;

function check(days: Record<number, DayPlan>, sprint: number): Checks {
  const lo = (sprint - 1) * 7 + 1;
  const nums = Array.from({ length: 7 }, (_, i) => lo + i);
  const issues = planIssues(days);
  const badDays = nums.filter((n) => {
    const c = days[n]?.activities.length ?? 0;
    return c < 2 || c > 3;
  });
  const minutes: number[] = [];
  let numbers = 0;
  for (const n of nums) {
    const acts = (days[n]?.activities ?? []).map(textOf);
    let m = 0;
    for (const t of acts) {
      for (const hit of t.matchAll(/(\d+)\s*(?:-|to)?\s*(?:\d+\s*)?(?:min|minutes|mins)\b/gi)) m += Number(hit[1]);
      numbers += (t.match(/\d+/g) ?? []).length;
    }
    if (m) minutes.push(m);
  }
  const last = (days[lo + 6]?.activities ?? []).map(textOf).join(" ") + " " + (days[lo + 6]?.title ?? "");
  return {
    sevenDays: nums.every((n) => !!days[n]) && Object.keys(days).length === 7,
    activityCounts: badDays.length === 0,
    allActions: issues.nonActions.length === 0,
    noRepeats: issues.repeats.length === 0,
    lastDayTest: TEST_WORDS.test(last),
    badDays,
    nonActions: issues.nonActions,
    repeats: issues.repeats,
    avgMinutes: minutes.length ? Math.round(minutes.reduce((a, b) => a + b, 0) / minutes.length) : null,
    avgNumbers: Math.round((numbers / 7) * 10) / 10,
  };
}

function passCount(c: Checks): { pass: number; total: number } {
  const list = [c.sevenDays, c.activityCounts, c.allActions, c.noRepeats, ...(c.levelMoves === undefined ? [] : [c.levelMoves])];
  return { pass: list.filter(Boolean).length, total: list.length };
}

// ---------------------------------------------------------------- budgeted fetch

const caseStore = new AsyncLocalStorage<{ key: string; calls: number; rewrite: boolean }>();
let callCount = 0;
let primaryRemaining = 0;
const usage = { input: 0, output: 0 };

function installBudget(): void {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!url.includes("api.anthropic.com")) return realFetch(input, init);
    const body = JSON.parse(String(init?.body ?? "{}")) as { messages?: unknown[] };
    const isRewrite = (body.messages?.length ?? 0) > 1;
    const store = caseStore.getStore();
    if (isRewrite) {
      if (callCount + primaryRemaining >= callCap) {
        out(`  [budget] skipping rewrite for ${store?.key} (${callCount} used, ${primaryRemaining} first attempts left)`);
        return new Response(JSON.stringify({ error: "eval budget" }), { status: 429 });
      }
    } else {
      if (callCount >= callCap) {
        out(`  [budget] cap of ${callCap} reached, skipping ${store?.key}`);
        return new Response(JSON.stringify({ error: "eval budget" }), { status: 429 });
      }
      primaryRemaining = Math.max(0, primaryRemaining - 1);
    }
    callCount++;
    if (store) {
      store.calls++;
      if (isRewrite) store.rewrite = true;
    }
    out(`  [call ${callCount}/${callCap}] ${store?.key ?? "?"}${isRewrite ? " (rewrite)" : ""}`);
    const res = await realFetch(input, init);
    const clone = res.clone();
    try {
      const j = (await clone.json()) as { usage?: { input_tokens?: number; output_tokens?: number } };
      usage.input += j.usage?.input_tokens ?? 0;
      usage.output += j.usage?.output_tokens ?? 0;
    } catch {
      // usage is best effort
    }
    return res;
  };
}

const costUsd = () => (usage.input * PRICE.input + usage.output * PRICE.output) / 1_000_000;

// ---------------------------------------------------------------- runs

async function runCase(
  key: string,
  goal: GoalCase,
  level: number,
  sprint: 1 | 2,
  ctx: SprintGenContext,
  extra: Partial<CaseResult>,
): Promise<CaseResult> {
  const state = { key, calls: 0, rewrite: false };
  const result = await caseStore.run(state, () =>
    generateSprintWithAI({ ...goal.input, skillLevel: level }, sprint, ctx),
  );
  const base: CaseResult = {
    key,
    goalId: goal.id,
    goal: goal.input.goal,
    week: sprint,
    level,
    ok: !!result,
    rewrite: state.rewrite,
    calls: state.calls,
    ...extra,
  };
  if (!result) {
    out(`  ✗ ${key}: no plan (model call failed or was skipped)`);
    return base;
  }
  const checks = check(result.days, sprint);
  const r: CaseResult = { ...base, days: result.days, sprints: result.sprints, checks };
  const { pass, total } = passCount(checks);
  out(`  ✓ ${key}: ${pass}/${total} checks${state.rewrite ? " (after a rewrite)" : ""}`);
  return r;
}

async function pool<T>(items: Array<() => Promise<T>>, size: number): Promise<T[]> {
  const results: T[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await items[i]();
    }
  };
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
  return results;
}

async function runAll(prev: CaseResult[], only: Set<string> | null): Promise<CaseResult[]> {
  const byKey = new Map(prev.map((r) => [r.key, r]));
  const want = (k: string) => !only || only.has(k);

  const week1Keys = GOALS.flatMap((g) => LEVELS.map((l) => ({ g, l, key: keyOf(g.id, l) }))).filter((c) => want(c.key));
  const week2Keys = WEEK2_GOALS.flatMap((id) => (["easy", "hard"] as Path[]).map((p) => ({ id, p, key: keyOf(id, nextLevel(WEEK2_BASE_LEVEL, p === "easy" ? { easy: 7 } : { hard: 7 }), p) }))).filter((c) => want(c.key) || !!only?.has(`${c.id}:${c.p}`));
  primaryRemaining = week1Keys.length + week2Keys.length;
  out(`Running ${week1Keys.length} week-1 and ${week2Keys.length} week-2 cases (cap ${callCap} calls).`);

  const week1 = await pool(
    week1Keys.map(({ g, l, key }) => () => runCase(key, g, l, 1, {}, {})),
    4,
  );
  for (const r of week1) byKey.set(r.key, r);

  const week2 = await pool(
    week2Keys.map(({ id, p, key }) => () => {
      const g = GOALS.find((x) => x.id === id) as GoalCase;
      const base = byKey.get(keyOf(id, WEEK2_BASE_LEVEL));
      const marks = p === "easy" ? { easy: 7, hard: 0 } : { easy: 0, hard: 7 };
      const level = nextLevel(WEEK2_BASE_LEVEL, marks);
      const ctx: SprintGenContext = {
        sprints: base?.sprints,
        priorCompletion: { completed: 7, total: 7 },
        priorDifficulty: marks,
        priorReflections: [],
        priorSkillLevel: WEEK2_BASE_LEVEL,
      };
      return runCase(key, g, level, 2, ctx, { priorLevel: WEEK2_BASE_LEVEL, path: p });
    }),
    3,
  );
  for (const r of week2) byKey.set(r.key, r);

  // Level direction: easy path rises above the base, hard path ends below the easy path.
  for (const id of WEEK2_GOALS) {
    const easy = [...byKey.values()].find((r) => r.goalId === id && r.path === "easy");
    const hard = [...byKey.values()].find((r) => r.goalId === id && r.path === "hard");
    if (easy?.checks) easy.checks.levelMoves = easy.level > WEEK2_BASE_LEVEL;
    if (hard?.checks) hard.checks.levelMoves = hard.level < WEEK2_BASE_LEVEL && (!easy || hard.level < easy.level);
  }
  return [...byKey.values()];
}

// ---------------------------------------------------------------- html

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function dayList(r: CaseResult): string {
  if (!r.days) return `<p class="fail">No plan: the call failed or was skipped.</p>`;
  const repeats = new Set(r.checks?.repeats ?? []);
  return Object.keys(r.days)
    .map(Number)
    .sort((a, b) => a - b)
    .map((n) => {
      const d = r.days![n];
      const acts = d.activities
        .map((a) => {
          const t = textOf(a);
          const cls = !isDirectAction(t) ? "flag" : repeats.has(t) ? "flag" : "";
          return `<li${cls ? ` class="${cls}"` : ""}>${esc(t)}</li>`;
        })
        .join("");
      return `<div class="day"><h4>${esc(d.title)}</h4><ul>${acts}</ul></div>`;
    })
    .join("");
}

function badge(ok: boolean | undefined, label: string): string {
  if (ok === undefined) return "";
  return `<span class="chip ${ok ? "ok" : "bad"}">${ok ? "✓" : "✗"} ${label}</span>`;
}

function checkChips(c?: Checks): string {
  if (!c) return `<span class="chip bad">✗ no plan</span>`;
  return [
    badge(c.sevenDays, "7 days"),
    badge(c.activityCounts, "2–3 a day"),
    badge(c.allActions, "exact actions"),
    badge(c.noRepeats, "no repeats"),
    badge(c.levelMoves, "level moved right way"),
    `<span class="chip ${c.lastDayTest ? "ok" : "warn"}">${c.lastDayTest ? "✓" : "?"} last day reads like a test</span>`,
  ].join(" ");
}

function firstAct(r: CaseResult, day: number): string {
  const d = r.days?.[day];
  return d ? esc(textOf(d.activities[0])) : "—";
}

function render(results: CaseResult[], meta: { calls: number; cost: number; model: string; ranAt: string }): string {
  const get = (k: string) => results.find((r) => r.key === k);
  const week1 = GOALS.flatMap((g) => LEVELS.map((l) => get(keyOf(g.id, l)))).filter((r): r is CaseResult => !!r);
  const week2 = results.filter((r) => r.week === 2);

  const summaryRows = [...week1, ...week2]
    .map((r) => {
      const pc = r.checks ? passCount(r.checks) : { pass: 0, total: 4 };
      const lo = (r.week - 1) * 7 + 1;
      return `<tr>
<td>${esc(r.goal)}</td>
<td>${r.week === 2 ? `Week 2, all “too ${r.path}”` : "Week 1"}</td>
<td class="num">${esc(levelLabel(r.level))}${r.priorLevel !== undefined ? `<br><span class="muted">from ${r.priorLevel}</span>` : ""}</td>
<td class="num ${pc.pass === pc.total ? "ok" : "bad"}">${pc.pass}/${pc.total}${r.rewrite ? '<br><span class="muted">rewrite</span>' : ""}</td>
<td>${firstAct(r, lo)}</td>
<td>${firstAct(r, lo + 6)}</td>
</tr>`;
    })
    .join("");

  const byGoal = GOALS.map((g) => {
    const cols = LEVELS.map((l) => get(keyOf(g.id, l)))
      .map((r, i) =>
        r
          ? `<section class="col"><h3>Level ${LEVELS[i]} · ${esc(skillBand(LEVELS[i]).name)}</h3><div class="chips">${checkChips(r.checks)}</div>
<p class="muted small">avg minutes named per day: ${r.checks?.avgMinutes ?? "—"} · numbers per day: ${r.checks?.avgNumbers ?? "—"}</p>${dayList(r)}</section>`
          : `<section class="col"><h3>Level ${LEVELS[i]}</h3><p class="muted">Not run.</p></section>`,
      )
      .join("");
    return `<details class="goal" open><summary><h2>${esc(g.input.goal)}</h2></summary><div class="cols">${cols}</div></details>`;
  }).join("");

  const easyHard = WEEK2_GOALS.map((id) => {
    const g = GOALS.find((x) => x.id === id) as GoalCase;
    const easy = week2.find((r) => r.goalId === id && r.path === "easy");
    const hard = week2.find((r) => r.goalId === id && r.path === "hard");
    const col = (r: CaseResult | undefined, label: string) =>
      r
        ? `<section class="col"><h3>${label}: level ${r.priorLevel} → ${r.level}</h3><div class="chips">${checkChips(r.checks)}</div>
<p class="muted small">avg minutes named per day: ${r.checks?.avgMinutes ?? "—"} · numbers per day: ${r.checks?.avgNumbers ?? "—"}</p>${dayList(r)}</section>`
        : `<section class="col"><h3>${label}</h3><p class="muted">Not run.</p></section>`;
    return `<details class="goal" open><summary><h2>${esc(g.input.goal)}</h2></summary><div class="cols two">${col(easy, "All 7 days “too easy”")}${col(hard, "All 7 days “too hard”")}</div></details>`;
  }).join("");

  const totals = [...week1, ...week2].reduce(
    (acc, r) => {
      const pc = r.checks ? passCount(r.checks) : { pass: 0, total: 4 };
      return { pass: acc.pass + pc.pass, total: acc.total + pc.total, rewrites: acc.rewrites + (r.rewrite ? 1 : 0), tests: acc.tests + (r.checks?.lastDayTest ? 1 : 0) };
    },
    { pass: 0, total: 0, rewrites: 0, tests: 0 },
  );

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Plan Eval</title>
<style>
:root{--bg:#fafaf9;--fg:#18181b;--muted:#71717a;--line:#e4e4e7;--card:#ffffff;--ok:#15803d;--bad:#b91c1c;--warn:#a16207;--flag:#fef3c7}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#0a0a0a;--fg:#f4f4f5;--muted:#a1a1aa;--line:#27272a;--card:#141414;--ok:#4ade80;--bad:#f87171;--warn:#facc15;--flag:#422006}}
:root[data-theme="dark"]{--bg:#0a0a0a;--fg:#f4f4f5;--muted:#a1a1aa;--line:#27272a;--card:#141414;--ok:#4ade80;--bad:#f87171;--warn:#facc15;--flag:#422006}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
main{max-width:1280px;margin:0 auto;padding:24px 16px 64px}h1{font-size:28px;margin:0 0 4px}h2{display:inline;font-size:20px;margin:0}h3{font-size:15px;margin:0 0 6px}h4{font-size:13px;margin:0 0 4px}
.muted{color:var(--muted)}.small{font-size:12px}.ok{color:var(--ok)}.bad{color:var(--bad)}.num{font-variant-numeric:tabular-nums;white-space:nowrap}
.table-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:12px;background:var(--card)}table{border-collapse:collapse;width:100%;min-width:760px;font-size:13px}th,td{text-align:left;vertical-align:top;padding:8px 10px;border-bottom:1px solid var(--line)}th{font-size:12px;color:var(--muted);font-weight:600}
.goal{margin:28px 0;border-top:1px solid var(--line);padding-top:16px}summary{cursor:pointer;margin-bottom:12px}
.cols{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.cols.two{grid-template-columns:repeat(2,minmax(0,1fr))}
@media (max-width:900px){.cols,.cols.two{grid-template-columns:1fr}}
.col{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px;min-width:0}
.day{padding:8px 0;border-top:1px solid var(--line)}.day ul{margin:0;padding-left:18px}.day li{font-size:13px;margin:2px 0}li.flag{background:var(--flag)}
.chips{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px}.chip{font-size:11px;border:1px solid var(--line);border-radius:999px;padding:1px 8px}.chip.ok{color:var(--ok)}.chip.bad{color:var(--bad)}.chip.warn{color:var(--warn)}
.note{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin:16px 0}
</style></head><body><main>
<h1>Plan eval</h1>
<p class="muted">${esc(meta.model)} · ${meta.calls} model calls · about $${meta.cost.toFixed(2)} · ${esc(meta.ranAt)}</p>
<div class="note"><strong>${totals.pass}/${totals.total}</strong> automatic checks passed across ${week1.length + week2.length} plans. ${totals.rewrites} plan(s) needed the one rewrite. ${totals.tests} of ${week1.length + week2.length} last days read like a small test (word match only, so read them).
<br><span class="muted small">Checks: 7 days · 2–3 activities a day · every activity an exact action (plan-rules) · no word-for-word repeats · week 2 level moved the right way. Highlighted lines failed a check. “Minutes” and “numbers” per day are rough load signals, not checks.</span></div>
<h2>Summary</h2>
<div class="table-wrap"><table><thead><tr><th>Goal</th><th>Week</th><th>Written for</th><th>Checks</th><th>Day 1, first activity</th><th>Last day, first activity</th></tr></thead><tbody>${summaryRows}</tbody></table></div>
<h2 style="display:block;margin-top:32px">Week 1 by level</h2>${byGoal}
<h2 style="display:block;margin-top:32px">Week 2: too easy vs too hard (both after a level-${WEEK2_BASE_LEVEL} week 1)</h2>${easyHard}
</main></body></html>`;
}

// ---------------------------------------------------------------- main

async function main(): Promise<void> {
  loadEnv(path.join(ROOT, ".env.local"));
  const args = process.argv.slice(2);
  const prevFile = existsSync(JSON_OUT) ? (JSON.parse(readFileSync(JSON_OUT, "utf8")) as { results: CaseResult[]; meta: { calls: number; cost: number; model: string; ranAt: string } }) : null;
  const model = process.env.ANTHROPIC_PLAN_MODEL || "claude-sonnet-5";

  if (args.includes("--render")) {
    if (!prevFile) throw new Error("No appstore/plan-eval.json yet — run without --render first.");
    writeFileSync(HTML_OUT, render(prevFile.results, prevFile.meta));
    out(`Wrote ${HTML_OUT}`);
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY missing from .env.local");

  const onlyArg = args.find((a) => a.startsWith("--only"));
  const onlyVal = onlyArg?.includes("=") ? onlyArg.split("=")[1] : onlyArg ? args[args.indexOf(onlyArg) + 1] : undefined;
  const only = onlyVal ? new Set(onlyVal.split(",").map((s) => s.trim())) : null;

  // Re-runs share the original budget: whatever earlier runs spent comes off the cap.
  if (only) callCap = Math.max(0, MAX_CALLS - (prevFile?.meta.calls ?? 0));
  installBudget();
  const results = await runAll(only ? prevFile?.results ?? [] : [], only);
  const prevCalls = only ? prevFile?.meta.calls ?? 0 : 0;
  const prevCost = only ? prevFile?.meta.cost ?? 0 : 0;
  const meta = { calls: prevCalls + callCount, cost: prevCost + costUsd(), model, ranAt: new Date().toISOString() };
  writeFileSync(JSON_OUT, JSON.stringify({ meta, results }, null, 2));
  writeFileSync(HTML_OUT, render(results, meta));
  out(`\nThis run: ${callCount} calls, ${usage.input} in / ${usage.output} out tokens, about $${costUsd().toFixed(2)}.`);
  out(`All runs: ${meta.calls} calls, about $${meta.cost.toFixed(2)}.`);
  out(`Wrote ${JSON_OUT} and ${HTML_OUT}`);
}

main().catch((e: unknown) => {
  process.stderr.write(`${e instanceof Error ? e.stack ?? e.message : String(e)}\n`);
  process.exit(1);
});
