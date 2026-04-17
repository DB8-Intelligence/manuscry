export function buildPhase3Prompt(
  bookBible: Record<string, unknown>,
  bookProfile: Record<string, unknown>,
  genreMode: 'fiction' | 'nonfiction',
): { system: string; user: string } {
  const system = `Você é um narrative architect especializado em estrutura
de livros para o mercado KDP. Constrói o roteiro completo
capítulo a capítulo — cada um com objetivo claro, arco emocional,
tensão calibrada e gancho final. O roteiro é o contrato narrativo
que garante consistência do início ao fim.
Retorne APENAS JSON válido, sem texto fora do JSON.`;

  const isFiction = genreMode === 'fiction';
  const chapterCount = isFiction ? 24 : 10;
  const wordTarget = isFiction ? 70000 : 45000;

  const tensionExample = isFiction
    ? '5,6,6,7,7,8,7,8,9,8,9,8,7,8,9,8,9,10,8,9,10,9,8,6'
    : '5,6,7,8,7,8,9,8,9,7';

  const user = `Book Bible completo:
${JSON.stringify(bookBible, null, 2)}

Perfil do livro:
${JSON.stringify(bookProfile, null, 2)}

Crie o roteiro completo. Para ${isFiction ? 'ficção use estrutura de 3 atos' : 'não-ficção use framework de transformação progressiva'}.

Retorne este JSON exato:
{
  "structure_type": "${isFiction ? 'three_act' : 'transformation_framework'}",
  "total_chapters": ${chapterCount},
  "total_words_target": ${wordTarget},
  "tension_map": [${tensionExample}],
  "chapters": [
    {
      "number": 1,
      "title": "título do capítulo",
      "act_position": "${isFiction ? 'act1' : 'intro'}",
      "tension_level": 5,
      "estimated_words": ${isFiction ? 2900 : 4500},
      "narrative_objective": "o que DEVE acontecer para o livro avançar — 1 frase",
      "summary": "o que acontece neste capítulo em 3 linhas",
      "scenes": [
        "Cena 1: local + personagens + o que acontece",
        "Cena 2: local + personagens + o que acontece"
      ],
      "emotional_arc": {
        "start": "estado emocional no início do capítulo",
        "end": "mudança emocional — sempre diferente do início"
      },
      "planted_seeds": ["setup para capítulo futuro se houver"],
      "cliffhanger": "${isFiction ? 'gancho final que puxa para o próximo capítulo' : ''}"
    }
  ]
}

REGRAS:
- tension_map deve ter exatamente ${chapterCount} valores (um por capítulo)
- Para ficção: pico de tensão nos capítulos finais do ato 2b
- estimated_words deve somar aproximadamente ${wordTarget} palavras
- Cada capítulo com narrative_objective único e específico
- cliffhanger obrigatório nos últimos 3 capítulos do ato 2b (ficção)
- Gere TODOS os ${chapterCount} capítulos — não apenas exemplos`;

  return { system, user };
}
