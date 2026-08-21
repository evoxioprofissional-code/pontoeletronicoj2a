-- ============================================================================
-- j2aponto — Correção: digest() do pgcrypto não estava no search_path do
-- trigger de selagem (no Supabase o pgcrypto fica no schema `extensions`).
-- Sem isso, nenhum registro de ponto é gravado.
-- Rode no SQL Editor.
-- ============================================================================

create or replace function public.tg_registro_ponto_selar()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  ultimo record;
begin
  perform pg_advisory_xact_lock(hashtext(new.empresa_id::text));

  select nsr, hash into ultimo
  from registros_ponto
  where empresa_id = new.empresa_id
  order by nsr desc
  limit 1;

  new.nsr := coalesce(ultimo.nsr, 0) + 1;
  new.prev_hash := ultimo.hash;
  new.hash := encode(
    digest(
      coalesce(new.prev_hash, '') || '|' ||
      new.empresa_id::text || '|' ||
      new.funcionario_id::text || '|' ||
      new.nsr::text || '|' ||
      coalesce(new.tipo::text, '') || '|' ||
      new.marcado_em::text,
      'sha256'
    ),
    'hex'
  );
  return new;
end;
$$;
