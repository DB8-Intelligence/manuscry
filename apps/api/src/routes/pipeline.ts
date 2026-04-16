import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../services/supabase.js';
import { generateStructured } from '../services/claude.service.js';
import { buildPhase0Prompt } from '../services/prompts/phase0.prompt.js';
import { buildPhase1Prompt } from '../services/prompts/phase1.prompt.js';
import { buildPhase2PromptFiction, buildPhase2PromptNonfiction } from '../services/prompts/phase2.prompt.js';
import { buildPhase3Prompt } from '../services/prompts/phase3.prompt.js';
import type { Phase0Data, Phase1Data, Phase2Data, Phase3Data, AuthorAnswers } from '@manuscry/shared';

export const pipelineRouter = Router();

pipelineRouter.use(requireAuth);

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getOwnedProject(projectId: string, userId: string) {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw Object.assign(new Error('Project not found'), { statusCode: 404 });
  }
  return data;
}

async function savePhaseData(projectId: string, phase: number, data: unknown) {
  const field = `phase_${phase}_data` as const;
  const { error } = await supabaseAdmin
    .from('projects')
    .update({ [field]: data })
    .eq('id', projectId);

  if (error) throw new Error(`Failed to save phase ${phase} data: ${error.message}`);
}

async function completePhase(projectId: string, phaseNumber: number, nextPhase: number, currentCompleted: number[]) {
  const phasesCompleted = [...new Set([...currentCompleted, phaseNumber])];
  const { error } = await supabaseAdmin
    .from('projects')
    .update({
      current_phase: nextPhase,
      phases_completed: phasesCompleted,
    })
    .eq('id', projectId);

  if (error) throw new Error(`Failed to complete phase ${phaseNumber}: ${error.message}`);
}

function requirePhaseCompleted(phasesCompleted: number[], requiredPhase: number, phaseName: string) {
  if (!Array.isArray(phasesCompleted) || !phasesCompleted.includes(requiredPhase)) {
    throw Object.assign(
      new Error(`Complete a Fase ${requiredPhase} (${phaseName}) antes de avançar`),
      { statusCode: 400 },
    );
  }
}

// ── FASE 0 — Market Analyst ──────────────────────────────────────────────────

