A seguir está uma **documentação geral de projeto (bem completa)** para o seu **PDV offline-first multiplataforma (Desktop/Mobile/Web)**, já estruturada para evoluir depois para “outras coisas” (estoque avançado, compras, fiscal, CRM, etc.).

---

# 1) Visão do projeto

## 1.1 Nome (placeholder)

**Project:** PDV Local-First (nome final depois)

## 1.2 Problema que resolve

Pequenos e médios comércios precisam vender com rapidez e segurança **mesmo sem internet**, com controle básico de caixa/estoque e uma administração simples (relatórios essenciais). A internet deve **melhorar** o sistema, não ser um ponto único de falha.

## 1.3 Objetivo

Construir um PDV que:

* Funcione **offline nas áreas críticas**
* Rode como **instalável** em:

  * **Desktop:** Tauri
  * **Mobile:** Capacitor
  * **Web:** PWA
* Seja escalável para multi-loja e módulos futuros (fiscal, compras, fidelidade, integrações)

## 1.4 Princípio central

**Local-first:** o dispositivo é a fonte da verdade para operação.
O servidor é para sincronizar, consolidar, auditar e habilitar multi-loja.

---

# 2) Público-alvo e perfis

## 2.1 Perfis

* **Operador de caixa:** quer vender rápido, errar pouco, ter atalhos e fluxo direto.
* **Gerente:** abre/fecha caixa, cancela venda, ajusta preço, consulta relatórios.
* **Admin/Owner:** gerencia catálogo, preços, usuários, lojas e relatórios consolidados.

## 2.2 Cenários típicos

* “Internet caiu, preciso continuar vendendo.”
* “Quero fechar caixa e ver divergências.”
* “Quero ver top produtos e formas de pagamento do dia.”
* “Quero cadastrar produto rápido e começar a vender.”

---

# 3) Escopo do produto

## 3.1 MVP (primeira entrega de valor)

**Vendas + Caixa + Catálogo + Offline + Sync básico**

* Operação de venda (carrinho, desconto, pagamento, finalizar)
* Abertura/fechamento de caixa + sangria/suprimento
* Catálogo (produtos, preços, códigos de barras)
* Estoque: baixa automática por venda (simples)
* Outbox + sincronização idempotente
* Impressão de comprovante (desktop prioritário)

## 3.2 V1 (depois do MVP)

* Ajuste/entrada de estoque + inventário simples
* Promoções (combos, leve-pague, preço por quantidade)
* Multi-caixa na mesma loja
* Relatórios melhorados (por período, operador, produto)
* Clientes (cadastro + histórico)
* Backup/restore guiado para suporte

## 3.3 V2 (expansão)

* Multi-loja
* Compras/fornecedores
* Fiscal (NFC-e/SAT/CF-e conforme estratégia)
* Fidelidade/cashback
* Integrações (e-commerce/delivery/ERP/API pública)

## 3.4 Fora do escopo (por enquanto)

* BI avançado / dashboard “enterprise”
* Fluxos fiscais completos no MVP (planejar desde já, implementar depois)

---

# 4) Requisitos funcionais (alto nível)

## 4.1 Operação de venda (offline)

* Buscar produto (nome/SKU/código de barras)
* Adicionar/remover, ajustar quantidade, observações
* Desconto por item e no total, acréscimos/taxas
* Pagamentos: dinheiro/PIX/cartão/manual, múltiplos pagamentos
* Finalizar venda e gerar comprovante
* Cancelar venda com motivo (permissão)
* Reimpressão de comprovante

## 4.2 Caixa (offline)

* Abrir caixa (turno/operador)
* Sangria/suprimento
* Fechar caixa com contagem e divergência
* Relatório do turno (resumo)

## 4.3 Catálogo (offline)

* Produtos, categorias, código de barras
* Preço, custo, margem (ao menos armazenar custo)
* Importação de produtos (opcional no MVP)

## 4.4 Estoque (offline)

* Baixa automática por venda (MVP)
* Movimentações (V1): entrada, ajuste, inventário

## 4.5 Administração (web/pwa principalmente)

* Gestão de usuários e permissões
* Gestão de catálogo e preços
* Relatórios básicos e exportação

## 4.6 Sincronização (core)

* Fila de operações (outbox)
* Sync automático ao detectar internet
* Idempotência (anti-duplicação)
* Resolução de conflitos previsível (ver seção 8)

---

# 5) Requisitos não-funcionais

## 5.1 Offline-first

