import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../services/supabase.js';
import type { WhiteLabelConfig, TenantDashboard, TenantAuthor } from '@manuscry/shared';
import { WHITE_LABEL_DEFAULTS } from '@manuscry/shared';
import crypto from 'crypto';

export const whiteLabelRouter = Router();
whiteLabelRouter.use(requireAuth);

async function getUserProfile(userId: string) {
  const { data } = await supabaseAdmin.from('users').select('plan, author_profile').eq('id', userId).single();
  return { plan: data?.plan, profile: (data?.author_profile || {}) as Record<string, unknown> };
}

async function saveProfile(userId: string, profile: Record<string, unknown>) {
  await supabaseAdmin.from('users').update({ author_profile: profile }).eq('id', userId);
}

function requirePublisher(plan: string | undefined, res: import('express').Response): boolean {
  if (plan !== 'publisher') {
    res.status(403).json({ error: 'White Label disponível apenas no plano Publisher', upgrade_url: '/settings' });
    return false;
  }
  return true;
}

// GET /api/white-label/config — get tenant config
whiteLabelRouter.get('/config', async (req: AuthenticatedRequest, res) => {
  try {
    const { plan, profile } = await getUserProfile(req.userId!);
    if (!requirePublisher(plan, res)) return;

    const wl = (profile.white_label || WHITE_LABEL_DEFAULTS) as WhiteLabelConfig;
    res.json({ config: wl });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// POST /api/white-label/setup — initialize white label
whiteLabelRouter.post('/setup', async (req: AuthenticatedRequest, res) => {
  const { brandName, primaryColor, secondaryColor, tagline, subdomain } = req.body as {
    brandName: string; primaryColor?: string; secondaryColor?: string; tagline?: string; subdomain?: string;
  };

  if (!brandName) { res.status(400).json({ error: 'brandName obrigatório' }); return; }

  try {
    const { plan, profile } = await getUserProfile(req.userId!);
    if (!requirePublisher(plan, res)) return;

    const tenantId = `tenant_${crypto.randomUUID().slice(0, 8)}`;

    const config: WhiteLabelConfig = {
      ...WHITE_LABEL_DEFAULTS,
      enabled: true,
      tenant_id: tenantId,
      brand: {
        name: brandName,
        logo_url: null,
        favicon_url: null,
        primary_color: primaryColor || '#1E3A8A',
        secondary_color: secondaryColor || '#F59E0B',
        tagline: tagline || `${brandName} — Powered by Manuscry`,
      },
      domain: {
        custom_domain: null,
        subdomain: subdomain || brandName.toLowerCase().replace(/\s+/g, '-'),
      },
      features: {
        ...WHITE_LABEL_DEFAULTS.features,
        hide_manuscry_branding: true,
      },
      billing: { ...WHITE_LABEL_DEFAULTS.billing },
    };

    await saveProfile(req.userId!, { ...profile, white_label: config });
    res.status(201).json({ config, message: `White label "${brandName}" configurado` });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// POST /api/white-label/authors/invite — invite author to tenant
whiteLabelRouter.post('/authors/invite', async (req: AuthenticatedRequest, res) => {
  const { email, role } = req.body as { email: string; role?: string };
  if (!email) { res.status(400).json({ error: 'email obrigatório' }); return; }

  try {
    const { plan, profile } = await getUserProfile(req.userId!);
    if (!requirePublisher(plan, res)) return;

    const wl = profile.white_label as WhiteLabelConfig | undefined;
    if (!wl?.enabled) { res.status(400).json({ error: 'Configure White Label primeiro' }); return; }

    const authors = (profile.tenant_authors || []) as TenantAuthor[];
    if (authors.length >= wl.features.max_authors) {
      res.status(400).json({ error: `Limite de ${wl.features.max_authors} autores atingido` });
      return;
    }

    authors.push({
      user_id: '', email, name: null,
      role: (role as 'admin' | 'author') || 'author',
      invited_at: new Date().toISOString(), active: false,
    });

    await saveProfile(req.userId!, { ...profile, tenant_authors: authors });
    res.json({ invited: email, total_authors: authors.length });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// GET /api/white-label/dashboard — tenant overview
whiteLabelRouter.get('/dashboard', async (req: AuthenticatedRequest, res) => {
  try {
    const { plan, profile } = await getUserProfile(req.userId!);
    if (!requirePublisher(plan, res)) return;

    const wl = profile.white_label as WhiteLabelConfig | undefined;
    if (!wl?.enabled) { res.status(400).json({ error: 'White Label não configurado' }); return; }

    const authors = (profile.tenant_authors || []) as TenantAuthor[];

    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('id, status, phase_5_data')
      .eq('user_id', req.userId!);

    const published = (projects || []).filter((p) => p.status === 'published').length;

    const dashboard: TenantDashboard = {
      tenant_id: wl.tenant_id,
      brand_name: wl.brand.name,
      total_authors: authors.length,
      total_books: (projects || []).length,
      total_published: published,
      total_revenue_cents: 0,
      authors,
    };

    res.json(dashboard);
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});
