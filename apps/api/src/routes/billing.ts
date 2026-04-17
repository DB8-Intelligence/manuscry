import { Router, type Request, type Response } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../services/supabase.js';
import {
  createCheckoutSession, constructWebhookEvent, cancelSubscription, isStripeConfigured,
  type StripeWebhookEvent,
} from '../services/stripe.service.js';
import {
  buildHotmartCheckoutUrl, verifyHotmartWebhook, parseHotmartPlan, isHotmartConfigured,
  type HotmartWebhookPayload,
} from '../services/hotmart.service.js';
import type { PlanId, PlanDisplayInfo } from '@manuscry/shared';
import { PLANS } from '@manuscry/shared';

export const billingRouter = Router();

const PLAN_DISPLAY: PlanDisplayInfo[] = [
  {
    id: 'trial',
    name: 'Trial',
    price_brl: 'Grátis',
    price_usd: 'Free',
    books_per_month: '1 livro',
    features: ['14 dias grátis', 'Ebook + Paperback KDP', 'Mercado PT-BR'],
  },
  {
    id: 'starter',
    name: 'Starter',
    price_brl: 'R$97/mês',
    price_usd: '$27/mês',
    books_per_month: '1 livro/mês',
    features: ['Ebook + Paperback KDP', 'Mercado PT-BR', 'Suporte por email'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price_brl: 'R$197/mês',
    price_usd: '$57/mês',
    books_per_month: '3 livros/mês',
    features: [
      'Todos os formatos (ebook, paperback, hardcover)',
      'KDP + IngramSpark',
      'Mercados PT-BR e EN',
      'Audiobook',
      'Dust jacket',
    ],
    popular: true,
  },
  {
    id: 'publisher',
    name: 'Publisher',
    price_brl: 'R$497/mês',
    price_usd: '$147/mês',
    books_per_month: 'Ilimitado',
    features: [
      'Tudo do Pro',
      'White label',
      'Acesso à API',
      'Pen names ilimitados',
      'Suporte prioritário',
    ],
  },
];

// GET /api/billing/plans — list available plans
billingRouter.get('/plans', (_req, res) => {
  res.json({
    plans: PLAN_DISPLAY,
    gateways: {
      stripe: isStripeConfigured(),
      hotmart: isHotmartConfigured(),
    },
  });
});

// GET /api/billing/subscription — get current user's subscription
billingRouter.get('/subscription', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('plan, books_this_month, books_limit, trial_ends_at')
      .eq('id', req.userId!)
      .single();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      plan: user.plan || 'trial',
      books_this_month: user.books_this_month || 0,
      books_limit: user.books_limit || PLANS.trial.books_limit,
      trial_ends_at: user.trial_ends_at,
      is_trial: user.plan === 'trial',
      trial_expired: user.trial_ends_at ? new Date(user.trial_ends_at) < new Date() : false,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/billing/checkout — create checkout session
billingRouter.post('/checkout', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { planId, gateway } = req.body as {
    planId: PlanId;
    gateway: 'stripe' | 'hotmart';
  };

  if (!planId || planId === 'trial') {
    res.status(400).json({ error: 'Plano inválido' });
    return;
  }

  if (!['starter', 'pro', 'publisher'].includes(planId)) {
    res.status(400).json({ error: 'Plano desconhecido' });
    return;
  }

  try {
    if (gateway === 'stripe') {
      if (!isStripeConfigured()) {
        res.status(503).json({ error: 'Stripe não configurado' });
        return;
      }
      const currency = req.body.currency === 'usd' ? 'usd' : 'brl';
      const url = await createCheckoutSession(
        req.userId!,
        req.user!.email,
        planId as Exclude<PlanId, 'trial'>,
        currency,
      );
      res.json({ checkout_url: url });
    } else if (gateway === 'hotmart') {
      if (!isHotmartConfigured()) {
        res.status(503).json({ error: 'Hotmart não configurado' });
        return;
      }
      const url = buildHotmartCheckoutUrl(
        planId as Exclude<PlanId, 'trial'>,
        req.user!.email,
        req.userId!,
      );
      res.json({ checkout_url: url });
    } else {
      res.status(400).json({ error: 'Gateway inválido. Use stripe ou hotmart.' });
    }
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/billing/cancel — cancel subscription
billingRouter.post('/cancel', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('plan, stripe_subscription_id')
      .eq('id', req.userId!)
      .single();

    if (!user || user.plan === 'trial') {
      res.status(400).json({ error: 'Nenhuma assinatura ativa' });
      return;
    }

    if (user.stripe_subscription_id && isStripeConfigured()) {
      await cancelSubscription(user.stripe_subscription_id);
    }

    await supabaseAdmin
      .from('users')
      .update({
        plan: 'trial',
        books_limit: PLANS.trial.books_limit,
        stripe_subscription_id: null,
      })
      .eq('id', req.userId!);

    res.json({ success: true, plan: 'trial' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── WEBHOOKS (no auth — verified via signature) ──────────────────────────────

// Stripe webhook needs raw body
billingRouter.post('/webhook/stripe', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  if (!signature) {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  try {
    const event = await constructWebhookEvent(
      req.body as Buffer,
      signature,
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as { metadata?: Record<string, string>; subscription?: string };
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId as PlanId | undefined;
        if (userId && planId) {
          const planConfig = PLANS[planId as keyof typeof PLANS];
          await supabaseAdmin.from('users').update({
            plan: planId,
            books_limit: 'books_limit' in planConfig ? planConfig.books_limit : 1,
            books_this_month: 0,
            stripe_subscription_id: session.subscription || null,
          }).eq('id', userId);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as { metadata?: Record<string, string> };
        const userId = sub.metadata?.userId;
        if (userId) {
          await supabaseAdmin.from('users').update({
            plan: 'trial',
            books_limit: PLANS.trial.books_limit,
            stripe_subscription_id: null,
          }).eq('id', userId);
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as { subscription_details?: { metadata?: Record<string, string> } };
        const userId = invoice.subscription_details?.metadata?.userId;
        if (userId) {
          console.warn(`[Billing] Payment failed for user ${userId}`);
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Stripe Webhook Error]', err);
    res.status(400).json({ error: (err as Error).message });
  }
});

// Hotmart webhook
billingRouter.post('/webhook/hotmart', async (req: Request, res: Response) => {
  const signature = req.headers['x-hotmart-hottok'] as string || '';
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

  if (isHotmartConfigured() && !verifyHotmartWebhook(rawBody, signature)) {
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }

  try {
    const payload = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as HotmartWebhookPayload;
    const event = payload.event;
    const email = payload.data?.buyer?.email;
    const productName = payload.data?.product?.name || '';

    if (!email) {
      res.status(400).json({ error: 'Missing buyer email' });
      return;
    }

    const planId = parseHotmartPlan(productName);

    switch (event) {
      case 'PURCHASE_APPROVED':
      case 'SUBSCRIPTION_REACTIVATION': {
        if (!planId) break;
        const planConfig = PLANS[planId as keyof typeof PLANS];
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', email)
          .single();

        if (user) {
          await supabaseAdmin.from('users').update({
            plan: planId,
            books_limit: 'books_limit' in planConfig ? planConfig.books_limit : 1,
            books_this_month: 0,
            hotmart_subscriber_code: payload.data.subscription?.subscriber_code || null,
          }).eq('id', user.id);
        }
        break;
      }
      case 'PURCHASE_REFUNDED':
      case 'SUBSCRIPTION_CANCELLATION': {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', email)
          .single();

        if (user) {
          await supabaseAdmin.from('users').update({
            plan: 'trial',
            books_limit: PLANS.trial.books_limit,
            hotmart_subscriber_code: null,
          }).eq('id', user.id);
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Hotmart Webhook Error]', err);
    res.status(500).json({ error: (err as Error).message });
  }
});
