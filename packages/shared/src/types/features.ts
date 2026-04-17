// ── 1. Genre Templates / Blueprint Library ───────────────────────────────────

export interface GenreTemplate {
  id: string;
  genre: string;
  genre_mode: 'fiction' | 'nonfiction';
  name: string;
  description: string;
  icon: string;
  tone: string;
  structure: string;
  chapter_count: number;
  word_target: number;
  audience: string;
  reference_books: string[];
  writing_tips: string[];
  market_notes: string;
}

export const GENRE_TEMPLATES: GenreTemplate[] = [
  {
    id: 'romance-contemporaneo', genre: 'Romance', genre_mode: 'fiction',
    name: 'Romance Contemporâneo', description: 'Histórias de amor no mundo atual com tensão emocional e final feliz',
    icon: '\u2764\uFE0F', tone: 'Acolhedor, intenso, emocional', structure: 'three_act',
    chapter_count: 24, word_target: 70000, audience: 'Mulheres 25-45, leitoras de Colleen Hoover e Nicholas Sparks',
    reference_books: ['É Assim que Acaba', 'A Culpa é das Estrelas', 'Me Chame Pelo Seu Nome'],
    writing_tips: ['Desenvolva a tensão sexual lentamente', 'Crie obstáculos reais ao relacionamento', 'O primeiro encontro deve ser memorável'],
    market_notes: 'Gênero mais vendido no KDP. Alto volume, alta competição. Diferencie pelo ângulo emocional.',
  },
  {
    id: 'dark-romance', genre: 'Dark Romance', genre_mode: 'fiction',
    name: 'Dark Romance', description: 'Romance com elementos sombrios, moralmente cinza, intenso',
    icon: '\u{1F5A4}', tone: 'Sombrio, intenso, provocativo', structure: 'three_act',
    chapter_count: 28, word_target: 80000, audience: 'Mulheres 20-35, leitoras de Penelope Douglas e Ana Huang',
    reference_books: ['Bully', 'Twisted Love', 'Haunting Adeline'],
    writing_tips: ['Protagonista com falhas profundas', 'Tensão constante entre desejo e perigo', 'Cenas de alta intensidade emocional'],
    market_notes: 'Nicho em alta no KDP. Leitores fiéis que consomem em série. BookTok drive forte.',
  },
  {
    id: 'thriller-psicologico', genre: 'Suspense / Thriller', genre_mode: 'fiction',
    name: 'Thriller Psicológico', description: 'Suspense com foco na mente do personagem, reviravoltas e paranoia',
    icon: '\u{1F50D}', tone: 'Tenso, claustrofóbico, imprevisível', structure: 'three_act',
    chapter_count: 30, word_target: 75000, audience: 'Adultos 30-55, leitores de Gillian Flynn e Paula Hawkins',
    reference_books: ['Gone Girl', 'A Garota no Trem', 'O Paciente Silencioso'],
    writing_tips: ['Narrador não confiável aumenta tensão', 'Plante pistas falsas', 'A reviravolta deve recontextualizar tudo'],
    market_notes: 'Demanda consistente. Boa performance em Kindle Unlimited. Capas escuras convertem bem.',
  },
  {
    id: 'fantasia-epica', genre: 'Fantasia', genre_mode: 'fiction',
    name: 'Fantasia Épica', description: 'Mundos complexos com sistemas de magia, política e aventura',
    icon: '\u{1F52E}', tone: 'Épico, imersivo, detalhado', structure: 'three_act',
    chapter_count: 32, word_target: 100000, audience: 'Jovens adultos 18-35, leitores de Brandon Sanderson e Sarah J. Maas',
    reference_books: ['O Nome do Vento', 'Corte de Espinhos e Rosas', 'Mistborn'],
    writing_tips: ['Sistema de magia deve ter regras claras', 'Mapa do mundo enriquece a experiência', 'Não explique tudo de uma vez'],
    market_notes: 'Leitores de alta fidelidade que compram séries inteiras. Word count alto é esperado.',
  },
  {
    id: 'autoajuda-transformacao', genre: 'Autoajuda', genre_mode: 'nonfiction',
    name: 'Autoajuda / Transformação Pessoal', description: 'Framework prático para mudança de vida com exercícios aplicáveis',
    icon: '\u{1F4A1}', tone: 'Inspiracional, prático, direto', structure: 'transformation_framework',
    chapter_count: 12, word_target: 45000, audience: 'Adultos 25-50 buscando mudança, crescimento pessoal',
    reference_books: ['Hábitos Atômicos', 'O Poder do Hábito', 'Mindset'],
    writing_tips: ['Abra com uma história pessoal', 'Cada capítulo deve ter exercícios práticos', 'Use dados e pesquisas para embasar'],
    market_notes: 'Maior categoria não-ficção no KDP. Subtítulo com promessa específica vende mais.',
  },
  {
    id: 'negocios-empreendedorismo', genre: 'Negócios', genre_mode: 'nonfiction',
    name: 'Negócios / Empreendedorismo', description: 'Estratégias de negócio com cases reais e frameworks aplicáveis',
    icon: '\u{1F4C8}', tone: 'Profissional, estratégico, inspirador', structure: 'transformation_framework',
    chapter_count: 10, word_target: 40000, audience: 'Empreendedores 25-45, profissionais em transição de carreira',
    reference_books: ['De Zero a Um', 'A Startup Enxuta', 'Sem Filtro'],
    writing_tips: ['Use cases de empresas reais', 'Frameworks visuais aumentam retenção', 'Termine cada capítulo com action items'],
    market_notes: 'Forte no mercado EN. PT-BR em crescimento. Posicione como autoridade do nicho.',
  },
  {
    id: 'saude-bemestar', genre: 'Saúde / Bem-estar', genre_mode: 'nonfiction',
    name: 'Saúde e Bem-Estar', description: 'Guias práticos de saúde, nutrição, exercícios ou bem-estar mental',
    icon: '\u{1F33F}', tone: 'Acolhedor, baseado em evidências, prático', structure: 'transformation_framework',
    chapter_count: 10, word_target: 35000, audience: 'Adultos 30-55, interessados em saúde preventiva e qualidade de vida',
    reference_books: ['O Código da Obesidade', 'Por que Dormimos', 'Dieta da Mente'],
    writing_tips: ['Cite estudos científicos', 'Inclua planos de ação semanais', 'Use antes/depois para motivar'],
    market_notes: 'Mercado perene (evergreen). Nichos específicos vendem melhor que genéricos.',
  },
  {
    id: 'terror-horror', genre: 'Terror / Horror', genre_mode: 'fiction',
    name: 'Terror / Horror', description: 'Atmosfera sombria, medo psicológico e tensão crescente',
    icon: '\u{1F47B}', tone: 'Sombrio, perturbador, atmosférico', structure: 'three_act',
    chapter_count: 20, word_target: 60000, audience: 'Adultos 18-40, fãs de Stephen King e Shirley Jackson',
    reference_books: ['It: A Coisa', 'A Assombração de Hill House', 'O Iluminado'],
    writing_tips: ['O medo do desconhecido é mais forte que o monstro visível', 'Use os 5 sentidos', 'Tensão > gore'],
    market_notes: 'Nicho dedicado com leitores vorazes. Halloween gera pico de vendas.',
  },
  {
    id: 'infantil', genre: 'Infantil', genre_mode: 'fiction',
    name: 'Livro Infantil', description: 'Histórias com linguagem adequada, lições de vida e ilustrações',
    icon: '\u{2B50}', tone: 'Leve, divertido, educativo', structure: 'three_act',
    chapter_count: 8, word_target: 5000, audience: 'Crianças 4-10 anos (comprado por pais 28-45)',
    reference_books: ['O Pequeno Príncipe', 'Diário de um Banana', 'A Parte que Falta'],
    writing_tips: ['Vocabulário simples mas não condescendente', 'Repetição ajuda na memorização', 'Moral clara mas não forçada'],
    market_notes: 'Low content = produção rápida. Capas coloridas e ilustrações são essenciais.',
  },
  {
    id: 'lead-magnet', genre: 'Lead Magnet', genre_mode: 'nonfiction',
    name: 'Lead Magnet / Ebook Curto', description: 'Ebook curto para captura de leads e funil de vendas',
    icon: '\u{26A1}', tone: 'Direto, prático, orientado a ação', structure: 'transformation_framework',
    chapter_count: 5, word_target: 8000, audience: 'Empreendedores digitais, coaches, consultores',
    reference_books: ['Expert Secrets', 'DotCom Secrets'],
    writing_tips: ['Resolva 1 problema específico', 'CTA claro para o produto pago', 'Entregue valor real (não só teaser)'],
    market_notes: 'Não é para venda direta — é para funil. Converte tráfego em leads qualificados.',
  },
];

