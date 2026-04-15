import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../services/supabase.js';
import { generateStructured, streamChapter } from '../services/claude.service.js';
import { buildPhase0Prompt } from '../services/prompts/phase0.prompt.js';
import { buildPhase1Prompt } from '../services/prompts/phase1.prompt.js';
import { buildPhase2Prompt } from '../services/prompts/phase2.prompt.js';
import { buildPhase3Prompt } from '../services/prompts/phase3.prompt.js';
import { buildPhase4ChapterPrompt } from '../services/prompts/phase4.prompt.js';
import type {
  Phase0Data,
  Phase1Data,
  Phase2Data,
  Phase3Data,
  Phase4Data,
  Phase4Chapter,
} from '@manuscry/shared';

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function stripTitleLine(text: string): string {
  return text.replace(/^#\s+.+\n+/, '');
}

function mergePhase4Chapter(
  existing: Phase4Data | null,
  chapter: Phase4Chapter,
  totalChapters: number,
): Phase4Data {
  const chapters = existing?.chapters?.length
    ? [...existing.chapters]
    : Array.from({ length: totalChapters }, (_, i) => ({
        chapter: i + 1,
        title: '',
        content: '',
        word_count: 0,
        status: 'pending' as const,
        updated_at: '',
      }));
  chapters[chapter.chapter - 1] = chapter;
  const total_words = chapters.reduce((acc, c) => acc + (c.word_count || 0), 0);
  return { chapters, total_words };
}

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

// POST /api/pipeline/phase1 — define theme positioning and UVP
pipelineRouter.post('/phase1', async (req: AuthenticatedRequest, res) => {
  const { projectId } = req.body;

  if (!projectId) {
    res.status(400).json({ error: 'projectId is required' });
    return;
  }

  const { data: project, error: fetchError } = await supabaseAdmin
    .from('projects')
    .select('id, market, phase_0_data, phases_completed')
    .eq('id', projectId)
    .eq('user_id', req.userId!)
    .single();

  if (fetchError || !project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const phase0Data = project.phase_0_data as Phase0Data | null;
  const selectedTheme = phase0Data?.selected_theme;
  if (!selectedTheme) {
    res.status(400).json({ error: 'Select a Phase 0 theme before Phase 1' });
    return;
  }

  try {
    const prompt = buildPhase1Prompt(selectedTheme, (project.market || 'pt-br') as 'pt-br' | 'en');
    const result = await generateStructured<Phase1Data>(
      'You are a publishing strategist. Respond with valid JSON only.',
      prompt,
      4096,
    );

    const phasesCompleted = Array.isArray(project.phases_completed)
      ? [...new Set([...project.phases_completed, 1])]
      : [1];

    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({
        phase_1_data: result,
        current_phase: 2,
        phases_completed: phasesCompleted,
      })
      .eq('id', projectId);

    if (updateError) {
      res.status(500).json({ error: 'Failed to save phase 1 data' });
      return;
    }

    res.json(result);
  } catch (err) {
    console.error('Phase 1 generation error:', err);
    res.status(500).json({ error: 'Failed to generate phase 1 data' });
  }
});

// POST /api/pipeline/phase2 — build Book Bible
pipelineRouter.post('/phase2', async (req: AuthenticatedRequest, res) => {
  const { projectId } = req.body;

  if (!projectId) {
    res.status(400).json({ error: 'projectId is required' });
    return;
  }

  const { data: project, error: fetchError } = await supabaseAdmin
    .from('projects')
    .select('id, market, phase_0_data, phase_1_data, phases_completed')
    .eq('id', projectId)
    .eq('user_id', req.userId!)
    .single();

  if (fetchError || !project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const phase0Data = project.phase_0_data as Phase0Data | null;
  const selectedTheme = phase0Data?.selected_theme;
  const phase1Data = project.phase_1_data as Phase1Data | null;

  if (!selectedTheme || !phase1Data) {
    res.status(400).json({ error: 'Complete phases 0 and 1 before Phase 2' });
    return;
  }

  try {
    const prompt = buildPhase2Prompt(
      selectedTheme,
      phase1Data,
      (project.market || 'pt-br') as 'pt-br' | 'en',
    );

    const result = await generateStructured<Phase2Data>(
      'You are a senior book concept architect. Respond with valid JSON only.',
      prompt,
      6144,
    );

    const phasesCompleted = Array.isArray(project.phases_completed)
      ? [...new Set([...project.phases_completed, 2])]
      : [2];

    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({
        phase_2_data: result,
        current_phase: 3,
        phases_completed: phasesCompleted,
      })
      .eq('id', projectId);

    if (updateError) {
      res.status(500).json({ error: 'Failed to save phase 2 data' });
      return;
    }

    res.json(result);
  } catch (err) {
    console.error('Phase 2 generation error:', err);
    res.status(500).json({ error: 'Failed to generate phase 2 data' });
  }
});

// POST /api/pipeline/phase3 — build chapter-by-chapter narrative plan
pipelineRouter.post('/phase3', async (req: AuthenticatedRequest, res) => {
  const { projectId } = req.body;

  if (!projectId) {
    res.status(400).json({ error: 'projectId is required' });
    return;
  }

  const { data: project, error: fetchError } = await supabaseAdmin
    .from('projects')
    .select('id, market, phase_0_data, phase_1_data, phase_2_data, phases_completed')
    .eq('id', projectId)
    .eq('user_id', req.userId!)
    .single();

  if (fetchError || !project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const phase0Data = project.phase_0_data as Phase0Data | null;
  const selectedTheme = phase0Data?.selected_theme;
  const phase1Data = project.phase_1_data as Phase1Data | null;
  const phase2Data = project.phase_2_data as Phase2Data | null;

  if (!selectedTheme || !phase1Data || !phase2Data) {
    res.status(400).json({ error: 'Complete phases 0, 1 and 2 before Phase 3' });
    return;
  }

  try {
    const prompt = buildPhase3Prompt(
      selectedTheme,
      phase1Data,
      phase2Data,
      (project.market || 'pt-br') as 'pt-br' | 'en',
    );

    const result = await generateStructured<Phase3Data>(
      'You are a narrative architect. Respond with valid JSON only.',
      prompt,
      6144,
    );

    const phasesCompleted = Array.isArray(project.phases_completed)
      ? [...new Set([...project.phases_completed, 3])]
      : [3];

    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({
        phase_3_data: result,
        current_phase: 4,
        phases_completed: phasesCompleted,
      })
      .eq('id', projectId);

    if (updateError) {
      res.status(500).json({ error: 'Failed to save phase 3 data' });
      return;
    }

    res.json(result);
  } catch (err) {
    console.error('Phase 3 generation error:', err);
    res.status(500).json({ error: 'Failed to generate phase 3 data' });
  }
});

// POST /api/pipeline/phase4/chapter — stream chapter writing via SSE
pipelineRouter.post('/phase4/chapter', async (req: AuthenticatedRequest, res) => {
  const { projectId, chapterNum } = req.body as {
    projectId?: string;
    chapterNum?: number;
  };

  if (!projectId || !chapterNum) {
    res.status(400).json({ error: 'projectId and chapterNum are required' });
    return;
  }

  const { data: project, error: fetchError } = await supabaseAdmin
    .from('projects')
    .select(
      'id, market, phase_0_data, phase_2_data, phase_3_data, phase_4_data, phases_completed',
    )
    .eq('id', projectId)
    .eq('user_id', req.userId!)
    .single();

  if (fetchError || !project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const phase0Data = project.phase_0_data as Phase0Data | null;
  const phase2Data = project.phase_2_data as Phase2Data | null;
  const phase3Data = project.phase_3_data as Phase3Data | null;
  const phase4Data = project.phase_4_data as Phase4Data | null;
  const selectedTheme = phase0Data?.selected_theme;

  if (!selectedTheme || !phase2Data || !phase3Data) {
    res.status(400).json({ error: 'Complete phases 0, 2 and 3 before Phase 4' });
    return;
  }

  const chapterPlan = phase3Data.chapter_plan.find((c) => c.chapter === chapterNum);
  if (!chapterPlan) {
    res.status(400).json({ error: `Chapter ${chapterNum} not in narrative plan` });
    return;
  }

  const previousChapter =
    chapterNum > 1
      ? phase4Data?.chapters?.find((c) => c.chapter === chapterNum - 1 && c.content)
      : undefined;

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const send = (event: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  let fullText = '';

  try {
    const { system, user } = buildPhase4ChapterPrompt({
      theme: selectedTheme,
      phase2: phase2Data,
      phase3: phase3Data,
      chapterPlan,
      previousChapter: previousChapter || undefined,
      market: (project.market || 'pt-br') as 'pt-br' | 'en',
    });

    send({ type: 'start', chapter: chapterNum, title: chapterPlan.title });

    await streamChapter(
      system,
      user,
      (chunk) => {
        fullText += chunk;
        send({ type: 'chunk', text: chunk });
      },
      () => {
        /* onDone handled below */
      },
    );

    const content = stripTitleLine(fullText).trim();
    const chapterRecord: Phase4Chapter = {
      chapter: chapterNum,
      title: chapterPlan.title,
      content,
      word_count: countWords(content),
      status: 'done',
      updated_at: new Date().toISOString(),
    };

    const nextPhase4 = mergePhase4Chapter(
      phase4Data,
      chapterRecord,
      phase3Data.chapter_plan.length,
    );

    const allDone = nextPhase4.chapters.every((c) => c.status === 'done');
    const phasesCompleted = allDone
      ? [...new Set([...(project.phases_completed || []), 4])]
      : project.phases_completed || [];

    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({
        phase_4_data: nextPhase4,
        phases_completed: phasesCompleted,
        ...(allDone ? { current_phase: 5 } : {}),
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('Phase 4 save error:', updateError);
      send({ type: 'error', error: 'Failed to save chapter' });
    } else {
      send({ type: 'done', chapter: chapterRecord, total_words: nextPhase4.total_words });
    }
  } catch (err) {
    console.error('Phase 4 streaming error:', err);
    send({
      type: 'error',
      error: err instanceof Error ? err.message : 'Streaming failed',
    });
  } finally {
    res.end();
  }
});

// PATCH /api/pipeline/phase4/chapter — save manual edits
pipelineRouter.patch('/phase4/chapter', async (req: AuthenticatedRequest, res) => {
  const { projectId, chapterNum, content, title } = req.body as {
    projectId?: string;
    chapterNum?: number;
    content?: string;
    title?: string;
  };

  if (!projectId || !chapterNum || typeof content !== 'string') {
    res.status(400).json({ error: 'projectId, chapterNum and content are required' });
    return;
  }

  const { data: project, error: fetchError } = await supabaseAdmin
    .from('projects')
    .select('id, phase_3_data, phase_4_data, phases_completed')
    .eq('id', projectId)
    .eq('user_id', req.userId!)
    .single();

  if (fetchError || !project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const phase3Data = project.phase_3_data as Phase3Data | null;
  if (!phase3Data) {
    res.status(400).json({ error: 'Phase 3 not complete' });
    return;
  }

  const chapterPlan = phase3Data.chapter_plan.find((c) => c.chapter === chapterNum);
  if (!chapterPlan) {
    res.status(400).json({ error: `Chapter ${chapterNum} not in narrative plan` });
    return;
  }

  const chapterRecord: Phase4Chapter = {
    chapter: chapterNum,
    title: title || chapterPlan.title,
    content,
    word_count: countWords(content),
    status: 'draft',
    updated_at: new Date().toISOString(),
  };

  const nextPhase4 = mergePhase4Chapter(
    project.phase_4_data as Phase4Data | null,
    chapterRecord,
    phase3Data.chapter_plan.length,
  );

  const { error: updateError } = await supabaseAdmin
    .from('projects')
    .update({ phase_4_data: nextPhase4 })
    .eq('id', projectId);

  if (updateError) {
    res.status(500).json({ error: 'Failed to save chapter' });
    return;
  }

  res.json({ chapter: chapterRecord, total_words: nextPhase4.total_words });
});
