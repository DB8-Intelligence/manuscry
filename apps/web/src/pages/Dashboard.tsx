import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProjectStore } from '@/stores/projectStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PHASE_LABELS = [
  'Análise de Mercado',
  'Seleção de Tema',
  'Conceito (Book Bible)',
  'Roteiro Narrativo',
  'Escrita',
  'Produção',
];

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

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { projects, loading, fetchProjects, createProject } = useProjectStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // New project form
  const [name, setName] = useState('');
  const [genreMode, setGenreMode] = useState<'fiction' | 'nonfiction'>('fiction');
  const [genre, setGenre] = useState('');
  const [market, setMarket] = useState<'pt-br' | 'en'>('pt-br');

  const genres = genreMode === 'fiction' ? FICTION_GENRES : NONFICTION_GENRES;

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  async function handleCreate() {
    if (!name || !genre) { setError('Nome e gênero são obrigatórios'); return; }
    setCreating(true);
    setError('');
    try {
      const project = await createProject({ name, market, genre, genre_mode: genreMode });
      setModalOpen(false);
      setName(''); setGenre('');
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar projeto');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#0F172A]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 p-6 flex flex-col">
        <h1 className="text-xl font-bold text-white mb-8 tracking-tight">Manuscry</h1>
        <nav className="space-y-1 flex-1">
          <button className="w-full text-left px-3 py-2 rounded-lg bg-[#1E3A8A]/20 text-[#93C5FD] text-sm font-medium">
            {'\u{1F4DA}'} Meus Livros
          </button>
          <button
            onClick={() => navigate('/analytics')}
            className="w-full text-left px-3 py-2 rounded-lg text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 text-sm transition-colors"
          >
            {'\u{1F4CA}'} Analytics
          </button>
          <button
            onClick={() => navigate('/achievements')}
            className="w-full text-left px-3 py-2 rounded-lg text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 text-sm transition-colors"
          >
            {'\u{1F3C6}'} Conquistas
          </button>
          <button
            onClick={() => navigate('/royalties')}
            className="w-full text-left px-3 py-2 rounded-lg text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 text-sm transition-colors"
          >
            {'\u{1F4B0}'} Royalties
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="w-full text-left px-3 py-2 rounded-lg text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 text-sm transition-colors"
          >
            {'\u2699\uFE0F'} Configurações
          </button>
        </nav>
        <div className="text-xs text-slate-500 mt-auto pt-4 border-t border-slate-800">
          <p className="truncate mb-1">{user?.email}</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-slate-800 px-8 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Meus Livros</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-slate-400 hover:text-white">
              Sair
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8">
          {/* Stats cards */}
          {projects.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-slate-700 bg-slate-900/50">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-500">Projetos</p>
                  <p className="text-2xl font-bold text-white">{projects.length}</p>
                </CardContent>
              </Card>
              <Card className="border-slate-700 bg-slate-900/50">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-500">Em andamento</p>
                  <p className="text-2xl font-bold text-amber-400">{projects.filter(p => p.status === 'active').length}</p>
                </CardContent>
              </Card>
              <Card className="border-slate-700 bg-slate-900/50">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-500">Publicados</p>
                  <p className="text-2xl font-bold text-emerald-400">{projects.filter(p => p.status === 'published').length}</p>
                </CardContent>
              </Card>
              <Card className="border-slate-700 bg-slate-900/50">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-500">Fase média</p>
                  <p className="text-2xl font-bold text-[#93C5FD]">
                    {projects.length > 0
                      ? (projects.reduce((sum, p) => sum + (p.current_phase || 0), 0) / projects.length).toFixed(1)
                      : '0'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <p className="text-slate-400 text-sm">
              {projects.length === 0 ? 'Nenhum livro ainda' : `${projects.length} projeto${projects.length > 1 ? 's' : ''}`}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/upload')}
                className="border-slate-600 text-slate-300 hover:text-white"
              >
                {'\u{1F4C4}'} Importar manuscrito
              </Button>
              <Button onClick={() => setModalOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium">
                + Novo Livro
              </Button>
            </div>
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
              <DialogContent className="bg-slate-900 border-slate-700 text-white">
                <DialogHeader>
                  <DialogTitle>Novo Livro</DialogTitle>
                </DialogHeader>
                {error && (
                  <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm p-3 rounded-lg">
                    {error}
                  </div>
                )}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Título do projeto</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Meu Primeiro Romance"
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Tipo</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={genreMode === 'fiction' ? 'default' : 'outline'}
                        onClick={() => { setGenreMode('fiction'); setGenre(''); }}
                        className={genreMode === 'fiction' ? 'bg-[#1E3A8A] hover:bg-[#1E40AF]' : 'border-slate-600 text-slate-300'}
                      >
                        Ficção
                      </Button>
                      <Button
                        type="button"
                        variant={genreMode === 'nonfiction' ? 'default' : 'outline'}
                        onClick={() => { setGenreMode('nonfiction'); setGenre(''); }}
                        className={genreMode === 'nonfiction' ? 'bg-[#1E3A8A] hover:bg-[#1E40AF]' : 'border-slate-600 text-slate-300'}
                      >
                        Não-ficção
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Gênero</Label>
                    <Select value={genre} onValueChange={(v) => setGenre(v ?? '')}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue placeholder="Selecione um gênero" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        {genres.map((g) => (
                          <SelectItem key={g} value={g} className="text-white hover:bg-slate-700">
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Mercado</Label>
                    <Select value={market} onValueChange={(v) => { if (v) setMarket(v as 'pt-br' | 'en'); }}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="pt-br" className="text-white">Português (Amazon.com.br)</SelectItem>
                        <SelectItem value="en" className="text-white">English (Amazon.com)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setModalOpen(false)}
                      className="flex-1 border-slate-600 text-slate-300"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={creating}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium"
                    >
                      {creating ? 'Criando...' : 'Criar Livro'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500">Carregando...</div>
          ) : projects.length === 0 ? (
            <Card className="border-slate-700 bg-slate-900/50 text-center py-16">
              <CardContent>
                <div className="text-5xl mb-4">&#128218;</div>
                <h3 className="text-lg font-medium text-white mb-2">Comece sua jornada</h3>
                <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                  Crie seu primeiro livro e deixe a IA guiar você do conceito à publicação
                </p>
                <Button onClick={() => setModalOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium">
                  Criar Meu Primeiro Livro
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="border-slate-700 bg-slate-900/50 hover:border-[#1E3A8A]/50 hover:bg-slate-800/50 transition-all cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-base">{project.name}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-xs">
                        {project.genre || 'Sem gênero'}
                      </Badge>
                      <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-xs">
                        {project.market === 'pt-br' ? 'PT-BR' : 'EN'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-800 rounded-full h-1.5">
                        <div
                          className="bg-amber-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${((project.phases_completed?.length || 0) / 6) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        Fase {project.current_phase} — {PHASE_LABELS[project.current_phase]}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
