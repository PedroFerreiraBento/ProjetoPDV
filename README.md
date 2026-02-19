# Projeto PDV (Offline-First)

Sistema de Ponto de Venda (PDV) moderno, multi-plataforma e offline-first, construído como um monorepo.

## 🏗 Estrutura do Monorepo

Este projeto utiliza **pnpm workspaces** e **Turborepo**.

```
/
├── apps/
│   ├── pos-desktop-tauri/    # App Desktop (Windows/Linux/Mac) - Tauri + React
│   ├── pos-mobile-capacitor/ # App Mobile (Android/iOS) - Capacitor + React
│   └── web-admin-pwa/        # App Web Admin - Vite + React
├── packages/
│   ├── ui/                   # Componentes de UI compartilhados (TailwindCSS)
│   ├── domain/               # Regras de negócio e Zod schemas
│   ├── usecases/             # Lógica de aplicação (Casos de uso)
│   ├── data/                 # Interfaces de persistência
│   ├── sync/                 # Lógica de sincronização e fila offline
│   ├── platform/             # Abstrações de plataforma (Impressora, Storage)
│   └── shared/               # Utilitários e Tipos compartilhados
└── server/                   # Backend API (Fastify)
```

## 🚀 Como Iniciar

### Pré-requisitos

1. **Node.js**: Versão 18+ (recomendado LTS)
2. **pnpm**: Gerenciador de pacotes (`npm install -g pnpm`)
3. **Rust**: Necessário para o desenvolvimento Desktop (Tauri)
4. **Android Studio / Xcode**: Necessário para o desenvolvimento Mobile (Capacitor)

### Instalação

Na raiz do projeto, instale todas as dependências:

```bash
pnpm install
```

### Rodando em Desenvolvimento

Para iniciar todos os aplicativos simultaneamente (modo dev):

```bash
pnpm dev
```

Para rodar apenas um aplicativo específico:

```bash
# Web Admin
pnpm --filter web-admin-pwa dev

# Desktop
pnpm --filter pos-desktop-tauri tauri dev

# Mobile (Web view no navegador)
pnpm --filter pos-mobile-capacitor dev
```

### Build

Para construir todos os projetos:

```bash
pnpm build
```

## 🛠 Tecnologias Principais

- **Linguagem**: TypeScript
- **Frontend**: React, TailwindCSS, Vite
- **Desktop**: Tauri (Rust)
- **Mobile**: Capacitor
- **Backend**: Fastify (Node.js)
- **Gerenciamento de Estado/Logica**: Custom Hooks, Context API, React Query (planejado)
- **Banco de Dados Local**: SQLite (Desktop/Mobile), IndexedDB (Web)
- **Banco de Dados Remoto**: Postgres (Servidor)

## 📦 Pacotes Compartilhados

A lógica de negócio é centralizada nos pacotes dentro de `packages/` para garantir consistência entre as plataformas (Web, Desktop, Mobile).

- **@pos/ui**: Biblioteca de componentes visuais.
- **@pos/domain**: Entidades e validações do núcleo do sistema.
- **@pos/usecases**: Implementação das ações do usuário (ex: `CreateSale`, `CloseShift`).
