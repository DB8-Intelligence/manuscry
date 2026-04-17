# Manuscry — Checklist Pré-Deploy

> Tudo que você precisa fazer para colocar o Manuscry em produção.
> Siga na ordem. Cada item leva 5-15 minutos.

---

## Estado atual do código

- Branch: `claude/check-project-status-f3LNk` (25 commits ahead of `main`)
- Builds: passando (tsc + vite)
- Migrations: 3 SQL files prontos em `supabase/migrations/`
- CI: GitHub Actions configurado em `.github/workflows/ci.yml`

---

## Passo 0: Merge para Main

```bash
cd C:\Users\Douglas\manuscry
git checkout main
git pull origin main
git merge claude/check-project-status-f3LNk
git push origin main
```

Isso dispara o CI do GitHub Actions automaticamente.

---

## Passo 1: Supabase (Database)

### 1.1 Aplicar migrations

Acesse: https://supabase.com/dashboard/project/noakyceiyzqjujwewgyt/sql

Execute na ordem:

1. `supabase/migrations/20260411000000_initial_schema.sql`
2. `supabase/migrations/20260417000000_blog_posts.sql`
3. `supabase/migrations/20260417120000_production_hardening.sql`

### 1.2 Validar tabelas

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Esperado: `api_usage_log, blog_posts, book_preview_views, projects, users, webhook_deliveries`

### 1.3 Configurar OAuth

- Authentication → Providers → Google (ativar)
- Authentication → Providers → GitHub (ativar)
- URL Configuration → Site URL: `https://manuscry.ai`
- Redirect URLs: `https://manuscry.ai/auth/callback`

### 1.4 Pegar chaves

- Settings → API → anon key → guardar para `SUPABASE_ANON_KEY`
- Settings → API → service_role key → guardar para `SUPABASE_SERVICE_ROLE_KEY`

---

## Passo 2: Railway (Backend API)

### 2.1 Criar projeto

- railway.app → New Project → Deploy from GitHub
- Repository: `DB8-Intelligence/manuscry`
- Service name: `manuscry-api`
- Root Directory: `apps/api`
- Branch: `main`

### 2.2 Variáveis de ambiente

Copie o conteúdo de `apps/api/.env.example` e configure com valores reais.

Mínimo obrigatório para o MVP rodar:

```env
NODE_ENV=production
SUPABASE_URL=https://noakyceiyzqjujwewgyt.supabase.co
SUPABASE_ANON_KEY=<passo 1.4>
SUPABASE_SERVICE_ROLE_KEY=<passo 1.4>
ANTHROPIC_API_KEY=sk-ant-...
FRONTEND_URL=https://manuscry.ai
CORS_ORIGINS=https://manuscry.ai,https://www.manuscry.ai
INTERNAL_API_KEY=<uuid aleatório>
```

Opcional (pode ser adicionado depois):
- FAL_KEY (capas)
- STRIPE_* (pagamento USD)
- HOTMART_* (pagamento BRL)
- RESEND_API_KEY (email)
- SHOPIFY_* (integração loja)
- CANVA_ACCESS_TOKEN (design)

### 2.3 Domínio

- Settings → Networking → Generate Domain (Railway gera um .up.railway.app)
- Settings → Custom Domain → `api.manuscry.ai`
- GoDaddy DNS → CNAME `api` → `<manuscry-api>.up.railway.app`

### 2.4 Testar

```bash
curl https://api.manuscry.ai/health
# Esperado: {"status":"ok","service":"manuscry-api","version":"1.0.0","environment":"production"}
```

---

## Passo 3: Vercel (Frontend Web)

### 3.1 Criar projeto

- vercel.com → team DB8-Intelligence → Add New Project
- Import Git Repository: `DB8-Intelligence/manuscry`
- Framework: Vite
- Root Directory: `apps/web`
- Build Command: `pnpm run build` (usa o script corrigido que builda shared primeiro)
- Output Directory: `dist`
- Node.js Version: 20.x

### 3.2 Variáveis de ambiente

```env
VITE_SUPABASE_URL=https://noakyceiyzqjujwewgyt.supabase.co
VITE_SUPABASE_ANON_KEY=<passo 1.4 anon key>
VITE_API_URL=https://api.manuscry.ai
```

### 3.3 Domínio

- Settings → Domains → Add `manuscry.ai` + `www.manuscry.ai`
- GoDaddy DNS → seguir instruções do Vercel (A record + CNAME)

### 3.4 Production Branch

- Settings → Git → Production Branch: `main`

---

## Passo 4: Webhooks de Pagamento

### 4.1 Stripe

1. Dashboard Stripe → Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://api.manuscry.ai/api/billing/webhook/stripe`
3. Events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy signing secret → Railway env: `STRIPE_WEBHOOK_SECRET`

