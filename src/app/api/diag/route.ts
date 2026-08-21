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
    anonLen: anon.length,
    anon, // chave anon é pública — usada para comparação exata
    serviceLen: service.length,
    serviceHead: service.slice(0, 8),
    serviceTail: service.slice(-6),
  });
}
