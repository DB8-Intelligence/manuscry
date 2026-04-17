import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UploadAnalysis {
  analysis: {
    completeness: string;
    estimated_words: number;
    quality_assessment: string;
    summary: string;
  };
  project_seed: {
    suggested_title: string;
    genre_mode: string;
    genre: string;
    tone: string;
    target_audience: string;
    premise: string;
  };
  extracted_elements: {
    characters: Array<{ name: string; role: string; description: string }>;
    themes: string[];
    setting: string;
    conflict: string;
  };
  recommendations: {
    next_steps: string[];
    strengths: string[];
    improvements: string[];
    pipeline_start_phase: number;
  };
}

interface UploadResponse {
  project: { id: string };
  analysis: UploadAnalysis;
  message: string;
}

const LOADING_MSGS = [
  'Lendo seu manuscrito...',
  'Identificando gênero e tom...',
  'Extraindo personagens...',
  'Analisando estrutura narrativa...',
  'Criando projeto no Manuscry...',
];

const COMPLETENESS_LABELS: Record<string, { text: string; color: string }> = {
  complete: { text: 'Manuscrito completo', color: 'bg-emerald-900/30 text-emerald-400' },
  partial: { text: 'Rascunho parcial', color: 'bg-amber-900/30 text-amber-400' },
  idea_only: { text: 'Ideia / sinopse', color: 'bg-blue-900/30 text-blue-400' },
};

