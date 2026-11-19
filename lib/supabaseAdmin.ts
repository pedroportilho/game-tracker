import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceRole) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL",
  );
}

// Cliente compartilhado do servidor: NUNCA guarda sessão de usuário. Sem
// isso, um login feito nele ficava salvo na memória do processo — as queries
// seguintes passavam a usar o token daquele usuário e o cliente renovava a
// sessão dele em segundo plano, invalidando o refresh token do cookie.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Cliente descartável para login (signInWithPassword), um por requisição. */
export function createAuthClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
