// Solicitações de ajuste — tipos e textos compartilhados (servidor e cliente).
import type { TipoDB } from "./ponto";

export type Categoria = "incluir" | "alterar" | "abonar";
export type StatusSolicitacao = "pendente" | "aprovado" | "rejeitado";

export const CATEGORIAS: { id: Categoria; titulo: string; descricao: string }[] = [
  {
    id: "incluir",
    titulo: "Esqueci de bater o ponto",
    descricao: "Pedir para incluir uma marcação que ficou faltando.",
  },
  {
    id: "alterar",
    titulo: "Horário registrado errado",
    descricao: "Pedir para corrigir o horário de uma marcação.",
  },
  {
    id: "abonar",
    titulo: "Abonar o dia",
    descricao: "Atestado médico, consulta, curso ou outro motivo justificado.",
  },
];

export const ROTULO_CATEGORIA: Record<Categoria, string> = {
  incluir: "Incluir marcação",
  alterar: "Corrigir horário",
  abonar: "Abonar dia",
};

export const ROTULO_STATUS: Record<StatusSolicitacao, string> = {
  pendente: "Pendente",
  aprovado: "Aprovada",
  rejeitado: "Recusada",
};

export const TOM_STATUS: Record<StatusSolicitacao, "aviso" | "ok" | "erro"> = {
  pendente: "aviso",
  aprovado: "ok",
  rejeitado: "erro",
};

export interface Solicitacao {
  id: string;
  funcionario_id: string;
  categoria: Categoria;
  status: StatusSolicitacao;
  dia: string | null;
  tipo: TipoDB | null;
  marcado_em: string | null;
  registro_id: string | null;
  justificativa: string;
  anexo_path: string | null;
  resposta: string | null;
  respondido_em: string | null;
  created_at: string;
}

export const COLUNAS_SOLICITACAO =
  "id, funcionario_id, categoria, status, dia, tipo, marcado_em, registro_id, justificativa, anexo_path, resposta, respondido_em, created_at";

/** Tipos de arquivo aceitos como anexo e tamanho máximo (5 MB). */
export const ANEXO_TIPOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];
export const ANEXO_MAX_BYTES = 5 * 1024 * 1024;
