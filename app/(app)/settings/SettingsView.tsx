"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";
import { showError, showSuccess } from "@/components/ui/Toaster";
import { api, errorText } from "@/lib/api";
import { PLATFORMS } from "@/lib/constants";
import type { UserSettings } from "@/lib/settings";
import {
  SYSTEM_THEME,
  THEMES,
  THEME_STYLE_ID,
  getTheme,
  themeCss,
  type Theme,
  type ThemeId,
} from "@/lib/themes";
import styles from "./settings.module.css";

type SaveResult = { settings: UserSettings };
type SyncResult = { updated: number; skipped?: number; errors?: unknown[] };

/** Aplica o tema na página na hora (antes de o servidor confirmar). */
function previewTheme(id: ThemeId) {
  const style = document.getElementById(THEME_STYLE_ID);
  if (style) style.textContent = themeCss(id);
  document.documentElement.dataset.theme = id;
}

export function SettingsView({
  initial,
  isAdmin,
}: {
  initial: UserSettings;
  /** Mostra as ferramentas de manutenção (só administradores) */
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [theme, setTheme] = useState<ThemeId>(initial.theme);
  const [platforms, setPlatforms] = useState<string[]>(initial.platforms);
  const [savedPlatforms, setSavedPlatforms] = useState<string[]>(initial.platforms);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function save(changes: Partial<UserSettings>, success: string) {
    setSaving(true);
    try {
      const { settings } = await api<SaveResult>("/api/settings", {
        method: "PUT",
        body: changes,
        errorMessage: "Não foi possível salvar as configurações.",
      });
      showSuccess(success);
      // O token deste aparelho foi renovado com as configurações novas:
      // redesenha a página com elas (tema no layout, plataformas nos forms)
      router.refresh();
      return settings;
    } catch (e) {
      showError(errorText(e));
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function chooseTheme(id: ThemeId) {
    if (id === theme || saving) return;
    const previous = theme;
    setTheme(id);
    previewTheme(id);
    const label = id === SYSTEM_THEME ? "Seguir o sistema" : getTheme(id).label;
    const saved = await save({ theme: id }, `Tema "${label}" aplicado.`);
    if (!saved) {
      setTheme(previous);
      previewTheme(previous);
    }
  }

  function togglePlatform(p: string) {
    setPlatforms((list) =>
      list.includes(p) ? list.filter((x) => x !== p) : [...list, p],
    );
  }

  async function savePlatforms() {
    const saved = await save({ platforms }, "Plataformas salvas.");
    if (saved) {
      setPlatforms(saved.platforms);
      setSavedPlatforms(saved.platforms);
    }
  }

  async function refreshChecklists() {
    setRefreshing(true);
    try {
      await api("/api/checklists/refresh", {
        method: "POST",
        errorMessage: "Não foi possível recarregar os checklists.",
      });
      showSuccess("Checklists recarregados: as mudanças do banco já aparecem.");
    } catch (e) {
      showError(errorText(e));
    } finally {
      setRefreshing(false);
    }
  }

  async function syncCovers() {
    setSyncing(true);
    try {
      const r = await api<SyncResult>("/api/igdb/sync-covers", {
        method: "POST",
        errorMessage: "Não foi possível atualizar pela IGDB.",
      });
      const failed = r.errors?.length ?? 0;
      showSuccess(
        r.updated === 0 && failed === 0
          ? "Tudo em dia: nenhum jogo precisava de atualização."
          : `${r.updated} ${r.updated === 1 ? "jogo atualizado" : "jogos atualizados"}` +
              (failed ? ` · ${failed} com erro` : "") +
              ".",
      );
      if (r.updated > 0) router.refresh();
    } catch (e) {
      showError(errorText(e));
    } finally {
      setSyncing(false);
    }
  }

  // Download: o servidor responde com Content-Disposition, a página fica
  function download(format: "json" | "csv") {
    window.location.href = `/api/export?format=${format}`;
  }

  const platformsChanged =
    platforms.length !== savedPlatforms.length ||
    platforms.some((p) => !savedPlatforms.includes(p));
  const dark = THEMES.filter((t) => t.scheme === "dark");
  const light = THEMES.filter((t) => t.scheme === "light");

  return (
    <div className={styles.sections}>
      {/* ── Tema ── */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Tema</h2>
          <p className={styles.sectionText}>
            Inspirados em temas de editores de código. A mudança aparece na hora.
          </p>
        </div>

        <button
          type="button"
          className={`${styles.systemOption} ${theme === SYSTEM_THEME ? styles.selected : ""}`}
          onClick={() => chooseTheme(SYSTEM_THEME)}
          aria-pressed={theme === SYSTEM_THEME}
          disabled={saving}
        >
          <span className={styles.systemSwatches}>
            <ThemeSwatch theme={getTheme("padrao")} />
            <ThemeSwatch theme={getTheme("claro")} />
          </span>
          <span>
            <span className={styles.themeName}>Seguir o sistema</span>
            <span className={styles.themeHint}>
              Padrão quando o aparelho estiver no modo escuro, Claro no modo claro
            </span>
          </span>
          {theme === SYSTEM_THEME && <Check className={styles.selectedIcon} />}
        </button>

        <ThemeGroup title="Escuros" themes={dark} current={theme} onPick={chooseTheme} disabled={saving} />
        <ThemeGroup title="Claros" themes={light} current={theme} onPick={chooseTheme} disabled={saving} />
      </section>

      {/* ── Plataformas ── */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Plataformas que você usa</h2>
          <p className={styles.sectionText}>
            Só elas aparecem ao adicionar ou editar um jogo. Sem nenhuma
            marcada, aparecem todas. Jogos em outras plataformas continuam
            editáveis.
          </p>
        </div>

        <div className={styles.chips}>
          {PLATFORMS.map((p) => {
            const on = platforms.includes(p);
            return (
              <button
                key={p}
                type="button"
                className={`${styles.chip} ${on ? styles.chipOn : ""}`}
                onClick={() => togglePlatform(p)}
                aria-pressed={on}
              >
                {p}
              </button>
            );
          })}
        </div>

        <div className={styles.actions}>
          <span className={styles.count}>
            {platforms.length === 0
              ? "Nenhuma marcada: todas aparecem"
              : `${platforms.length} ${platforms.length === 1 ? "marcada" : "marcadas"}`}
          </span>
          {platforms.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setPlatforms([])}>
              Limpar
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={savePlatforms}
            disabled={saving || !platformsChanged}
          >
            {saving ? "Salvando…" : "Salvar plataformas"}
          </Button>
        </div>
      </section>

      {/* ── Dados ── */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Seus dados</h2>
        </div>

        <div className={styles.row}>
          <div>
            <p className={styles.rowTitle}>Exportar coleção</p>
            <p className={styles.sectionText}>
              JSON tem tudo (jogos, séries e checklists) e serve de backup. CSV
              tem só os jogos, para abrir em planilha.
            </p>
          </div>
          <div className={styles.rowActions}>
            <Button variant="outline" size="sm" onClick={() => download("json")}>
              <Download /> JSON
            </Button>
            <Button variant="outline" size="sm" onClick={() => download("csv")}>
              <Download /> CSV
            </Button>
          </div>
        </div>

        {isAdmin && (
          <>
            <div className={styles.row}>
              <div>
                <p className={styles.rowTitle}>
                  Atualizar capas e temas pela IGDB
                  <span className={styles.adminTag}>Admin</span>
                </p>
                <p className={styles.sectionText}>
                  Preenche a capa e os temas dos seus jogos vinculados à IGDB que
                  ainda não têm. Jogos adicionados pelo formulário já vêm com os
                  dois; isto é para dados antigos ou importados.
                </p>
              </div>
              <div className={styles.rowActions}>
                <Button variant="outline" size="sm" onClick={syncCovers} disabled={syncing}>
                  <RefreshCw className={syncing ? styles.spin : ""} />
                  {syncing ? "Atualizando…" : "Atualizar"}
                </Button>
              </div>
            </div>
            <div className={styles.row}>
              <div>
                <p className={styles.rowTitle}>
                  Recarregar checklists
                  <span className={styles.adminTag}>Admin</span>
                </p>
                <p className={styles.sectionText}>
                  A estrutura dos checklists fica em cache por 1 hora. Depois de
                  adicionar ou mudar jogos, seções ou itens direto no banco, use
                  isto para a mudança aparecer na hora para todos.
                </p>
              </div>
              <div className={styles.rowActions}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshChecklists}
                  disabled={refreshing}
                >
                  <RefreshCw className={refreshing ? styles.spin : ""} />
                  {refreshing ? "Recarregando…" : "Recarregar"}
                </Button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

// ─── Temas ───────────────────────────────────────────────────────────────────
function ThemeGroup({
  title,
  themes,
  current,
  onPick,
  disabled,
}: {
  title: string;
  themes: readonly Theme[];
  current: ThemeId;
  onPick: (id: ThemeId) => void;
  disabled: boolean;
}) {
  return (
    <div className={styles.group}>
      <p className={styles.groupTitle}>{title}</p>
      <ul className={styles.themeGrid}>
        {themes.map((t) => {
          const selected = t.id === current;
          return (
            <li key={t.id}>
              <button
                type="button"
                className={`${styles.themeCard} ${selected ? styles.selected : ""}`}
                onClick={() => onPick(t.id as ThemeId)}
                aria-pressed={selected}
                disabled={disabled}
              >
                <ThemeSwatch theme={t} />
                <span className={styles.themeLabel}>
                  <span className={styles.themeName}>{t.label}</span>
                  {selected && <Check className={styles.selectedIcon} />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Miniatura do tema: fundo, um "cartão", linhas de texto e as cores de status. */
function ThemeSwatch({ theme }: { theme: Theme }) {
  const c = theme.colors;
  return (
    <span className={styles.swatch} style={{ background: c.bg }} aria-hidden>
      <span className={styles.swatchCard} style={{ background: c.surface, borderColor: c.faint }}>
        <span className={styles.swatchLine} style={{ background: c.ink, width: "70%" }} />
        <span className={styles.swatchLine} style={{ background: c.muted, width: "45%" }} />
        <span className={styles.swatchBar} style={{ background: c.faint }}>
          <span style={{ background: c.accent, width: "60%" }} />
        </span>
      </span>
      <span className={styles.swatchDots}>
        {[c.mint, c.blue, c.yellow, c.pink, c.red].map((color, i) => (
          <span key={i} style={{ background: color }} />
        ))}
      </span>
    </span>
  );
}
