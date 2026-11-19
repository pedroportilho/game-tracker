"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  StatusBadge,
  ProgressBar,
  Button,
  Modal,
  Select,
} from "@/components/ui";
import { GameForm } from "@/components/GameForm";
import { PageHeader } from "@/components/layout/Page";
import {
  ACCOUNT_STATUSES,
  GAME_STATUSES,
  ACCOUNT_STATUS_LABELS,
  GAME_STATUS_LABELS,
  labelFor,
  formatGameDate,
} from "@/lib/constants";
import { Pencil, Trash2, Plus, Search, Trophy } from "lucide-react";
import { api, errorText } from "@/lib/api";
import { showError } from "@/components/ui/Toaster";
import type { Game, GameInput } from "@/lib/gamesData";
import styles from "./games.module.css";

// Cor do ponto de cada status (mesmas cores da rosca do dashboard)
const STATUS_TONE: Record<string, string> = {
  Completed: styles.sCompleted,
  Backlog: styles.sBacklog,
  "On Hold": styles.sOnHold,
  Playing: styles.sPlaying,
  Dropped: styles.sDropped,
};

// Parte interativa da página de jogos. Os dados chegam prontos do servidor
// (page.tsx); daqui em diante a lista é atualizada localmente após cada
// adicionar / editar / excluir, sem buscar tudo de novo.
export function GamesView({
  initialGames,
  platforms,
}: {
  initialGames: Game[];
  /** Plataformas escolhidas nas configurações (vazio = todas) */
  platforms: string[];
}) {
  const [games, setGames] = useState<Game[]>(initialGames);
  const [saving, setSaving] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [editGame, setEditGame] = useState<Game | null>(null);
  const [deleteGame, setDeleteGame] = useState<Game | null>(null);

  const [search, setSearch] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPlatinum, setFilterPlatinum] = useState("");
  const [filterGameStatus, setFilterGameStatus] = useState("");
  const [sortBy, setSortBy] = useState("title");

  // Os três handlers têm o mesmo formato: chama a API, atualiza a lista
  // local e fecha o modal; se falhar, o modal fica aberto e aparece o aviso.
  async function save(action: () => Promise<void>) {
    setSaving(true);
    try {
      await action();
    } catch (e) {
      showError(errorText(e));
    } finally {
      setSaving(false);
    }
  }

  const handleAdd = (data: GameInput) =>
    save(async () => {
      const created = await api<Game>("/api/games", {
        method: "POST",
        body: data,
        errorMessage: "Não foi possível adicionar o jogo.",
      });
      setGames((g) => [...g, created]);
      setAddOpen(false);
    });

  const handleEdit = (data: GameInput) =>
    save(async () => {
      const updated = await api<Game>(`/api/games/${editGame!.id}`, {
        method: "PUT",
        body: data,
        errorMessage: "Não foi possível salvar as alterações.",
      });
      setGames((g) => g.map((x) => (x.id === updated.id ? updated : x)));
      setEditGame(null);
    });

  const handleDelete = () =>
    save(async () => {
      const id = deleteGame!.id;
      await api(`/api/games/${id}`, {
        method: "DELETE",
        errorMessage: "Não foi possível excluir o jogo.",
      });
      setGames((g) => g.filter((x) => x.id !== id));
      setDeleteGame(null);
    });

  // O filtro só oferece plataformas que aparecem na sua coleção
  const platformsInUse = useMemo(
    () => [...new Set(games.map((g) => g.platform))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [games],
  );

  const filtered = useMemo(() => {
    let list = [...games];
    if (search)
      list = list.filter((g) =>
        g.title.toLowerCase().includes(search.toLowerCase()),
      );
    if (filterPlatform)
      list = list.filter((g) => g.platform === filterPlatform);
    if (filterStatus)
      list = list.filter((g) => g.account_status === filterStatus);
    if (filterPlatinum === "yes") list = list.filter((g) => g.platinum);
    if (filterPlatinum === "no") list = list.filter((g) => !g.platinum);
    if (filterGameStatus)
      list = list.filter((g) => g.game_status === filterGameStatus);
    list.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title, "pt-BR");
      if (sortBy === "completion")
        return (b.completion ?? -1) - (a.completion ?? -1);
      if (sortBy === "platform") return a.platform.localeCompare(b.platform, "pt-BR");
      if (sortBy === "date") {
        // Datas são ISO (AAAA-MM-DD): comparar texto já ordena certo.
        // Jogos sem data vão para o fim.
        if (!a.date || !b.date) return a.date ? -1 : b.date ? 1 : 0;
        return b.date.localeCompare(a.date);
      }
      return 0;
    });
    return list;
  }, [
    games,
    search,
    filterPlatform,
    filterStatus,
    filterPlatinum,
    filterGameStatus,
    sortBy,
  ]);

  const hasActiveFilters =
    filterPlatform || filterStatus || filterPlatinum || filterGameStatus;

  return (
    <>
      <PageHeader
        title="Jogos"
        subtitle={`${filtered.length} de ${games.length} jogos`}
        actions={
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            <Plus className={styles.iconSm} />
            <span className={styles.addLabel}>Adicionar jogo</span>
          </Button>
        }
      />

      {/* ── Busca + filtros ── */}
      <section className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search className={styles.searchIcon} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar jogos…"
            className={styles.search}
          />
        </div>

        <div className={styles.controls}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Plataforma</span>
            <Select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
            >
              <option value="">Todos</option>
              {platformsInUse.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Status da conta</span>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Todos</option>
              {ACCOUNT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {labelFor(ACCOUNT_STATUS_LABELS, s)}
                </option>
              ))}
            </Select>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Platina</span>
            <Select
              value={filterPlatinum}
              onChange={(e) => setFilterPlatinum(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="yes">Platinados</option>
              <option value="no">Sem platina</option>
            </Select>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Status do jogo</span>
            <Select
              value={filterGameStatus}
              onChange={(e) => setFilterGameStatus(e.target.value)}
            >
              <option value="">Todos</option>
              {GAME_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {labelFor(GAME_STATUS_LABELS, s)}
                </option>
              ))}
            </Select>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Ordenar</span>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="title">A → Z</option>
              <option value="date">Mais recentes</option>
              <option value="completion">Progresso</option>
              <option value="platform">Plataforma</option>
            </Select>
          </label>

          {hasActiveFilters && (
            <button
              type="button"
              className={styles.clear}
              onClick={() => {
                setFilterPlatform("");
                setFilterStatus("");
                setFilterPlatinum("");
                setFilterGameStatus("");
              }}
            >
              Limpar
            </button>
          )}
        </div>
      </section>

      {/* ── Lista ── */}
      {filtered.length === 0 ? (
        <p className={styles.empty}>Nenhum jogo encontrado</p>
      ) : (
        <ul className={styles.list}>
          {filtered.map((g) => {
            const date = formatGameDate(g.date);

            return (
              <li key={g.id} className={styles.row}>
                {/* Título e informações */}
                <div className={styles.rowMain}>
                  <Link href={`/games/${g.id}`} className={styles.title}>
                    {g.title}
                  </Link>

                  <div className={styles.meta}>
                    <span>{g.platform}</span>

                    {g.account_status && (
                      <>
                        <span className={styles.sep}>·</span>
                        <StatusBadge status={g.account_status} />
                      </>
                    )}

                    {date && (
                      <>
                        <span className={styles.sep}>·</span>
                        <span>{date}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Status do jogo + progresso */}
                <div className={styles.rowSide}>
                  <div className={styles.rowStatus}>
                    {/* Coluna fixa do troféu: fica vazia sem platina,
                        para o status ficar alinhado em todas as linhas */}
                    <span className={styles.trophySlot}>
                      {g.platinum && (
                        <Trophy
                          className={styles.trophy}
                          aria-label="Platinado"
                        />
                      )}
                    </span>
                    {g.game_status && (
                      <span
                        className={`${styles.status} ${
                          STATUS_TONE[g.game_status] ?? ""
                        }`}
                      >
                        <span className={styles.statusDot} />
                        {labelFor(GAME_STATUS_LABELS, g.game_status)}
                      </span>
                    )}
                  </div>

                  <div className={styles.rowBar}>
                    <ProgressBar value={g.completion} />
                  </div>
                </div>

                {/* Ações */}
                <div className={styles.rowActions}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditGame(g)}
                    aria-label={`Editar ${g.title}`}
                  >
                    <Pencil className={styles.iconXs} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteGame(g)}
                    aria-label={`Excluir ${g.title}`}
                  >
                    <Trash2
                      className={`${styles.iconXs} ${styles.iconDanger}`}
                    />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="Adicionar jogo"
      >
        <GameForm
          onSubmit={handleAdd}
          onCancel={() => setAddOpen(false)}
          loading={saving}
          platforms={platforms}
        />
      </Modal>
      <Modal
        isOpen={!!editGame}
        onClose={() => setEditGame(null)}
        title="Editar jogo"
      >
        {editGame && (
          <GameForm
            initialData={editGame}
            onSubmit={handleEdit}
            onCancel={() => setEditGame(null)}
            loading={saving}
            platforms={platforms}
          />
        )}
      </Modal>
      <Modal
        isOpen={!!deleteGame}
        onClose={() => setDeleteGame(null)}
        title="Excluir jogo"
      >
        {deleteGame && (
          <div className={styles.confirm}>
            <p className={styles.confirmText}>
              Tem certeza de que deseja excluir{" "}
              <span className={styles.confirmName}>{deleteGame.title}</span>?
              Essa ação não pode ser desfeita.
            </p>
            <div className={styles.confirmActions}>
              <Button
                variant="ghost"
                onClick={() => setDeleteGame(null)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={saving}>
                {saving ? "Excluindo…" : "Excluir"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}