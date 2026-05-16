# Chronos Logística - TMP

Dashboard de controle logístico em tempo real com Kanban de romaneios, filtros dinâmicos e integração com Supabase.

---

## Estrutura do Projeto

```
chronos-logistica/
├── frontend/                    # Aplicação React (Vite + Tailwind)
│   ├── index.html               # Entry point HTML
│   └── src/
│       ├── main.tsx             # Bootstrap da aplicação React
│       ├── App.tsx              # Componente raiz, roteamento de tabs
│       ├── index.css            # Estilos globais (Tailwind + custom)
│       ├── components/          # Componentes reutilizáveis
│       │   ├── Configurator.tsx # Aba de configurações / premissas
│       │   ├── Filters.tsx      # Filtros de data e operador
│       │   ├── Header.tsx       # Cabeçalho com logo e clock
│       │   ├── Sidebar.tsx      # Menu lateral de navegação
│       │   ├── StatusColumn.tsx # Coluna Kanban por status
│       │   ├── Table.tsx        # Tabela detalhada com virtualização
│       │   └── VehicleCard.tsx  # Card de romaneio no Kanban
│       ├── hooks/
│       │   ├── useDebounce.ts   # Hook de debounce para inputs
│       │   └── useRomaneios.ts  # Hook principal de dados e filtros
│       ├── lib/
│       │   └── supabase.ts      # Cliente Supabase (frontend, via import.meta.env)
│       ├── pages/
│       │   └── Dashboard.tsx    # Página principal do dashboard
│       ├── services/
│       │   ├── romaneiosService.ts  # Chamadas HTTP para a API Express
│       │   └── supabase.ts          # Re-export do cliente Supabase
│       ├── store/
│       │   └── usePremisesStore.ts  # Estado global de premissas (Zustand)
│       ├── types/
│       │   └── logistics.ts     # Tipos TypeScript do domínio
│       └── utils/
│           ├── format.ts        # Formatadores de data/hora/texto
│           └── logistics.ts     # Funções utilitárias de negócio
│
├── backend/                     # API Express + Supabase (Node.js)
│   └── src/
│       ├── config/
│       │   └── supabase.ts      # Cliente Supabase servidor (ws transport)
│       ├── controllers/         # Controllers das rotas
│       ├── routes/
│       │   └── romaneiosRoutes.ts  # Rotas /api/romaneios/*
│       ├── services/            # Lógica de negócio do backend
│       └── types/               # Tipos TypeScript compartilhados
│
├── server.ts                    # Entry point: Express + Vite middleware
├── vite.config.ts               # Configuração Vite (root: frontend/)
├── tsconfig.json                # Configuração TypeScript
├── package.json                 # Dependências e scripts
├── .env                         # Variáveis de ambiente (não commitado)
├── .gitignore
├── supabase_setup.sql           # Schema inicial do banco
└── supabase_integration.sql     # Migrations e integrações
```

---

## Arquitetura

```
Browser (React SPA)
      │
      │  HTTP /api/*
      ▼
Express Server (server.ts)
      │                    │
   /api/*              /* (SPA)
      │                    │
   Backend             Vite Dev Server
   (Express routes)    (HMR em dev /
      │                 dist/ em prod)
      │
   Supabase
   (PostgreSQL na nuvem)
```

### Fluxo de Dados

1. O **browser** faz chamadas para `/api/romaneios/*` via `romaneiosService.ts`
2. O **Express** recebe, processa no controller e consulta o **Supabase**
3. A resposta JSON volta para o hook `useRomaneios.ts` que atualiza o estado React
4. O **Zustand** (`usePremisesStore`) mantém as premissas globais (SLA, tolerâncias)

---

## Pré-requisitos

