// A página de Séries roda no navegador ("use client") e não pode exportar
// metadata; o título da aba fica aqui.
export const metadata = { title: "Séries" };

export default function SeriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
