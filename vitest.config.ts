import path from "node:path";
import { defineConfig } from "vitest/config";

// Testes unitários e de rotas (npm test). Rodam sem servidor e sem banco:
// o Supabase recebe URL/chaves falsas e cada teste simula o que precisa.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    env: {
      // Falsos de propósito: nenhum teste pode alcançar o banco de verdade
      NEXT_PUBLIC_SUPABASE_URL: "https://test-project.supabase.invalid",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
      TWITCH_CLIENT_ID: "test-client-id",
      TWITCH_CLIENT_SECRET: "test-client-secret",
    },
    restoreMocks: true,
  },
});
