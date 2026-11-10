import Link from "next/link";
import type { ReactNode } from "react";
import { CabecalhoPagina } from "@/components/dash/AdminShell";
import { GraficoColunas, type Coluna } from "@/components/dash/GraficoColunas";
import { SeletorMes } from "@/components/SeletorMes";
import { Avatar, Cartao, Etiqueta } from "@/components/ui";
import { ArrowRight, CheckIcon, TipoIcon } from "@/components/icons";
import { formatarMinutos, horaLocal, rotuloTipo, FUSO } from "@/lib/ponto";
import { formatarSaldo, rotuloMes, somarMes, diaDaSemana } from "@/lib/banco";
import type { PainelDados, SituacaoHoje } from "@/lib/painel";

export interface DashboardViewProps {
  empresa: string | null;
  mesAtual: string;
  /** Dia de hoje, "AAAA-MM-DD". */
  hoje: string;
  d: PainelDados;
}

/* ---------- Peças ---------- */

const corSaldo = (min: number) =>
  min > 0 ? "text-ok" : min < 0 ? "text-danger" : "text-ink-2";

/** Horas "redondas" para número grande: 350h 07min → "350h 07". */
function horasGrandes(min: number): { horas: string; minutos: string } {
  const abs = Math.abs(Math.trunc(min));
  return {
    horas: `${min < 0 ? "−" : ""}${Math.floor(abs / 60)}`,
    minutos: String(abs % 60).padStart(2, "0"),
  };
}

function Indicador({
  rotulo,
  children,
  rodape,
  lateral,
}: {
  rotulo: string;
  children: ReactNode;
  rodape: ReactNode;
  lateral?: ReactNode;
}) {
  return (
    <Cartao className="flex min-w-0 flex-col p-5">
      <p className="text-sm font-medium text-ink-2">{rotulo}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-[2rem] font-semibold leading-none tracking-tight text-ink">
          {children}
        </p>
        {lateral}
      </div>
      <p className="mt-3 text-sm text-ink-3">{rodape}</p>
    </Cartao>
  );
}

/** Mini-gráfico de linha (sem eixos) para o indicador de horas. */
function Sparkline({ valores }: { valores: number[] }) {
  if (valores.length < 2 || valores.every((v) => v === 0)) return null;
  const L = 104;
  const A = 36;
  const max = Math.max(...valores);
  const pts = valores.map((v, i) => [
    2 + (i / (valores.length - 1)) * (L - 6),
    A - 4 - (v / max) * (A - 8),
  ]);
  const linha = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
  const [ux, uy] = pts[pts.length - 1];
  return (
    <svg width={L} height={A} aria-hidden className="shrink-0">
      <path d={`${linha}L${ux},${A}L2,${A}Z`} fill="#0E4F5E" opacity={0.1} />
      <path d={linha} fill="none" stroke="#0E4F5E" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={ux} cy={uy} r={4} fill="#0E4F5E" stroke="#fff" strokeWidth={2} />
    </svg>
  );
}

