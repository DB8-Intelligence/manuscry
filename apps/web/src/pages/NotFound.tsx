import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <Card className="border-slate-700 bg-slate-900/50 max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          <div className="text-6xl font-bold text-slate-700">404</div>
          <h2 className="text-lg font-semibold text-white">Página não encontrada</h2>
          <p className="text-sm text-slate-400">
            A página que você procura não existe ou foi movida.
          </p>
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white"
          >
            Voltar ao Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
