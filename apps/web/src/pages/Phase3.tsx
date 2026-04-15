import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { api } from '@/lib/api';
import type { Phase3Data } from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Phase3() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, fetchProject, updateProject } = useProjectStore();
  const [data, setData] = useState<Phase3Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) fetchProject(id);
  }, [id, fetchProject]);

  useEffect(() => {
    if (currentProject?.phase_3_data) {
      setData(currentProject.phase_3_data as Phase3Data);
    }
  }, [currentProject]);

  async function runPhase3() {
    if (!currentProject) return;
    setLoading(true);
    setError('');
    try {
      const result = await api.post<Phase3Data>('/api/pipeline/phase3', { projectId: currentProject.id });
      setData(result);
      updateProject(currentProject.id, {
        phase_3_data: result,
        current_phase: 4,
        phases_completed: [...new Set([...(currentProject.phases_completed || []), 3])],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar Fase 3');
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
            <Badge className="bg-[#1E3A8A]/30 text-[#93C5FD]">FASE 3</Badge>
            <h1 className="text-xl font-bold text-white">Narrative Architect</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">Roteiro completo capítulo a capítulo com mapa de tensão</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {!data && (
          <Card className="border-slate-700 bg-slate-900/50">
            <CardHeader><CardTitle className="text-white">Gerar Fase 3</CardTitle></CardHeader>
            <CardContent>
              <p className="text-slate-400 mb-4">Cria o plano narrativo que será usado na escrita da Fase 4.</p>
              <Button onClick={runPhase3} disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium">
                {loading ? 'Gerando...' : 'Gerar Roteiro'}
              </Button>
            </CardContent>
          </Card>
        )}

        {error && <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-lg">{error}</div>}

        {data && (
          <>
            <Card className="border-slate-700 bg-slate-900/50">
              <CardHeader><CardTitle className="text-white">Estratégia narrativa</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-slate-300">
                <p><span className="text-slate-500">Estrutura:</span> {data.narrative_structure}</p>
                <p><span className="text-slate-500">Ritmo:</span> {data.pacing_notes}</p>
                <p><span className="text-slate-500">Final:</span> {data.ending_strategy}</p>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-900/50">
              <CardHeader><CardTitle className="text-white">Mapa de tensão</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 text-slate-300 space-y-1">
                  {data.tension_map.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-900/50">
              <CardHeader><CardTitle className="text-white">Plano de capítulos</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {data.chapter_plan.map((chapter) => (
                  <div key={chapter.chapter} className="border border-slate-700 rounded-lg p-3 text-slate-300">
                    <p className="font-medium text-white">Capítulo {chapter.chapter}: {chapter.title}</p>
                    <p className="text-sm text-slate-400 mt-1">{chapter.summary}</p>
                    <p className="text-xs text-slate-500 mt-2">Meta: {chapter.target_words} palavras</p>
                    <p className="text-xs text-slate-500">Hook: {chapter.hook}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={runPhase3} variant="outline" className="border-slate-600 text-slate-300">Refazer</Button>
              <Button onClick={() => navigate(`/projects/${currentProject.id}`)} className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white">
                Concluir Fase 3
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
