import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PhaseStubProps {
  phase: number;
  name: string;
  description: string;
  eta: string;
}

export default function PhaseStub({ phase, name, description, eta }: PhaseStubProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/projects/${id}`)}
            className="text-slate-400 hover:text-white mb-3 -ml-2"
          >
            &larr; Voltar ao Projeto
          </Button>
          <div className="flex items-center gap-3">
            <Badge className="bg-[#1E3A8A]/30 text-[#93C5FD]">FASE {phase}</Badge>
            <h1 className="text-xl font-bold text-white">{name}</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">{description}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Card className="border-slate-700 bg-slate-900/50 text-center py-16">
          <CardHeader>
            <CardTitle className="text-white">Em desenvolvimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-400">Esta fase será liberada em {eta}.</p>
            <p className="text-xs text-slate-500">
              Por enquanto, conclua a fase anterior para avançar no pipeline.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
