import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { requireApiKey, requireScope, type ApiKeyRequest } from '../middleware/apiKey.js';
import { supabaseAdmin } from '../services/supabase.js';
import { createApiKey, listApiKeys, revokeApiKey } from '../services/apikey.service.js';
import type { ApiKeyScope } from '@manuscry/shared';

export const publicApiRouter = Router();
export const apiKeysManagementRouter = Router();

// ══════════════════════════════════════════════════════════════════════════════
// MANAGEMENT (/api/api-keys) — requires user auth
// ══════════════════════════════════════════════════════════════════════════════

apiKeysManagementRouter.use(requireAuth);

// GET /api/api-keys — list user's API keys
apiKeysManagementRouter.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const keys = await listApiKeys(req.userId!);
    res.json({ keys });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// POST /api/api-keys — create new API key (only shown once)
apiKeysManagementRouter.post('/', async (req: AuthenticatedRequest, res) => {
  const { name, scopes, expires_at } = req.body as {
    name: string; scopes: ApiKeyScope[]; expires_at?: string;
  };

  if (!name) { res.status(400).json({ error: 'name é obrigatório' }); return; }

  try {
    const { data: user } = await supabaseAdmin
      .from('users').select('plan').eq('id', req.userId!).single();

    if (user?.plan !== 'publisher') {
      res.status(403).json({
        error: 'API pública disponível apenas no plano Publisher',
        upgrade_url: '/settings',
      });
      return;
    }

    const key = await createApiKey(
      req.userId!,
      name,
      scopes || ['read:projects'],
      expires_at || null,
    );
    res.status(201).json({
      key,
      warning: 'Salve esta chave agora — ela não será mostrada novamente.',
    });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// DELETE /api/api-keys/:id — revoke API key
apiKeysManagementRouter.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const revoked = await revokeApiKey(req.userId!, req.params.id as string);
    if (!revoked) { res.status(404).json({ error: 'Key não encontrada' }); return; }
    res.json({ revoked: true });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC API (/v1) — requires API key
// ══════════════════════════════════════════════════════════════════════════════

// GET /v1 — API info
publicApiRouter.get('/', (_req, res) => {
  res.json({
    name: 'Manuscry Public API',
    version: '1.0.0',
    docs: 'https://manuscry.ai/developers',
    endpoints: [
      'GET /v1/me',
      'GET /v1/projects',
      'GET /v1/projects/:id',
      'POST /v1/projects',
      'GET /v1/projects/:id/chapters',
      'GET /v1/analytics/sales',
    ],
  });
});

publicApiRouter.use(requireApiKey);

// GET /v1/me — authenticated account info
publicApiRouter.get('/me', async (req: ApiKeyRequest, res) => {
  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, plan, books_this_month, books_limit')
      .eq('id', req.apiKeyUserId!)
      .single();
    res.json({ account: user, scopes: req.apiKeyScopes });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// GET /v1/projects — list projects
publicApiRouter.get('/projects', requireScope('read:projects'), async (req: ApiKeyRequest, res) => {
  try {
    const { data } = await supabaseAdmin
      .from('projects')
      .select('id, name, genre, market, status, current_phase, created_at, updated_at')
      .eq('user_id', req.apiKeyUserId!)
      .order('updated_at', { ascending: false });
    res.json({ projects: data || [], count: data?.length || 0 });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// GET /v1/projects/:id — get project
publicApiRouter.get('/projects/:id', requireScope('read:projects'), async (req: ApiKeyRequest, res) => {
  try {
    const { data } = await supabaseAdmin
      .from('projects').select('*').eq('id', req.params.id).eq('user_id', req.apiKeyUserId!).single();
    if (!data) { res.status(404).json({ error: 'Project not found' }); return; }
    res.json({ project: data });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// POST /v1/projects — create project
publicApiRouter.post('/projects', requireScope('write:projects'), async (req: ApiKeyRequest, res) => {
  const { name, market, genre, genre_mode } = req.body as {
    name: string; market?: string; genre?: string; genre_mode?: string;
  };
  if (!name) { res.status(400).json({ error: 'name obrigatório' }); return; }

  try {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert({
        user_id: req.apiKeyUserId!,
        name,
        market: market || 'pt-br',
        genre: genre || null,
        genre_mode: genre_mode || null,
      })
      .select()
      .single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(201).json({ project: data });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// GET /v1/projects/:id/chapters — list chapters
publicApiRouter.get('/projects/:id/chapters', requireScope('read:books'), async (req: ApiKeyRequest, res) => {
  try {
    const { data: project } = await supabaseAdmin
      .from('projects').select('phase_4_data').eq('id', req.params.id).eq('user_id', req.apiKeyUserId!).single();
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

    const phase4 = project.phase_4_data as { chapters?: Array<Record<string, unknown>> } | null;
    res.json({ chapters: phase4?.chapters || [], count: phase4?.chapters?.length || 0 });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// GET /v1/analytics/sales — sales summary
publicApiRouter.get('/analytics/sales', requireScope('read:analytics'), async (req: ApiKeyRequest, res) => {
  try {
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('id, name, phase_5_data')
      .eq('user_id', req.apiKeyUserId!)
      .eq('status', 'published');

    let totalSales = 0, totalRevenue = 0;
    for (const p of projects || []) {
      const dist = (p.phase_5_data as Record<string, unknown> | null)?.distribution as { total_sales?: number; total_revenue_cents?: number } | undefined;
      totalSales += dist?.total_sales || 0;
      totalRevenue += dist?.total_revenue_cents || 0;
    }

    res.json({
      total_sales: totalSales,
      total_revenue_cents: totalRevenue,
      currency: 'BRL',
      books_published: projects?.length || 0,
    });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});
