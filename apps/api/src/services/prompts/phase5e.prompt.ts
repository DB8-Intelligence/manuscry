export function buildKdpMetadataPrompt(
  bookBible: Record<string, unknown>,
  bookProfile: Record<string, unknown>,
  genre: string,
  market: 'pt-br' | 'en',
): { system: string; user: string } {
  const system = `Você é um especialista em otimização de metadados para Amazon KDP.
Cria keywords, categorias BISAC, descrições HTML e A+ content que
maximizam visibilidade e conversão na loja Amazon.
Retorne APENAS JSON válido, sem texto fora do JSON.`;

  const lang = market === 'pt-br' ? 'português' : 'inglês';

  const user = `Livro:
Título: ${(bookBible as Record<string, string>).title || ''}
Subtítulo: ${(bookBible as Record<string, string>).subtitle || ''}
Tagline: ${(bookBible as Record<string, string>).tagline || ''}
Sinopse: ${(bookBible as Record<string, string>).synopsis || ''}
Gênero: ${genre}
Mercado: ${market === 'pt-br' ? 'Amazon.com.br' : 'Amazon.com'}

Perfil:
${JSON.stringify(bookProfile, null, 2)}

Gere metadados KDP otimizados em ${lang}. Retorne este JSON:
{
  "keywords": {
    "primary": ["7 keywords principais (cada uma até 50 chars)"],
    "long_tail": ["5 keywords long-tail para alcance orgânico"],
    "strategy": "explicação de 2 linhas da estratégia de keywords"
  },
  "categories": {
    "bisac_primary": {
      "code": "FIC027000",
      "name": "FICTION / Romance / General",
      "reason": "por que esta categoria"
    },
    "bisac_secondary": {
      "code": "FIC027020",
      "name": "FICTION / Romance / Contemporary",
      "reason": "por que esta categoria"
    },
    "kdp_browse_categories": [
      "Kindle Store > path > completo > da > categoria 1",
      "Kindle Store > path > completo > da > categoria 2"
    ]
  },
  "description_html": "<p>Descrição HTML formatada para KDP (4000 chars max). Use <b>, <i>, <br>, <h2>. Inclua gancho, premissa, reviews simulados, CTA.</p>",
  "description_plain": "mesma descrição sem HTML — para IngramSpark e outras plataformas",
  "a_plus_content": {
    "headline": "título principal do A+ content",
    "modules": [
      {
        "type": "comparison_chart|image_text|text_block",
        "title": "título do módulo",
        "content": "conteúdo sugerido"
      }
    ]
  },
  "search_title": "título otimizado para busca (pode diferir do título artístico)",
  "series_info": {
    "is_series": false,
    "series_name": null,
    "volume_number": null
  },
  "age_range": "faixa etária sugerida ou null",
  "language": "${market === 'pt-br' ? 'Portuguese' : 'English'}"
}`;

  return { system, user };
}
