import type {
  Phase0Theme,
  Phase2Data,
  Phase3Data,
  Phase3ChapterPlan,
  Phase4Chapter,
} from '@manuscry/shared';

interface BuildPhase4Args {
  theme: Phase0Theme;
  phase2: Phase2Data;
  phase3: Phase3Data;
  chapterPlan: Phase3ChapterPlan;
  previousChapter?: Phase4Chapter;
  market: 'pt-br' | 'en';
}

export function buildPhase4ChapterPrompt(args: BuildPhase4Args): {
  system: string;
  user: string;
} {
  const { theme, phase2, phase3, chapterPlan, previousChapter, market } = args;
  const isPT = market === 'pt-br';
  const genreLower = theme.genre.toLowerCase();
  const isFiction = ['ficção', 'fiction', 'romance', 'fantasy', 'thriller'].some(
    (g) => genreLower.includes(g),
  );

  const prevTail = previousChapter?.content
    ? previousChapter.content.slice(-1200)
    : null;

  if (isPT) {
    const system = `Você é um romancista/autor profissional escrevendo um capítulo completo de um livro ${
      isFiction ? 'de ficção' : 'de não-ficção'
    }. Sua voz é consistente, humana, com ritmo natural — nada de clichês de IA, nada de frases genéricas, nada de "em conclusão". Escreva em português brasileiro fluente. Retorne APENAS a prosa do capítulo (sem JSON, sem explicações, sem markdown além de parágrafos separados por linha em branco). O título do capítulo deve abrir o texto em uma linha própria, precedido por "# ".`;

    const user = `## LIVRO
Título: ${phase2.working_title}
Gênero: ${theme.genre} (${isFiction ? 'FICÇÃO' : 'NÃO-FICÇÃO'})
Premissa: ${phase2.premise}
Voz autoral: ${phase2.author_voice}
Core message: ${phase2.core_message}
Transformação do leitor: ${phase2.reader_transformation}

## BOOK BIBLE (contexto persistente — respeite cada detalhe)
${phase2.book_bible}

## ESTRATÉGIA NARRATIVA GLOBAL
Estrutura: ${phase3.narrative_structure}
Ritmo: ${phase3.pacing_notes}

## CAPÍTULO A ESCREVER AGORA
Capítulo ${chapterPlan.chapter}: ${chapterPlan.title}
Resumo do que deve acontecer: ${chapterPlan.summary}
Hook de saída obrigatório: ${chapterPlan.hook}
Meta de palavras: ${chapterPlan.target_words} (aceitável entre ${Math.floor(
      chapterPlan.target_words * 0.85,
    )} e ${Math.ceil(chapterPlan.target_words * 1.15)})

${
  prevTail
    ? `## CONTINUIDADE — fim do capítulo anterior\n${prevTail}\n\nContinue com coerência total de tom, personagem, tempo verbal e POV.`
    : '## ESTE É O PRIMEIRO CAPÍTULO — abra o livro com um hook forte nos primeiros 300 palavras.'
}

## REGRAS DE ESCRITA
- Escreva o capítulo INTEIRO em uma única passada, do começo ao fim, como prosa contínua
- Parágrafos curtos e médios alternados; varie estrutura de frase
- Mostre, não conte — use cenas, diálogo, ação concreta
- ${
      isFiction
        ? 'Diálogos com travessão, cada fala em linha própria'
        : 'Use exemplos concretos, analogias, histórias — nunca teoria pura'
    }
- Zero metacomentário ("neste capítulo veremos...", "agora vamos falar sobre...")
- Termine no hook de saída especificado acima

Comece agora. Primeira linha: "# ${chapterPlan.title}" — depois linha em branco — depois a prosa.`;

    return { system, user };
  }

  const system = `You are a professional novelist/author writing a complete chapter of a ${
    isFiction ? 'fiction' : 'nonfiction'
  } book. Your voice is consistent, human, naturally paced — no AI clichés, no generic phrasing, no "in conclusion". Write in fluent English. Return ONLY the chapter prose (no JSON, no explanations, no markdown beyond blank-line paragraph breaks). The chapter title must open the text on its own line, prefixed by "# ".`;

  const user = `## BOOK
Title: ${phase2.working_title}
Genre: ${theme.genre} (${isFiction ? 'FICTION' : 'NONFICTION'})
Premise: ${phase2.premise}
Author voice: ${phase2.author_voice}
Core message: ${phase2.core_message}
Reader transformation: ${phase2.reader_transformation}

## BOOK BIBLE (persistent context — respect every detail)
${phase2.book_bible}

## GLOBAL NARRATIVE STRATEGY
Structure: ${phase3.narrative_structure}
Pacing: ${phase3.pacing_notes}

## CHAPTER TO WRITE NOW
Chapter ${chapterPlan.chapter}: ${chapterPlan.title}
What must happen: ${chapterPlan.summary}
Required exit hook: ${chapterPlan.hook}
Target words: ${chapterPlan.target_words} (acceptable ${Math.floor(
    chapterPlan.target_words * 0.85,
  )}–${Math.ceil(chapterPlan.target_words * 1.15)})

${
  prevTail
    ? `## CONTINUITY — end of previous chapter\n${prevTail}\n\nContinue with full tone, character, tense and POV coherence.`
    : '## THIS IS THE FIRST CHAPTER — open the book with a strong hook in the first 300 words.'
}

## WRITING RULES
- Write the ENTIRE chapter in a single pass, beginning to end, as continuous prose
- Mix short and medium paragraphs; vary sentence structure
- Show, don't tell — use scenes, dialogue, concrete action
- ${
    isFiction
      ? 'Dialogue on its own lines with proper punctuation'
      : 'Use concrete examples, analogies, stories — never pure theory'
  }
- Zero meta-commentary ("in this chapter we will see...", "now let's talk about...")
- End on the exit hook specified above

Start now. First line: "# ${chapterPlan.title}" — then blank line — then the prose.`;

  return { system, user };
}
