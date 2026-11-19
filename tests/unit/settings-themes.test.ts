import { describe, expect, it } from "vitest";
import { PLATFORMS } from "@/lib/constants";
import { DEFAULT_SETTINGS, parseSettings, platformOptions } from "@/lib/settings";
import {
  DEFAULT_THEME,
  SYSTEM_THEME,
  THEMES,
  getTheme,
  isThemeId,
  themeCss,
} from "@/lib/themes";

describe("parseSettings", () => {
  it("sem nada salvo, usa o padrão", () => {
    expect(parseSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings("lixo")).toEqual(DEFAULT_SETTINGS);
  });

  it("aceita tema e plataformas válidos", () => {
    expect(parseSettings({ theme: "nord", platforms: ["PS5", "Switch"] })).toEqual({
      theme: "nord",
      platforms: ["PS5", "Switch"].sort(
        (a, b) => PLATFORMS.indexOf(a) - PLATFORMS.indexOf(b),
      ),
    });
  });

  it("descarta plataformas desconhecidas e repetidas", () => {
    const { platforms } = parseSettings({ platforms: ["PS5", "Atari 9000", "PS5", 42] });
    expect(platforms).toEqual(["PS5"]);
  });

  it("campo inválido mantém o valor de reserva (o atual, ao salvar)", () => {
    const atual = { theme: "dracula" as const, platforms: ["N64"] };
    expect(parseSettings({ theme: "tema-que-nao-existe" }, atual)).toEqual(atual);
    expect(parseSettings({ theme: "nord" }, atual)).toEqual({ theme: "nord", platforms: ["N64"] });
  });
});

describe("platformOptions", () => {
  it("sem escolha, oferece todas", () => {
    expect(platformOptions([])).toEqual(PLATFORMS);
  });

  it("inclui as plataformas já em uso, sem repetir", () => {
    expect(platformOptions(["PS5"], ["N64", null, "PS5", "N64", undefined])).toEqual(["PS5", "N64"]);
  });
});

// ─── Temas ───────────────────────────────────────────────────────────────────

/** Contraste WCAG entre duas cores #rrggbb (1 a 21). */
function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("temas", () => {
  it("ids são únicos e o padrão existe", () => {
    const ids = THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(isThemeId(DEFAULT_THEME)).toBe(true);
    expect(isThemeId(SYSTEM_THEME)).toBe(true);
    expect(isThemeId("nao-existe")).toBe(false);
  });

  it.each(THEMES.map((t) => [t.label, t] as const))("%s tem todas as cores em #rrggbb", (_label, theme) => {
    for (const value of Object.values(theme.colors)) {
      expect(value).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  // Legibilidade (WCAG AA): texto 4,5:1; texto do botão principal 3:1
  it.each(THEMES.map((t) => [t.label, t] as const))("%s: texto legível no fundo e nos cartões", (_label, theme) => {
    const c = theme.colors;
    expect(contrast(c.ink, c.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.ink, c.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.muted, c.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.accentInk, c.accent)).toBeGreaterThanOrEqual(3);
  });

  it("themeCss gera as variáveis e o color-scheme", () => {
    const css = themeCss("claro");
    expect(css).toContain("--bg:#f4f4f8;");
    expect(css).toContain("color-scheme:light;");
  });

  it("'Seguir o sistema' troca para o Claro no modo claro", () => {
    const css = themeCss(SYSTEM_THEME);
    expect(css).toContain(`--bg:${getTheme("padrao").colors.bg};`);
    expect(css).toContain("@media (prefers-color-scheme: light)");
    expect(css).toContain(`--bg:${getTheme("claro").colors.bg};`);
  });

  it("tema desconhecido cai no Padrão", () => {
    expect(themeCss("nao-existe")).toBe(themeCss("padrao"));
  });
});
