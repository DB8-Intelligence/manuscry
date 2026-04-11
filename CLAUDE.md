# Manuscry — CLAUDE.md
## Instruções Permanentes para Claude Code

---

## IDENTIDADE DO PROJETO

**Manuscry** (`manuscry.ai`) — SaaS editorial completo com IA.
Pipeline do zero ao livro publicado: análise de mercado KDP → conceito → roteiro → escrita → capa → biografia → arquivos para Amazon KDP, IngramSpark, ACX/Audible e Findaway Voices.

**Organização:** DB8-Intelligence (Douglas Bonânzza — Salvador/BA)
**Metodologia:** Specification-first → Claude Code → deploy (igual ImobCreator)

---

## INFRAESTRUTURA — IDs REAIS

### SUPABASE
```
Projeto:      manuscry
ID:           noakyceiyzqjujwewgyt
Ref:          noakyceiyzqjujwewgyt
Região:       sa-east-1 (São Paulo)
Status:       ACTIVE_HEALTHY
DB Host:      db.noakyceiyzqjujwewgyt.supabase.co
URL:          https://noakyceiyzqjujwewgyt.supabase.co
Organização:  inmnnifmlcdctizmzfpe
Criado em:    2026-04-11
```

### VERCEL
```
Projeto:      manuscry (CRIAR no dashboard)
Team:         DB8-Intelligence
Team ID:      team_T2S42j3Uj2hWvjnw6b1OVrKK
Framework:    Vite (não Next.js)
Node:         24.x
Branch prod:  production → manuscry.ai
Branch dev:   main → preview automático
vercel.json:  SPA rewrite catch-all → index.html (já criado)
```

**Projetos Vercel existentes no mesmo team (para referência):**
```
imob-creator-studio  → prj_HaEFpHb1MqymO89uTVmh9u1lqiby
book-agent           → prj_e02c5fA6yCHIl01f1NLa6r2LMrdi
nexoomnix            → prj_nnIp9hrSnwexpdGSn445k1YcXgwc
db8-inteligence      → prj_bEP1lkft4nB7K41cRgweRmhnfqt4
```

### RAILWAY
```
Projeto:      manuscry (CRIAR no dashboard)
Serviço:      manuscry-api
Root Dir:     apps/api
Build:        pnpm install && pnpm run build
Start:        node dist/index.js
Health:       /health
Domínio:      api.manuscry.ai
Node:         20.x

Projetos Railway existentes (separados — não misturar):
  db8-BookAgent        → BookAgent + Postgres + Redis
  db8-api-BookAgent    → bookagent.db8intelligence.com.br
  Evolution API        → evolution-api-production-feed.up.railway.app
```

---

## VARIÁVEIS DE AMBIENTE

### Vercel (frontend — apps/web)
```
VITE_SUPABASE_URL              = https://noakyceiyzqjujwewgyt.supabase.co
VITE_SUPABASE_ANON_KEY         = [pegar no Supabase → Settings → API]
VITE_API_URL                   = https://api.manuscry.ai
VITE_APP_ENV                   = production
```

### Railway (backend — apps/api)
```
NODE_ENV                       = production
PORT                           = 3001

# Supabase
SUPABASE_URL                   = https://noakyceiyzqjujwewgyt.supabase.co
SUPABASE_ANON_KEY              = [anon key]
SUPABASE_SERVICE_ROLE_KEY      = [service role key]

# IA
ANTHROPIC_API_KEY              = sk-ant-...
FAL_KEY                        = ...

# Audiobook (Semana 5)
ELEVENLABS_API_KEY             = ...

# Email
RESEND_API_KEY                 = re_...
RESEND_FROM_EMAIL              = noreply@manuscry.ai

# Pagamento (Semana 7)
STRIPE_SECRET_KEY              = sk_live_...
STRIPE_WEBHOOK_SECRET          = whsec_...
HOTMART_CLIENT_ID              = ...
HOTMART_CLIENT_SECRET          = ...
HOTMART_WEBHOOK_SECRET         = ...

# CORS
FRONTEND_URL                   = https://manuscry.ai
CORS_ORIGINS                   = https://manuscry.ai,https://www.manuscry.ai
```

### Supabase Edge Functions
```
# Secrets adicionados via: supabase secrets set --project-ref noakyceiyzqjujwewgyt
ANTHROPIC_API_KEY              = sk-ant-...
FAL_KEY                        = ...
```

---

## STACK TÉCNICA

```
Frontend:     React 18 + Vite + TypeScript
Styling:      Tailwind CSS + shadcn/ui
State:        Zustand + TanStack Query
Backend:      Node.js + Express + TypeScript
Database:     Supabase (PostgreSQL + Storage + Auth + RLS)
IA escrita:   Claude Sonnet claude-sonnet-4-5 via @anthropic-ai/sdk
IA imagens:   Fal.ai Flux Pro via @fal-ai/serverless-client
Audiobook:    ElevenLabs API
Pagamento:    Stripe (EN) + Hotmart (PT-BR)
Deploy FE:    Vercel — team DB8-Intelligence
Deploy BE:    Railway — projeto manuscry separado
Email:        Resend
Monorepo:     Turborepo + pnpm workspaces
```

