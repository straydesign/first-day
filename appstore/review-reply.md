# Reply to App Review — Guideline 2.1 Information Needed (submission bdb35b44)

Paste the text below into the App Review reply AND into
App Store Connect → App Review Information → Notes. Attach the screen recording.

---

Hello App Review team,

Thank you for the review. Here is the information you asked for. The screen recording is attached. It was captured on a physical iPhone running the latest iOS and starts at app launch.

1. Screen recording
Attached. It shows: launch → "Try the demo" → Sign in with Apple → create a goal (including the one-time consent prompt before the goal is sent for plan generation) → the generated first week → completing a day → Settings → Delete account.

2. Purpose and audience
FirstDay.life helps a person start on a goal they keep putting off, such as learning guitar or building a morning routine. The user writes the goal in one line. The app builds a plan for the first week, with a few small activities per day. When a week is done, the next week is built from how the last one went (the user's daily notes and how many activities they finished). Four weeks in all. Streaks, points and badges help the user keep going.
Audience: adults who want to learn a skill or build a habit and want a clear next step each day.

3. How to access the main features
- No login is needed to look around: tap "Try the demo" on the first screen. The demo shows a sample plan in progress.
- To use the full app, sign in with Apple (or Google). No demo credentials are needed.
- Create a goal: tap "Add new goal", type a goal, choose a level, and tap "Generate My Plan". Before the first plan is made, the app asks for consent to send the goal text to Anthropic. A plan takes about 20 seconds.
- Open a day to check off activities and write a short note, then tap "Complete Day".
- Settings → Daily reminders: an optional evening reminder (off by default; asks for notification permission).
- Settings → Delete account: deletes the account and all of its data.

4. External services
- Supabase: database and sign-in (authentication).
- Sign in with Apple and Google Sign-In, through Supabase Auth.
- Anthropic (Claude API): writes the weekly plan from the user's goal and notes. Users consent in the app before any goal text is sent.
- Vercel: hosts the plan-generation API at firstday.life.
There are no payments, ads, analytics or tracking SDKs.

5. Regional differences
None. The app works the same in all regions. All content is in English.

6. Regulated industries / third-party material
Not applicable. The app is not in a regulated industry and does not include protected third-party material. User content (goals and daily notes) is private to each account; there is no sharing between users.

Thank you,
Tom Sesler
