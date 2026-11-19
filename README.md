# 🎮 The Save File

Personal game collection tracker: games, series, account-recovery backlog,
100% checklists and a stats dashboard. Multi-user, with login.

## Stack

- **Next.js 15** (App Router) — pages + API routes
- **Supabase** — Postgres database and auth
- **IGDB API** (via Twitch OAuth) — covers, genres, themes and game details
- **Tailwind CSS** + CSS Modules — styling
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
├── dashboard/                  # stats & charts
├── games/ , games/[id]/        # game list + detail
├── series/                     # series with drag-to-reorder
├── backlog/                    # lost-account recovery list
└── checklists/                 # 100% checklists per game

components/                     # Sidebar, GameForm, ui (Button, Modal…)
lib/
├── auth.ts, authCookies.ts     # server-side session helpers
├── authClient.ts               # login/logout from the browser
├── supabase.ts                 # games & series data access
├── checklists.ts               # checklist types + completion math (pure)
├── checklistsData.ts           # checklist data access
├── igdb.ts                     # IGDB client
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
