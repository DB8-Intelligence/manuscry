import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../services/supabase.js';
import { generateStructured } from '../services/claude.service.js';
import { buildBookPerformancePrompt } from '../services/prompts/analytics.prompt.js';
import { generateSalesReportPdf } from '../services/report.service.js';
import type {
  Phase1Data, Phase2Data, Phase4Data, Phase5Data, BiographyData,
} from '@manuscry/shared';
import type {
  SalesOverview, SalesByChannel, SalesByBook, SalesByPeriod,
  BookPerformance, ReportMeta,
} from '@manuscry/shared';
import { DISTRIBUTION_CHANNELS, type DistributionConfig, type ChannelDistribution } from '@manuscry/shared';

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

// GET /api/analytics/sales — full sales overview
analyticsRouter.get('/sales', async (req: AuthenticatedRequest, res) => {
  try {
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('id, name, genre, phase_1_data, phase_2_data, phase_4_data, phase_5_data')
      .eq('user_id', req.userId!)
      .eq('status', 'published');

    const byChannel: Record<string, SalesByChannel> = {};
    const byBook: SalesByBook[] = [];
    let totalSales = 0;
    let totalRevenue = 0;
    let totalCommission = 0;
    let activeChannels = 0;

    for (const p of projects || []) {
      const bible = (p.phase_2_data || {}) as Record<string, string>;
      const p4 = p.phase_4_data as Phase4Data | null;
      const p5 = p.phase_5_data as unknown as (Phase5Data & { distribution?: DistributionConfig }) | null;
      const dist = p5?.distribution;
      const selectedCover = p5?.covers?.covers?.find((c) => c.selected);

      const bookSales = dist?.total_sales || 0;
      const bookRevenue = dist?.total_revenue_cents || 0;
      totalSales += bookSales;
      totalRevenue += bookRevenue;

      if (bookSales > 0 || dist) {
        byBook.push({
          project_id: p.id,
          title: bible.title || p.name,
          genre: p.genre || 'Geral',
          total_sales: bookSales,
          revenue_cents: bookRevenue,
          cover_url: selectedCover?.image_url || null,
        });
      }

      for (const ch of dist?.channels || []) {
        const typedCh = ch as ChannelDistribution;
        if (!typedCh.opted_in) continue;
        if (typedCh.status === 'live') activeChannels++;

        const info = DISTRIBUTION_CHANNELS.find((c) => c.id === typedCh.channel);
        if (!byChannel[typedCh.channel]) {
          byChannel[typedCh.channel] = {
            channel: typedCh.channel,
            channel_name: info?.name || typedCh.channel,
            total_sales: 0,
            revenue_cents: 0,
            commission_cents: 0,
            net_cents: 0,
          };
        }
      }
    }

    totalCommission = Math.round(totalRevenue * 0.12);
    const totalNet = totalRevenue - totalCommission;

    // Generate mock monthly periods for now
    const now = new Date();
    const periods: SalesByPeriod[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      periods.push({
        period: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        sales: 0,
        revenue_cents: 0,
        net_cents: 0,
      });
    }

    const overview: SalesOverview = {
      total_revenue_cents: totalRevenue,
      total_net_cents: totalNet,
      total_commission_cents: totalCommission,
      total_sales: totalSales,
      total_books_published: (projects || []).length,
      active_channels: activeChannels,
      currency: 'BRL',
      by_channel: Object.values(byChannel),
      by_period: periods,
      by_book: byBook.sort((a, b) => b.total_sales - a.total_sales),
      best_seller: byBook.length > 0 ? byBook.sort((a, b) => b.total_sales - a.total_sales)[0] : null,
      avg_price_cents: totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0,
    };

    res.json(overview);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/analytics/performance/:projectId — AI market analysis for a book
analyticsRouter.get('/performance/:projectId', async (req: AuthenticatedRequest, res) => {
  try {
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', req.params.projectId)
      .eq('user_id', req.userId!)
      .single();

    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

    const bible = (project.phase_2_data || {}) as Record<string, string>;
    const p4 = project.phase_4_data as Phase4Data | null;
    const p5 = project.phase_5_data as unknown as (Phase5Data & { distribution?: DistributionConfig }) | null;
    const market = (project.market || 'pt-br') as 'pt-br' | 'en';

    const { system, user } = buildBookPerformancePrompt(
      bible.title || project.name, project.genre || 'Fiction', market,
    );
    const analysis = await generateStructured<{
      market_trends: BookPerformance['market_trends'];
      competitors: BookPerformance['competitors'];
      recommendations: string[];
    }>(system, user, 4096);

    const dist = p5?.distribution;
    const totalSales = dist?.total_sales || 0;
    const totalRevenue = dist?.total_revenue_cents || 0;

    const performance: BookPerformance = {
      project_id: project.id,
      title: bible.title || project.name,
      genre: project.genre || 'Geral',
      metrics: {
        total_sales: totalSales,
        revenue_cents: totalRevenue,
        avg_daily_sales: totalSales > 0 ? totalSales / 30 : 0,
        best_day_sales: 0,
        conversion_rate: 0,
        page_reads_ku: 0,
      },
      market_trends: analysis.market_trends,
      competitors: analysis.competitors,
      recommendations: analysis.recommendations,
    };

    res.json(performance);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/analytics/report — generate PDF report
analyticsRouter.post('/report', async (req: AuthenticatedRequest, res) => {
  const { type } = req.body as { type: string };

  try {
    // Fetch user info
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('full_name, email, author_profile')
      .eq('id', req.userId!)
      .single();

    const authorProfile = (user?.author_profile || {}) as Record<string, unknown>;
    const bioData = authorProfile.distribution_agreement ? user?.full_name : 'Autor';

    // Fetch sales overview
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('id, name, genre, phase_2_data, phase_4_data, phase_5_data')
      .eq('user_id', req.userId!)
      .eq('status', 'published');

    const byBook: SalesByBook[] = [];
    let totalRevenue = 0;
    let totalSales = 0;

    for (const p of projects || []) {
      const bible = (p.phase_2_data || {}) as Record<string, string>;
      const p5 = p.phase_5_data as unknown as (Phase5Data & { distribution?: DistributionConfig }) | null;
      const dist = p5?.distribution;
      const selectedCover = p5?.covers?.covers?.find((c) => c.selected);

      totalSales += dist?.total_sales || 0;
      totalRevenue += dist?.total_revenue_cents || 0;

      byBook.push({
        project_id: p.id,
        title: bible.title || p.name,
        genre: p.genre || 'Geral',
        total_sales: dist?.total_sales || 0,
        revenue_cents: dist?.total_revenue_cents || 0,
        cover_url: selectedCover?.image_url || null,
      });
    }

    const totalCommission = Math.round(totalRevenue * 0.12);

    const overview: SalesOverview = {
      total_revenue_cents: totalRevenue,
      total_net_cents: totalRevenue - totalCommission,
      total_commission_cents: totalCommission,
      total_sales: totalSales,
      total_books_published: (projects || []).length,
      active_channels: 0,
      currency: 'BRL',
      by_channel: [],
      by_period: [],
      by_book: byBook,
      best_seller: byBook.length > 0 ? byBook.sort((a, b) => b.total_sales - a.total_sales)[0] : null,
      avg_price_cents: totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0,
    };

    const meta: ReportMeta = {
      title: 'Relatório de Vendas e Performance',
      generated_at: new Date().toISOString(),
      period: `${new Date().getFullYear()}`,
      author_name: user?.full_name || user?.email || 'Autor',
    };

    const pdfBuffer = await generateSalesReportPdf(meta, overview, []);

    const filename = `manuscry-relatorio-${new Date().toISOString().slice(0, 10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
