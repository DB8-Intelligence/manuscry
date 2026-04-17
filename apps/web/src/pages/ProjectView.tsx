import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { PIPELINE_PHASES } from '@manuscry/shared';
import type { Phase4Data, Phase5Data, CoverData } from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function getPhaseStatus(
  phaseId: number,
  currentPhase: number,
  phasesCompleted: number[],
): 'locked' | 'active' | 'completed' {
  if (phasesCompleted.includes(phaseId)) return 'completed';
  if (phaseId === currentPhase) return 'active';
  if (phaseId === 0) return 'active';
  return 'locked';
}

const STATUS_STYLES = {
  locked: 'opacity-40 cursor-not-allowed border-slate-700 bg-slate-900/30',
  active: 'cursor-pointer border-[#1E3A8A]/50 bg-slate-900/50 hover:border-[#1E3A8A] hover:bg-slate-800/60',
  completed: 'cursor-pointer border-emerald-800/50 bg-emerald-950/20 hover:border-emerald-700',
};

const STATUS_BADGES = {
  locked: { text: 'Bloqueada', className: 'bg-slate-800 text-slate-500' },
  active: { text: 'Ativa', className: 'bg-[#1E3A8A]/30 text-[#93C5FD]' },
  completed: { text: 'Concluída', className: 'bg-emerald-900/30 text-emerald-400' },
};

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, loading, fetchProject } = useProjectStore();

  useEffect(() => {
    if (id) fetchProject(id);
  }, [id, fetchProject]);

  if (loading || !currentProject) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-slate-500">Carregando projeto...</div>
      </div>
    );
  }

  const phasesCompleted = currentProject.phases_completed || [];

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-white mb-3 -ml-2"
          >
            &larr; Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-white">{currentProject.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="secondary" className="bg-slate-800 text-slate-300">
              {currentProject.genre}
            </Badge>
            <Badge variant="secondary" className="bg-slate-800 text-slate-300">
              {currentProject.market === 'pt-br' ? 'PT-BR' : 'EN'}
            </Badge>
            <span className="text-sm text-slate-500">
              {phasesCompleted.length}/6 fases completas
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span>Progresso do livro</span>
            <span>{Math.round((phasesCompleted.length / 6) * 100)}%</span>
          </div>
          <div className="bg-slate-800 rounded-full h-2">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all"
              style={{ width: `${(phasesCompleted.length / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Phase cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PIPELINE_PHASES.map((phase) => {
            const status = getPhaseStatus(phase.id, currentProject.current_phase, phasesCompleted);
            const badge = STATUS_BADGES[status];
            return (
              <button
                key={phase.id}
                onClick={status !== 'locked' ? () => navigate(`/projects/${currentProject.id}/phase-${phase.id}`) : undefined}
                disabled={status === 'locked'}
                className={`w-full text-left rounded-xl border p-5 transition-all ${STATUS_STYLES[status]}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-mono text-slate-500">FASE {phase.id}</span>
                  <Badge className={badge.className}>{badge.text}</Badge>
                </div>
                <h3 className="font-semibold text-white mb-1">{phase.name}</h3>
                <p className="text-sm text-slate-400">{phase.description}</p>
              </button>
            );
          })}
        </div>

        {/* Quick actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Manuscript Editor */}
          <button
            onClick={() => navigate(`/projects/${currentProject.id}/editor`)}
            className="text-left rounded-xl border border-blue-800/30 bg-blue-950/10 p-5 hover:border-blue-700/50 transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-mono text-blue-400">EDITOR</span>
              {(currentProject.phase_4_data as Phase4Data | null)?.manuscript_status === 'review' && (
                <Badge className="bg-amber-900/30 text-amber-400 text-xs">Em revisão</Badge>
              )}
            </div>
            <h3 className="font-semibold text-white mb-1">{'\u{1F4DD}'} Editor de Manuscrito</h3>
            <p className="text-sm text-slate-400">Edite seu rascunho como um Word e envie para publicação</p>
          </button>

          {/* Cover preview */}
          {(() => {
            const covers = (currentProject.phase_5_data as Phase5Data | null)?.covers as CoverData | null;
            const selected = covers?.covers?.find((c) => c.selected);
            return (
              <button
                onClick={() => navigate(`/projects/${currentProject.id}/phase-5`)}
                className="text-left rounded-xl border border-amber-800/30 bg-amber-950/10 p-5 hover:border-amber-700/50 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-mono text-amber-400">CAPAS</span>
                  {covers && (
                    <Badge className="bg-slate-800 text-slate-400 text-xs">
                      {covers.generation_count}/{covers.max_generations} gerações
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-white mb-1">{'\u{1F3A8}'} Capas e Contracapa</h3>
                <p className="text-sm text-slate-400">
                  {selected
                    ? `Capa selecionada: "${selected.style}" (score ${selected.score.toFixed(1)})`
                    : '3 modelos por vez, máximo 3 gerações por livro'}
                </p>
              </button>
            );
          })()}
        </div>

        {/* Editorial Calendar */}
        <div className="mt-4">
          <button
            onClick={() => navigate(`/projects/${currentProject.id}/calendar`)}
            className="w-full text-left rounded-xl border border-emerald-800/30 bg-emerald-950/10 p-5 hover:border-emerald-700/50 transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-mono text-emerald-400">PLANEJAMENTO</span>
              <Badge className="bg-emerald-900/30 text-emerald-400">{'\u{1F4C5}'} Timeline</Badge>
            </div>
            <h3 className="font-semibold text-white mb-1">Calendário Editorial</h3>
            <p className="text-sm text-slate-400">Planeje deadlines por fase e veja o progresso visual do projeto</p>
          </button>
        </div>

        {/* Social Studio */}
        <div className="mt-4">
          <button
            onClick={() => navigate(`/projects/${currentProject.id}/social`)}
            className="w-full text-left rounded-xl border border-purple-800/30 bg-purple-950/10 p-5 hover:border-purple-700/50 transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-mono text-purple-400">ADD-ON</span>
              <Badge className="bg-purple-900/30 text-purple-400">R$39/rede</Badge>
            </div>
            <h3 className="font-semibold text-white mb-1">{'\u{1F3AC}'} Social Studio</h3>
            <p className="text-sm text-slate-400">Crie reels, posts e carrosséis a partir do seu livro para impulsionar vendas</p>
          </button>
        </div>
      </main>
    </div>
  );
}
