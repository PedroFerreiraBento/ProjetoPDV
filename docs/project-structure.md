Abaixo está uma **documentação de referência** da estrutura final recomendada (offline-first, multi-plataforma) para o seu PDV, já pensando em evoluir para outras frentes depois.

---

# 1) Visão geral da arquitetura

**Objetivo:** um PDV que funciona **sem internet** nas áreas críticas (venda/caixa/catálogo essencial) e sincroniza quando online, com o mesmo produto rodando em:

* **Desktop instalável:** Tauri
* **Mobile instalável:** Capacitor
* **Web:** PWA (instalável no navegador)

**Princípio central:** **Local-first**

> O dispositivo é a “fonte da verdade” durante a operação. A nuvem serve para sincronizar, consolidar e habilitar multi-loja/relatórios.

---

# 2) Componentes do sistema

## 2.1 Apps (cliente)

1. **POS Desktop (Tauri)**

   * Melhor para balcão/caixa com periféricos.
2. **POS Mobile (Capacitor)**

   * Melhor para venda móvel, consulta rápida, leitor de câmera, etc.
3. **Web Admin (PWA)**

   * Gestão e operação administrativa; pode ter sessões offline limitadas.

Todos compartilham:

* UI (React + TypeScript)
* Domínio/Use-cases
* Regras de negócio
* Camada de dados (com adaptações por plataforma)

## 2.2 Back-end (servidor)

* API (REST ou tRPC)
* Postgres
* Camada de sincronização (idempotente)
* Consolidação de relatórios
* Gestão multi-loja e usuários

---

# 3) O que funciona offline (por categoria)

## 3.1 Deve funcionar offline (crítico)

* **PDV / vendas** (carrinho, pagamentos, finalizar)
* **Movimento de caixa** (abertura/fechamento, sangria/suprimento)
* **Catálogo essencial** (produtos, preços, códigos de barra)
* **Baixa de estoque local**
* **Emissão de comprovante local** (impressão / envio quando online)

## 3.2 Pode funcionar offline (alto valor, mas opcional)

* Cadastro rápido de cliente
* Consulta de histórico local recente
* Entrada/ajuste simples de estoque

## 3.3 Preferencialmente online (admin pesado)

* Relatórios consolidados multi-loja
* Gestão avançada de compras/fornecedores
* Configurações fiscais complexas
* Auditoria completa e cruzamentos

---

# 4) Decisão de armazenamento (local + server)

## 4.1 Armazenamento local (source of truth)

* **Desktop/Mobile:** SQLite
* **Web:** IndexedDB (recomendado)

  * *Alternativa avançada:* SQLite via WASM + OPFS (se você quiser offline “pesado” no web)

## 4.2 Armazenamento server (consolidação)

* **Postgres** como banco central
* Serve para:

  * sincronizar dados entre dispositivos/lojas
  * relatórios consolidados
  * auditoria e gestão multi-loja
  * backup “na nuvem”

---

# 5) Modelo de sincronização (o coração do offline)

## 5.1 Conceito: “Outbox + Sync Worker”

Toda ação relevante gera:

1. escrita local (transação no SQLite/IndexedDB)
2. registro de uma operação na **outbox** (fila local)

Quando há internet:

* um **Sync Worker** envia as operações pendentes para a API
* o server confirma e o cliente marca como sincronizado

### Por que isso é bom?

* você não perde vendas por instabilidade
* você consegue reprocessar com segurança
* evita duplicidade (idempotência)

## 5.2 Idempotência (anti-duplicação)

Cada operação vai com:

* `op_id` (UUID)
* `idempotency_key` (pode ser o mesmo `op_id`)
* `device_id`
* `store_id`
* `created_at`

O servidor guarda as keys processadas e responde “já recebi” quando necessário.

## 5.3 Conflitos (regras simples e previsíveis)

* **Vendas/caixa:** *append-only* (não “edita” venda, cria eventos: cancelamento/estorno)
* **Estoque:** eventos de movimentação (entrada/saída/ajuste), consolidado depois
* **Produtos/preço:** estratégia por tipo:

  * campos simples: last-write-wins com `updated_at`
  * preço: pode exigir “origem” (admin) e regras de prioridade (ex: gerente vence caixa)

---

# 6) Organização do código (monorepo recomendado)

## 6.1 Estrutura sugerida

```
/apps
  /pos-desktop-tauri
  /pos-mobile-capacitor
  /web-admin-pwa

/packages
  /ui                (componentes visuais compartilhados)
  /domain            (entidades + regras de negócio)
  /usecases          (casos de uso: criar venda, fechar caixa...)
  /data              (repositórios, mappers, queries)
  /sync              (outbox, fila, worker, conflitos)
  /platform          (abstrações por plataforma: impressão, storage...)
  /shared            (utils, validações, tipos)

/server
  /api               (endpoints)
  /db                (schema/migrations)
  /sync              (processador de operações e idempotência)
  /reports           (consultas e consolidação)
```