* O sistema deve permitir venda e fechamento de caixa sem internet.
* O usuário não deve “perder” dados em quedas de energia/rede.

## 5.2 Performance

* Tela de PDV deve abrir rápido
* Busca de produto e scanner com latência mínima
* Operação não pode travar por sync em background

## 5.3 Confiabilidade

* Operações críticas sempre salvas localmente antes de qualquer envio
* Sync com retry + logs de falha legíveis

## 5.4 Segurança

* Autenticação e permissões por perfil
* Logs/auditoria do essencial
* Criptografia de tokens/sessões no device

## 5.5 Manutenibilidade

* Camadas bem separadas (UI / Usecases / Domain / Data / Sync / Platform)
* Contratos claros entre módulos

---

# 6) Decisão tecnológica (stack final recomendada)

## 6.1 Linguagem

* **TypeScript** (front + libs compartilhadas)

## 6.2 UI

* **React + Vite** (apps)
* UI kit: Tailwind ou outro (padrão consistente)

## 6.3 Apps instaláveis

* **Desktop:** Tauri (leve e bom para periféricos via plugins)
* **Mobile:** Capacitor (plugins nativos e distribuição fácil)
* **Web:** PWA (Admin + algumas sessões offline)

## 6.4 Storage local

* **Desktop/Mobile:** SQLite
* **Web:** IndexedDB (ou SQLite WASM opcional)

## 6.5 Back-end

* **PostgreSQL**
* API (REST ou tRPC — escolha pela sua preferência)
* Módulo de sync idempotente

---

# 7) Estrutura de repositório (monorepo)

```
/apps
  /pos-desktop      (Tauri + React)
  /pos-mobile       (Capacitor + React)
  /web-admin        (PWA + React)

/packages
  /ui               (design system e componentes)
  /domain           (entidades, invariantes, regras)
  /usecases         (casos de uso do produto)
  /data             (repositórios, queries, mappers)
  /sync             (outbox, worker, conflitos)
  /platform         (drivers: impressora, scanner, etc.)
  /shared           (utils, tipos, validações)

/server
  /api              (auth, sync, admin, reports)
  /db               (schema, migrations)
  /sync             (processador idempotente + auditoria)
  /reports          (consultas e agregações)
```

---

# 8) Arquitetura de dados e sincronização

## 8.1 Conceito: “evento/operação” + outbox

Toda ação que importa gera:

1. escrita local (transação)
2. uma operação na `outbox_ops` com payload

Quando online:

* Sync Worker envia operações pendentes
* Server processa com idempotência
* Cliente marca como “ack”

## 8.2 Regras de conflito (pragmáticas para PDV)

* **Vendas e caixa:** *append-only*

  * Você não “edita” venda; cria eventos (cancelamento/estorno)
* **Estoque:** via `stock_movements` (eventos) e consolidação
* **Catálogo/preços:** preferência por origem (admin/gerente) e versão/updated_at

## 8.3 Tipos de operação (contrato inicial)

* `SALE_CREATED`
* `SALE_CANCELED`
* `CASH_OPENED`
* `CASH_MOVEMENT_CREATED`
* `CASH_CLOSED`
* `STOCK_MOVEMENT_CREATED`
* `PRODUCT_UPSERTED` (geralmente admin → devices)

## 8.4 Idempotência

Campos mínimos:

* `op_id` (UUID)
* `idempotency_key` (igual ao op_id)
* `device_id`, `store_id`
* `created_at`

Servidor mantém registro de chaves processadas.

---

# 9) Modelo de dados (alto nível)

## 9.1 Tabelas locais essenciais (MVP)

**Catálogo**

* `products` (id, name, sku, price, cost, category_id, updated_at)
* `product_barcodes` (product_id, barcode)
* `categories`

**Operação**

* `sales` (id, number, status, totals, operator_id, created_at)
* `sale_items` (sale_id, product_id, qty, unit_price, discounts, notes)
* `payments` (sale_id, method, amount, meta)
* `cash_sessions` (id, opened_at, closed_at, operator_id, totals)
* `cash_movements` (session_id, type, amount, reason)

**Estoque**

* `stock_movements` (product_id, qty_delta, reason, ref_type/ref_id)

**Sync**

* `outbox_ops` (op_id, type, payload_json, status, retry_count, last_error)

## 9.2 Modelo server (Postgres)

Espelha entidades e adiciona:

* multi-loja
* auditoria
* agregações/relatórios
* permissões centralizadas

---

# 10) Módulo de periféricos (Platform layer)

## 10.1 Interfaces

