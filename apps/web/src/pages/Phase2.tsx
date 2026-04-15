import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { api } from '@/lib/api';
import type { Phase2Data } from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Phase2() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, fetchProject, updateProject } = useProjectStore();
  const [data, setData] = useState<Phase2Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) fetchProject(id);
  }, [id, fetchProject]);

  useEffect(() => {
    if (currentProject?.phase_2_data) {
      setData(currentProject.phase_2_data as Phase2Data);
    }
  }, [currentProject]);

  async function runPhase2() {
    if (!currentProject) return;
    setLoading(true);
    setError('');
    try {
      const result = await api.post<Phase2Data>('/api/pipeline/phase2', { projectId: currentProject.id });
      setData(result);
      updateProject(currentProject.id, {
        phase_2_data: result,
        current_phase: 3,
        phases_completed: [...new Set([...(currentProject.phases_completed || []), 2])],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar Fase 2');
    } finally {
      setLoading(false);
    }
  }

  if (!currentProject) {
    return <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-slate-400">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${currentProject.id}`)} className="text-slate-400 hover:text-white mb-3 -ml-2">
            &larr; Voltar ao Projeto
          </Button>
          <div className="flex items-center gap-3">
            <Badge className="bg-[#1E3A8A]/30 text-[#93C5FD]">FASE 2</Badge>
            <h1 className="text-xl font-bold text-white">Concept Builder</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">Construção do Book Bible para consistência editorial</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {!data && (
          <Card className="border-slate-700 bg-slate-900/50">
            <CardHeader><CardTitle className="text-white">Gerar Fase 2</CardTitle></CardHeader>
            <CardContent>
              <p className="text-slate-400 mb-4">Cria o DNA completo do livro para orientar toda a escrita.</p>
              <Button onClick={runPhase2} disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium">
                {loading ? 'Gerando...' : 'Gerar Book Bible'}
              </Button>
            </CardContent>
          </Card>
        )}

        {error && <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-lg">{error}</div>}

        {data && (
          <>
            <Card className="border-slate-700 bg-slate-900/50">
              <CardHeader><CardTitle className="text-white">Conceito</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-slate-300">
                <p><span className="text-slate-500">Título:</span> {data.working_title}</p>
                <p><span className="text-slate-500">Subtítulo:</span> {data.subtitle}</p>
                <p><span className="text-slate-500">Premissa:</span> {data.premise}</p>
                <p><span className="text-slate-500">Voz:</span> {data.author_voice}</p>
                <p><span className="text-slate-500">Mensagem central:</span> {data.core_message}</p>
                <p><span className="text-slate-500">Transformação:</span> {data.reader_transformation}</p>
                <p><span className="text-slate-500">Meta de palavras:</span> {data.target_word_count}</p>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-900/50">
              <CardHeader><CardTitle className="text-white">Seeds de capítulos</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-slate-300">
                {data.chapters_seed.map((chapter) => (
                  <div key={chapter.chapter} className="border border-slate-700 rounded-lg p-3">
                    <p className="font-medium text-white">Capítulo {chapter.chapter}: {chapter.title}</p>
                    <p className="text-sm text-slate-400 mt-1">{chapter.goal}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-900/50">
              <CardHeader><CardTitle className="text-white">Book Bible</CardTitle></CardHeader>
              <CardContent>
                <p className="text-slate-300 whitespace-pre-wrap">{data.book_bible}</p>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={runPhase2} variant="outline" className="border-slate-600 text-slate-300">Refazer</Button>
              <Button onClick={() => navigate(`/projects/${currentProject.id}/phase-3`)} className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white">
                Ir para Fase 3
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
