import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../services/supabase.js';
import { generateStructured, streamChapter } from '../services/claude.service.js';
import { buildPhase0Prompt } from '../services/prompts/phase0.prompt.js';
import { buildPhase1Prompt } from '../services/prompts/phase1.prompt.js';
import { buildPhase2PromptFiction, buildPhase2PromptNonfiction } from '../services/prompts/phase2.prompt.js';
import { buildPhase3Prompt } from '../services/prompts/phase3.prompt.js';
import { buildChapterWriterPrompt, buildHumanizerPrompt } from '../services/prompts/phase4.prompt.js';
import type {
  Phase0Data, Phase1Data, Phase2Data, Phase3Data, Phase4Data,
  AuthorAnswers, WrittenChapter, ChapterOutline, ManuscriptStatus,
} from '@manuscry/shared';

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

// ── FASE 4 — Writing Engine (SSE) ────────────────────────────────────────────

function getPhase4Data(project: Record<string, unknown>): Phase4Data {
  const existing = project.phase_4_data as Phase4Data | null;
  if (existing?.chapters) return existing;
  return { chapters: [], total_words_written: 0, manuscript_status: 'draft' };
}

// POST /api/pipeline/phase4/write — stream-write a single chapter via SSE
pipelineRouter.post('/phase4/write', async (req: AuthenticatedRequest, res) => {
  const { projectId, chapterNumber } = req.body as {
    projectId: string;
    chapterNumber: number;
  };

  if (!projectId || chapterNumber === undefined) {
    res.status(400).json({ error: 'projectId e chapterNumber obrigatórios' });
    return;
  }

  try {
    const project = await getOwnedProject(projectId, req.userId!);
    const phasesCompleted: number[] = project.phases_completed || [];
    requirePhaseCompleted(phasesCompleted, 3, 'Narrative Architect');

    const bookBible = project.phase_2_data as Record<string, unknown> | null;
    if (!bookBible) {
      res.status(400).json({ error: 'Book Bible (Fase 2) não encontrado' });
      return;
    }

    const phase3Data = project.phase_3_data as Phase3Data | null;
    if (!phase3Data?.chapters) {
      res.status(400).json({ error: 'Roteiro (Fase 3) não encontrado' });
      return;
    }

    const chapterOutline = phase3Data.chapters.find(
      (ch: ChapterOutline) => ch.number === chapterNumber,
    );
    if (!chapterOutline) {
      res.status(400).json({ error: `Capítulo ${chapterNumber} não encontrado no roteiro` });
      return;
    }

    // Get the 2 previous written chapters for continuity
    const phase4Data = getPhase4Data(project as Record<string, unknown>);
    const previousChapters = phase4Data.chapters
      .filter((ch: WrittenChapter) => ch.number < chapterNumber && ch.status !== 'pending')
      .sort((a: WrittenChapter, b: WrittenChapter) => b.number - a.number)
      .slice(0, 2)
      .reverse()
      .map((ch: WrittenChapter) => ({ number: ch.number, title: ch.title, content: ch.content }));

    const market = (project.market || 'pt-br') as 'pt-br' | 'en';
    const { system, user } = buildChapterWriterPrompt(
      bookBible, chapterOutline, previousChapters, market,
    );

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    let fullContent = '';

    await streamChapter(system, user,
      (text: string) => {
        fullContent += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      },
      async () => {
        const wordCount = fullContent.split(/\s+/).filter(Boolean).length;
        const written: WrittenChapter = {
          number: chapterNumber,
          title: chapterOutline.title,
          content: fullContent,
          word_count: wordCount,
          status: 'completed',
          written_at: new Date().toISOString(),
          humanized_at: null,
        };

        const existingIdx = phase4Data.chapters.findIndex(
          (ch: WrittenChapter) => ch.number === chapterNumber,
        );
        if (existingIdx >= 0) {
          phase4Data.chapters[existingIdx] = written;
        } else {
          phase4Data.chapters.push(written);
        }
        phase4Data.total_words_written = phase4Data.chapters
          .filter((ch: WrittenChapter) => ch.status !== 'pending')
          .reduce((sum: number, ch: WrittenChapter) => sum + ch.word_count, 0);

        await savePhaseData(projectId, 4, phase4Data);

        const totalChapters = phase3Data!.chapters.length;
        const writtenCount = phase4Data.chapters.filter(
          (ch: WrittenChapter) => ch.status === 'completed' || ch.status === 'humanized',
        ).length;
        if (writtenCount >= totalChapters) {
          await completePhase(projectId, 4, 5, phasesCompleted);
        }

        res.write(`data: ${JSON.stringify({ done: true, total_words: wordCount })}\n\n`);
        res.end();
      },
    );
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    if (!res.headersSent) {
      res.status(e.statusCode || 500).json({ error: e.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
      res.end();
    }
  }
});

// POST /api/pipeline/phase4/save — manually save edited chapter content
pipelineRouter.post('/phase4/save', async (req: AuthenticatedRequest, res) => {
  const { projectId, chapterNumber, content } = req.body as {
    projectId: string;
    chapterNumber: number;
    content: string;
  };

  if (!projectId || chapterNumber === undefined || content === undefined) {
    res.status(400).json({ error: 'projectId, chapterNumber e content obrigatórios' });
    return;
  }

  try {
    const project = await getOwnedProject(projectId, req.userId!);
    const phase4Data = project.phase_4_data as Phase4Data | null;
    if (!phase4Data?.chapters) {
      res.status(400).json({ error: 'Nenhum dado de escrita encontrado' });
      return;
    }

    const chapterIdx = phase4Data.chapters.findIndex(
      (ch: WrittenChapter) => ch.number === chapterNumber,
    );
    if (chapterIdx < 0) {
      res.status(404).json({ error: `Capítulo ${chapterNumber} não encontrado` });
      return;
    }

    const wordCount = content.split(/\s+/).filter(Boolean).length;

    phase4Data.chapters[chapterIdx] = {
      ...phase4Data.chapters[chapterIdx],
      content,
      word_count: wordCount,
    };

    phase4Data.total_words_written = phase4Data.chapters
      .filter((ch: WrittenChapter) => ch.status !== 'pending')
      .reduce((sum: number, ch: WrittenChapter) => sum + ch.word_count, 0);

    await savePhaseData(projectId, 4, phase4Data);

    res.json({
      chapter_number: chapterNumber,
      word_count: wordCount,
      total_words_written: phase4Data.total_words_written,
    });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode || 500).json({ error: e.message });
  }
});

// POST /api/pipeline/phase4/humanize — humanize a written chapter via SSE
pipelineRouter.post('/phase4/humanize', async (req: AuthenticatedRequest, res) => {
  const { projectId, chapterNumber } = req.body as {
    projectId: string;
    chapterNumber: number;
  };

  if (!projectId || chapterNumber === undefined) {
    res.status(400).json({ error: 'projectId e chapterNumber obrigatórios' });
    return;
  }

  try {
    const project = await getOwnedProject(projectId, req.userId!);
    const bookBible = project.phase_2_data as Record<string, unknown> | null;
    if (!bookBible) {
      res.status(400).json({ error: 'Book Bible não encontrado' });
      return;
    }

    const phase4Data = getPhase4Data(project as Record<string, unknown>);
    const chapter = phase4Data.chapters.find((ch: WrittenChapter) => ch.number === chapterNumber);
    if (!chapter?.content) {
      res.status(400).json({ error: 'Capítulo não encontrado ou sem conteúdo' });
      return;
    }

    const market = (project.market || 'pt-br') as 'pt-br' | 'en';
    const { system, user } = buildHumanizerPrompt(chapter.content, bookBible, market);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    let humanizedContent = '';

    await streamChapter(system, user,
      (text: string) => {
        humanizedContent += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      },
      async () => {
        const wordCount = humanizedContent.split(/\s+/).filter(Boolean).length;
        chapter.content = humanizedContent;
        chapter.word_count = wordCount;
        chapter.status = 'humanized';
        chapter.humanized_at = new Date().toISOString();

        phase4Data.total_words_written = phase4Data.chapters
          .filter((ch: WrittenChapter) => ch.status !== 'pending')
          .reduce((sum: number, ch: WrittenChapter) => sum + ch.word_count, 0);
        await savePhaseData(projectId, 4, phase4Data);

        res.write(`data: ${JSON.stringify({ done: true, total_words: wordCount })}\n\n`);
        res.end();
      },
    );
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    if (!res.headersSent) {
      res.status(e.statusCode || 500).json({ error: e.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
      res.end();
    }
  }
});

// POST /api/pipeline/phase4/publish — submit manuscript for agent review
pipelineRouter.post('/phase4/publish', async (req: AuthenticatedRequest, res) => {
  const { projectId } = req.body as { projectId: string };

  if (!projectId) {
    res.status(400).json({ error: 'projectId obrigatório' });
    return;
  }

  try {
    const project = await getOwnedProject(projectId, req.userId!);
    const phase4Data = project.phase_4_data as Phase4Data | null;
    if (!phase4Data?.chapters?.length) {
      res.status(400).json({ error: 'Nenhum capítulo encontrado' });
      return;
    }

    const writtenChapters = phase4Data.chapters.filter(
      (ch: WrittenChapter) => ch.content && ch.content.trim().length > 0,
    );
    if (writtenChapters.length === 0) {
      res.status(400).json({ error: 'Nenhum capítulo com conteúdo' });
      return;
    }

    // Update manuscript status to review
    const updatedPhase4: Phase4Data = {
      ...phase4Data,
      manuscript_status: 'review' as ManuscriptStatus,
    };

    await savePhaseData(projectId, 4, updatedPhase4);

    res.json({
      status: 'review',
      chapters_submitted: writtenChapters.length,
      total_words: updatedPhase4.total_words_written,
      message: 'Manuscrito enviado para revisão dos agentes. O processo de finalização será iniciado.',
    });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode || 500).json({ error: e.message });
  }
});
