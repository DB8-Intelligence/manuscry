import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { api } from '@/lib/api';
import type { Phase1Data } from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Phase1() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, fetchProject, updateProject } = useProjectStore();
  const [data, setData] = useState<Phase1Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) fetchProject(id);
  }, [id, fetchProject]);

  useEffect(() => {
    if (currentProject?.phase_1_data) {
      setData(currentProject.phase_1_data as Phase1Data);
    }
  }, [currentProject]);

  async function runPhase1() {
    if (!currentProject) return;
    setLoading(true);
    setError('');
    try {
      const result = await api.post<Phase1Data>('/api/pipeline/phase1', { projectId: currentProject.id });
      setData(result);
      updateProject(currentProject.id, {
        phase_1_data: result,
        current_phase: 2,
        phases_completed: [...new Set([...(currentProject.phases_completed || []), 1])],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar Fase 1');
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
            <Badge className="bg-[#1E3A8A]/30 text-[#93C5FD]">FASE 1</Badge>
            <h1 className="text-xl font-bold text-white">Theme Selector</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">Validação de tema, promessa e posicionamento comercial</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {!data && (
          <Card className="border-slate-700 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white">Gerar Fase 1</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 mb-4">Usa o tema selecionado na Fase 0 para definir UVP e posicionamento.</p>
              <Button onClick={runPhase1} disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium">
                {loading ? 'Gerando...' : 'Gerar Estratégia'}
              </Button>
            </CardContent>
          </Card>
        )}

        {error && <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-lg">{error}</div>}

        {data && (
          <>
            <Card className="border-slate-700 bg-slate-900/50">
              <CardHeader><CardTitle className="text-white">Posicionamento</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-slate-300">
                <p><span className="text-slate-500">Tema:</span> {data.selected_theme_title}</p>
                <p><span className="text-slate-500">Público:</span> {data.target_audience}</p>
                <p><span className="text-slate-500">Ângulo único:</span> {data.unique_book_angle}</p>
                <p><span className="text-slate-500">Promessa:</span> {data.promise}</p>
                <p><span className="text-slate-500">Declaração:</span> {data.positioning_statement}</p>
                <p><span className="text-slate-500">UVP Score:</span> {data.uvp_score.toFixed(1)}</p>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-900/50">
              <CardHeader><CardTitle className="text-white">Checklist de validação</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 text-slate-300 space-y-1">
                  {data.validation_checklist.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={runPhase1} variant="outline" className="border-slate-600 text-slate-300">Refazer</Button>
              <Button onClick={() => navigate(`/projects/${currentProject.id}/phase-2`)} className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white">
                Ir para Fase 2
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
