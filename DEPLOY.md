# Manuscry — Guia de Deploy

## Status atual
- Branch de desenvolvimento: `claude/check-project-status-f3LNk`
- Código: 15K+ linhas, 92 arquivos TS, 62 endpoints, 23 páginas
- **Nunca foi deployado em produção.** Este guia cobre o lançamento inicial.

---

## Pré-requisitos

Contas necessárias:
- [x] Supabase — projeto `manuscry` (ID: `noakyceiyzqjujwewgyt`, sa-east-1)
- [ ] Vercel — team `DB8-Intelligence`
- [ ] Railway — novo projeto `manuscry-api`
- [ ] Anthropic — API key (Claude)
- [ ] Fal.ai — API key (imagens)
- [ ] Stripe — conta + webhook secret
- [ ] Hotmart — client ID + webhook secret
- [ ] Resend — API key (email)
- [ ] Shopify — store URL + access token (opcional)
- [ ] Domínio `manuscry.ai` (GoDaddy ou similar)

---

## 1. Aplicar Schema no Supabase

```bash
# Conecte ao projeto Supabase via CLI
supabase link --project-ref noakyceiyzqjujwewgyt

# Aplicar migrations
supabase db push

# OU aplicar manualmente via SQL Editor:
# 1. Copie conteúdo de supabase/migrations/20260411000000_initial_schema.sql
# 2. Cole no SQL Editor do Supabase Dashboard
# 3. Execute
# 4. Repita para 20260417000000_blog_posts.sql
```

Verificar tabelas criadas:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
-- Esperado: users, projects, blog_posts
```

Verificar OAuth (Google + GitHub):
1. Supabase Dashboard → Authentication → Providers
2. Ativar Google e GitHub
3. Configurar redirect URL: `https://manuscry.ai/auth/callback`

---

## 2. Deploy API (Railway)

### 2.1 Criar projeto no Railway
1. railway.app → New Project
2. Deploy from GitHub → `DB8-Intelligence/manuscry`
3. Service name: `manuscry-api`
4. Root Directory: `apps/api`

### 2.2 Configurar variáveis de ambiente
Adicionar no Railway → Variables:

```env
NODE_ENV=production
PORT=3001

# Supabase
SUPABASE_URL=https://noakyceiyzqjujwewgyt.supabase.co
SUPABASE_ANON_KEY=<pegar em Settings > API>
SUPABASE_SERVICE_ROLE_KEY=<pegar em Settings > API>

# IA — pelo menos 1 provider obrigatório
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-5
OPENAI_API_KEY=sk-... (opcional, fallback)
GEMINI_API_KEY=... (opcional, fallback)

# Fal.ai (capas)
FAL_KEY=...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Hotmart
HOTMART_CLIENT_ID=...
HOTMART_CLIENT_SECRET=...
HOTMART_WEBHOOK_SECRET=...
HOTMART_PRODUCT_ID_STARTER=...
HOTMART_PRODUCT_ID_PRO=...
HOTMART_PRODUCT_ID_PUBLISHER=...

# Resend (email)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@manuscry.ai

# Shopify (opcional — integração com loja)
SHOPIFY_STORE_URL=https://sua-loja.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_...

# URLs
FRONTEND_URL=https://manuscry.ai
CORS_ORIGINS=https://manuscry.ai,https://www.manuscry.ai

# Blog auto-publish (cron)
INTERNAL_API_KEY=<gerar UUID aleatório>
```

### 2.3 Domínio customizado
1. Railway → Settings → Networking → Generate Domain (ex: `manuscry-api.up.railway.app`)
2. Railway → Custom Domain → `api.manuscry.ai`
3. GoDaddy DNS → CNAME `api` → `manuscry-api.up.railway.app`

### 2.4 Configurar webhooks
**Stripe:**
- Dashboard Stripe → Developers → Webhooks → Add endpoint
- URL: `https://api.manuscry.ai/api/billing/webhook/stripe`
- Eventos: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`
- Copiar signing secret para `STRIPE_WEBHOOK_SECRET`

**Hotmart:**
- Painel Hotmart → Desenvolvedor → Webhooks
- URL: `https://api.manuscry.ai/api/billing/webhook/hotmart`
- Eventos: PURCHASE_APPROVED, SUBSCRIPTION_CANCELLATION, PURCHASE_REFUNDED

---

## 3. Deploy Frontend (Vercel)

### 3.1 Criar projeto no Vercel
1. vercel.com → team DB8-Intelligence → Add New Project
2. Import Git Repository → `DB8-Intelligence/manuscry`
3. Framework: Vite
4. Root Directory: `apps/web`
5. Node version: 24.x
6. Build Command: `pnpm run build`
7. Output Directory: `dist`

### 3.2 Variáveis de ambiente (Vercel)
```env
VITE_SUPABASE_URL=https://noakyceiyzqjujwewgyt.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
VITE_API_URL=https://api.manuscry.ai
```

### 3.3 Domínio
1. Settings → Domains → Add `manuscry.ai` + `www.manuscry.ai`
2. GoDaddy DNS → A record `@` → IP do Vercel (ou usar nameservers do Vercel)
3. Settings → Git → Production Branch: `production` (ou `main`)

---

## 4. Cron Jobs / Automações

### 4.1 Blog auto-publish
Serviço externo (n8n, Zapier, cron-job.org) chama diariamente:
```bash
curl -X POST https://api.manuscry.ai/api/blog/auto-publish \
  -H "x-internal-key: <INTERNAL_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"market": "pt-br"}'
```

### 4.2 Reset mensal de contadores
Supabase → Database → Functions → Cron job mensal (dia 1 às 00:00):
```sql
SELECT reset_monthly_book_counts();
```

---

## 5. Smoke Test Pós-Deploy

Checklist:
- [ ] `https://manuscry.ai` → Landing page carrega
- [ ] `https://api.manuscry.ai/health` → `{ status: "ok" }`
- [ ] Criar conta (email + senha) → recebe welcome email
- [ ] Login OAuth Google/GitHub funciona
- [ ] Dashboard carrega
- [ ] Criar novo projeto → redireciona para Phase 0
- [ ] Phase 0 gera análise de mercado (testa Anthropic)
- [ ] Upload manuscrito funciona
- [ ] Checkout Stripe abre página de pagamento
- [ ] Checkout Hotmart redireciona corretamente
- [ ] `/store` (vitrine) carrega
- [ ] `/blog` carrega
- [ ] Webhooks Stripe/Hotmart respondem 200

---

## 6. Monitoramento

Configurar:
- Railway logs (já incluído)
- Vercel Analytics (habilitar)
- Sentry ou similar para error tracking (opcional)
- Supabase Dashboard → Logs para queries lentas

---

## 7. Pós-lançamento — Primeiros passos

1. **Beta testers** (10-20 pessoas convidadas)
2. **Feedback loop** — formulário de feedback no dashboard
3. **Iteração** — ajustes baseados em uso real
4. **Lançamento público** após 2-4 semanas de beta

---

## Problemas conhecidos / Débitos técnicos

- Schema armazena dados complexos em JSONB (`author_profile`, `phase_*_data`).
  Funciona, mas para escalar >10K usuários, migrar para tabelas dedicadas.
- Zero testes automatizados. Adicionar pelo menos smoke tests das rotas críticas.
- Rate limit global (10/min AI). Usuários Publisher merecem limite maior.
- Preview de livro público não tem cache (consulta DB a cada view).
- Sem CDN para imagens de capa (Fal.ai URLs expiram).
  Solução: fazer mirror no Supabase Storage ao gerar.
