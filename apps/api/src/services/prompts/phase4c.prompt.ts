export function buildAudiobookAdapterPrompt(
  chapterContent: string,
  chapterNumber: number,
  chapterTitle: string,
  bookBible: Record<string, unknown>,
  market: 'pt-br' | 'en',
): { system: string; user: string } {
  const lang = market === 'pt-br' ? 'português brasileiro' : 'English';

  const system = `Você é um diretor de audiobooks profissional especializado em
adaptação de texto para narração. Converte capítulos de livro em scripts
prontos para gravação em plataformas como ElevenLabs, ACX (Audible) e
Findaway Voices.

REGRAS:
- Mantenha o texto integral — NÃO corte nem resuma conteúdo
- Adicione marcações de narração entre colchetes: [pausa], [ênfase], [sussurro], [tom grave], etc.
- Indique mudanças de personagem em diálogos: [VOZ: nome_personagem]
- Marque transições de cena: [TRANSIÇÃO: novo local/tempo]
- Indique ritmo: [RITMO: lento], [RITMO: acelerado], [RITMO: normal]
- Escreva em ${lang}
- Retorne APENAS JSON válido`;

  const user = `Book Bible (referência de tom e personagens):
Título: ${(bookBible as Record<string, string>).title || ''}
Tom: ${(bookBible as Record<string, string>).tone_of_voice || ''}
Estilo: ${(bookBible as Record<string, string>).narrative_style || ''}

Capítulo ${chapterNumber}: ${chapterTitle}

TEXTO ORIGINAL:
${chapterContent}

Converta para script de audiobook. Retorne este JSON:
{
  "chapter_number": ${chapterNumber},
  "chapter_title": "${chapterTitle}",
  "narration_script": "texto completo com marcações de narração inseridas",
  "estimated_duration_minutes": 15,
  "voice_notes": "notas gerais para o narrador sobre tom e ritmo deste capítulo",
  "character_voices": [
    {
      "character": "nome",
      "voice_direction": "descrição da voz (tom, velocidade, sotaque)"
    }
  ],
  "sound_cues": ["efeito sonoro sugerido e momento — opcional"]
}`;

  return { system, user };
}
