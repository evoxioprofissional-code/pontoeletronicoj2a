// Configuração PÚBLICA do Supabase (URL + chave anon).
//
// Estes dois valores são públicos por design: a chave anon é protegida por RLS
// e já é embutida no cliente do navegador. Por isso ficam fixos aqui, com a env
// como override — MAS só aceitamos a env se ela for válida (evita o caso de a
// chave ser colada corrompida/mascarada no painel de deploy). A SERVICE_ROLE
// (secreta) NUNCA fica aqui — continua exclusivamente em variável de ambiente.

const FALLBACK_URL = "https://uaseqaryzfffgrpaecdy.supabase.co";
const FALLBACK_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhc2VxYXJ5emZmZmdycGFlY2R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMzAxOTEsImV4cCI6MjEwMjkwNjE5MX0.xbz3oh6t2sJsDIhE6Sir62ZjZ2c3wshRqyqxVNv0nVA";

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// URL só vale se começar com http.
export const SUPABASE_URL =
  envUrl && envUrl.startsWith("http") ? envUrl : FALLBACK_URL;

// Anon só vale se tiver o formato de JWT (3 partes separadas por ponto). Isso
// rejeita valores mascarados/corrompidos (ex.: "eyJhbGci••••").
export const SUPABASE_ANON_KEY =
  envAnon && envAnon.split(".").length === 3 ? envAnon : FALLBACK_ANON;