export default function UploadManuscript() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [market, setMarket] = useState<'pt-br' | 'en'>('pt-br');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setText(content);
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleUpload() {
    if (text.trim().length < 50) {
      setError('Texto muito curto. Cole pelo menos um parágrafo.');
      return;
    }
    setLoading(true);
    setError('');
    setLoadingMsg(0);
    const interval = setInterval(() => setLoadingMsg((p) => (p + 1) % LOADING_MSGS.length), 3000);

    try {
      const res = await api.post<UploadResponse>('/api/projects/from-manuscript', {
        manuscriptText: text,
        market,
        fileName: fileName || undefined,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar manuscrito');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const analysis = result?.analysis;

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white mb-3 -ml-2">
            &larr; Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20">UPLOAD</Badge>
            <h1 className="text-xl font-bold text-white">Importar Manuscrito</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Envie seu rascunho, ideia ou manuscrito completo — a IA analisa e cria o projeto
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Upload area */}
        {!result && !loading && (
          <>
            <Card className="border-slate-700 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-white text-base">Seu manuscrito</CardTitle>
                <p className="text-sm text-slate-400">
                  Pode ser um livro completo, rascunho parcial, sinopse ou até uma ideia de poucas linhas
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Drag and drop */}
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    dragOver
                      ? 'border-amber-500 bg-amber-500/5'
                      : 'border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".txt,.md,.doc,.docx,.rtf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                  <div className="text-3xl mb-3">{'\u{1F4C4}'}</div>
                  <p className="text-slate-300 font-medium">
                    {fileName || 'Arraste um arquivo ou clique para selecionar'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">.txt, .md, .doc, .docx, .rtf</p>
                </div>

                {/* Or paste */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-slate-900 px-3 text-xs text-slate-500">ou cole o texto</span>
                  </div>
                </div>

                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Cole aqui seu manuscrito, rascunho, sinopse ou ideia..."
                  rows={12}
                  className="w-full rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-slate-500 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
                />

                {text && (
                  <p className="text-xs text-slate-500">{wordCount.toLocaleString()} palavras detectadas</p>
                )}

                <div className="space-y-2">
                  <Label className="text-slate-300">Mercado alvo</Label>
                  <Select value={market} onValueChange={(v) => { if (v) setMarket(v as 'pt-br' | 'en'); }}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="pt-br" className="text-white">PT-BR (Amazon.com.br)</SelectItem>
                      <SelectItem value="en" className="text-white">EN (Amazon.com)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {error && (
                  <div className="bg-red-900/30 border border-red-800 text-red-300 p-3 rounded-lg text-sm">{error}</div>
                )}

                <Button
                  onClick={handleUpload}
                  disabled={text.trim().length < 50}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium py-6 text-base"
                >
                  Analisar manuscrito e criar projeto
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Loading */}
        {loading && (
          <Card className="border-slate-700 bg-slate-900/50 text-center py-16">
            <CardContent>
              <div className="animate-spin w-8 h-8 border-4 border-slate-600 border-t-amber-500 rounded-full mx-auto mb-4" />
              <p className="text-white font-medium">{LOADING_MSGS[loadingMsg]}</p>
              <p className="text-sm text-slate-500 mt-2">Analisando {wordCount.toLocaleString()} palavras...</p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {analysis && result && (
          <>
            {/* Summary */}
            <Card className="border-emerald-800/50 bg-emerald-950/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-emerald-400">Manuscrito analisado com sucesso!</h3>
                  <Badge className={COMPLETENESS_LABELS[analysis.analysis.completeness]?.color || 'bg-slate-800 text-slate-400'}>
                    {COMPLETENESS_LABELS[analysis.analysis.completeness]?.text || analysis.analysis.completeness}
                  </Badge>
                </div>
                <p className="text-slate-300 text-sm">{analysis.analysis.summary}</p>
                <div className="flex gap-4 mt-3 text-xs text-slate-500">
                  <span>{analysis.analysis.estimated_words.toLocaleString()} palavras</span>
                  <span>Qualidade: {analysis.analysis.quality_assessment}</span>
                </div>
              </CardContent>
            </Card>

            {/* Project seed */}
            <Card className="border-amber-800/30 bg-amber-950/10">
              <CardContent className="p-5 text-center">
                <h2 className="text-xl font-bold text-white mb-1">{analysis.project_seed.suggested_title}</h2>
                <p className="text-slate-400 text-sm mb-3">{analysis.project_seed.premise}</p>
                <div className="flex justify-center gap-2">
                  <Badge className="bg-slate-800 text-slate-300">{analysis.project_seed.genre}</Badge>
                  <Badge className="bg-slate-800 text-slate-300">{analysis.project_seed.genre_mode}</Badge>
                  <Badge className="bg-slate-800 text-slate-300">{analysis.project_seed.tone}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Characters */}
            {analysis.extracted_elements.characters.length > 0 && (
              <Card className="border-slate-700 bg-slate-900/50">
                <CardHeader><CardTitle className="text-white text-sm">Personagens detectados</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {analysis.extracted_elements.characters.map((ch, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <Badge className="bg-[#1E3A8A]/20 text-[#93C5FD] text-xs flex-shrink-0">{ch.role}</Badge>
                      <div>
                        <span className="text-white font-medium">{ch.name}</span>
                        <p className="text-slate-400 text-xs">{ch.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            <Card className="border-slate-700 bg-slate-900/50">
              <CardHeader><CardTitle className="text-white text-sm">Recomendações dos agentes</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {analysis.recommendations.strengths.length > 0 && (
                  <div>
                    <span className="text-xs text-emerald-400 uppercase">Pontos fortes</span>
                    <ul className="mt-1 space-y-1">
                      {analysis.recommendations.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-emerald-500">{'\u2713'}</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.recommendations.improvements.length > 0 && (
                  <div>
                    <span className="text-xs text-amber-400 uppercase">Sugestões de melhoria</span>
                    <ul className="mt-1 space-y-1">
                      {analysis.recommendations.improvements.map((s, i) => (
                        <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                          <span className="text-amber-500">{'\u{1F4A1}'}</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <span className="text-xs text-[#93C5FD] uppercase">Próximos passos</span>
                  <ul className="mt-1 space-y-1">
                    {analysis.recommendations.next_steps.map((s, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-[#93C5FD]">{i + 1}.</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Action */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => navigate(`/projects/${result.project.id}`)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-10 py-6 text-lg"
              >
                Ir para o projeto &rarr;
              </Button>
            </div>
            <p className="text-xs text-slate-500 text-center">
              O projeto foi criado na Fase {analysis.recommendations.pipeline_start_phase}. Os agentes continuam de onde você parou.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
