import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

/**
 * Cliente administrativo — usa a service_role e IGNORA RLS.
 * NUNCA importe isto em código de cliente. Use apenas em rotas/ações de
 * servidor confiáveis (ex.: cadastro de funcionário, geração de arquivos legais).
 */
export function createAdminClient() {
  return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
