-- ============================================================================
-- j2aponto — Bloco A (rotina do RH): equipes, turnos, feriados, férias,
-- cadastro completo do colaborador e solicitações com anexo.
--
-- Como aplicar: Supabase → SQL Editor → New query → cole TODO este arquivo →
-- Run. Pode rodar mais de uma vez sem estragar nada (é idempotente).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Equipes (setores)
-- ---------------------------------------------------------------------------
create table if not exists equipes (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references empresas(id) on delete cascade,
  nome        text not null,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (empresa_id, nome)
);

-- ---------------------------------------------------------------------------
-- Turnos de trabalho
-- escala: lista com 7 posições (0 = domingo … 6 = sábado). Cada posição é
--   null (folga) ou {"entrada":"08:00","saida":"18:00","intervalo":60}.
-- ---------------------------------------------------------------------------
create table if not exists turnos (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references empresas(id) on delete cascade,
  nome           text not null,
  escala         jsonb not null,
  tolerancia_min integer not null default 10,
  ativo          boolean not null default true,
  created_at     timestamptz not null default now(),
  unique (empresa_id, nome),
  constraint turnos_escala_7_dias check (
    jsonb_typeof(escala) = 'array' and jsonb_array_length(escala) = 7
  )
);

-- ---------------------------------------------------------------------------
-- Feriados e dias sem expediente da empresa
-- ---------------------------------------------------------------------------
create table if not exists feriados (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references empresas(id) on delete cascade,
  data        date not null,
  nome        text not null,
  created_at  timestamptz not null default now(),
  unique (empresa_id, data)
);

-- ---------------------------------------------------------------------------
-- Férias
-- ---------------------------------------------------------------------------
create table if not exists ferias (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references empresas(id) on delete cascade,
  funcionario_id  uuid not null references funcionarios(id) on delete cascade,
  inicio          date not null,
  fim             date not null,
  observacao      text,
  criado_por      uuid references funcionarios(id),
  created_at      timestamptz not null default now(),
  constraint ferias_periodo check (fim >= inicio)
);
create index if not exists idx_ferias_func on ferias (funcionario_id, inicio);

-- ---------------------------------------------------------------------------
-- Cadastro completo do colaborador
-- ---------------------------------------------------------------------------
alter table funcionarios
  add column if not exists equipe_id            uuid references equipes(id) on delete set null,
  add column if not exists turno_id             uuid references turnos(id) on delete set null,
  add column if not exists turno_programado_id  uuid references turnos(id) on delete set null,
  add column if not exists turno_programado_em  date,
  add column if not exists gestor_id            uuid references funcionarios(id) on delete set null,
  add column if not exists email                text,
  add column if not exists telefone             text,
  add column if not exists cpf                  text,
  add column if not exists pis                  text,
  add column if not exists data_nascimento      date,
  add column if not exists data_admissao        date,
  add column if not exists desligado_em         date,
  add column if not exists observacoes          text;

-- ---------------------------------------------------------------------------
-- Solicitações (usa a tabela ajustes_ponto que já existe)
--   categoria 'incluir'  → marcação esquecida (tipo + marcado_em)
--   categoria 'alterar'  → corrigir uma marcação existente (registro_id + marcado_em)
--   categoria 'abonar'   → abonar o dia (atestado etc.), em `dia`
-- ---------------------------------------------------------------------------
alter table ajustes_ponto
  add column if not exists categoria     text not null default 'incluir',
  add column if not exists dia           date,
  add column if not exists anexo_path    text,
  add column if not exists resposta      text,
  add column if not exists respondido_em timestamptz;

