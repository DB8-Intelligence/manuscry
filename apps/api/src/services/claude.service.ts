import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

type AIProvider = 'anthropic' | 'openai' | 'gemini';

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const anthropicClient = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;
const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

function parseJsonResponse<T>(raw: string): T {
  return JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim()) as T;
}

function getProviderOrder(): AIProvider[] {
  const configured = (process.env.AI_PROVIDER || 'anthropic').toLowerCase();
  const primary = (['anthropic', 'openai', 'gemini'].includes(configured)
    ? configured
    : 'anthropic') as AIProvider;

  const fallback = (process.env.AI_PROVIDER_FALLBACK || 'anthropic,openai,gemini')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((value): value is AIProvider => ['anthropic', 'openai', 'gemini'].includes(value));

  const uniqueFallback = [...new Set(fallback)];
  const withoutPrimary = uniqueFallback.filter((provider) => provider !== primary);
  return [primary, ...withoutPrimary];
}

function hasClient(provider: AIProvider): boolean {
  if (provider === 'anthropic') return anthropicClient !== null;
  if (provider === 'openai') return openaiClient !== null;
  return geminiClient !== null;
}

async function generateWithAnthropic<T>(
  system: string,
  user: string,
  maxTokens: number,
): Promise<T> {
  if (!anthropicClient) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const res = await anthropicClient.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  });
  const text = res.content[0]?.type === 'text' ? res.content[0].text : '';
  return parseJsonResponse<T>(text);
}

async function generateWithOpenAI<T>(
  system: string,
  user: string,
  maxTokens: number,
): Promise<T> {
  if (!openaiClient) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const completion = await openaiClient.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.2,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: `${system}\nRespond with JSON only.` },
      { role: 'user', content: user },
    ],
  });

  const content = completion.choices[0]?.message?.content || '{}';
  return parseJsonResponse<T>(content);
}

async function generateWithGemini<T>(
  system: string,
  user: string,
): Promise<T> {
  if (!geminiClient) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = geminiClient.getGenerativeModel({ model: GEMINI_MODEL });
  const result = await model.generateContent([
    `${system}\nRespond with valid JSON only.`,
    user,
  ]);
  const text = result.response.text();
  return parseJsonResponse<T>(text);
}

export async function generateStructured<T>(
  system: string,
  user: string,
  maxTokens = 4096,
): Promise<T> {
  const attempts: string[] = [];

  for (const provider of getProviderOrder()) {
    if (!hasClient(provider)) {
      attempts.push(`${provider}: missing API key`);
      continue;
    }

    try {
      if (provider === 'anthropic') {
        return await generateWithAnthropic<T>(system, user, maxTokens);
      }
      if (provider === 'openai') {
        return await generateWithOpenAI<T>(system, user, maxTokens);
      }
      return await generateWithGemini<T>(system, user);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      attempts.push(`${provider}: ${message}`);
    }
  }

  throw new Error(`All AI providers failed. ${attempts.join(' | ')}`);
}

export async function streamChapter(
  system: string,
  user: string,
  onChunk: (text: string) => void,
  onDone: () => void,
): Promise<void> {
  if (!anthropicClient) {
    throw new Error('Streaming currently requires ANTHROPIC_API_KEY');
  }

  const stream = anthropicClient.messages.stream({
    model: ANTHROPIC_MODEL,
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
