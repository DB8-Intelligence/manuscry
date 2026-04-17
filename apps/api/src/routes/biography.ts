import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../services/supabase.js';
import { generateStructured } from '../services/claude.service.js';
import { buildBiographyPrompt } from '../services/prompts/phase5b.prompt.js';
import type { Phase1Data, Phase5Data, BiographyData } from '@manuscry/shared';

export const biographyRouter = Router();
biographyRouter.use(requireAuth);

// POST /api/biography/generate — generate multi-platform author biography
biographyRouter.post('/generate', async (req: AuthenticatedRequest, res) => {
  const { projectId, authorName, authorBackground } = req.body as {
    projectId: string;
    authorName: string;
    authorBackground: string;
  };

  if (!projectId || !authorName) {
    res.status(400).json({ error: 'projectId e authorName obrigatórios' });
    return;
  }

  try {
    const { data: project, error: fetchErr } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', req.userId!)
      .single();

    if (fetchErr || !project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const bookBible = project.phase_2_data as Record<string, unknown> | null;
    if (!bookBible) {
      res.status(400).json({ error: 'Book Bible não encontrado' });
      return;
    }

    const phase1Data = project.phase_1_data as Phase1Data | null;
    const bookProfile = (phase1Data?.book_profile || {}) as Record<string, unknown>;
    const market = (project.market || 'pt-br') as 'pt-br' | 'en';

    const { system, user } = buildBiographyPrompt(
      bookBible, bookProfile, authorName, authorBackground || '', market,
    );

    const result = await generateStructured<Omit<BiographyData, 'generated_at'>>(system, user, 4096);

    const biographyData: BiographyData = {
      ...result,
      generated_at: new Date().toISOString(),
    };

    // Save to phase_5_data
    const existing5 = (project.phase_5_data || {}) as Partial<Phase5Data>;
    const phase5Data: Phase5Data = {
      covers: existing5.covers || null,
      biography: biographyData,
      design: existing5.design || null,
      metadata: existing5.metadata || null,
      audiobook: existing5.audiobook || null,
    };

    await supabaseAdmin
      .from('projects')
      .update({ phase_5_data: phase5Data })
      .eq('id', projectId);

    // Check if both covers and biography are done to complete phase 5
    if (phase5Data.covers?.covers?.some((c) => c.selected) && phase5Data.biography) {
      const phasesCompleted: number[] = project.phases_completed || [];
      if (!phasesCompleted.includes(5)) {
        const updated = [...new Set([...phasesCompleted, 5])];
        await supabaseAdmin
          .from('projects')
          .update({ phases_completed: updated })
          .eq('id', projectId);
      }
    }

    res.json(biographyData);
  } catch (err) {
    console.error('Biography generation error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});
