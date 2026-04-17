// ── Public API Keys ──────────────────────────────────────────────────────────

export type ApiKeyScope =
  | 'read:projects'
  | 'write:projects'
  | 'read:books'
  | 'write:books'
  | 'read:analytics'
  | 'write:webhooks';

export interface PublicApiKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  scopes: ApiKeyScope[];
  rate_limit_per_minute: number;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  revoked: boolean;
}

export interface ApiKeyCreated extends Omit<PublicApiKey, 'key_hash'> {
  full_key: string;
}

export interface ApiKeyUsage {
  requests_today: number;
  requests_this_month: number;
  last_request: string | null;
  error_rate_percent: number;
}

// ── Webhooks ─────────────────────────────────────────────────────────────────

export type WebhookEvent =
  | 'project.created'
  | 'project.updated'
  | 'project.published'
  | 'chapter.written'
  | 'book.published'
  | 'sale.created';

export interface Webhook {
  id: string;
  user_id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
  last_delivered_at: string | null;
  created_at: string;
}

export const AVAILABLE_SCOPES: Array<{ id: ApiKeyScope; label: string; description: string }> = [
  { id: 'read:projects', label: 'Ler projetos', description: 'Listar e consultar detalhes dos projetos' },
  { id: 'write:projects', label: 'Criar/editar projetos', description: 'Criar novos projetos e atualizar existentes' },
  { id: 'read:books', label: 'Ler livros', description: 'Acessar conteúdo de capítulos e metadados' },
  { id: 'write:books', label: 'Gerar conteúdo', description: 'Rodar fases do pipeline (custo em créditos)' },
  { id: 'read:analytics', label: 'Ler analytics', description: 'Consultar vendas e performance' },
  { id: 'write:webhooks', label: 'Gerenciar webhooks', description: 'Criar/remover webhooks' },
];

export const AVAILABLE_WEBHOOK_EVENTS: Array<{ id: WebhookEvent; label: string }> = [
  { id: 'project.created', label: 'Projeto criado' },
  { id: 'project.updated', label: 'Projeto atualizado' },
  { id: 'project.published', label: 'Projeto publicado' },
  { id: 'chapter.written', label: 'Capítulo escrito' },
  { id: 'book.published', label: 'Livro publicado' },
  { id: 'sale.created', label: 'Venda realizada' },
];