---

## ESTRUTURA DE DIRETÓRIOS

```
manuscry/                           ← C:\Users\Douglas\manuscry
├── CLAUDE.md                       ← este arquivo
├── vercel.json                     ← SPA rewrite (já criado)
├── .gitignore
├── package.json                    ← monorepo root
├── turbo.json
├── pnpm-workspace.yaml
│
├── apps/
│   ├── web/                        ← Frontend React/Vite → Vercel
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── Auth.tsx           ← login + signup + OAuth
│   │   │   │   │   └── AuthCallback.tsx   ← /auth/callback (OAuth redirect)
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── Dashboard.tsx
│   │   │   │   └── projects/
│   │   │   │       ├── index.tsx          ← lista de projetos
│   │   │   │       ├── new.tsx            ← criar projeto
│   │   │   │       └── [id]/
│   │   │   │           ├── index.tsx      ← visão geral
│   │   │   │           ├── phase-0.tsx    ← Market Analyst
│   │   │   │           ├── phase-1.tsx    ← Theme Selector
│   │   │   │           ├── phase-2.tsx    ← Concept Builder
│   │   │   │           ├── phase-3.tsx    ← Narrative Architect
│   │   │   │           ├── phase-4.tsx    ← Writing Engine
│   │   │   │           └── phase-5.tsx    ← Production Studio
│   │   │   ├── components/
│   │   │   │   ├── app/
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   └── ProtectedRoute.tsx
│   │   │   │   ├── pipeline/
│   │   │   │   ├── editor/
│   │   │   │   ├── covers/
│   │   │   │   └── ui/                    ← shadcn components
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useProjects.ts
│   │   │   │   └── usePipeline.ts
│   │   │   ├── lib/
│   │   │   │   ├── supabase.ts            ← createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
│   │   │   │   └── api.ts                 ← axios/fetch para manuscry-api
│   │   │   ├── stores/
│   │   │   │   └── projectStore.ts
│   │   │   ├── types/
│   │   │   └── App.tsx
│   │   ├── .env.example
│   │   └── package.json
│   │
│   └── api/                        ← Backend Node/Express → Railway
│       ├── src/
│       │   ├── index.ts             ← Express server
│       │   ├── middleware/
│       │   │   ├── auth.ts          ← JWT via Supabase
│       │   │   └── rateLimit.ts
│       │   ├── routes/
│       │   │   ├── auth.ts
│       │   │   ├── projects.ts
│       │   │   ├── pipeline.ts      ← fases 0-4 + chapter streaming SSE
│       │   │   ├── covers.ts
│       │   │   ├── biography.ts
│       │   │   ├── production.ts
│       │   │   └── billing.ts
│       │   └── services/
│       │       ├── claude.service.ts
│       │       ├── fal.service.ts
│       │       ├── supabase.service.ts
│       │       └── prompts/
│       │           └── pipeline.prompts.ts
│       ├── railway.json
│       ├── nixpacks.toml
│       ├── .env.example
│       └── package.json
│
└── packages/
    └── shared/
        └── src/
            └── index.ts             ← tipos compartilhados (Project, Chapter, Plan...)
```

---

## SUPABASE — PADRÕES (igual ImobCreator)

### Migrations
- **1 migration por feature** — nunca recriar tabelas existentes
- Nome: `YYYYMMDDHHMMSS_nome_descritivo`
- Ordem importa — migrations são incrementais
- RLS ativo em todas as tabelas desde a migration 001

### Edge Functions
```
verify_jwt: true   → funções que o usuário autenticado chama (IA, geração)
verify_jwt: false  → webhooks externos (pagamento, callbacks)
```

### Padrão de deploy de função
```bash
supabase functions deploy nome-da-funcao --project-ref noakyceiyzqjujwewgyt
```

---

## VERCEL — PADRÕES (igual ImobCreator)

### Branches
```
main        → preview automático (cada push = URL única de preview)
production  → ao vivo em manuscry.ai (merge de main → production)
```

**Regra:** nunca push direto em production. Sempre main → review → merge.

### vercel.json (SPA rewrite — obrigatório para React SPA)
Já criado. Sem ele, refresh na rota causa 404.

### Variáveis de ambiente
Adicionar no Vercel Dashboard → Project → Settings → Environment Variables:
```
VITE_SUPABASE_URL      → todos os ambientes
VITE_SUPABASE_ANON_KEY → todos os ambientes
VITE_API_URL           → production: https://api.manuscry.ai
                         preview: https://manuscry-api-dev.up.railway.app
```

---

## RAILWAY — PADRÕES

### Configuração do serviço manuscry-api
```json
{
  "build": { "builder": "NIXPACKS", "buildCommand": "pnpm install && pnpm run build" },
  "deploy": { "startCommand": "node dist/index.js", "healthcheckPath": "/health" }
}
```