// ── 2. Book Preview ──────────────────────────────────────────────────────────

export interface BookPreviewData {
  project_id: string;
  title: string;
  author_name: string;
  cover_url: string | null;
  preview_chapters: Array<{
    number: number;
    title: string;
    excerpt: string;
  }>;
  total_chapters: number;
  total_words: number;
  genre: string;
}

// ── 3. Book Series ───────────────────────────────────────────────────────────

export interface BookSeries {
  id: string;
  user_id: string;
  name: string;
  description: string;
  genre: string;
  shared_book_bible_id: string | null;
  volumes: SeriesVolume[];
  created_at: string;
}

export interface SeriesVolume {
  volume_number: number;
  project_id: string;
  title: string;
  status: string;
}

// ── 4. Translation ───────────────────────────────────────────────────────────

export type TranslationDirection = 'pt-br_to_en' | 'en_to_pt-br';
export type TranslationStatus = 'pending' | 'translating' | 'completed' | 'failed';

export interface TranslationJob {
  id: string;
  project_id: string;
  source_language: 'pt-br' | 'en';
  target_language: 'pt-br' | 'en';
  status: TranslationStatus;
  translated_project_id: string | null;
  chapters_translated: number;
  total_chapters: number;
  price_cents: number;
  created_at: string;
  completed_at: string | null;
}

export const TRANSLATION_PRICE_BRL_CENTS = 4900;
export const TRANSLATION_PRICE_USD_CENTS = 999;

// ── 5. Affiliate Program ─────────────────────────────────────────────────────

export interface AffiliateInfo {
  affiliate_code: string;
  referral_url: string;
  commission_percent: number;
  total_referrals: number;
  total_earnings_cents: number;
  pending_payout_cents: number;
  referrals: AffiliateReferral[];
}

export interface AffiliateReferral {
  referred_email_masked: string;
  plan: string;
  signed_up_at: string;
  commission_cents: number;
  status: 'active' | 'cancelled';
}

export const AFFILIATE_COMMISSION_PERCENT = 20;