### 4.2 Hotmart

1. Painel Hotmart → Desenvolvedor → Webhooks → Novo
2. URL: `https://api.manuscry.ai/api/billing/webhook/hotmart`
3. Eventos: PURCHASE_APPROVED, SUBSCRIPTION_CANCELLATION, PURCHASE_REFUNDED
4. Secret no Hotmart → Railway env: `HOTMART_WEBHOOK_SECRET`

---

## Passo 5: Cron Jobs (opcional, mas recomendado)

### 5.1 Blog auto-publish diário

Use cron-job.org, easycron.com ou n8n:

```
Schedule: daily at 09:00
URL: https://api.manuscry.ai/api/blog/auto-publish
Method: POST
Headers: x-internal-key: <INTERNAL_API_KEY>
Body: {"market": "pt-br"}
```

### 5.2 Reset mensal de contadores (Supabase cron)

Dashboard Supabase → Database → Cron (extension pg_cron):

```sql
select cron.schedule(
  'reset-monthly-books',
  '0 0 1 * *', -- dia 1 de cada mês às 00:00
  'select public.reset_monthly_book_counts();'
);
```

---

## Passo 6: Smoke Test End-to-End

Abra `https://manuscry.ai` no browser:

- [ ] Landing page carrega sem erros no console
- [ ] `/login` abre tela de auth
- [ ] Criar conta (email + senha) funciona
- [ ] Email de welcome chega (se Resend configurado)
- [ ] OAuth Google funciona (se configurado no Supabase)
- [ ] Dashboard carrega após login
- [ ] Botão "+ Novo Livro" abre modal
- [ ] Criar projeto redireciona para `/projects/:id`
- [ ] Fase 0 (Market Analyst) gera resultado (testa Anthropic)
- [ ] `/store` carrega vitrine vazia
- [ ] `/blog` carrega com posts vazios
- [ ] `/settings` mostra plano trial
- [ ] `https://api.manuscry.ai/health` retorna 200

Se algum falhar: abra Railway logs e Vercel logs no dashboard.

---

## Passo 7: Pós-lançamento

### 7.1 Convidar beta testers

Crie convites em `/settings` (planejado) ou manualmente:
- Envie 10-20 convites iniciais
- Foque em autores independentes ativos no KDP

### 7.2 Monitoramento

- Railway → metrics (CPU, memória, requests)
- Vercel → Analytics
- Supabase → Database → Logs (queries lentas)

### 7.3 Iteração

Primeiros 30 dias:
- Coletar feedback de beta testers
- Priorizar bugs sobre features
- Publicar 3-5 posts no blog (auto-publish ajuda)

---

## Troubleshooting comum

### "Supabase not configured" no API
- Verificar `SUPABASE_SERVICE_ROLE_KEY` no Railway
- Variável precisa do valor completo começando com `eyJ`

### "AI providers failed" no API
- Pelo menos um provider (Anthropic/OpenAI/Gemini) precisa de chave válida
- Anthropic é o padrão — garante que `ANTHROPIC_API_KEY` começa com `sk-ant-`

### CORS error no frontend
- Verificar `CORS_ORIGINS` no Railway inclui `https://manuscry.ai` e `https://www.manuscry.ai`
- Reiniciar serviço no Railway após mudar env vars

### Vercel build falha
- Verificar que `apps/web/package.json` tem o script atualizado:
  `"build": "pnpm --filter @manuscry/shared build && tsc -b && vite build"`

### Stripe webhook falha
- Raw body é crítico — o Express tem middleware especial para `/api/billing/webhook/stripe`
- Não adicione `express.json()` antes da rota stripe

### Database schema out of sync
- Code referencia coluna que não existe → re-aplicar migrations
- Checar: `SELECT column_name FROM information_schema.columns WHERE table_name = 'users';`

---

## Contatos importantes

- Supabase: Dashboard → Support
- Railway: Discord da Railway
- Vercel: Dashboard → Help
- Anthropic: support@anthropic.com
- Fal.ai: Discord fal.ai

---

## Custos estimados mensais (escala inicial)

| Serviço | Plano | Custo |
|---|---|---|
| Supabase | Pro | $25/mês |
| Railway | Hobby | $5/mês + uso |
| Vercel | Pro | $20/mês (ou Hobby grátis) |
| Anthropic | Pay-as-you-go | ~$50-200/mês (depende de uso) |
| Fal.ai | Pay-as-you-go | ~$20-100/mês |
| Resend | Free até 3K emails/mês | Gratuito |
| **Total inicial** | | **~$120-350/mês** |

Com 100 usuários pagantes (mix Starter/Pro/Publisher): **receita ~R$15-20K/mês**, margem ~85%.