- **Node.js** v20+ (recomendado v22+ para suporte nativo a WebSocket)
- **npm** v10+
- Conta no [Supabase](https://supabase.com) com a tabela `romaneios` criada

---

## Setup

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o template e preencha com suas credenciais:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
# URL da API (usado pelo frontend em dev)
VITE_API_URL=http://localhost:3333

# Credenciais Supabase (backend - Node.js)
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_ANON_KEY=sua-anon-key

# Credenciais Supabase (frontend - Vite/browser)
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

> **Atenção:** Variáveis com prefixo `VITE_` são expostas ao browser pelo Vite.  
> As sem prefixo são exclusivas do processo Node.js (backend).

### 3. Inicializar banco de dados

Execute os arquivos SQL no Supabase Studio ou CLI:

```bash
# Schema base
psql -h db.SEU-PROJETO.supabase.co -U postgres -f supabase_setup.sql

# Integrações e functions
psql -h db.SEU-PROJETO.supabase.co -U postgres -f supabase_integration.sql
```

---

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor Express + Vite HMR em `http://localhost:3000` |
| `npm run build` | Build de produção (output em `dist/`) |
| `npm run preview` | Preview do build de produção |
| `npm run lint` | Checagem de tipos TypeScript |
| `npm run clean` | Remove a pasta `dist/` |

---

## Rotas da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/health` | Health check do servidor |
| `POST` | `/api/romaneios/dashboard` | Dados do Kanban com filtros |
| `GET` | `/api/romaneios/filters` | Opções de filtro disponíveis |
| `GET` | `/api/romaneios/premises` | Premissas/configurações |
| `PUT` | `/api/romaneios/premises` | Atualizar premissas |

---

## Variáveis de Ambiente — Referência Completa

| Variável | Escopo | Obrigatória | Descrição |
|----------|--------|-------------|-----------|
| `SUPABASE_URL` | Backend | ✅ | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Backend | ✅ | Chave anônima do Supabase |
| `VITE_SUPABASE_URL` | Frontend | ✅ | URL Supabase (exposta ao browser) |
| `VITE_SUPABASE_ANON_KEY` | Frontend | ✅ | Chave anônima (exposta ao browser) |
| `VITE_API_URL` | Frontend | ❌ | URL base da API (default: `/api`) |
| `GEMINI_API_KEY` | Frontend | ❌ | Chave da API Google Gemini |
| `NODE_ENV` | Backend | ❌ | `development` ou `production` |
| `DISABLE_HMR` | Dev | ❌ | `true` para desativar Hot Module Reload |

---

## Tecnologias

### Frontend
| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| React | 18 | UI framework |
| Vite | 6 | Build tool e dev server |
| TypeScript | 5.8 | Tipagem estática |
| Tailwind CSS | 4 | Estilização utility-first |
| Zustand | 5 | Estado global |
| Lucide React | latest | Ícones |
| React Window | 1.8 | Virtualização de listas |
| Axios | 1.x | HTTP client |

### Backend
| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Express | 4 | Servidor HTTP |
| Supabase JS | 2 | ORM / cliente Supabase |
| ws | 8 | WebSocket (Node.js < 22) |
| dotenv | 17 | Carregamento de `.env` |
| tsx | 4 | Execução TypeScript em dev |

---

## Deploy em Produção

A aplicação usa uma arquitetura **split-deploy**:

| Serviço | Plataforma | URL exemplo |
|---------|-----------|-------------|
| Frontend (React/Vite) | **Vercel** | `https://chronos-logistica.vercel.app` |
| Backend (Express API) | **Render** | `https://chronos-logistica-api.onrender.com` |

### Arquitetura de Produção

```
Browser
  │
  ├── /* (assets, SPA routing)
  │     └── Vercel CDN (dist/)
  │
  └── /api/* (chamadas de dados)
        └── Render (backend/server.ts)
              └── Supabase (banco de dados)
```

---

### 1. Deploy do Backend no Render

**a) Crie o serviço no Render**

1. Acesse [render.com](https://render.com) → **New** → **Web Service**
2. Conecte o repositório GitHub
3. Configure:

| Campo | Valor |
|-------|-------|
| **Name** | `chronos-logistica-api` |
| **Root Directory** | _(deixar em branco — raiz do repo)_ |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node --import tsx/esm backend/server.ts` |
| **Plan** | Free (ou Standard para produção) |

**b) Configure as variáveis de ambiente no painel do Render**

```
NODE_ENV          = production
SUPABASE_URL      = https://SEU-PROJETO.supabase.co
SUPABASE_KEY = sua-anon-key
FRONTEND_URL      = https://seu-app.vercel.app   ← preencher após deploy do Vercel
PORT
```

**c) Anote a URL do serviço** após o deploy:
```
https://chronos-logistica-api.onrender.com
```

---

### 2. Deploy do Frontend no Vercel

**a) Crie o projeto no Vercel**

1. Acesse [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Importe o repositório GitHub
3. O Vercel detectará automaticamente o `vercel.json` na raiz

**b) Configure as variáveis de ambiente no painel do Vercel**

```
VITE_API_URL          = https://chronos-logistica-api.onrender.com/api  - https://chronos-backend-1-e2h0.onrender.com
VITE_SUPABASE_URL     = https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY = sua-anon-key
```

> ⚠️ Variáveis com prefixo `VITE_` são embutidas no bundle pelo Vite em build time.
> Qualquer mudança exige um novo deploy.

**c) Deploy**

O Vercel rodará automaticamente:
```bash
npm install
vite build       # output em dist/
```

---

### 3. Após ambos os deploys — CORS

Volte ao Render e atualize a variável:
```
FRONTEND_URL = https://seu-app-real.vercel.app
```

Faça um **Manual Deploy** no Render para aplicar a mudança.

---

### Resumo de Variáveis por Ambiente

| Variável | Local (`.env`) | Vercel | Render |
|----------|---------------|--------|--------|
| `SUPABASE_URL` | ✅ | ❌ | ✅ |
| `SUPABASE_ANON_KEY` | ✅ | ❌ | ✅ |
| `VITE_SUPABASE_URL` | ✅ | ✅ | ❌ |
| `VITE_SUPABASE_ANON_KEY` | ✅ | ✅ | ❌ |
| `VITE_API_URL` | ✅ `localhost:3000/api` | ✅ URL do Render | ❌ |
| `FRONTEND_URL` | ❌ | ❌ | ✅ URL do Vercel |
| `NODE_ENV` | ❌ | ❌ | ✅ `production` |

---

## Notas de Desenvolvimento

### Node.js 20 e WebSocket
O Supabase Realtime requer WebSocket. No Node.js < 22, é necessário fornecer a implementação `ws` explicitamente:

```ts
// backend/src/config/supabase.ts
import ws from 'ws';
export const supabase = createClient(url, key, {
  realtime: { transport: ws }
});
```

### Alias de Importação
Use `@/` como alias para a raiz do `frontend/`:

```ts
import { Romaneio } from '@/src/types/logistics';
import { formatDate } from '@/src/utils/format';
```

---

## Licença

Proprietário — Chronos Logística © 2026. Todos os direitos reservados.
