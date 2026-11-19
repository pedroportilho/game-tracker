import { Outfit, DM_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/Toaster";
import { getUserFromCookies } from "@/lib/auth";
import { DEFAULT_THEME, THEME_STYLE_ID, themeCss } from "@/lib/themes";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
});

export const metadata = {
  // Cada página define só o próprio nome: "Jogos" → "Jogos · Ludora"
  title: { default: `${APP_NAME} · ${APP_TAGLINE}`, template: `%s · ${APP_NAME}` },
  description:
    "Acompanhe sua coleção de jogos, platinas, séries e checklists de 100%.",
  applicationName: APP_NAME,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // O tema vem do token de login (sem consulta ao banco). Sem login (tela de
  // entrar), usa o padrão. Vai no HTML já renderizado: a página não pisca.
  const user = await getUserFromCookies();
  const theme = user?.settings.theme ?? DEFAULT_THEME;

  return (
    <html
      lang="pt-BR"
      data-theme={theme}
      className={`${outfit.variable} ${dmSans.variable}`}
    >
      <head>
        <style id={THEME_STYLE_ID}>{themeCss(theme)}</style>
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
