-- ============================================================================
-- j2aponto — Esquema inicial (Fase 1)
-- Ponto eletrônico via programa (REP-P). Núcleo de domínio + imutabilidade + RLS.
--
-- Como aplicar: cole este arquivo no SQL Editor do Supabase e execute.
-- É idempotente o suficiente para rodar uma vez em um projeto novo.
-- ============================================================================

create extension if not exists pgcrypto; -- digest() para a cadeia de hash

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
do $$ begin
  create type papel_usuario as enum ('funcionario', 'rh', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_marcacao as enum ('entrada', 'inicio_intervalo', 'fim_intervalo', 'saida');
exception when duplicate_object then null; end $$;

do $$ begin
  create type metodo_verificacao as enum ('facial', 'manual');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

-- Empregador (dono da fábrica). Estrutura multiempresa desde o início.
create table if not exists empresas (
  id            uuid primary key default gen_random_uuid(),
  cnpj          text unique,
  razao_social  text not null,
  nome_fantasia text,
  created_at    timestamptz not null default now()
);

-- Cerca eletrônica (geofence) por empresa.
create table if not exists cercas (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references empresas(id) on delete cascade,
  nome         text not null,
  endereco     text,
  latitude     double precision not null,
  longitude    double precision not null,
  raio_metros  integer not null default 150,
  ativo        boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Funcionário. Vincula-se a um usuário de auth (login) quando criado.
create table if not exists funcionarios (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references empresas(id) on delete cascade,
  user_id     uuid unique references auth.users(id) on delete set null,
  matricula   text not null,
  nome        text not null,
  cargo       text,
  papel       papel_usuario not null default 'funcionario',
  ativo       boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (empresa_id, matricula)
);

-- Registros de ponto — APPEND-ONLY e IMUTÁVEIS (REP-P).
-- NSR sequencial por empresa + cadeia de hash garantem inviolabilidade.
create table if not exists registros_ponto (
  id                 uuid primary key default gen_random_uuid(),
  empresa_id         uuid not null references empresas(id) on delete restrict,
  funcionario_id     uuid not null references funcionarios(id) on delete restrict,
  nsr                bigint not null,
  tipo               tipo_marcacao,
  marcado_em         timestamptz not null default now(),
  latitude           double precision,
  longitude          double precision,
  precisao_m         double precision,
  cerca_id           uuid references cercas(id),
  dentro_cerca       boolean not null default false,
  metodo_verificacao metodo_verificacao not null default 'facial',
  face_score         numeric(4,3),
  prev_hash          text,
  hash               text not null,
  created_at         timestamptz not null default now(),
  unique (empresa_id, nsr)
);

create index if not exists idx_registros_funcionario on registros_ponto (funcionario_id, marcado_em);
create index if not exists idx_registros_empresa on registros_ponto (empresa_id, marcado_em);

-- Ajustes/correções — os registros originais NUNCA são alterados.
create table if not exists ajustes_ponto (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references empresas(id) on delete cascade,
  registro_id    uuid references registros_ponto(id), -- null = inclusão de marcação
  funcionario_id uuid not null references funcionarios(id),
  tipo           tipo_marcacao,
  marcado_em     timestamptz,
  justificativa  text not null,
  solicitado_por uuid references funcionarios(id),
  aprovado_por   uuid references funcionarios(id),
  status         text not null default 'pendente', -- pendente | aprovado | rejeitado
  created_at     timestamptz not null default now()
);

-- Biometria facial — DADO SENSÍVEL (LGPD). Guardar TEMPLATE/embedding, nunca a
-- foto crua; idealmente cifrado. Sem policy de RLS: acessível apenas via server
-- (service_role). Consentimento é obrigatório antes de gravar.
create table if not exists biometria_facial (
  funcionario_id    uuid primary key references funcionarios(id) on delete cascade,
  template          text not null,
  consentimento_em  timestamptz,
  atualizado_em     timestamptz not null default now()
);

-- Trilha de consentimentos LGPD.
create table if not exists consentimentos (
  id             uuid primary key default gen_random_uuid(),
  funcionario_id uuid not null references funcionarios(id) on delete cascade,
  finalidade     text not null,
  versao_texto   text,
  aceito         boolean not null default false,
  aceito_em      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Selagem: NSR sequencial + cadeia de hash (antes de inserir)
-- ---------------------------------------------------------------------------
create or replace function public.tg_registro_ponto_selar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ultimo record;
begin
  -- Serializa inserções por empresa para NSR/hash consistentes.
  perform pg_advisory_xact_lock(hashtext(new.empresa_id::text));

  select nsr, hash into ultimo
  from registros_ponto
  where empresa_id = new.empresa_id
  order by nsr desc
  limit 1;

  new.nsr := coalesce(ultimo.nsr, 0) + 1;
  new.prev_hash := ultimo.hash; -- null no primeiro registro da empresa
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

drop trigger if exists trg_registro_ponto_selar on registros_ponto;
create trigger trg_registro_ponto_selar
  before insert on registros_ponto
  for each row execute function public.tg_registro_ponto_selar();

-- ---------------------------------------------------------------------------
-- Imutabilidade: bloqueia UPDATE/DELETE mesmo para o service_role
-- ---------------------------------------------------------------------------
create or replace function public.tg_registro_ponto_imutavel()
returns trigger language plpgsql as $$
begin
  raise exception 'Registros de ponto sao imutaveis (REP-P). Use ajustes_ponto para correcoes.';
end;
$$;

drop trigger if exists trg_registro_ponto_no_update on registros_ponto;
create trigger trg_registro_ponto_no_update
  before update on registros_ponto
  for each row execute function public.tg_registro_ponto_imutavel();

drop trigger if exists trg_registro_ponto_no_delete on registros_ponto;
create trigger trg_registro_ponto_no_delete
  before delete on registros_ponto
  for each row execute function public.tg_registro_ponto_imutavel();

-- ---------------------------------------------------------------------------
-- Helpers de contexto do usuário (evitam recursão de RLS: security definer)
-- ---------------------------------------------------------------------------
create or replace function public.app_funcionario_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from funcionarios where user_id = auth.uid() limit 1;
$$;

create or replace function public.app_empresa_id()
returns uuid language sql stable security definer set search_path = public as $$
  select empresa_id from funcionarios where user_id = auth.uid() limit 1;
$$;

create or replace function public.app_is_gestor()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from funcionarios
    where user_id = auth.uid() and papel in ('rh', 'admin')
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table empresas          enable row level security;
alter table cercas            enable row level security;
alter table funcionarios      enable row level security;
alter table registros_ponto   enable row level security;
alter table ajustes_ponto     enable row level security;
alter table biometria_facial  enable row level security;
alter table consentimentos    enable row level security;

-- empresas: usuário enxerga apenas a própria empresa. Escrita só via server.
drop policy if exists empresas_select on empresas;
create policy empresas_select on empresas
  for select using (id = public.app_empresa_id());

-- cercas: leitura pela empresa; escrita por gestor.
drop policy if exists cercas_select on cercas;
create policy cercas_select on cercas
  for select using (empresa_id = public.app_empresa_id());
drop policy if exists cercas_write on cercas;
create policy cercas_write on cercas
  for all using (empresa_id = public.app_empresa_id() and public.app_is_gestor())
  with check (empresa_id = public.app_empresa_id() and public.app_is_gestor());

-- funcionarios: vê a si mesmo; gestor vê a empresa. Escrita por gestor.
drop policy if exists funcionarios_select on funcionarios;
create policy funcionarios_select on funcionarios
  for select using (
    user_id = auth.uid()
    or (public.app_is_gestor() and empresa_id = public.app_empresa_id())
  );
drop policy if exists funcionarios_write on funcionarios;
create policy funcionarios_write on funcionarios
  for all using (public.app_is_gestor() and empresa_id = public.app_empresa_id())
  with check (public.app_is_gestor() and empresa_id = public.app_empresa_id());

-- registros_ponto: leitura própria ou de gestor; inserção apenas do próprio
-- funcionário. Sem UPDATE/DELETE (imutável — reforçado por trigger).
drop policy if exists registros_select on registros_ponto;
create policy registros_select on registros_ponto
  for select using (
    funcionario_id = public.app_funcionario_id()
    or (public.app_is_gestor() and empresa_id = public.app_empresa_id())
  );
drop policy if exists registros_insert on registros_ponto;
create policy registros_insert on registros_ponto
  for insert with check (
    funcionario_id = public.app_funcionario_id()
    and empresa_id = public.app_empresa_id()
  );

-- ajustes_ponto: leitura própria/gestor; solicitação pelo próprio; decisão por gestor.
drop policy if exists ajustes_select on ajustes_ponto;
create policy ajustes_select on ajustes_ponto
  for select using (
    funcionario_id = public.app_funcionario_id()
    or (public.app_is_gestor() and empresa_id = public.app_empresa_id())
  );
drop policy if exists ajustes_insert on ajustes_ponto;
create policy ajustes_insert on ajustes_ponto
  for insert with check (
    funcionario_id = public.app_funcionario_id()
    and empresa_id = public.app_empresa_id()
  );
drop policy if exists ajustes_update on ajustes_ponto;
create policy ajustes_update on ajustes_ponto
  for update using (public.app_is_gestor() and empresa_id = public.app_empresa_id());

-- consentimentos: o próprio funcionário registra/consulta os seus.
drop policy if exists consentimentos_select on consentimentos;
create policy consentimentos_select on consentimentos
  for select using (funcionario_id = public.app_funcionario_id() or public.app_is_gestor());
drop policy if exists consentimentos_insert on consentimentos;
create policy consentimentos_insert on consentimentos
  for insert with check (funcionario_id = public.app_funcionario_id());

-- biometria_facial: SEM policy → acessível apenas via service_role (servidor).
