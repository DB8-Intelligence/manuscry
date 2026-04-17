import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../services/supabase.js';
import {
  AGREEMENT_VERSION, AGREEMENT_TERMS, PLATFORM_PAYMENT_DELAYS,
  type AuthorAgreement, type BankAccount, type RoyaltySummary, type RoyaltyStatement,
} from '@manuscry/shared';

export const royaltiesRouter = Router();
royaltiesRouter.use(requireAuth);

// ── AGREEMENT ────────────────────────────────────────────────────────────────

// GET /api/royalties/agreement — get agreement terms and status
royaltiesRouter.get('/agreement', async (req: AuthenticatedRequest, res) => {
  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('author_profile')
      .eq('id', req.userId!)
      .single();

    const profile = (user?.author_profile || {}) as Record<string, unknown>;
    const agreement = (profile.distribution_agreement || null) as AuthorAgreement | null;

    res.json({
      agreement,
      terms_text: AGREEMENT_TERMS,
      version: AGREEMENT_VERSION,
      platform_delays: PLATFORM_PAYMENT_DELAYS,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/royalties/agreement/accept — accept the distribution agreement
royaltiesRouter.post('/agreement/accept', async (req: AuthenticatedRequest, res) => {
  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('author_profile')
      .eq('id', req.userId!)
      .single();

    const profile = (user?.author_profile || {}) as Record<string, unknown>;
    const agreement: AuthorAgreement = {
      accepted: true,
      accepted_at: new Date().toISOString(),
      version: AGREEMENT_VERSION,
      terms: {
        royalty_schedule: 'Conforme prazo de cada plataforma + 5 dias úteis',
        payment_terms: 'Pagamento automático na conta bancária cadastrada',
        minimum_payout_brl: 5000,
        minimum_payout_usd: 2500,
        platform_delays: PLATFORM_PAYMENT_DELAYS,
      },
    };

    await supabaseAdmin
      .from('users')
      .update({
        author_profile: { ...profile, distribution_agreement: agreement },
      })
      .eq('id', req.userId!);

    res.json({ accepted: true, agreement });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── BANK ACCOUNT ─────────────────────────────────────────────────────────────

// GET /api/royalties/bank — get saved bank account
royaltiesRouter.get('/bank', async (req: AuthenticatedRequest, res) => {
  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('author_profile')
      .eq('id', req.userId!)
      .single();

    const profile = (user?.author_profile || {}) as Record<string, unknown>;
    const bank = (profile.bank_account || null) as BankAccount | null;

    res.json({ bank_account: bank });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/royalties/bank — save/update bank account
royaltiesRouter.post('/bank', async (req: AuthenticatedRequest, res) => {
  const bankData = req.body as Omit<BankAccount, 'verified' | 'updated_at'>;

  if (!bankData.holder_name || !bankData.bank_code || !bankData.account_number) {
    res.status(400).json({ error: 'holder_name, bank_code e account_number obrigatórios' });
    return;
  }

  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('author_profile')
      .eq('id', req.userId!)
      .single();

    const profile = (user?.author_profile || {}) as Record<string, unknown>;
    const bankAccount: BankAccount = {
      ...bankData,
      verified: false,
      updated_at: new Date().toISOString(),
    };

    await supabaseAdmin
      .from('users')
      .update({
        author_profile: { ...profile, bank_account: bankAccount },
      })
      .eq('id', req.userId!);

    res.json({ bank_account: bankAccount });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── STATEMENTS & SUMMARY ────────────────────────────────────────────────────

// GET /api/royalties/summary — earnings overview
royaltiesRouter.get('/summary', async (req: AuthenticatedRequest, res) => {
  try {
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('phase_5_data')
      .eq('user_id', req.userId!)
      .eq('status', 'published');

    let totalEarnings = 0;
    let totalSold = 0;
    let activeChannels = 0;

    for (const p of projects || []) {
      const p5 = p.phase_5_data as Record<string, unknown> | null;
      const dist = p5?.distribution as Record<string, unknown> | undefined;
      if (dist) {
        totalEarnings += (dist.total_revenue_cents as number) || 0;
        totalSold += (dist.total_sales as number) || 0;
        const channels = (dist.channels || []) as Array<{ opted_in: boolean; status: string }>;
        activeChannels += channels.filter((ch) => ch.opted_in && ch.status === 'live').length;
      }
    }

    const summary: RoyaltySummary = {
      total_earnings_cents: totalEarnings,
      pending_payout_cents: totalEarnings,
      last_payout_cents: 0,
      last_payout_date: null,
      total_books_sold: totalSold,
      active_channels: activeChannels,
      currency: 'BRL',
    };

    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/royalties/statements — monthly statements
royaltiesRouter.get('/statements', async (req: AuthenticatedRequest, res) => {
  try {
    // For now, return empty statements — will be populated as sales come in
    const statements: RoyaltyStatement[] = [];
    res.json({ statements });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
