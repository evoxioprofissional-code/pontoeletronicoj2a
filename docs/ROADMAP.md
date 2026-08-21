# Roadmap — j2aponto (produto real)

Construção **fase a fase**, com aprovação explícita entre fases. A parte
jurídica (Portaria 671 / LGPD) será tratada em paralelo pelo cliente; o
software já é construído para **suportar** a conformidade.

## Legenda
✅ concluído · 🚧 em andamento · ⏳ próximo · ⬜ planejado

---

### Fase 0 — Protótipo visual ✅
Mockup navegável das 7 telas dentro do phone frame (validação de design).

### Fase 1 — Fundação de backend 🚧
- ✅ Projeto conectado ao Supabase (clientes browser/server/admin)
- ✅ Esquema do banco: empresas, cercas, funcionários, registros de ponto
  (append-only + NSR + cadeia de hash), ajustes, biometria, consentimentos
- ✅ RLS multiempresa + imutabilidade dos registros (trigger)
- ⏳ Aplicar migrations no Supabase e validar leitura/escrita
- ⏳ Repositório no GitHub

### Fase 2 — Autenticação e sessão ⬜
- Login por **matrícula + senha** (mapeado para Supabase Auth)
- Middleware de sessão, rotas protegidas, cadastro de funcionário pelo RH
- Vincular `auth.users` ↔ `funcionarios`

### Fase 3 — Fluxo de ponto real ⬜
- Registrar marcação real na Home (grava em `registros_ponto`)
- Geofence real: GPS do dispositivo + validação **no servidor**
- Histórico e horas a partir do banco
- Comprovante de marcação ao trabalhador

### Fase 4 — Reconhecimento facial ⬜
- Captura on-device + **prova de vida / anti-spoofing**
- Cadastro do template facial (com consentimento) e verificação na marcação

### Fase 5 — Conformidade REP-P ⬜
- Geração de **AFD** e **AEJ** nos layouts oficiais
- **Assinatura digital** dos arquivos (certificado ICP-Brasil)
- Painel do RH: relatórios, aprovações de ajuste, exportação para folha

### Fase 6 — App mobile e publicação ⬜
- Empacotar como app nativo (**React Native / Expo**)
- Permissões de câmera e localização, execução confiável
- Publicação na **Google Play** e **App Store**

### Fase 7 — Operação ⬜
- Hospedagem, monitoramento, backups, retenção/expurgo de dados
- Manutenção de conformidade contínua

---

## Decisões em aberto (revisar antes da fase correspondente)
- Estratégia de auth por matrícula (e-mail sintético vs. provider custom) — ver
  [ARQUITETURA.md](ARQUITETURA.md).
- Motor de reconhecimento facial (on-device vs. serviço) — Fase 4.
- Provedor de certificado ICP-Brasil e formato de assinatura — Fase 5.
