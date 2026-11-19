import { Outfit, DM_Sans } from "next/font/google";
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
  // Cada página define só o próprio nome: "Jogos" → "Jogos · The Save File"
  title: { default: "The Save File", template: "%s · The Save File" },
  description: "Sua coleção de jogos, séries e checklists 100%",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${dmSans.variable}`}>
      <body className="bg-[#080a0f] text-zinc-100 font-body antialiased">
        {children}
      </body>
    </html>
  );
}
