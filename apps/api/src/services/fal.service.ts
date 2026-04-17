import * as fal from '@fal-ai/serverless-client';

fal.config({
  credentials: process.env.FAL_KEY || '',
});

export interface FalImageResult {
  url: string;
  width: number;
  height: number;
  content_type: string;
}

interface FluxProOutput {
  images: FalImageResult[];
  seed: number;
  has_nsfw_concepts: boolean[];
}

export async function generateCoverImage(
  prompt: string,
  negativePrompt: string,
  aspectRatio: '2:3' | '3:4' = '2:3',
): Promise<FalImageResult> {
  const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
    input: {
      prompt,
      negative_prompt: negativePrompt,
      image_size: aspectRatio === '2:3'
        ? { width: 1024, height: 1536 }
        : { width: 1024, height: 1365 },
      num_inference_steps: 28,
      guidance_scale: 3.5,
      num_images: 1,
      safety_tolerance: '2',
    },
  }) as FluxProOutput;

  if (!result.images?.[0]) {
    throw new Error('Fal.ai did not return any images');
  }

  return result.images[0];
}

export async function generateMultipleCovers(
  prompts: string[],
  negativePrompt: string,
): Promise<FalImageResult[]> {
  const results = await Promise.allSettled(
    prompts.map((prompt) => generateCoverImage(prompt, negativePrompt)),
  );

  return results
    .filter((r): r is PromiseFulfilledResult<FalImageResult> => r.status === 'fulfilled')
    .map((r) => r.value);
}
