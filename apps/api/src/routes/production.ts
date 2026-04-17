import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../services/supabase.js';
import { generateStructured } from '../services/claude.service.js';
import { buildBookDesignPrompt } from '../services/prompts/phase5c.prompt.js';
import { buildKdpMetadataPrompt } from '../services/prompts/phase5e.prompt.js';
import { buildAudiobookAdapterPrompt } from '../services/prompts/phase4c.prompt.js';
import { generateEpub } from '../services/epub.service.js';
import { generatePdf } from '../services/pdf.service.js';
import { runPreflightChecks, type PreflightReport } from '../services/preflight.service.js';
import { publishBookToStore, isShopifyConfigured, type PublishToStoreInput } from '../services/shopify.service.js';
import type {
  Phase1Data, Phase2Data, Phase3Data, Phase4Data, Phase5Data, Project,
  BookDesignData, KdpMetadata,
  AudiobookChapterScript, AudiobookData, BiographyData,
} from '@manuscry/shared';

export const productionRouter = Router();
productionRouter.use(requireAuth);

async function getProject(projectId: string, userId: string) {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();
  if (error || !data) throw Object.assign(new Error('Project not found'), { statusCode: 404 });
  return data;
}

async function savePhase5(projectId: string, phase5Data: Phase5Data) {
  const { error } = await supabaseAdmin
    .from('projects')
    .update({ phase_5_data: phase5Data })
    .eq('id', projectId);
  if (error) throw new Error(`Failed to save: ${error.message}`);
}

// POST /api/production/design — generate book design specs (5c)
productionRouter.post('/design', async (req: AuthenticatedRequest, res) => {
  const { projectId } = req.body as { projectId: string };
  if (!projectId) { res.status(400).json({ error: 'projectId obrigatório' }); return; }

  try {
    const project = await getProject(projectId, req.userId!);
    const bookBible = project.phase_2_data as Record<string, unknown> | null;
    if (!bookBible) { res.status(400).json({ error: 'Book Bible não encontrado' }); return; }

    const phase1Data = project.phase_1_data as Phase1Data | null;
    const bookProfile = (phase1Data?.book_profile || {}) as Record<string, unknown>;
    const phase3Data = project.phase_3_data as Phase3Data | null;
    const phase4Data = project.phase_4_data as Phase4Data | null;

    const totalWords = phase4Data?.total_words_written || phase3Data?.total_words_target || 60000;
    const chapterCount = phase3Data?.total_chapters || 20;
    const genre = project.genre || 'Fiction';
    const market = (project.market || 'pt-br') as 'pt-br' | 'en';

    const { system, user } = buildBookDesignPrompt(
      bookBible, bookProfile, totalWords, chapterCount, genre, market,
    );

    const result = await generateStructured<Omit<BookDesignData, 'generated_at'>>(system, user, 4096);
    const designData: BookDesignData = { ...result, generated_at: new Date().toISOString() };

    const existing5 = (project.phase_5_data || {}) as Partial<Phase5Data>;
    await savePhase5(projectId, {
      covers: existing5.covers || null,
      biography: existing5.biography || null,
      design: designData,
      metadata: existing5.metadata || null,
      audiobook: existing5.audiobook || null,
    });

    res.json(designData);
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode || 500).json({ error: e.message });
  }
});

// POST /api/production/metadata — generate KDP metadata (5e)
productionRouter.post('/metadata', async (req: AuthenticatedRequest, res) => {
  const { projectId } = req.body as { projectId: string };
  if (!projectId) { res.status(400).json({ error: 'projectId obrigatório' }); return; }

  try {
    const project = await getProject(projectId, req.userId!);
    const bookBible = project.phase_2_data as Record<string, unknown> | null;
    if (!bookBible) { res.status(400).json({ error: 'Book Bible não encontrado' }); return; }

    const phase1Data = project.phase_1_data as Phase1Data | null;
    const bookProfile = (phase1Data?.book_profile || {}) as Record<string, unknown>;
    const genre = project.genre || 'Fiction';
    const market = (project.market || 'pt-br') as 'pt-br' | 'en';

    const { system, user } = buildKdpMetadataPrompt(bookBible, bookProfile, genre, market);
    const result = await generateStructured<Omit<KdpMetadata, 'generated_at'>>(system, user, 8192);
    const metadataResult: KdpMetadata = { ...result, generated_at: new Date().toISOString() };

    const existing5 = (project.phase_5_data || {}) as Partial<Phase5Data>;
    await savePhase5(projectId, {
      covers: existing5.covers || null,
      biography: existing5.biography || null,
      design: existing5.design || null,
      metadata: metadataResult,
      audiobook: existing5.audiobook || null,
    });

    res.json(metadataResult);
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode || 500).json({ error: e.message });
  }
});

