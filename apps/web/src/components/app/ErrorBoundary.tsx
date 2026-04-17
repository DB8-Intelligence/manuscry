import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
          <Card className="border-slate-700 bg-slate-900/50 max-w-md w-full">
            <CardContent className="p-8 text-center space-y-4">
              <div className="text-4xl">{'\u26A0\uFE0F'}</div>
              <h2 className="text-lg font-semibold text-white">Algo deu errado</h2>
              <p className="text-sm text-slate-400">
                {this.state.error?.message || 'Erro inesperado na aplicação'}
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => this.setState({ hasError: false, error: null })}
                  className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white"
                >
                  Tentar novamente
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/dashboard'}
                  className="border-slate-600 text-slate-300"
                >
                  Ir para Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
