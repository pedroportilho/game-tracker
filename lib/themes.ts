// lib/themes.ts
// Temas do site. Cada tema define só as cores base; linhas, fundos de hover,
// brilhos e as cores dos status são derivados delas no globals.css (com
// color-mix), então um tema novo é só mais um objeto aqui.
//
// As paletas são inspiradas em temas populares de editores de código (todos
// de código aberto). Usado no servidor (layout raiz) e no navegador (prévia
// instantânea na página de configurações).

export type ThemeColors = {
  /** fundo da página */
  bg: string;
  /** modais, cartões, menus */
  surface: string;
  /** superfície elevada / placeholders */
  surface2: string;
  /** texto principal */
  ink: string;
  /** texto secundário */
  muted: string;
  /** texto apagado, ícones inativos */
  dim: string;
  /** detalhes quase invisíveis */
  faint: string;
  /** cor de destaque: botões, item ativo, barras */
  accent: string;
  /** destaque em texto/realces sobre o fundo */
  accentSoft: string;
  /** texto sobre um botão da cor de destaque */
  accentInk: string;
  mint: string;
  red: string;
  blue: string;
  sky: string;
  yellow: string;
  pink: string;
};

export type Theme = {
  id: string;
  label: string;
  scheme: "dark" | "light";
  colors: ThemeColors;
};

export const THEMES = [
  {
    id: "padrao",
    label: "Padrão",
    scheme: "dark",
    colors: {
      bg: "#07080d", surface: "#0f1117", surface2: "#27272a",
      ink: "#f4f4f8", muted: "#94a3b8", dim: "#5b6478", faint: "#3f3f46",
      accent: "#8b5cf6", accentSoft: "#a78bfa", accentInk: "#ede9fe",
      mint: "#34d399", red: "#f87171", blue: "#2f7bf5", sky: "#38bdf8",
      yellow: "#f5a623", pink: "#e55b8d",
    },
  },
  {
    id: "dracula",
    label: "Dracula",
    scheme: "dark",
    colors: {
      bg: "#1e1f29", surface: "#282a36", surface2: "#343746",
      ink: "#f8f8f2", muted: "#b4b8d0", dim: "#6272a4", faint: "#44475a",
      accent: "#bd93f9", accentSoft: "#d6b8ff", accentInk: "#1e1f29",
      mint: "#50fa7b", red: "#ff5555", blue: "#8be9fd", sky: "#8be9fd",
      yellow: "#f1fa8c", pink: "#ff79c6",
    },
  },
  {
    id: "tokyo-night",
    label: "Tokyo Night",
    scheme: "dark",
    colors: {
      bg: "#16161e", surface: "#1a1b26", surface2: "#292e42",
      ink: "#c0caf5", muted: "#a9b1d6", dim: "#565f89", faint: "#3b4261",
      accent: "#7aa2f7", accentSoft: "#9ab8ff", accentInk: "#16161e",
      mint: "#9ece6a", red: "#f7768e", blue: "#7aa2f7", sky: "#7dcfff",
      yellow: "#e0af68", pink: "#bb9af7",
    },
  },
  {
    id: "catppuccin-mocha",
    label: "Catppuccin Mocha",
    scheme: "dark",
    colors: {
      bg: "#181825", surface: "#1e1e2e", surface2: "#313244",
      ink: "#cdd6f4", muted: "#a6adc8", dim: "#6c7086", faint: "#45475a",
      accent: "#cba6f7", accentSoft: "#dcc3fb", accentInk: "#1e1e2e",
      mint: "#a6e3a1", red: "#f38ba8", blue: "#89b4fa", sky: "#89dceb",
      yellow: "#f9e2af", pink: "#f5c2e7",
    },
  },
  {
    id: "nord",
    label: "Nord",
    scheme: "dark",
    colors: {
      bg: "#2e3440", surface: "#3b4252", surface2: "#434c5e",
      ink: "#eceff4", muted: "#c2cad8", dim: "#8691a7", faint: "#4c566a",
      accent: "#88c0d0", accentSoft: "#8fbcbb", accentInk: "#2e3440",
      mint: "#a3be8c", red: "#bf616a", blue: "#81a1c1", sky: "#88c0d0",
      yellow: "#ebcb8b", pink: "#b48ead",
    },
  },
  {
    id: "gruvbox",
    label: "Gruvbox",
    scheme: "dark",
    colors: {
      bg: "#1d2021", surface: "#282828", surface2: "#3c3836",
      ink: "#ebdbb2", muted: "#bdae93", dim: "#928374", faint: "#504945",
      accent: "#fe8019", accentSoft: "#fabd2f", accentInk: "#1d2021",
      mint: "#b8bb26", red: "#fb4934", blue: "#83a598", sky: "#8ec07c",
      yellow: "#fabd2f", pink: "#d3869b",
    },
  },
  {
    id: "one-dark",
    label: "One Dark",
    scheme: "dark",
    colors: {
      bg: "#1e2227", surface: "#282c34", surface2: "#2f343e",
      ink: "#e6e9ef", muted: "#abb2bf", dim: "#5c6370", faint: "#3e4451",
      accent: "#61afef", accentSoft: "#8cc4f5", accentInk: "#1e2227",
      mint: "#98c379", red: "#e06c75", blue: "#61afef", sky: "#56b6c2",
      yellow: "#e5c07b", pink: "#c678dd",
    },
  },
  {
    id: "monokai",
    label: "Monokai",
    scheme: "dark",
    colors: {
      bg: "#1e1f1c", surface: "#272822", surface2: "#3e3d32",
      ink: "#f8f8f2", muted: "#cfcfc2", dim: "#75715e", faint: "#49483e",
      accent: "#a6e22e", accentSoft: "#c2f060", accentInk: "#1e1f1c",
      mint: "#a6e22e", red: "#f92672", blue: "#66d9ef", sky: "#66d9ef",
      yellow: "#e6db74", pink: "#ae81ff",
    },
  },
  {
    id: "alto-contraste",
    label: "Alto contraste",
    scheme: "dark",
    colors: {
      bg: "#000000", surface: "#0b0b0b", surface2: "#1f1f1f",
      ink: "#ffffff", muted: "#e0e0e0", dim: "#b3b3b3", faint: "#5c5c5c",
      accent: "#ffd60a", accentSoft: "#ffe566", accentInk: "#000000",
      mint: "#3dff8a", red: "#ff5c5c", blue: "#5cb3ff", sky: "#5ce1ff",
      yellow: "#ffd60a", pink: "#ff70c8",
    },
  },
  {
    id: "claro",
    label: "Claro",
    scheme: "light",
    colors: {
      bg: "#f4f4f8", surface: "#ffffff", surface2: "#e8e8ef",
      ink: "#18181f", muted: "#4b4b58", dim: "#7c7c8c", faint: "#c4c4cf",
      accent: "#7c3aed", accentSoft: "#6d28d9", accentInk: "#ffffff",
      mint: "#059669", red: "#dc2626", blue: "#2563eb", sky: "#0284c7",
      yellow: "#d97706", pink: "#db2777",
    },
  },
  {
    id: "solarized-light",
    label: "Solarized Light",
    scheme: "light",
    colors: {
      bg: "#fdf6e3", surface: "#fffcf2", surface2: "#eee8d5",
      ink: "#073642", muted: "#586e75", dim: "#839496", faint: "#d6cfb9",
      accent: "#268bd2", accentSoft: "#1d6fa8", accentInk: "#fdf6e3",
      mint: "#859900", red: "#dc322f", blue: "#268bd2", sky: "#2aa198",
      yellow: "#b58900", pink: "#d33682",
    },
  },
  {
    id: "catppuccin-latte",
    label: "Catppuccin Latte",
    scheme: "light",
    colors: {
      bg: "#e6e9ef", surface: "#eff1f5", surface2: "#dce0e8",
      ink: "#4c4f69", muted: "#5c5f77", dim: "#8c8fa1", faint: "#bcc0cc",
      accent: "#8839ef", accentSoft: "#7287fd", accentInk: "#eff1f5",
      mint: "#40a02b", red: "#d20f39", blue: "#1e66f5", sky: "#04a5e5",
      yellow: "#df8e1d", pink: "#ea76cb",
    },
  },
] as const satisfies readonly Theme[];

