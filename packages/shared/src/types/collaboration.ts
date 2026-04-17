// ── 6. Real-time Collaboration ───────────────────────────────────────────────

export type CollaboratorRole = 'owner' | 'editor' | 'viewer' | 'commenter';

export interface Collaborator {
  user_id: string;
  email: string;
  name: string | null;
  role: CollaboratorRole;
  invited_at: string;
  accepted: boolean;
}

export interface ProjectCollaboration {
  project_id: string;
  collaborators: Collaborator[];
  chat_enabled: boolean;
}

// ── 7. Editorial Calendar ────────────────────────────────────────────────────

export interface CalendarMilestone {
  id: string;
  phase: number;
  phase_name: string;
  title: string;
  deadline: string | null;
  completed: boolean;
  completed_at: string | null;
  notes: string;
}

export interface EditorialCalendar {
  project_id: string;
  milestones: CalendarMilestone[];
  social_posts_scheduled: ScheduledPost[];
  target_publish_date: string | null;
}

export interface ScheduledPost {
  id: string;
  platform: string;
  content_type: string;
  scheduled_for: string;
  status: 'scheduled' | 'posted' | 'cancelled';
}

// ── 8. Versioning / Revision History ─────────────────────────────────────────

export interface ChapterVersion {
  version_id: string;
  chapter_number: number;
  content: string;
  word_count: number;
  created_at: string;
  label: string;
  source: 'ai_write' | 'ai_humanize' | 'manual_edit' | 'ai_translate';
}

export interface VersionHistory {
  project_id: string;
  chapters: Record<number, ChapterVersion[]>;
}

// ── 9. AI Writing Coach ──────────────────────────────────────────────────────

export type CoachSuggestionType =
  | 'pacing'
  | 'show_dont_tell'
  | 'dialogue'
  | 'cliche'
  | 'repetition'
  | 'tone'
  | 'structure'
  | 'general';

export interface CoachSuggestion {
  id: string;
  type: CoachSuggestionType;
  title: string;
  explanation: string;
  original_text: string;
  suggested_improvement: string | null;
  severity: 'info' | 'warning' | 'improvement';
}

export interface CoachAnalysis {
  chapter_number: number;
  suggestions: CoachSuggestion[];
  overall_score: number;
  strengths: string[];
  areas_to_improve: string[];
}

// ── 10. Gamification ─────────────────────────────────────────────────────────

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'writing' | 'publishing' | 'social' | 'milestone';
  earned: boolean;
  earned_at: string | null;
}

export interface WritingStreak {
  current_days: number;
  longest_days: number;
  last_activity_date: string | null;
}

export interface DailyGoal {
  target_words: number;
  words_today: number;
  completed: boolean;
}

export interface GamificationProfile {
  xp: number;
  level: number;
  badges: Badge[];
  streak: WritingStreak;
  daily_goal: DailyGoal;
  total_words_lifetime: number;
  books_published: number;
}

export const BADGES: Omit<Badge, 'earned' | 'earned_at'>[] = [
  { id: 'first-project', name: 'Primeiro Passo', description: 'Criou seu primeiro projeto', icon: '\u{1F331}', category: 'milestone' },
  { id: 'first-chapter', name: 'Primeira Página', description: 'Escreveu seu primeiro capítulo', icon: '\u{270D}\uFE0F', category: 'writing' },
  { id: 'word-warrior-10k', name: 'Guerreiro das Palavras', description: 'Escreveu 10.000 palavras', icon: '\u{2694}\uFE0F', category: 'writing' },
  { id: 'word-warrior-50k', name: 'Maratonista Literário', description: 'Escreveu 50.000 palavras', icon: '\u{1F3C3}', category: 'writing' },
  { id: 'word-warrior-100k', name: 'Mestre das Palavras', description: 'Escreveu 100.000 palavras', icon: '\u{1F451}', category: 'writing' },
  { id: 'streak-7', name: 'Semana de Fogo', description: '7 dias seguidos escrevendo', icon: '\u{1F525}', category: 'writing' },
  { id: 'streak-30', name: 'Mês Imbatível', description: '30 dias seguidos escrevendo', icon: '\u{1F4AA}', category: 'writing' },
  { id: 'first-publish', name: 'Autor Publicado', description: 'Publicou seu primeiro livro', icon: '\u{1F4DA}', category: 'publishing' },
  { id: 'multi-channel', name: 'Distribuidor Global', description: 'Publicou em 5+ plataformas', icon: '\u{1F30E}', category: 'publishing' },
  { id: 'first-sale', name: 'Primeira Venda', description: 'Vendeu seu primeiro exemplar', icon: '\u{1F4B0}', category: 'publishing' },
  { id: 'social-creator', name: 'Criador Social', description: 'Gerou 10+ conteúdos sociais', icon: '\u{1F3AC}', category: 'social' },
  { id: 'book-bible-master', name: 'Arquiteto Narrativo', description: 'Completou Book Bible + Roteiro', icon: '\u{1F3D7}\uFE0F', category: 'milestone' },
  { id: 'preflight-perfect', name: 'Zero Defeitos', description: 'Preflight com 100% aprovado', icon: '\u{2705}', category: 'milestone' },
  { id: 'humanizer', name: 'Voz Humana', description: 'Humanizou todos os capítulos', icon: '\u{1F9D1}', category: 'writing' },
  { id: 'series-author', name: 'Autor de Série', description: 'Criou uma série de livros', icon: '\u{1F4DA}', category: 'milestone' },
];

export const XP_VALUES = {
  create_project: 50,
  complete_phase: 100,
  write_chapter: 75,
  humanize_chapter: 50,
  publish_book: 500,
  first_sale: 200,
  social_content: 25,
  daily_goal: 30,
  streak_day: 10,
};

export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}
