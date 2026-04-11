# Manuscry — Prompt de Inicialização para Claude Code

Cole este texto como primeira mensagem no Claude Code dentro da pasta `C:\Users\Douglas\manuscry`.

---

Você vai construir o **Manuscry** (`manuscry.ai`) — um SaaS editorial completo com IA que transforma qualquer pessoa em autor publicado profissional.

O produto conduz o usuário por um pipeline de 5 fases: análise de mercado KDP → seleção de tema → criação do conceito (Book Bible) → roteiro capítulo a capítulo → escrita + humanização + produção completa. A saída são arquivos prontos para publicação em Amazon KDP (ebook + paperback + hardcover), IngramSpark (distribuição global + dust jacket), ACX/Audible e Findaway Voices.

Todas as instruções técnicas estão no arquivo `CLAUDE.md` desta pasta. Leia-o completamente antes de começar.

## Tarefa da Semana 1 — Execute nesta ordem exata:

### Passo 1 — Setup do Monorepo
```bash
# Dentro de C:\Users\Douglas\manuscry
npx create-turbo@latest . --package-manager pnpm
```
Quando perguntar sobre apps, criar dois: `web` (React/Vite) e `api` (Node/Express).

### Passo 2 — Supabase
1. Criar projeto em supabase.com com nome `manuscry`
2. Copiar URL e chaves para `.env`
3. Executar o schema SQL completo do `CLAUDE.md` no SQL Editor do Supabase

### Passo 3 — Backend (apps/api)
Criar servidor Express com:
- Rota `GET /health` retornando `{ status: 'ok', service: 'manuscry-api' }`
- Middleware: cors, helmet, express-rate-limit, auth (JWT via Supabase)
- Rota `POST /api/auth/register` — criar usuário + inserir em public.users
- Rota `POST /api/auth/login` — retornar session token
- Rota `GET /api/projects` — listar projetos do usuário autenticado
- Rota `POST /api/projects` — criar novo projeto
- Rota `GET /api/projects/:id` — buscar projeto com todas as fases

### Passo 4 — Frontend (apps/web)
Criar aplicação React com:
- React Router com rotas: `/login`, `/register`, `/dashboard`, `/projects/:id`
- shadcn/ui inicializado
- Tela de login + registro funcionais com Supabase Auth
- Dashboard com lista de projetos (cards) e botão "Novo Livro"
- Página do projeto com os 6 cards de fase (0 a 5) e indicador de progresso

### Passo 5 — Integração Claude
Criar `apps/api/src/services/claude.service.ts` com:
- `generateStructured<T>()` para respostas JSON (análise, conceito, roteiro)
- `streamChapter()` para escrita com SSE streaming
- Endpoint `POST /api/generate` que recebe `{ phase, projectId, context }` e chama o prompt correto

### Passo 6 — Fase 0 Funcional
Implementar o primeiro módulo real do pipeline:

**Prompt da Fase 0 — Market Analyst:**
```typescript
// apps/api/src/services/prompts/phase0.prompt.ts
export function buildPhase0Prompt(genre: string, market: string): string {
  return `Você é um analista especializado em Amazon KDP com acesso a dados de mercado atuais.

Mercado: ${market === 'pt-br' ? 'Amazon.com.br (Brasil, livros em português)' : 'Amazon.com (mercado global em inglês)'}
Gênero solicitado: ${genre}

Execute análise completa em 4 etapas:

1. TENDÊNCIAS ATUAIS
   Identifique os padrões de consumo mais recentes neste gênero no KDP.
   Quais sub-gêneros estão em alta? O que está saturado?

2. ANÁLISE DOS TOP CONCORRENTES
   Descreva os padrões dos livros mais vendidos:
   - Faixa de preço praticada
   - Tamanho médio (palavras/páginas)
   - Padrões de título e subtítulo
   - Elementos visuais de capa dominantes

