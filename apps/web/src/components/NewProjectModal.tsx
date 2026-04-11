import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';

const FICTION_GENRES = [
  'Romance', 'Suspense / Thriller', 'Ficção Científica', 'Fantasia',
  'Terror / Horror', 'Mistério / Policial', 'Drama', 'Aventura',
  'Dark Romance', 'Comédia Romântica', 'Distopia', 'Ficção Histórica',
];

const NONFICTION_GENRES = [
  'Autoajuda / Desenvolvimento Pessoal', 'Negócios / Empreendedorismo',
  'Finanças Pessoais', 'Produtividade', 'Saúde / Bem-estar',
  'Psicologia', 'Marketing Digital', 'Liderança',
  'Educação / Pedagogia', 'Espiritualidade', 'Biografia',
  'Culinária', 'Tecnologia / IA',
];

interface Props {
  onClose: () => void;
}

export default function NewProjectModal({ onClose }: Props) {
  const navigate = useNavigate();
  const createProject = useProjectStore((s) => s.createProject);
  const [name, setName] = useState('');
  const [genreMode, setGenreMode] = useState<'fiction' | 'nonfiction'>('fiction');
  const [genre, setGenre] = useState('');
  const [market, setMarket] = useState<'pt-br' | 'en'>('pt-br');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const genres = genreMode === 'fiction' ? FICTION_GENRES : NONFICTION_GENRES;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !genre) {
      setError('Nome e gênero são obrigatórios');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const project = await createProject({ name, market, genre, genre_mode: genreMode });
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar projeto');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Novo Livro</h2>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do projeto
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder="Ex: Meu Primeiro Romance"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setGenreMode('fiction'); setGenre(''); }}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  genreMode === 'fiction'
                    ? 'bg-purple-50 border-purple-300 text-purple-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Ficção
              </button>
              <button
                type="button"
                onClick={() => { setGenreMode('nonfiction'); setGenre(''); }}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  genreMode === 'nonfiction'
                    ? 'bg-purple-50 border-purple-300 text-purple-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Não-ficção
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gênero
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              required
            >
              <option value="">Selecione um gênero</option>
              {genres.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mercado
            </label>
            <select
              value={market}
              onChange={(e) => setMarket(e.target.value as 'pt-br' | 'en')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            >
              <option value="pt-br">Português (Amazon.com.br)</option>
              <option value="en">English (Amazon.com)</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Criando...' : 'Criar Livro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