## 6.2 Camadas (como pensar)

* **UI:** telas/componentes (não decide regra crítica)
* **Usecases:** “o que acontece quando finaliza venda”
* **Domain:** validações e invariantes (ex: total não pode ser negativo)
* **Data:** acesso a SQLite/IndexedDB
* **Sync:** outbox, retry, conflitos
* **Platform:** impressora, scanner, bluetooth, arquivos, etc.

---

# 7) Banco local: tabelas essenciais (MVP)

### Cadastros

* `products`
* `product_barcodes`
* `categories`
* `customers` (opcional no MVP)

### Operação

* `sales`
* `sale_items`
* `payments`
* `cash_sessions` (abertura/fechamento)
* `cash_movements` (sangria/suprimento)
* `stock_movements`

### Sincronização

* `outbox_ops`

  * `op_id`
  * `type` (ex: `SALE_CREATED`, `CASH_CLOSED`)
  * `payload_json`
  * `status` (`pending`, `sent`, `acked`, `failed`)
  * `retry_count`, `last_error`

---

# 8) Fluxos críticos (offline)

## 8.1 Finalizar venda (offline)

1. UI chama `CreateSaleUsecase`
2. Usecase:

   * valida carrinho + pagamentos
   * grava `sales`, `sale_items`, `payments`
   * grava `stock_movements`
   * cria `outbox_ops` com `SALE_CREATED`
3. UI imprime/enviará comprovante (envio pode ficar pendente até online)

## 8.2 Fechamento de caixa (offline)

* grava `cash_sessions` e `cash_movements`
* cria `outbox_ops` `CASH_CLOSED`
* assim que online, server consolida

---

# 9) Periféricos e integrações (desktop/mobile)

## 9.1 Abstração de plataforma (interface única)

Crie “drivers” por plataforma, por exemplo:

* `PrinterService`
* `BarcodeService`
* `CashDrawerService`
* `ScaleService`

Implementações:

* Desktop (Tauri plugin / Rust / bindings)
* Mobile (Capacitor plugins nativos)
* Web (limitado; onde não der, desabilita ou usa alternativa)

## 9.2 Impressão térmica (estratégia)

* Desktop: ESC/POS via plugin
* Mobile: bluetooth/wi-fi conforme suporte
* Web: impressão via navegador (menos confiável para PDV) → usar mais no Admin

---

# 10) Autenticação, permissões e segurança

* Login com usuário/senha (admin) + **PIN rápido** para operador
* Tokens curtos (session) + refresh (onde fizer sentido)
* Permissões no cliente para UX, **mas o servidor valida tudo**
* Dados sensíveis:

  * criptografar secrets locais (tokens) usando storage seguro da plataforma
  * manter logs locais só do necessário

---

# 11) Deploy e atualizações

## Desktop (Tauri)

* instalador
* auto-update opcional (quando você tiver maturidade)

## Mobile (Capacitor)

* publicação normal (Play Store/App Store) ou distribuição privada

## Web (PWA)

* deploy contínuo
* versionamento do schema local (migrações)

---

# 12) Roadmap natural (evolução sem refatorar tudo)

1. **MVP PDV offline:** vendas + caixa + catálogo + sync básico
2. **Estoque local + alertas:** inventário, mínimo, ajustes
3. **Multi-loja:** store_id, transferências, consolidação server
4. **Fiscal:** separar como módulo (porque muda muito por estado/solução)
5. **Compras/fornecedores:** custo médio, recebimentos
6. **CRM/fidelidade:** histórico, cashback, campanhas

---

# 13) Definição prática do “contrato de sync” (tipos de operação)

Comece com poucos tipos bem definidos:

* `PRODUCTS_UPSERTED` (geralmente server → device, ou admin → devices)
* `SALE_CREATED`
* `SALE_CANCELED`
* `CASH_OPENED`
* `CASH_CLOSED`
* `CASH_MOVEMENT_CREATED`
* `STOCK_MOVEMENT_CREATED`

Isso mantém o sistema previsível e fácil de evoluir.

---

Se você quiser, eu adapto esta documentação para **o seu caso real** em 2 versões:

1. **MVP (7–14 dias)** com o mínimo de tabelas e telas
2. **V1 (30–60 dias)** já com multi-caixa, relatórios essenciais e periféricos prioritários

Só me diga quais periféricos são “obrigatórios” no começo (impressora térmica? gaveta? balança? TEF?).
