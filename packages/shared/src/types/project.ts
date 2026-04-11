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
  phase_1_data: Record<string, unknown> | null;
  phase_2_data: Record<string, unknown> | null;
  phase_3_data: Record<string, unknown> | null;
  phase_4_data: Record<string, unknown> | null;
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
