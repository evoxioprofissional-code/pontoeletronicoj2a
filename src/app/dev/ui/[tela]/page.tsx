// Pré-visualização das telas com dados de exemplo — SÓ em desenvolvimento.
// Serve para conferir o layout sem login, GPS ou câmera. Em produção dá 404.
import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeView } from "@/components/views/HomeView";
import { RegistrosView, type DiaRegistro } from "@/components/views/RegistrosView";
import { PerfilView } from "@/components/views/PerfilView";
import { SemVinculo } from "@/components/views/SemVinculo";
import { DashboardView } from "@/components/views/admin/DashboardView";
import { ColaboradoresView } from "@/components/views/admin/ColaboradoresView";
import { FuncionarioView } from "@/components/views/admin/FuncionarioView";
import { CercaView } from "@/components/views/admin/CercaView";
import { AdminShell } from "@/components/dash/AdminShell";
import { NovoColaborador } from "@/components/dash/NovoColaborador";
import { PreviaCliente } from "./PreviaCliente";
import LoginPage from "@/app/login/page";
import { BancoHorasView } from "@/components/views/admin/BancoHorasView";
import { RelatoriosView } from "@/components/views/admin/RelatoriosView";
import { EspelhoView } from "@/components/views/EspelhoView";
import { montarPainel } from "@/lib/painel";
import { equipeExemplo } from "@/lib/dados-exemplo";
import { calcularMes } from "@/lib/banco";
import type { MarcacaoBanco } from "@/lib/relatorios";
import {
  dataLocal,
  minutosTrabalhados,
  type MarcacaoLite,
  type TipoDB,
} from "@/lib/ponto";

export const dynamic = "force-dynamic";

const hoje = dataLocal(new Date());
const em = (dia: string, hora: string) =>
  new Date(`${dia}T${hora}:00-03:00`).toISOString();
const diaMenos = (n: number) => dataLocal(new Date(Date.now() - n * 86_400_000));

const CERCAS = [
  { nome: "Fábrica", latitude: -6.466205, longitude: -37.102361, raio_metros: 100 },
];

const marc = (dia: string, horas: string[]): MarcacaoLite[] => {
  const tipos: TipoDB[] = ["entrada", "inicio_intervalo", "fim_intervalo", "saida"];
  return horas.map((h, i) => ({ tipo: tipos[i % 4], marcado_em: em(dia, h) }));
};

const HOJE_PARCIAL = marc(hoje, ["07:58", "12:01"]);

const DIAS: DiaRegistro[] = [
  { chave: hoje, marcacoes: marc(hoje, ["07:58", "12:01", "13:00"]) },
  { chave: diaMenos(1), marcacoes: marc(diaMenos(1), ["08:02", "12:00", "13:04", "17:36"]) },
  { chave: diaMenos(2), marcacoes: marc(diaMenos(2), ["07:55", "12:03", "13:01"]) },
  { chave: diaMenos(3), marcacoes: marc(diaMenos(3), ["08:00", "12:00", "13:00", "18:42"]) },
  { chave: diaMenos(4), marcacoes: marc(diaMenos(4), ["08:11", "11:58", "12:59", "17:30"]) },
];

const TELAS = [
  "home",
  "home-novo",
  "home-fora",
  "home-gps",
  "registros",
  "registros-vazio",
  "perfil",
  "comprovante",
  "camera",
  "sem-vinculo",
  "login",
  "admin",
  "admin-vazio",
  "admin-banco",
  "admin-espelho",
  "admin-relatorios",
  "admin-colaboradores",
  "admin-novo",
  "admin-funcionario",
  "admin-cerca",
] as const;

