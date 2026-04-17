export function buildBookDesignPrompt(
  bookBible: Record<string, unknown>,
  bookProfile: Record<string, unknown>,
  totalWords: number,
  chapterCount: number,
  genre: string,
  market: 'pt-br' | 'en',
): { system: string; user: string } {
  const system = `Você é um designer editorial especializado em livros para
autopublicação no KDP e IngramSpark. Gera especificações técnicas
completas de design: tipografia, margens, trim size, dust jacket
e formatação interior. Tudo deve estar dentro dos limites aceitos
pelas plataformas de impressão.
Retorne APENAS JSON válido, sem texto fora do JSON.`;

  const estimatedPages = Math.ceil(totalWords / 250);

  const user = `Livro:
Título: ${(bookBible as Record<string, string>).title || ''}
Gênero: ${genre}
Mercado: ${market === 'pt-br' ? 'Brasil' : 'Global'}
Palavras: ${totalWords.toLocaleString()}
Capítulos: ${chapterCount}
Páginas estimadas: ~${estimatedPages}

Perfil:
${JSON.stringify(bookProfile, null, 2)}

Gere as specs completas de design. Retorne este JSON:
{
  "trim_size": {
    "width_inches": 6,
    "height_inches": 9,
    "name": "6x9 (padrão KDP)",
    "kdp_compatible": true,
    "ingram_compatible": true
  },
  "interior": {
    "paper_type": "cream|white",
    "bleed": false,
    "margins": {
      "top_inches": 0.75,
      "bottom_inches": 0.75,
      "inside_inches": 0.875,
      "outside_inches": 0.625
    },
    "gutter_inches": 0.125,
    "estimated_page_count": ${estimatedPages},
    "spine_width_inches": ${(estimatedPages * 0.0025).toFixed(3)}
  },
  "typography": {
    "body_font": "nome da fonte recomendada para o gênero",
    "body_size_pt": 11,
    "line_spacing": 1.4,
    "heading_font": "fonte para títulos de capítulo",
    "heading_size_pt": 18,
    "chapter_number_style": "estilo do número de capítulo",
    "drop_cap": true,
    "paragraph_indent_inches": 0.3,
    "paragraph_spacing_pt": 0
  },
  "front_matter": [
    "Half title",
    "Title page",
    "Copyright",
    "Dedication",
    "Table of Contents"
  ],
  "back_matter": [
    "About the Author",
    "Also by [Author]",
    "Acknowledgments"
  ],
  "dust_jacket": {
    "required": false,
    "front_cover_width_inches": 6,
    "spine_width_inches": ${(estimatedPages * 0.0025).toFixed(3)},
    "back_cover_width_inches": 6,
    "total_width_inches": ${(12 + estimatedPages * 0.0025).toFixed(3)},
    "height_inches": 9,
    "bleed_inches": 0.125,
    "barcode_area": "lower right back cover, 2x1.2 inches"
  },
  "ebook": {
    "format": "EPUB 3.0 + KF8 (mobi)",
    "reflowable": true,
    "toc_type": "HTML NCX + nav",
    "cover_dimensions": "2560x1600px (KDP recomendado)",
    "css_notes": "fonte do sistema, sem tamanho fixo, espaçamento relativo"
  },
  "recommendations": "2-3 linhas de recomendações específicas para este gênero"
}`;

  return { system, user };
}
