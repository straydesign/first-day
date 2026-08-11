# First Day → the coach

**Status:** spec, 2026-08-10. Supersedes nothing — this is a product layer on top of what already ships. `VISION.md` still governs how it renders (rooms, tiles, no flat backgrounds). This governs what it *does*.

**Evidence base:** built against 23 transcribed YouTube sessions (mostly ICF MCC-level recorded coaching, ~90k words) plus 40+ web sources, and a teardown of the consistency/coaching app category. Where a design decision comes from a recorded credentialed coach, it's marked **[TA]** (Tier A — recorded session or credentialing body). Where it comes from vendor marketing copy, **[TC]** — treated as raw material, not best practice. Where it's my inference, **[INF]**. Full research: `scratchpad/research-lifecoach.md`, `scratchpad/research-appux.md`.

---

## 0. The one-sentence change

Today First Day is a **plan generator**: you type a goal, it writes you 28 days, you come back and tick boxes.

It becomes a **coach**: it knows where you're starting from before you tell it what you want, it plans the week *with* you on a fixed day, and it reaches out to you every day without being opened.

The difference is the direction of the first move. Every habit app waits. A coach calls.

---

## 1. Why this is the right pivot

The activity-tracking space is finished. There are excellent apps for logging workouts, tracking habits, and blocking time. Building another one is competing on a solved axis.

The thing nobody has solved for a person working alone is **the missing second party**. A real coach doesn't give you better activities — the activities are usually obvious. A coach gives you:

- **Someone who noticed.** The plan existing is not accountability. A person asking is.
- **A fixed appointment with your own life.** The weekly session is the unit that makes the daily unit survivable.
- **Permission to have a bad week without quitting.** This is the one a streak counter is structurally incapable of giving.

So the product is not "activities + reminders." It's **a relationship with a cadence**. Activities are the cheapest part and we should treat them as such.

### What we already have that supports this

The existing build is further along than it looks. Already shipping: goals with a why/experience/constraints form · AI sprint generation that *adapts to the prior sprint's reflections and completion rate* (`/api/generate-plan`, `lib/anthropic.ts`) · day-level progress with reflections · XP, levels, achievements, daily challenge, daily multiplier, comeback detection, streak freezes (`lib/engagement.ts`) · a published-plan social surface with per-user RLS.

The adaptation loop is the hard part and it's built. What's missing is everything on the *outbound* side.

---

## 2. The four new surfaces

| Surface | Cadence | What it is | Exists today? |
|---|---|---|---|
| **The Read** | once, at signup | A comprehensive assessment that tells you where you land *before* you say what you want | No — today's goal form is 6 fields |
| **The Sunday** | weekly, fixed day | Plan big. Review last week honestly, commit to this week | No |
| **The Check-in** | daily, pushed | 20 seconds. It comes to you | No — app is pull-only |
| **The Ledger** | continuous | Aura. The record of showing up | Partial — XP exists, framing is wrong |

---

## 3. The Read (intake)

> Tom: *"probably starting with a survey that's pretty comprehensive to see where you land before you just tell me what you want"*

That ordering is the whole insight, and it's the opposite of how every goal app onboards. Goal-first onboarding asks a person to name an outcome at the exact moment they have the least information about themselves. The answer you get is a wish, and wishes don't survive contact with a Tuesday.

### Shape

**~40 questions, six sections, 6–8 minutes, one question per screen.** One-per-screen is not a style choice — a 40-question grid is a wall, and a wall gets abandoned. One question is always answerable.

Sections:

1. **The map** (8) — a domain-by-domain read: health, work/craft, money, relationships, home/environment, play, learning, direction. Each is one question, answered on a **single-axis 1–10 satisfaction scale** — not importance × satisfaction. No credentialed source uses dual scoring; the importance dimension gets worked conversationally instead. Free-text follow-up *only* on the two lowest. Nobody wants to write eight paragraphs; everybody has two things they'll talk about.
2. **The gap** (5) — for the low-rated domains, the question that actually opens it up: **"Describe what a 10 would look like in this area."** [TA] Not "what would a 7 look like" — asking for the ceiling gets a vivid answer, asking for an increment gets a shrug. Then: what's the thing you already know you should do and haven't?

   ⚠️ **A smooth wheel is not the goal, and the product must never imply it is.** A wheel of straight 3s is balanced and bad. This got challenged live on one of the recordings and the coach conceded the point. The Read reports the *shape*, and asks which two the person wants to be load-bearing — it never scores them on evenness.