function Painel({
  titulo,
  descricao,
  acao,
  children,
  className = "",
}: {
  titulo: string;
  descricao?: ReactNode;
  acao?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Cartao className={`flex min-w-0 flex-col p-5 sm:p-6 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink">{titulo}</h2>
          {descricao && <p className="mt-0.5 text-sm text-ink-3">{descricao}</p>}
        </div>
        {acao}
      </div>
      {children}
    </Cartao>
  );
}

const linkAcao =
  "inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand hover:text-brand-strong";

/* ---------- Presença ---------- */

const SITUACAO: Record<SituacaoHoje, { rotulo: string; cor: string; texto: string }> = {
  working: { rotulo: "Em turno", cor: "#1F8A5B", texto: "#FFFFFF" },
  break: { rotulo: "Em intervalo", cor: "#D98F1F", texto: "#141C1F" },
  saiu: { rotulo: "Já saiu", cor: "#2B74C8", texto: "#FFFFFF" },
  ausente: { rotulo: "Sem registro", cor: "#DDD8CE", texto: "#48545A" },
};
const ORDEM: SituacaoHoje[] = ["working", "break", "saiu", "ausente"];

function Presenca({ d }: { d: PainelDados }) {
  const total = ORDEM.reduce((a, s) => a + d.hoje.contagem[s], 0);
  const visiveis = d.hoje.pessoas.slice(0, 7);
  const resto = d.hoje.pessoas.length - visiveis.length;

  if (total === 0) {
    return <p className="py-6 text-sm text-ink-3">Nenhum colaborador ativo.</p>;
  }

  return (
    <>
      {/* Uma barra só, dividida pelas situações */}
      <div
        className="flex h-7 gap-0.5"
        role="img"
        aria-label={ORDEM.map((s) => `${SITUACAO[s].rotulo}: ${d.hoje.contagem[s]}`).join(", ")}
      >
        {ORDEM.map((s) => {
          const q = d.hoje.contagem[s];
          if (q === 0) return null;
          return (
            <span
              key={s}
              className="flex min-w-0 items-center rounded px-2 text-sm font-semibold"
              style={{
                flexGrow: q,
                flexBasis: 0,
                background: SITUACAO[s].cor,
                color: SITUACAO[s].texto,
              }}
            >
              {q / total >= 0.12 ? q : ""}
            </span>
          );
        })}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
        {ORDEM.map((s) => (
          <li key={s} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: SITUACAO[s].cor }}
            />
            {SITUACAO[s].rotulo}
            <span className="font-semibold text-ink">{d.hoje.contagem[s]}</span>
          </li>
        ))}
      </ul>

      <ul className="mt-4 divide-y divide-line border-t border-line">
        {visiveis.map((p) => (
          <li key={p.id}>
            <Link
              href={`/admin/funcionario/${p.id}`}
              className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-paper"
            >
              <Avatar nome={p.nome} tamanho="sm" />
              <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-medium text-ink">
                {p.nome}
              </span>
              <span className="flex shrink-0 items-center gap-1.5 text-sm text-ink-2">
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full"
                  style={{ background: SITUACAO[p.situacao].cor }}
                />
                {p.situacao === "ausente"
                  ? "Sem registro"
                  : p.situacao === "working"
                    ? `Entrou ${p.entrada}`
                    : p.situacao === "break"
                      ? `Intervalo ${p.desde}`
                      : `Saiu ${p.desde}`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {resto > 0 && (
        <Link href="/admin/colaboradores" className={`${linkAcao} mt-3`}>
          Ver mais {resto} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </>
  );
}

/* ---------- Horas por colaborador ---------- */

function HorasPorPessoa({ d }: { d: PainelDados }) {
  const itens = d.porPessoa.slice(0, 8);
  const escala = Math.max(1, ...itens.map((p) => Math.max(p.trabalhadoMin, p.previstoMin)));
  if (itens.length === 0) {
    return <p className="py-6 text-sm text-ink-3">Nenhum colaborador cadastrado.</p>;
  }
  return (
    <ul className="flex flex-col gap-3.5">
      {itens.map((p) => (
        <li key={p.id}>
          <Link
            href={`/admin/espelho/${p.id}?mes=${d.mes}`}
            className="-mx-2 block rounded-md px-2 py-1 transition-colors hover:bg-paper"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-[0.9375rem] font-medium text-ink">
                {p.nome}
              </span>
              <span className="shrink-0 text-sm text-ink-2">
                <span className="font-semibold text-ink">
                  {formatarMinutos(p.trabalhadoMin)}
                </span>
                <span className={`ml-2 font-medium ${corSaldo(p.saldoMin)}`}>
                  {formatarSaldo(p.saldoMin)}
                </span>
              </span>
            </div>
            {/* Barra = trabalhado; traço = previsto */}
            <div className="relative mt-2 h-2 rounded-full bg-line">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${(p.trabalhadoMin / escala) * 100}%` }}
              />
              {p.previstoMin > 0 && (
                <span
                  aria-hidden
                  className="absolute -top-1 h-4 w-0.5 rounded-full bg-ink"
                  style={{ left: `calc(${(p.previstoMin / escala) * 100}% - 1px)` }}
                />
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Página ---------- */

const DATA_HORA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO,
  day: "2-digit",
  month: "2-digit",
});
const SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const brData = (dia: string) => dia.split("-").reverse().slice(0, 2).join("/");
/** Com o ano quando não é o ano corrente da tela. */
const brDataAno = (dia: string, hoje: string) =>
  dia.slice(0, 4) === hoje.slice(0, 4)
    ? brData(dia)
    : dia.split("-").reverse().join("/").replace(/\/20(\d\d)$/, "/$1");

function diasAtras(dia: string, hoje: string): number {
  return Math.round(
    (+new Date(`${hoje}T12:00:00Z`) - +new Date(`${dia}T12:00:00Z`)) / 86_400_000,
  );
}

export function DashboardView({ empresa, mesAtual, hoje, d }: DashboardViewProps) {
  const mesNome = rotuloMes(d.mes);
  const mesAnterior = rotuloMes(somarMes(d.mes, -1)).split(" ")[0].toLowerCase();
  const presentes = d.hoje.contagem.working + d.hoje.contagem.break;

  // Gráfico: horas por dia
  const colunasDias: Coluna[] = d.dias.map((x) => ({
    rotulo: String(x.numero),
    valor: x.trabalhadoMin / 60,
    referencia: x.previstoMin / 60,
    apagado: !x.util,
    dica: {
      titulo: `${brData(x.dia)} · ${SEMANA[diaDaSemana(x.dia)]}`,
      linhas: x.futuro
        ? [{ nome: "Ainda não chegou", valor: "—" }]
        : [
            { nome: "Trabalhado", valor: formatarMinutos(x.trabalhadoMin), tipo: "serie" as const },
            { nome: "Previsto", valor: formatarMinutos(x.previstoMin), tipo: "ref" as const },
            { nome: "Pessoas", valor: String(x.pessoas) },
          ],
    },
  }));

  // Gráfico: horário de chegada
  const colunasChegada: Coluna[] = d.chegadas.map((c) => ({
    rotulo: c.faixa,
    valor: c.quantidade,
    dica: {
      titulo: `Entre ${c.faixa} e ${c.ate}`,
      linhas: [
        {
          nome: c.quantidade === 1 ? "Chegada" : "Chegadas",
          valor: String(c.quantidade),
          tipo: "serie" as const,
        },
      ],
    },
  }));

  // Só dias com trabalho: fim de semana zerado faria a linha "despencar" à toa.
  const spark = d.dias
    .filter((x) => !x.futuro && x.trabalhadoMin > 0)
    .map((x) => x.trabalhadoMin);
  const hg = horasGrandes(d.horas.trabalhadoMin);
  const sg = horasGrandes(d.banco.acumuladoMin);
  const pendTotal = d.pendencias.semSaida;

  return (
    <>
      <CabecalhoPagina
        titulo="Visão geral"
        descricao={`${empresa ? `${empresa} · ` : ""}${mesNome}`}
        acao={<SeletorMes mes={d.mes} mesAtual={mesAtual} base="/admin" />}
      />

      {/* Indicadores */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          rotulo="Em turno agora"
          rodape={
            d.hoje.contagem.break > 0
              ? `${d.hoje.contagem.break} em intervalo · ${d.hoje.contagem.ausente} sem registro hoje`
              : `${d.hoje.contagem.saiu} já ${d.hoje.contagem.saiu === 1 ? "saiu" : "saíram"} · ${d.hoje.contagem.ausente} sem registro hoje`
          }
        >
          {presentes}
          <span className="text-xl font-medium text-ink-3"> de {d.equipe.ativos}</span>
        </Indicador>

        <Indicador
          rotulo="Horas trabalhadas no mês"
          lateral={<Sparkline valores={spark} />}
          rodape={
            d.horas.variacaoPct === null ? (
              `Sem registros em ${mesAnterior} para comparar`
            ) : (
              <>
                <span
                  className={`font-semibold ${d.horas.variacaoPct >= 0 ? "text-ok" : "text-danger"}`}
                >
                  {d.horas.variacaoPct >= 0 ? "▲" : "▼"} {Math.abs(d.horas.variacaoPct)}%
                </span>{" "}
                contra o mesmo período de {mesAnterior}
              </>
            )
          }
        >
          {hg.horas}
          <span className="text-xl font-medium text-ink-3">h {hg.minutos}</span>
        </Indicador>

        <Indicador
          rotulo="Banco de horas da equipe"
          rodape={
            <>
              <span className={`font-semibold ${corSaldo(d.banco.saldoMesMin)}`}>
                {formatarSaldo(d.banco.saldoMesMin)}
              </span>{" "}
              só neste mês
            </>
          }
        >
          <span className={corSaldo(d.banco.acumuladoMin)}>
            {d.banco.acumuladoMin > 0 ? "+" : ""}
            {sg.horas}
            <span className="text-xl font-medium opacity-70">h {sg.minutos}</span>
          </span>
        </Indicador>

        <Indicador
          rotulo="Dias para corrigir"
          rodape={
            pendTotal === 0
              ? "Nenhum dia sem saída registrada"
              : "Faltou registrar a saída nesses dias"
          }
        >
          <span className={pendTotal > 0 ? "text-warn" : ""}>{pendTotal}</span>
        </Indicador>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-12">
        {/* Horas por dia */}
        <Painel
          className="xl:col-span-8"
          titulo="Horas trabalhadas por dia"
          descricao="Soma da equipe em cada dia, comparada com a jornada prevista de quem registrou."
        >
          <GraficoColunas
            dados={colunasDias}
            eixo="horas"
            nomeSerie="Trabalhado"
            nomeReferencia="Previsto"
            altura={340}
            destaque={d.diaHoje !== null ? d.diaHoje - 1 : undefined}
            vazio={`Nenhuma marcação em ${mesNome.toLowerCase()}.`}
          />
        </Painel>

        {/* Presença hoje */}
        <Painel
          className="xl:col-span-4"
          titulo="Presença hoje"
          descricao={`${brData(hoje)} · ${SEMANA[diaDaSemana(hoje)]}`}
          acao={
            <Link href="/admin/colaboradores" className={linkAcao}>
              Todos <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          <Presenca d={d} />
        </Painel>

        {/* Horas por colaborador */}
        <Painel
          className="xl:col-span-7"
          titulo="Horas por colaborador"
          descricao="Barra: trabalhado no mês. Traço: o previsto. Ao lado, o saldo do mês."
          acao={
            <Link href={`/admin/banco-horas?mes=${d.mes}`} className={linkAcao}>
              Banco de horas <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          <HorasPorPessoa d={d} />
        </Painel>

        {/* Pendências */}
        <Painel
          className="xl:col-span-5"
          titulo="Para corrigir"
          descricao="Dias em que alguém entrou e não registrou a saída. Enquanto não forem corrigidos, puxam o saldo para baixo."
        >
          {d.semSaida.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg bg-ok-tint px-4 py-3.5 text-sm text-ok">
              <CheckIcon className="h-5 w-5 shrink-0" />
              Tudo em dia: nenhum dia sem saída registrada.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {d.semSaida.slice(0, 5).map((p) => (
                <li
                  key={`${p.id}-${p.dia}`}
                  className="flex items-center gap-3 py-2.5 first:pt-0"
                >
                  <span className="w-[4.5rem] shrink-0 text-sm font-semibold text-ink">
                    {brDataAno(p.dia, hoje)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[0.9375rem] text-ink">
                    {p.nome}
                  </span>
                  <Link
                    href={`/admin/funcionario/${p.id}?d=${-diasAtras(p.dia, hoje)}`}
                    className={linkAcao}
                  >
                    Corrigir
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {d.semSaida.length > 5 && (
            <p className="mt-3 text-sm text-ink-3">
              E mais {d.semSaida.length - 5}. Abra o espelho de cada pessoa em{" "}
              <Link href={`/admin/banco-horas?mes=${d.mes}`} className="font-medium text-brand underline">
                Banco de horas
              </Link>
              .
            </p>
          )}
          {d.pendencias.semRegistro > 0 && (
            <p className="mt-4 border-t border-line pt-3 text-sm text-ink-3">
              Além disso, há{" "}
              <span className="font-semibold text-ink">{d.pendencias.semRegistro}</span>{" "}
              {d.pendencias.semRegistro === 1 ? "dia útil" : "dias úteis"} sem nenhum
              registro. Eles não descontam do saldo.
            </p>
          )}
        </Painel>

        {/* Chegada */}
        <Painel
          className="xl:col-span-6"
          titulo="Horário de chegada"
          descricao={
            d.chegadaTipica
              ? `Primeira entrada de cada pessoa em cada dia. O horário mais comum é por volta das ${d.chegadaTipica}.`
              : "Primeira entrada de cada pessoa em cada dia, em faixas de 10 minutos."
          }
        >
          <GraficoColunas
            dados={colunasChegada}
            eixo="inteiro"
            nomeSerie="Chegadas por horário"
            altura={220}
            vazio={`Nenhuma entrada registrada em ${mesNome.toLowerCase()}.`}
          />
        </Painel>

        {/* Últimas marcações */}
        <Painel
          className="xl:col-span-6"
          titulo="Últimas marcações"
          acao={
            <Link href={`/admin/relatorios?mes=${d.mes}`} className={linkAcao}>
              Relatórios <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          {d.ultimas.length === 0 ? (
            <p className="py-6 text-sm text-ink-3">
              Nenhuma marcação em {mesNome.toLowerCase()}.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {d.ultimas.map((u, i) => (
                <li key={i} className="flex items-center gap-3 py-2.5 first:pt-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand">
                    <TipoIcon tipo={u.tipo} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.9375rem] font-medium text-ink">
                      {u.nome}
                    </span>
                    <span className="flex flex-wrap items-center gap-x-2 text-sm text-ink-3">
                      {rotuloTipo(u.tipo)}
                      {u.manual && <Etiqueta>Incluída pelo RH</Etiqueta>}
                      {u.ajustado && !u.manual && <Etiqueta tom="aviso">Ajustada</Etiqueta>}
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-sm text-ink-2">
                    <span className="block font-semibold text-ink">
                      {horaLocal(u.marcado_em)}
                    </span>
                    {DATA_HORA.format(new Date(u.marcado_em))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Painel>
      </div>
    </>
  );
}
