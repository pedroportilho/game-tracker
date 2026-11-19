import { LoginForm } from "./LoginForm";

export const metadata = { title: "Entrar" };

// Única página aberta sem login — o middleware manda todo o resto para cá.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background:
          "radial-gradient(900px 480px at 50% -10%, rgba(139, 92, 246, 0.16), transparent 60%), #07080d",
      }}
    >
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0f1117] p-8 shadow-2xl">
        <div className="mb-8 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/game-folder.png"
            alt=""
            className="w-14 h-14 shrink-0 object-contain"
          />
          <div>
            <h1 className="text-2xl font-display font-bold text-zinc-100">
              The Save File
            </h1>
            <p className="text-sm text-zinc-400">
              Entre para acessar sua coleção.
            </p>
          </div>
        </div>

        <LoginForm next={next} />
      </div>
    </main>
  );
}
