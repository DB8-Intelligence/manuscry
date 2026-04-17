import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Phase1Data, Phase2Data, Phase3Data, AuthorAnswers } from '@manuscry/shared';

interface MutationResult<T, A extends unknown[]> {
  data: T | null;
  loading: boolean;
  error: string | null;
  run: (...args: A) => Promise<T | null>;
  reset: () => void;
}

function useMutation<T, A extends unknown[]>(
  fn: (...args: A) => Promise<T>,
): MutationResult<T, A> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (...args: A): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn(...args);
      setData(result);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fn]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, run, reset };
}

export function usePhase1(projectId: string) {
  const mutationFn = useCallback(
    async (authorAnswers: AuthorAnswers): Promise<Phase1Data> => {
      return api.post<Phase1Data>('/api/pipeline/phase1', {
        projectId,
        authorAnswers,
      });
    },
    [projectId],
  );

  return useMutation(mutationFn);
}

export function usePhase2(projectId: string) {
  const mutationFn = useCallback(
    async (): Promise<Phase2Data> => {
      return api.post<Phase2Data>('/api/pipeline/phase2', { projectId });
    },
    [projectId],
  );

  return useMutation(mutationFn);
}

export function usePhase3(projectId: string) {
  const mutationFn = useCallback(
    async (): Promise<Phase3Data> => {
      return api.post<Phase3Data>('/api/pipeline/phase3', { projectId });
    },
    [projectId],
  );

  return useMutation(mutationFn);
}
