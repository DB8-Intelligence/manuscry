import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { useUserStore } from '../stores/userStore';
import NewProjectModal from '../components/NewProjectModal';

const PHASE_LABELS = [
  'Análise de Mercado',
  'Seleção de Tema',
  'Conceito (Book Bible)',
  'Roteiro Narrativo',
  'Escrita',
  'Produção',
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useUserStore();
  const { projects, loading, fetchProjects } = useProjectStore();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-purple-600">Manuscry</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <button
              onClick={signOut}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Meus Livros</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            + Novo Livro
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Carregando...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-4xl mb-4">&#128218;</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum livro ainda
            </h3>
            <p className="text-gray-500 mb-4">
              Comece sua jornada como autor publicado
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Criar Meu Primeiro Livro
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:border-purple-300 hover:shadow-md transition-all"
              >
                <h3 className="font-semibold text-gray-900 mb-1">
                  {project.name}
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  {project.genre || 'Gênero não definido'} &middot;{' '}
                  {project.market === 'pt-br' ? 'PT-BR' : 'EN'}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${((project.phases_completed?.length || 0) / 6) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    Fase {project.current_phase} — {PHASE_LABELS[project.current_phase]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <NewProjectModal onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
