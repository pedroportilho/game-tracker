import { LoginForm } from "./LoginForm";
import styles from "./login.module.css";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export const metadata = { title: "Entrar" };

// Única página aberta sem login — o middleware manda todo o resto para cá.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <img src="/images/game-folder.png" alt="" />
          <div>
            <h1 className={styles.title}>{APP_NAME}</h1>
            <p className={styles.subtitle}>{APP_TAGLINE}</p>
          </div>
        </div>

        <LoginForm next={next} />
      </div>
    </main>
  );
}