export default function Previa({ params }: { params: { tela: string } }) {
  if (process.env.NODE_ENV === "production") notFound();

  const pessoa = { nome: "Maurício Coura", gestor: true };

  switch (params.tela) {
    case "indice":
      return (
        <main className="mx-auto max-w-md p-6">
          <h1 className="mb-4 text-xl font-semibold">Telas</h1>
          <ul className="space-y-1">
            {TELAS.map((t) => (
              <li key={t}>
                <Link className="text-brand underline" href={`/dev/ui/${t}`}>
                  {t}
                </Link>
              </li>
            ))}
          </ul>
        </main>
      );

    case "home":
      return (
        <HomeView
          {...pessoa}
          cercas={CERCAS}
          temFace
          marcacoes={HOJE_PARCIAL}
          cargaMin={480}
          trabalhadoMin={minutosTrabalhados(HOJE_PARCIAL)}
          geoDemo={{
            fase: "ok",
            lat: -6.4662,
            lng: -37.1023,
            precisao: 14,
            dentro: true,
            distancia: 12,
            raio: 100,
            local: "Fábrica",
          }}
        />
      );
    case "home-novo":
      return (
        <HomeView
          nome="Carla Andrade"
          gestor={false}
          cercas={CERCAS}
          temFace={false}
          marcacoes={[]}
          cargaMin={360}
          trabalhadoMin={0}
          geoDemo={{ fase: "carregando" }}
        />
      );
    case "home-fora":
      return (
        <HomeView
          nome="Carla Andrade"
          gestor={false}
          cercas={CERCAS}
          temFace
          marcacoes={[]}
          cargaMin={360}
          trabalhadoMin={0}
          geoDemo={{
            fase: "ok",
            precisao: 22,
            dentro: false,
            distancia: 267,
            raio: 100,
          }}
        />
      );
    case "home-gps":
      return (
        <HomeView
          {...pessoa}
          cercas={CERCAS}
          temFace
          marcacoes={marc(hoje, ["07:58", "12:01", "13:00", "17:31"])}
          cargaMin={480}
          trabalhadoMin={514}
          geoDemo={{ fase: "negado" }}
        />
      );

    case "registros":
      return <RegistrosView {...pessoa} dias={DIAS} hoje={hoje} />;
    case "registros-vazio":
      return <RegistrosView {...pessoa} dias={[]} hoje={hoje} />;

    case "perfil":
      return (
        <PerfilView
          nome="Maurício Coura"
          cargo="Operador de máquinas"
          matricula="04871"
          papel="admin"
          empresa="J2A Indústria"
          temFace
          cerca={{
            nome: "Fábrica",
            endereco:
              "Rua José Vieira de Maria, 401b, João XXIII, Caicó, Rio Grande do Norte, 59300-000",
            raio_metros: 100,
          }}
        />
      );

    case "comprovante":
    case "camera":
      return <PreviaCliente tela={params.tela} agora={em(hoje, "13:02")} />;

    case "sem-vinculo":
      return <SemVinculo />;
    case "login":
      return <LoginPage />;

    case "admin": {
      const agora = new Date();
      const { pessoas, registros } = equipeExemplo(agora);
      return (
        <AdminShell rotaAtiva="/admin">
          <DashboardView
            empresa="J2A Indústria"
            mesAtual={hoje.slice(0, 7)}
            hoje={hoje}
            d={montarPainel(pessoas, registros, hoje.slice(0, 7), agora)}
          />
        </AdminShell>
      );
    }
    case "admin-vazio": {
      const agora = new Date();
      const pessoas = equipeExemplo(agora).pessoas.slice(0, 3);
      return (
        <AdminShell rotaAtiva="/admin">
          <DashboardView
            empresa="J2A Indústria"
            mesAtual={hoje.slice(0, 7)}
            hoje={hoje}
            d={montarPainel(pessoas, new Map(), hoje.slice(0, 7), agora)}
          />
        </AdminShell>
      );
    }
    case "admin-banco":
    case "admin-espelho":
    case "admin-relatorios": {
      const agora = new Date();
      const { pessoas, registros } = equipeExemplo(agora);
      const mes = hoje.slice(0, 7);
      const linhas = pessoas.map((p, i) => ({
        pessoa: { ...p, matricula: String(4870 + i).padStart(5, "0"), cargo: "Produção" },
        banco: calcularMes(mes, (registros.get(p.id) ?? []) as MarcacaoBanco[], p.cargaMin, agora),
      }));
      return (
        <AdminShell rotaAtiva={params.tela === "admin-relatorios" ? "/admin/relatorios" : "/admin/banco-horas"}>
          {params.tela === "admin-banco" ? (
            <BancoHorasView mes={mes} mesAtual={mes} linhas={linhas} />
          ) : params.tela === "admin-relatorios" ? (
            <RelatoriosView
              mes={mes}
              mesAtual={mes}
              pessoas={linhas.map((l) => l.pessoa)}
            />
          ) : (
            <EspelhoView
              empresa={{ nome: "J2A Indústria", cnpj: "12.345.678/0001-90" }}
              pessoa={linhas[0].pessoa}
              banco={linhas[0].banco}
              mesAtual={mes}
              hoje={hoje}
              base="/dev/ui/admin-espelho"
              voltar={{ href: "/dev/ui/admin-banco", rotulo: "Banco de horas" }}
              corrigirBase="/admin/funcionario/1"
            />
          )}
        </AdminShell>
      );
    }
    case "admin-colaboradores":
      return (
        <AdminShell rotaAtiva="/admin/colaboradores">
          <ColaboradoresView
            funcionarios={[
              { id: "1", matricula: "04871", nome: "Maurício Coura", cargo: "Operador de máquinas", cargaMin: 480, trabalhadoMin: 305, status: "working" },
              { id: "2", matricula: "04872", nome: "Jucelino Batista de Araújo", cargo: "Soldador", cargaMin: 480, trabalhadoMin: 243, status: "break" },
              { id: "3", matricula: "04890", nome: "Carla Andrade", cargo: "Almoxarifado", cargaMin: 360, trabalhadoMin: 372, status: "off" },
              { id: "4", matricula: "00001", nome: "Rita Medeiros", cargo: null, cargaMin: 480, trabalhadoMin: 0, status: "off" },
            ]}
          />
        </AdminShell>
      );
    case "admin-novo":
      return (
        <AdminShell rotaAtiva="/admin/colaboradores">
          <NovoColaborador aberto />
        </AdminShell>
      );
    case "admin-funcionario":
      return (
        <AdminShell rotaAtiva="/admin/funcionario/1">
          <FuncionarioView
            func={{ id: "1", nome: "Maurício Coura", matricula: "04871", cargo: "Operador de máquinas" }}
            cargaMin={480}
            trabalhadoMin={243}
            offset={-1}
            dia={diaMenos(1)}
            rotuloDia="Ontem"
            marcacoes={[
              { id: "a", tipo: "entrada", marcado_em: em(diaMenos(1), "07:58"), metodo_verificacao: "facial", ajustado: false },
              { id: "b", tipo: "inicio_intervalo", marcado_em: em(diaMenos(1), "12:01"), metodo_verificacao: "facial", ajustado: true },
              { id: "c", tipo: "fim_intervalo", marcado_em: em(diaMenos(1), "13:00"), metodo_verificacao: "manual", ajustado: false },
            ]}
          />
        </AdminShell>
      );
    case "admin-cerca":
      return (
        <AdminShell rotaAtiva="/admin/cerca">
          <CercaView
            init={{
              nome: "Fábrica",
              endereco: "Rua José Vieira de Maria, 401b, Caicó/RN",
              latitude: -6.466205,
              longitude: -37.102361,
              raio_metros: 100,
            }}
          />
        </AdminShell>
      );

    default:
      notFound();
  }
}