3. **The history** (6) — this is the section nobody else asks. What have you tried before? What happened? How long did it last? What made it stop? Have you ever kept something going for a year — what was different about that one? *A person's failure pattern is more predictive than their goal.*
4. **The constraints** (7) — hours actually available, when in the day, what the week's fixed shape is (work, caregiving, commute), what your energy curve looks like, what the environment is like (do you live alone, is there a gym, do you have equipment).
5. **The wiring** (7) — motivation style. Does a deadline help you or freeze you? Do you want to be pushed or asked? Does public commitment work or backfire? Would you rather be told what to do or choose from options? Do you respond to streaks or do they make you anxious? **These answers configure the coach's voice and the reward mechanics — they are not decoration.**
6. **The ask** (4) — *now* we ask what you want. And by now it's a better answer, because the previous 36 questions have already surfaced the material.

   This is where the recordings are most emphatic and most counterintuitive. Coaches open on **state, not topic** — "How are you coming in?", "Is there anything you need to feel ready?" [TA] One training recording shows "what are your goals" producing a visible deer-in-headlights response in a real client. Marcia Reynolds (MCC) is blunter: asking what someone wants up front "is usually a throwaway question, because they'll just tell you their problem." Her sequence is **story → find the conflict → reflect it back → flip to the desired state → "what needs to be addressed to get you there?"** The Read is that sequence, stretched over 40 questions instead of 40 minutes.

7. **The contract** (3) — the last three questions, and the ones that make every future push legitimate:
   - *"How do you want to be held accountable — in a way that will sound supportive?"* [TA]
   - *"How will I know you've done it?"* [TA]
   - *"What should I do when you go quiet?"*

   These are asked, not assumed. The rationale from a CTI-trained coach: let clients "craft the accountability mechanism they believe will work most effectively, rather than having me impose a construct on them." ICF 3.12 requires revisiting the agreement — so this is renegotiable from settings at any time, and the app should *offer* to renegotiate it after any bad week rather than waiting to be asked.

### The payoff (non-negotiable)

A long intake is only tolerable if it visibly pays. Two payments:

- **Mid-survey, after section 3:** a partial read appears — "Here's what I'm seeing so far" — naming the failure pattern back to them in their own words. This is the moment the survey stops feeling like a form.
- **At the end: the Read.** A real artifact. Their eight domains rendered as a shape, the two that are load-bearing, their named failure pattern, their true weekly capacity in hours, and the one sentence that says what kind of person they are to coach. *Then* the goal conversation happens, informed.

### The rule that keeps it honest

The Read must tell them at least one thing they did not type in. If every line is a rearrangement of their own answers, it's a receipt, not an assessment. The synthesis has to make an inference — "you've quit three things at the six-week mark, all three when you travelled" — and inferences must be labelled as inferences and be dismissible in one tap.

The inverse rule matters just as much: **when the answers are thin, the Read says less.** No pattern claimed without the answer that supports it, no mid-survey payoff fired without something real to say. Silence is honest; a confident wrong read is the fastest way to lose someone's trust in the assessment permanently.

### Two findings that change how this gets built

**1. Let them nudge the numbers.** The strongest single result in the app research: allowing people to adjust an algorithm's output *by a capped amount* moved adoption from **32% to 76%** (Dietvorst et al., 2018) — and people barely used the adjustment. **Agency is the active ingredient, not accuracy.** So the weekly commitment ceiling is presented as *computed, and adjustable by ±1*. That single affordance is worth more than any improvement to the formula behind it.

