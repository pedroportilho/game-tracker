# 🎮 Ludora

*Every game, to 100%.* Personal game collection tracker: games, series, account-recovery backlog,
100% checklists and a stats dashboard. Multi-user, with login.

## Stack

- **Next.js 15** (App Router) — pages + API routes
- **Supabase** — Postgres database and auth
- **IGDB API** (via Twitch OAuth) — covers, genres, themes and game details
- **CSS Modules** — styling (theme tokens in `app/globals.css`)
- **Chart.js**, **dnd-kit** — dashboard charts, drag-to-reorder series

---

## Setup

### 1. Environment variables

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (server only — never expose it) |
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` | [dev.twitch.tv/console](https://dev.twitch.tv/console) → register an app |

### 2. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Every page except
`/login` requires an account.

---

## Tests

```bash
npm test             # unit + API route tests (Vitest) — no server, no database
npm run test:smoke   # hits the running dev server (npm run dev) on :3000
```

- **`tests/unit/`** — checklist math, pt-BR formats, themes (incl. WCAG
  contrast), settings, token verification, middleware redirects/refresh, the
  browser API client and every API route with Supabase/IGDB mocked. The test
  env points Supabase at a fake URL, so a missing mock can never touch real data.
- **`tests/smoke/`** — real HTTP against the running site: pages, CSS files,
  401s and forged-token rejection. With `SMOKE_EMAIL` / `SMOKE_PASSWORD` set,
  it also logs in and opens every page (read-only), then logs out.
- Never run a second `next dev` or `next build` while `npm run dev` is
  running: both write `.next` and break the site.

## How auth works

- `POST /api/auth` signs in with Supabase and stores the access and refresh
  tokens in `httpOnly` cookies.
- `middleware.ts` runs before every request: it refreshes the session when the
  access token is about to expire (it lasts 1h), and redirects to `/login`
  when there is no session. The refresh token keeps you signed in.
- Server pages call `requireUser()`; API routes call `getUserFromRequest()`
  and answer `401` without a session. All queries are filtered by `user_id`.

---

## Project structure

```
app/
├── api/
│   ├── auth/                   # POST login/register, DELETE logout
│   ├── games/ , games/[id]/    # games CRUD
│   ├── series/ , series/entry/ # series, entries, reorder
│   ├── checklists/progress/    # PATCH checklist item progress
│   └── igdb/                   # search, game details, sync-covers
├── login/                      # the only public page
└── (app)/                      # logged-in pages (the group is not in the URL)
    ├── layout.tsx              # shared frame: sidebar + mobile header
    ├── error.tsx               # shared "could not load" screen
    ├── dashboard/              # stats & charts
    ├── games/ , games/[id]/    # game list + detail
    ├── series/                 # series with drag-to-reorder
    ├── backlog/                # lost-account recovery list
    └── checklists/             # 100% checklists per game

components/
├── layout/                     # Sidebar, Page (PageContent, PageHeader, Kpi)
├── ui/                         # Button, Input, Modal, ProgressBar, Toaster
└── GameForm.tsx, …
lib/
├── auth.ts, authCookies.ts     # server-side session (JWT verified locally)
├── authClient.ts               # login/logout from the browser
├── api.ts, errors.ts           # browser → /api calls with uniform errors
├── gamesData.ts, seriesData.ts # games & series data access
├── checklists.ts               # checklist types + completion math (pure)
├── checklistsData.ts           # checklist data access (structure cached 1h)
├── igdb.ts                     # IGDB client (game details cached 1 day)
├── themes.ts                   # theme palettes (base colors; the rest derive in CSS)
├── settings.ts                 # user settings, stored in the account user_metadata
└── constants.ts                # platforms, genres, statuses
middleware.ts                   # session refresh + login redirect
public/checklists/              # checklist icons and logos
```

---

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/dashboard` | Totals, completion, genres/themes, platforms, recent games |
| Games | `/games` | Full list with search, filters, add/edit/delete (IGDB lookup) |
| Game | `/games/[id]` | Details, cover and IGDB info |
| Series | `/series` | Franchises with completion progress and drag-to-reorder |
| Backlog | `/backlog` | Games from lost accounts, to recover |
| Checklists | `/checklists` | 100% checklists with progress per game |
| Settings | `/settings` | Theme (12 editor-inspired palettes), platforms you use, data export, IGDB sync |
