-- ============================================================================
-- j2aponto — Seed de demonstração (Fase 1)
-- Dados fictícios para desenvolvimento. Rode após 0001_init.sql.
-- O user_id do funcionário fica nulo até o login ser criado na Fase 2.
-- ============================================================================

insert into empresas (id, cnpj, razao_social, nome_fantasia)
values (
  '00000000-0000-0000-0000-0000000000e1',
  '12.345.678/0001-90',
  'Indústria Exemplo Ltda',
  'Indústria Exemplo'
)
on conflict (id) do nothing;

insert into cercas (id, empresa_id, nome, endereco, latitude, longitude, raio_metros)
values (
  '00000000-0000-0000-0000-0000000000c1',
  '00000000-0000-0000-0000-0000000000e1',
  'Fábrica Central',
  'Rod. BR-101, km 42 — Distrito Industrial',
  -5.353000,
  -49.120000,
  120
)
on conflict (id) do nothing;

insert into funcionarios (id, empresa_id, matricula, nome, cargo, papel)
values
  (
    '00000000-0000-0000-0000-0000000000f1',
    '00000000-0000-0000-0000-0000000000e1',
    '04871',
    'Carlos Andrade',
    'Operador de Máquinas — Linha 3',
    'funcionario'
  ),
  (
    '00000000-0000-0000-0000-0000000000f2',
    '00000000-0000-0000-0000-0000000000e1',
    '00001',
    'Administrador RH',
    'Recursos Humanos',
    'admin'
  )
on conflict (id) do nothing;
