// lib/settings.ts
// Configurações do usuário. Ficam no user_metadata da conta no Supabase
// (chave "settings"), que viaja dentro do token de login: o servidor lê as
// configurações direto do token já verificado, sem consulta extra ao banco.
// Usado no servidor e no navegador.

import { PLATFORMS } from "./constants";
import { DEFAULT_THEME, isThemeId, type ThemeId } from "./themes";

export type UserSettings = {
  theme: ThemeId;
  /** Plataformas que o usuário usa. Vazio = mostrar todas. */
  platforms: string[];
};

export const DEFAULT_SETTINGS: UserSettings = {
  theme: DEFAULT_THEME,
  platforms: [],
};

/**
 * Lê configurações de um valor qualquer (token, corpo de requisição). Campo
 * ausente ou inválido fica com o valor de `fallback` — ao salvar, um tema
 * inválido mantém o atual em vez de voltar ao padrão. Nunca lança erro.
 */
export function parseSettings(
  raw: unknown,
  fallback: UserSettings = DEFAULT_SETTINGS,
): UserSettings {
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    theme: isThemeId(src.theme) ? src.theme : fallback.theme,
    platforms: Array.isArray(src.platforms)
      ? PLATFORMS.filter((p) => (src.platforms as unknown[]).includes(p))
      : fallback.platforms,
  };
}

/**
 * Plataformas para mostrar num seletor: as escolhidas nas configurações (ou
 * todas, se nenhuma foi escolhida), mais as que já estão em uso — um jogo
 * antigo numa plataforma desmarcada continua editável.
 */
export function platformOptions(chosen: string[], inUse: (string | null | undefined)[] = []) {
  const base = chosen.length ? chosen : PLATFORMS;
  const extra = inUse.filter((p): p is string => !!p && !base.includes(p));
  return [...base, ...new Set(extra)];
}
