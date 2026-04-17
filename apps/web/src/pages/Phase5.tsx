import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { api } from '@/lib/api';
import type {
  Phase5Data, CoverData, CoverVariation, BiographyData,
} from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const COVER_LOADING = [
  'Analisando padrões visuais do gênero...',
  'Criando conceitos de capa...',
  'Gerando imagens via Flux Pro...',
  'Isso pode levar 1-2 minutos...',
];

const BIO_LOADING = [
  'Analisando o perfil do livro...',
  'Criando biografias por plataforma...',
  'Otimizando para KDP e redes sociais...',
];

function CoverCard({
  cover, onSelect, selected,
}: {
  cover: CoverVariation;
  onSelect: () => void;
  selected: boolean;
}) {
  const scoreColor = cover.score >= 8 ? 'text-emerald-400' : cover.score >= 6 ? 'text-amber-400' : 'text-slate-400';

  return (
    <Card className={`border-slate-700 bg-slate-900/50 overflow-hidden transition-all ${
      selected ? 'ring-2 ring-amber-500 border-amber-800' : 'hover:border-slate-600'
    }`}>
      {cover.image_url ? (
        <div className="aspect-[2/3] bg-slate-800 relative">
          <img
            src={cover.image_url}
            alt={`Capa variação ${cover.variation}`}
            className="w-full h-full object-cover"
          />
          {selected && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-amber-500 text-slate-900 font-bold">Selecionada</Badge>
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-[2/3] bg-slate-800 flex items-center justify-center">
          <span className="text-slate-600 text-sm">Falha ao gerar</span>
        </div>
      )}
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Badge className="bg-slate-800 text-slate-300 text-xs">{cover.style}</Badge>
          <span className={`font-bold ${scoreColor}`}>{cover.score.toFixed(1)}</span>
        </div>
        <p className="text-sm text-slate-400">{cover.concept}</p>
        <p className="text-xs text-slate-500">{cover.score_reason}</p>
        <div className="flex gap-1">
          {cover.color_palette.map((color, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full border border-slate-600"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        {cover.image_url && (
          <Button
            onClick={onSelect}
            size="sm"
            className={selected
              ? 'w-full bg-amber-500 hover:bg-amber-600 text-slate-900'
              : 'w-full bg-[#1E3A8A] hover:bg-[#1E40AF] text-white'
            }
          >
            {selected ? 'Selecionada' : 'Selecionar esta capa'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function BioSection({ label, content }: { label: string; content: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Card className="border-slate-700 bg-slate-900/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-sm">{label}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-xs text-slate-400 hover:text-white h-7"
          >
            {copied ? 'Copiado!' : 'Copiar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-slate-300 text-sm whitespace-pre-line leading-relaxed">{content}</p>
      </CardContent>
    </Card>
  );
}

export default function Phase5() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, fetchProject } = useProjectStore();

  const [coversLoading, setCoversLoading] = useState(false);
  const [coversLoadingMsg, setCoversLoadingMsg] = useState(0);
  const [bioLoading, setBioLoading] = useState(false);
  const [bioLoadingMsg, setBioLoadingMsg] = useState(0);
  const [error, setError] = useState('');

  // Biography form
  const [authorName, setAuthorName] = useState('');
  const [authorBackground, setAuthorBackground] = useState('');

  useEffect(() => {
    if (id) fetchProject(id);
  }, [id, fetchProject]);

  useEffect(() => {
    if (!coversLoading) return;
    const interval = setInterval(() => {
      setCoversLoadingMsg((p) => (p + 1) % COVER_LOADING.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [coversLoading]);

  useEffect(() => {
    if (!bioLoading) return;
    const interval = setInterval(() => {
      setBioLoadingMsg((p) => (p + 1) % BIO_LOADING.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [bioLoading]);

  const phase5Data = (currentProject?.phase_5_data || { covers: null, biography: null }) as Phase5Data;
  const coverData = phase5Data.covers;
  const bioData = phase5Data.biography;

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-slate-500">Carregando...</div>
      </div>
    );
  }

  async function generateCovers() {
    if (!id) return;
    setCoversLoading(true);
    setError('');
    setCoversLoadingMsg(0);
    try {
      await api.post<CoverData>('/api/covers/generate', { projectId: id });
      await fetchProject(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar capas');
    } finally {
      setCoversLoading(false);
    }
  }

  async function selectCover(index: number) {
    if (!id) return;
    try {
      await api.post('/api/covers/select', { projectId: id, variationIndex: index });
      await fetchProject(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao selecionar capa');
    }
  }

  async function generateBiography() {
    if (!id || !authorName) return;
    setBioLoading(true);
    setError('');
    setBioLoadingMsg(0);
    try {
      await api.post<BiographyData>('/api/biography/generate', {
        projectId: id,
        authorName,
        authorBackground,
      });
      await fetchProject(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar biografia');
    } finally {
      setBioLoading(false);
    }
  }

  const hasSelectedCover = coverData?.covers?.some((c) => c.selected) || false;

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/projects/${id}`)}
            className="text-slate-400 hover:text-white mb-3 -ml-2"
          >
            &larr; Voltar ao Projeto
          </Button>
          <div className="flex items-center gap-3">
            <Badge className="bg-[#1E3A8A]/30 text-[#93C5FD]">FASE 5</Badge>
            <h1 className="text-xl font-bold text-white">Production Studio</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Capas profissionais e biografia do autor
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <Tabs defaultValue="covers" className="w-full">
          <TabsList className="bg-slate-800 mb-6">
            <TabsTrigger
              value="covers"
              className="data-[state=active]:bg-[#1E3A8A] data-[state=active]:text-white"
            >
              Capas
              {hasSelectedCover && (
                <span className="ml-2 w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="biography"
              className="data-[state=active]:bg-[#1E3A8A] data-[state=active]:text-white"
            >
              Biografia
              {bioData && (
                <span className="ml-2 w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── COVERS TAB ── */}
          <TabsContent value="covers" className="space-y-6">
            {!coverData && !coversLoading && (
              <Card className="border-slate-700 bg-slate-900/50 text-center py-12">
                <CardContent className="space-y-4">
                  <div className="text-4xl mb-2">{'\u{1F3A8}'}</div>
                  <h3 className="text-lg font-semibold text-white">Gerar capas profissionais</h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    A IA analisa seu gênero e cria 5 variações de capa otimizadas para KDP via Flux Pro.
                  </p>
                  <Button
                    onClick={generateCovers}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium px-8"
                  >
                    Gerar 5 variações de capa
                  </Button>
                </CardContent>
              </Card>
            )}

            {coversLoading && (
              <Card className="border-slate-700 bg-slate-900/50 text-center py-16">
                <CardContent>
                  <div className="animate-spin w-8 h-8 border-4 border-slate-600 border-t-amber-500 rounded-full mx-auto mb-4" />
                  <p className="text-white font-medium">{COVER_LOADING[coversLoadingMsg]}</p>
                  <p className="text-sm text-slate-500 mt-2">Gerando 5 imagens via Fal.ai Flux Pro</p>
                </CardContent>
              </Card>
            )}

            {coverData && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">
                    {coverData.covers.length} variações geradas
                  </h3>
                  <Button
                    variant="ghost"
                    onClick={generateCovers}
                    disabled={coversLoading}
                    className="text-slate-500 hover:text-slate-300 text-sm"
                  >
                    Regerar capas
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {coverData.covers.map((cover, i) => (
                    <CoverCard
                      key={i}
                      cover={cover}
                      selected={cover.selected}
                      onSelect={() => selectCover(i)}
                    />
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* ── BIOGRAPHY TAB ── */}
          <TabsContent value="biography" className="space-y-6">
            {!bioData && !bioLoading && (
              <Card className="border-slate-700 bg-slate-900/50">
                <CardHeader>
                  <CardTitle className="text-white text-base">Informações do autor</CardTitle>
                  <p className="text-sm text-slate-400">
                    Gere biografias otimizadas para cada plataforma de publicação
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Nome do autor (como aparecerá no livro)</Label>
                    <Input
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Ex: Douglas Bonânzza"
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Background / experiência (opcional)</Label>
                    <textarea
                      value={authorBackground}
                      onChange={(e) => setAuthorBackground(e.target.value)}
                      placeholder="Ex: 10 anos de experiência em marketing digital, palestrante, mentor de startups..."
                      rows={3}
                      className="w-full rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-slate-500 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    />
                  </div>
                  <Button
                    onClick={generateBiography}
                    disabled={!authorName}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium"
                  >
                    Gerar pacote biográfico
                  </Button>
                </CardContent>
              </Card>
            )}

            {bioLoading && (
              <Card className="border-slate-700 bg-slate-900/50 text-center py-16">
                <CardContent>
                  <div className="animate-spin w-8 h-8 border-4 border-slate-600 border-t-amber-500 rounded-full mx-auto mb-4" />
                  <p className="text-white font-medium">{BIO_LOADING[bioLoadingMsg]}</p>
                </CardContent>
              </Card>
            )}

            {bioData && (
              <>
                {/* Author card */}
                <Card className="border-amber-800/30 bg-amber-950/10">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">{bioData.author_name}</h3>
                      <p className="text-amber-400 italic text-sm">{bioData.tagline}</p>
                      <div className="flex gap-1.5 mt-2">
                        {bioData.brand_keywords.map((kw, i) => (
                          <Badge key={i} className="bg-slate-800 text-slate-400 text-xs">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => { setBioLoading(false); generateBiography(); }}
                      className="text-slate-500 hover:text-slate-300 text-xs"
                    >
                      Regerar
                    </Button>
                  </CardContent>
                </Card>

                {/* Bios */}
                <div className="space-y-4">
                  <BioSection label="Amazon KDP (Página do Autor)" content={bioData.bios.kdp_full} />
                  <BioSection label="Contracapa (Impressa)" content={bioData.bios.back_cover} />
                  <BioSection label="Redes Sociais" content={bioData.bios.social_media} />
                  <BioSection label="Press Kit / Mídia" content={bioData.bios.press_kit} />
                  <BioSection label="Uma Linha (Email / Rodapé)" content={bioData.bios.one_liner} />
                </div>

                {/* Photo suggestions */}
                <Card className="border-slate-700 bg-slate-900/50">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Sugestões para foto do autor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Estilo</span>
                        <p className="text-slate-300">{bioData.photo_suggestions.style}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Vestuário</span>
                        <p className="text-slate-300">{bioData.photo_suggestions.clothing}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Cenário</span>
                        <p className="text-slate-300">{bioData.photo_suggestions.background}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Expressão</span>
                        <p className="text-slate-300">{bioData.photo_suggestions.mood}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
