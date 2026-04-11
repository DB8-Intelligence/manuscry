import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-5';

export async function generateStructured<T>(
  system: string,
  user: string,
  maxTokens = 4096,
): Promise<T> {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  });
  const text = res.content[0].type === 'text' ? res.content[0].text : '';
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
}

export async function streamChapter(
  system: string,
  user: string,
  onChunk: (text: string) => void,
  onDone: () => void,
): Promise<void> {
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 8096,
    system,
    messages: [{ role: 'user', content: user }],
  });
  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      onChunk(chunk.delta.text);
    }
  }
  onDone();
}
