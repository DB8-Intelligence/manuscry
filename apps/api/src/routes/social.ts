import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../services/supabase.js';
import { generateStructured } from '../services/claude.service.js';
import { buildSocialContentPrompt } from '../services/prompts/social.prompt.js';
import type {
  ContentFormat, SocialPlatform, Phase2Data,
  ReelScript, SocialPost, CarouselContent,
  Phase4Data, WrittenChapter,
} from '@manuscry/shared';

export const socialRouter = Router();
socialRouter.use(requireAuth);

// POST /api/social/generate — generate social content from book data
socialRouter.post('/generate', async (req: AuthenticatedRequest, res) => {
  const { projectId, platform, format, chapterNumber, characterName, customAngle } = req.body as {
    projectId: string;
    platform: SocialPlatform;
    format: ContentFormat;
    chapterNumber?: number;
    characterName?: string;
    customAngle?: string;
  };

  if (!projectId || !platform || !format) {
    res.status(400).json({ error: 'projectId, platform e format obrigatórios' });
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

    const bookBible = (project.phase_2_data || {}) as Record<string, unknown>;
    const market = (project.market || 'pt-br') as 'pt-br' | 'en';

    let chapterExcerpt: string | undefined;
    if (chapterNumber !== undefined) {
      const phase4 = project.phase_4_data as Phase4Data | null;
      const chapter = phase4?.chapters?.find((ch: WrittenChapter) => ch.number === chapterNumber);
      if (chapter?.content) {
        chapterExcerpt = chapter.content.slice(0, 1000);
      }
    }

    const { system, user } = buildSocialContentPrompt(
      format, platform, bookBible,
      { chapterExcerpt, characterName, customAngle },
      market,
    );

    const result = await generateStructured<ReelScript | SocialPost | CarouselContent>(
      system, user, 4096,
    );

    res.json({
      platform,
      format,
      content: result,
      based_on: { chapter_number: chapterNumber, character_name: characterName },
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
