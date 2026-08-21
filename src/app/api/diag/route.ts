// Diagnóstico temporário — informa se as variáveis de ambiente chegaram no
// build/runtime da Vercel. NÃO expõe os valores secretos (só presença/tamanho).
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return Response.json({
    hasUrl: url.length > 0,
    urlHost: url || null,
    hasAnon: anon.length > 0,
    anonLen: anon.length,
    hasService: service.length > 0,
    serviceLen: service.length,
  });
}
