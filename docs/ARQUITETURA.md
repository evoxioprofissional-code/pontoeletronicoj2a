# Arquitetura — j2aponto

## Stack
- **Frontend/web:** Next.js 14 (App Router) + TypeScript + Tailwind
- **Backend/BaaS:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **Mobile (Fase 6):** React Native / Expo, reaproveitando a lógica React
- **Estado do protótipo:** React (`useReducer` + Context) — será substituído por
  dados reais do Supabase fase a fase

## Clientes Supabase (`src/lib/supabase/`)
- `client.ts` — navegador (chave anon, sujeito a RLS)
- `server.ts` — Server Components / Actions / Route Handlers (sessão via cookies)
- `admin.ts` — **service_role**, ignora RLS, **somente servidor** (cadastro,
  geração de arquivos legais). Nunca importar no cliente.

## Modelo de dados
Ver [BANCO.md](BANCO.md) e `supabase/migrations/`. Pontos-chave:
- **Multiempresa** desde o início (`empresa_id` em tudo).
- **`registros_ponto` é append-only e imutável**: NSR sequencial por empresa +
  cadeia de hash (SHA-256 encadeado). UPDATE/DELETE bloqueados por trigger,
  inclusive para o service_role. Correções vão para `ajustes_ponto`, sem tocar
  no original — espírito da Portaria 671 (REP-P).
- **Biometria isolada**: `biometria_facial` sem policy de RLS → só o servidor
  acessa. Guardar template/embedding, nunca a foto crua; consentimento LGPD
  registrado em `consentimentos`.

## RLS
- Helpers `security definer`: `app_funcionario_id()`, `app_empresa_id()`,
  `app_is_gestor()` — evitam recursão e centralizam o contexto do usuário.
- Funcionário enxerga apenas os próprios dados; gestor (rh/admin) enxerga a
  empresa. Escrita de cadastro restrita a gestor; marcação restrita ao próprio.

## Decisão: autenticação por matrícula
O Supabase Auth é baseado em e-mail. Funcionários fazem login por **matrícula**.
Estratégia planejada (Fase 2): o RH cadastra o funcionário e o sistema cria um
usuário de auth com **e-mail sintético** (`{matricula}@{empresa}.pontoj2a.app`);
no login, a matrícula digitada é convertida nesse e-mail. `auth.users.id` é
vinculado a `funcionarios.user_id`. Alternativa a avaliar: provider de
credenciais customizado. **A decidir no início da Fase 2.**

## Segurança operacional
- Segredos em `.env.local` (fora do git). `service_role` nunca vai ao cliente.
- A `service_role` foi exposta em chat durante o setup — **rotacionar** no painel
  do Supabase antes de produção.
- Produção: revisar retenção de biometria, criptografia do template e cifragem
  em repouso.
