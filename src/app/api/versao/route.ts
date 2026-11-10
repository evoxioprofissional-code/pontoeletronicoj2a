import { NextResponse } from "next/server";

// Sempre responde pelo servidor do deploy atual (nunca do cache), para o app
// aberto no celular descobrir que existe uma versão mais nova.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { versao: process.env.NEXT_PUBLIC_BUILD_ID ?? "dev" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
