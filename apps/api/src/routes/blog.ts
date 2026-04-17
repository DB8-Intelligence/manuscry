import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../services/supabase.js';
import { generateStructured } from '../services/claude.service.js';
import { buildBlogPostPrompt, buildBlogTopicsPrompt } from '../services/prompts/social.prompt.js';
import type { BlogPost, BlogGenerationTopic } from '@manuscry/shared';

export const blogRouter = Router();

// ── PUBLIC ENDPOINTS ─────────────────────────────────────────────────────────

// GET /api/blog/posts — list published posts (public)
blogRouter.get('/posts', async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .select('id, slug, title, excerpt, category, tags, author_name, cover_image_url, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ posts: data || [] });
});

// GET /api/blog/posts/:slug — get a single post by slug (public)
blogRouter.get('/posts/:slug', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .select('*')
    .eq('slug', req.params.slug)
    .eq('status', 'published')
    .single();

  if (error) {
    res.status(error.code === 'PGRST116' ? 404 : 500).json({ error: 'Post not found' });
    return;
  }

  res.json({ post: data });
});

// ── ADMIN ENDPOINTS (require auth) ───────────────────────────────────────────

// POST /api/blog/generate-topics — AI generates 5 blog topics
blogRouter.post('/generate-topics', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { market } = req.body as { market?: 'pt-br' | 'en' };

  try {
    const { system, user } = buildBlogTopicsPrompt(market || 'pt-br');
    const result = await generateStructured<{ topics: BlogGenerationTopic[] }>(system, user, 2048);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/blog/generate — AI writes a full blog post from a topic
blogRouter.post('/generate', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { topic, market, autoPublish } = req.body as {
    topic: BlogGenerationTopic;
    market?: 'pt-br' | 'en';
    autoPublish?: boolean;
  };

  if (!topic?.title) {
    res.status(400).json({ error: 'topic com title é obrigatório' });
    return;
  }

  try {
    const { system, user } = buildBlogPostPrompt(topic, market || 'pt-br');
    const result = await generateStructured<Omit<BlogPost, 'id' | 'status' | 'published_at' | 'created_at' | 'author_name'>>(
      system, user, 8192,
    );

    const status = autoPublish ? 'published' : 'draft';
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .insert({
        slug: result.slug,
        title: result.title,
        excerpt: result.excerpt,
        content: result.content,
        cover_image_url: null,
        category: result.category,
        tags: result.tags,
        author_name: 'Manuscry Editorial',
        status,
        seo_title: result.seo_title,
        seo_description: result.seo_description,
        cta_text: result.cta_text || 'Experimente o Manuscry grátis',
        cta_url: result.cta_url || 'https://manuscry.ai',
        published_at: status === 'published' ? now : null,
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({ post: data });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/blog/auto-publish — automated: generate topics + write + publish
// Called by cron job or n8n webhook (uses internal API key, not user auth)
blogRouter.post('/auto-publish', async (req, res) => {
  const internalKey = req.headers['x-internal-key'];
  if (internalKey !== process.env.INTERNAL_API_KEY) {
    res.status(401).json({ error: 'Invalid internal key' });
    return;
  }

  const market = (req.body?.market || 'pt-br') as 'pt-br' | 'en';

  try {
    // Step 1: Generate topics
    const topicsPrompt = buildBlogTopicsPrompt(market);
    const topicsResult = await generateStructured<{ topics: BlogGenerationTopic[] }>(
      topicsPrompt.system, topicsPrompt.user, 2048,
    );

    if (!topicsResult.topics?.length) {
      res.status(500).json({ error: 'No topics generated' });
      return;
    }

    // Step 2: Pick first topic and write the article
    const topic = topicsResult.topics[0];
    const postPrompt = buildBlogPostPrompt(topic, market);
    const postResult = await generateStructured<Record<string, unknown>>(
      postPrompt.system, postPrompt.user, 8192,
    );

    const now = new Date().toISOString();

    // Step 3: Save and auto-publish
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .insert({
        slug: (postResult.slug as string) || topic.title.toLowerCase().replace(/\s+/g, '-').slice(0, 80),
        title: (postResult.title as string) || topic.title,
        excerpt: (postResult.excerpt as string) || '',
        content: (postResult.content as string) || '',
        cover_image_url: null,
        category: (postResult.category as string) || topic.category,
        tags: (postResult.tags as string[]) || topic.target_keywords,
        author_name: 'Manuscry Editorial',
        status: 'published',
        seo_title: (postResult.seo_title as string) || '',
        seo_description: (postResult.seo_description as string) || '',
        cta_text: (postResult.cta_text as string) || 'Experimente o Manuscry grátis',
        cta_url: (postResult.cta_url as string) || 'https://manuscry.ai',
        published_at: now,
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({
      published: true,
      post: { id: data.id, slug: data.slug, title: data.title },
      topics_generated: topicsResult.topics.length,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
