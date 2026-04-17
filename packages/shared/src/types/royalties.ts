// ── Author Agreement ─────────────────────────────────────────────────────────

export interface AuthorAgreement {
  accepted: boolean;
  accepted_at: string | null;
  version: string;
  terms: {
    royalty_schedule: string;
    payment_terms: string;
    minimum_payout_brl: number;
    minimum_payout_usd: number;
    platform_delays: PlatformPaymentDelay[];
  };
}

export interface PlatformPaymentDelay {
  platform: string;
  delay_days: number;
  description: string;
}

export const PLATFORM_PAYMENT_DELAYS: PlatformPaymentDelay[] = [
  { platform: 'Amazon KDP', delay_days: 60, description: 'KDP paga 60 dias após o mês da venda' },
  { platform: 'Apple Books', delay_days: 45, description: 'Apple paga ~45 dias após o mês da venda' },
  { platform: 'Google Play', delay_days: 30, description: 'Google paga no mês seguinte à venda' },
  { platform: 'Kobo', delay_days: 45, description: 'Kobo paga ~45 dias após o mês da venda' },
  { platform: 'Audible/ACX', delay_days: 60, description: 'ACX paga 60 dias após o mês da venda' },
  { platform: 'IngramSpark', delay_days: 90, description: 'Ingram paga 90 dias após o mês da venda' },
  { platform: 'Mercado Livre', delay_days: 14, description: 'ML libera 14 dias após a venda' },
  { platform: 'Findaway', delay_days: 45, description: 'Findaway paga ~45 dias após o período' },
  { platform: 'Manuscry Store', delay_days: 30, description: 'Manuscry paga no mês seguinte à venda' },
];

export const AGREEMENT_VERSION = '1.0';

export const AGREEMENT_TERMS = `TERMOS DE DISTRIBUIÇÃO E ROYALTIES — MANUSCRY

1. DISTRIBUIÇÃO
O Autor autoriza a Manuscry a distribuir sua obra nas plataformas selecionadas.
A Manuscry atua como intermediária, submetendo os arquivos e gerenciando as listagens.

2. ROYALTIES
O Autor recebe o valor líquido da venda, deduzida a comissão da Manuscry por canal:
- Manuscry Store: 15% | Amazon/Apple/Kobo/Google: 10%
- Audible/Findaway: 12% | Mercado Livre: 12% | Shopify: 0%

3. PRAZO DE PAGAMENTO
Os pagamentos seguem os prazos de cada plataforma de venda:
- Amazon KDP: 60 dias após o mês da venda
- Apple Books / Kobo: 45 dias após o mês da venda
- Google Play: 30 dias após o mês da venda
- Audible/ACX: 60 dias após o mês da venda
- IngramSpark: 90 dias após o mês da venda
- Mercado Livre: 14 dias após a venda
- Manuscry Store: 30 dias após o mês da venda

A Manuscry repassará ao Autor em até 5 dias úteis após o recebimento.

4. VALOR MÍNIMO
Pagamentos serão acumulados até atingir o mínimo:
- R$ 50,00 para contas brasileiras
- US$ 25,00 para contas internacionais

5. DADOS BANCÁRIOS
O Autor deve manter seus dados bancários atualizados no Dashboard.
A Manuscry não se responsabiliza por pagamentos não realizados
devido a dados incorretos ou desatualizados.

6. CANCELAMENTO
O Autor pode solicitar a remoção das plataformas a qualquer momento.
Vendas já realizadas serão pagas conforme os prazos acima.`;

// ── Bank Account ─────────────────────────────────────────────────────────────

export type BankAccountType = 'checking' | 'savings';
export type BankCountry = 'BR' | 'US' | 'OTHER';

export interface BankAccount {
  country: BankCountry;
  holder_name: string;
  document: string;
  bank_name: string;
  bank_code: string;
  agency: string;
  account_number: string;
  account_type: BankAccountType;
  pix_key: string | null;
  verified: boolean;
  updated_at: string | null;
}

// ── Royalty Statements ───────────────────────────────────────────────────────

export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';

export interface RoyaltySale {
  id: string;
  project_id: string;
  book_title: string;
  channel: string;
  sale_date: string;
  quantity: number;
  gross_amount_cents: number;
  commission_percent: number;
  commission_cents: number;
  net_amount_cents: number;
  currency: 'BRL' | 'USD';
}

export interface RoyaltyStatement {
  period: string;
  total_sales: number;
  gross_revenue_cents: number;
  total_commission_cents: number;
  net_revenue_cents: number;
  currency: 'BRL' | 'USD';
  sales: RoyaltySale[];
  payout_status: PayoutStatus;
  payout_date: string | null;
  expected_payout_date: string | null;
}

export interface RoyaltySummary {
  total_earnings_cents: number;
  pending_payout_cents: number;
  last_payout_cents: number;
  last_payout_date: string | null;
  total_books_sold: number;
  active_channels: number;
  currency: 'BRL' | 'USD';
}