### Domínio customizado
```
api.manuscry.ai → CNAME para domínio gerado pelo Railway
GoDaddy DNS:
  Tipo: CNAME
  Nome: api
  Valor: [domínio.up.railway.app]
```

---

## PADRÃO DE COMMITS (igual ImobCreator)

```
feat: [módulo] — descrição curta

Migration: nome_da_migration
Edge Function: nome-funcao (o que faz)
Types: arquivo.ts (interfaces criadas)
Hooks: useNomeHook (métodos expostos)
Páginas: NomePagina.tsx (/rota): descrição
Componentes: NomeComponente (funcionalidade)
Routes: +N rotas (lista)
App.tsx: rotas adicionadas

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Regra:** cada feature entrega tudo junto em 1 commit — migration + tipos + hooks + páginas + rotas. Nunca pela metade.

---

## PIPELINE — 5 FASES + MÓDULOS

```
FASE 0  kdp-market-analyst       Análise KDP + score de oportunidade
FASE 1  book-theme-selector      Seleção + validação + UBA
FASE 2  book-concept-builder     Book Bible completo (ficção/não-ficção)
FASE 3  narrative-architect      Roteiro cap a cap + mapa de tensão
FASE 4a chapter-writer           Escrita SSE streaming + humanizador
FASE 4b text-humanizer           Revisão manuscrito completo
FASE 4c audiobook-adapter        Script ElevenLabs/ACX (Semana 5)
FASE 5a cover-generator          5 variações + score + Fal.ai
FASE 5b author-biography         Pacote biográfico por plataforma
FASE 5c book-designer            Specs + dust jacket + tipografia
FASE 5d print-production         EPUB/PDF KDP/IS/audiobook
FASE 5e kdp-metadata-optimizer   Keywords + categorias + HTML desc
```

**Regra crítica:** Book Bible (Fase 2) injetado em TODA chamada de escrita.
Sem contexto persistido = personagens inconsistentes = produto com defeito.

---

## PLANOS

```typescript
trial:     14 dias, 1 livro, ebook + paperback KDP, PT-BR
starter:   R$97/mês  | $27/mês — 1 livro/mês
pro:       R$197/mês | $57/mês — 3 livros/mês, todos os formatos
publisher: R$497/mês | $147/mês — ilimitado, white label
```

---

## ROADMAP DE IMPLEMENTAÇÃO

```
SEMANA 1: Monorepo + Supabase schema + Auth + Dashboard + Fase 0
SEMANA 2: Fases 1, 2, 3 completas
SEMANA 3: Fase 4 (escrita com streaming SSE)
SEMANA 4: Fase 5a covers + 5b biography
SEMANA 5: Fase 5c/5d/5e produção + audiobook
SEMANA 6: EPUB/PDF generation (Pandoc + Puppeteer)
SEMANA 7: Billing Stripe + Hotmart
SEMANA 8: Polish + onboarding + deploy + beta
```

---

## MCPs CONECTADOS

```
Supabase MCP → projeto: manuscry (noakyceiyzqjujwewgyt)
Vercel MCP   → team: DB8-Intelligence (team_T2S42j3Uj2hWvjnw6b1OVrKK)
              projeto: manuscry (ID gerado após criar no dashboard)
n8n MCP      → automacao.db8intelligence.com.br (quando necessário)
```

---

## COMANDOS INICIAIS

```powershell
# 1. Na pasta C:\Users\Douglas\manuscry — instalar deps
pnpm install

# 2. Rodar dev (frontend + api juntos)
pnpm dev

# 3. Deploy edge function Supabase
supabase functions deploy nome-funcao --project-ref noakyceiyzqjujwewgyt

# 4. Ver logs Railway
railway logs --service manuscry-api

# 5. Push para preview (Vercel)
git push origin main

# 6. Deploy produção
git checkout production && git merge main && git push origin production
```

---

## CRIAR PROJETO VERCEL — PASSO A PASSO

Como o MCP do Vercel não cria projetos, fazer manualmente:

```
1. vercel.com → DB8-Intelligence team → Add New Project
2. Import Git Repository → DB8-Intelligence/manuscry
3. Framework: Vite
4. Root Directory: apps/web
5. Node version: 24.x
6. Build Command: pnpm run build
7. Output Directory: dist
8. Adicionar variáveis de ambiente (VITE_SUPABASE_URL etc.)
9. Deploy
10. Settings → Domains → adicionar manuscry.ai
11. Settings → Git → Production Branch: production
```

## CRIAR PROJETO RAILWAY — PASSO A PASSO

```
1. railway.app → New Project
2. Deploy from GitHub → DB8-Intelligence/manuscry
3. Service name: manuscry-api
4. Root Directory: apps/api
5. Adicionar variáveis de ambiente
6. Settings → Networking → Generate Domain
7. Settings → Custom Domain → api.manuscry.ai
8. GoDaddy DNS → CNAME api → [domínio.up.railway.app]
```
