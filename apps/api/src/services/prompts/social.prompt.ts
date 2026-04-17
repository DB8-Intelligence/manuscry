import type { ContentFormat, SocialPlatform } from '@manuscry/shared';

export function buildSocialContentPrompt(
  format: ContentFormat,
  platform: SocialPlatform,
  bookBible: Record<string, unknown>,
  context: {
    chapterExcerpt?: string;
    characterName?: string;
    customAngle?: string;
  },
  market: 'pt-br' | 'en',
): { system: string; user: string } {
  const lang = market === 'pt-br' ? 'português brasileiro' : 'English';

  const platformGuidelines: Record<SocialPlatform, string> = {
    instagram: 'Instagram: visual first, hashtags 20-30, caption até 2200 chars, reels 15-90s',
    tiktok: 'TikTok: hook nos primeiros 2s, trending sounds, 15-60s, hashtags 3-5',
    twitter: 'Twitter/X: 280 chars max, threads para conteúdo longo, 1-3 hashtags',
    facebook: 'Facebook: texto mais longo ok, storytelling, grupos, compartilhável',
    linkedin: 'LinkedIn: tom profissional, thought leadership, 1-3 hashtags, storytelling pessoal',
  };

  const system = `Você é um social media manager especializado em marketing editorial.
Cria conteúdo que transforma livros em marcas pessoais para autores.
Cada peça deve gerar engajamento E direcionar para a compra do livro.
Escreva em ${lang}.
Plataforma: ${platformGuidelines[platform]}
Retorne APENAS JSON válido.`;

  const formatInstructions: Record<ContentFormat, string> = {
    reel: `Crie um roteiro de Reel/TikTok. Retorne este JSON:
{
  "hook": "frase de gancho nos primeiros 2 segundos — IMPACTANTE",
  "scenes": [
    {
      "visual": "descrição do que aparece na tela",
      "narration": "texto narrado ou legenda",
      "duration_seconds": 5,
      "text_overlay": "texto que aparece sobre o vídeo"
    }
  ],
  "cta": "chamada para ação final (link na bio, etc)",
  "music_suggestion": "estilo de música ou trending sound",
  "hashtags": ["hashtag1", "hashtag2"],
  "total_duration_seconds": 30
}`,
    post: `Crie um post para ${platform}. Retorne este JSON:
{
  "text": "texto do post completo com emojis estratégicos e quebras de linha",
  "hashtags": ["hashtag1", "hashtag2"],
  "emoji_strategy": "quais emojis e por quê",
  "best_time": "melhor horário sugerido para postar",
  "cta": "chamada para ação"
}`,
    carousel: `Crie um carrossel (5-10 slides). Retorne este JSON:
{
  "title": "título do carrossel (slide 1)",
  "slides": [
    {
      "slide_number": 1,
      "headline": "texto grande do slide",
      "body": "texto menor complementar",
      "visual_suggestion": "sugestão de imagem ou cor de fundo"
    }
  ],
  "caption": "legenda do post",
  "hashtags": ["hashtag1"],
  "cta": "chamada para ação no último slide"
}`,
    story: `Crie uma sequência de Stories (3-5). Retorne este JSON:
{
  "text": "texto principal do story",
  "hashtags": [],
  "emoji_strategy": "uso de emojis",
  "best_time": "horário sugerido",
  "cta": "swipe up ou link na bio"
}`,
  };

  const user = `Livro:
Título: ${(bookBible as Record<string, string>).title || ''}
Tagline: ${(bookBible as Record<string, string>).tagline || ''}
Gênero: ${(bookBible as Record<string, string>).target_audience || ''}
Tom: ${(bookBible as Record<string, string>).tone_of_voice || ''}

${context.chapterExcerpt ? `Trecho do livro para usar como base:\n"${context.chapterExcerpt.slice(0, 500)}"\n` : ''}
${context.characterName ? `Personagem em destaque: ${context.characterName}\n` : ''}
${context.customAngle ? `Ângulo desejado: ${context.customAngle}\n` : ''}

${formatInstructions[format]}

REGRAS:
- Conteúdo deve gerar curiosidade sobre o livro sem spoilers
- Sempre incluir CTA para conhecer/comprar o livro
- Usar linguagem nativa da plataforma ${platform}
- Adaptar tom ao público do gênero`;

  return { system, user };
}

export function buildBlogPostPrompt(
  topic: { title: string; angle: string; target_keywords: string[]; category: string },
  market: 'pt-br' | 'en',
): { system: string; user: string } {
  const lang = market === 'pt-br' ? 'português brasileiro' : 'English';

  const system = `Você é um redator especializado em marketing editorial e autopublicação.
Escreve artigos de blog otimizados para SEO que educam autores sobre o mercado
KDP, tendências editoriais e estratégias de publicação. Cada artigo posiciona
o Manuscry como autoridade no assunto. Escreva em ${lang}.
Retorne APENAS JSON válido.`;

  const user = `Tema: ${topic.title}
Ângulo: ${topic.angle}
Keywords alvo: ${topic.target_keywords.join(', ')}
Categoria: ${topic.category}

Escreva um artigo de blog completo (1500-2500 palavras). Retorne este JSON:
{
  "title": "título otimizado para SEO com keyword principal",
  "slug": "url-amigavel-do-artigo",
  "excerpt": "resumo de 2 linhas para meta description e cards",
  "content": "artigo completo em HTML com <h2>, <h3>, <p>, <ul>, <strong>, <em>. Bem estruturado com introdução, desenvolvimento (3-5 seções), conclusão.",
  "cover_image_prompt": "prompt em inglês para gerar imagem de capa do artigo via IA",
  "category": "${topic.category}",
  "tags": ["tag1", "tag2", "tag3"],
  "seo_title": "título para meta tag title (até 60 chars)",
  "seo_description": "meta description (até 155 chars)",
  "cta_text": "texto do CTA final convidando a conhecer o Manuscry",
  "cta_url": "https://manuscry.ai"
}

REGRAS:
- O artigo deve ser genuinamente útil e educativo
- Mencionar o Manuscry de forma natural no contexto, nunca forçado
- CTA no final do artigo convidando a experimentar a plataforma
- Keywords distribuídas naturalmente ao longo do texto
- Incluir dados e exemplos concretos quando possível`;

  return { system, user };
}

export function buildBlogTopicsPrompt(
  market: 'pt-br' | 'en',
): { system: string; user: string } {
  const lang = market === 'pt-br' ? 'português brasileiro' : 'English';

  const system = `Você é um estrategista de conteúdo editorial. Pesquisa tendências
do mercado KDP e autopublicação para definir pautas de blog que atraem
tráfego orgânico e posicionam a marca como autoridade.
Escreva em ${lang}. Retorne APENAS JSON válido.`;

  const user = `Gere 5 pautas de blog para o Manuscry (plataforma de autopublicação com IA).

Considere:
- Tendências atuais do mercado KDP e autopublicação
- Dúvidas frequentes de autores iniciantes
- Estratégias de marketing editorial
- Comparações de ferramentas e processos
- Cases e dados do mercado

Retorne este JSON:
{
  "topics": [
    {
      "title": "título sugestivo do artigo",
      "angle": "ângulo específico que diferencia este artigo",
      "target_keywords": ["keyword1", "keyword2", "keyword3"],
      "category": "KDP|Marketing|Escrita|Publicação|Mercado"
    }
  ]
}`;

  return { system, user };
}
