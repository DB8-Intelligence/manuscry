export type PlanId = 'trial' | 'starter' | 'pro' | 'publisher';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  plan: PlanId;
  market: 'pt-br' | 'en' | 'both';
  books_this_month: number;
  books_limit: number;
  trial_ends_at: string | null;
  author_profile: AuthorProfile;
  created_at: string;
  updated_at: string;
}

export interface AuthorProfile {
  display_name: string | null;
  pen_name: string | null;
  city: string | null;
  state: string | null;
  country: string;
  profession: string | null;
  education: string[];
  expertise: string[];
  previous_books: string[];
  awards: string[];
  website: string | null;
  instagram: string | null;
  twitter: string | null;
  tiktok: string | null;
  email_public: string | null;
  photo_url: string | null;
  photo_approved: boolean;
  personal_detail: string | null;
  why_this_book: string | null;
}
