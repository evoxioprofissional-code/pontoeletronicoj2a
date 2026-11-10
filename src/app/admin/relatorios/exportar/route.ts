import { NextResponse, type NextRequest } from "next/server";
import { contextoGestor, carregarBanco } from "@/lib/relatorios";
import {
  mesValido,
  horasDecimais,
  horasRelogio,
  type SituacaoDia,
} from "@/lib/banco";
import { dataLocal, horaLocal, rotuloTipo } from "@/lib/ponto";

export const dynamic = "force-dynamic";

/**
 * Texto seguro para planilha: aspas escapadas e, se começar com caractere de
 * fórmula (= + - @), ganha um apóstrofo — impede que um nome malicioso vire
 * fórmula ao abrir no Excel.
 */
function texto(v: string | null | undefined): string {
  let s = (v ?? "").replace(/\r?\n/g, " ");
  if (/^[=+\-@\t]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** Monta o CSV no padrão do Excel em português: ponto e vírgula + BOM. */
function csv(cabecalho: string[], linhas: string[][]): string {
  return (
    "﻿" +
    [cabecalho.map(texto), ...linhas].map((l) => l.join(";")).join("\r\n") +
    "\r\n"
  );
}

const SITUACAO: Record<SituacaoDia, string> = {
  completo: "Completo",
  incompleto: "Faltou a saída",
  andamento: "Em andamento",
  sem_registro: "Sem registro",
  folga: "",
  futuro: "",
  antes: "",
};

export async function GET(req: NextRequest) {
  // Rotas de arquivo não passam pelo layout do painel: a permissão é
  // verificada aqui.
  const ctx = await contextoGestor();
  if (!ctx) return new NextResponse("Sem permissão.", { status: 403 });

  const mes =
    mesValido(req.nextUrl.searchParams.get("mes")) ??
    dataLocal(new Date()).slice(0, 7);
  const tipo = req.nextUrl.searchParams.get("tipo");
  const linhas = await carregarBanco(ctx.supabase, ctx.empresaId, mes);

  let corpo: string;
  let arquivo: string;

  if (tipo === "marcacoes") {
    arquivo = `marcacoes-${mes}.csv`;
    corpo = csv(
      ["Matrícula", "Nome", "Data", "Hora", "Tipo", "Origem", "Ajustada", "Situação do dia"],
      linhas.flatMap(({ pessoa, banco }) =>
        banco.dias.flatMap((d) =>
          d.marcacoes.map((m) => [
            texto(pessoa.matricula),
            texto(pessoa.nome),
            d.dia.split("-").reverse().join("/"),
            horaLocal(m.marcado_em),
            texto(rotuloTipo(m.tipo)),
            texto(m.metodo_verificacao === "manual" ? "Incluída pelo RH" : "Rosto + GPS"),
            m.ajustado ? "Sim" : "Não",
            texto(SITUACAO[d.situacao]),
          ]),
        ),
      ),
    );
  } else {
    arquivo = `banco-de-horas-${mes}.csv`;
    corpo = csv(
      [
        "Matrícula",
        "Nome",
        "Cargo",
        "Ativo",
        "Jornada diária",
        "Dias com registro",
        "Dias sem saída",
        "Dias úteis sem registro",
        "Trabalhado",
        "Previsto",
        "Saldo do mês",
        "Saldo anterior",
        "Saldo acumulado",
        "Trabalhado (horas decimais)",
        "Saldo do mês (horas decimais)",
        "Saldo acumulado (horas decimais)",
      ],
      linhas.map(({ pessoa, banco }) => [
        texto(pessoa.matricula),
        texto(pessoa.nome),
        texto(pessoa.cargo),
        pessoa.ativo ? "Sim" : "Não",
        horasRelogio(pessoa.cargaMin),
        String(banco.diasTrabalhados),
        String(banco.incompletos),
        String(banco.semRegistro),
        horasRelogio(banco.trabalhadoMin),
        horasRelogio(banco.previstoMin),
        horasRelogio(banco.saldoMin),
        horasRelogio(banco.anteriorMin),
        horasRelogio(banco.acumuladoMin),
        horasDecimais(banco.trabalhadoMin),
        horasDecimais(banco.saldoMin),
        horasDecimais(banco.acumuladoMin),
      ]),
    );
  }

  return new NextResponse(corpo, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${arquivo}"`,
      "Cache-Control": "no-store",
    },
  });
}
