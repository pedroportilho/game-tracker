export const PLATFORMS = [
  "3DS",
  "DS",
  "GB",
  "GBA",
  "GBC",
  "Gamecube",
  "N64",
  "NES",
  "PS2",
  "PS3",
  "PS4",
  "PS5",
  "PSP",
  "PSVita",
  "PSX",
  "SNES",
  "Steam",
  "Switch",
  "Switch 2",
  "Wii",
  "WiiU",
  "Windows",
  "Xbox 360",
  "Xbox ONE",
  "Xbox PC",
  "Xbox Series",
  "Epic",
  "GOG",
];

export const ACCOUNT_STATUSES = [
  "Preserved",
  "Lost",
  "Re-earned",
  "Unverified",
];

export const GAME_STATUSES = [
  "Playing",
  "Completed",
  "On Hold",
  "Dropped",
  "Backlog",
];

export const GENRES = [
  "Pinball",
  "Adventure",
  "Indie",
  "Arcade",
  "Visual Novel",
  "Card & Board Game",
  "MOBA",
  "Point-and-click",
  "Fighting",
  "Shooter",
  "Music",
  "Platform",
  "Puzzle",
  "Racing",
  "Real Time Strategy (RTS)",
  "Role-playing (RPG)",
  "Simulator",
  "Sport",
  "Strategy",
  "Turn-based strategy (TBS)",
  "Tactical",
  "Hack and slash/Beat 'em up",
  "Quiz/Trivia",
];

export const STATUS_STYLES = {
  Preserved: {
    bg: "bg-emerald-900/40",
    text: "text-emerald-400",
    border: "border-emerald-700/30",
  },
  Lost: {
    bg: "bg-red-900/40",
    text: "text-red-400",
    border: "border-red-700/30",
  },
  "Re-earned": {
    bg: "bg-blue-900/40",
    text: "text-blue-400",
    border: "border-blue-700/30",
  },
  Unverified: {
    bg: "bg-zinc-800",
    text: "text-zinc-400",
    border: "border-zinc-700/30",
  },
};

// ─── Rótulos em pt-BR ─────────────────────────────────────────────────────────
// Os valores no banco continuam em inglês (filtros, IGDB e dados existentes
// dependem deles); estes mapas só traduzem o que aparece na tela.

export const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  Preserved: "Preservado",
  Lost: "Perdido",
  "Re-earned": "Reconquistado",
  Unverified: "Não verificado",
};

export const GAME_STATUS_LABELS: Record<string, string> = {
  Playing: "Jogando",
  Completed: "Concluído",
  "On Hold": "Pausado",
  Dropped: "Abandonado",
  Backlog: "Na fila",
};

// Gêneros e temas vêm da IGDB (em inglês)
export const GENRE_LABELS: Record<string, string> = {
  Pinball: "Pinball",
  Adventure: "Aventura",
  Indie: "Indie",
  Arcade: "Arcade",
  "Visual Novel": "Visual Novel",
  "Card & Board Game": "Cartas e tabuleiro",
  MOBA: "MOBA",
  "Point-and-click": "Point-and-click",
  Fighting: "Luta",
  Shooter: "Tiro",
  Music: "Música",
  Platform: "Plataforma",
  Puzzle: "Quebra-cabeça",
  Racing: "Corrida",
  "Real Time Strategy (RTS)": "Estratégia em tempo real (RTS)",
  "Role-playing (RPG)": "RPG",
  Simulator: "Simulação",
  Sport: "Esporte",
  Strategy: "Estratégia",
  "Turn-based strategy (TBS)": "Estratégia por turnos (TBS)",
  Tactical: "Tático",
  "Hack and slash/Beat 'em up": "Hack and slash / Beat 'em up",
  "Quiz/Trivia": "Quiz / Perguntas",
};

export const THEME_LABELS: Record<string, string> = {
  Action: "Ação",
  Fantasy: "Fantasia",
  "Science fiction": "Ficção científica",
  Horror: "Terror",
  Thriller: "Suspense",
  Survival: "Sobrevivência",
  Historical: "Histórico",
  Stealth: "Furtividade",
  Comedy: "Comédia",
  Business: "Negócios",
  Drama: "Drama",
  "Non-fiction": "Não ficção",
  Sandbox: "Sandbox",
  Educational: "Educativo",
  Kids: "Infantil",
  "Open world": "Mundo aberto",
  Warfare: "Guerra",
  Party: "Party",
  "4X (explore, expand, exploit, and exterminate)": "4X",
  Erotic: "Erótico",
  Mystery: "Mistério",
  Romance: "Romance",
};

/** Rótulo traduzido; se não houver tradução, mostra o valor original. */
export function labelFor(map: Record<string, string>, value?: string | null) {
  if (!value) return "";
  return map[value] ?? value;
}

// ─── Formatos brasileiros ─────────────────────────────────────────────────────

/** Número com vírgula decimal: 23.7 → "23,7". */
export function formatNumber(value: number, fractionDigits = 0) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/**
 * Fração 0..1 → porcentagem com uma casa: 0.237 → "23,7"; inteiros sem
 * decimal: 0.75 → "75", 1 → "100". Usado em todas as porcentagens do site.
 */
export function formatPercent(fraction: number) {
  const v = Math.round(fraction * 1000) / 10;
  return formatNumber(v, Number.isInteger(v) ? 0 : 1);
}

/** Data da IGDB (timestamp em segundos) → "DD/MM/AAAA". */
export function formatUnixDate(seconds: number) {
  return new Date(seconds * 1000).toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });
}

// Data de conclusão: o banco guarda ISO `YYYY-MM-DD`; exibimos `DD/MM/AAAA`.
// (Os formatos da época da planilha — serial do Excel, "Mon YYYY" — não
// existem mais no banco.)
export function formatGameDate(value: string | null | undefined) {
  if (!value) return null;
  const [y, m, d] = value.split("-");
  return d ? `${d}/${m}/${y}` : value;
}
