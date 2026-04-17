export function buildManuscriptAnalysisPrompt(
  manuscriptText: string,
  market: 'pt-br' | 'en',
): { system: string; user: string } {
  const system = `Você é um editor literário sênior que analisa manuscritos para
transformá-los em projetos editoriais estruturados. Seu trabalho é ler o manuscrito
(ou rascunho/ideia) e extrair todas as informações necessárias para alimentar
um pipeline editorial completo com IA.

Analise mesmo que o texto seja parcial, uma sinopse, ou apenas uma ideia.
Extraia o máximo possível e sugira o que falta.
Retorne APENAS JSON válido, sem texto fora do JSON.`;

  const lang = market === 'pt-br' ? 'português brasileiro' : 'English';
  const trimmed = manuscriptText.slice(0, 15000);

  const user = `MANUSCRITO/RASCUNHO DO AUTOR (pode ser parcial):
---
${trimmed}
---

Idioma de saída: ${lang}

Analise este manuscrito e retorne o JSON abaixo. Se algo não puder ser
determinado com certeza, faça sua melhor inferência e marque como sugerido.

{
  "analysis": {
    "completeness": "complete|partial|idea_only",
    "estimated_words": 0,
    "language_detected": "pt-br|en|other",
    "quality_assessment": "polished|draft|rough_notes",
    "summary": "resumo do que o manuscrito contém em 3 linhas"
  },
  "project_seed": {
    "suggested_title": "título sugerido baseado no conteúdo",
    "genre_mode": "fiction|nonfiction",
    "genre": "gênero específico detectado",
    "market": "${market}",
    "tone": "tom detectado no texto",
    "target_audience": "público-alvo inferido",
    "premise": "premissa central em 1 frase"
  },
  "extracted_elements": {
    "characters": [
      {
        "name": "nome se encontrado",
        "role": "protagonist|antagonist|support",
        "description": "descrição baseada no texto"
      }
    ],
    "themes": ["tema 1", "tema 2"],
    "setting": "cenário/mundo onde se passa",
    "conflict": "conflito central se identificável",
    "existing_chapters": [
      {
        "number": 1,
        "suggested_title": "título sugerido",
        "summary": "do que trata este trecho",
        "word_count": 0
      }
    ]
  },
  "recommendations": {
    "next_steps": ["o que o autor precisa fazer a seguir"],
    "strengths": ["pontos fortes do manuscrito"],
    "improvements": ["sugestões de melhoria"],
    "pipeline_start_phase": 0
  }
}

REGRAS:
- Se o texto é apenas uma ideia curta, pipeline_start_phase deve ser 0 (análise de mercado)
- Se já tem estrutura e capítulos, pipeline_start_phase pode ser 2 ou 3
- Se é um manuscrito completo, pipeline_start_phase deve ser 4 (edição/humanização)
- Sempre extraia personagens, mesmo que parcialmente`;

  return { system, user };
}
