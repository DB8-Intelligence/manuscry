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
}

export interface CreateProjectInput {
  name: string;
  market: 'pt-br' | 'en';
  genre: string;
  genre_mode: 'fiction' | 'nonfiction';
}

// ── Phase 1 — Theme Selector ─────────────────────────────────────────────────

export interface Phase1Validation {
  score: number;
  market_fit: string;
  warnings: string[];
  green_lights: string[];
}

export interface UniqueBookAngle {
  for_whom: string;
  pain_or_desire: string;
  what_it_offers: string;
  different_because: string;
  one_sentence: string;
}

export interface BookProfile {
  kdp_genre: string;
  kdp_subgenre: string;
  tone: string;
  target_word_count: number;
  format: string;
  kindle_unlimited: boolean;
  price_range_brl: string;
  price_range_usd: string;
  reader_profile: string;
}

export interface Phase1Data {
  validation: Phase1Validation;
  unique_book_angle: UniqueBookAngle;
  book_profile: BookProfile;
}

export interface AuthorAnswers {
  experience: string;
  angle: string;
  audience: string;
}

// ── Phase 2 — Book Bible (Fiction) ────────────────────────────────────────────

export interface FictionCharacter {
  name: string;
  role: string;
  age: number;
  description: string;
  internal_motivation: string;
  external_motivation: string;
  central_fear: string;
  transformation_arc: string;
  voice_signature: string;
}

export interface Phase2DataFiction {
  title: string;
  subtitle: string;
  tagline: string;
  synopsis: string;
  premise: string;
  target_audience: string;
  unique_value_proposition: string;
  tone_of_voice: string;
  narrative_style: string;
  central_conflict: string;
  estimated_word_count: number;
  chapter_count: number;
  characters: FictionCharacter[];
  world_rules: string;
  thematic_threads: string[];
}

export interface NonfictionFramework {
  name: string;
  steps: string[];
  description: string;
}

export interface Phase2DataNonfiction {
  title: string;
  subtitle: string;
  tagline: string;
  synopsis: string;
  premise: string;
  target_audience: string;
  unique_value_proposition: string;
  tone_of_voice: string;
  narrative_style: string;
  framework: NonfictionFramework;
  transformation_promise: string;
  reader_pain_points: string[];
  author_credibility: string;
  estimated_word_count: number;
  chapter_count: number;
  thematic_threads: string[];
}

export type Phase2Data = Phase2DataFiction | Phase2DataNonfiction;

// ── Phase 3 — Narrative Architect ─────────────────────────────────────────────

export interface ChapterEmotionalArc {
  start: string;
  end: string;
}

export interface ChapterOutline {
  number: number;
  title: string;
  act_position: string;
  tension_level: number;
  estimated_words: number;
  narrative_objective: string;
  summary: string;
  scenes: string[];
  emotional_arc: ChapterEmotionalArc;
  planted_seeds: string[];
  cliffhanger: string | null;
}

export interface Phase3Data {
  structure_type: 'three_act' | 'transformation_framework';
  total_chapters: number;
  total_words_target: number;
  tension_map: number[];
  chapters: ChapterOutline[];
}

// ── Phase 4 — Writing Engine ─────────────────────────────────────────────────

export type WrittenChapterStatus = 'pending' | 'writing' | 'completed' | 'humanized';

export interface WrittenChapter {
  number: number;
  title: string;
  content: string;
  word_count: number;
  status: WrittenChapterStatus;
  written_at: string | null;
  humanized_at: string | null;
}

export interface Phase4Data {
  chapters: WrittenChapter[];
  total_words_written: number;
}
