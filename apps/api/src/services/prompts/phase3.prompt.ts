import type { Phase0Theme, Phase1Data, Phase2Data } from '@manuscry/shared';

export function buildPhase3Prompt(
  theme: Phase0Theme,
  phase1: Phase1Data,
  phase2: Phase2Data,
  market: 'pt-br' | 'en',
): string {
  const isPT = market === 'pt-br';
  const isFiction = theme.genre.toLowerCase().includes('ficção') ||
    theme.genre.toLowerCase().includes('fiction') ||
    theme.genre.toLowerCase().includes('romance') ||
    theme.genre.toLowerCase().includes('fantasy') ||
    theme.genre.toLowerCase().includes('thriller');

  const chapterCount = phase2.chapters_seed?.length || 15;
  const wordsPerChapter = Math.floor(phase2.target_word_count / chapterCount);

  if (isPT) {
    return `Você é um narrative architect sênior. Sua tarefa: transformar o Book Bible da Fase 2 em um PLANO DE EXECUÇÃO capítulo a capítulo, pronto para a escrita streaming da Fase 4.

## CONTEXTO HERDADO
Título: ${phase2.working_title}
Gênero: ${theme.genre} (${isFiction ? 'FICÇÃO' : 'NÃO-FICÇÃO'})
Premissa: ${phase2.premise}
Core message: ${phase2.core_message}
Transformação do leitor: ${phase2.reader_transformation}
Total de capítulos: ${chapterCount}
Palavras por capítulo (média): ${wordsPerChapter}
Word count total: ${phase2.target_word_count}

## BOOK BIBLE (contexto de referência — não reescreva, apenas respeite)
${phase2.book_bible}

## SEMENTES DE CAPÍTULOS HERDADAS
${phase2.chapters_seed?.map((s) => `  Cap ${s.chapter}: ${s.title} — ${s.goal}`).join('\n') || '(vazio)'}

## FRAMEWORK OBRIGATÓRIO DE ESTRUTURA
${isFiction ? `Use estrutura em 3 atos COM save-the-cat ou hero's journey:
- Ato 1 (~25%): setup, inciting incident, ponto de virada 1 (compromisso)
- Ato 2A (~25%): testes, aliados, subplot romântico/amizade
- Midpoint (~50%): revelação que vira o jogo, aposta sobe
- Ato 2B (~25%): tudo desmorona, dark night of the soul
- Ato 3 (~25%): clímax, resolução, novo equilíbrio

tension_map deve ter ${chapterCount} itens (1 por capítulo), valores 1-10 formando curva: sobe gradual → pico no clímax (cap ~85%) → resolução.` : `Use estrutura pedagógica progressiva:
- Parte 1 (~30%): contexto, problema, por que importa (ancorar leitor)
- Parte 2 (~50%): método/framework passo a passo, cada pilar em 1-2 caps
- Parte 3 (~20%): aplicação, cases, objeções comuns, próximos passos

tension_map aqui é "engagement_curve" — ${chapterCount} itens (1 por cap), valores 1-10 medindo intensidade de insight/revelação por capítulo. Evite vales longos (leitor abandona).`}

## REGRAS DE RITMO
- Primeiro capítulo: hook forte nos primeiros 300 palavras (decisão de compra no Kindle sample)
- Hook de saída em TODO capítulo (cliffhanger pra ficção / pergunta-gancho pra não-ficção)
- Nenhum capítulo pode ser apenas transição — todo cap tem 1 mini-arco próprio
- Variação de tamanho: 70-130% do wordsPerChapter médio (evitar monotonia)

## FORMATO DE SAÍDA
Retorne APENAS JSON válido, sem markdown:
{
  "narrative_structure": "nome da estrutura usada + descrição em 2-3 frases de como foi aplicada aqui",
  "pacing_notes": "notas de ritmo em 3-5 frases: onde acelera, onde respira, onde acontece a virada",
  "ending_strategy": "como o livro termina — ${isFiction ? 'fechado/ambíguo/em série, qual emoção final' : 'call to action, resumo, provocação final'}",
  "tension_map": [/* ${chapterCount} números de 1-10 */],
  "chapter_plan": [
    {
      "chapter": 1,
      "title": "título específico do capítulo (não genérico)",
      "summary": "o que acontece neste capítulo em 3-4 frases concretas — eventos, personagens presentes, virada final",
      "target_words": ${wordsPerChapter},
      "hook": "a frase/pergunta/cliffhanger que fecha este capítulo e puxa o leitor pro próximo"
    }
  ]
}

⚠️ chapter_plan DEVE ter exatamente ${chapterCount} capítulos. tension_map DEVE ter exatamente ${chapterCount} valores. Cada summary deve ser específico — nada de "o protagonista enfrenta desafios".`;
  }

  return `You are a senior narrative architect. Your task: turn the Phase 2 Book Bible into a chapter-by-chapter EXECUTION PLAN, ready for Phase 4 streaming writing.

## INHERITED CONTEXT
Title: ${phase2.working_title}
Genre: ${theme.genre} (${isFiction ? 'FICTION' : 'NONFICTION'})
Premise: ${phase2.premise}
Core message: ${phase2.core_message}
Reader transformation: ${phase2.reader_transformation}
Total chapters: ${chapterCount}
Words per chapter (avg): ${wordsPerChapter}
Total word count: ${phase2.target_word_count}

## BOOK BIBLE (reference — do not rewrite, just respect)
${phase2.book_bible}

## INHERITED CHAPTER SEEDS
${phase2.chapters_seed?.map((s) => `  Ch ${s.chapter}: ${s.title} — ${s.goal}`).join('\n') || '(empty)'}

## MANDATORY STRUCTURE FRAMEWORK
${isFiction ? `Use 3-act structure WITH save-the-cat or hero's journey:
- Act 1 (~25%): setup, inciting incident, plot point 1 (commitment)
- Act 2A (~25%): tests, allies, romantic/friendship subplot
- Midpoint (~50%): game-changing revelation, stakes rise
- Act 2B (~25%): everything falls apart, dark night of the soul
- Act 3 (~25%): climax, resolution, new equilibrium

tension_map must have ${chapterCount} items (1 per chapter), values 1-10 forming a curve: gradual rise → peak at climax (ch ~85%) → resolution.` : `Use progressive pedagogical structure:
- Part 1 (~30%): context, problem, why it matters (anchor reader)
- Part 2 (~50%): method/framework step by step, each pillar in 1-2 chapters
- Part 3 (~20%): application, cases, common objections, next steps

tension_map here is "engagement_curve" — ${chapterCount} items (1 per ch), values 1-10 measuring insight/revelation intensity per chapter. Avoid long valleys (reader drops off).`}

## PACING RULES
- First chapter: strong hook in the first 300 words (Kindle sample purchase decision)
- Exit hook in EVERY chapter (cliffhanger for fiction / question-hook for nonfiction)
- No chapter can be pure transition — every chapter has its own mini-arc
- Size variation: 70-130% of average wordsPerChapter (avoid monotony)

## OUTPUT FORMAT
Return ONLY valid JSON, no markdown:
{
  "narrative_structure": "name of structure used + 2-3 sentence description of how it was applied here",
  "pacing_notes": "pacing notes in 3-5 sentences: where it accelerates, where it breathes, where the turn happens",
  "ending_strategy": "how the book ends — ${isFiction ? 'closed/ambiguous/series, what final emotion' : 'call to action, summary, final provocation'}",
  "tension_map": [/* ${chapterCount} numbers from 1-10 */],
  "chapter_plan": [
    {
      "chapter": 1,
      "title": "specific chapter title (not generic)",
      "summary": "what happens in this chapter in 3-4 concrete sentences — events, characters present, final turn",
      "target_words": ${wordsPerChapter},
      "hook": "the sentence/question/cliffhanger that closes this chapter and pulls the reader forward"
    }
  ]
}

⚠️ chapter_plan MUST have exactly ${chapterCount} chapters. tension_map MUST have exactly ${chapterCount} values. Each summary must be specific — no "the protagonist faces challenges".`;
}
