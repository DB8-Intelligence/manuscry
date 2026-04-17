import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../services/supabase.js';
import { generateStructured } from '../services/claude.service.js';
import { buildCoachAnalysisPrompt } from '../services/prompts/coach.prompt.js';
import type { Phase2Data, Phase4Data, WrittenChapter } from '@manuscry/shared';
import type {
  Collaborator, CalendarMilestone, EditorialCalendar,
  ChapterVersion, CoachAnalysis, GamificationProfile, Badge,
} from '@manuscry/shared';
import { BADGES, XP_VALUES, calculateLevel } from '@manuscry/shared';
import { PIPELINE_PHASES } from '@manuscry/shared';
import crypto from 'crypto';

export const collaborationRouter = Router();
collaborationRouter.use(requireAuth);

// Helper: get/update user profile data
async function getUserProfile(userId: string) {
  const { data } = await supabaseAdmin
    .from('users').select('author_profile').eq('id', userId).single();
  return (data?.author_profile || {}) as Record<string, unknown>;
}

async function saveUserProfile(userId: string, profile: Record<string, unknown>) {
  await supabaseAdmin.from('users').update({ author_profile: profile }).eq('id', userId);
}

// ══════════════════════════════════════════════════════════════════════════════
// 6. COLLABORATION
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/collab/collaborators/:projectId
collaborationRouter.get('/collaborators/:projectId', async (req: AuthenticatedRequest, res) => {
  try {
    const { data: project } = await supabaseAdmin
      .from('projects').select('id, user_id').eq('id', req.params.projectId).single();
    if (!project || project.user_id !== req.userId) {
      res.status(403).json({ error: 'Sem permissão' }); return;
    }
    const profile = await getUserProfile(req.userId!);
    const pid = req.params.projectId as string;
    const collabs = ((profile.collaborations as Record<string, Collaborator[]>) || {})[pid] || [];
    res.json({ collaborators: collabs });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// POST /api/collab/invite
collaborationRouter.post('/invite', async (req: AuthenticatedRequest, res) => {
  const { projectId, email, role } = req.body as { projectId: string; email: string; role: string };
  if (!projectId || !email) { res.status(400).json({ error: 'projectId e email obrigatórios' }); return; }

  try {
    const profile = await getUserProfile(req.userId!);
    const collabs = (profile.collaborations || {}) as Record<string, Collaborator[]>;
    if (!collabs[projectId]) collabs[projectId] = [];

    collabs[projectId].push({
      user_id: '', email, name: null,
      role: (role as Collaborator['role']) || 'editor',
      invited_at: new Date().toISOString(), accepted: false,
    });

    await saveUserProfile(req.userId!, { ...profile, collaborations: collabs });
    res.json({ invited: email, role: role || 'editor' });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. EDITORIAL CALENDAR
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/collab/calendar/:projectId
collaborationRouter.get('/calendar/:projectId', async (req: AuthenticatedRequest, res) => {
  try {
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('id, current_phase, phases_completed, phase_5_data')
      .eq('id', req.params.projectId).eq('user_id', req.userId!).single();

    if (!project) { res.status(404).json({ error: 'Projeto não encontrado' }); return; }

    const phasesCompleted: number[] = project.phases_completed || [];
    const milestones: CalendarMilestone[] = PIPELINE_PHASES.map((phase) => ({
      id: `phase-${phase.id}`,
      phase: phase.id,
      phase_name: phase.name,
      title: `Fase ${phase.id}: ${phase.name}`,
      deadline: null,
      completed: phasesCompleted.includes(phase.id),
      completed_at: null,
      notes: phase.description,
    }));

    const calendar: EditorialCalendar = {
      project_id: project.id,
      milestones,
      social_posts_scheduled: [],
      target_publish_date: null,
    };

    res.json(calendar);
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// PATCH /api/collab/calendar/:projectId/milestone
collaborationRouter.patch('/calendar/:projectId/milestone', async (req: AuthenticatedRequest, res) => {
  const { milestoneId, deadline, notes } = req.body as { milestoneId: string; deadline?: string; notes?: string };
  res.json({ updated: milestoneId, deadline, notes, message: 'Milestone atualizado' });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. VERSIONING
// ══════════════════════════════════════════════════════════════════════════════

// POST /api/collab/version/save — save a chapter version snapshot
collaborationRouter.post('/version/save', async (req: AuthenticatedRequest, res) => {
  const { projectId, chapterNumber, label, source } = req.body as {
    projectId: string; chapterNumber: number; label?: string;
    source?: ChapterVersion['source'];
  };

  if (!projectId || chapterNumber === undefined) {
    res.status(400).json({ error: 'projectId e chapterNumber obrigatórios' }); return;
  }

  try {
    const { data: project } = await supabaseAdmin
      .from('projects').select('phase_4_data').eq('id', projectId).eq('user_id', req.userId!).single();
    if (!project) { res.status(404).json({ error: 'Projeto não encontrado' }); return; }

    const p4 = project.phase_4_data as Phase4Data | null;
    const chapter = p4?.chapters?.find((ch: WrittenChapter) => ch.number === chapterNumber);
    if (!chapter?.content) { res.status(400).json({ error: 'Capítulo sem conteúdo' }); return; }

    const profile = await getUserProfile(req.userId!);
    const versions = (profile.chapter_versions || {}) as Record<string, Record<number, ChapterVersion[]>>;
    if (!versions[projectId]) versions[projectId] = {};
    if (!versions[projectId][chapterNumber]) versions[projectId][chapterNumber] = [];

    const existing = versions[projectId][chapterNumber];
    if (existing.length >= 10) existing.shift();

    const version: ChapterVersion = {
      version_id: crypto.randomUUID(),
      chapter_number: chapterNumber,
      content: chapter.content,
      word_count: chapter.word_count,
      created_at: new Date().toISOString(),
      label: label || `v${existing.length + 1}`,
      source: source || 'manual_edit',
    };

    existing.push(version);
    await saveUserProfile(req.userId!, { ...profile, chapter_versions: versions });

    res.json({ version, total_versions: existing.length });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// GET /api/collab/version/list — list versions for a chapter
collaborationRouter.get('/version/list/:projectId/:chapterNumber', async (req: AuthenticatedRequest, res) => {
  try {
    const profile = await getUserProfile(req.userId!);
    const versions = (profile.chapter_versions || {}) as Record<string, Record<string, ChapterVersion[]>>;
    const chapterVersions = versions[req.params.projectId as string]?.[req.params.chapterNumber as string] || [];
    res.json({ versions: chapterVersions });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// POST /api/collab/version/restore — restore a chapter version
collaborationRouter.post('/version/restore', async (req: AuthenticatedRequest, res) => {
  const { projectId, chapterNumber, versionId } = req.body as {
    projectId: string; chapterNumber: number; versionId: string;
  };

  try {
    const profile = await getUserProfile(req.userId!);
    const versions = (profile.chapter_versions || {}) as Record<string, Record<number, ChapterVersion[]>>;
    const chapterVersions = versions[projectId]?.[chapterNumber] || [];
    const version = chapterVersions.find((v) => v.version_id === versionId);
    if (!version) { res.status(404).json({ error: 'Versão não encontrada' }); return; }

    const { data: project } = await supabaseAdmin
      .from('projects').select('phase_4_data').eq('id', projectId).eq('user_id', req.userId!).single();
    if (!project) { res.status(404).json({ error: 'Projeto não encontrado' }); return; }

    const p4 = project.phase_4_data as Phase4Data;
    const chapterIdx = p4.chapters.findIndex((ch: WrittenChapter) => ch.number === chapterNumber);
    if (chapterIdx < 0) { res.status(404).json({ error: 'Capítulo não encontrado' }); return; }

    p4.chapters[chapterIdx] = {
      ...p4.chapters[chapterIdx],
      content: version.content,
      word_count: version.word_count,
    };

    await supabaseAdmin.from('projects').update({ phase_4_data: p4 }).eq('id', projectId);
    res.json({ restored: versionId, chapter_number: chapterNumber });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. AI WRITING COACH
// ══════════════════════════════════════════════════════════════════════════════

// POST /api/collab/coach/analyze — analyze a chapter
collaborationRouter.post('/coach/analyze', async (req: AuthenticatedRequest, res) => {
  const { projectId, chapterNumber } = req.body as { projectId: string; chapterNumber: number };

  if (!projectId || chapterNumber === undefined) {
    res.status(400).json({ error: 'projectId e chapterNumber obrigatórios' }); return;
  }

  try {
    const { data: project } = await supabaseAdmin
      .from('projects').select('*').eq('id', projectId).eq('user_id', req.userId!).single();
    if (!project) { res.status(404).json({ error: 'Projeto não encontrado' }); return; }

    const p4 = project.phase_4_data as Phase4Data | null;
    const chapter = p4?.chapters?.find((ch: WrittenChapter) => ch.number === chapterNumber);
    if (!chapter?.content) { res.status(400).json({ error: 'Capítulo sem conteúdo' }); return; }

    const bookBible = (project.phase_2_data || {}) as Record<string, unknown>;
    const market = (project.market || 'pt-br') as 'pt-br' | 'en';
    const { system, user } = buildCoachAnalysisPrompt(chapter.content, chapterNumber, bookBible, market);

    const analysis = await generateStructured<Omit<CoachAnalysis, 'chapter_number'>>(system, user, 8192);
    const result: CoachAnalysis = { ...analysis, chapter_number: chapterNumber };

    res.json(result);
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. GAMIFICATION
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/collab/gamification — get user gamification profile
collaborationRouter.get('/gamification', async (req: AuthenticatedRequest, res) => {
  try {
    const profile = await getUserProfile(req.userId!);
    const gamification = (profile.gamification || {}) as Partial<GamificationProfile>;

    const result: GamificationProfile = {
      xp: gamification.xp || 0,
      level: calculateLevel(gamification.xp || 0),
      badges: BADGES.map((b) => ({
        ...b,
        earned: (gamification.badges || []).some((eb: Badge) => eb.id === b.id && eb.earned),
        earned_at: (gamification.badges || []).find((eb: Badge) => eb.id === b.id)?.earned_at || null,
      })),
      streak: gamification.streak || { current_days: 0, longest_days: 0, last_activity_date: null },
      daily_goal: gamification.daily_goal || { target_words: 1000, words_today: 0, completed: false },
      total_words_lifetime: gamification.total_words_lifetime || 0,
      books_published: gamification.books_published || 0,
    };

    res.json(result);
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// POST /api/collab/gamification/daily-goal — set daily word goal
collaborationRouter.post('/gamification/daily-goal', async (req: AuthenticatedRequest, res) => {
  const { targetWords } = req.body as { targetWords: number };
  try {
    const profile = await getUserProfile(req.userId!);
    const gamification = (profile.gamification || {}) as Record<string, unknown>;
    gamification.daily_goal = { target_words: targetWords || 1000, words_today: 0, completed: false };
    await saveUserProfile(req.userId!, { ...profile, gamification });
    res.json({ target_words: targetWords });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// POST /api/collab/gamification/add-xp — add XP for an activity
collaborationRouter.post('/gamification/add-xp', async (req: AuthenticatedRequest, res) => {
  const { activity, wordsWritten } = req.body as { activity: keyof typeof XP_VALUES; wordsWritten?: number };
  try {
    const profile = await getUserProfile(req.userId!);
    const gamification = (profile.gamification || {}) as Record<string, unknown>;

    const xpGain = XP_VALUES[activity] || 0;
    const currentXp = (gamification.xp as number) || 0;
    const newXp = currentXp + xpGain;

    gamification.xp = newXp;
    gamification.level = calculateLevel(newXp);

    if (wordsWritten) {
      const lifetime = ((gamification.total_words_lifetime as number) || 0) + wordsWritten;
      gamification.total_words_lifetime = lifetime;

      const dailyGoal = (gamification.daily_goal || { target_words: 1000, words_today: 0, completed: false }) as Record<string, unknown>;
      dailyGoal.words_today = ((dailyGoal.words_today as number) || 0) + wordsWritten;
      if ((dailyGoal.words_today as number) >= (dailyGoal.target_words as number)) {
        dailyGoal.completed = true;
      }
      gamification.daily_goal = dailyGoal;
    }

    // Update streak
    const streak = (gamification.streak || { current_days: 0, longest_days: 0, last_activity_date: null }) as Record<string, unknown>;
    const today = new Date().toISOString().slice(0, 10);
    const lastDate = streak.last_activity_date as string | null;

    if (lastDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (lastDate === yesterday) {
        streak.current_days = ((streak.current_days as number) || 0) + 1;
      } else {
        streak.current_days = 1;
      }
      streak.last_activity_date = today;
      if ((streak.current_days as number) > ((streak.longest_days as number) || 0)) {
        streak.longest_days = streak.current_days;
      }
    }
    gamification.streak = streak;

    await saveUserProfile(req.userId!, { ...profile, gamification });

    res.json({
      xp_gained: xpGain,
      total_xp: newXp,
      level: calculateLevel(newXp),
      streak: streak.current_days,
    });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});
