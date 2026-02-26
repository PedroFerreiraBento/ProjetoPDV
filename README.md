# ProjetoPDV - Offline-First POS Platform

> Sistema de Ponto de Venda com foco em operacao local, sincronizacao incremental e experiencia de uso rapida para caixa e gestao.

![Monorepo](https://img.shields.io/badge/monorepo-pnpm%20workspace-1f2937?style=for-the-badge)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-0ea5e9?style=for-the-badge)
![Backend](https://img.shields.io/badge/backend-Fastify%20%2B%20Prisma-22c55e?style=for-the-badge)
![Database](https://img.shields.io/badge/database-SQLite%20(local)-f59e0b?style=for-the-badge)
![Sync](https://img.shields.io/badge/sync-pull%2Fpush%20idempotente-8b5cf6?style=for-the-badge)

## Visao Geral

O ProjetoPDV foi desenhado para cenarios reais de loja:

- venda com latencia baixa no terminal;
- fluxo de caixa claro para operador;
- painel administrativo completo;
- operacao resiliente a oscilacao de internet;
- sincronizacao cliente-servidor via `pull/push`.

Atualmente, o foco principal esta no app web (`apps/web-admin-pwa`) com fluxo de:

- portal de acesso (admin e terminal);
- terminal PDV;
- dashboard administrativo (vendas, estoque, compras, cupons, relatorios, filiais, terminais, usuarios);
- seed de dados de MVP para demonstracao completa.

## Principais Funcionalidades

- Login administrativo por email/senha e login rapido por PIN para operador.
- Fluxo de venda completo no PDV:
  - leitura por busca e scanner,
  - descontos/acrescimos,
  - multipagamento,
  - cupom,
  - fiado.
- Controle de caixa:
  - abertura,
  - sangria/suprimento,
  - fechamento.
- Gestao de fiado no PDV:
  - listagem de pendencias por terminal,
  - baixa com forma de pagamento.
- Dashboard gerencial com:
  - receita/lucro/ticket,
  - historico de vendas,
  - relatorios,
  - alertas de estoque e validade de lotes.
- Configuracoes de filiais e terminais com sync.

## Screenshots (Projeto Real)

![Login Escolha](./prints-principais/01-login-escolha.png)
![Login Admin](./prints-principais/02-login-admin.png)
![Portal](./prints-principais/03-portal.png)
![Dashboard Overview](./prints-principais/04-dashboard-overview.png)
![Dashboard Vendas](./prints-principais/05-dashboard-vendas.png)
![Settings Filiais](./prints-principais/06-dashboard-config-filiais.png)
![PDV](./prints-principais/07-pdv.png)
![PDV Fiados](./prints-principais/08-pdv-fiados.png)

## Stack Tecnica

### Frontend

- React 18 + TypeScript
- Vite
- Zustand (estado local)
- TailwindCSS + Radix UI (via `@pos/ui`)
- React Router

### Backend

- Fastify
- Prisma ORM
- SQLite (`server/prisma/dev.db`)

### Monorepo

- pnpm workspaces
- Turborepo

## Estrutura do Repositorio

```text
.
├─ apps/
│  ├─ web-admin-pwa/          # App principal atual (portal, admin, PDV)
│  ├─ pos-desktop-tauri/      # Base desktop (Tauri)
│  └─ pos-mobile-capacitor/   # Base mobile (Capacitor)
├─ packages/
│  ├─ ui/                     # Componentes compartilhados
│  ├─ shared/                 # Tipos e contratos compartilhados
│  ├─ domain/
│  ├─ usecases/
│  ├─ data/
│  ├─ platform/
│  └─ sync/
├─ server/
│  ├─ src/index.ts            # API de sync
│  ├─ prisma/schema.prisma
│  └─ scripts/seed-mvp.ts     # Seed com dados de demonstracao
└─ docs/
```

## Como Rodar Localmente

### 1) Pre-requisitos

- Node.js 18+
- pnpm 9+

### 2) Instalar dependencias

```bash
pnpm install
```

### 3) Subir backend de sync

```bash
pnpm -C server dev
```

Servidor padrao: `http://localhost:3001`

### 4) Popular banco com dados de MVP

```bash
pnpm -C server exec tsx scripts/seed-mvp.ts
```

### 5) Subir frontend principal

```bash
pnpm -C apps/web-admin-pwa dev
```

App: `http://localhost:5173`

## Credenciais de Demonstracao

Com seed executado:

- Admin:
  - Email: `admin@sistema.com`
  - Senha: `admin123`
- Operadores (PIN):
  - Caixa Ana: `1111`
  - Caixa Bruno: `2222`

## Scripts Importantes

### Root

```bash
pnpm dev
pnpm build
pnpm lint
pnpm clean
```

### Web (`apps/web-admin-pwa`)

```bash
pnpm -C apps/web-admin-pwa dev
pnpm -C apps/web-admin-pwa build
pnpm -C apps/web-admin-pwa preview
```

### Server (`server`)

```bash
pnpm -C server dev
pnpm -C server build
pnpm -C server start
pnpm -C server exec tsx scripts/seed-mvp.ts
```

## Sincronizacao Offline/Online

O fluxo atual usa:

- `POST /api/sync/push` para enviar mudancas locais;
- `GET /api/sync/pull` para receber mudancas remotas;
- estrategia incremental por `updatedAt` com merge no cliente.

A URL da API no frontend pode ser configurada por:

- `VITE_SYNC_API_URL`

Fallback padrao:

- `http://localhost:3001/api/sync`

## Qualidade e Diretrizes

- Design system centralizado em `packages/ui`.
- Tipos compartilhados em `packages/shared`.
- Seed com dados de negocio para validar fluxo ponta a ponta.
- Captura automatizada de telas principais via script:
  - `scripts/capture-main-screens.js`

## Roadmap (Direcao)

- Refinar apps desktop/mobile com os mesmos fluxos do web.
- Expandir observabilidade e diagnostico de sync.
- Endurecer cobertura de testes E2E para cenarios de caixa/fiado.
- Evoluir modulo fiscal e integracoes externas.

---

Se quiser, eu tambem posso gerar uma versao "README comercial" com foco em pitch de produto (demo, diferenciais de negocio, comparativo e proposta de valor) para portfolio ou apresentacao a cliente.
