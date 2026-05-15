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
      // Normalize whatever the sheet holds (ISO string, DD/MM/YYYY, or Excel
      // serial) into a canonical ISO date `YYYY-MM-DD`. Display formatting
      // lives in `formatGameDate` — this function only produces raw data.
      const raw = row[3]
      if (!raw) return null
      if (typeof raw === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
          const [d, m, y] = raw.split('/')
          return `${y}-${m}-${d}`
        }
        const parsed = new Date(raw)
        if (!isNaN(parsed)) return parsed.toISOString().slice(0, 10)
      }
      const serial = parseFloat(raw)
      if (isNaN(serial)) return null
      const ms = Math.round((serial - 25569) * 86400 * 1000)
      return new Date(ms).toISOString().slice(0, 10)
    })(),
    platinum: row[4] === 'TRUE' || row[4] === true,
    completion: (() => {
      if (row[5] === '' || row[5] == null) return null
      const v = parseFloat(row[5])
      if (isNaN(v)) return null
      return v > 1 ? v / 100 : v
    })(),
    accountStatus: row[6] ?? '',
    genres: row[7] ? row[7].split(',').map((g) => g.trim()).filter(Boolean) : [],
    notes: row[8] ?? '',
    igdbId: row[9] != null && row[9] !== '' ? String(row[9]) : null,
  }
}

function gameToRow(game) {
  // Converte YYYY-MM-DD → DD/MM/YYYY para salvar na planilha
  let dateValue = game.date ?? ''
  if (dateValue && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [y, m, d] = dateValue.split('-')
    dateValue = `${d}/${m}/${y}`
  }

  return [
    game.id,
    game.title,
    game.platform,
    dateValue,
    game.platinum ? 'TRUE' : 'FALSE',
    game.completion != null ? game.completion : '',
    game.accountStatus,
    Array.isArray(game.genres) ? game.genres.join(', ') : game.genres ?? '',
    game.notes ?? '',
    game.igdbId ?? '',
  ]
}

// ─── Series ───────────────────────────────────────────────────────────────────
const SERIES_SHEET = 'Game Specific Series'

function cell(row, colIndex) {
  return row?.[colIndex] ?? null
}

export async function getSeries() {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SERIES_SHEET}!A1:Z`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  })

  const rows = res.data.values ?? []
  if (rows.length === 0) return []

  const seriesList = []

  for (let col = 0; col < 26; col += 3) {
    const groupRows = rows
      .map((row, rowIdx) => ({
        checkboxVal: cell(row, col),
        titleVal: cell(row, col + 1),
        rowIdx,
      }))
      .filter((r) => r.checkboxVal != null || r.titleVal != null)

    if (groupRows.length === 0) continue

    let currentSeries = null

    for (const { checkboxVal, titleVal, rowIdx } of groupRows) {
      const isBoolean = checkboxVal === true || checkboxVal === false ||
                        checkboxVal === 'TRUE' || checkboxVal === 'FALSE'

      if (!isBoolean && checkboxVal != null && checkboxVal !== '') {
        if (currentSeries) seriesList.push(currentSeries)
        currentSeries = { name: String(checkboxVal), entries: [], colIndex: col }
      } else if (titleVal != null && titleVal !== '') {
        if (!currentSeries) currentSeries = { name: '', entries: [], colIndex: col }
        currentSeries.entries.push({
          title: String(titleVal),
          completed: checkboxVal === true || checkboxVal === 'TRUE',
          rowIndex: rowIdx + 1,
          colIndex: col,
        })
      }
    }
    if (currentSeries) seriesList.push(currentSeries)
  }

  return seriesList
}

export async function updateSeriesEntry(rowIndex, colIndex, completed) {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SERIES_SHEET}!${colToLetter(colIndex)}${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[completed ? 'TRUE' : 'FALSE']] },
  })
}

export async function addSeriesEntry(seriesColIndex, title) {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SERIES_SHEET}!A1:Z`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  })
  const rows = res.data.values ?? []

  let targetRow = rows.length + 1
  for (let i = 1; i < rows.length; i++) {
    if (!cell(rows[i], seriesColIndex + 1)) { targetRow = i + 1; break }
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `${SERIES_SHEET}!${colToLetter(seriesColIndex)}${targetRow}`, values: [['FALSE']] },
        { range: `${SERIES_SHEET}!${colToLetter(seriesColIndex + 1)}${targetRow}`, values: [[title]] },
      ],
    },
  })
}

export async function addSeries(name) {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SERIES_SHEET}!A1:Z`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  })
  const rows = res.data.values ?? []
  const headerRow = rows[0] ?? []

  let col = 0
  while (col < 26) {
    if (!cell(headerRow, col) && !cell(headerRow, col + 1)) break
    col += 3
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SERIES_SHEET}!${colToLetter(col)}1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[name]] },
  })

  return col
}

function colToLetter(index) {
  let letter = ''
  let n = index
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter
    n = Math.floor(n / 26) - 1
  }
  return letter
}

// ─── Read ─────────────────────────────────────────────────────────────────────
export async function getGames() {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:J`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  })
  const rows = res.data.values ?? []
  return rows.map(rowToGame).filter((g) => g.id)
}

export async function getGameById(id) {
  const games = await getGames()
  return games.find((g) => g.id === id) ?? null
}

// ─── Create ───────────────────────────────────────────────────────────────────
export async function addGame(game) {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  const games = await getGames()
  const maxNum = games.reduce((max, g) => {
    const n = parseInt(g.id.replace('G', ''), 10)
    return isNaN(n) ? max : Math.max(max, n)
  }, 0)
  const newId = `G${String(maxNum + 1).padStart(4, '0')}`
  const newGame = { ...game, id: newId }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:J`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [gameToRow(newGame)] },
  })

  return newGame
}

// ─── Update ───────────────────────────────────────────────────────────────────
export async function updateGame(id, game) {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:A`,
  })
  const ids = res.data.values ?? []
  const rowIndex = ids.findIndex((r) => r[0] === id)
  if (rowIndex === -1) throw new Error(`Game ${id} not found`)

  const excelRow = rowIndex + 1

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A${excelRow}:J${excelRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [gameToRow({ ...game, id })] },
  })

  return { ...game, id }
}

// ─── Delete ───────────────────────────────────────────────────────────────────
export async function deleteGame(id) {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
  const sheet = meta.data.sheets.find((s) => s.properties.title === SHEET_NAME)
  if (!sheet) throw new Error(`Sheet "${SHEET_NAME}" not found`)
  const sheetId = sheet.properties.sheetId

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
