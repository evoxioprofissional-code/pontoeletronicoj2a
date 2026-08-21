-- ============================================================================
-- j2aponto — Fase 3/Admin: carga horária, ajustes do admin e auditoria
-- Rode no SQL Editor após as migrations anteriores.
-- ============================================================================

-- Carga horária diária (em minutos) — definida pelo admin por funcionário.
alter table funcionarios
  add column if not exists carga_horaria_min integer not null default 480;

-- Colunas de auditoria de ajuste no registro de ponto.
alter table registros_ponto
  add column if not exists marcado_em_original timestamptz,
  add column if not exists ajustado boolean not null default false,
  add column if not exists ajuste_motivo text,
  add column if not exists ajustado_por uuid references funcionarios(id),
  add column if not exists ajustado_em timestamptz;

-- MVP: o admin precisa ajustar/excluir marcações. Removemos o bloqueio estrito
-- de imutabilidade (será reintroduzido na fase de conformidade REP-P, via
-- camada de ajustes que preserva o original). O selo de hash na inserção
-- (trg_registro_ponto_selar) permanece ativo.
drop trigger if exists trg_registro_ponto_no_update on registros_ponto;
drop trigger if exists trg_registro_ponto_no_delete on registros_ponto;
