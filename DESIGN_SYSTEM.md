# First Day Design System

Reference for all styling decisions. When adding or modifying UI, follow these patterns.

## Colors

### Core Principle

Each color has **one job**. Never use a color outside its designated role.

### Roles

| Role | Token | Hex | Rule |
|------|-------|-----|------|
| **Primary (Blue)** | `teal-600` | `#0284c7` | Buttons, links, focus rings, headings, active states. The dominant UI color. Also `--primary` in shadcn. |
| **Success (Green)** | `lime-400`/`lime-500` | `#a3e635`/`#8eff3d` | Completion and success **only**: checkmarks, completed-day borders, progress indicators, congrats icon. Never decorative. |
| **Negative (Coral)** | `coral-500` | `#ff6b6b` | Missed days and negative states **only**: missed-day indicators, missed-day borders/text. Never for celebrations or decoration. |
| **AI / Distinct Lists (Purple)** | `purple-600` | `#9333ea` | AI-generated content markers (Sparkles icon), scrolling goal suggestion backgrounds, distinct multi-item lists where each item needs a unique color, locked-week badges. |
| **Destructive** | `red-600` | `#d4183d` | Delete account only. Also `--destructive` in shadcn. |
| **Back/Cancel** | `slate-300`/`slate-600` | `#cbd5e1`/`#475569` | Back buttons, cancel buttons, logout. |
| **Neutral** | `gray-*` | — | Body text, borders, subtle backgrounds. |
| **Aurora** | `#7cff67`, `#00c7fc`, `#5227FF` | — | Animated background gradient on authenticated screens. Use `AURORA_COLORS` constant. |

### Note on "teal"

The `teal-*` scale in this project maps to Tailwind's `sky` palette (cyan/blue), not actual teal (green-blue). This is intentional — the name is kept for backward compatibility across ~100 class references. **Never use `cyan-*` directly** — always use `teal-*`.

### Status Colors (Calendar)

| State | Border | Background | Text/Icon |
|-------|--------|------------|-----------|
| **Completed** | `border-lime-400` | `bg-lime-50` | `text-lime-500` (icon), `text-lime-600` (text) |
| **Missed** | `border-coral-300` | `bg-coral-50` | `text-coral-600` |
| **Today** | `border-teal-500` | `bg-teal-50 to-teal-100` | `text-blue-900` |
| **Future** | `border-teal-200` | — | `text-blue-900` |

### Distinct-List Colors (Goal Categories)

Used in scrolling goal suggestions where each category gets a unique aurora-derived color:

| Category | Color | Examples |
|----------|-------|----------|
| Running/Fitness | `#7cff67` (aurora green) | Run a 5K, Get in shape |
| Language/Creative | `#00c7fc` (aurora cyan) | Learn Spanish, Write a book |
| Coding/Professional | `#5227FF` (aurora indigo) | Learn to code, Build a Mobile App |
| Wellness/Lifestyle | `#ff6b6b` (coral) | Start a meditation practice, Cook Healthy Meals |

## Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| **h1** (page title) | Plus Jakarta Sans | `text-3xl md:text-4xl` or `text-4xl md:text-5xl` | `font-bold` |
| **h2** (section title) | Plus Jakarta Sans | `text-2xl` | `font-semibold` |
| **h3** (subsection) | Plus Jakarta Sans | `text-xl` | `font-bold` |
| **Body** | Inter | `text-base` (default) | `font-normal` |
| **Small text** | Inter | `text-sm` | `font-normal` or `font-medium` |

Fonts are loaded via `next/font/google` in `layout.tsx` and applied via CSS variables `--font-plus-jakarta-sans` and `--font-inter` in `globals.css`.

## Buttons

Use shadcn `<Button>` for all buttons. `--primary` is `#0284c7` (teal-600), so the default variant renders as the teal primary button.

| Pattern | Code | When to use |
|---------|------|-------------|
| **Primary** | `<Button>` | Main CTAs: Create Goal, Submit, Generate, Log In |
| **Outline** | `<Button variant="outline" className="border-2 border-teal-600 text-teal-600 hover:bg-teal-50">` | Secondary actions: View Plan, Edit Goal, Send Test Email |
| **Back/Cancel** | `<BackButton>` component | All back/cancel navigation |
| **Destructive** | `<Button variant="destructive">` | Delete Account |
| **Ghost** | `<Button variant="ghost">` | Inline actions (delete icon on goal card) |

### BackButton

Use `<BackButton>` from `@/components/ui/back-button` instead of raw `<button>` elements.

- `<BackButton onClick={onBack} variant="fixed" />` — overlay screens (CalendarView, DayView)
- `<BackButton onClick={onBack} />` — page screens (Settings, PrivacyPolicy, TermsOfService)

## Form Elements

Always use shadcn components, never raw HTML:

- `<Input>` from `@/components/ui/input`
- `<Textarea>` from `@/components/ui/textarea`
- `<Checkbox>` from `@/components/ui/checkbox`
- `<Switch>` from `@/components/ui/switch`
- `<Dialog>` from `@/components/ui/dialog` (never hand-roll modals)

Focus styling: `focus:border-teal-400 focus:ring-4 focus:ring-teal-100`

### Password Validation

Use `validatePassword()` from `@/lib/validation` — enforces >= 6 chars, >= 1 uppercase, >= 1 symbol, >= 2 numbers.

## Shared Constants

Import from `@/constants`:

- `AURORA_COLORS` — Aurora gradient stops, used in all Aurora component instances
- `GOAL_CATEGORY_MAP` — Maps goal strings to categories
- `GOAL_CATEGORY_COLORS` — Tailwind classes for each goal category
- `GOAL_SUGGESTIONS_ROW_1/2/3` — Scrolling goal row arrays

## Shared Modules

- `@/lib/api` — Typed API client: `api.goals.list()`, `api.goals.get(id)`, `api.plan.generate()`, etc.
- `@/hooks/useAuth` — Auth state hook: `{ isAuthenticated, accessToken, userId, userEmail, isLoading, login, logout }`
- `@/types` — TypeScript interfaces: `Goal`, `Plan`, `DayPlan`, `Activity`, `ProgressMap`, `SelectedDay`, `GoalFormData`, `AppView`

## Spacing

Standard Tailwind scale. No custom spacing tokens. Common patterns:
- Page padding: `p-4 md:p-8`
- Section gaps: `space-y-6` or `space-y-8`
- Card padding: `p-3 md:p-6`
- Button gaps: `gap-3`

## Animations

Defined in `globals.css`:
- `.animate-fadeIn` — page content entrance (0.5s)
- `.animate-slideInUp` — card entrance (0.6s)
- `.animate-scaleIn` — modal/dialog entrance (0.4s)
- `.animate-scroll-left` / `.animate-scroll-right` — marquee rows (25s)
- `.transition-smooth` — interactive element hover (0.3s ease-in-out)

## File Organization

```
src/
  app/           — Next.js routes, layout, global styles
  components/    — Feature components (CalendarView, DayView, etc.)
  components/ui/ — shadcn primitives + BackButton
  constants/     — Shared constants (Aurora colors, goal categories)
  hooks/         — Custom hooks (useAuth)
  lib/           — Utilities (API client, Supabase client, validation, cn helper)
  types/         — TypeScript interfaces (Goal, Plan, DayPlan, etc.)
```
