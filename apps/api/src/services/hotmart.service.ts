import crypto from 'crypto';
import type { PlanId } from '@manuscry/shared';
import { PLANS } from '@manuscry/shared';

const PRICE_MAP: Record<Exclude<PlanId, 'trial'>, number> = {
  starter: PLANS.starter.price_brl_cents / 100,
  pro: PLANS.pro.price_brl_cents / 100,
  publisher: PLANS.publisher.price_brl_cents / 100,
};

const PLAN_NAMES: Record<Exclude<PlanId, 'trial'>, string> = {
  starter: 'Manuscry Starter',
  pro: 'Manuscry Pro',
  publisher: 'Manuscry Publisher',
};

export interface HotmartWebhookPayload {
  event: string;
  data: {
    buyer: { email: string; name: string };
    purchase: {
      transaction: string;
      status: string;
      price: { value: number; currency_code: string };
    };
    subscription?: {
      subscriber_code: string;
      status: string;
      plan?: { name: string };
    };
    product: { id: number; name: string };
  };
}

export function buildHotmartCheckoutUrl(
  planId: Exclude<PlanId, 'trial'>,
  email: string,
  userId: string,
): string {
  const productId = process.env[`HOTMART_PRODUCT_ID_${planId.toUpperCase()}`] || '';
  const baseUrl = `https://pay.hotmart.com/${productId}`;
  const params = new URLSearchParams({
    email,
    checkoutMode: '10',
    sck: userId,
  });
  return `${baseUrl}?${params.toString()}`;
}

export function verifyHotmartWebhook(
  body: string,
  signature: string,
): boolean {
  const secret = process.env.HOTMART_WEBHOOK_SECRET;
  if (!secret) return false;
  const computed = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(computed, 'hex'),
    Buffer.from(signature, 'hex'),
  );
}

export function parseHotmartPlan(productName: string): PlanId | null {
  for (const [plan, name] of Object.entries(PLAN_NAMES)) {
    if (productName.toLowerCase().includes(name.toLowerCase()) ||
        productName.toLowerCase().includes(plan)) {
      return plan as PlanId;
    }
  }
  return null;
}

export function isHotmartConfigured(): boolean {
  return !!(process.env.HOTMART_CLIENT_ID && process.env.HOTMART_WEBHOOK_SECRET);
}

export { PRICE_MAP as HOTMART_PRICES, PLAN_NAMES };
