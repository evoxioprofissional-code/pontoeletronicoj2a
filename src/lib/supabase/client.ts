import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso no navegador (componentes client).
 * Usa a chave pública (anon) — todo acesso é regido por RLS.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
