-- ============================================================================
-- j2aponto — Remover dependência da service_role no app (tudo via RLS)
-- Rode no SQL Editor. Deixa o cadastro/uso do rosto e as ações do admin
-- funcionando apenas com a sessão do usuário (chave anon), sem service_role.
-- ============================================================================

-- Biometria facial: o próprio funcionário lê/grava a sua.
drop policy if exists biometria_self_select on biometria_facial;
create policy biometria_self_select on biometria_facial
  for select using (funcionario_id = public.app_funcionario_id());

drop policy if exists biometria_self_insert on biometria_facial;
create policy biometria_self_insert on biometria_facial
  for insert with check (funcionario_id = public.app_funcionario_id());

drop policy if exists biometria_self_update on biometria_facial;
create policy biometria_self_update on biometria_facial
  for update using (funcionario_id = public.app_funcionario_id())
  with check (funcionario_id = public.app_funcionario_id());

-- Registros de ponto: gestor (rh/admin) gerencia dentro da empresa.
drop policy if exists registros_gestor_insert on registros_ponto;
create policy registros_gestor_insert on registros_ponto
  for insert with check (
    public.app_is_gestor() and empresa_id = public.app_empresa_id()
  );

drop policy if exists registros_gestor_update on registros_ponto;
create policy registros_gestor_update on registros_ponto
  for update using (
    public.app_is_gestor() and empresa_id = public.app_empresa_id()
  )
  with check (public.app_is_gestor() and empresa_id = public.app_empresa_id());

drop policy if exists registros_gestor_delete on registros_ponto;
create policy registros_gestor_delete on registros_ponto
  for delete using (
    public.app_is_gestor() and empresa_id = public.app_empresa_id()
  );
