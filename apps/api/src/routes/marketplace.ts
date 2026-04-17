import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../services/supabase.js';
import type {
  Phase1Data, Phase2Data, Phase4Data, Phase5Data,
  BiographyData, BookDesignData,
} from '@manuscry/shared';
import {
  DISTRIBUTION_CHANNELS,
  type DistributionConfig, type ChannelDistribution, type DistributionChannel,
  type MarketplaceListing,
} from '@manuscry/shared';

export const marketplaceRouter = Router();

// ── PUBLIC ENDPOINTS ─────────────────────────────────────────────────────────

// GET /api/marketplace/listings — public storefront
marketplaceRouter.get('/listings', async (_req, res) => {
  try {
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('id, name, genre, market, phase_1_data, phase_2_data, phase_4_data, phase_5_data, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(50);

    const listings: MarketplaceListing[] = (projects || [])
      .filter((p) => {
        const p5 = p.phase_5_data as unknown as Phase5Data | null;
        const dist = (p5 as unknown as Record<string, unknown>)?.distribution as DistributionConfig | undefined;
        return dist?.opted_in_marketplace;
      })
      .map((p) => {
        const bible = (p.phase_2_data || {}) as Record<string, string>;
        const p1 = p.phase_1_data as Phase1Data | null;
        const p4 = p.phase_4_data as Phase4Data | null;
        const p5 = p.phase_5_data as unknown as Phase5Data | null;
        const bio = p5?.biography as BiographyData | null;
        const design = p5?.design as BookDesignData | null;
        const selectedCover = p5?.covers?.covers?.find((c) => c.selected);
        const dist = (p5 as unknown as Record<string, unknown>)?.distribution as DistributionConfig | undefined;

        return {
          id: `listing-${p.id}`,
          project_id: p.id,
          title: bible.title || p.name,
          subtitle: bible.subtitle || null,
          author_name: bio?.author_name || 'Autor',
          genre: p.genre || 'Geral',
          cover_image_url: selectedCover?.image_url || null,
          price_usd: p1?.book_profile?.price_range_usd?.split('-')[0]?.trim() || '$9.99',
          price_brl: p1?.book_profile?.price_range_brl?.split('-')[0]?.trim() || 'R$29,90',
          description: bible.synopsis || '',
          word_count: p4?.total_words_written || 0,
          page_count: design?.interior?.estimated_page_count || null,
          rating: null,
          channels_available: (dist?.channels || [])
            .filter((ch: ChannelDistribution) => ch.opted_in && ch.status === 'live')
            .map((ch: ChannelDistribution) => ch.channel),
          published_at: p.updated_at,
        };
      });

    res.json({ listings, total: listings.length });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/marketplace/channels — list all distribution channels
marketplaceRouter.get('/channels', (_req, res) => {
  res.json({ channels: DISTRIBUTION_CHANNELS });
});

// ── AUTHOR ENDPOINTS (require auth) ─────────────────────────────────────────

// GET /api/marketplace/distribution/:projectId — get distribution config
marketplaceRouter.get('/distribution/:projectId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('phase_5_data')
      .eq('id', req.params.projectId)
      .eq('user_id', req.userId!)
      .single();

    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

    const p5 = (project.phase_5_data || {}) as Record<string, unknown>;
    const dist = (p5.distribution || null) as DistributionConfig | null;

    res.json({
      distribution: dist || {
        opted_in_marketplace: false,
        channels: DISTRIBUTION_CHANNELS.map((ch) => ({
          channel: ch.id,
          opted_in: false,
          status: 'pending' as const,
          listing_url: null,
          price: null,
          submitted_at: null,
        })),
        author_commission_percent: 100 - 15,
        total_sales: 0,
        total_revenue_cents: 0,
        last_updated: null,
      },
      channels_info: DISTRIBUTION_CHANNELS,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/marketplace/distribution/opt-in — opt into distribution channels
marketplaceRouter.post('/distribution/opt-in', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { projectId, selectedChannels, prices } = req.body as {
    projectId: string;
    selectedChannels: DistributionChannel[];
    prices?: Record<string, string>;
  };

  if (!projectId || !selectedChannels?.length) {
    res.status(400).json({ error: 'projectId e selectedChannels obrigatórios' });
    return;
  }

  try {
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('phase_5_data')
      .eq('id', projectId)
      .eq('user_id', req.userId!)
      .single();

    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

    const p5 = (project.phase_5_data || {}) as Phase5Data & { distribution?: DistributionConfig };

    const channels: ChannelDistribution[] = DISTRIBUTION_CHANNELS.map((ch) => ({
      channel: ch.id,
      opted_in: selectedChannels.includes(ch.id),
      status: selectedChannels.includes(ch.id) ? 'submitted' as const : 'pending' as const,
      listing_url: null,
      price: prices?.[ch.id] || null,
      submitted_at: selectedChannels.includes(ch.id) ? new Date().toISOString() : null,
    }));

    const manuscryChannel = selectedChannels.find((ch) => ch === 'manuscry_store');
    const maxCommission = selectedChannels.reduce((max, chId) => {
      const info = DISTRIBUTION_CHANNELS.find((c) => c.id === chId);
      return Math.max(max, info?.commission_percent || 0);
    }, 0);

    const distribution: DistributionConfig = {
      opted_in_marketplace: !!manuscryChannel || selectedChannels.length > 0,
      channels,
      author_commission_percent: 100 - maxCommission,
      total_sales: p5.distribution?.total_sales || 0,
      total_revenue_cents: p5.distribution?.total_revenue_cents || 0,
      last_updated: new Date().toISOString(),
    };

    await supabaseAdmin
      .from('projects')
      .update({
        phase_5_data: { ...p5, distribution },
        status: 'published',
      })
      .eq('id', projectId);

    res.json({
      distribution,
      message: `Livro submetido para ${selectedChannels.length} canal(is) de distribuição.`,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
