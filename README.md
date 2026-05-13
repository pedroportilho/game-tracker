# 🎮 Game Tracker

Personal game collection tracker built with Next.js 15, Tailwind CSS, and Google Sheets as the database.

## Stack

- **Next.js 15** (App Router) — framework + API routes
- **Tailwind CSS** — styling
- **Google Sheets API v4** — database
- **Vercel** — deploy (free tier)

---

## Setup: Google Sheets + Service Account

### 1. Prepare your spreadsheet

Make sure the sheet named **`Database`** has these exact columns (row 1 = headers):

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| ID | Game | Platform | Date | Platinum? | Completion | Account Status | Genre | Notes |

- `Platinum?` → `TRUE` or `FALSE`
- `Completion` → decimal between 0 and 1 (e.g. `0.75` = 75%)
- `Genre` → comma-separated string (e.g. `RPG, Adventure, Indie`)
- `Date` → year as a number (e.g. `2024`) or Excel serial date

---

### 2. Create a Google Cloud project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Enable the **Google Sheets API**:
   - Search "Google Sheets API" in the search bar
   - Click **Enable**

---

### 3. Create a Service Account

1. In the Google Cloud Console, go to **IAM & Admin → Service Accounts**
2. Click **Create Service Account**
3. Give it a name (e.g. `game-tracker`) and click **Create and Continue**
4. Skip the optional steps, click **Done**
5. Click on the service account you just created
6. Go to the **Keys** tab → **Add Key → Create new key → JSON**
7. Download the JSON file — you'll need it in the next step

---

### 4. Share your spreadsheet with the service account

1. Open the downloaded JSON file and copy the `client_email` value
   (it looks like `game-tracker@your-project.iam.gserviceaccount.com`)
2. Open your Google Spreadsheet
3. Click **Share** and paste the service account email
4. Set permission to **Editor** and click **Send**

---

### 5. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the values:

```env
GOOGLE_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
```

To get the **Spreadsheet ID**: open your spreadsheet and look at the URL:
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_IS_HERE/edit
```

For the **service account JSON**: open the downloaded JSON file, select all content, and paste it as a single line for the value (make sure it's all on one line).

---

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and import the repo
3. In **Environment Variables**, add:
   - `GOOGLE_SPREADSHEET_ID` → your spreadsheet ID
   - `GOOGLE_SERVICE_ACCOUNT_JSON` → the full JSON content (single line)
4. Deploy!

> **Tip**: In Vercel's env var editor, you can paste the entire JSON as the value — Vercel handles multi-line values correctly.

---

## Project structure

```
app/
├── api/
│   ├── games/route.js          # GET all, POST new
│   └── games/[id]/route.js     # PUT update, DELETE
├── dashboard/page.jsx          # Stats & charts
├── games/page.jsx              # Full game list + CRUD
├── backlog/page.jsx            # Lost account recovery list
├── layout.jsx
└── globals.css

components/
├── layout/Sidebar.jsx
├── ui/index.jsx                # Badge, Button, Input, Modal, etc.
└── GameForm.jsx

lib/
├── sheets.js                   # Google Sheets read/write
└── constants.js                # Platforms, genres, statuses
```

---

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/dashboard` | Stats: totals, completion distribution, genres, platforms |
| Games | `/games` | Full list with search, filters, add/edit/delete |
| Recovery Backlog | `/backlog` | Lost Account games grouped by platform |
