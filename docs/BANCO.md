# Banco de dados — j2aponto

Fonte da verdade: `supabase/migrations/`. Aplicar no **SQL Editor** do Supabase
(rodar `0001_init.sql` e depois `0002_seed.sql`).

## Tabelas
| Tabela | Papel |
| --- | --- |
| `empresas` | Empregador (multiempresa) |
| `cercas` | Cerca eletrônica (geofence) por empresa |
| `funcionarios` | Funcionário; vincula a `auth.users` no login |
| `registros_ponto` | Marcações **append-only e imutáveis** (NSR + hash encadeado) |
| `ajustes_ponto` | Correções/inclusões sem alterar o original |
| `biometria_facial` | Template facial (sensível; só via servidor) |
| `consentimentos` | Trilha de consentimento LGPD |

## Imutabilidade (REP-P)
- Trigger `trg_registro_ponto_selar` (BEFORE INSERT): define `nsr` sequencial por
  empresa e calcula `hash = sha256(prev_hash | empresa | funcionário | nsr | tipo |
  marcado_em)`. `pg_advisory_xact_lock` serializa por empresa.
- Triggers `no_update` / `no_delete`: qualquer UPDATE/DELETE em `registros_ponto`
  levanta exceção — vale até para o service_role.

## Verificação da cadeia
Para auditar a integridade, recomputar o hash de cada registro em ordem de `nsr`
e conferir que `prev_hash` corresponde ao `hash` do anterior. (Utilitário será
adicionado na Fase 5, junto com a geração do AFD.)
