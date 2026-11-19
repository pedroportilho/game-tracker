import Link from "next/link";
import { formatGameDate } from "@/lib/constants";
import type { Game } from "@/lib/gamesData";
import styles from "./RecentCarousel.module.css";

type Props = {
  games: Game[];
};

export function RecentCarousel({ games }: Props) {
  return (
    <div className={styles.wrap}>
      <div className={styles.track}>
        {games.map((game) => (
          <div key={game.id} className={styles.card}>
            <Link href={`/games/${game.id}`} className={styles.cover}>
              {game.cover ? (
                <img src={game.cover} alt={game.title} loading="lazy" />
              ) : (
                <span className={styles.coverEmpty}>{game.title}</span>
              )}
            </Link>

            <p className={styles.title}>
              <Link href={`/games/${game.id}`}>{game.title}</Link>
            </p>
            <p className={styles.meta}>
              {game.platform} · {formatGameDate(game.date)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
