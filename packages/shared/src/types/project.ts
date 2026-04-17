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
  phase_5_data: Phase5Data | null;

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

// ── Phase 5 — Production Studio ──────────────────────────────────────────────

// 5a — Cover Generator

export interface CoverVariation {
  variation: number;
  style: string;
  concept: string;
  prompt: string;
  color_palette: string[];
  score: number;
  score_reason: string;
  image_url: string | null;
  image_width: number | null;
  image_height: number | null;
  selected: boolean;
}

export interface CoverData {
  negative_prompt: string;
  covers: CoverVariation[];
  generated_at: string | null;
}

// 5b — Author Biography

export interface AuthorBios {
  kdp_full: string;
  back_cover: string;
  social_media: string;
  press_kit: string;
  one_liner: string;
}

export interface PhotoSuggestions {
  style: string;
  clothing: string;
  background: string;
  mood: string;
}

export interface BiographyData {
  author_name: string;
  bios: AuthorBios;
  photo_suggestions: PhotoSuggestions;
  brand_keywords: string[];
  tagline: string;
  generated_at: string | null;
}

// 5c — Book Designer

export interface TrimSize {
  width_inches: number;
  height_inches: number;
  name: string;
  kdp_compatible: boolean;
  ingram_compatible: boolean;
}

export interface InteriorSpecs {
  paper_type: string;
  bleed: boolean;
  margins: {
    top_inches: number;
    bottom_inches: number;
    inside_inches: number;
    outside_inches: number;
  };
  gutter_inches: number;
  estimated_page_count: number;
  spine_width_inches: number;
}

export interface TypographySpecs {
  body_font: string;
  body_size_pt: number;
  line_spacing: number;
  heading_font: string;
  heading_size_pt: number;
  chapter_number_style: string;
  drop_cap: boolean;
  paragraph_indent_inches: number;
  paragraph_spacing_pt: number;
}

export interface DustJacketSpecs {
  required: boolean;
  front_cover_width_inches: number;
  spine_width_inches: number;
  back_cover_width_inches: number;
  total_width_inches: number;
  height_inches: number;
  bleed_inches: number;
  barcode_area: string;
}

export interface EbookSpecs {
  format: string;
  reflowable: boolean;
  toc_type: string;
  cover_dimensions: string;
  css_notes: string;
}

export interface BookDesignData {
  trim_size: TrimSize;
  interior: InteriorSpecs;
  typography: TypographySpecs;
  front_matter: string[];
  back_matter: string[];
  dust_jacket: DustJacketSpecs;
  ebook: EbookSpecs;
  recommendations: string;
  generated_at: string | null;
}

// 5e — KDP Metadata Optimizer

export interface KdpKeywords {
  primary: string[];
  long_tail: string[];
  strategy: string;
}

export interface BisacCategory {
  code: string;
  name: string;
  reason: string;
}

export interface KdpCategories {
  bisac_primary: BisacCategory;
  bisac_secondary: BisacCategory;
  kdp_browse_categories: string[];
}

export interface APlusModule {
  type: string;
  title: string;
  content: string;
}

export interface KdpMetadata {
  keywords: KdpKeywords;
  categories: KdpCategories;
  description_html: string;
  description_plain: string;
  a_plus_content: {
    headline: string;
    modules: APlusModule[];
  };
  search_title: string;
  series_info: {
    is_series: boolean;
    series_name: string | null;
    volume_number: number | null;
  };
  age_range: string | null;
  language: string;
  generated_at: string | null;
}

// 4c — Audiobook Adapter

export interface CharacterVoice {
  character: string;
  voice_direction: string;
}

export interface AudiobookChapterScript {
  chapter_number: number;
  chapter_title: string;
  narration_script: string;
  estimated_duration_minutes: number;
  voice_notes: string;
  character_voices: CharacterVoice[];
  sound_cues: string[];
}

export interface AudiobookData {
  scripts: AudiobookChapterScript[];
  total_duration_minutes: number;
  generated_at: string | null;
}

export interface Phase5Data {
  covers: CoverData | null;
  biography: BiographyData | null;
  design: BookDesignData | null;
  metadata: KdpMetadata | null;
  audiobook: AudiobookData | null;
}
