import { defineConfig } from "vitest/config";

// Teste de fumaça (npm run test:smoke): faz requisições ao servidor que já
// está rodando (npm run dev) e confere se páginas, CSS e APIs respondem.
// Não sobe servidor próprio — dois `next dev` na mesma pasta .next quebram o
// site. Endereço: SMOKE_URL (padrão http://localhost:3000).
export default defineConfig({
  test: {
    include: ["tests/smoke/**/*.test.ts"],
    environment: "node",
    testTimeout: 120_000, // a 1ª visita a cada página compila no dev
  },
});
