// A página de Jogos roda no navegador ("use client") e não pode exportar
// metadata; o título da aba fica aqui. A página de um jogo define o próprio.
export const metadata = { title: "Jogos" };

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
