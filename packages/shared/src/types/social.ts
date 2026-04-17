// ── Social Content Studio ─────────────────────────────────────────────────────

export type SocialPlatform = 'instagram' | 'tiktok' | 'twitter' | 'facebook' | 'linkedin';
export type ContentFormat = 'reel' | 'post' | 'carousel' | 'story';

export interface ReelScript {
  hook: string;
  scenes: Array<{
    visual: string;
    narration: string;
    duration_seconds: number;
    text_overlay: string;
  }>;
  cta: string;
  music_suggestion: string;
  hashtags: string[];
  total_duration_seconds: number;
}

export interface SocialPost {
  text: string;
  hashtags: string[];
  emoji_strategy: string;
  best_time: string;
  cta: string;
}

export interface CarouselSlide {
  slide_number: number;
  headline: string;
  body: string;
  visual_suggestion: string;
}

export interface CarouselContent {
  title: string;
  slides: CarouselSlide[];
  caption: string;
  hashtags: string[];
  cta: string;
}

export interface SocialContentItem {
  id: string;
  project_id: string;
  platform: SocialPlatform;
  format: ContentFormat;
  content: ReelScript | SocialPost | CarouselContent;
  based_on: {
    chapter_number?: number;
    character_name?: string;
    excerpt?: string;
  };
  created_at: string;
}

export interface SocialAddOn {
  platform: SocialPlatform;
  active: boolean;
  price_brl_cents: number;
}

export const SOCIAL_ADDON_PRICE_BRL_CENTS = 3900;
export const SOCIAL_ADDON_PRICE_USD_CENTS = 799;

// ── Auto Blog ─────────────────────────────────────────────────────────────────

export type BlogPostStatus = 'draft' | 'published' | 'scheduled';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  category: string;
  tags: string[];
  author_name: string;
  status: BlogPostStatus;
  seo_title: string;
  seo_description: string;
  cta_text: string;
  cta_url: string;
  published_at: string | null;
  created_at: string;
}

export interface BlogGenerationTopic {
  title: string;
  angle: string;
  target_keywords: string[];
  category: string;
}
