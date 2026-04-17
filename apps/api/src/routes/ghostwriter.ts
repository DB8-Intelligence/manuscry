import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../services/supabase.js';
import type { GhostwriterProfile, GhostwriterProposal, GhostwriterListing } from '@manuscry/shared';
import { GHOSTWRITER_COMMISSION_PERCENT } from '@manuscry/shared';
import crypto from 'crypto';

export const ghostwriterRouter = Router();

// ── PUBLIC ───────────────────────────────────────────────────────────────────

// GET /api/ghostwriters — list available ghostwriters (public)
ghostwriterRouter.get('/', async (_req, res) => {
  try {
    const { data: users } = await supabaseAdmin.from('users').select('author_profile');

    const listings: GhostwriterListing[] = (users || [])
      .map((u) => {
        const profile = (u.author_profile || {}) as Record<string, unknown>;
        const gw = profile.ghostwriter_profile as GhostwriterProfile | undefined;
        return gw?.status === 'available' ? {
          display_name: gw.display_name,
          bio: gw.bio,
          avatar_url: gw.avatar_url,
          genres: gw.genres,
          price_per_word_cents: gw.price_per_word_cents,
          turnaround_days: gw.turnaround_days,
          rating: gw.rating,
          total_projects: gw.total_projects,
        } : null;
      })
      .filter((g): g is GhostwriterListing => g !== null);

    res.json({ ghostwriters: listings, commission_percent: GHOSTWRITER_COMMISSION_PERCENT });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// ── AUTHENTICATED ────────────────────────────────────────────────────────────

ghostwriterRouter.use(requireAuth);

// POST /api/ghostwriters/register — register as ghostwriter
ghostwriterRouter.post('/register', async (req: AuthenticatedRequest, res) => {
  const { displayName, bio, genres, languages, pricePerWordCents, turnaroundDays, minWords, maxWords } = req.body as {
    displayName: string; bio: string; genres: string[]; languages: string[];
    pricePerWordCents: number; turnaroundDays: number; minWords?: number; maxWords?: number;
  };

  if (!displayName || !bio || !genres?.length) {
    res.status(400).json({ error: 'displayName, bio e genres obrigatórios' }); return;
  }

  try {
    const { data: user } = await supabaseAdmin.from('users').select('author_profile').eq('id', req.userId!).single();
    const profile = (user?.author_profile || {}) as Record<string, unknown>;

    const gwProfile: GhostwriterProfile = {
      user_id: req.userId!,
      display_name: displayName,
      bio,
      avatar_url: null,
      genres,
      languages: languages || ['pt-br'],
      price_per_word_cents: pricePerWordCents || 5,
      min_project_words: minWords || 10000,
      max_project_words: maxWords || 100000,
      turnaround_days: turnaroundDays || 30,
      portfolio_links: [],
      rating: 0,
      total_projects: 0,
      status: 'available',
      created_at: new Date().toISOString(),
    };

    await supabaseAdmin.from('users')
      .update({ author_profile: { ...profile, ghostwriter_profile: gwProfile } })
      .eq('id', req.userId!);

    res.status(201).json({ profile: gwProfile });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// POST /api/ghostwriters/proposal — send proposal to a project
ghostwriterRouter.post('/proposal', async (req: AuthenticatedRequest, res) => {
  const { projectId, authorUserId, message, priceCents, estimatedWords, estimatedDays } = req.body as {
    projectId: string; authorUserId: string; message: string;
    priceCents: number; estimatedWords: number; estimatedDays: number;
  };

  if (!projectId || !message || !priceCents) {
    res.status(400).json({ error: 'projectId, message e priceCents obrigatórios' }); return;
  }

  try {
    const { data: user } = await supabaseAdmin.from('users').select('author_profile').eq('id', req.userId!).single();
    const profile = (user?.author_profile || {}) as Record<string, unknown>;
    const proposals = (profile.ghostwriter_proposals || []) as GhostwriterProposal[];

    const proposal: GhostwriterProposal = {
      id: crypto.randomUUID(),
      ghostwriter_user_id: req.userId!,
      author_user_id: authorUserId,
      project_id: projectId,
      message,
      price_cents: priceCents,
      estimated_words: estimatedWords || 0,
      estimated_days: estimatedDays || 30,
      status: 'pending',
      created_at: new Date().toISOString(),
      accepted_at: null,
      completed_at: null,
    };

    proposals.push(proposal);
    await supabaseAdmin.from('users')
      .update({ author_profile: { ...profile, ghostwriter_proposals: proposals } })
      .eq('id', req.userId!);

    res.status(201).json({ proposal });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// GET /api/ghostwriters/my-proposals — list my proposals
ghostwriterRouter.get('/my-proposals', async (req: AuthenticatedRequest, res) => {
  try {
    const { data: user } = await supabaseAdmin.from('users').select('author_profile').eq('id', req.userId!).single();
    const profile = (user?.author_profile || {}) as Record<string, unknown>;
    const proposals = (profile.ghostwriter_proposals || []) as GhostwriterProposal[];
    res.json({ proposals });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});