**2. A half-finished intake is worse than a short one.** Effort produces attachment only when it *completes* — the IKEA effect vanishes on unfinished builds. A 40-question assessment is a real asset at 100% and a pure liability for whoever quits at 60%. Two consequences:
- **The Read must render from partial answers**, at any point, with whatever it honestly has. Nobody leaves empty-handed.
- The completion budget is real: **abandonment climbs past 7–8 minutes**, and answer quality decays measurably as a survey runs long (median time-per-question collapses from ~75s to ~19s). So the questions that matter most — the history section — go early, while the answers are still considered. That's already the ordering; this is why it stays that way.

**Third, for the synthesis step:** narrated loaders — showing what's being worked out rather than a spinner — took completion from **23% to 63%** in one documented case. The Read's generation step should say what it's doing while it does it.

---

## 4. The Sunday (weekly planning)

> Tom: *"you plan big once a week but you can check in every day during the day"*

Fixed day, fixed time, chosen at signup, changeable once a month (not weekly — a movable appointment isn't one).

### The session, in order

The eight-beat arc below is lifted from the recorded MCC sessions, which are strikingly consistent about it: *land the person → open wide → find the real challenge → contract on the outcome → explore → commit → design accountability → close.* Beats 3 and 6 are where amateur versions fail. [TA]

0. **Land before you land the topic.** One question about state, before anything about the week. *"How are you coming in?"* [TA] Sixty seconds. Skippable, but offered every time.
1. **Last week, honestly.** Not a completion percentage. Three questions: What actually happened? What got in the way — the real reason, not the polite one? What surprised you?
2. **The read-back.** The app shows what it observed: which days held and which didn't, and any pattern it can see (*"Both misses were Thursdays"*). Observation only. No verdict, no scolding.
3. **The real challenge.** *"What's the real challenge here **for you**?"* [TA] — Michael Bungay Stanier's wording, and both italicised words are doing work: *real* pushes past the first complaint, *for you* stops the person describing someone else's problem. Follow it with **"And what else?"**, because "the first answer is rarely the best or the only one." Ask it twice, never three times.
4. **The one thing, and the number.** What single outcome would make this week count? One. Then: **on a scale of 1–10, where are you on that today?** The number gets set here and **re-measured at the close of next Sunday.** Diane Ingram (MCC) does exactly this — sets the scale around minute three, restates the contract for confirmation, re-measures at the end — and it's the cleanest way found to make a session's outcome verifiable rather than vibes. [TA]
5. **The commitments — and they shrink, never grow.** 3–5 specific, day-attached actions. "Run" is not a commitment; "run Tue/Thu before work" is.

   **The default pressure runs the wrong way and the app must actively counteract it.** On tape, a coach with an MCC and an ICF board seat says: *"If you could take only one step, which would be most valuable? … I would have no confidence in an ambitious action plan."* [TA] He then *rewards* the client for cutting the plan down, and tests what's left with two questions the app should ask verbatim:
   - *"Does it stretch you enough?"*
   - *"Will you truly commit to it?"*

   Concretely: the UI makes shrinking a commitment a **positive-affordance action with its own affirmation**, not a shameful edit. There is no "add another" button after five, and no encouragement anywhere to do more.
6. **The obstacle, pre-mortemed.** *"What could potentially get in your way?"* then *"How meaningful is it to you?"* [TA] Named in advance, in writing.
7. **The recovery, pre-committed.** *"If [obstacle] happens, I will [smaller version]."* This keeps a missed day from becoming a quit. It has to be written on Sunday, because on Wednesday there's no capacity to write it.
8. **The pre-authorised miss.** The single strongest piece of anti-ghosting language in the whole corpus, and it is said *before* the failure, not after: *"If you don't do it, I still want you to come to the session. We'll learn more by exploring why."* [TA] The app's version is shown at the end of every Sunday, and it is the reason someone opens the check-in on a day they did nothing. **Going quiet has to be made unnecessary, not punished.**

**The artefact ask.** For at least one commitment, the app asks for a *thing*, not a report: a photo, a screenshot, a link, a number. The best-evidenced between-session mechanism found isn't a message at all — it's a pre-agreed deliverable: *"Maybe you could send me a screenshot? … By Friday. I'll look forward to that screenshot. Gotta do it, for making it real."* [TA] An artefact can't be fudged in the way "yeah I did it" can, and it gives the check-in something concrete to receive.

Output: the week, a number to move, and daily check-ins that now have something specific to ask about.

### Skipping Sunday

If Sunday is skipped, the week is not auto-generated. **The app runs the previous week forward unchanged and says so.** Not planning has a consequence — the consequence is a stale week, plainly labeled — but it is never a lockout. Locking someone out of their own app for missing a session is how you lose them permanently.

---

## 5. The Check-in (the daily proactive message)

> Tom: *"it actually checks in with the person every day proactively with customized messages"*

This is the feature. Everything else is scaffolding for it.

### Delivery

- **Web Push** as primary — free, works on installed PWAs including iOS 16.4+, no per-message cost, no phone number.
- **Email** as fallback for anyone who won't grant push.
- **SMS** only if this ever earns money; it's the only channel with a per-message cost and it's the one that feels most like a person.
- **One outbound message per day. Maximum two.** The second only ever exists as a recovery message after a miss, and never two days running. The instant this app sends three messages in a day it becomes the thing people mute, and a muted coach is a deleted coach.

### Timing

Asked at signup and inferred thereafter: **when do you want to be asked?** Two sensible defaults — a morning check-in (intention: what are you doing today) or an evening one (accounting: did it happen). Most people should have both eventually; start with one and let the second be earned, not defaulted on.

### What the message actually says

The customization is the product. A message that says *"Don't forget your goal!"* is worse than no message — it proves nothing is watching. Every message must reference at least two of: **this week's named commitment**, **what they did or didn't do in the last 3 days**, **the obstacle they predicted on Sunday**, **their own words from a prior reflection**.

The generator gets a context bundle:

```
{ name, coachVoice, timeOfDay,
  weekOneThing, commitments[{what, day, done}],
  namedObstacle, preCommittedRecovery,
  last7Days[{date, completed, reflection}],
  streakState, auraBalance, missedYesterday, isComeback,
  domainFocus, failurePattern }
```

…and a hard style contract:

- Under 160 characters. It's a notification, not a letter.
- Never guilt. Never "you failed to." Never an exclamation point on a miss.
- Ask one question, or state one observation. Not both.
- Use their words back at them when you have them.
- **Never claim to have noticed something you didn't measure.** If the data is thin, the message is generic *and short* — that's honest. A fabricated observation ("I noticed you've been crushing it!") destroys the entire premise the first time it's wrong.

### The five situations (the whole taxonomy)

| Situation | What the coach does | Language it uses | What it must never do |
|---|---|---|---|
| **On track** | Name the specific behaviour and its delta. Then get out of the way. | *"You hit Tuesday and Thursday both weeks — first time that's happened."* | Over-celebrate routine compliance; it cheapens the real wins |
| **Slipped once** | Treat it as data. Ask what happened, don't ask why not. | **"What happened for you with this commitment?"** [TA] — never *"why didn't you do this?"* An MCC contrasts these directly: the first makes a client discover, the second makes them defend. | Mention the streak |
| **Gone several days** | One message, low-stakes re-entry. Then *silence* until they answer. | *"It's gone quiet — that's fine. Want to just pick one small thing for today?"* | Send a second, a third, or a "we miss you" |
| **Crushed it** | Hand the praise back to them. | **"Is there anything you want to acknowledge yourself for?"** [TA] — structurally better than the app supplying praise, because the client supplies it | Generic praise |
| **Stuck and avoiding** | The only place the coach pushes — once. Name the avoidance, offer to shrink the task, then **redesign rather than re-exhort.** | *"You said Thursday last week too. How can we make sure the pauses actually happen — what could we design here?"* [TA] | Push twice; re-litigate the original commitment instead of lowering the bar |

**A miss is a goldmine, not a verdict.** A PCC's framing, and the one the copy should be written from: *"If the coachee has not done something they said they would do, then this is maybe a goldmine. What can your coachee learn about herself through this non-action? … There must be not even a hint of blame or judgment."* [TA] The user is accountable to themselves; the app is, in her words, **the checking post.**

**The rule that overrides all of the above: offer structure, accept refusal instantly, never negotiate.** In every Tier-A recording where a coach offered a between-session structure and the client declined — *"I'm pretty self-sufficient… I don't need accountability after the fact"* — the coach dropped it on the spot and moved on. No second attempt, no reframing, no "are you sure?" A user who turns off check-ins gets them turned off, immediately, with no retention flow, no confirmation modal designed to change their mind, and no reactivation nag later. This one is worth more than any engagement number it costs.

### The Sunday ↔ daily loop

Sunday sets what the week is about. The daily check-in is the only thing that knows whether it's happening. Their answers are what next Sunday's read-back is built from. Neither surface is worth much alone — the loop is the product.

---

## 6. Aura

> Tom: *"have rewards system measured in aura"*

Aura replaces XP. Not a rename — a different contract with the user.

### Rules

1. **Aura accumulates and is never taken away.** Not by a missed day, not by a broken streak, not by a bad month.

   This is the one reward decision with direct experimental backing rather than product intuition. Lally et al. (UCL) put the median time to automaticity at **66 days** and found that **missing a single day has no measurable effect on habit formation.** Streak-reset mechanics therefore punish something the underlying research says is inconsequential — and the punishment is severe, because the documented failure mode is the all-or-nothing collapse after a break: the person who misses day 61 and never opens the app again. A number that can be destroyed is a number that will eventually destroy the habit.
2. **Showing up pays.** Answering a check-in earns Aura *even when the answer is "no, I didn't."* This is the load-bearing rule: honest reporting on a bad day has to pay, or people stop reporting on bad days, and then the coach is blind exactly when it's needed.
3. **The hard thing pays most.** Completing something they flagged as avoided or difficult is worth several times a routine tick. The economy should make the person do the thing they're avoiding, not the thing that's easy to tick.
4. **Closing the week pays big.** The Sunday session is the highest single award in the system, because it's the appointment everything else depends on.

### Earning table (v1 — tune with real data, don't guess twice)

| Act | Aura |
|---|---|
| Answer the daily check-in (any answer, including "no") | 10 |
| Complete a daily commitment | 25 |
| Complete a commitment you'd flagged as hard/avoided | 60 |
| Complete every commitment in a week | 100 |
| Finish the Sunday session | 75 |
| Come back after 3+ days away | 40 |

That last row is deliberate and will look wrong to some people. Returning after a lapse is the single most valuable behavior in the product and the hardest one to perform. It should be paid like it.

### Spending it

Aura's sink is **Grace**: spend Aura to take a planned day off with the record intact.

This turns the reward currency into *permission* rather than *pressure*. You earn the right to rest by having shown up. A rest day you paid for is a rest day, not a failure — and the difference between those two framings is, in practice, whether someone is still using the app in March.

**The design of the slack is not a detail, and there's a number on it.** A behavioural study comparing three commitment structures found that *"7 days a week with 2 emergency skips"* beat both *"5 days a week"* and *"7 days, no exceptions"* — **55% vs 22% vs 23% adherence.** The mechanism is that the slack has to be **finite and feel costly.** A freely renewing rest day destroys the effect entirely, because a skip you can always take is a skip that costs nothing to take.

So Grace is bounded on both ends: **priced in Aura** (costly) and **capped per month** (finite). Both constraints, not either.

And Grace is spent **in advance**, never applied retroactively to cover a miss. Retroactive grace is a delete button on the truth, and the truth is the only asset this thing has.

### Which quadrant this occupies

The two reference points in the category split cleanly, and the split is the opportunity:

|  | Forgiving mechanics | Punishing mechanics |
|---|---|---|
| **Manipulative copy** | Duolingo | — |
| **Honest copy** | ← **First Day goes here** | Habitica |

Habitica damages your character — and your party-mates — when you miss a Daily, but its copy is purely transactional. Duolingo's mechanics are forgiving (streak freezes, repair) but its notification voice is guilt-driven, and the emotional-manipulation research on companion apps in this space is genuinely alarming: one Harvard analysis found **37.4% of app farewell messages used a manipulative tactic**, lifting engagement up to 14× — but driven substantially by *anger*, and one such app is now the subject of a 67-page FTC complaint. Engagement bought with anger is a liability wearing a metric's clothes.

**Neither reference app ships both halves.** Forgiving mechanics with honest copy is empty, and it's where this belongs.

**The line, stated once so it can be enforced:** a message may never imply the *system* has needs the user is failing to meet. Not "your coach misses you", not a sad mascot, not a decaying anything. The framing is always that this is for them.

### Display

Aura shows as a **ledger, not a leaderboard** — a running list of what you did and what it was worth. No global ranking, no comparison to other users, ever. The existing public gallery stays what it is: rooms you can visit, not scores you can lose to.

---

## 7. Where the interface comes from

Deliberately borrowed, and named so we borrow the mechanism and not the look:

- **Sunsama's daily planning ritual** — a guided, one-thing-at-a-time flow rather than a dashboard. This is the model for both The Sunday and the daily check-in.
- **Oura / Whoop's single daily number with a one-line advisory** — one legible figure plus one sentence of what to do about it. The lesson is that the sentence is what people read; the number just earns the sentence's credibility.
- **Finch's low-pressure reward economy** — progress that can't be destroyed, care framing over performance framing. Worth copying precisely: **naming happens at step 3 of 8 in onboarding**, before you enter your own name and before any mood or goals intake. The attachment is created before anything is asked of you. Its notification voice is the pet's, not the app's — *"Matcha is awake now, come in and say hi!"*, *"your birb is waiting for you"* — and notably, a guilt-shaped "we miss you" notification could not be found in the wild despite looking for one.
- **Habitica as the cautionary case, with a citation** — Diefenbach (2019), *Counterproductive effects of gamification: an analysis on the example of the gamified task manager Habitica*, Int. J. Human-Computer Studies 127:190–210. Its punishment mechanics (HP loss for missed dailies) are exactly the design this spec rejects. Its one genuinely good idea: **the class system stays locked until level 10** so a new user isn't handed every feature at once — the same logic that says the second daily check-in should be earned, not defaulted on.
- **Duolingo's notification craft, minus its guilt** — the copy quality is genuinely best-in-class; the emotional strategy is the exact opposite of what this app should do.
- **Strava's specificity in acknowledgement** — "third Thursday in a row" instead of "great job."

Named patterns to build with: **bottom sheet** for the daily check-in (it slides from the edge and doesn't take over the room — a modal would block the whole space and break the VISION), **segmented control** for scale answers, **radial progress** for the week, **timeline rail** for the Aura ledger, **card** for each commitment.

---

## 8. Data model (additive — nothing existing changes)

```sql
-- The Read: one row per user, the assessment and its synthesis.
create table profiles (
  user_id uuid primary key references auth.users on delete cascade,
  assessment jsonb not null,       -- every raw answer
  read jsonb not null,             -- the synthesis shown back
  domains jsonb not null,          -- 8 scores
  failure_pattern text,
  weekly_capacity_hours numeric,
  coach_voice text,                -- asked | pushed | plain
  checkin_time time, checkin_tz text, weekly_day int,
  created_at timestamptz default now()
);

-- The Sunday: one row per user per week.
create table weeks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  week_start date not null,
  one_thing text not null,
  commitments jsonb not null,      -- [{what, day, hard:boolean, done:boolean}]
  obstacle text, recovery text,
  review jsonb,                    -- last week's three answers
  stale boolean default false,     -- true when Sunday was skipped
  unique (user_id, week_start)
);

-- The Check-in: one row per outbound message + its reply.
create table checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  sent_at timestamptz not null,
  channel text not null,           -- push | email
  situation text not null,         -- ontrack | slipped | gone | crushed | stuck
  message text not null,           -- exactly what was sent, kept verbatim
  context_hash text,               -- what the generator saw, for debugging bad messages
  replied_at timestamptz, reply jsonb
);

-- Aura: append-only. There is no UPDATE and no DELETE on this table.
create table aura_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  at timestamptz default now(),
  amount int not null,             -- negative only for a Grace purchase
  reason text not null,
  ref_id uuid
);
```

RLS on all four, same `user_id = auth.uid()` contract the goals table already uses. `aura_ledger` gets `insert` + `select` policies only — **no update, no delete policy at all.** The append-only guarantee should be enforced by Postgres, not by remembering.

---

## 9. Build order

**Phase 1 — The Read.** The intake, the synthesis, the artifact. Shippable alone: a free "where do you actually land" assessment is a real thing on its own and is the best top-of-funnel this product will ever have.

**Phase 2 — The Sunday.** The weekly session, writing to `weeks`. Reuses the sprint generator for suggested commitments.

**Phase 3 — The Check-in, inbound half.** The daily surface exists in-app, unpushed. Proves the question set before spending anything on delivery.

**Phase 4 — The Check-in, outbound half.** Web Push, the scheduler, the message generator. **The riskiest phase and the one that makes it a coach.** Build the generator against recorded real context bundles and read a hundred generated messages by hand before a single one is sent to anyone.

**Phase 5 — Aura.** Ledger, Grace, migration of existing XP as an opening balance. Deliberately last: an economy tuned before there's behavior to tune it against is a guess with a table around it.

---

## 10. What actually kills these apps

The first three are mine. The last three come from Epstein et al. (CHI 2016), which is the only peer-reviewed source in the corpus on why people abandon self-tracking — and it disagrees with the popular narrative in a way worth taking seriously.

1. **The messages are generic.** If the daily message reads like a reminder, the premise is dead on contact — and it dies quietly, because people don't complain, they mute. Mitigation: no message ships without ≥2 real context references, and the generator says less rather than fakes more.
2. **The intake is abandoned.** 40 questions is a lot to ask of a stranger. Mitigation: one question per screen, visible progress, the mid-survey payoff at question 19, and a resume that actually works.
3. **It becomes a habit tracker with a chat bubble.** The category's gravity pulls toward checkboxes and streaks because they're easy to build and easy to demo. Quarterly test: **if the daily message stopped, would anyone notice?** If not, we built the wrong thing.
4. **Tracking burden outgrows value.** The most common abandonment path. Every field added is a tax. This is the argument for the check-in being genuinely ~20 seconds and for the artefact ask (a photo is faster than a form) — and the argument against every "just one more input" feature that will get proposed.
5. **The tool self-obsoletes** — people quit because they *learned what they needed*, which is a success the product records as churn. Design consequence: **graduating should be a supported state, not a lapse.** A person who's got what they came for should be offered a lower-cadence mode and a Read-refresh months later, not a win-back campaign.
6. **Privacy — 45.2% of abandoners cited it.** The largest single number in the research and almost absent from how this category talks about itself. This is not a settings-screen problem, it is a product decision: the assessment holds someone's honest read on their money, their relationships and what they keep failing at. Consequences: the Read is **never** part of any published/social surface (the existing gallery already redacts to day titles only — hold that line absolutely) · export and hard-delete are first-class, visible, and work · nothing goes to a third-party analytics tool with content in it · and the check-in copy never surfaces sensitive domain content in a **push notification**, which renders on a lock screen other people can see.

---

## 11. Tom is user zero

`~/projects/morning-gate` (localhost:5159) is the same primitive, running against a real person starting tomorrow: a gated reading, a questionnaire, tasks generated *from the answers* rather than handed down, an hours-cap that refuses to let the day be over-planned, and Aura that pays most for the thing that was being avoided.

It exists to answer the questions this spec can't answer from a chair: does the gate get used on day four · does the reading get read or clicked · does naming the avoided thing actually move it · does an hours-cap feel like help or like nagging.

**Whatever he stops doing by Friday gets cut from this spec before it's built.**
