export function buildCoachAnalysisPrompt(
  chapterContent: string,
  chapterNumber: number,
  bookBible: Record<string, unknown>,
  market: 'pt-br' | 'en',
): { system: string; user: string } {
  const lang = market === 'pt-br' ? 'português brasileiro' : 'English';

  const system = `Você é um editor literário experiente e coach de escrita.
Analisa textos e fornece feedback construtivo e específico para melhorar
a qualidade do manuscrito. Não reescreve — sugere e explica o porquê.
Seja honesto mas encorajador. Aponte problemas específicos com trechos exatos.
Escreva em ${lang}. Retorne APENAS JSON válido.`;

  const user = `Book Bible (referência de tom e estilo):
Título: ${(bookBible as Record<string, string>).title || ''}
Tom: ${(bookBible as Record<string, string>).tone_of_voice || ''}
Estilo: ${(bookBible as Record<string, string>).narrative_style || ''}

CAPÍTULO ${chapterNumber}:
${chapterContent.slice(0, 8000)}

Analise este capítulo e retorne este JSON:
{
  "suggestions": [
    {
      "type": "pacing|show_dont_tell|dialogue|cliche|repetition|tone|structure|general",
      "title": "título curto da sugestão",
      "explanation": "por que isso é um problema e como melhorar — 2-3 frases",
      "original_text": "trecho exato do texto que precisa de atenção",
      "suggested_improvement": "como poderia ficar melhor (ou null se for só observação)",
      "severity": "info|warning|improvement"
    }
  ],
  "overall_score": 7.5,
  "strengths": ["ponto forte 1", "ponto forte 2", "ponto forte 3"],
  "areas_to_improve": ["área de melhoria 1", "área 2"]
}

REGRAS:
- 5-10 sugestões por capítulo
- Comece pelos pontos fortes (encorajamento)
- Sugestões devem citar trechos EXATOS do texto
- Score de 1-10 (7+ = bom, 5-6 = precisa trabalho, <5 = necessita revisão)
- Tipos: pacing (ritmo), show_dont_tell, dialogue (naturalidade), cliche,
  repetition (palavras repetidas), tone (alinhamento com Book Bible),
  structure (parágrafos, transições), general`;

  return { system, user };
}
