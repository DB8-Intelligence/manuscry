import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { PIPELINE_PHASES } from '@manuscry/shared';
import PhaseCard from '../components/pipeline/PhaseCard';

function getPhaseStatus(
  phaseId: number,
  currentPhase: number,
  phasesCompleted: number[],
): 'locked' | 'active' | 'completed' {
  if (phasesCompleted.includes(phaseId)) return 'completed';
  if (phaseId === currentPhase) return 'active';
  if (phaseId === 0) return 'active'; // Phase 0 always starts active
  return 'locked';
}

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, loading, fetchProject } = useProjectStore();

  useEffect(() => {
    if (id) fetchProject(id);
  }, [id, fetchProject]);

  if (loading || !currentProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Carregando projeto...</div>
      </div>
    );
  }

  const phasesCompleted = currentProject.phases_completed || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            &larr; Voltar ao Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {currentProject.name}
          </h1>
          <p className="text-sm text-gray-500">
            {currentProject.genre} &middot;{' '}
            {currentProject.market === 'pt-br' ? 'PT-BR' : 'EN'} &middot;{' '}
            {phasesCompleted.length}/6 fases completas
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progresso</span>
            <span>{Math.round((phasesCompleted.length / 6) * 100)}%</span>
          </div>
          <div className="bg-gray-200 rounded-full h-3">
            <div
              className="bg-purple-500 h-3 rounded-full transition-all"
              style={{ width: `${(phasesCompleted.length / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Phase cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PIPELINE_PHASES.map((phase) => (
            <PhaseCard
              key={phase.id}
              phase={phase.id}
              name={phase.name}
              description={phase.description}
              status={getPhaseStatus(
                phase.id,
                currentProject.current_phase,
                phasesCompleted,
              )}
              onClick={() =>
                navigate(`/projects/${currentProject.id}/phase-${phase.id}`)
              }
            />
          ))}
        </div>
      </main>
    </div>
  );
}
