import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../services/supabase.js';
import { generateStructured } from '../services/claude.service.js';
import { generateMultipleCovers } from '../services/fal.service.js';
import { buildCoverPromptsPrompt, buildBackCoverPrompt } from '../services/prompts/phase5a.prompt.js';
import type {
  Phase1Data, Phase5Data, CoverData, CoverVariation, BackCoverContent, BiographyData,
} from '@manuscry/shared';

export const coversRouter = Router();
coversRouter.use(requireAuth);

const MAX_COVER_GENERATIONS = 3;
const COVERS_PER_GENERATION = 3;

// POST /api/covers/generate — generate 3 cover variations (max 3 rounds)
coversRouter.post('/generate', async (req: AuthenticatedRequest, res) => {
  const { projectId } = req.body as { projectId: string };

  if (!projectId) {
    res.status(400).json({ error: 'projectId obrigatório' });
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

    // Check generation limit
    const existing5 = (project.phase_5_data || {}) as Partial<Phase5Data>;
    const currentCount = existing5.covers?.generation_count || 0;

    if (currentCount >= MAX_COVER_GENERATIONS) {
      res.status(400).json({
        error: `Limite de ${MAX_COVER_GENERATIONS} gerações de capa atingido para este livro.`,
        generation_count: currentCount,
        max_generations: MAX_COVER_GENERATIONS,
      });
      return;
    }

    const bookBible = project.phase_2_data as Record<string, unknown> | null;
    if (!bookBible) {
      res.status(400).json({ error: 'Book Bible não encontrado' });
      return;
    }

    const phase1Data = project.phase_1_data as Phase1Data | null;
    const bookProfile = (phase1Data?.book_profile || {}) as Record<string, unknown>;
    const genre = project.genre || 'Fiction';
    const market = (project.market || 'pt-br') as 'pt-br' | 'en';

    // Claude generates 3 cover prompts
    const { system, user } = buildCoverPromptsPrompt(bookBible, bookProfile, genre, market);
    const coverPlan = await generateStructured<{
      negative_prompt: string;
      covers: Array<Omit<CoverVariation, 'image_url' | 'image_width' | 'image_height' | 'selected'>>;
    }>(system, user, 4096);

    // Limit to 3 covers per generation
    const limitedCovers = coverPlan.covers.slice(0, COVERS_PER_GENERATION);

    // Fal.ai generates images
    const prompts = limitedCovers.map((c) => c.prompt);
    const images = await generateMultipleCovers(prompts, coverPlan.negative_prompt);

    const covers: CoverVariation[] = limitedCovers.map((c, i) => ({
      ...c,
      image_url: images[i]?.url || null,
      image_width: images[i]?.width || null,
      image_height: images[i]?.height || null,
      selected: false,
    }));

    // Generate back cover content
    const bioData = existing5.biography as BiographyData | null;
    const authorBio = bioData?.bios?.back_cover || bioData?.bios?.kdp_full || '';

    const backCoverPrompt = buildBackCoverPrompt(bookBible, authorBio, market);
    const backCover = await generateStructured<BackCoverContent>(
      backCoverPrompt.system, backCoverPrompt.user, 2048,
    );

    const coverData: CoverData = {
      negative_prompt: coverPlan.negative_prompt,
      covers,
      back_cover: backCover,
      generation_count: currentCount + 1,
      max_generations: MAX_COVER_GENERATIONS,
      generated_at: new Date().toISOString(),
    };

    const phase5Data: Phase5Data = {
      covers: coverData,
      biography: existing5.biography || null,
      design: existing5.design || null,
      metadata: existing5.metadata || null,
      audiobook: existing5.audiobook || null,
    };

    await supabaseAdmin
      .from('projects')
      .update({ phase_5_data: phase5Data })
      .eq('id', projectId);

    res.json(coverData);
  } catch (err) {
    console.error('Cover generation error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/covers/select — select a cover variation
coversRouter.post('/select', async (req: AuthenticatedRequest, res) => {
  const { projectId, variationIndex } = req.body as {
    projectId: string;
    variationIndex: number;
  };

  if (!projectId || variationIndex === undefined) {
    res.status(400).json({ error: 'projectId e variationIndex obrigatórios' });
    return;
  }

  try {
    const { data: project, error: fetchErr } = await supabaseAdmin
      .from('projects')
      .select('phase_5_data')
      .eq('id', projectId)
      .eq('user_id', req.userId!)
      .single();

    if (fetchErr || !project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const phase5Data = project.phase_5_data as Phase5Data | null;
    if (!phase5Data?.covers?.covers?.[variationIndex]) {
      res.status(400).json({ error: 'Variação não encontrada' });
      return;
    }

    phase5Data.covers.covers.forEach((c, i) => {
      c.selected = i === variationIndex;
    });

    await supabaseAdmin
      .from('projects')
      .update({ phase_5_data: phase5Data })
      .eq('id', projectId);

    res.json({ selected: variationIndex });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
