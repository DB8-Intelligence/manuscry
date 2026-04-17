import type { ChapterOutline } from '@manuscry/shared';

export function buildChapterWriterPrompt(
  bookBible: Record<string, unknown>,
  chapterOutline: ChapterOutline,
  previousChapters: Array<{ number: number; title: string; content: string }>,
  market: 'pt-br' | 'en',
): { system: string; user: string } {
  const lang = market === 'pt-br' ? 'português brasileiro' : 'English';

  const system = `Você é um escritor profissional especializado em livros para o mercado KDP.
Escreve com voz autoral consistente, ritmo controlado e técnica narrativa sólida.

REGRAS ABSOLUTAS:
- Escreva APENAS o conteúdo do capítulo. Sem comentários, sem meta-texto.
- NÃO comece com "Capítulo X" nem título — escreva direto o texto.
- Mantenha consistência total com o Book Bible e capítulos anteriores.
- Cada parágrafo deve avançar a narrativa ou desenvolver personagem.
- Use diálogos naturais com vozes distintas por personagem.
- O capítulo deve ter aproximadamente ${chapterOutline.estimated_words} palavras.
- Escreva em ${lang}.
- Termine com o gancho/cliffhanger indicado no roteiro.
- NÃO resuma, NÃO pule cenas. Escreva o capítulo completo com todos os detalhes.`;

  const previousContext = previousChapters.length > 0
    ? `\n\nÚLTIMOS CAPÍTULOS ESCRITOS (para continuidade):\n${previousChapters.map(
        (ch) => `--- Capítulo ${ch.number}: ${ch.title} ---\n${ch.content.slice(-2000)}\n`,
      ).join('\n')}`
    : '';

  const user = `BOOK BIBLE (DNA do livro — siga rigorosamente):
${JSON.stringify(bookBible, null, 2)}

ROTEIRO DESTE CAPÍTULO:
- Número: ${chapterOutline.number}
- Título: ${chapterOutline.title}
- Posição: ${chapterOutline.act_position}
- Tensão: ${chapterOutline.tension_level}/10
- Palavras alvo: ${chapterOutline.estimated_words}
- Objetivo narrativo: ${chapterOutline.narrative_objective}
- Resumo: ${chapterOutline.summary}
- Cenas: ${chapterOutline.scenes.join(' | ')}
- Arco emocional: ${chapterOutline.emotional_arc.start} → ${chapterOutline.emotional_arc.end}
- Sementes: ${chapterOutline.planted_seeds.join(', ') || 'nenhuma'}
- Cliffhanger: ${chapterOutline.cliffhanger || 'nenhum'}${previousContext}

Escreva o capítulo completo agora. Aproximadamente ${chapterOutline.estimated_words} palavras.`;

  return { system, user };
}

export function buildHumanizerPrompt(
  chapterContent: string,
  bookBible: Record<string, unknown>,
  market: 'pt-br' | 'en',
): { system: string; user: string } {
  const lang = market === 'pt-br' ? 'português brasileiro' : 'English';

  const system = `Você é um editor literário profissional. Sua tarefa é humanizar
e polir texto gerado por IA, tornando-o indistinguível de escrita humana profissional.

REGRAS:
- Mantenha a história, personagens e eventos EXATAMENTE iguais.
- Varie o tamanho das frases (curtas + longas).
- Adicione pequenas imperfeições estilísticas naturais.
- Use expressões idiomáticas e coloquialismos adequados ao tom.
- Substitua construções genéricas de IA por formulações originais.
- Melhore ritmo e cadência dos parágrafos.
- Fortaleça diálogos com naturalidade.
- Escreva em ${lang}.
- Retorne APENAS o texto revisado. Sem comentários.`;

  const user = `BOOK BIBLE (referência de tom e estilo):
Título: ${(bookBible as Record<string, string>).title || ''}
Tom: ${(bookBible as Record<string, string>).tone_of_voice || ''}
Estilo: ${(bookBible as Record<string, string>).narrative_style || ''}

TEXTO PARA HUMANIZAR:
${chapterContent}

Reescreva o texto acima mantendo a história idêntica mas com voz mais humana e natural.`;

  return { system, user };
}
