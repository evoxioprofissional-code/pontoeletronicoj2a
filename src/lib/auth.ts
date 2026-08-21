/**
 * Estratégia de login por matrícula (ver docs/ARQUITETURA.md).
 * O Supabase Auth é baseado em e-mail; convertemos a matrícula em um e-mail
 * sintético estável. Enquanto o sistema é de uma empresa só, a matrícula é
 * globalmente única. Multiempresa exigirá incluir o identificador da empresa.
 */
export function matriculaParaEmail(matricula: string): string {
  return `${matricula.trim().toLowerCase()}@j2aponto.app`;
}