// POST /api/production/audiobook — adapt a chapter for audiobook narration (4c)
productionRouter.post('/audiobook', async (req: AuthenticatedRequest, res) => {
  const { projectId, chapterNumber } = req.body as {
    projectId: string;
    chapterNumber: number;
  };
  if (!projectId || chapterNumber === undefined) {
    res.status(400).json({ error: 'projectId e chapterNumber obrigatórios' });
    return;
  }

  try {
    const project = await getProject(projectId, req.userId!);
    const bookBible = project.phase_2_data as Record<string, unknown> | null;
    if (!bookBible) { res.status(400).json({ error: 'Book Bible não encontrado' }); return; }

    const phase4Data = project.phase_4_data as Phase4Data | null;
    const chapter = phase4Data?.chapters.find((ch) => ch.number === chapterNumber);
    if (!chapter?.content) {
      res.status(400).json({ error: `Capítulo ${chapterNumber} não encontrado ou sem conteúdo` });
      return;
    }

    const market = (project.market || 'pt-br') as 'pt-br' | 'en';
    const { system, user } = buildAudiobookAdapterPrompt(
      chapter.content, chapterNumber, chapter.title, bookBible, market,
    );

    const result = await generateStructured<AudiobookChapterScript>(system, user, 16384);

    // Save/update in audiobook data
    const existing5 = (project.phase_5_data || {}) as Partial<Phase5Data>;
    const audiobook: AudiobookData = existing5.audiobook || {
      scripts: [],
      total_duration_minutes: 0,
      generated_at: null,
    };

    const existingIdx = audiobook.scripts.findIndex((s) => s.chapter_number === chapterNumber);
    if (existingIdx >= 0) {
      audiobook.scripts[existingIdx] = result;
    } else {
      audiobook.scripts.push(result);
    }
    audiobook.scripts.sort((a, b) => a.chapter_number - b.chapter_number);
    audiobook.total_duration_minutes = audiobook.scripts.reduce(
      (sum, s) => sum + s.estimated_duration_minutes, 0,
    );
    audiobook.generated_at = new Date().toISOString();

    await savePhase5(projectId, {
      covers: existing5.covers || null,
      biography: existing5.biography || null,
      design: existing5.design || null,
      metadata: existing5.metadata || null,
      audiobook,
    });

    res.json(result);
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode || 500).json({ error: e.message });
  }
});

// POST /api/production/audiobook/all — adapt ALL chapters at once
productionRouter.post('/audiobook/all', async (req: AuthenticatedRequest, res) => {
  const { projectId } = req.body as { projectId: string };
  if (!projectId) { res.status(400).json({ error: 'projectId obrigatório' }); return; }

  try {
    const project = await getProject(projectId, req.userId!);
    const bookBible = project.phase_2_data as Record<string, unknown> | null;
    if (!bookBible) { res.status(400).json({ error: 'Book Bible não encontrado' }); return; }

    const phase4Data = project.phase_4_data as Phase4Data | null;
    const writtenChapters = phase4Data?.chapters.filter((ch) => ch.content) || [];
    if (writtenChapters.length === 0) {
      res.status(400).json({ error: 'Nenhum capítulo escrito encontrado' });
      return;
    }

    const market = (project.market || 'pt-br') as 'pt-br' | 'en';
    const scripts: AudiobookChapterScript[] = [];

    // Process sequentially to avoid rate limits
    for (const ch of writtenChapters) {
      const { system, user } = buildAudiobookAdapterPrompt(
        ch.content, ch.number, ch.title, bookBible, market,
      );
      const result = await generateStructured<AudiobookChapterScript>(system, user, 16384);
      scripts.push(result);
    }

    scripts.sort((a, b) => a.chapter_number - b.chapter_number);

    const audiobook: AudiobookData = {
      scripts,
      total_duration_minutes: scripts.reduce((sum, s) => sum + s.estimated_duration_minutes, 0),
      generated_at: new Date().toISOString(),
    };

    const existing5 = (project.phase_5_data || {}) as Partial<Phase5Data>;
    await savePhase5(projectId, {
      covers: existing5.covers || null,
      biography: existing5.biography || null,
      design: existing5.design || null,
      metadata: existing5.metadata || null,
      audiobook,
    });

    res.json(audiobook);
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode || 500).json({ error: e.message });
  }
});

// ── EXPORT — EPUB/PDF generation ───────────���─────────────────────────────────

// POST /api/production/export/epub — generate and download EPUB
productionRouter.post('/export/epub', async (req: AuthenticatedRequest, res) => {
  const { projectId } = req.body as { projectId: string };
  if (!projectId) { res.status(400).json({ error: 'projectId obrigatório' }); return; }

  try {
    const project = await getProject(projectId, req.userId!);
    const phase4Data = project.phase_4_data as Phase4Data | null;
    const writtenChapters = phase4Data?.chapters.filter((ch) => ch.content) || [];
    if (writtenChapters.length === 0) {
      res.status(400).json({ error: 'Nenhum capítulo escrito' });
      return;
    }

    const bookBible = (project.phase_2_data || {}) as Record<string, string>;
    const bioData = (project.phase_5_data as Phase5Data | null)?.biography as BiographyData | null;
    const market = (project.market || 'pt-br') as string;

    const epubBuffer = await generateEpub(writtenChapters, {
      title: bookBible.title || project.name || 'Untitled',
      subtitle: bookBible.subtitle || undefined,
      author: bioData?.author_name || 'Author',
      language: market === 'pt-br' ? 'pt-BR' : 'en',
      description: bookBible.synopsis || '',
    });

    const filename = `${(bookBible.title || project.name || 'book').replace(/[^a-zA-Z0-9]/g, '_')}.epub`;

    res.setHeader('Content-Type', 'application/epub+zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', epubBuffer.length);
    res.send(epubBuffer);
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode || 500).json({ error: e.message });
  }
});

