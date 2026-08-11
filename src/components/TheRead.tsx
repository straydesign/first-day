"use client";

/**
 * THE READ — the intake surface.
 *
 * One question per screen. A 40-question grid is a wall and a wall gets
 * abandoned; one question is always answerable. Progress is visible, the answers
 * survive a refresh, and there is a payoff partway through so the length pays for
 * itself before it's over.
 *
 * Prototype scope: local only (localStorage). Persisting a Read to Supabase is
 * Phase 1 in COACH-SPEC §9 — the `profiles` table there is the destination.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildInstrument,
  DOMAINS,
  PAYOFF_AFTER,
  SECTIONS,
  type ReadQuestion,
} from "@/content/read-instrument";
import { partialRead, synthesise, type Answers } from "@/lib/read-synthesis";

const STORE = "firstday.read.v1";

type Stage = "intro" | "questions" | "payoff" | "read";

export default function TheRead() {
  const [stage, setStage] = useState<Stage>("intro");
  const [answers, setAnswers] = useState<Answers>({});
  const [idx, setIdx] = useState(0);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [shownBasis, setShownBasis] = useState<string | null>(null);
  const [nudge, setNudge] = useState(0);
  const [loaded, setLoaded] = useState(false);

  /* resume — a 40-question intake that loses your answers on a refresh is a
     40-question intake nobody finishes twice */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const s = JSON.parse(raw);
        setAnswers(s.answers ?? {});
        setIdx(s.idx ?? 0);
        setNudge(typeof s.nudge === "number" ? s.nudge : 0);
        if (s.stage) setStage(s.stage);
      }
    } catch {
      /* corrupt store: start clean rather than trap the person */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORE, JSON.stringify({ answers, idx, stage, nudge }));
    } catch {
      /* private mode / quota — the flow still works in-memory */
    }
  }, [answers, idx, stage, nudge, loaded]);

  const questions = useMemo(() => buildInstrument(answers as Record<string, unknown>), [answers]);
  const q: ReadQuestion | undefined = questions[idx];
  const section = SECTIONS.find((s) => s.id === q?.section);

  const set = useCallback((id: string, v: Answers[string]) => {
    setAnswers((prev) => ({ ...prev, [id]: v }));
  }, []);

  const answered = (question: ReadQuestion | undefined) => {
    if (!question) return false;
    const v = answers[question.id];
    if (question.optional) return true;
    if (question.kind === "multi") return Array.isArray(v) && v.length > 0;
    if (question.kind === "text") return typeof v === "string" && v.trim().length > 0;
    return v !== undefined && v !== "";
  };

  const advance = () => {
    if (q?.id === PAYOFF_AFTER && partialRead(answers)) {
      setStage("payoff");
      return;
    }
    if (idx + 1 >= questions.length) {
      setStage("read");
      return;
    }
    setIdx(idx + 1);
  };

  if (!loaded) return null;

  /* ─────────────────────────── intro ─────────────────────────── */
  if (stage === "intro") {
    return (
      <Shell>
        <p className="text-sm uppercase tracking-[0.18em] text-white/40">First Day</p>
        <h1 className="mt-4 text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl">
          Before you tell me what you want,
          <br />
          let&rsquo;s find out where you are.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/60">
          Forty questions, about seven minutes, one at a time. Most of them are a number or a tap.
        </p>
        <p className="mt-4 max-w-xl leading-relaxed text-white/40">
          Almost every app like this opens by asking what your goal is. That&rsquo;s the moment you
          know the least about yourself, so the answer comes out as a wish — and wishes don&rsquo;t
          survive a Tuesday. We&rsquo;ll get to what you want. It&rsquo;s the sixth section, not the
          first.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <button
            onClick={() => setStage("questions")}
            className="rounded-full bg-[#cc5533] px-7 py-3.5 font-semibold text-white transition hover:brightness-110"
          >
            {Object.keys(answers).length ? "Pick up where I left off" : "Start"}
          </button>
          {Object.keys(answers).length > 0 && (
            <button
              onClick={() => {
                setAnswers({});
                setIdx(0);
                setDismissed([]);
                setNudge(0);
              }}
              className="text-sm text-white/40 underline underline-offset-4 hover:text-white/70"
            >
              Start over
            </button>
          )}
        </div>
      </Shell>
    );
  }

  /* ─────────────────────────── payoff ─────────────────────────── */
  if (stage === "payoff") {
    const p = partialRead(answers)!;
    return (
      <Shell>
        <p className="text-sm uppercase tracking-[0.18em] text-white/40">
          About halfway. Here&rsquo;s what I&rsquo;m seeing so far.
        </p>
        <h2 className="mt-5 text-3xl leading-tight font-semibold sm:text-4xl">{p.headline}</h2>
        {p.body.split("\n\n").map((para, i) => (
          <p key={i} className="mt-5 max-w-2xl text-lg leading-relaxed text-white/70">
            {para}
          </p>
        ))}
        <button
          onClick={() => {
            setStage("questions");
            setIdx(idx + 1);
          }}
          className="mt-10 rounded-full bg-[#cc5533] px-7 py-3.5 font-semibold text-white transition hover:brightness-110"
        >
          Keep going
        </button>
      </Shell>
    );
  }

  /* ─────────────────────────── the read ─────────────────────────── */
  if (stage === "read") {
    const read = synthesise(answers, nudge);
    const live = read.inferences.filter((i) => !dismissed.includes(i.id));
    const ceiling = read.weeklyCommitmentCeiling;
    return (
      <Shell wide>
        <p className="text-sm uppercase tracking-[0.18em] text-white/40">Your read</p>
        <h2 className="mt-4 max-w-3xl text-3xl leading-[1.15] font-semibold tracking-tight sm:text-[2.6rem]">
          {read.oneLine}
        </h2>

        {/* the shape — deliberately not scored on evenness. A smooth wheel of 3s
            is balanced and bad. */}
        <div className="mt-12">
          <h3 className="text-sm uppercase tracking-[0.16em] text-white/40">The shape</h3>
          <div className="mt-5 space-y-3">
            {read.domains.map((d) => {
              const isLow = read.loadBearing.some((l) => l.id === d.id);
              return (
                <div key={d.id} className="flex items-center gap-4">
                  <span className="w-44 shrink-0 text-sm text-white/60">{d.label}</span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/8">
                    <span
                      className="block h-full rounded-full transition-all"
                      style={{
                        width: `${d.score * 10}%`,
                        background: isLow ? "#cc5533" : "rgba(255,255,255,0.34)",
                      }}
                    />
                  </span>
                  <span className="w-8 text-right font-mono text-sm text-white/50">{d.score}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/40">
            The two in orange are where the material is — not a verdict, and not a to-do list. An
            even shape isn&rsquo;t the goal: eight straight 3s would be perfectly balanced and a
            bad life. Your strongest is <strong className="text-white/70">{read.strongest.label.toLowerCase()}</strong>,
            and that one is evidence, not a rest stop.
          </p>
        </div>

        {read.failurePattern && (
          <Block title="Your pattern" heading={read.failurePattern.name}>
            {read.failurePattern.description}
          </Block>
        )}

        {/* The ceiling is computed but ADJUSTABLE by ±1. The single strongest
            finding in the app research: letting people nudge an algorithm's
            output by a capped amount moved adoption 32% → 76%, and they barely
            used the nudge. Agency is the active ingredient, not accuracy. */}
        <div className="mt-12">
          <h3 className="text-sm uppercase tracking-[0.16em] text-white/40">Your real week</h3>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-white/70">
            About {read.capacityHours} hour{read.capacityHours === 1 ? "" : "s"} a week, which I&rsquo;d
            hold to{" "}
            <strong className="text-white">
              {ceiling} commitment{ceiling === 1 ? "" : "s"}
            </strong>
            . That&rsquo;s the number I&rsquo;ll point at when you try to add one more on a Sunday,
            and you will.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={() => setNudge(Math.max(-1, nudge - 1))}
              disabled={nudge <= -1 || ceiling <= 1}
              className="h-11 w-11 rounded-full border border-white/15 text-xl transition hover:bg-white/5 disabled:opacity-25"
              aria-label="One fewer commitment"
            >
              −
            </button>
            <button
              onClick={() => setNudge(Math.min(1, nudge + 1))}
              disabled={nudge >= 1 || ceiling >= 5}
              className="h-11 w-11 rounded-full border border-white/15 text-xl transition hover:bg-white/5 disabled:opacity-25"
              aria-label="One more commitment"
            >
              +
            </button>
            <span className="max-w-md text-sm text-white/40">
              {ceiling === read.computedCeiling
                ? "You can move this by one in either direction. I'd leave it."
                : ceiling < read.computedCeiling
                  ? "Adjusted down by one. Good instinct — shrinking is almost never the wrong call."
                  : "Adjusted up by one. That's as far as it goes, and I'll hold you to it the same way."}
            </span>
          </div>
        </div>

        {live.length > 0 && (
          <div className="mt-12">
            <h3 className="text-sm uppercase tracking-[0.16em] text-white/40">
              Guesses — tell me if I&rsquo;m wrong
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-white/40">
              These aren&rsquo;t things you typed. They&rsquo;re what I think I&rsquo;m seeing, which
              means they can be wrong. Dismissing one removes it for good.
            </p>
            <div className="mt-5 space-y-4">
              {live.map((inf) => (
                <div key={inf.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="leading-relaxed text-white/80">{inf.claim}</p>
                  {shownBasis === inf.id && (
                    <p className="mt-3 border-l-2 border-[#cc5533]/60 pl-4 text-sm leading-relaxed text-white/45">
                      {inf.basis}
                    </p>
                  )}
                  <div className="mt-4 flex gap-5 text-sm">
                    <button
                      onClick={() => setShownBasis(shownBasis === inf.id ? null : inf.id)}
                      className="text-white/45 underline underline-offset-4 hover:text-white/80"
                    >
                      {shownBasis === inf.id ? "Hide" : "How do you know that?"}
                    </button>
                    <button
                      onClick={() => setDismissed([...dismissed, inf.id])}
                      className="text-white/45 underline underline-offset-4 hover:text-white/80"
                    >
                      That&rsquo;s not right
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Block title="How I'll work with you">
          {[
            read.coachVoice === "pushed"
              ? "You asked to be pushed, so I'll tell you straight and expect an answer."
              : read.coachVoice === "plain"
                ? "You asked for facts without commentary, so that's what you'll get. No encouragement."
                : "You asked to be asked rather than told, so I'll put questions to you and let you find it.",
            read.useStreaks
              ? "Streaks motivate you, so you'll have one."
              : "No streak counter — you said it would work against you. Nothing you bank can be taken away.",
            read.cadence === "none"
              ? "You don't want to be chased, so I won't. Ever. Come to me."
              : read.cadence === "weekly"
                ? "Weekly only. I'll leave you alone in between."
                : read.cadence === "missed"
                  ? "I'll only reach out when something you committed to slips."
                  : "A check-in a day, at the time you pick. One message. Never three.",
            read.proof === "artefact"
              ? "You'll send proof rather than tick a box — a photo, a screenshot, a number."
              : read.proof === "words"
                ? "You'll tell me how it went in your own words."
                : "You'll tick things off.",
            read.onQuiet === "wait"
              ? "If you go quiet I'll say nothing until you come back. That's your call and I'll keep it."
              : read.onQuiet === "keep"
                ? "If you go quiet I'll keep checking in, because you asked me to."
                : "If you go quiet I'll reach out once, then wait.",
          ].join(" ")}
        </Block>

        <p className="mt-12 max-w-2xl text-sm leading-relaxed text-white/35">
          Every line above is computed from something you answered — nothing here was invented, and
          the guesses are labelled as guesses. You can change any of it later; the contract is meant
          to be renegotiated, not signed once.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <button
            className="rounded-full bg-[#cc5533] px-7 py-3.5 font-semibold text-white transition hover:brightness-110"
            onClick={() => alert("Next: the goal conversation, then your first Sunday. Not built yet — see COACH-SPEC.md §9.")}
          >
            Now let&rsquo;s talk about what you want
          </button>
          <button
            onClick={() => {
              setStage("questions");
              setIdx(0);
            }}
            className="rounded-full border border-white/15 px-7 py-3.5 text-white/70 transition hover:bg-white/5"
          >
            Go back through my answers
          </button>
        </div>
      </Shell>
    );
  }

  /* ─────────────────────────── questions ─────────────────────────── */
  if (!q) return null;
  const pct = Math.round((idx / questions.length) * 100);

  return (
    <Shell>
      <div className="mb-10">
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[#cc5533] transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-3 flex items-baseline justify-between text-xs">
          <span className="uppercase tracking-[0.16em] text-white/40">{section?.name}</span>
          <span className="font-mono text-white/30">
            {idx + 1} / {questions.length}
          </span>
        </div>
      </div>

      <h2 className="max-w-2xl text-[1.7rem] leading-[1.25] font-semibold tracking-tight sm:text-[2.1rem]">
        {q.q}
      </h2>
      {q.sub && <p className="mt-4 max-w-xl leading-relaxed text-white/50">{q.sub}</p>}

      <div className="mt-9">
        {q.kind === "scale10" && (
          <Scale n={10} value={answers[q.id] as number} low={q.low} high={q.high} onPick={(v) => set(q.id, v)} />
        )}
        {q.kind === "scale5" && (
          <Scale n={5} value={answers[q.id] as number} low={q.low} high={q.high} onPick={(v) => set(q.id, v)} />
        )}
        {q.kind === "text" && (
          <textarea
            autoFocus
            value={(answers[q.id] as string) ?? ""}
            placeholder={q.placeholder}
            onChange={(e) => set(q.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && answered(q)) advance();
            }}
            className="min-h-32 w-full rounded-xl border border-white/12 bg-white/[0.04] p-5 text-lg leading-relaxed text-white outline-none placeholder:text-white/25 focus:border-[#cc5533]"
          />
        )}
        {q.kind === "choice" && (
          <div className="flex flex-col gap-2.5">
            {q.options?.map((o) => {
              const on = answers[q.id] === o.v;
              return (
                <button
                  key={o.v}
                  onClick={() => set(q.id, o.v)}
                  aria-pressed={on}
                  className={`rounded-xl border p-4 text-left transition ${
                    on ? "border-[#cc5533] bg-[#cc5533]/12" : "border-white/12 bg-white/[0.03] hover:bg-white/[0.06]"
                  }`}
                >
                  <span className="block font-medium">{o.label}</span>
                  {o.note && <span className="mt-0.5 block text-sm text-white/40">{o.note}</span>}
                </button>
              );
            })}
          </div>
        )}
        {q.kind === "multi" && (
          <div className="flex flex-wrap gap-2.5">
            {q.options?.map((o) => {
              const cur = (answers[q.id] as string[]) ?? [];
              const on = cur.includes(o.v);
              return (
                <button
                  key={o.v}
                  aria-pressed={on}
                  onClick={() => set(q.id, on ? cur.filter((x) => x !== o.v) : [...cur, o.v])}
                  className={`rounded-full border px-5 py-2.5 transition ${
                    on ? "border-[#cc5533] bg-[#cc5533]/15" : "border-white/12 hover:bg-white/[0.06]"
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-10 flex items-center gap-5">
        <button
          disabled={!answered(q)}
          onClick={advance}
          className="rounded-full bg-[#cc5533] px-7 py-3.5 font-semibold text-white transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {idx + 1 >= questions.length ? "See my read" : "Next"}
        </button>
        {q.optional && !answered(q) && (
          <button onClick={advance} className="text-sm text-white/40 hover:text-white/70">
            Skip
          </button>
        )}
        <span className="flex-1" />
        {idx > 0 && (
          <button onClick={() => setIdx(idx - 1)} className="text-sm text-white/40 hover:text-white/70">
            Back
          </button>
        )}
      </div>
    </Shell>
  );
}

/* ─────────────────────────── bits ─────────────────────────── */

function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white sm:py-24">
      <div className={wide ? "mx-auto max-w-3xl" : "mx-auto max-w-2xl"}>{children}</div>
    </main>
  );
}

function Block({ title, heading, children }: { title: string; heading?: string; children: React.ReactNode }) {
  return (
    <div className="mt-12">
      <h3 className="text-sm uppercase tracking-[0.16em] text-white/40">{title}</h3>
      {heading && <p className="mt-3 text-2xl font-semibold">{heading}</p>}
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-white/70">{children}</p>
    </div>
  );
}

function Scale({
  n,
  value,
  low,
  high,
  onPick,
}: {
  n: number;
  value?: number;
  low?: string;
  high?: string;
  onPick: (v: number) => void;
}) {
  return (
    <div>
      <div className={`grid gap-2 ${n === 10 ? "grid-cols-5 sm:grid-cols-10" : "grid-cols-5"}`}>
        {Array.from({ length: n }, (_, i) => i + 1).map((v) => (
          <button
            key={v}
            aria-pressed={value === v}
            onClick={() => onPick(v)}
            className={`rounded-lg border py-4 font-mono text-lg transition ${
              value === v
                ? "border-[#cc5533] bg-[#cc5533] text-white"
                : "border-white/12 bg-white/[0.03] text-white/70 hover:bg-white/[0.08]"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      {(low || high) && (
        <div className="mt-3 flex justify-between text-xs text-white/35">
          <span>{low}</span>
          <span>{high}</span>
        </div>
      )}
    </div>
  );
}

/* Re-exported so the route can prefetch domain labels without pulling the whole
   instrument into the server bundle. */
export { DOMAINS };