* `PrinterService` (printReceipt, openDrawer)
* `BarcodeService` (scan events)
* `ScaleService` (read weight)
* `PaymentsService` (futuro: TEF/integração)

## 10.2 Implementações

* Desktop (Tauri plugin): impressão ESC/POS, gaveta, USB/serial
* Mobile (Capacitor plugins): bluetooth/wifi conforme suportado
* Web: limitado (onde não rolar, o UI oculta/desabilita)

---

# 11) UX / UI (diretrizes)

## 11.1 PDV

* Fluxo em 3 telas no máximo: **Produto → Carrinho → Pagamento**
* Operação por teclado + scanner (atalhos)
* Erros sempre com ação clara (“tentar novamente”, “salvo offline”, “ver fila”)

## 11.2 Estado de conectividade

* Indicador discreto: Online / Offline / Sincronizando
* Tela “Fila de sincronização” (para gerente/admin)

## 11.3 Segurança de operações

* Cancelamento/ajuste de preço só com permissão (PIN do gerente)

---

# 12) Segurança e permissões

## 12.1 Autenticação

* Admin: login completo
* Operador: PIN rápido
* Sessão local segura (tokens criptografados no device)

## 12.2 Permissões (exemplos)

* Operador: vender, reimprimir, abrir caixa (opcional)
* Gerente: cancelar, ajustar preço, fechar caixa, sangria
* Admin: catálogo, usuários, relatórios, configurações

## 12.3 Auditoria essencial

* Quem cancelou venda, quem deu desconto, quem fez sangria
* Logs locais + envio ao server via sync

---

# 13) API (visão geral)

## 13.1 Endpoints mínimos

* `POST /auth/login`
* `POST /sync/push` (cliente → server, lote de ops)
* `GET /sync/pull` (server → cliente, mudanças de catálogo/config)
* `GET /reports/*` (admin)

## 13.2 Regras

* `push` idempotente por `idempotency_key`
* Respostas sempre retornam status por operação

---

# 14) Deploy e distribuição

## 14.1 Desktop

* Instalador (Windows primeiro, depois Mac/Linux se necessário)
* Atualização: manual no MVP; auto-update em V1/V2

## 14.2 Mobile

* Distribuição por loja ou privada (dependendo do cliente)
* Feature flags para liberar módulos

## 14.3 Web Admin

* Deploy contínuo (CI/CD)
* Versionamento do schema local (migração de IndexedDB)

---

# 15) Observabilidade e suporte

## 15.1 Logs que importam

* Falhas de sync (com motivo + payload resumido)
* Divergência de caixa
* Impressão falhou (device/driver)

## 15.2 Telas internas úteis (alto valor)

* “Status do dispositivo”: versão, loja, operador, conectividade
* “Fila de sincronização”: pendências e erros
* “Diagnóstico de impressão”

---

# 16) Roadmap sugerido (entregas orientadas a valor)

## 16.1 Sprint 1 (MVP core)

* Catálogo básico
* PDV (venda + pagamento)
* Caixa (abrir/fechar, sangria)
* SQLite + outbox + sync mínimo

## 16.2 Sprint 2

* Relatórios essenciais
* Permissões (PIN gerente)
* Reimpressão, cancelamentos
* Impressão no desktop

## 16.3 Sprint 3

* Estoque V1 (entrada/ajuste)
* Promoções simples
* Melhorias de UX e robustez de sync

---

# 17) Riscos e decisões pendentes

## 17.1 Riscos

* Integração com periféricos varia por modelo/marca
* Fiscal no Brasil pode exigir estratégia separada (provedor, certificado, regras por estado)
* Conflitos de catálogo/preço em multi-dispositivo (resolver por política clara)

## 17.2 Decisões pendentes (checklist)

* Fiscal: qual caminho (terceiro vs implementação própria)
* Desktop alvo inicial: Windows-only ou cross
* Periféricos obrigatórios no MVP (impressora? gaveta? balança?)
* Multi-caixa no MVP ou V1

---

# 18) Definição de pronto (DoD) focada em valor

* Fluxo de venda e fechamento funciona offline
* Dados persistem após reiniciar o app
* Sync reenvia sem duplicar
* Erros críticos têm mensagem acionável
* Relatório do dia/turno disponível

---

Se você quiser, eu transformo essa documentação em:

* **Um README principal + docs por módulo** (POS, Sync, Data, Platform, Server)
* **Checklist de implementação** (tarefas em ordem exata, sem “tarefas invisíveis”)
* **Especificação do schema SQL inicial** (tabelas e campos completos do MVP)
