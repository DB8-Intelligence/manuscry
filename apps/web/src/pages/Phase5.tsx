import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { api } from '@/lib/api';
import type {
  Phase5Data, CoverData, CoverVariation, BiographyData,
  BookDesignData, KdpMetadata, AudiobookData, AudiobookChapterScript, Phase4Data,
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

const DESIGN_LOADING = [
  'Calculando trim size e margens...',
  'Definindo tipografia para o gênero...',
  'Gerando specs de dust jacket...',
];

const META_LOADING = [
  'Pesquisando keywords KDP...',
  'Otimizando categorias BISAC...',
  'Criando descrição HTML...',
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
  const [designLoading, setDesignLoading] = useState(false);
  const [designLoadingMsg, setDesignLoadingMsg] = useState(0);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaLoadingMsg, setMetaLoadingMsg] = useState(0);
  const [audioLoading, setAudioLoading] = useState(false);
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

  useEffect(() => {
    if (!designLoading) return;
    const interval = setInterval(() => {
      setDesignLoadingMsg((p) => (p + 1) % DESIGN_LOADING.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [designLoading]);

  useEffect(() => {
    if (!metaLoading) return;
    const interval = setInterval(() => {
      setMetaLoadingMsg((p) => (p + 1) % META_LOADING.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [metaLoading]);

  const phase5Data = (currentProject?.phase_5_data || { covers: null, biography: null, design: null, metadata: null, audiobook: null }) as Phase5Data;
  const coverData = phase5Data.covers;
  const bioData = phase5Data.biography;
  const designData = phase5Data.design;
  const metaData = phase5Data.metadata;
  const audioData = phase5Data.audiobook;
  const phase4Data = (currentProject?.phase_4_data || { chapters: [] }) as Phase4Data;

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

  async function generateDesign() {
    if (!id) return;
    setDesignLoading(true);
    setError('');
    setDesignLoadingMsg(0);
    try {
      await api.post<BookDesignData>('/api/production/design', { projectId: id });
      await fetchProject(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar specs de design');
    } finally {
      setDesignLoading(false);
    }
  }

  async function generateMetadata() {
    if (!id) return;
    setMetaLoading(true);
    setError('');
    setMetaLoadingMsg(0);
    try {
      await api.post<KdpMetadata>('/api/production/metadata', { projectId: id });
      await fetchProject(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar metadados');
    } finally {
      setMetaLoading(false);
    }
  }

  async function generateAllAudiobook() {
    if (!id) return;
    setAudioLoading(true);
    setError('');
    try {
      await api.post<AudiobookData>('/api/production/audiobook/all', { projectId: id });
      await fetchProject(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar audiobook');
    } finally {
      setAudioLoading(false);
    }
  }

  const [exportLoading, setExportLoading] = useState<'epub' | 'pdf' | null>(null);

  async function downloadExport(format: 'epub' | 'pdf') {
    if (!id) return;
    setExportLoading(format);
    setError('');
    try {
      const headers = await (async () => {
        const { supabase } = await import('@/lib/supabase');
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        return token ? { Authorization: `Bearer ${token}` } : {} as Record<string, string>;
      })();
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/production/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers } as HeadersInit,
        body: JSON.stringify({ projectId: id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(body.error || res.statusText);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] || `book.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Erro ao exportar ${format.toUpperCase()}`);
    } finally {
      setExportLoading(null);
    }
  }

  const hasSelectedCover = coverData?.covers?.some((c) => c.selected) || false;
  const hasWrittenChapters = phase4Data.chapters.some((ch) => ch.content);

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
            <TabsTrigger
              value="design"
              className="data-[state=active]:bg-[#1E3A8A] data-[state=active]:text-white"
            >
              Design
              {designData && (
                <span className="ml-2 w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="metadata"
              className="data-[state=active]:bg-[#1E3A8A] data-[state=active]:text-white"
            >
              KDP Metadata
              {metaData && (
                <span className="ml-2 w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="audiobook"
              className="data-[state=active]:bg-[#1E3A8A] data-[state=active]:text-white"
            >
              Audiobook
              {audioData && (
                <span className="ml-2 w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="export"
              className="data-[state=active]:bg-[#1E3A8A] data-[state=active]:text-white"
            >
              Exportar
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

          {/* ── DESIGN TAB ── */}
          <TabsContent value="design" className="space-y-6">
            {!designData && !designLoading && (
              <Card className="border-slate-700 bg-slate-900/50 text-center py-12">
                <CardContent className="space-y-4">
                  <div className="text-4xl mb-2">{'\u{1F4D0}'}</div>
                  <h3 className="text-lg font-semibold text-white">Specs de Design do Livro</h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    Tipografia, trim size, margens, dust jacket e specs de ebook otimizados para KDP e IngramSpark.
                  </p>
                  <Button onClick={generateDesign} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium px-8">
                    Gerar specs de design
                  </Button>
                </CardContent>
              </Card>
            )}

            {designLoading && (
              <Card className="border-slate-700 bg-slate-900/50 text-center py-16">
                <CardContent>
                  <div className="animate-spin w-8 h-8 border-4 border-slate-600 border-t-amber-500 rounded-full mx-auto mb-4" />
                  <p className="text-white font-medium">{DESIGN_LOADING[designLoadingMsg]}</p>
                </CardContent>
              </Card>
            )}

            {designData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">Especificações de Design</h3>
                  <Button variant="ghost" onClick={generateDesign} disabled={designLoading} className="text-slate-500 hover:text-slate-300 text-sm">Regerar</Button>
                </div>

                {/* Trim size + Interior */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-slate-700 bg-slate-900/50">
                    <CardHeader className="pb-2"><CardTitle className="text-white text-sm">Trim Size</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p className="text-slate-300">{designData.trim_size.name}</p>
                      <p className="text-slate-400">{designData.trim_size.width_inches}" x {designData.trim_size.height_inches}"</p>
                      <div className="flex gap-2 mt-2">
                        {designData.trim_size.kdp_compatible && <Badge className="bg-emerald-900/30 text-emerald-400 text-xs">KDP</Badge>}
                        {designData.trim_size.ingram_compatible && <Badge className="bg-emerald-900/30 text-emerald-400 text-xs">IngramSpark</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-slate-700 bg-slate-900/50">
                    <CardHeader className="pb-2"><CardTitle className="text-white text-sm">Interior</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p className="text-slate-300">Papel: {designData.interior.paper_type}</p>
                      <p className="text-slate-400">{designData.interior.estimated_page_count} páginas estimadas</p>
                      <p className="text-slate-400">Lombada: {designData.interior.spine_width_inches}"</p>
                      <p className="text-slate-400">Margens: {designData.interior.margins.top_inches}" / {designData.interior.margins.outside_inches}" / {designData.interior.margins.bottom_inches}" / {designData.interior.margins.inside_inches}"</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Typography */}
                <Card className="border-slate-700 bg-slate-900/50">
                  <CardHeader className="pb-2"><CardTitle className="text-white text-sm">Tipografia</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div><span className="text-slate-500">Corpo</span><p className="text-slate-300">{designData.typography.body_font} {designData.typography.body_size_pt}pt</p></div>
                      <div><span className="text-slate-500">Títulos</span><p className="text-slate-300">{designData.typography.heading_font} {designData.typography.heading_size_pt}pt</p></div>
                      <div><span className="text-slate-500">Espaçamento</span><p className="text-slate-300">{designData.typography.line_spacing}x</p></div>
                      <div><span className="text-slate-500">Indentação</span><p className="text-slate-300">{designData.typography.paragraph_indent_inches}"</p></div>
                      <div><span className="text-slate-500">Capitular</span><p className="text-slate-300">{designData.typography.drop_cap ? 'Sim' : 'Não'}</p></div>
                      <div><span className="text-slate-500">Estilo capítulo</span><p className="text-slate-300">{designData.typography.chapter_number_style}</p></div>
                    </div>
                  </CardContent>
                </Card>

                {/* Front/Back matter */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-slate-700 bg-slate-900/50">
                    <CardHeader className="pb-2"><CardTitle className="text-white text-sm">Front Matter</CardTitle></CardHeader>
                    <CardContent><ul className="text-sm text-slate-400 space-y-1">{designData.front_matter.map((item, i) => <li key={i}>{item}</li>)}</ul></CardContent>
                  </Card>
                  <Card className="border-slate-700 bg-slate-900/50">
                    <CardHeader className="pb-2"><CardTitle className="text-white text-sm">Back Matter</CardTitle></CardHeader>
                    <CardContent><ul className="text-sm text-slate-400 space-y-1">{designData.back_matter.map((item, i) => <li key={i}>{item}</li>)}</ul></CardContent>
                  </Card>
                </div>

                {/* Ebook specs */}
                <Card className="border-slate-700 bg-slate-900/50">
                  <CardHeader className="pb-2"><CardTitle className="text-white text-sm">Ebook</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p className="text-slate-300">Formato: {designData.ebook.format}</p>
                    <p className="text-slate-400">Capa: {designData.ebook.cover_dimensions}</p>
                    <p className="text-slate-400">{designData.ebook.css_notes}</p>
                  </CardContent>
                </Card>

                {designData.recommendations && (
                  <Card className="border-amber-800/30 bg-amber-950/10">
                    <CardContent className="p-4"><p className="text-amber-200/80 text-sm">{designData.recommendations}</p></CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── METADATA TAB ── */}
          <TabsContent value="metadata" className="space-y-6">
            {!metaData && !metaLoading && (
              <Card className="border-slate-700 bg-slate-900/50 text-center py-12">
                <CardContent className="space-y-4">
                  <div className="text-4xl mb-2">{'\u{1F50D}'}</div>
                  <h3 className="text-lg font-semibold text-white">Metadados KDP Otimizados</h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    Keywords, categorias BISAC, descrição HTML e A+ content para maximizar visibilidade na Amazon.
                  </p>
                  <Button onClick={generateMetadata} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium px-8">
                    Gerar metadados KDP
                  </Button>
                </CardContent>
              </Card>
            )}

            {metaLoading && (
              <Card className="border-slate-700 bg-slate-900/50 text-center py-16">
                <CardContent>
                  <div className="animate-spin w-8 h-8 border-4 border-slate-600 border-t-amber-500 rounded-full mx-auto mb-4" />
                  <p className="text-white font-medium">{META_LOADING[metaLoadingMsg]}</p>
                </CardContent>
              </Card>
            )}

            {metaData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">Metadados KDP</h3>
                  <Button variant="ghost" onClick={generateMetadata} disabled={metaLoading} className="text-slate-500 hover:text-slate-300 text-sm">Regerar</Button>
                </div>

                {/* Search title */}
                <Card className="border-amber-800/30 bg-amber-950/10">
                  <CardContent className="p-4">
                    <span className="text-xs text-slate-500 uppercase">Título otimizado para busca</span>
                    <p className="text-white font-medium mt-1">{metaData.search_title}</p>
                  </CardContent>
                </Card>

                {/* Keywords */}
                <Card className="border-slate-700 bg-slate-900/50">
                  <CardHeader className="pb-2"><CardTitle className="text-white text-sm">Keywords (7 primárias)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {metaData.keywords.primary.map((kw, i) => (
                        <Badge key={i} className="bg-[#1E3A8A]/20 text-[#93C5FD] text-xs">{kw}</Badge>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mb-2">Long-tail:</p>
                    <div className="flex flex-wrap gap-2">
                      {metaData.keywords.long_tail.map((kw, i) => (
                        <Badge key={i} className="bg-slate-800 text-slate-400 text-xs">{kw}</Badge>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-3">{metaData.keywords.strategy}</p>
                  </CardContent>
                </Card>

                {/* Categories */}
                <Card className="border-slate-700 bg-slate-900/50">
                  <CardHeader className="pb-2"><CardTitle className="text-white text-sm">Categorias BISAC</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <Badge className="bg-emerald-900/30 text-emerald-400 text-xs mb-1">Primária</Badge>
                      <p className="text-slate-300">{metaData.categories.bisac_primary.code} — {metaData.categories.bisac_primary.name}</p>
                      <p className="text-xs text-slate-500">{metaData.categories.bisac_primary.reason}</p>
                    </div>
                    <div>
                      <Badge className="bg-blue-900/30 text-blue-400 text-xs mb-1">Secundária</Badge>
                      <p className="text-slate-300">{metaData.categories.bisac_secondary.code} — {metaData.categories.bisac_secondary.name}</p>
                      <p className="text-xs text-slate-500">{metaData.categories.bisac_secondary.reason}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Browse categories KDP:</p>
                      {metaData.categories.kdp_browse_categories.map((cat, i) => (
                        <p key={i} className="text-slate-400 text-xs">{cat}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* HTML Description */}
                <BioSection label="Descrição HTML (KDP)" content={metaData.description_html} />
                <BioSection label="Descrição Plain (IngramSpark)" content={metaData.description_plain} />

                {/* A+ Content */}
                <Card className="border-slate-700 bg-slate-900/50">
                  <CardHeader className="pb-2"><CardTitle className="text-white text-sm">A+ Content</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-slate-300 font-medium">{metaData.a_plus_content.headline}</p>
                    {metaData.a_plus_content.modules.map((mod, i) => (
                      <div key={i} className="border-l-2 border-slate-700 pl-3">
                        <Badge className="bg-slate-800 text-slate-400 text-xs mb-1">{mod.type}</Badge>
                        <p className="text-sm text-slate-300">{mod.title}</p>
                        <p className="text-xs text-slate-400">{mod.content}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ── AUDIOBOOK TAB ── */}
          <TabsContent value="audiobook" className="space-y-6">
            {!audioData && !audioLoading && (
              <Card className="border-slate-700 bg-slate-900/50 text-center py-12">
                <CardContent className="space-y-4">
                  <div className="text-4xl mb-2">{'\u{1F3A7}'}</div>
                  <h3 className="text-lg font-semibold text-white">Scripts de Audiobook</h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    Converte seus capítulos em scripts de narração prontos para ElevenLabs, ACX (Audible) e Findaway Voices.
                  </p>
                  <p className="text-xs text-slate-500">
                    {phase4Data.chapters.filter((ch) => ch.content).length} capítulos disponíveis para conversão
                  </p>
                  <Button
                    onClick={generateAllAudiobook}
                    disabled={phase4Data.chapters.filter((ch) => ch.content).length === 0}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium px-8"
                  >
                    Gerar scripts de todos os capítulos
                  </Button>
                </CardContent>
              </Card>
            )}

            {audioLoading && (
              <Card className="border-slate-700 bg-slate-900/50 text-center py-16">
                <CardContent>
                  <div className="animate-spin w-8 h-8 border-4 border-slate-600 border-t-amber-500 rounded-full mx-auto mb-4" />
                  <p className="text-white font-medium">Convertendo capítulos para narração...</p>
                  <p className="text-sm text-slate-500 mt-2">Pode levar vários minutos para processar todos os capítulos</p>
                </CardContent>
              </Card>
            )}

            {audioData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold">{audioData.scripts.length} scripts gerados</h3>
                    <p className="text-sm text-slate-400">Duração total estimada: {audioData.total_duration_minutes} minutos</p>
                  </div>
                  <Button variant="ghost" onClick={generateAllAudiobook} disabled={audioLoading} className="text-slate-500 hover:text-slate-300 text-sm">Regerar</Button>
                </div>

                {audioData.scripts.map((script: AudiobookChapterScript) => (
                  <Card key={script.chapter_number} className="border-slate-700 bg-slate-900/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-sm">
                          Cap. {script.chapter_number}: {script.chapter_title}
                        </CardTitle>
                        <Badge className="bg-slate-800 text-slate-400 text-xs">
                          ~{script.estimated_duration_minutes} min
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-slate-500">{script.voice_notes}</p>
                      {script.character_voices.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {script.character_voices.map((cv, i) => (
                            <Badge key={i} className="bg-purple-900/30 text-purple-400 text-xs">
                              {cv.character}: {cv.voice_direction}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <details className="group">
                        <summary className="text-xs text-[#93C5FD] cursor-pointer hover:text-white">
                          Ver script de narração
                        </summary>
                        <div className="mt-2 p-3 bg-slate-800/50 rounded-lg text-sm text-slate-300 whitespace-pre-wrap max-h-64 overflow-y-auto">
                          {script.narration_script}
                        </div>
                      </details>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── EXPORT TAB ── */}
          <TabsContent value="export" className="space-y-6">
            <Card className="border-slate-700 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-white text-base">Exportar Livro</CardTitle>
                <p className="text-sm text-slate-400">
                  Gere arquivos prontos para upload nas plataformas de publicação
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {!hasWrittenChapters && (
                  <div className="text-center py-8 text-slate-500">
                    <p>Nenhum capítulo escrito. Complete a Fase 4 primeiro.</p>
                  </div>
                )}

                {hasWrittenChapters && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* EPUB */}
                    <Card className="border-slate-700 bg-slate-800/50">
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-900/30 flex items-center justify-center text-blue-400 text-lg">
                            {'\u{1F4D6}'}
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">EPUB</h4>
                            <p className="text-xs text-slate-400">Para Kindle KDP, Apple Books, Kobo</p>
                          </div>
                        </div>
                        <ul className="text-xs text-slate-500 space-y-1">
                          <li>EPUB 3.0 com TOC navegável</li>
                          <li>Tipografia adequada ao gênero</li>
                          <li>{phase4Data.chapters.filter((ch) => ch.content).length} capítulos incluídos</li>
                        </ul>
                        <Button
                          onClick={() => downloadExport('epub')}
                          disabled={exportLoading !== null}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {exportLoading === 'epub' ? 'Gerando EPUB...' : 'Baixar EPUB'}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* PDF */}
                    <Card className="border-slate-700 bg-slate-800/50">
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-red-900/30 flex items-center justify-center text-red-400 text-lg">
                            {'\u{1F4C4}'}
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">PDF</h4>
                            <p className="text-xs text-slate-400">Para KDP Print, IngramSpark</p>
                          </div>
                        </div>
                        <ul className="text-xs text-slate-500 space-y-1">
                          <li>Layout com specs de design{designData ? ' (aplicados)' : ''}</li>
                          <li>Margens e tipografia para impressão</li>
                          <li>{phase4Data.chapters.filter((ch) => ch.content).length} capítulos incluídos</li>
                        </ul>
                        <Button
                          onClick={() => downloadExport('pdf')}
                          disabled={exportLoading !== null}
                          className="w-full bg-red-600 hover:bg-red-700 text-white"
                        >
                          {exportLoading === 'pdf' ? 'Gerando PDF...' : 'Baixar PDF'}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {hasWrittenChapters && (
                  <p className="text-xs text-slate-500 text-center">
                    Os arquivos são gerados sob demanda. Gere os specs de Design primeiro para PDF otimizado.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
