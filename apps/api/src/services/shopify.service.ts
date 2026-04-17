const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL || '';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || '';

interface ShopifyProductImage {
  src: string;
  alt: string;
  position: number;
}

interface ShopifyProductVariant {
  price: string;
  sku: string;
  inventory_management: string | null;
  requires_shipping: boolean;
  taxable: boolean;
  option1: string;
}

interface ShopifyProductInput {
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  images: ShopifyProductImage[];
  variants: ShopifyProductVariant[];
  metafields?: Array<{
    namespace: string;
    key: string;
    value: string;
    type: string;
  }>;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  status: string;
  variants: Array<{ id: number; price: string }>;
  images: Array<{ id: number; src: string }>;
}

async function shopifyFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  if (!SHOPIFY_STORE_URL || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error('Shopify not configured. Set SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN.');
  }

  const url = `${SHOPIFY_STORE_URL}/admin/api/2024-01/${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ errors: res.statusText })) as Record<string, unknown>;
    throw new Error(`Shopify API error: ${JSON.stringify(errBody.errors || errBody)}`);
  }

  return res.json() as Promise<T>;
}

export interface PublishToStoreInput {
  title: string;
  subtitle?: string;
  description_html: string;
  author_name: string;
  genre: string;
  cover_image_url: string | null;
  price_usd: string;
  price_brl: string;
  isbn?: string;
  page_count?: number;
  word_count?: number;
  tags: string[];
  manuscry_project_id: string;
}

export interface PublishToStoreResult {
  shopify_product_id: number;
  shopify_handle: string;
  store_url: string;
  status: string;
}

export async function publishBookToStore(
  input: PublishToStoreInput,
): Promise<PublishToStoreResult> {
  const product: ShopifyProductInput = {
    title: input.title,
    body_html: buildProductHtml(input),
    vendor: input.author_name,
    product_type: 'Book',
    tags: [
      input.genre,
      'Manuscry',
      'ebook',
      ...input.tags,
    ],
    images: input.cover_image_url
      ? [{ src: input.cover_image_url, alt: `Capa - ${input.title}`, position: 1 }]
      : [],
    variants: [
      {
        price: input.price_usd,
        sku: `MANUSCRY-${input.manuscry_project_id.slice(0, 8)}`,
        inventory_management: null,
        requires_shipping: false,
        taxable: true,
        option1: 'Ebook',
      },
    ],
    metafields: [
      { namespace: 'manuscry', key: 'project_id', value: input.manuscry_project_id, type: 'single_line_text_field' },
      { namespace: 'manuscry', key: 'author', value: input.author_name, type: 'single_line_text_field' },
      { namespace: 'manuscry', key: 'genre', value: input.genre, type: 'single_line_text_field' },
      ...(input.isbn ? [{ namespace: 'manuscry', key: 'isbn', value: input.isbn, type: 'single_line_text_field' }] : []),
      ...(input.word_count ? [{ namespace: 'manuscry', key: 'word_count', value: String(input.word_count), type: 'number_integer' }] : []),
    ],
  };

  const result = await shopifyFetch<{ product: ShopifyProduct }>('products.json', {
    method: 'POST',
    body: JSON.stringify({ product }),
  });

  const storeHost = SHOPIFY_STORE_URL.replace('https://', '').replace('/admin', '').replace('.myshopify.com', '');

  return {
    shopify_product_id: result.product.id,
    shopify_handle: result.product.handle,
    store_url: `https://${storeHost}.myshopify.com/products/${result.product.handle}`,
    status: result.product.status,
  };
}

function buildProductHtml(input: PublishToStoreInput): string {
  return `
<div class="manuscry-book">
  ${input.subtitle ? `<p><em>${input.subtitle}</em></p>` : ''}
  <div>${input.description_html}</div>
  <hr/>
  <p><strong>Autor:</strong> ${input.author_name}</p>
  <p><strong>Gênero:</strong> ${input.genre}</p>
  ${input.page_count ? `<p><strong>Páginas:</strong> ~${input.page_count}</p>` : ''}
  ${input.isbn ? `<p><strong>ISBN:</strong> ${input.isbn}</p>` : ''}
  <p><em>Criado com <a href="https://manuscry.ai">Manuscry</a> — Pipeline editorial com IA</em></p>
</div>`;
}

export function isShopifyConfigured(): boolean {
  return !!(SHOPIFY_STORE_URL && SHOPIFY_ACCESS_TOKEN);
}