3. GAP ANALYSIS
   O que os leitores reclamam nos reviews negativos dos top livros?
   Que necessidade não está sendo atendida?
   Qual ângulo único pode diferenciar um novo livro?

4. 5 TEMAS RANKEADOS
   Para cada tema, calcule:
   Score = (Demanda × 0.4) + (Gap Size × 0.35) + (Monetização × 0.25)
   
   Retorne do score mais alto ao mais baixo.

RETORNE APENAS JSON válido neste formato exato, sem texto fora do JSON:
{
  "market_summary": "string de 2-3 linhas sobre o estado atual do mercado",
  "themes": [
    {
      "rank": 1,
      "title": "nome sugestivo do tema",
      "genre": "gênero KDP exato",
      "subgenre": "sub-gênero específico",
      "opportunity_score": 8.7,
      "demand_level": "alto|médio|baixo",
      "competition_level": "alto|médio|baixo",
      "avg_price_brl": "R$X-Y",
      "avg_price_usd": "$X-Y",
      "gap_insight": "o que falta no mercado",
      "unique_angle": "como diferenciar",
      "risk": "principal risco",
      "evergreen": true
    }
  ],
  "recommendation": "qual tema recomendar e por quê em 2-3 linhas"
}`;
}
```

**Endpoint da Fase 0:**
```typescript
// POST /api/pipeline/phase0
// Body: { projectId, genre, market }
// Retorna: { themes: [...], recommendation: "...", market_summary: "..." }
// Salva em projects.phase_0_data no Supabase
```

**UI da Fase 0:**
- Campo de seleção de gênero (ficção/não-ficção + sub-gênero)
- Botão "Analisar Mercado"
- Loading state com mensagens: "Analisando tendências...", "Identificando gaps...", "Calculando scores..."
- Cards dos 5 temas com score visual (barra de progresso 0-10)
- Badge "⭐ Recomendado" no tema com maior score
- Botão "Selecionar este tema" que avança para Fase 1

## Regras que Nunca Podem Ser Quebradas

1. **Auto-save obrigatório** — qualquer mudança de estado deve persistir no Supabase em até 30 segundos. O usuário nunca pode perder trabalho.

2. **Book Bible sempre no contexto** — todo prompt de escrita (Fase 4) deve incluir o conteúdo completo de `phase_2_data` (Book Bible). Sem isso, os personagens mudam e o livro fica inconsistente.

3. **Fases desbloqueiam sequencialmente** — Fase N só fica ativa quando Fase N-1 está em `phases_completed`. Validar no backend E no frontend.

4. **Streaming para capítulos** — a escrita de capítulos usa SSE (Server-Sent Events), nunca resposta síncrona. Capítulos têm 2.000-4.000 palavras — o usuário precisa ver o texto aparecendo em tempo real.

5. **TypeScript strict** — `"strict": true` no tsconfig. Zero `any` implícito.

6. **RLS ativo** — todas as queries do frontend via Supabase client devem respeitar as policies de RLS. Nunca expor service role key no frontend.

## Entregável da Semana 1

Ao final da semana 1, o seguinte deve funcionar:
- `pnpm dev` sobe frontend em `localhost:5173` e API em `localhost:3001`
- Usuário consegue criar conta, fazer login e ser redirecionado ao dashboard
- Dashboard mostra lista de projetos (vazia inicialmente)
- Botão "Novo Livro" abre modal, usuário escolhe gênero + mercado e cria projeto
- Projeto criado aparece na lista com status "Fase 0 — Análise de Mercado"
- Ao abrir o projeto, usuário vê os 6 cards de fase e pode clicar em "Fase 0"
- Na Fase 0, usuário clica "Analisar Mercado" e recebe os 5 temas com scores
- Selecionando um tema, o estado é salvo no Supabase e Fase 1 é desbloqueada

Comece pelo Passo 1. Me avise quando cada passo estiver completo antes de avançar.
