import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { api } from '@/lib/api';
import type {
  SocialPlatform, ContentFormat,
  ReelScript, SocialPost, CarouselContent, Phase4Data, Phase2Data,
} from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type GeneratedContent = ReelScript | SocialPost | CarouselContent;

const PLATFORMS: Array<{ id: SocialPlatform; label: string; icon: string }> = [
  { id: 'instagram', label: 'Instagram', icon: '\u{1F4F7}' },
  { id: 'tiktok', label: 'TikTok', icon: '\u{1F3AC}' },
  { id: 'twitter', label: 'Twitter/X', icon: '\u{1F426}' },
  { id: 'facebook', label: 'Facebook', icon: '\u{1F4AC}' },
  { id: 'linkedin', label: 'LinkedIn', icon: '\u{1F4BC}' },
];

const FORMATS: Array<{ id: ContentFormat; label: string; desc: string }> = [
  { id: 'reel', label: 'Reel / TikTok', desc: 'Vídeo curto com roteiro' },
  { id: 'post', label: 'Post', desc: 'Texto com hashtags e CTA' },
  { id: 'carousel', label: 'Carrossel', desc: '5-10 slides com storytelling' },
  { id: 'story', label: 'Story', desc: 'Sequência de stories' },
];

function isReel(c: GeneratedContent): c is ReelScript { return 'scenes' in c && 'hook' in c; }
function isCarousel(c: GeneratedContent): c is CarouselContent { return 'slides' in c; }
function isPost(c: GeneratedContent): c is SocialPost { return 'text' in c && !('slides' in c); }

