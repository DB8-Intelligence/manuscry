# Manuscry — Instruções para Claude Code

## O Que É Este Projeto

**Manuscry** (`manuscry.ai`) é um SaaS editorial completo com IA que transforma qualquer pessoa em autor publicado profissional — do conceito inicial ao arquivo pronto para impressão física e venda na Amazon KDP, IngramSpark, ACX/Audible e Findaway Voices.

Diferencial absoluto: nenhum concorrente (Sudowrite, Novelcrafter, Squibler, Publishing.ai) entrega pipeline completo do conceito ao arquivo físico com dust jacket, audiobook e distribuição global. O Manuscry é o único.

---

## Stack Técnica — Nunca Desviar

```
Frontend:    React 18 + Vite + TypeScript
Styling:     Tailwind CSS + shadcn/ui
State:       Zustand + TanStack Query
Backend:     Node.js + Express (deploy Railway)
Database:    Supabase (PostgreSQL + Storage + Auth + RLS)
IA escrita:  Claude Sonnet claude-sonnet-4-5 via @anthropic-ai/sdk
IA imagens:  Fal.ai Flux Pro via @fal-ai/serverless-client
Audiobook:   ElevenLabs API
Pagamento:   Stripe (EN) + Hotmart (PT-BR)
Deploy:      Vercel (frontend) + Railway (backend)
Email:       Resend
Monorepo:    Turborepo + pnpm workspaces
```

---

## Estrutura de Diretórios

```
manuscry/
├── CLAUDE.md                    ← este arquivo
├── .env.example
├── turbo.json
├── package.json
├── apps/
│   ├── web/                     # Frontend React/Vite
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login.tsx
│   │   │   │   │   └── register.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── index.tsx
│   │   │   │   ├── projects/
│   │   │   │   │   ├── index.tsx        # Lista de projetos
│   │   │   │   │   ├── new.tsx          # Criar novo projeto
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── index.tsx    # Visão geral do projeto
│   │   │   │   │       ├── phase-0.tsx  # Market Analyst
│   │   │   │   │       ├── phase-1.tsx  # Theme Selector
│   │   │   │   │       ├── phase-2.tsx  # Concept Builder
│   │   │   │   │       ├── phase-3.tsx  # Narrative Architect
│   │   │   │   │       ├── phase-4.tsx  # Writing Engine
│   │   │   │   │       └── phase-5.tsx  # Production Studio
│   │   │   │   └── settings/
│   │   │   ├── components/
│   │   │   │   ├── pipeline/
│   │   │   │   │   ├── PhaseCard.tsx
│   │   │   │   │   ├── PhaseProgress.tsx
│   │   │   │   │   └── PipelineNav.tsx
│   │   │   │   ├── editor/
│   │   │   │   │   ├── ChapterEditor.tsx    # Tiptap editor
│   │   │   │   │   ├── WordCounter.tsx
│   │   │   │   │   └── StreamingText.tsx    # SSE streaming
│   │   │   │   ├── covers/
│   │   │   │   │   ├── CoverGallery.tsx     # 5 variações
│   │   │   │   │   ├── CoverCard.tsx
│   │   │   │   │   └── CoverComposer.tsx    # Adiciona texto
│   │   │   │   ├── biography/
│   │   │   │   │   ├── AuthorForm.tsx
│   │   │   │   │   └── BiographyPreview.tsx
│   │   │   │   └── ui/                      # shadcn components
│   │   │   ├── stores/
│   │   │   │   ├── projectStore.ts
│   │   │   │   ├── pipelineStore.ts
│   │   │   │   └── userStore.ts
│   │   │   └── lib/
│   │   │       ├── api.ts
│   │   │       ├── claude.ts
│   │   │       └── supabase.ts
│   └── api/                     # Backend Node/Express
│       ├── src/
│       │   ├── routes/
│       │   │   ├── auth.ts
│       │   │   ├── projects.ts
│       │   │   ├── pipeline/
│       │   │   │   ├── phase0.ts    # Market Analyst
│       │   │   │   ├── phase1.ts    # Theme Selector
│       │   │   │   ├── phase2.ts    # Concept Builder
│       │   │   │   ├── phase3.ts    # Narrative Architect
│       │   │   │   └── phase4.ts    # Chapter Writer
│       │   │   ├── covers.ts
│       │   │   ├── biography.ts
│       │   │   ├── production.ts
│       │   │   └── billing.ts
│       │   ├── services/
│       │   │   ├── claude.service.ts
│       │   │   ├── fal.service.ts
│       │   │   ├── elevenlabs.service.ts
│       │   │   ├── formatter.service.ts
│       │   │   └── prompts/             # Prompts das Skills
│       │   │       ├── phase0.prompt.ts
│       │   │       ├── phase1.prompt.ts
│       │   │       ├── phase2.prompt.ts
│       │   │       ├── phase3.prompt.ts
│       │   │       ├── phase4.prompt.ts
│       │   │       ├── covers.prompt.ts
│       │   │       └── biography.prompt.ts
│       │   └── middleware/
│       │       ├── auth.ts
│       │       ├── rateLimit.ts
│       │       └── planGuard.ts
└── packages/
    └── shared/
        ├── types/
        │   ├── project.ts
        │   ├── pipeline.ts
        │   └── billing.ts
        └── constants/
            └── plans.ts
```

