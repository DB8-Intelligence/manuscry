import type { Phase0Theme, Phase1Data } from '@manuscry/shared';

export function buildPhase2Prompt(
  theme: Phase0Theme,
  phase1: Phase1Data,
  market: 'pt-br' | 'en',
): string {
  const isPT = market === 'pt-br';
  const isFiction = theme.genre.toLowerCase().includes('ficção') ||
    theme.genre.toLowerCase().includes('fiction') ||
    theme.genre.toLowerCase().includes('romance') ||
    theme.genre.toLowerCase().includes('fantasy') ||
    theme.genre.toLowerCase().includes('thriller');

  if (isPT) {
    return `Você é um arquiteto editorial sênior. Sua tarefa é construir o BOOK BIBLE — o DNA completo do livro que será injetado em TODAS as chamadas de escrita da Fase 4.

⚠️ REGRA CRÍTICA: Tudo que você definir aqui vira lei. Personagem X descrito aqui não pode virar personagem Y no capítulo 7. Seja específico, não genérico.

## CONTEXTO HERDADO DA FASE 1
Tema: ${theme.title}
Gênero: ${theme.genre} (${isFiction ? 'FICÇÃO' : 'NÃO-FICÇÃO'})
Subgênero: ${theme.subgenre}
Público-alvo: ${phase1.target_audience}
Promessa: ${phase1.promise}
Posicionamento: ${phase1.positioning_statement}
Ângulo único: ${phase1.unique_book_angle}

## ESTRUTURA DO BOOK BIBLE
O campo "book_bible" deve ser um TEXTO LONGO (2000-4000 palavras) contendo EXATAMENTE estas seções marcadas com ##:

${isFiction ? `### Para FICÇÃO:
## PREMISSA EXPANDIDA
Em 1 parágrafo: protagonista + objetivo + obstáculo + aposta.

## PERSONAGENS PRINCIPAIS
Para CADA personagem (mínimo 3, máximo 7): nome, idade, aparência física (3 traços), profissão, dor interna, objetivo externo, arco de transformação, tique verbal ou gesto recorrente.

## MUNDO E AMBIENTAÇÃO
Local, época, regras do mundo, atmosfera dominante, detalhes sensoriais recorrentes (cheiros, sons, cores).

## TOM E VOZ NARRATIVA
Pessoa (1ª/3ª limitada/3ª onisciente), tempo verbal, ritmo das frases (curtas/longas), nível de descrição (enxuto/denso), grau de metáfora.

## TEMAS E SUBTEXTO
Tema central (o que o livro está DIZENDO) + 2-3 subtextos secundários.

## REGRAS INVIOLÁVEIS
Lista de 5-8 coisas que NUNCA podem acontecer (ex: "narrador nunca entra na cabeça do antagonista", "protagonista nunca usa palavrão", "sem deus ex machina").` : `### Para NÃO-FICÇÃO:
## PROPOSTA DE VALOR EXPANDIDA
Em 1 parágrafo: quem é o leitor + qual problema + qual método + qual resultado.

## CREDENCIAL E POSTURA AUTORAL
Por que o autor pode falar sobre isso. Postura: especialista, pesquisador, jornalista, praticante.

## FRAMEWORK/METODOLOGIA
O método ou modelo central do livro, nomeado. Etapas ou pilares (3-7).

## ESTRUTURA PEDAGÓGICA
Como o leitor aprende: do simples ao complexo, histórias-caso, exercícios, checklists. Quanto de cada.

## TOM E VOZ NARRATIVA
Formal/coloquial, técnico/acessível, autoridade/conversa, uso de "eu" vs "nós" vs impessoal.

## PROVAS E EVIDÊNCIAS
Tipos de prova que o livro usará (estudos, cases, entrevistas, dados, analogias).

## REGRAS INVIOLÁVEIS
Lista de 5-8 coisas que NUNCA podem acontecer (ex: "sem jargão não explicado no primeiro uso", "toda afirmação forte precisa de 1 case ou dado", "nenhum capítulo sem takeaway acionável").`}

## TARGET WORD COUNT
Use como referência:
- Ficção comercial: 60.000-80.000 palavras
- Ficção YA: 50.000-70.000
- Não-ficção prática: 40.000-55.000
- Não-ficção ensaio: 55.000-75.000

## FORMATO DE SAÍDA
Retorne APENAS JSON válido, sem markdown, sem comentários:
{
  "working_title": "título forte de trabalho (pode evoluir até o lançamento)",
  "subtitle": "subtítulo SEO + promessa clara (máx 80 chars)",
  "premise": "premissa em 2-3 frases",
  "author_voice": "descrição da voz narrativa em 2-3 frases (tom + ritmo + presença)",
  "target_word_count": 55000,
  "core_message": "a 1 ideia que o leitor leva depois de fechar o livro",
  "reader_transformation": "antes do livro o leitor X, depois Y",
  "chapters_seed": [
    { "chapter": 1, "title": "título do cap", "goal": "objetivo narrativo/pedagógico do cap" }
  ],
  "book_bible": "TEXTO LONGO (2000-4000 palavras) com todas as seções ## listadas acima, preenchidas em detalhe"
}

⚠️ chapters_seed deve ter entre 10 e 20 capítulos. O book_bible deve ser denso — não deixe seção vazia.`;
  }

  return `You are a senior book architect. Your task is to build the BOOK BIBLE — the complete DNA of the book that will be injected into EVERY chapter generation call in Phase 4.

⚠️ CRITICAL RULE: Everything you define here becomes law. Character X described here cannot become character Y in chapter 7. Be specific, not generic.

## CONTEXT INHERITED FROM PHASE 1
Theme: ${theme.title}
Genre: ${theme.genre} (${isFiction ? 'FICTION' : 'NONFICTION'})
Subgenre: ${theme.subgenre}
Target audience: ${phase1.target_audience}
Promise: ${phase1.promise}
Positioning: ${phase1.positioning_statement}
Unique angle: ${phase1.unique_book_angle}

## BOOK BIBLE STRUCTURE
The "book_bible" field must be a LONG TEXT (2000-4000 words) containing EXACTLY these sections marked with ##:

${isFiction ? `### For FICTION:
## EXPANDED PREMISE
In 1 paragraph: protagonist + goal + obstacle + stakes.

## MAIN CHARACTERS
For EACH character (min 3, max 7): name, age, physical traits (3), occupation, inner wound, outer goal, transformation arc, verbal tic or recurring gesture.

## WORLD AND SETTING
Place, era, world rules, dominant atmosphere, recurring sensory details (smells, sounds, colors).

## NARRATIVE TONE AND VOICE
Person (1st/3rd limited/3rd omniscient), tense, sentence rhythm (short/long), description density (lean/dense), metaphor level.

## THEMES AND SUBTEXT
Central theme (what the book is SAYING) + 2-3 secondary subtexts.

## INVIOLABLE RULES
List 5-8 things that must NEVER happen (e.g., "narrator never enters antagonist's head", "protagonist never curses", "no deus ex machina").` : `### For NONFICTION:
## EXPANDED VALUE PROPOSITION
In 1 paragraph: who the reader is + what problem + what method + what result.

## AUTHOR CREDENTIAL AND STANCE
Why the author can speak on this. Stance: expert, researcher, journalist, practitioner.

## FRAMEWORK/METHODOLOGY
The named central method or model. Steps or pillars (3-7).

## PEDAGOGICAL STRUCTURE
How the reader learns: simple to complex, case stories, exercises, checklists. How much of each.

## NARRATIVE TONE AND VOICE
Formal/casual, technical/accessible, authoritative/conversational, use of "I" vs "we" vs impersonal.

## PROOF AND EVIDENCE
Types of proof the book will use (studies, cases, interviews, data, analogies).

## INVIOLABLE RULES
List 5-8 things that must NEVER happen (e.g., "no jargon without first-use explanation", "every strong claim needs a case or data point", "no chapter without an actionable takeaway").`}

## TARGET WORD COUNT
Reference:
- Commercial fiction: 60,000-80,000 words
- YA fiction: 50,000-70,000
- Practical nonfiction: 40,000-55,000
- Essay nonfiction: 55,000-75,000

## OUTPUT FORMAT
Return ONLY valid JSON, no markdown, no comments:
{
  "working_title": "strong working title (can evolve until launch)",
  "subtitle": "SEO subtitle + clear promise (max 80 chars)",
  "premise": "premise in 2-3 sentences",
  "author_voice": "narrative voice description in 2-3 sentences (tone + rhythm + presence)",
  "target_word_count": 55000,
  "core_message": "the 1 idea the reader takes after closing the book",
  "reader_transformation": "before the book the reader is X, after Y",
  "chapters_seed": [
    { "chapter": 1, "title": "chapter title", "goal": "narrative/pedagogical goal of the chapter" }
  ],
  "book_bible": "LONG TEXT (2000-4000 words) with all ## sections listed above, filled in detail"
}

⚠️ chapters_seed must have between 10 and 20 chapters. The book_bible must be dense — don't leave any section empty.`;
}
