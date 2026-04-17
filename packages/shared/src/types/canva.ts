// ── Canva Integration ─────────────────────────────────────────────────────────

export interface CanvaDesignRequest {
  type: 'book_cover' | 'social_post' | 'carousel_slide' | 'back_cover' | 'bookmark' | 'banner';
  title: string;
  dimensions: { width: number; height: number };
  data: Record<string, string>;
}

export interface CanvaDesign {
  id: string;
  project_id: string;
  type: CanvaDesignRequest['type'];
  canva_design_id: string | null;
  canva_edit_url: string | null;
  canva_view_url: string | null;
  thumbnail_url: string | null;
  title: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export const CANVA_DESIGN_TEMPLATES: Array<{
  type: CanvaDesignRequest['type'];
  label: string;
  icon: string;
  description: string;
  dimensions: { width: number; height: number };
}> = [
  { type: 'book_cover', label: 'Capa do Livro', icon: '\u{1F4D6}', description: 'Capa profissional para KDP (1600x2560px)', dimensions: { width: 1600, height: 2560 } },
  { type: 'back_cover', label: 'Contracapa', icon: '\u{1F4D5}', description: 'Contracapa com sinopse e bio (1600x2560px)', dimensions: { width: 1600, height: 2560 } },
  { type: 'social_post', label: 'Post Instagram', icon: '\u{1F4F7}', description: 'Post quadrado para feed (1080x1080px)', dimensions: { width: 1080, height: 1080 } },
  { type: 'carousel_slide', label: 'Slide Carrossel', icon: '\u{1F4CA}', description: 'Slide de carrossel para Instagram (1080x1350px)', dimensions: { width: 1080, height: 1350 } },
  { type: 'bookmark', label: 'Marca-página', icon: '\u{1F516}', description: 'Marcador de livro para brindes (600x1800px)', dimensions: { width: 600, height: 1800 } },
  { type: 'banner', label: 'Banner Promoção', icon: '\u{1F3AC}', description: 'Banner horizontal para anúncios (1200x628px)', dimensions: { width: 1200, height: 628 } },
];
