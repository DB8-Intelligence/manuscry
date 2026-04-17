import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../services/supabase.js';

export const projectsRouter = Router();

// All project routes require authentication
projectsRouter.use(requireAuth);

// GET /api/projects — list user's projects
projectsRouter.get('/', async (req: AuthenticatedRequest, res) => {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('id, name, market, genre, genre_mode, status, current_phase, phases_completed, created_at, updated_at')
    .eq('user_id', req.userId!)
    .order('updated_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ projects: data });
});

// POST /api/projects — create new project (with plan limit check)
projectsRouter.post('/', async (req: AuthenticatedRequest, res) => {
  const { name, market, genre, genre_mode } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Project name is required' });
    return;
  }

  // Check plan limits
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('plan, books_this_month, books_limit, trial_ends_at')
    .eq('id', req.userId!)
    .single();

  if (profile) {
    if (profile.plan === 'trial' && profile.trial_ends_at && new Date(profile.trial_ends_at) < new Date()) {
      res.status(403).json({
        error: 'Seu período trial expirou. Faça upgrade para continuar.',
        upgrade_url: '/settings',
      });
      return;
    }

    const limit = profile.books_limit ?? 1;
    if (limit > 0 && (profile.books_this_month ?? 0) >= limit) {
      res.status(403).json({
        error: `Limite de ${limit} livro(s)/mês atingido no plano ${profile.plan}. Faça upgrade para mais.`,
        upgrade_url: '/settings',
      });
      return;
    }
  }

  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({
      user_id: req.userId!,
      name,
      market: market || 'pt-br',
      genre: genre || null,
      genre_mode: genre_mode || null,
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  // Increment books_this_month
  if (profile) {
    await supabaseAdmin
      .from('users')
      .update({ books_this_month: (profile.books_this_month ?? 0) + 1 })
      .eq('id', req.userId!);
  }

  res.status(201).json({ project: data });
});

// GET /api/projects/:id — get project with all phase data
projectsRouter.get('/:id', async (req: AuthenticatedRequest, res) => {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .single();

  if (error) {
    res.status(error.code === 'PGRST116' ? 404 : 500).json({ error: error.message });
    return;
  }

  res.json({ project: data });
});

// DELETE /api/projects/:id — archive project (soft delete)
projectsRouter.delete('/:id', async (req: AuthenticatedRequest, res) => {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .update({ status: 'archived' })
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .select('id, status')
    .single();

  if (error) {
    res.status(error.code === 'PGRST116' ? 404 : 500).json({ error: error.message });
    return;
  }

  res.json({ project: data });
});

// PATCH /api/projects/:id — update project
projectsRouter.patch('/:id', async (req: AuthenticatedRequest, res) => {
  const allowedFields = [
    'name', 'market', 'genre', 'genre_mode', 'status',
    'current_phase', 'phases_completed',
    'phase_0_data', 'phase_1_data', 'phase_2_data',
    'phase_3_data', 'phase_4_data', 'phase_5_data',
  ];

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: 'No valid fields to update' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('projects')
    .update(updates)
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ project: data });
});
