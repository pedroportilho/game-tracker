export const PLATFORMS = [
  '3DS','DS','GB','GBA','GBC','Gamecube','N64','NES',
  'PS2','PS3','PS4','PS5','PSP','PSVita','PSX',
  'SNES','Steam','Switch','Wii','WiiU','Windows',
  'Xbox 360','Xbox ONE','Xbox PC','Xbox Series',
]

export const ACCOUNT_STATUSES = [
  'Preserved',
  'Lost Account',
  'Re-earned',
  'Nintendo',
  'No Proof',
  'RetroAchievements',
]

export const GENRES = [
  'Adventure','Arcade','Card & Board Game','Fighting',
  'Hack and Slash','Indie','MOBA','Music',
  'Platform','Point-and-click','Puzzle','Quiz/Trivia',
  'Racing','Real Time Strategy','RPG','Shooter',
  'Simulator','Sport','Strategy','Tactical',
  'Turn-based Strategy','Visual Novel',
]

export const STATUS_STYLES = {
  'Preserved':        { bg: 'bg-emerald-900/40', text: 'text-emerald-400', border: 'border-emerald-700/30' },
  'Lost Account':     { bg: 'bg-red-900/40',     text: 'text-red-400',     border: 'border-red-700/30' },
  'Re-earned':        { bg: 'bg-blue-900/40',    text: 'text-blue-400',    border: 'border-blue-700/30' },
  'Nintendo':         { bg: 'bg-red-900/30',     text: 'text-red-300',     border: 'border-red-700/20' },
  'No Proof':         { bg: 'bg-zinc-800',       text: 'text-zinc-400',    border: 'border-zinc-700/30' },
  'RetroAchievements':{ bg: 'bg-amber-900/40',   text: 'text-amber-400',   border: 'border-amber-700/30' },
}

// Excel serial → JS Date in UTC (avoids timezone shifting the year)
function serialToUTCDate(serial) {
  if (!serial || isNaN(serial)) return null
  const ms = Math.round((parseFloat(serial) - 25569) * 86400 * 1000)
  return new Date(ms)
}

// Excel serial date → year number
export function serialToYear(serial) {
  const date = serialToUTCDate(serial)
  if (!date) return null
  return date.getUTCFullYear()
}

// Excel serial date → formatted date string (e.g. "Mar 2019")
export function serialToDate(serial) {
  const date = serialToUTCDate(serial)
  if (!date) return null
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export function formatCompletion(val) {
  if (val == null || val === '') return null
  return Math.round(parseFloat(val) * 100)
}
