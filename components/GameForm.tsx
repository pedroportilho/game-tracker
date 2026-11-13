"use client";

import { useState, useEffect, useRef, FormEvent, ReactNode } from "react";
import type { Game } from "@/lib/supabase";
import {
  PLATFORMS,
  ACCOUNT_STATUSES,
  GENRES,
  GAME_STATUSES,
} from "@/lib/constants";
import { Search, X, Trophy } from "lucide-react";
import styles from "./GameForm.module.css";

type GameFormState = {
  title: string;
  platform: string;
  date: string;
  platinum: boolean;
  completion: string;
  account_status: string;
  game_status: string;
  genres: string[];
  notes: string;
  igdb_id: number | null;
  cover: string | null;
  themes: string[];
};

type GameFormErrors = {
  title?: string;
  platform?: string;
  account_status?: string;
  game_status?: string;
  genres?: string;
  completion?: string;
  [key: string]: string | undefined;
};

type IgdbSearchResult = {
  id: number;
  name: string;
  cover?: string | null;
  year?: number | null;
  platforms?: string[];
};

type IgdbSearchProps = {
  onPick: (result: IgdbSearchResult) => void;
  currentIgdbId: number | null;
  onClear: () => void;
};

type GameFormProps = {
  initialData?: Partial<Game> | null;
  onSubmit: (data: any) => void | Promise<void>;
  onCancel: () => void;
  loading: boolean;
};

const EMPTY: GameFormState = {
  title: "",
  platform: "",
  date: "",
  platinum: false,
  completion: "",
  account_status: "Preserved",
  game_status: "Backlog",
  genres: [],
  notes: "",
  igdb_id: null,
  cover: null,
  themes: [],
};

// Converte "May 2024" → "2024-05-01" para popular o <input type="date">
function displayDateToInputValue(dateStr?: string | null) {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split("/");
    return `${y}-${m}-${d}`;
  }
  const d = new Date(`${dateStr} 01`);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return "";
}

function validate(form: GameFormState) {
  const e: GameFormErrors = {};
  if (!form.title.trim()) e.title = "Required";
  if (!form.platform) e.platform = "Required";
  if (!form.account_status) e.account_status = "Required";
  if (
    form.completion !== "" &&
    (isNaN(Number(form.completion)) ||
      Number(form.completion) < 0 ||
      Number(form.completion) > 100)
  )
    e.completion = "0–100";
  return e;
}

function mapIgdbGenres(igdbGenres: unknown) {
  const set = new Set(GENRES.map((g) => g.toLowerCase()));
  const out: string[] = [];
  if (!Array.isArray(igdbGenres)) return out;
  for (const g of igdbGenres) {
    const name = typeof g === "string" ? g : (g as any)?.name;
    if (!name) continue;
    if (set.has(name.toLowerCase())) {
      out.push(
        GENRES.find((x) => x.toLowerCase() === name.toLowerCase()) as string,
      );
    } else if (name.toLowerCase().includes("role-playing")) {
      out.push("RPG");
    }
  }
  return [...new Set(out)];
}

// Campo: rótulo pequeno + controle + mensagem de erro
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className={`${styles.field} ${error ? styles.hasError : ""}`}>
      <span className={styles.label}>{label}</span>
      {children}
      {error && <span className={styles.error}>{error}</span>}
    </label>
  );
}

function IgdbSearch({ onPick, currentIgdbId, onClear }: IgdbSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IgdbSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    const isId = /^\d+$/.test(q);
    if (!isId && q.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/igdb/search?q=${encodeURIComponent(q)}`);
        if (res.ok) setResults(await res.json());
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className={styles.lookup} ref={containerRef}>
      <p className={styles.lookupLabel}>
        IGDB lookup
        {currentIgdbId && (
          <span className={styles.linked}>linked #{currentIgdbId}</span>
        )}
      </p>
      <div className={styles.lookupWrap}>
        <Search className={styles.lookupIcon} />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search IGDB by name or paste an ID…"
          className={`${styles.control} ${styles.lookupInput}`}
        />
        {currentIgdbId && (
          <button
            type="button"
            onClick={onClear}
            title="Unlink"
            className={styles.unlink}
          >
            <X className={styles.unlinkIcon} />
          </button>
        )}
      </div>

      {open &&
        (() => {
          const q = query.trim();
          const isId = /^\d+$/.test(q);
          const shouldShow =
            results.length > 0 || loading || isId || q.length >= 2;
          if (!shouldShow) return null;
          return (
            <div className={styles.dropdown}>
              {loading && <div className={styles.dropdownMsg}>Searching…</div>}
              {!loading && results.length === 0 && (q.length >= 2 || isId) && (
                <div className={styles.dropdownMsg}>
                  {isId ? `No game with IGDB ID ${q}` : "No results"}
                </div>
              )}
              {results.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => {
                    onPick(r);
                    setQuery("");
                    setResults([]);
                    setOpen(false);
                  }}
                  className={styles.result}
                >
                  {r.cover ? (
                    <img src={r.cover} alt="" className={styles.resultCover} />
                  ) : (
                    <div className={styles.resultCoverEmpty} />
                  )}
                  <div className={styles.resultText}>
                    <p className={styles.resultName}>{r.name}</p>
                    <p className={styles.resultMeta}>
                      {r.year ?? "—"}
                      {(r.platforms?.length ?? 0) > 0 &&
                        ` · ${r.platforms!.slice(0, 3).join(", ")}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          );
        })()}
    </div>
  );
}