pipelineRouter.post('/phase0', async (req: AuthenticatedRequest, res) => {
  const { projectId, genre, market } = req.body;

  if (!projectId || !genre) {
    res.status(400).json({ error: 'projectId and genre are required' });
    return;
  }

  const project = await getOwnedProject(projectId, req.userId!);

  try {
    const prompt = buildPhase0Prompt(genre, market || project.market || 'pt-br');
    const result = await generateStructured<Phase0Data>(
      'You are a KDP market analyst. Always respond with valid JSON only.',
      prompt,
      8192,
    );

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

pipelineRouter.post('/phase0/select', async (req: AuthenticatedRequest, res) => {
  const { projectId, themeIndex } = req.body;

  if (!projectId || themeIndex === undefined) {
    res.status(400).json({ error: 'projectId and themeIndex are required' });
    return;
  }

  try {
    const project = await getOwnedProject(projectId, req.userId!);

    const phase0Data = project.phase_0_data as Phase0Data | null;
    if (!phase0Data?.themes?.[themeIndex]) {
      res.status(400).json({ error: 'Invalid theme index or no analysis data' });
      return;
    }

    const selectedTheme = phase0Data.themes[themeIndex];
    const phasesCompleted: number[] = Array.isArray(project.phases_completed)
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
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode || 500).json({ error: e.message });
  }
});

// ── FASE 1 — Theme Selector ─────────────────────────────────────────────────

pipelineRouter.post('/phase1', async (req: AuthenticatedRequest, res) => {
  const { projectId, authorAnswers } = req.body as {
    projectId: string;
    authorAnswers: AuthorAnswers;
  };

  if (!projectId || !authorAnswers) {
    res.status(400).json({ error: 'projectId e authorAnswers obrigatórios' });
    return;
  }

  try {
    const project = await getOwnedProject(projectId, req.userId!);
    const phasesCompleted: number[] = project.phases_completed || [];
    requirePhaseCompleted(phasesCompleted, 0, 'Market Analyst');

    const phase0Data = project.phase_0_data as (Phase0Data & { selected_theme?: Record<string, unknown> }) | null;
    if (!phase0Data?.selected_theme) {
      res.status(400).json({ error: 'Nenhum tema selecionado na Fase 0' });
      return;
    }

    const market = (project.market || 'pt-br') as 'pt-br' | 'en';
    const { system, user } = buildPhase1Prompt(
      phase0Data.selected_theme as unknown as Parameters<typeof buildPhase1Prompt>[0],
      authorAnswers,
      market,
    );
    const result = await generateStructured<Phase1Data>(system, user, 4096);

    await savePhaseData(projectId, 1, result);
    await completePhase(projectId, 1, 2, phasesCompleted);

    res.json(result);
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode || 500).json({ error: e.message });
  }
});

// ── FASE 2 — Concept Builder (Book Bible) ────────────────────────────────────

pipelineRouter.post('/phase2', async (req: AuthenticatedRequest, res) => {
  const { projectId } = req.body as { projectId: string };

  if (!projectId) {
    res.status(400).json({ error: 'projectId obrigatório' });
    return;
  }

  try {
    const project = await getOwnedProject(projectId, req.userId!);
    const phasesCompleted: number[] = project.phases_completed || [];
    requirePhaseCompleted(phasesCompleted, 1, 'Theme Selector');

    const phase1Data = project.phase_1_data as Phase1Data | null;
    if (!phase1Data?.book_profile || !phase1Data?.unique_book_angle) {
      res.status(400).json({ error: 'Dados da Fase 1 incompletos' });
      return;
    }

    const genreMode = (project.genre_mode || 'fiction') as 'fiction' | 'nonfiction';
    const market = (project.market || 'pt-br') as 'pt-br' | 'en';

    const bookProfile = { ...phase1Data.book_profile } as Record<string, unknown>;
    const uba = { ...phase1Data.unique_book_angle } as Record<string, unknown>;

    const { system, user } = genreMode === 'fiction'
      ? buildPhase2PromptFiction(bookProfile, uba, market)
      : buildPhase2PromptNonfiction(bookProfile, uba, market);

    const result = await generateStructured<Phase2Data>(system, user, 8192);

    await savePhaseData(projectId, 2, result);
    await completePhase(projectId, 2, 3, phasesCompleted);

    res.json(result);
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode || 500).json({ error: e.message });
  }
});

// ── FASE 3 — Narrative Architect ─────────────────────────────────────────────

pipelineRouter.post('/phase3', async (req: AuthenticatedRequest, res) => {
  const { projectId } = req.body as { projectId: string };

  if (!projectId) {
    res.status(400).json({ error: 'projectId obrigatório' });
    return;
  }

  try {
    const project = await getOwnedProject(projectId, req.userId!);
    const phasesCompleted: number[] = project.phases_completed || [];
    requirePhaseCompleted(phasesCompleted, 2, 'Concept Builder');

    // Book Bible is ALWAYS part of context from phase 2 onward
    const bookBible = project.phase_2_data as Record<string, unknown> | null;
    if (!bookBible) {
      res.status(400).json({ error: 'Book Bible (Fase 2) não encontrado' });
      return;
    }

    const phase1Data = project.phase_1_data as Phase1Data | null;
    const bookProfile = (phase1Data?.book_profile || {}) as Record<string, unknown>;
    const genreMode = (project.genre_mode || 'fiction') as 'fiction' | 'nonfiction';

    const { system, user } = buildPhase3Prompt(bookBible, bookProfile, genreMode);

    // Full outline can be very large
    const result = await generateStructured<Phase3Data>(system, user, 16384);

    await savePhaseData(projectId, 3, result);
    await completePhase(projectId, 3, 4, phasesCompleted);

    res.json(result);
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode || 500).json({ error: e.message });
  }
});