---

## Banco de Dados — Schema Completo

```sql
-- Executar no Supabase SQL Editor na ordem abaixo

-- 1. Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de usuários (estende auth.users do Supabase)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  plan TEXT DEFAULT 'trial' CHECK (plan IN ('trial','starter','pro','publisher')),
  market TEXT DEFAULT 'pt-br' CHECK (market IN ('pt-br','en','both')),
  books_this_month INT DEFAULT 0,
  books_limit INT DEFAULT 1,
  trial_ends_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',
  stripe_customer_id TEXT,
  hotmart_subscriber_id TEXT,
  author_profile JSONB DEFAULT '{
    "display_name": null,
    "pen_name": null,
    "city": null,
    "state": null,
    "country": "Brasil",
    "profession": null,
    "education": [],
    "expertise": [],
    "previous_books": [],
    "awards": [],
    "website": null,
    "instagram": null,
    "twitter": null,
    "tiktok": null,
    "email_public": null,
    "photo_url": null,
    "photo_approved": false,
    "personal_detail": null,
    "why_this_book": null
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Projetos (um por livro)
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  market TEXT DEFAULT 'pt-br' CHECK (market IN ('pt-br','en')),
  genre TEXT,
  genre_mode TEXT CHECK (genre_mode IN ('fiction','nonfiction')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','paused','published','archived')),
  current_phase INT DEFAULT 0,
  phases_completed INT[] DEFAULT '{}',

  -- Dados de cada fase (JSON persistido)
  phase_0_data JSONB,  -- market analysis
  phase_1_data JSONB,  -- theme + UBA + profile
  phase_2_data JSONB,  -- book bible completo
  phase_3_data JSONB,  -- narrative outline + chapter map
  phase_4_data JSONB,  -- writing progress
  phase_5_data JSONB,  -- production assets

  -- Métricas pós-publicação (usuário preenche)
  asin TEXT,
  isbn_ebook TEXT,
  isbn_print TEXT,
  bsr_week1 INT,
  reviews_month1 INT,
  revenue_month1 DECIMAL(10,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Capítulos
CREATE TABLE public.chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL,
  title TEXT,
  content TEXT DEFAULT '',
  word_count INT DEFAULT 0,
  tension_level INT CHECK (tension_level BETWEEN 1 AND 10),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','humanized','approved')),
  outline JSONB,           -- ficha do narrative-architect
  characters_present TEXT[],
  key_events TEXT[],
  planted_seeds TEXT[],
  final_hook TEXT,
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, chapter_number)
);

-- 5. Assets de produção
CREATE TABLE public.production_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL,
  -- Tipos: cover_prompt | cover_image | epub | pdf_interior
  --        pdf_cover_kdp_paper | pdf_cover_kdp_hard
  --        pdf_interior_is | dust_jacket | audiobook_script
  --        biography | acknowledgments
  platform TEXT CHECK (platform IN ('kdp','ingramspark','acx','findaway','internal')),
  format TEXT CHECK (format IN ('ebook','paperback','hardcover','audiobook','all')),
  file_url TEXT,
  file_size_bytes BIGINT,
  metadata JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','generating','ready','error')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Assets de capa
CREATE TABLE public.cover_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  variation_name TEXT NOT NULL,
  -- Valores: champion | differentiated | emotional | minimal | cinematic
  prompt_used TEXT,
  image_url TEXT,
  score DECIMAL(3,1),
  scorecard JSONB,
  market_analysis JSONB,
  is_recommended BOOLEAN DEFAULT FALSE,
  is_selected BOOLEAN DEFAULT FALSE,
  composed_versions JSONB,  -- URLs com tipografia adicionada
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Biografias do autor por projeto
CREATE TABLE public.author_biographies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  market TEXT,
  ultra_short TEXT,    -- 30 palavras
  short_bio TEXT,      -- 80 palavras
  medium_bio TEXT,     -- 150 palavras
  long_bio TEXT,       -- 250 palavras
  author_note TEXT,    -- 300-500 palavras (1ª pessoa)
  bio_kdp TEXT,
  bio_ingramspark TEXT,
  bio_acx TEXT,
  bio_dust_jacket TEXT,
  acknowledgments_template TEXT,
  approved BOOLEAN DEFAULT FALSE,
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Dados de aprendizado (retroalimenta o sistema)
CREATE TABLE public.learning_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  project_id UUID REFERENCES public.projects(id),
  genre TEXT,
  subgenre TEXT,
  market TEXT,
  theme TEXT,
  opportunity_score DECIMAL(3,1),
  keywords_used TEXT[],
  actual_bsr INT,
  actual_revenue DECIMAL(10,2),
  what_worked TEXT,
  what_didnt TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Índices de performance
CREATE INDEX idx_projects_user ON public.projects(user_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_chapters_project ON public.chapters(project_id, chapter_number);
CREATE INDEX idx_assets_project ON public.production_assets(project_id, asset_type);
CREATE INDEX idx_covers_project ON public.cover_assets(project_id);
CREATE INDEX idx_learning_user ON public.learning_data(user_id, genre);

-- 10. RLS (Row Level Security) — cada usuário só vê seus dados
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cover_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.author_biographies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own" ON public.users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "projects_own" ON public.projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "chapters_own" ON public.chapters
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM public.projects WHERE id = project_id)
  );

CREATE POLICY "assets_own" ON public.production_assets
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM public.projects WHERE id = project_id)
  );

CREATE POLICY "covers_own" ON public.cover_assets
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM public.projects WHERE id = project_id)
  );

CREATE POLICY "bios_own" ON public.author_biographies
  FOR ALL USING (auth.uid() = user_id);

-- 11. Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER chapters_updated_at BEFORE UPDATE ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Planos e Limites

```typescript
// packages/shared/constants/plans.ts
export const PLANS = {
  trial: {
    books_limit: 1,
    formats: ['ebook', 'paperback_kdp'],
    markets: ['pt-br'],
    audiobook: false,
    ingramspark: false,
    dust_jacket: false,
    days: 14,
  },
  starter: {
    price_brl_cents: 9700,   // R$97/mês
    price_usd_cents: 2700,   // $27/mês
    books_limit: 1,
    formats: ['ebook', 'paperback_kdp'],
    markets: ['pt-br'],      // ou 'en', escolhe 1
    audiobook: false,
    ingramspark: false,
    dust_jacket: false,
  },
  pro: {
    price_brl_cents: 19700,  // R$197/mês
    price_usd_cents: 5700,   // $57/mês
    books_limit: 3,
    formats: ['ebook', 'paperback_kdp', 'hardcover_kdp',
              'paperback_is', 'hardcover_is'],
    markets: ['pt-br', 'en'],
    audiobook: true,
    ingramspark: true,
    dust_jacket: true,
  },
  publisher: {
    price_brl_cents: 49700,  // R$497/mês
    price_usd_cents: 14700,  // $147/mês
    books_limit: -1,         // ilimitado
    formats: 'all',
    markets: ['pt-br', 'en'],
    audiobook: true,
    ingramspark: true,
    dust_jacket: true,
    white_label: true,
    api_access: true,
    pen_names: -1,           // ilimitado
  },
} as const;
```

---

## Pipeline — 5 Fases + Módulos

```
FASE 0  kdp-market-analyst      Análise de mercado KDP + score de oportunidade
FASE 1  book-theme-selector     Seleção e validação do tema + UBA
FASE 2  book-concept-builder    DNA completo do livro (Book Bible)
FASE 3  narrative-architect     Roteiro capítulo a capítulo + mapa de tensão
FASE 4a chapter-writer          Escrita com streaming + humanizador integrado
FASE 4b text-humanizer          Revisão do manuscrito completo
FASE 4c audiobook-adapter       Script para ElevenLabs/ACX (opcional)
FASE 5a cover-generator         5 variações de capa + recomendação com score
FASE 5b author-biography        Pacote biográfico completo por plataforma
FASE 5c book-designer           Specs técnicas + dust jacket + tipografia
FASE 5d print-production        Pacotes de arquivo: epub/PDF KDP/IS/audiobook
FASE 5e kdp-metadata-optimizer  Keywords + categorias + HTML description
```

**Regra crítica:** Book Bible (Fase 2) deve ser injetado em TODA chamada de escrita. Sem contexto persistido, personagens mudam de nome e o livro perde consistência — o erro fatal de todos os concorrentes.

---

## Serviços de IA — Implementação

### Claude (escrita + análise)

```typescript
// apps/api/src/services/claude.service.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-5';