export function GameForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
}: GameFormProps) {
  const [form, setForm] = useState<GameFormState>(() => {
    if (!initialData) return EMPTY;
    return {
      title: initialData.title ?? "",
      platform: initialData.platform ?? "",
      date: displayDateToInputValue(initialData.date),
      platinum: initialData.platinum ?? false,
      // Supabase guarda 0.00–1.00 → exibe 0–100 no input
      completion:
        initialData.completion != null
          ? String(Math.round(initialData.completion * 100))
          : "",
      account_status: initialData.account_status ?? "Preserved",
      game_status: initialData.game_status ?? "Backlog",
      genres: Array.isArray(initialData.genres) ? initialData.genres : [],
      notes: initialData.notes ?? "",
      igdb_id: initialData.igdb_id ?? null,
      cover: initialData.cover ?? null,
      themes: Array.isArray(initialData.themes) ? initialData.themes : [],
    };
  });
  const [errors, setErrors] = useState<GameFormErrors>({});

  const set = (
    key: keyof GameFormState,
    val: GameFormState[keyof GameFormState],
  ) => setForm((f) => ({ ...f, [key]: val }));

  const toggleGenre = (g) =>
    setForm((f) => ({
      ...f,
      genres: f.genres.includes(g)
        ? f.genres.filter((x) => x !== g)
        : [...f.genres, g],
    }));

  async function handlePickIgdb(result) {
    try {
      const res = await fetch(`/api/igdb/games/${result.id}`);
      const data = res.ok ? await res.json() : null;
      setForm((f) => ({
        ...f,
        igdb_id: result.id, // número, não string
        title: data?.name ?? result.name ?? f.title,
        genres: data?.genres ? mapIgdbGenres(data.genres) : f.genres,
        cover: data?.cover ?? f.cover,
        themes: data?.themes ?? f.themes,
      }));
    } catch {
      setForm((f) => ({
        ...f,
        igdb_id: result.id,
        title: result.name ?? f.title,
      }));
    }
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    onSubmit({
      title: form.title.trim(),
      platform: form.platform,
      // "" → null para o Supabase aceitar como date nullable
      date: form.date || null,
      platinum: form.platinum,
      // Input 0–100 → banco 0.00–1.00
      completion: form.completion !== "" ? Number(form.completion) / 100 : null,
      account_status: form.account_status,
      game_status: form.game_status,
      genres: form.genres,
      notes: form.notes.trim() || null,
      igdb_id: form.igdb_id ?? null,
      cover: form.cover ?? null,
      themes: form.themes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <IgdbSearch
        onPick={handlePickIgdb}
        currentIgdbId={form.igdb_id}
        onClear={() => set("igdb_id", null)}
      />

      <Field label="Title" error={errors.title}>
        <input
          className={`${styles.control} ${styles.controlTitle}`}
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
        />
      </Field>

      <div className={styles.grid}>
        <Field label="Platform" error={errors.platform}>
          <select
            className={styles.control}
            value={form.platform}
            onChange={(e) => set("platform", e.target.value)}
          >
            <option value="">Select…</option>
            {PLATFORMS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>

        <Field label="Date">
          <input
            className={styles.control}
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </Field>

        <Field label="Account status" error={errors.account_status}>
          <select
            className={styles.control}
            value={form.account_status}
            onChange={(e) => set("account_status", e.target.value)}
          >
            {ACCOUNT_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>

        <Field label="Game status" error={errors.game_status}>
          <select
            className={styles.control}
            value={form.game_status}
            onChange={(e) => set("game_status", e.target.value)}
          >
            {GAME_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>

        <Field label="Completion %" error={errors.completion}>
          <input
            className={styles.control}
            type="number"
            value={form.completion}
            onChange={(e) => set("completion", e.target.value)}
            placeholder="0–100"
            min="0"
            max="100"
          />
        </Field>

        <label className={styles.platinum}>
          <input
            type="checkbox"
            className={styles.platinumInput}
            checked={form.platinum}
            onChange={(e) => set("platinum", e.target.checked)}
          />
          <Trophy className={styles.platinumIcon} />
          <span className={styles.platinumText}>Platinum / 100%</span>
        </label>
      </div>

      <Field label="Optional Notes">
        <textarea
          className={`${styles.control} ${styles.textarea}`}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={1}
        />
      </Field>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.btnGhost}
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button type="submit" className={styles.btnPrimary} disabled={loading}>
          {loading ? "Saving…" : initialData ? "Save changes" : "Add game"}
        </button>
      </div>
    </form>
  );
}
