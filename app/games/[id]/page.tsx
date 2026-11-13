import Link from "next/link";
import { notFound } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/Sidebar";
import { StatusBadge, CompletionBar } from "@/components/ui";
import { getGameById } from "@/lib/supabase";
import { getGame, igdbImageUrl } from "@/lib/igdb";
import { getUserFromCookies } from "@/lib/auth";
import { formatGameDate } from "@/lib/constants";
import { ArrowLeft, ExternalLink, Calendar, Trophy, Tag } from "lucide-react";
import { GameEditButton } from "@/components/GameEditButton";
import styles from "./game-detail.module.css";

export const dynamic = "force-dynamic";

async function fetchIgdb(igdbId) {
  if (!igdbId) return null;
  try {
    return await getGame(igdbId);
  } catch (e) {
    console.error("IGDB fetch failed:", e);
    return null;
  }
}

export default async function GameDetailPage({ params }) {
  const user = await getUserFromCookies();
  if (!user) {
    return (
      <div className={styles.authFallback}>
        <Sidebar />
        <div className={styles.authBox}>
          <h1 className={styles.authTitle}>Login required</h1>
          <p className={styles.authText}>
            Sign in from the Games page to view game details.
          </p>
          <Link href="/games" className={styles.igdbLink}>
            Go to Games
          </Link>
        </div>
      </div>
    );
  }

  const { id } = await params;
  const game = await getGameById(id, user.id);
  if (!game) notFound();

  const igdb = await fetchIgdb(game.igdb_id);
  const cover = igdbImageUrl(igdb?.cover?.url, "cover_big");
  const summary = igdb?.summary;
  const igdbPlatforms = (igdb?.platforms ?? [])
    .map((p) => p.name || p.abbreviation)
    .filter(Boolean);
  const igdbThemes = (igdb?.themes ?? []).map((t) => t.name).filter(Boolean);
  const releaseDate = igdb?.first_release_date
    ? new Date(igdb.first_release_date * 1000).toLocaleDateString("pt-BR", {
        timeZone: "UTC",
      })
    : null;
  const igdbUrl = igdb?.url ?? null;
  const companies = igdb?.involved_companies ?? [];
  const developers = companies
    .filter((c) => c.developer)
    .map((c) => c.company?.name)
    .filter(Boolean);
  const publishers = companies
    .filter((c) => c.publisher)
    .map((c) => c.company?.name)
    .filter(Boolean);

  // Define quais colunas do corpo existem (se só houver uma, ela ocupa a largura toda)
  const hasMain = Boolean(game.notes || summary);
  const hasFacts =
    Boolean(releaseDate) || developers.length > 0 || publishers.length > 0;
  const hasRail = hasFacts || igdbPlatforms.length > 0;

  return (
    <div className={styles.detailPage}>
      <Sidebar />

      <div className={styles.main}>
        <MobileHeader title={game.title} />

        <main className={styles.content}>
          {/* ── Barra superior ── */}
          <div className={styles.topNav}>
            <Link href="/games" className={styles.back}>
              <ArrowLeft className={styles.iconSm} /> Back to games
            </Link>
            <GameEditButton game={game} />
          </div>

          {/* ── Hero: capa + título ── */}
          <section className={styles.hero}>
            <div className={styles.coverWrap}>
              {cover ? (
                <img src={cover} alt={game.title} className={styles.cover} />
              ) : (
                <div className={styles.coverEmpty}>
                  {game.igdb_id ? "No cover available" : "Not linked to IGDB"}
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
                      aria-label="Platinum"
                    />
                  )}
                </h1>

                <div className={styles.meta}>
                  <span className={styles.metaPlatform}>{game.platform}</span>
                  <StatusBadge status={game.account_status} />
                  {game.platinum && (
                    <span className={`${styles.metaItem} ${styles.metaPlat}`}>
                      <Trophy className={styles.iconXs} /> Platinum
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
                  <p className={styles.label}>Completion</p>
                  <CompletionBar value={game.completion} />
                </div>
              )}

              {(game.genres?.length > 0 || igdbThemes.length > 0 || igdbUrl) && (
  <div className={styles.tagRow}>
    {(game.genres?.length > 0 || igdbThemes.length > 0) && (
      <div className={styles.tagGroups}>
        {game.genres?.length > 0 && (
          <div>
            <p className={styles.label}>Genres</p>
            <div className={styles.tags}>
              {game.genres.map((g) => (
                <span key={g} className={`${styles.tag} ${styles.tagGenre}`}>
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}

        {igdbThemes.length > 0 && (
          <div>
            <p className={styles.label}>Themes</p>
            <div className={styles.tags}>
              {igdbThemes.map((t) => (
                <span key={t} className={`${styles.tag} ${styles.tagTheme}`}>
                  <Tag className={styles.iconXs} />
                  {t}
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
        <ExternalLink className={styles.iconSm} /> View on IGDB
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
                      <p className={styles.sectionTitle}>Notes</p>
                      <p className={styles.notes}>{game.notes}</p>
                    </section>
                  )}

                  {summary && (
                    <section className={styles.block}>
                      <p className={styles.sectionTitle}>Summary</p>
                      <p className={styles.summary}>{summary}</p>
                    </section>
                  )}
                </div>
              )}

              {hasRail && (
                <aside className={styles.rail}>
                  {hasFacts && (
                    <section className={styles.block}>
                      <p className={styles.sectionTitle}>Details</p>
                      <dl className={styles.facts}>
                        {releaseDate && (
                          <div className={styles.fact}>
                            <dt className={styles.factLabel}>Released</dt>
                            <dd className={styles.factValue}>{releaseDate}</dd>
                          </div>
                        )}

                        {developers.length > 0 && (
                          <div className={styles.fact}>
                            <dt className={styles.factLabel}>
                              Developer{developers.length > 1 ? "s" : ""}
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
                              Publisher{publishers.length > 1 ? "s" : ""}
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
                      <p className={styles.sectionTitle}>Available on</p>
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
        </main>
      </div>
    </div>
  );
}