// Para análise e geração estruturada (JSON)
export async function generateStructured<T>(
  system: string,
  user: string,
  maxTokens = 4096
): Promise<T> {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  });
  const text = res.content[0].type === 'text' ? res.content[0].text : '';
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
}

// Para escrita de capítulos (streaming SSE)
export async function streamChapter(
  system: string,
  user: string,
  onChunk: (text: string) => void,
  onDone: () => void
): Promise<void> {
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 8096,
    system,
    messages: [{ role: 'user', content: user }],
  });
  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      onChunk(chunk.delta.text);
    }
  }
  onDone();
}
```

### Fal.ai (capas)

```typescript
// apps/api/src/services/fal.service.ts
import * as fal from '@fal-ai/serverless-client';
fal.config({ credentials: process.env.FAL_KEY });

export async function generateCoverVariations(prompts: string[]) {
  const results = await Promise.all(
    prompts.map(prompt =>
      fal.subscribe('fal-ai/flux-pro', {
        input: {
          prompt,
          image_size: { width: 1600, height: 2400 },
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
        },
      })
    )
  );
  return results.map((r: any) => r.images[0].url);
}
```

---

## Variáveis de Ambiente

```env
# apps/api/.env (nunca commitar — apenas .env.example)

NODE_ENV=development
PORT=3001

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Supabase
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Fal.ai (imagens de capa)
FAL_KEY=...

