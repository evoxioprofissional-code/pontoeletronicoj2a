import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

/**
 * Cliente Supabase para Server Components, Route Handlers e Server Actions.
 * Mantém a sessão do usuário via cookies. Sujeito a RLS.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado de um Server Component — a sessão será renovada pelo
            // middleware. Pode ser ignorado com segurança.
          }
        },
      },
    },
  );
}

/**
 * Usuário logado SEM ida ao servidor de Auth: valida o JWT localmente
 * (o projeto usa chaves assimétricas ES256, então getClaims() verifica a
 * assinatura com a JWKS em cache). getUser() fazia uma requisição HTTP extra
 * em cada página/ação — era um dos maiores custos de latência.
 */
export async function usuarioAtual(
  supabase: ReturnType<typeof createClient>,
): Promise<{ id: string } | null> {
  const { data, error } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (error || !sub) return null;
  return { id: sub };
}
