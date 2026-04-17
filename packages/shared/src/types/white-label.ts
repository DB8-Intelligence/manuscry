// ── White Label for Publishers ────────────────────────────────────────────────

export interface WhiteLabelConfig {
  enabled: boolean;
  tenant_id: string;
  brand: {
    name: string;
    logo_url: string | null;
    favicon_url: string | null;
    primary_color: string;
    secondary_color: string;
    tagline: string;
  };
  domain: {
    custom_domain: string | null;
    subdomain: string | null;
  };
  features: {
    hide_manuscry_branding: boolean;
    custom_email_from: string | null;
    custom_support_email: string | null;
    max_authors: number;
    custom_landing_page: boolean;
  };
  billing: {
    own_stripe_account: boolean;
    stripe_account_id: string | null;
    revenue_share_percent: number;
  };
}

export interface TenantAuthor {
  user_id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'author';
  invited_at: string;
  active: boolean;
}

export interface TenantDashboard {
  tenant_id: string;
  brand_name: string;
  total_authors: number;
  total_books: number;
  total_published: number;
  total_revenue_cents: number;
  authors: TenantAuthor[];
}

export const WHITE_LABEL_DEFAULTS: WhiteLabelConfig = {
  enabled: false,
  tenant_id: '',
  brand: {
    name: 'Manuscry',
    logo_url: null,
    favicon_url: null,
    primary_color: '#1E3A8A',
    secondary_color: '#F59E0B',
    tagline: 'Do conceito ao livro publicado',
  },
  domain: {
    custom_domain: null,
    subdomain: null,
  },
  features: {
    hide_manuscry_branding: false,
    custom_email_from: null,
    custom_support_email: null,
    max_authors: 10,
    custom_landing_page: false,
  },
  billing: {
    own_stripe_account: false,
    stripe_account_id: null,
    revenue_share_percent: 20,
  },
};