# ElevenLabs (audiobook)
ELEVENLABS_API_KEY=...

# Stripe (pagamento EN)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Hotmart (pagamento PT-BR)
HOTMART_CLIENT_ID=...
HOTMART_CLIENT_SECRET=...
HOTMART_WEBHOOK_SECRET=...

# Resend (email transacional)
RESEND_API_KEY=re_...

# URLs
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:5173
```

---

## Ordem de Implementação — 8 Semanas

```
SEMANA 1 — Fundação
  □ Turborepo + pnpm workspaces setup
  □ Supabase: criar projeto + executar schema SQL
  □ Backend: Express + rotas base + middleware auth
  □ Frontend: React + Vite + Tailwind + shadcn init
  □ Autenticação: Supabase Auth (email + senha)
  □ CRUD básico de projetos

SEMANA 2 — Integração IA Base
  □ Claude service com streaming
  □ Endpoint POST /api/generate (fase + contexto → output)
  □ Pipeline UI: 5 cards de fase com estado visual
  □ Auto-save: debounce 30s para todos os campos
  □ Persistência JSON de estado por fase no Supabase

SEMANA 3 — Fases 0, 1 e 2
  □ Phase 0: Market Analyst (Claude + web search tool)
  □ Phase 1: Theme Selector + scorecard visual
  □ Phase 2: Concept Builder → Book Bible
  □ Validação de completude antes de avançar de fase

SEMANA 4 — Fase 3 e Editor
  □ Phase 3: Narrative Architect + mapa de tensão
  □ Tiptap editor com word counter em tempo real
  □ Chapter list com drag-and-drop para reordenar

SEMANA 5 — Fase 4 (Escrita)
  □ Chapter Writer com SSE streaming
  □ Text Humanizer (revisão do manuscrito)
  □ Controle de versão de capítulos
  □ Audiobook Adapter (script ElevenLabs)

SEMANA 6 — Fase 5 (Produção)
  □ Cover Generator: 5 variações via Fal.ai
  □ CoverGallery com scorecard e recomendação
  □ Author Biography: formulário + geração
  □ Geração EPUB via Pandoc
  □ Geração PDF interior via Puppeteer

SEMANA 7 — Billing + Produção Final
  □ Stripe checkout (planos EN)
  □ Hotmart webhook (planos PT-BR)
  □ Plan guard middleware
  □ Metadata optimizer (keywords KDP)
  □ Download de arquivos (Supabase Storage)
  □ Checklist de publicação por plataforma

SEMANA 8 — Polish + Launch
  □ Onboarding flow (3 steps)
  □ Email transacional (Resend)
  □ Deploy: Vercel + Railway
  □ Testes com beta fechado (20 usuários)
  □ Monitoring: Sentry + Vercel Analytics
```

---

## Comando de Início

```bash
# No terminal, dentro de C:\Users\Douglas\manuscry

# 1. Criar monorepo
npx create-turbo@latest . --package-manager pnpm

# 2. Instalar dependências do workspace
pnpm install

# 3. Adicionar deps do backend
cd apps/api
pnpm add express @anthropic-ai/sdk @supabase/supabase-js \
  @fal-ai/serverless-client cors dotenv helmet express-rate-limit

pnpm add -D typescript @types/express @types/node tsx nodemon

# 4. Adicionar deps do frontend
cd ../web
pnpm add react-router-dom zustand @tanstack/react-query \
  @supabase/supabase-js @tiptap/react @tiptap/starter-kit

# 5. Inicializar shadcn
npx shadcn@latest init

# 6. Rodar tudo
cd ../..
pnpm dev
```