/** "sistema" segue o sistema operacional: Padrão no escuro, Claro no claro. */
export const SYSTEM_THEME = "sistema";
export const DEFAULT_THEME = "padrao";

export type ThemeId = (typeof THEMES)[number]["id"] | typeof SYSTEM_THEME;

export function isThemeId(value: unknown): value is ThemeId {
  return value === SYSTEM_THEME || THEMES.some((t) => t.id === value);
}

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** id do <style> do tema no layout raiz; a página de configurações troca o
 *  conteúdo dele para mostrar a prévia na hora. */
export const THEME_STYLE_ID = "theme-vars";

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS_VARS: Record<keyof ThemeColors, string> = {
  bg: "--bg", surface: "--surface", surface2: "--surface-2",
  ink: "--ink", muted: "--muted", dim: "--dim", faint: "--faint",
  accent: "--accent", accentSoft: "--accent-soft", accentInk: "--accent-ink",
  mint: "--mint", red: "--red", blue: "--blue", sky: "--sky",
  yellow: "--yellow", pink: "--pink",
};

function declarations(theme: Theme) {
  const vars = Object.entries(theme.colors)
    .map(([key, value]) => `${CSS_VARS[key as keyof ThemeColors]}:${value};`)
    .join("");
  // Sombras: pretas e fortes no escuro, suaves no claro
  const shadow = theme.scheme === "dark" ? "rgba(0,0,0,0.6)" : "rgba(40,40,70,0.16)";
  return `${vars}--shadow:${shadow};color-scheme:${theme.scheme};`;
}

/** CSS que aplica o tema ao :root (vai num <style> no layout raiz). */
export function themeCss(id: string): string {
  if (id === SYSTEM_THEME) {
    return (
      `:root{${declarations(getTheme("padrao"))}}` +
      `@media (prefers-color-scheme: light){:root{${declarations(getTheme("claro"))}}}`
    );
  }
  return `:root{${declarations(getTheme(id))}}`;
}
