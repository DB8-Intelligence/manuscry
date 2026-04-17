import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../services/supabase.js';
import { generateStructured, streamChapter } from '../services/claude.service.js';
import {
  GENRE_TEMPLATES,
  type BookPreviewData, type TranslationJob, type AffiliateInfo,
  TRANSLATION_PRICE_BRL_CENTS, AFFILIATE_COMMISSION_PERCENT,
} from '@manuscry/shared';
import type { Phase2Data, Phase4Data, Phase5Data, BiographyData, WrittenChapter } from '@manuscry/shared';
import crypto from 'crypto';

export const featuresRouter = Router();

// ══════════════════════════════════════════════════════════════════════════════
// 1. GENRE TEMPLATES
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/features/templates — list all genre templates
featuresRouter.get('/templates', (_req, res) => {
  res.json({ templates: GENRE_TEMPLATES });
});

// GET /api/features/templates/:id — get a specific template
featuresRouter.get('/templates/:id', (req, res) => {
  const template = GENRE_TEMPLATES.find((t) => t.id === req.params.id);
  if (!template) { res.status(404).json({ error: 'Template not found' }); return; }
  res.json({ template });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. BOOK PREVIEW (public)
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/features/preview/:projectId — public preview of first 3 chapters
featuresRouter.get('/preview/:projectId', async (req, res) => {
  try {
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('id, name, genre, phase_2_data, phase_4_data, phase_5_data')
      .eq('id', req.params.projectId)
      .eq('status', 'published')
      .single();

    if (!project) { res.status(404).json({ error: 'Book not found' }); return; }

    const bible = (project.phase_2_data || {}) as Record<string, string>;
    const p4 = project.phase_4_data as Phase4Data | null;
    const p5 = project.phase_5_data as unknown as Phase5Data | null;
    const bio = p5?.biography as BiographyData | null;
    const selectedCover = p5?.covers?.covers?.find((c) => c.selected);

    const chapters = (p4?.chapters || [])
      .filter((ch: WrittenChapter) => ch.content)
      .sort((a: WrittenChapter, b: WrittenChapter) => a.number - b.number)
      .slice(0, 3)
      .map((ch: WrittenChapter) => ({
        number: ch.number,
        title: ch.title,
        excerpt: ch.content.slice(0, 2000) + (ch.content.length > 2000 ? '...' : ''),
      }));

    const preview: BookPreviewData = {
      project_id: project.id,
      title: bible.title || project.name,
      author_name: bio?.author_name || 'Autor',
      cover_url: selectedCover?.image_url || null,
      preview_chapters: chapters,
      total_chapters: p4?.chapters?.length || 0,
      total_words: p4?.total_words_written || 0,
      genre: project.genre || 'Geral',
    };

    res.json(preview);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. BOOK SERIES
// ══════════════════════════════════════════════════════════════════════════════

// POST /api/features/series — create a book series
featuresRouter.post('/series', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { name, description, genre } = req.body as { name: string; description: string; genre: string };

  if (!name) { res.status(400).json({ error: 'Nome da série obrigatório' }); return; }

  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('author_profile')
      .eq('id', req.userId!)
      .single();

    const profile = (user?.author_profile || {}) as Record<string, unknown>;
    const series = (profile.book_series || []) as Array<Record<string, unknown>>;

    const newSeries = {
      id: crypto.randomUUID(),
      name,
      description: description || '',
      genre: genre || '',
      shared_book_bible_id: null,
      volumes: [],
      created_at: new Date().toISOString(),
    };

    series.push(newSeries);

    await supabaseAdmin
      .from('users')
      .update({ author_profile: { ...profile, book_series: series } })
      .eq('id', req.userId!);

    res.status(201).json({ series: newSeries });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/features/series — list user's book series
featuresRouter.get('/series', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('author_profile')
      .eq('id', req.userId!)
      .single();

    const profile = (user?.author_profile || {}) as Record<string, unknown>;
    const series = (profile.book_series || []) as Array<Record<string, unknown>>;

    res.json({ series });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/features/series/:id/add-volume — add a project to series
featuresRouter.post('/series/:id/add-volume', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { projectId } = req.body as { projectId: string };
  if (!projectId) { res.status(400).json({ error: 'projectId obrigatório' }); return; }

  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('author_profile')
      .eq('id', req.userId!)
      .single();

    const profile = (user?.author_profile || {}) as Record<string, unknown>;
    const seriesList = (profile.book_series || []) as Array<Record<string, unknown>>;
    const series = seriesList.find((s) => s.id === req.params.id);

    if (!series) { res.status(404).json({ error: 'Série não encontrada' }); return; }

    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('id, name, status')
      .eq('id', projectId)
      .eq('user_id', req.userId!)
      .single();

    if (!project) { res.status(404).json({ error: 'Projeto não encontrado' }); return; }

    const volumes = (series.volumes || []) as Array<Record<string, unknown>>;
    volumes.push({
      volume_number: volumes.length + 1,
      project_id: projectId,
      title: project.name,
      status: project.status,
    });
    series.volumes = volumes;

    await supabaseAdmin
      .from('users')
      .update({ author_profile: { ...profile, book_series: seriesList } })
      .eq('id', req.userId!);

    res.json({ series });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. TRANSLATION
// ══════════════════════════════════════════════════════════════════════════════

// POST /api/features/translate — start translation job
featuresRouter.post('/translate', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { projectId, targetLanguage } = req.body as {
    projectId: string;
    targetLanguage: 'pt-br' | 'en';
  };

  if (!projectId || !targetLanguage) {
    res.status(400).json({ error: 'projectId e targetLanguage obrigatórios' });
    return;
  }

  try {
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', req.userId!)
      .single();

    if (!project) { res.status(404).json({ error: 'Projeto não encontrado' }); return; }

    const p4 = project.phase_4_data as Phase4Data | null;
    const chapters = p4?.chapters?.filter((ch: WrittenChapter) => ch.content) || [];

    if (chapters.length === 0) {
      res.status(400).json({ error: 'Nenhum capítulo escrito para traduzir' });
      return;
    }

    const sourceLanguage = (project.market || 'pt-br') as 'pt-br' | 'en';
    if (sourceLanguage === targetLanguage) {
      res.status(400).json({ error: 'Idioma de origem e destino são iguais' });
      return;
    }

    // Create translated project as copy
    const bible = (project.phase_2_data || {}) as Record<string, string>;
    const { data: newProject, error: createErr } = await supabaseAdmin
      .from('projects')
      .insert({
        user_id: req.userId!,
        name: `${project.name} (${targetLanguage === 'en' ? 'EN' : 'PT-BR'})`,
        market: targetLanguage,
        genre: project.genre,
        genre_mode: project.genre_mode,
        status: 'active',
        current_phase: 4,
        phases_completed: project.phases_completed,
        phase_0_data: project.phase_0_data,
        phase_1_data: project.phase_1_data,
        phase_2_data: { ...project.phase_2_data, title: `${bible.title || ''} (Translation)` },
        phase_3_data: project.phase_3_data,
      })
      .select()
      .single();

    if (createErr || !newProject) {
      res.status(500).json({ error: 'Falha ao criar projeto traduzido' });
      return;
    }

    const job: TranslationJob = {
      id: crypto.randomUUID(),
      project_id: projectId,
      source_language: sourceLanguage,
      target_language: targetLanguage,
      status: 'pending',
      translated_project_id: newProject.id,
      chapters_translated: 0,
      total_chapters: chapters.length,
      price_cents: TRANSLATION_PRICE_BRL_CENTS,
      created_at: new Date().toISOString(),
      completed_at: null,
    };

    res.status(201).json({
      job,
      message: `Projeto de tradução criado. ${chapters.length} capítulos serão traduzidos para ${targetLanguage === 'en' ? 'English' : 'Português'}.`,
      translated_project_id: newProject.id,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. AFFILIATE PROGRAM
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/features/affiliate — get affiliate info
featuresRouter.get('/affiliate', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email, author_profile')
      .eq('id', req.userId!)
      .single();

    const profile = (user?.author_profile || {}) as Record<string, unknown>;
    let affiliateCode = profile.affiliate_code as string | undefined;

    if (!affiliateCode) {
      affiliateCode = `MSC-${user!.id.slice(0, 8).toUpperCase()}`;
      await supabaseAdmin
        .from('users')
        .update({ author_profile: { ...profile, affiliate_code: affiliateCode } })
        .eq('id', req.userId!);
    }

    const affiliateData = (profile.affiliate_data || {}) as Record<string, unknown>;

    const info: AffiliateInfo = {
      affiliate_code: affiliateCode,
      referral_url: `${process.env.FRONTEND_URL || 'https://manuscry.ai'}/?ref=${affiliateCode}`,
      commission_percent: AFFILIATE_COMMISSION_PERCENT,
      total_referrals: (affiliateData.total_referrals as number) || 0,
      total_earnings_cents: (affiliateData.total_earnings_cents as number) || 0,
      pending_payout_cents: (affiliateData.pending_payout_cents as number) || 0,
      referrals: (affiliateData.referrals as AffiliateInfo['referrals']) || [],
    };

    res.json(info);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
