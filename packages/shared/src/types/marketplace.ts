// ── Distribution Channels ────────────────────────────────────────────────────

export type DistributionChannel =
  | 'manuscry_store'
  | 'amazon_kdp'
  | 'amazon_print'
  | 'audible'
  | 'apple_books'
  | 'google_play_books'
  | 'kobo'
  | 'mercado_livre'
  | 'estante_virtual'
  | 'ubk'
  | 'findaway_voices'
  | 'ingram_spark'
  | 'shopify';

export type DistributionStatus = 'pending' | 'submitted' | 'live' | 'rejected' | 'paused';

export interface ChannelInfo {
  id: DistributionChannel;
  name: string;
  type: 'ebook' | 'print' | 'audiobook' | 'marketplace';
  icon: string;
  commission_percent: number;
  description: string;
  region: 'global' | 'br' | 'us';
}

export const DISTRIBUTION_CHANNELS: ChannelInfo[] = [
  {
    id: 'manuscry_store',
    name: 'Manuscry Store',
    type: 'marketplace',
    icon: '\u{1F4DA}',
    commission_percent: 15,
    description: 'Vitrine oficial Manuscry — divulgamos e vendemos para você',
    region: 'global',
  },
  {
    id: 'amazon_kdp',
    name: 'Amazon KDP (Ebook)',
    type: 'ebook',
    icon: '\u{1F4D6}',
    commission_percent: 10,
    description: 'Kindle Store — maior marketplace de ebooks do mundo',
    region: 'global',
  },
  {
    id: 'amazon_print',
    name: 'Amazon KDP (Print)',
    type: 'print',
    icon: '\u{1F4D5}',
    commission_percent: 10,
    description: 'Impressão sob demanda via Amazon',
    region: 'global',
  },
  {
    id: 'audible',
    name: 'Audible / ACX',
    type: 'audiobook',
    icon: '\u{1F3A7}',
    commission_percent: 12,
    description: 'Maior plataforma de audiobooks (Amazon)',
    region: 'global',
  },
  {
    id: 'apple_books',
    name: 'Apple Books',
    type: 'ebook',
    icon: '\u{1F34E}',
    commission_percent: 10,
    description: 'Loja de livros da Apple — iPhone, iPad, Mac',
    region: 'global',
  },
  {
    id: 'google_play_books',
    name: 'Google Play Livros',
    type: 'ebook',
    icon: '\u{1F4F1}',
    commission_percent: 10,
    description: 'Google Play Store para Android',
    region: 'global',
  },
  {
    id: 'kobo',
    name: 'Kobo',
    type: 'ebook',
    icon: '\u{1F4D8}',
    commission_percent: 10,
    description: 'Plataforma internacional de ebooks + e-readers',
    region: 'global',
  },
  {
    id: 'mercado_livre',
    name: 'Mercado Livre',
    type: 'marketplace',
    icon: '\u{1F6D2}',
    commission_percent: 12,
    description: 'Maior marketplace da América Latina',
    region: 'br',
  },
  {
    id: 'estante_virtual',
    name: 'Estante Virtual',
    type: 'marketplace',
    icon: '\u{1F4DA}',
    commission_percent: 10,
    description: 'Maior sebo online do Brasil',
    region: 'br',
  },
  {
    id: 'ubk',
    name: 'UBK (Universo dos Livros)',
    type: 'ebook',
    icon: '\u{1F30E}',
    commission_percent: 10,
    description: 'Plataforma brasileira de ebooks',
    region: 'br',
  },
  {
    id: 'findaway_voices',
    name: 'Findaway Voices',
    type: 'audiobook',
    icon: '\u{1F399}\uFE0F',
    commission_percent: 12,
    description: 'Distribuição de audiobook para 40+ plataformas',
    region: 'global',
  },
  {
    id: 'ingram_spark',
    name: 'IngramSpark',
    type: 'print',
    icon: '\u{1F4E6}',
    commission_percent: 10,
    description: 'Distribuição para 40.000+ livrarias e bibliotecas',
    region: 'global',
  },
  {
    id: 'shopify',
    name: 'Shopify (Loja própria)',
    type: 'marketplace',
    icon: '\u{1F6CD}\uFE0F',
    commission_percent: 0,
    description: 'Sua loja Shopify — sem comissão Manuscry',
    region: 'global',
  },
];

// ── Distribution Settings per Project ────────────────────────────────────────

export interface ChannelDistribution {
  channel: DistributionChannel;
  opted_in: boolean;
  status: DistributionStatus;
  listing_url: string | null;
  price: string | null;
  submitted_at: string | null;
}

export interface DistributionConfig {
  opted_in_marketplace: boolean;
  channels: ChannelDistribution[];
  author_commission_percent: number;
  total_sales: number;
  total_revenue_cents: number;
  last_updated: string | null;
}

// ── Marketplace Listing (public) ─────────────────────────────────────────────

export interface MarketplaceListing {
  id: string;
  project_id: string;
  title: string;
  subtitle: string | null;
  author_name: string;
  genre: string;
  cover_image_url: string | null;
  price_usd: string;
  price_brl: string;
  description: string;
  word_count: number;
  page_count: number | null;
  rating: number | null;
  channels_available: DistributionChannel[];
  published_at: string;
}
