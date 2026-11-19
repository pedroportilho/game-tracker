import { cache } from "react";
import { PageContent } from "@/components/layout/Page";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge, ProgressBar } from "@/components/ui";
import { getGameById } from "@/lib/gamesData";
import { getGameDetailsCached } from "@/lib/igdb";
import { requireUser } from "@/lib/auth";
import {
  GENRE_LABELS,
  THEME_LABELS,
  formatGameDate,
  labelFor,
} from "@/lib/constants";
import { ArrowLeft, ExternalLink, Calendar, Trophy, Tag } from "lucide-react";
import { GameEditButton } from "@/components/GameEditButton";
import styles from "./game-detail.module.css";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

// Dados extras da IGDB (capa, resumo, empresas…), em cache por 1 dia. Se a
// IGDB falhar, a página abre do mesmo jeito, só sem esses dados.
async function fetchIgdb(igdbId: number | null) {
  if (!igdbId) return null;
  try {
    return await getGameDetailsCached(igdbId);
  } catch (e) {
    console.error("IGDB fetch failed:", e);
    return null;
  }
}

// Usado pelo título da aba e pela página: cache() faz uma busca só
const loadGame = cache(async (id: string) => {
  const user = await requireUser();
  return getGameById(id, user.id);
});

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const game = await loadGame(id);
  return { title: game?.title ?? "Jogo" };
}

export default async function GameDetailPage({ params }: PageProps) {
  const { id } = await params;
  const game = await loadGame(id);
  if (!game) notFound();
  const user = await requireUser(); // já verificado em loadGame (cache)

  const igdb = await fetchIgdb(game.igdb_id);
  const cover = igdb?.cover ?? null;
  const summary = igdb?.summary;
  const igdbPlatforms = igdb?.platforms ?? [];
  const igdbThemes = igdb?.themes ?? [];
  const releaseDate = formatGameDate(igdb?.releaseDate);
  const igdbUrl = igdb?.url ?? null;
  const developers = igdb?.developers ?? [];
  const publishers = igdb?.publishers ?? [];

  // Define quais colunas do corpo existem (se só houver uma, ela ocupa a largura toda)
  const hasMain = Boolean(game.notes || summary);
  const hasFacts =
    Boolean(releaseDate) || developers.length > 0 || publishers.length > 0;
  const hasRail = hasFacts || igdbPlatforms.length > 0;

  return (
    <PageContent>
      {/* ── Barra superior ── */}
      <div className={styles.topNav}>
        <Link href="/games" className={styles.back}>
          <ArrowLeft className={styles.iconSm} /> Voltar para jogos
        </Link>
        <GameEditButton game={game} platforms={user.settings.platforms} />
      </div>

      {/* ── Hero: capa + título ── */}
      <section className={styles.hero}>
        <div className={styles.coverWrap}>
          {cover ? (
            <img src={cover} alt={game.title} className={styles.cover} />
          ) : (
            <div className={styles.coverEmpty}>
              {game.igdb_id ? "Sem capa disponível" : "Não vinculado à IGDB"}
            </div>
          )}
        </div>

        <div className={styles.heroInfo}>
          <div>
            <p className={styles.eyebrow}>{game.id}</p>
            <h1 className={styles.title}>
              {game.title}
              {game.platinum && (
                <Trophy
                  className={styles.titleTrophy}
                  aria-label="Platinado"
                />
              )}
            </h1>

            <div className={styles.meta}>
              <span className={styles.metaPlatform}>{game.platform}</span>
              <StatusBadge status={game.account_status} />
              {game.platinum && (
                <span className={`${styles.metaItem} ${styles.metaPlat}`}>
                  <Trophy className={styles.iconXs} /> Platinado
                </span>
              )}
              {game.date && (
                <span className={styles.metaItem}>
                  <Calendar className={styles.iconXs} />
                  {formatGameDate(game.date)}
                </span>
              )}
            </div>
          </div>

          {game.completion != null && (
            <div className={styles.completion}>
              <p className={styles.label}>Progresso</p>
              <ProgressBar value={game.completion} />
            </div>
          )}

          {(game.genres?.length > 0 || igdbThemes.length > 0 || igdbUrl) && (
  <div className={styles.tagRow}>
{(game.genres?.length > 0 || igdbThemes.length > 0) && (
  <div className={styles.tagGroups}>
    {game.genres?.length > 0 && (
      <div>
        <p className={styles.label}>Gêneros</p>
        <div className={styles.tags}>
          {game.genres.map((g) => (
            <span key={g} className={`${styles.tag} ${styles.tagGenre}`}>
              {labelFor(GENRE_LABELS, g)}
            </span>
          ))}
        </div>
      </div>
    )}

    {igdbThemes.length > 0 && (
      <div>
        <p className={styles.label}>Temas</p>
        <div className={styles.tags}>
          {igdbThemes.map((t) => (
            <span key={t} className={`${styles.tag} ${styles.tagTheme}`}>
              <Tag className={styles.iconXs} />
              {labelFor(THEME_LABELS, t)}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
)}

{igdbUrl && (
  <Link
    href={igdbUrl}
    target="_blank"
    rel="noreferrer"
    className={styles.igdbLink}
  >
    <ExternalLink className={styles.iconSm} /> Ver na IGDB
  </Link>
)}
  </div>
)}
        </div>
      </section>

      {/* ── Corpo: principal + rail ── */}
      {(hasMain || hasRail) && (
        <div
          className={`${styles.layout} ${
            hasMain && hasRail ? "" : styles.layoutSolo
          }`}
        >
          {hasMain && (
            <div className={styles.primary}>
              {game.notes && (
                <section className={styles.block}>
                  <p className={styles.sectionTitle}>Anotações</p>
                  <p className={styles.notes}>{game.notes}</p>
                </section>
              )}

              {summary && (
                <section className={styles.block}>
                  <p className={styles.sectionTitle}>Resumo</p>
                  <p className={styles.summary}>{summary}</p>
                </section>
              )}
            </div>
          )}

          {hasRail && (
            <aside className={styles.rail}>
              {hasFacts && (
                <section className={styles.block}>
                  <p className={styles.sectionTitle}>Detalhes</p>
                  <dl className={styles.facts}>
                    {releaseDate && (
                      <div className={styles.fact}>
                        <dt className={styles.factLabel}>Lançamento</dt>
                        <dd className={styles.factValue}>{releaseDate}</dd>
                      </div>
                    )}

                    {developers.length > 0 && (
                      <div className={styles.fact}>
                        <dt className={styles.factLabel}>
                          {developers.length > 1 ? "Desenvolvedoras" : "Desenvolvedora"}
                        </dt>
                        <dd className={styles.factValue}>
                          {developers.map((d) => (
                            <span key={d}>{d}</span>
                          ))}
                        </dd>
                      </div>
                    )}

                    {publishers.length > 0 && (
                      <div className={styles.fact}>
                        <dt className={styles.factLabel}>
                          {publishers.length > 1 ? "Distribuidoras" : "Distribuidora"}
                        </dt>
                        <dd className={styles.factValue}>
                          {publishers.map((p) => (
                            <span key={p}>{p}</span>
                          ))}
                        </dd>
                      </div>
                    )}
                  </dl>
                </section>
              )}

              {igdbPlatforms.length > 0 && (
                <section className={styles.block}>
                  <p className={styles.sectionTitle}>Disponível em</p>
                  <ul className={styles.platformList}>
                    {igdbPlatforms.map((platform) => (
                      <li key={platform} className={styles.platformItem}>
                        <span className={styles.platformDot} />
                        {platform}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </aside>
          )}
        </div>
      )}
    </PageContent>
  );
}
