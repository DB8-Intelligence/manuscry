// ── Sales Analytics ──────────────────────────────────────────────────────────

export interface SalesByChannel {
  channel: string;
  channel_name: string;
  total_sales: number;
  revenue_cents: number;
  commission_cents: number;
  net_cents: number;
}

export interface SalesByPeriod {
  period: string;
  sales: number;
  revenue_cents: number;
  net_cents: number;
}

export interface SalesByBook {
  project_id: string;
  title: string;
  genre: string;
  total_sales: number;
  revenue_cents: number;
  cover_url: string | null;
}

export interface SalesOverview {
  total_revenue_cents: number;
  total_net_cents: number;
  total_commission_cents: number;
  total_sales: number;
  total_books_published: number;
  active_channels: number;
  currency: 'BRL' | 'USD';
  by_channel: SalesByChannel[];
  by_period: SalesByPeriod[];
  by_book: SalesByBook[];
  best_seller: SalesByBook | null;
  avg_price_cents: number;
}

// ── Book Performance ─────────────────────────────────────────────────────────

export interface MarketTrend {
  keyword: string;
  search_volume: string;
  trend: 'rising' | 'stable' | 'declining';
  competition: 'low' | 'medium' | 'high';
}

export interface CompetitorBook {
  title: string;
  author: string;
  bsr: number;
  rating: number;
  reviews: number;
  price: string;
}

export interface BookPerformance {
  project_id: string;
  title: string;
  genre: string;
  metrics: {
    total_sales: number;
    revenue_cents: number;
    avg_daily_sales: number;
    best_day_sales: number;
    conversion_rate: number;
    page_reads_ku: number;
  };
  market_trends: MarketTrend[];
  competitors: CompetitorBook[];
  recommendations: string[];
}

// ── Report ───────────────────────────────────────────────────────────────────

export interface ReportRequest {
  type: 'sales_summary' | 'book_performance' | 'royalty_statement' | 'full_report';
  period_start?: string;
  period_end?: string;
  project_id?: string;
}

export interface ReportMeta {
  title: string;
  generated_at: string;
  period: string;
  author_name: string;
}