do $$ begin
  alter table ajustes_ponto add constraint ajustes_categoria_valida
    check (categoria in ('incluir', 'alterar', 'abonar'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table ajustes_ponto add constraint ajustes_status_valido
    check (status in ('pendente', 'aprovado', 'rejeitado'));
exception when duplicate_object then null; end $$;

create index if not exists idx_ajustes_empresa on ajustes_ponto (empresa_id, status, created_at desc);

-- O funcionário cria a solicitação só para si e só como "pendente".
drop policy if exists ajustes_insert on ajustes_ponto;
create policy ajustes_insert on ajustes_ponto
  for insert with check (
    funcionario_id = public.app_funcionario_id()
    and empresa_id = public.app_empresa_id()
    and status = 'pendente'
  );

-- O funcionário pode desistir (apagar) de um pedido seu enquanto está pendente.
drop policy if exists ajustes_delete_proprio on ajustes_ponto;
create policy ajustes_delete_proprio on ajustes_ponto
  for delete using (
    funcionario_id = public.app_funcionario_id() and status = 'pendente'
  );

-- ---------------------------------------------------------------------------
-- RLS das tabelas novas: a empresa lê; só RH/admin escreve.
-- ---------------------------------------------------------------------------
alter table equipes  enable row level security;
alter table turnos   enable row level security;
alter table feriados enable row level security;
alter table ferias   enable row level security;

drop policy if exists equipes_select on equipes;
create policy equipes_select on equipes
  for select using (empresa_id = public.app_empresa_id());
drop policy if exists equipes_write on equipes;
create policy equipes_write on equipes
  for all using (empresa_id = public.app_empresa_id() and public.app_is_gestor())
  with check (empresa_id = public.app_empresa_id() and public.app_is_gestor());

drop policy if exists turnos_select on turnos;
create policy turnos_select on turnos
  for select using (empresa_id = public.app_empresa_id());
drop policy if exists turnos_write on turnos;
create policy turnos_write on turnos
  for all using (empresa_id = public.app_empresa_id() and public.app_is_gestor())
  with check (empresa_id = public.app_empresa_id() and public.app_is_gestor());

drop policy if exists feriados_select on feriados;
create policy feriados_select on feriados
  for select using (empresa_id = public.app_empresa_id());
drop policy if exists feriados_write on feriados;
create policy feriados_write on feriados
  for all using (empresa_id = public.app_empresa_id() and public.app_is_gestor())
  with check (empresa_id = public.app_empresa_id() and public.app_is_gestor());

-- Férias: cada um vê as suas; o RH vê e lança as da empresa.
drop policy if exists ferias_select on ferias;
create policy ferias_select on ferias
  for select using (
    funcionario_id = public.app_funcionario_id()
    or (public.app_is_gestor() and empresa_id = public.app_empresa_id())
  );
drop policy if exists ferias_write on ferias;
create policy ferias_write on ferias
  for all using (empresa_id = public.app_empresa_id() and public.app_is_gestor())
  with check (empresa_id = public.app_empresa_id() and public.app_is_gestor());

-- ---------------------------------------------------------------------------
-- Anexos das solicitações (atestados etc.) — armazenamento PRIVADO.
-- Caminho do arquivo: <empresa_id>/<funcionario_id>/<nome>
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'anexos', 'anexos', false, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists anexos_insert_proprio on storage.objects;
create policy anexos_insert_proprio on storage.objects
  for insert to authenticated with check (
    bucket_id = 'anexos'
    and (storage.foldername(name))[1] = public.app_empresa_id()::text
    and (storage.foldername(name))[2] = public.app_funcionario_id()::text
  );

drop policy if exists anexos_select on storage.objects;
create policy anexos_select on storage.objects
  for select to authenticated using (
    bucket_id = 'anexos'
    and (storage.foldername(name))[1] = public.app_empresa_id()::text
    and (
      (storage.foldername(name))[2] = public.app_funcionario_id()::text
      or public.app_is_gestor()
    )
  );

-- ---------------------------------------------------------------------------
-- Turno padrão (seg–sex 08:00–17:00, 1h de intervalo = 8h/dia) para cada
-- empresa que ainda não tem nenhum turno.
-- ---------------------------------------------------------------------------
insert into turnos (empresa_id, nome, escala)
select e.id, 'Comercial (seg a sex, 8h)',
  '[null,
    {"entrada":"08:00","saida":"17:00","intervalo":60},
    {"entrada":"08:00","saida":"17:00","intervalo":60},
    {"entrada":"08:00","saida":"17:00","intervalo":60},
    {"entrada":"08:00","saida":"17:00","intervalo":60},
    {"entrada":"08:00","saida":"17:00","intervalo":60},
    null]'::jsonb
from empresas e
where not exists (select 1 from turnos t where t.empresa_id = e.id);

-- Avisa a API (PostgREST) para enxergar as colunas e tabelas novas na hora.
notify pgrst, 'reload schema';
