# j2aponto — Protótipo visual

Mockup **frontend-only** do app de ponto eletrônico para funcionários de fábrica.
Serve para **validar o design e o fluxo de interação com o cliente** antes de
implementar o produto real.

> ⚠️ Isto é um protótipo de apresentação. **Não há** backend, banco de dados,
> autenticação, reconhecimento facial ou geolocalização reais. Todos os cenários
> (dentro/fora da área, sucesso/falha no reconhecimento) são **simulados via
> estado local** e controlados pelo painel de demonstração ao lado do celular.

## Como rodar

```bash
npm install
npm run dev
```

Abra <http://localhost:3000>. A tela mostra um **mockup de celular** com o app
rodando dentro. Os controles de navegação e demonstração ficam **fora** da
moldura.

## Como apresentar ao cliente

- **Navegação livre:** use as setas / abas abaixo do celular para pular entre as
  7 telas (Splash, Login, Home, Captura, Confirmação, Histórico, Perfil).
- **Painel "Controles de demonstração"** (ao lado):
  - **Localização** — alterne `Dentro` / `Fora` da cerca eletrônica. Fora da
    área, o botão _Bater Ponto_ fica bloqueado.
  - **Reconhecimento facial** — escolha `Sucesso` (a captura avança e mostra o
    carimbo) ou `Falha` (mostra "Rosto não reconhecido").
  - **Reiniciar demonstração** — volta ao estado inicial.

Roteiro sugerido: Splash → Login → Home → (mostrar bloqueio em `Fora`) →
`Dentro` → Bater Ponto → Captura (`Sucesso` e `Falha`) → Confirmação (carimbo) →
Histórico → Perfil.

## Identidade visual

Estética de **painel de controle industrial (HMI)** — sóbria, alto contraste,
toques grandes. Paleta em `tailwind.config.ts`:

| Papel | Cor |
| --- | --- |
| Fundo base (grafite) | `#14171C` |
| Superfície / cards (aço) | `#1E232B` |
| Acento primário (âmbar) | `#F5A623` |
| Sucesso (verde sinal) | `#3ECF8E` |
| Erro / fora da área (vermelho) | `#E5484D` |
| Texto primário | `#EDEFF2` |
| Texto secundário | `#8A93A3` |

- **Horários / números:** JetBrains Mono (display de relógio de ponto).
- **Interface:** Inter.
- **Elemento de assinatura:** animação de **carimbo** na tela de confirmação,
  com impacto/escala — reforça a metáfora do ponto físico digitalizado.
- Respeita `prefers-reduced-motion` (corta o teatro, mantém o essencial).

## Estrutura (pronta para plugar a lógica real depois)

```
src/
  app/
    layout.tsx        # fontes (Inter + JetBrains Mono), metadata
    page.tsx          # palco: phone frame + controles + painel de demo
    globals.css       # base, keyframes do carimbo, reduced-motion
  components/
    PhoneFrame.tsx    # moldura do celular (ilha dinâmica, barra de status)
    ScreenRouter.tsx  # troca de tela conforme o estado
    PrototypeControls.tsx  # navegação do protótipo (setas + abas)
    DebugPanel.tsx    # controles mockados (geofence, reconhecimento)
    ui.tsx / icons.tsx / Logo.tsx
  screens/            # as 7 telas do app
  lib/
    prototype.tsx     # estado central (useReducer + Context)
    types.ts          # tipos compartilhados
    time.ts           # cálculo de horas, próximo tipo de marcação, status
    mock-data.ts      # dados fictícios (funcionário, geofence, marcações)
    useClock.ts       # relógio em tempo real
```

### Onde entra a lógica real, no futuro

- **Autenticação:** `LoginScreen` → substituir o `dispatch(GO home)` por chamada
  real; guardar sessão.
- **Geofence:** `state.insideGeofence` → alimentar com GPS real + cálculo de raio
  (`GEOFENCE.radiusMeters` em `mock-data.ts`).
- **Reconhecimento facial:** `CaptureScreen` → trocar o `setTimeout` mockado pela
  captura de câmera + verificação; manter as rotas de sucesso/falha.
- **Registro/Histórico:** `COMMIT_PUNCH` (em `lib/prototype.tsx`) e
  `YESTERDAY_PUNCHES` → persistir marcações no backend.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · React (estado local via
`useReducer` + Context). Sem dependências de backend.
```
