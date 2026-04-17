import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../services/supabase.js';
import {
  createCanvaDesign, getCanvaDesign, isCanvaConfigured, buildCanvaEditUrl,
} from '../services/canva.service.js';
import type { CanvaDesignRequest, CanvaDesign, Phase2Data } from '@manuscry/shared';
import { CANVA_DESIGN_TEMPLATES } from '@manuscry/shared';
import crypto from 'crypto';

export const canvaRouter = Router();
canvaRouter.use(requireAuth);

// GET /api/canva/status — check if Canva is configured
canvaRouter.get('/status', (_req: AuthenticatedRequest, res) => {
  res.json({ configured: isCanvaConfigured(), templates: CANVA_DESIGN_TEMPLATES });
});

// POST /api/canva/create — create a Canva design linked to project
canvaRouter.post('/create', async (req: AuthenticatedRequest, res) => {
  const { projectId, type } = req.body as { projectId: string; type: CanvaDesignRequest['type'] };

  if (!projectId || !type) {
    res.status(400).json({ error: 'projectId e type obrigatórios' });
    return;
  }

  try {
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('name, phase_2_data')
      .eq('id', projectId)
      .eq('user_id', req.userId!)
      .single();

    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

    const bible = (project.phase_2_data || {}) as Record<string, string>;
    const bookTitle = bible.title || project.name || 'Meu Livro';
    const template = CANVA_DESIGN_TEMPLATES.find((t) => t.type === type);
    if (!template) { res.status(400).json({ error: 'Tipo de design inválido' }); return; }

    let designData: { design_id: string; edit_url: string; view_url?: string };

    if (isCanvaConfigured()) {
      const result = await createCanvaDesign({
        type,
        title: `${bookTitle} — ${template.label}`,
        dimensions: template.dimensions,
        data: { book_title: bookTitle, tagline: bible.tagline || '' },
      });
      designData = { ...result, view_url: undefined };
    } else {
      const editUrl = buildCanvaEditUrl(type, bookTitle, template.dimensions);
      designData = {
        design_id: `local-${crypto.randomUUID().slice(0, 8)}`,
        edit_url: editUrl,
      };
    }

    const design: CanvaDesign = {
      id: crypto.randomUUID(),
      project_id: projectId,
      type,
      canva_design_id: designData.design_id,
      canva_edit_url: designData.edit_url,
      canva_view_url: designData.view_url || null,
      thumbnail_url: null,
      title: `${bookTitle} — ${template.label}`,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save in user profile
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('author_profile')
      .eq('id', req.userId!)
      .single();

    const profile = (user?.author_profile || {}) as Record<string, unknown>;
    const designs = (profile.canva_designs || []) as CanvaDesign[];
    designs.push(design);
    await supabaseAdmin
      .from('users')
      .update({ author_profile: { ...profile, canva_designs: designs } })
      .eq('id', req.userId!);

    res.status(201).json({ design });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/canva/designs/:projectId — list designs for a project
canvaRouter.get('/designs/:projectId', async (req: AuthenticatedRequest, res) => {
  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('author_profile')
      .eq('id', req.userId!)
      .single();

    const profile = (user?.author_profile || {}) as Record<string, unknown>;
    const allDesigns = (profile.canva_designs || []) as CanvaDesign[];
    const projectDesigns = allDesigns.filter((d) => d.project_id === req.params.projectId);

    res.json({ designs: projectDesigns });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
