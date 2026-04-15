export interface Project {
  id: string;
  user_id: string;
  name: string;
  market: 'pt-br' | 'en';
  genre: string | null;
  genre_mode: 'fiction' | 'nonfiction' | null;
  status: 'active' | 'paused' | 'published' | 'archived';
  current_phase: number;
  phases_completed: number[];

  phase_0_data: Phase0Data | null;
  phase_1_data: Phase1Data | null;
  phase_2_data: Phase2Data | null;
  phase_3_data: Phase3Data | null;
  phase_4_data: Phase4Data | null;
  phase_5_data: Record<string, unknown> | null;

  asin: string | null;
  isbn_ebook: string | null;
  isbn_print: string | null;
  bsr_week1: number | null;
  reviews_month1: number | null;
  revenue_month1: number | null;

  created_at: string;
  updated_at: string;
}

export interface Phase0Theme {
  rank: number;
  title: string;
  genre: string;
  subgenre: string;
  opportunity_score: number;
  demand_level: 'alto' | 'médio' | 'baixo' | 'high' | 'medium' | 'low';
  competition_level: 'alto' | 'médio' | 'baixo' | 'high' | 'medium' | 'low';
  avg_price_brl: string;
  avg_price_usd: string;
  gap_insight: string;
  unique_angle: string;
  risk: string;
  evergreen: boolean;
}

export interface Phase0Data {
  market_summary: string;
  themes: Phase0Theme[];
  recommendation: string;
  selected_theme?: Phase0Theme;
}

export interface Phase1Data {
  selected_theme_title: string;
  target_audience: string;
  unique_book_angle: string;
  promise: string;
  positioning_statement: string;
  validation_checklist: string[];
  uvp_score: number;
}

export interface Phase2ChapterSeed {
  chapter: number;
  title: string;
  goal: string;
}

export interface Phase2Data {
  working_title: string;
  subtitle: string;
  premise: string;
  author_voice: string;
  target_word_count: number;
  core_message: string;
  reader_transformation: string;
  chapters_seed: Phase2ChapterSeed[];
  book_bible: string;
}

export interface Phase3ChapterPlan {
  chapter: number;
  title: string;
  summary: string;
  target_words: number;
  hook: string;
}

export interface Phase3Data {
  narrative_structure: string;
  pacing_notes: string;
  ending_strategy: string;
  tension_map: string[];
  chapter_plan: Phase3ChapterPlan[];
}

export type Phase4ChapterStatus = 'pending' | 'streaming' | 'draft' | 'done';

export interface Phase4Chapter {
  chapter: number;
  title: string;
  content: string;
  word_count: number;
  status: Phase4ChapterStatus;
  updated_at: string;
}

export interface Phase4Data {
  chapters: Phase4Chapter[];
  total_words: number;
}

export interface CreateProjectInput {
  name: string;
  market: 'pt-br' | 'en';
  genre: string;
  genre_mode: 'fiction' | 'nonfiction';
}
