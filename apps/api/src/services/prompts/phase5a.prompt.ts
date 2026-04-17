export function buildCoverPromptsPrompt(
  bookBible: Record<string, unknown>,
  bookProfile: Record<string, unknown>,
  genre: string,
  market: 'pt-br' | 'en',
): { system: string; user: string } {
  const system = `Você é um designer de capas de livros especializado no mercado KDP.
Cria prompts de imagem para AI (Flux Pro) que geram capas profissionais
de alta conversão. Cada prompt deve ser em inglês (para o modelo de IA)
e ultra-específico visualmente.

REGRAS:
- 5 variações DIFERENTES em estilo visual (não apenas cores)
- Prompts em INGLÊS (o modelo só entende inglês)
- Cada prompt deve descrever: composição, estilo artístico, paleta de cores,
  tipografia sugerida, mood/atmosfera
- NÃO incluir texto real na imagem (o título será adicionado depois)
- Foco em elementos que vendem no KDP para este gênero específico
- Retorne APENAS JSON válido`;

  const user = `Book Bible:
Título: ${(bookBible as Record<string, string>).title || ''}
Tagline: ${(bookBible as Record<string, string>).tagline || ''}
Tom: ${(bookBible as Record<string, string>).tone_of_voice || ''}
Gênero: ${genre}
Mercado: ${market === 'pt-br' ? 'Brasil' : 'Global'}

Perfil do livro:
${JSON.stringify(bookProfile, null, 2)}

Gere 5 prompts de capa diferentes para Flux Pro. Retorne este JSON:
{
  "negative_prompt": "text, letters, words, watermark, signature, blurry, low quality, deformed",
  "covers": [
    {
      "variation": 1,
      "style": "nome do estilo (ex: 'Cinematic Dark', 'Minimalist Abstract', 'Illustrated Warm')",
      "concept": "descrição do conceito visual em 1 linha",
      "prompt": "prompt completo em inglês para Flux Pro, ultra-detalhado, 2-3 frases",
      "color_palette": ["#hex1", "#hex2", "#hex3"],
      "score": 8.5,
      "score_reason": "por que esta capa venderia bem neste gênero — 1 linha"
    }
  ]
}

Os scores devem refletir a adequação ao gênero KDP:
- 9-10: perfeitamente alinhado com top sellers do nicho
- 7-8: forte, com diferencial
- 5-6: funcional mas genérico`;

  return { system, user };
}

export function buildBackCoverPrompt(
  bookBible: Record<string, unknown>,
  authorBio: string,
  market: 'pt-br' | 'en',
): { system: string; user: string } {
  const lang = market === 'pt-br' ? 'português brasileiro' : 'English';

  const system = `Você é um designer editorial especializado em contracapas de livros.
Cria o conteúdo textual da contracapa que converte navegadores em compradores.
Escreva em ${lang}. Retorne APENAS JSON válido.`;

  const user = `Livro:
Título: ${(bookBible as Record<string, string>).title || ''}
Sinopse: ${(bookBible as Record<string, string>).synopsis || ''}
Tagline: ${(bookBible as Record<string, string>).tagline || ''}

Bio do autor: ${authorBio || 'Não disponível'}

Crie o conteúdo da contracapa. Retorne este JSON:
{
  "synopsis_text": "texto de contracapa com 150-200 palavras — gancho + premissa + pergunta que gera curiosidade. NÃO é a sinopse completa, é copywriting de venda.",
  "author_bio_short": "bio do autor em 2-3 linhas para contracapa",
  "barcode_area": "lower right, 2x1.2 inches",
  "spine_text": "texto da lombada: TÍTULO — AUTOR"
}`;

  return { system, user };
}
