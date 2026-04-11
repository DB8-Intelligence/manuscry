import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../services/supabase.js';
import { generateStructured } from '../services/claude.service.js';
import { buildPhase0Prompt } from '../services/prompts/phase0.prompt.js';
import type { Phase0Data } from '@manuscry/shared';

export const pipelineRouter = Router();

pipelineRouter.use(requireAuth);

// POST /api/pipeline/phase0 — run market analysis
pipelineRouter.post('/phase0', async (req: AuthenticatedRequest, res) => {
  const { projectId, genre, market } = req.body;

  if (!projectId || !genre) {
    res.status(400).json({ error: 'projectId and genre are required' });
    return;
  }

  // Verify project belongs to user
  const { data: project, error: fetchError } = await supabaseAdmin
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .eq('user_id', req.userId!)
    .single();

  if (fetchError || !project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  try {
    const prompt = buildPhase0Prompt(genre, market || 'pt-br');
    const result = await generateStructured<Phase0Data>(
      'You are a KDP market analyst. Always respond with valid JSON only.',
      prompt,
      8192,
    );

    // Save to project
    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({
        phase_0_data: result,
        genre,
        genre_mode: req.body.genre_mode || null,
      })
      .eq('id', projectId);

    if (updateError) {
      res.status(500).json({ error: 'Failed to save analysis' });
      return;
    }

    res.json(result);
  } catch (err) {
    console.error('Phase 0 generation error:', err);
    res.status(500).json({ error: 'Failed to generate market analysis' });
  }
});

// POST /api/pipeline/phase0/select — select a theme and advance
pipelineRouter.post('/phase0/select', async (req: AuthenticatedRequest, res) => {
  const { projectId, themeIndex } = req.body;

  if (!projectId || themeIndex === undefined) {
    res.status(400).json({ error: 'projectId and themeIndex are required' });
    return;
  }

  const { data: project, error: fetchError } = await supabaseAdmin
    .from('projects')
    .select('id, phase_0_data, phases_completed')
    .eq('id', projectId)
    .eq('user_id', req.userId!)
    .single();

  if (fetchError || !project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const phase0Data = project.phase_0_data as Phase0Data | null;
  if (!phase0Data?.themes?.[themeIndex]) {
    res.status(400).json({ error: 'Invalid theme index or no analysis data' });
    return;
  }

  const selectedTheme = phase0Data.themes[themeIndex];
  const phasesCompleted = Array.isArray(project.phases_completed)
    ? [...new Set([...project.phases_completed, 0])]
    : [0];

  const { error: updateError } = await supabaseAdmin
    .from('projects')
    .update({
      phase_0_data: { ...phase0Data, selected_theme: selectedTheme },
      current_phase: 1,
      phases_completed: phasesCompleted,
    })
    .eq('id', projectId);

  if (updateError) {
    res.status(500).json({ error: 'Failed to save selection' });
    return;
  }

  res.json({ selected_theme: selectedTheme, current_phase: 1 });
});
