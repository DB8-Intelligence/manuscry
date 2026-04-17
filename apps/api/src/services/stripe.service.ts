import Stripe from 'stripe';
import type { PlanId } from '@manuscry/shared';
import { PLANS } from '@manuscry/shared';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

function getStripe() {
  if (!stripe) throw new Error('STRIPE_SECRET_KEY not configured');
  return stripe;
}

const PRICE_MAP: Record<Exclude<PlanId, 'trial'>, { brl: number; usd: number }> = {
  starter: { brl: PLANS.starter.price_brl_cents, usd: PLANS.starter.price_usd_cents },
  pro: { brl: PLANS.pro.price_brl_cents, usd: PLANS.pro.price_usd_cents },
  publisher: { brl: PLANS.publisher.price_brl_cents, usd: PLANS.publisher.price_usd_cents },
};

export async function createCheckoutSession(
  userId: string,
  email: string,
  planId: Exclude<PlanId, 'trial'>,
  currency: 'brl' | 'usd',
): Promise<string> {
  const s = getStripe();
  const prices = PRICE_MAP[planId];
  const amount = currency === 'brl' ? prices.brl : prices.usd;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const session = await s.checkout.sessions.create({
    mode: 'subscription',
    customer_email: email,
    metadata: { userId, planId },
    line_items: [{
      price_data: {
        currency,
        product_data: {
          name: `Manuscry ${planId.charAt(0).toUpperCase() + planId.slice(1)}`,
          description: `Plano ${planId} — ${planId === 'starter' ? '1 livro/mês' : planId === 'pro' ? '3 livros/mês' : 'Ilimitado'}`,
        },
        unit_amount: amount,
        recurring: { interval: 'month' },
      },
      quantity: 1,
    }],
    success_url: `${frontendUrl}/settings?billing=success&plan=${planId}`,
    cancel_url: `${frontendUrl}/settings?billing=cancelled`,
  });

  if (!session.url) throw new Error('Failed to create checkout session');
  return session.url;
}

export interface StripeWebhookEvent {
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

export async function constructWebhookEvent(
  body: Buffer,
  signature: string,
): Promise<StripeWebhookEvent> {
  const s = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  const event = s.webhooks.constructEvent(body, signature, secret);
  return event as unknown as StripeWebhookEvent;
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const s = getStripe();
  await s.subscriptions.cancel(subscriptionId);
}

export function isStripeConfigured(): boolean {
  return stripe !== null;
}
