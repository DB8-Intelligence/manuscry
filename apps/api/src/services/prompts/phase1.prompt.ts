import type { Phase0Theme } from '@manuscry/shared';

export function buildPhase1Prompt(
  selectedTheme: Phase0Theme,
  authorAnswers: {
    experience: string;
    angle: string;
    audience: string;
  },
  market: 'pt-br' | 'en',
): { system: string; user: string } {
  const system = `Você é um editor sênior especializado em posicionamento
de livros no mercado KDP. Sua função é validar o tema escolhido
e definir o Unique Book Angle (UBA) — o diferencial que torna
este livro impossível de ignorar pelos leitores do gênero.
Retorne APENAS JSON válido, sem texto fora do JSON.`;

  const user = `Tema selecionado pelo autor:
${JSON.stringify(selectedTheme, null, 2)}

Respostas do autor:
- Experiência com o tema: "${authorAnswers.experience}"
- Ângulo desejado: "${authorAnswers.angle}"
- Público específico: "${authorAnswers.audience}"
- Mercado: ${market === 'pt-br' ? 'PT-BR (Amazon.com.br)' : 'EN (Amazon.com)'}

Retorne este JSON exato:
{
  "validation": {
    "score": 8.5,
    "market_fit": "alto",
    "warnings": ["apenas se houver algo preocupante"],
    "green_lights": ["ponto positivo 1", "ponto positivo 2"]
  },
  "unique_book_angle": {
    "for_whom": "público ultra-específico — não 'mulheres', mas 'mulheres 30-45 que saíram de relacionamentos tóxicos'",
    "pain_or_desire": "dor ou desejo específico e nomeado",
    "what_it_offers": "o que este livro entrega de único",
    "different_because": "diferencial concreto vs top 3 concorrentes do nicho",
    "one_sentence": "UBA completo em uma frase de impacto"
  },
  "book_profile": {
    "kdp_genre": "classificação KDP exata para upload",
    "kdp_subgenre": "sub-classificação específica",
    "tone": "sombrio|acolhedor|filosófico|intenso|leve|inspiracional",
    "target_word_count": 65000,
    "format": "ebook|print|both",
    "kindle_unlimited": true,
    "price_range_brl": "R$19,90-R$29,90",
    "price_range_usd": "$3.99-$4.99",
    "reader_profile": "descrição de 2 linhas de quem é esse leitor ideal"
  }
}`;

  return { system, user };
}