export default function SocialStudio() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, fetchProject } = useProjectStore();

  const [platform, setPlatform] = useState<SocialPlatform>('instagram');
  const [format, setFormat] = useState<ContentFormat>('post');
  const [chapterNumber, setChapterNumber] = useState<string>('');
  const [customAngle, setCustomAngle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) fetchProject(id);
  }, [id, fetchProject]);

  const phase4 = (currentProject?.phase_4_data || { chapters: [] }) as Phase4Data;
  const bookBible = currentProject?.phase_2_data as Phase2Data | null;
  const writtenChapters = phase4.chapters.filter((ch) => ch.content);

  async function handleGenerate() {
    if (!id) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post<{ content: GeneratedContent }>('/api/social/generate', {
        projectId: id,
        platform,
        format,
        chapterNumber: chapterNumber ? parseInt(chapterNumber, 10) : undefined,
        customAngle: customAngle || undefined,
      });
      setResult(res.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar conteúdo');
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-slate-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${id}`)} className="text-slate-400 hover:text-white mb-3 -ml-2">
            &larr; Voltar ao Projeto
          </Button>
          <div className="flex items-center gap-3">
            <Badge className="bg-purple-900/30 text-purple-400">SOCIAL</Badge>
            <h1 className="text-xl font-bold text-white">Social Studio</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Crie conteúdo para redes sociais a partir do seu livro
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Config panel */}
          <div className="space-y-6">
            <Card className="border-slate-700 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-white text-base">Configurar conteúdo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Platform */}
                <div className="space-y-2">
                  <Label className="text-slate-300">Plataforma</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPlatform(p.id)}
                        className={`p-2 rounded-lg text-center text-xs transition-all ${
                          platform === p.id
                            ? 'bg-purple-900/30 border border-purple-500/50 text-purple-400'
                            : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <div className="text-lg">{p.icon}</div>
                        <div className="mt-1">{p.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Format */}
                <div className="space-y-2">
                  <Label className="text-slate-300">Formato</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {FORMATS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFormat(f.id)}
                        className={`p-3 rounded-lg text-left transition-all ${
                          format === f.id
                            ? 'bg-purple-900/30 border border-purple-500/50'
                            : 'bg-slate-800 border border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className={`text-sm font-medium ${format === f.id ? 'text-purple-400' : 'text-white'}`}>{f.label}</div>
                        <div className="text-xs text-slate-500">{f.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chapter excerpt */}
                {writtenChapters.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-slate-300">Usar trecho do capítulo (opcional)</Label>
                    <Select value={chapterNumber} onValueChange={(v) => setChapterNumber(v ?? '')}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue placeholder="Nenhum — gerar livremente" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="" className="text-white">Nenhum</SelectItem>
                        {writtenChapters.map((ch) => (
                          <SelectItem key={ch.number} value={String(ch.number)} className="text-white">
                            Cap. {ch.number}: {ch.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Custom angle */}
                <div className="space-y-2">
                  <Label className="text-slate-300">Ângulo / tema específico (opcional)</Label>
                  <textarea
                    value={customAngle}
                    onChange={(e) => setCustomAngle(e.target.value)}
                    placeholder="Ex: focar na jornada da protagonista, usar tom misterioso..."
                    rows={2}
                    className="w-full rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-slate-500 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium"
                >
                  {loading ? 'Gerando...' : `Gerar ${FORMATS.find((f) => f.id === format)?.label || 'conteúdo'}`}
                </Button>
              </CardContent>
            </Card>

            {/* Book context */}
            {bookBible && (
              <Card className="border-slate-700 bg-slate-900/50">
                <CardContent className="p-4 text-xs text-slate-500">
                  <span className="text-slate-400">Livro:</span> {(bookBible as unknown as Record<string, string>).title || currentProject.name}
                  <br />
                  <span className="text-slate-400">Gênero:</span> {currentProject.genre}
                  <br />
                  <span className="text-slate-400">Capítulos disponíveis:</span> {writtenChapters.length}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Result panel */}
          <div>
            {!result && !loading && !error && (
              <Card className="border-slate-700 bg-slate-900/50 text-center py-20">
                <CardContent>
                  <div className="text-4xl mb-4">{'\u{1F3AC}'}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">Crie conteúdo social</h3>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto">
                    Escolha plataforma e formato, depois clique em gerar.
                    A IA usa seu livro como base para criar conteúdo engajante.
                  </p>
                </CardContent>
              </Card>
            )}

            {loading && (
              <Card className="border-slate-700 bg-slate-900/50 text-center py-16">
                <CardContent>
                  <div className="animate-spin w-8 h-8 border-4 border-slate-600 border-t-purple-500 rounded-full mx-auto mb-4" />
                  <p className="text-white">Criando conteúdo para {PLATFORMS.find((p) => p.id === platform)?.label}...</p>
                </CardContent>
              </Card>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-lg">{error}</div>
            )}

            {result && (
              <Card className="border-slate-700 bg-slate-900/50">
                <CardHeader className="pb-3 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-900/30 text-purple-400">{platform}</Badge>
                      <Badge className="bg-slate-800 text-slate-400">{format}</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const text = isReel(result)
                          ? result.scenes.map((s) => s.narration).join('\n\n')
                          : isCarousel(result)
                            ? result.slides.map((s) => `${s.headline}\n${s.body}`).join('\n\n')
                            : isPost(result)
                              ? result.text
                              : JSON.stringify(result, null, 2);
                        copyToClipboard(text);
                      }}
                      className="h-7 text-xs border-slate-600 text-slate-300"
                    >
                      {copied ? 'Copiado!' : 'Copiar tudo'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {/* Reel result */}
                  {isReel(result) && (
                    <>
                      <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg p-3">
                        <span className="text-xs text-amber-400 uppercase">Hook (2s)</span>
                        <p className="text-white font-medium mt-1">{result.hook}</p>
                      </div>
                      {result.scenes.map((scene, i) => (
                        <div key={i} className="border-l-2 border-purple-800 pl-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-slate-800 text-slate-400 text-[10px]">Cena {i + 1}</Badge>
                            <span className="text-xs text-slate-500">{scene.duration_seconds}s</span>
                          </div>
                          <p className="text-slate-300 text-sm">{scene.narration}</p>
                          <p className="text-xs text-slate-500 mt-1">Visual: {scene.visual}</p>
                          {scene.text_overlay && <p className="text-xs text-purple-400 mt-1">Texto: "{scene.text_overlay}"</p>}
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800">
                        <span>Duração: {result.total_duration_seconds}s</span>
                        <span>Música: {result.music_suggestion}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {result.hashtags.map((h, i) => (
                          <Badge key={i} className="bg-slate-800 text-slate-400 text-xs">#{h}</Badge>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Post result */}
                  {isPost(result) && (
                    <>
                      <div className="whitespace-pre-wrap text-slate-300 text-sm leading-relaxed">{result.text}</div>
                      <div className="flex flex-wrap gap-1">
                        {result.hashtags.map((h, i) => (
                          <Badge key={i} className="bg-slate-800 text-slate-400 text-xs">#{h}</Badge>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 pt-2 border-t border-slate-800">
                        <div><span className="text-slate-400">Melhor horário:</span> {result.best_time}</div>
                        <div><span className="text-slate-400">CTA:</span> {result.cta}</div>
                      </div>
                    </>
                  )}

                  {/* Carousel result */}
                  {isCarousel(result) && (
                    <>
                      <div className="space-y-3">
                        {result.slides.map((slide) => (
                          <div key={slide.slide_number} className="bg-slate-800/50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-6 h-6 rounded-full bg-purple-900/30 text-purple-400 text-xs flex items-center justify-center font-bold">
                                {slide.slide_number}
                              </span>
                              <h4 className="font-medium text-white text-sm">{slide.headline}</h4>
                            </div>
                            <p className="text-slate-400 text-sm">{slide.body}</p>
                            <p className="text-xs text-slate-600 mt-2">Visual: {slide.visual_suggestion}</p>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-slate-800 pt-3">
                        <p className="text-xs text-slate-500 mb-2">Legenda:</p>
                        <p className="text-slate-300 text-sm">{result.caption}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {result.hashtags.map((h, i) => (
                          <Badge key={i} className="bg-slate-800 text-slate-400 text-xs">#{h}</Badge>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
