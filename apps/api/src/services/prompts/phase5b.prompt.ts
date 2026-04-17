export function buildBiographyPrompt(
  bookBible: Record<string, unknown>,
  bookProfile: Record<string, unknown>,
  authorName: string,
  authorBackground: string,
  market: 'pt-br' | 'en',
): { system: string; user: string } {
  const lang = market === 'pt-br' ? 'português brasileiro' : 'inglês';

  const system = `Você é um copywriter editorial especializado em biografias de autor
para o mercado KDP. Cria pacotes biográficos completos otimizados para cada
plataforma de publicação. Cada bio tem tom e tamanho diferentes.
Escreva em ${lang}.
Retorne APENAS JSON válido, sem texto fora do JSON.`;

  const user = `Livro:
Título: ${(bookBible as Record<string, string>).title || ''}
Gênero: ${(bookProfile as Record<string, string>).kdp_genre || ''}
Tom do livro: ${(bookBible as Record<string, string>).tone_of_voice || ''}
Público-alvo: ${(bookBible as Record<string, string>).target_audience || ''}

Autor:
Nome: ${authorName}
Background: ${authorBackground || 'Não informado — crie uma bio genérica profissional'}

Mercado: ${market === 'pt-br' ? 'PT-BR (Amazon.com.br)' : 'EN (Amazon.com)'}

Gere o pacote biográfico completo. Retorne este JSON:
{
  "author_name": "${authorName}",
  "bios": {
    "kdp_full": "bio completa para a página do autor na Amazon KDP (150-250 palavras). Tom profissional, menciona expertise e conexão com o tema do livro.",
    "back_cover": "bio para contracapa impressa (60-80 palavras). Concisa, impactante, termina com localização.",
    "social_media": "bio para Instagram/Twitter/TikTok (30-40 palavras). Casual mas profissional, com gancho.",
    "press_kit": "bio para press release e mídia (200-300 palavras). Formal, com credenciais e realizações.",
    "one_liner": "bio de 1 linha para assinatura de email e rodapé"
  },
  "photo_suggestions": {
    "style": "estilo de foto sugerido (ex: 'profissional em estúdio', 'casual em ambiente literário')",
    "clothing": "sugestão de vestuário adequado ao gênero",
    "background": "cenário ideal para a foto",
    "mood": "expressão e postura sugeridas"
  },
  "brand_keywords": ["5 palavras-chave que definem a marca pessoal do autor"],
  "tagline": "frase de autor em 1 linha (não é slogan do livro, é do autor)"
}`;

  return { system, user };
}
