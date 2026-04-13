import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

export const billingRouter = Router();

// Webhook endpoints would be public (verify_signature instead of JWT)
// Stub — Stripe + Hotmart integration (Week 7)
billingRouter.get('/plans', (_req, res) => {
  res.json({
    plans: [
      { id: 'trial', label: 'Trial', price_brl: 0, price_usd: 0, duration_days: 14 },
      { id: 'starter', label: 'Starter', price_brl: 97, price_usd: 27, books_per_month: 1 },
      { id: 'pro', label: 'Pro', price_brl: 197, price_usd: 57, books_per_month: 3 },
      { id: 'publisher', label: 'Publisher', price_brl: 497, price_usd: 147, books_per_month: null },
    ],
  });
});

billingRouter.post('/checkout', requireAuth, (_req, res) => {
  res.status(501).json({
    error: 'Not implemented yet',
    module: 'billing',
    eta: 'Week 7',
  });
});

billingRouter.post('/webhook/stripe', (_req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

billingRouter.post('/webhook/hotmart', (_req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});
