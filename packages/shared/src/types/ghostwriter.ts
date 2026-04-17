// ── Ghostwriter Marketplace ───────────────────────────────────────────────────

export type GhostwriterStatus = 'available' | 'busy' | 'inactive';

export interface GhostwriterProfile {
  user_id: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  genres: string[];
  languages: string[];
  price_per_word_cents: number;
  min_project_words: number;
  max_project_words: number;
  turnaround_days: number;
  portfolio_links: string[];
  rating: number;
  total_projects: number;
  status: GhostwriterStatus;
  created_at: string;
}

export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

export interface GhostwriterProposal {
  id: string;
  ghostwriter_user_id: string;
  author_user_id: string;
  project_id: string;
  message: string;
  price_cents: number;
  estimated_words: number;
  estimated_days: number;
  status: ProposalStatus;
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
}

export interface GhostwriterListing {
  display_name: string;
  bio: string;
  avatar_url: string | null;
  genres: string[];
  price_per_word_cents: number;
  turnaround_days: number;
  rating: number;
  total_projects: number;
}

export const GHOSTWRITER_COMMISSION_PERCENT = 20;
