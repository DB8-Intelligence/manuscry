import type { CanvaDesign, CanvaDesignRequest } from '@manuscry/shared';

const CANVA_API_BASE = 'https://api.canva.com/rest/v1';
const CANVA_ACCESS_TOKEN = process.env.CANVA_ACCESS_TOKEN || '';
const CANVA_BRAND_TEMPLATE_MAP: Record<string, string> = {};

async function canvaFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  if (!CANVA_ACCESS_TOKEN) {
    throw new Error('CANVA_ACCESS_TOKEN not configured');
  }

  const res = await fetch(`${CANVA_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${CANVA_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText })) as Record<string, unknown>;
    throw new Error(`Canva API: ${body.message || res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function createCanvaDesign(
  request: CanvaDesignRequest,
): Promise<{ design_id: string; edit_url: string }> {
  const result = await canvaFetch<{
    design: { id: string; urls: { edit_url: string; view_url: string } };
  }>('/designs', {
    method: 'POST',
    body: JSON.stringify({
      design_type: 'custom',
      title: request.title,
      width: request.dimensions.width,
      height: request.dimensions.height,
    }),
  });

  return {
    design_id: result.design.id,
    edit_url: result.design.urls.edit_url,
  };
}

export async function getCanvaDesign(designId: string): Promise<{
  id: string;
  title: string;
  thumbnail_url: string | null;
  edit_url: string;
  view_url: string;
}> {
  const result = await canvaFetch<{
    design: {
      id: string;
      title: string;
      thumbnail: { url: string } | null;
      urls: { edit_url: string; view_url: string };
    };
  }>(`/designs/${designId}`);

  return {
    id: result.design.id,
    title: result.design.title,
    thumbnail_url: result.design.thumbnail?.url || null,
    edit_url: result.design.urls.edit_url,
    view_url: result.design.urls.view_url,
  };
}

export function isCanvaConfigured(): boolean {
  return !!CANVA_ACCESS_TOKEN;
}

export function buildCanvaEditUrl(
  designType: CanvaDesignRequest['type'],
  bookTitle: string,
  dimensions: { width: number; height: number },
): string {
  const params = new URLSearchParams({
    'create': 'true',
    'category': designType === 'book_cover' ? 'book-covers' : 'social-media',
    'width': String(dimensions.width),
    'height': String(dimensions.height),
    'title': bookTitle,
  });
  return `https://www.canva.com/design?${params.toString()}`;
}
