import { google } from 'googleapis'

// ─── Auth ───────────────────────────────────────────────────────────────────
function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
const SHEET_NAME = 'Database'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function rowToGame(row) {
  return {
    id: row[0] ?? '',
    title: row[1] ?? '',
    platform: row[2] ?? '',
    date: (() => {
      const raw = row[3]
      if (!raw) return null
      // Google Sheets may return ISO string (e.g. '2026-05-11T00:00:00.000Z') or serial number
      if (typeof raw === 'string' && raw.includes('-')) {
        // Parse ISO or YYYY-MM-DD and extract year/month
        const d = new Date(raw)
        if (!isNaN(d)) return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
      }
      // Fall back to Excel serial
      const serial = parseFloat(raw)
      if (isNaN(serial)) return null
      const ms = Math.round((serial - 25569) * 86400 * 1000)
      const d = new Date(ms)
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    })(),
    platinum: row[4] === 'TRUE' || row[4] === true,
    completion: (() => {
      if (row[5] === '' || row[5] == null) return null
      const v = parseFloat(row[5])
      if (isNaN(v)) return null
      // Normalize: if stored as percentage (e.g. 100) convert to decimal (1.0)
      return v > 1 ? v / 100 : v
    })(),
    accountStatus: row[6] ?? '',
    genres: row[7] ? row[7].split(',').map((g) => g.trim()).filter(Boolean) : [],
    notes: row[8] ?? '',
  }
}

function gameToRow(game) {
  return [
    game.id,
    game.title,
    game.platform,
    game.date ?? '',
    game.platinum ? 'TRUE' : 'FALSE',
    game.completion != null ? game.completion : '',
    game.accountStatus,
    Array.isArray(game.genres) ? game.genres.join(', ') : game.genres ?? '',
    game.notes ?? '',
  ]
}

// ─── Read ─────────────────────────────────────────────────────────────────────
export async function getGames() {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:I`,
  })
  const rows = res.data.values ?? []
  return rows.map(rowToGame).filter((g) => g.id)
}

// ─── Create ───────────────────────────────────────────────────────────────────
export async function addGame(game) {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  // Generate next ID
  const games = await getGames()
  const maxNum = games.reduce((max, g) => {
    const n = parseInt(g.id.replace('G', ''), 10)
    return isNaN(n) ? max : Math.max(max, n)
  }, 0)
  const newId = `G${String(maxNum + 1).padStart(4, '0')}`
  const newGame = { ...game, id: newId }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:I`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [gameToRow(newGame)] },
  })

  return newGame
}

// ─── Update ───────────────────────────────────────────────────────────────────
export async function updateGame(id, game) {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  // Find row index
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:A`,
  })
  const ids = res.data.values ?? []
  const rowIndex = ids.findIndex((r) => r[0] === id)
  if (rowIndex === -1) throw new Error(`Game ${id} not found`)

  const excelRow = rowIndex + 1 // 1-indexed; row 1 is header, so data starts at row 2

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A${excelRow}:I${excelRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [gameToRow({ ...game, id })] },
  })

  return { ...game, id }
}

// ─── Delete ───────────────────────────────────────────────────────────────────
export async function deleteGame(id) {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  // Get spreadsheet metadata to find sheetId
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
  const sheet = meta.data.sheets.find((s) => s.properties.title === SHEET_NAME)
  if (!sheet) throw new Error(`Sheet "${SHEET_NAME}" not found`)
  const sheetId = sheet.properties.sheetId

  // Find row index
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:A`,
  })
  const ids = res.data.values ?? []
  const rowIndex = ids.findIndex((r) => r[0] === id)
  if (rowIndex === -1) throw new Error(`Game ${id} not found`)

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    },
  })
}
