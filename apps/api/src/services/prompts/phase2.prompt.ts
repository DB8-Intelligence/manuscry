export function buildPhase2PromptFiction(
  bookProfile: Record<string, unknown>,
  uba: Record<string, unknown>,
  market: 'pt-br' | 'en',
): { system: string; user: string } {
  const system = `Você é um editor sênior especializado em ficção para o
mercado KDP. Cria o DNA completo do livro — o Book Bible que guia
toda a escrita futura. Seja extremamente específico.
Nunca genérico. Personagens devem ter vozes distintas identificáveis.
Retorne APENAS JSON válido, sem texto fora do JSON.`;

  const user = `Perfil do livro:
${JSON.stringify(bookProfile, null, 2)}

Unique Book Angle:
${JSON.stringify(uba, null, 2)}

Mercado: ${market === 'pt-br' ? 'PT-BR' : 'EN'}

Crie o Book Bible completo. Retorne este JSON exato:
{
  "title": "título irresistível e único para o mercado",
  "subtitle": "subtítulo que reforça a promessa (opcional para ficção)",
  "tagline": "frase de impacto de 1 linha para marketing",
  "synopsis": "3 parágrafos: gancho + desenvolvimento + promessa. Sem revelar o fim.",
  "premise": "a premissa central em exatamente 1 frase",
  "target_audience": "descrição detalhada do leitor ideal",
  "unique_value_proposition": "o que torna este livro impossível de substituir",
  "tone_of_voice": "descrição do tom + 2 exemplos concretos de frases no tom do livro",
  "narrative_style": "POV, tempo verbal, estrutura de narração",
  "central_conflict": "o conflito central em 1 frase — o que está em jogo",
  "estimated_word_count": 70000,
  "chapter_count": 24,
  "characters": [
    {
      "name": "nome completo",
      "role": "protagonist",
      "age": 28,
      "description": "aparência + presença + primeira impressão",
      "internal_motivation": "o que ele/ela REALMENTE quer no fundo",
      "external_motivation": "o que ele/ela diz que quer",
      "central_fear": "o medo que define suas decisões",
      "transformation_arc": "onde começa e onde termina emocionalmente",
      "voice_signature": "como este personagem fala diferente de todos os outros — dê 2 exemplos de falas características"
    }
  ],
  "world_rules": "regras do mundo do livro (mesmo para ficção realista — o que é possível aqui)",
  "thematic_threads": ["tema central", "subtema 1", "subtema 2"]
}

Crie personagens ricos: protagonista, antagonista e pelo menos 1 personagem de suporte.`;

  return { system, user };
}

export function buildPhase2PromptNonfiction(
  bookProfile: Record<string, unknown>,
  uba: Record<string, unknown>,
  market: 'pt-br' | 'en',
): { system: string; user: string } {
  const system = `Você é um editor sênior especializado em não-ficção para
o mercado KDP. Cria o DNA completo do livro — o Book Bible com
framework metodológico, promessa de transformação e posicionamento
de autoridade. Seja específico e prático.
Retorne APENAS JSON válido, sem texto fora do JSON.`;

  const user = `Perfil do livro:
${JSON.stringify(bookProfile, null, 2)}

Unique Book Angle:
${JSON.stringify(uba, null, 2)}

Mercado: ${market === 'pt-br' ? 'PT-BR' : 'EN'}

Crie o Book Bible completo. Retorne este JSON exato:
{
  "title": "título com keyword principal embutida de forma natural",
  "subtitle": "Como [resultado específico] em [prazo] Sem [obstáculo principal]",
  "tagline": "promessa central em 1 frase",
  "synopsis": "3 parágrafos: dor do leitor + método único + transformação prometida",
  "premise": "a promessa central em exatamente 1 frase",
  "target_audience": "descrição detalhada do leitor ideal com dores específicas",
  "unique_value_proposition": "diferencial concreto vs top 3 livros do nicho",
  "tone_of_voice": "descrição do tom + 2 exemplos concretos de parágrafos no tom",
  "narrative_style": "primeira pessoa|segunda pessoa|terceira pessoa + estilo",
  "framework": {
    "name": "nome do método ou framework central",
    "steps": ["Etapa 1: nome", "Etapa 2: nome", "Etapa 3: nome"],
    "description": "como o framework funciona em 3 linhas"
  },
  "transformation_promise": "o leitor vai de [estado A] para [estado B] — específico",
  "reader_pain_points": [
    "dor específica 1 que o leitor sente",
    "dor específica 2",
    "dor específica 3"
  ],
  "author_credibility": "por que o autor tem autoridade para escrever este livro",
  "estimated_word_count": 45000,
  "chapter_count": 10,
  "thematic_threads": ["tema central do método", "subconjunto 1", "subconjunto 2"]
}`;

  return { system, user };
}
