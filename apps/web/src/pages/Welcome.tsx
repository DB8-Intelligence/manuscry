import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProjectStore } from '@/stores/projectStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STEPS = [
  { title: 'Bem-vindo ao Manuscry', subtitle: 'Do manuscrito ao mercado' },
  { title: 'Sobre o seu livro', subtitle: 'Vamos criar seu primeiro projeto' },
  { title: 'Pronto!', subtitle: 'Seu livro está a caminho' },
];

const FICTION_GENRES = [
  'Romance', 'Suspense / Thriller', 'Ficção Científica', 'Fantasia',
  'Terror / Horror', 'Dark Romance', 'Comédia Romântica', 'Ficção Histórica',
];
const NONFICTION_GENRES = [
  'Autoajuda', 'Negócios', 'Produtividade', 'Saúde / Bem-estar',
  'Marketing Digital', 'Espiritualidade', 'Tecnologia / IA',
];

export default function Welcome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createProject } = useProjectStore();
  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState('');
  const [genreMode, setGenreMode] = useState<'fiction' | 'nonfiction'>('fiction');
  const [genre, setGenre] = useState('');
  const [market, setMarket] = useState<'pt-br' | 'en'>('pt-br');

  const genres = genreMode === 'fiction' ? FICTION_GENRES : NONFICTION_GENRES;

  async function handleCreate() {
    if (!name || !genre) return;
    setCreating(true);
    try {
      const project = await createProject({ name, market, genre, genre_mode: genreMode });
      setStep(2);
      setTimeout(() => navigate(`/projects/${project.id}/phase-0`), 2000);
    } catch {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step ? 'bg-amber-500 w-6' : i < step ? 'bg-amber-500/50' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <Card className="border-slate-700 bg-slate-900/80 backdrop-blur">
            <CardContent className="p-8 text-center space-y-6">
              <h1 className="text-3xl font-bold text-white tracking-tight">Manuscry</h1>
              <p className="text-slate-400">Do conceito ao livro publicado com IA</p>

              <div className="space-y-3 text-left">
                {[
                  { icon: '\u{1F4CA}', text: 'Análise de mercado KDP com score de oportunidade' },
                  { icon: '\u{1F4D6}', text: 'Escrita completa com Book Bible + streaming' },
                  { icon: '\u{1F3A8}', text: 'Capas profissionais geradas por IA' },
                  { icon: '\u{1F4E6}', text: 'EPUB + PDF prontos para publicação' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm text-slate-300">{item.text}</span>
                  </div>
                ))}
              </div>

              <div>
                <Badge className="bg-amber-500/20 text-amber-400 mb-3">14 dias grátis</Badge>
                <p className="text-xs text-slate-500">
                  Olá, {user?.email}! Vamos criar seu primeiro livro?
                </p>
              </div>

              <Button
                onClick={() => setStep(1)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium"
              >
                Criar meu primeiro livro
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="w-full text-slate-500 hover:text-slate-300"
              >
                Ir direto ao dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Create project */}
        {step === 1 && (
          <Card className="border-slate-700 bg-slate-900/80 backdrop-blur">
            <CardContent className="p-8 space-y-5">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-white">{STEPS[1].title}</h2>
                <p className="text-sm text-slate-400">{STEPS[1].subtitle}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Como se chama seu livro?</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Recomeços Invisíveis"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Tipo</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['fiction', 'nonfiction'] as const).map((mode) => (
                    <Button
                      key={mode}
                      type="button"
                      variant={genreMode === mode ? 'default' : 'outline'}
                      onClick={() => { setGenreMode(mode); setGenre(''); }}
                      className={genreMode === mode ? 'bg-[#1E3A8A] hover:bg-[#1E40AF]' : 'border-slate-600 text-slate-300'}
                    >
                      {mode === 'fiction' ? 'Ficção' : 'Não-ficção'}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Gênero</Label>
                <Select value={genre} onValueChange={(v) => setGenre(v ?? '')}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {genres.map((g) => (
                      <SelectItem key={g} value={g} className="text-white hover:bg-slate-700">{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Mercado</Label>
                <div className="grid grid-cols-2 gap-2">
                  {([['pt-br', 'PT-BR'], ['en', 'English']] as const).map(([val, label]) => (
                    <Button
                      key={val}
                      type="button"
                      variant={market === val ? 'default' : 'outline'}
                      onClick={() => setMarket(val as 'pt-br' | 'en')}
                      className={market === val ? 'bg-[#1E3A8A] hover:bg-[#1E40AF]' : 'border-slate-600 text-slate-300'}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1 border-slate-600 text-slate-300">
                  Voltar
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!name || !genre || creating}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium"
                >
                  {creating ? 'Criando...' : 'Criar e começar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Success */}
        {step === 2 && (
          <Card className="border-slate-700 bg-slate-900/80 backdrop-blur">
            <CardContent className="p-8 text-center space-y-4">
              <div className="text-5xl">{'\u{1F389}'}</div>
              <h2 className="text-xl font-bold text-white">Projeto criado!</h2>
              <p className="text-slate-400">Redirecionando para a análise de mercado...</p>
              <div className="animate-spin w-6 h-6 border-2 border-slate-600 border-t-amber-500 rounded-full mx-auto" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