// POST /api/production/export/pdf — generate and download PDF
productionRouter.post('/export/pdf', async (req: AuthenticatedRequest, res) => {
  const { projectId } = req.body as { projectId: string };
  if (!projectId) { res.status(400).json({ error: 'projectId obrigatório' }); return; }

  try {
    const project = await getProject(projectId, req.userId!);
    const phase4Data = project.phase_4_data as Phase4Data | null;
    const writtenChapters = phase4Data?.chapters.filter((ch) => ch.content) || [];
    if (writtenChapters.length === 0) {
      res.status(400).json({ error: 'Nenhum capítulo escrito' });
      return;
    }

    const bookBible = (project.phase_2_data || {}) as Phase2Data & Record<string, string>;
    const phase5Data = project.phase_5_data as Phase5Data | null;
    const bioData = phase5Data?.biography as BiographyData | null;

    const pdfBuffer = await generatePdf(writtenChapters, {
      title: bookBible.title || project.name || 'Untitled',
      subtitle: bookBible.subtitle || undefined,
      author: bioData?.author_name || 'Author',
      design: phase5Data?.design || null,
    });

    const filename = `${(bookBible.title || project.name || 'book').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode || 500).json({ error: e.message });
  }
});

// ── PREFLIGHT VALIDATOR ──────────────────────────────────────────────────────

// POST /api/production/preflight — run all compliance checks before export
productionRouter.post('/preflight', async (req: AuthenticatedRequest, res) => {
  const { projectId } = req.body as { projectId: string };
  if (!projectId) { res.status(400).json({ error: 'projectId obrigatório' }); return; }

  try {
    const project = await getProject(projectId, req.userId!);
    const report = runPreflightChecks(project as unknown as Project);
    res.json(report);
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode || 500).json({ error: e.message });
  }
});

// ── SHOPIFY STORE INTEGRATION ────────────────────────────────────────────────

// GET /api/production/store/status — check if Shopify is configured
productionRouter.get('/store/status', requireAuth, async (_req: AuthenticatedRequest, res) => {
  res.json({ configured: isShopifyConfigured() });
});

// POST /api/production/store/publish — publish book as Shopify product
productionRouter.post('/store/publish', async (req: AuthenticatedRequest, res) => {
  const { projectId, priceUsd } = req.body as { projectId: string; priceUsd?: string };
  if (!projectId) { res.status(400).json({ error: 'projectId obrigatório' }); return; }

  if (!isShopifyConfigured()) {
    res.status(503).json({ error: 'Shopify não configurado. Configure SHOPIFY_STORE_URL e SHOPIFY_ACCESS_TOKEN.' });
    return;
  }

  try {
    const project = await getProject(projectId, req.userId!);

    const bookBible = (project.phase_2_data || {}) as Record<string, string>;
    const phase1Data = project.phase_1_data as Phase1Data | null;
    const phase4Data = project.phase_4_data as Phase4Data | null;
    const phase5Data = project.phase_5_data as Phase5Data | null;
    const metadata = phase5Data?.metadata;
    const biography = phase5Data?.biography;
    const covers = phase5Data?.covers;
    const selectedCover = covers?.covers?.find((c) => c.selected);
    const design = phase5Data?.design;

    const input: PublishToStoreInput = {
      title: bookBible.title || project.name || 'Untitled',
      subtitle: bookBible.subtitle || undefined,
      description_html: (metadata?.description_html as string) || bookBible.synopsis || '',
      author_name: biography?.author_name || 'Author',
      genre: project.genre || 'General',
      cover_image_url: selectedCover?.image_url || null,
      price_usd: priceUsd || phase1Data?.book_profile?.price_range_usd?.split('-')[0]?.replace('$', '').trim() || '9.99',
      price_brl: phase1Data?.book_profile?.price_range_brl?.split('-')[0]?.replace('R$', '').trim() || '29.90',
      isbn: project.isbn_ebook || undefined,
      page_count: design?.interior?.estimated_page_count || undefined,
      word_count: phase4Data?.total_words_written || undefined,
      tags: (metadata?.keywords?.primary as string[]) || [],
      manuscry_project_id: projectId,
    };

    const result = await publishBookToStore(input);

    // Save store info back to project
    await supabaseAdmin
      .from('projects')
      .update({
        status: 'published',
        phase_5_data: {
          ...phase5Data,
          store: {
            shopify_product_id: result.shopify_product_id,
            shopify_handle: result.shopify_handle,
            store_url: result.store_url,
            published_at: new Date().toISOString(),
          },
        },
      })
      .eq('id', projectId);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
