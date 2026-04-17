import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import type { PlanDisplayInfo } from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SubscriptionInfo {
  plan: string;
  books_this_month: number;
  books_limit: number;
  trial_ends_at: string | null;
  is_trial: boolean;
  trial_expired: boolean;
}

interface PlansResponse {
  plans: PlanDisplayInfo[];
  gateways: { stripe: boolean; hotmart: boolean };
}

const PLAN_COLORS: Record<string, string> = {
  trial: 'bg-slate-800 text-slate-300',
  starter: 'bg-blue-900/30 text-blue-400',
  pro: 'bg-amber-900/30 text-amber-400',
  publisher: 'bg-purple-900/30 text-purple-400',
};

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signOut } = useAuth();

  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [plans, setPlans] = useState<PlanDisplayInfo[]>([]);
  const [gateways, setGateways] = useState<{ stripe: boolean; hotmart: boolean }>({ stripe: false, hotmart: false });
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const billingStatus = searchParams.get('billing');
    if (billingStatus === 'success') {
      setMessage('Assinatura ativada com sucesso!');
    } else if (billingStatus === 'cancelled') {
      setMessage('Checkout cancelado.');
    }
  }, [searchParams]);

  useEffect(() => {
    async function load() {
      try {
        const [subRes, plansRes] = await Promise.all([
          api.get<SubscriptionInfo>('/api/billing/subscription'),
          api.get<PlansResponse>('/api/billing/plans'),
        ]);
        setSubscription(subRes);
        setPlans(plansRes.plans);
        setGateways(plansRes.gateways);
      } catch {
        // If billing endpoints fail, show minimal settings
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleCheckout(planId: string, gateway: 'stripe' | 'hotmart') {
    setCheckoutLoading(`${planId}-${gateway}`);
    setMessage('');
    try {
      const res = await api.post<{ checkout_url: string }>('/api/billing/checkout', {
        planId,
        gateway,
        currency: gateway === 'hotmart' ? 'brl' : 'usd',
      });
      window.location.href = res.checkout_url;
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erro ao iniciar checkout');
      setCheckoutLoading(null);
    }
  }

  async function handleCancel() {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? Você voltará para o plano Trial.')) return;
    setCancelLoading(true);
    try {
      await api.post('/api/billing/cancel', {});
      setSubscription((prev) => prev ? { ...prev, plan: 'trial', is_trial: true } : prev);
      setMessage('Assinatura cancelada. Você está no plano Trial.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erro ao cancelar');
    } finally {
      setCancelLoading(false);
    }
  }

  const trialDaysLeft = subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-white mb-3 -ml-2"
          >
            &larr; Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-white">Configurações</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {message && (
          <div className={`p-4 rounded-lg text-sm ${
            message.includes('sucesso') || message.includes('ativada')
              ? 'bg-emerald-900/30 border border-emerald-800 text-emerald-300'
              : 'bg-amber-900/30 border border-amber-800 text-amber-300'
          }`}>
            {message}
          </div>
        )}

        {/* Account */}
        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-white text-base">Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  Email: <span className="text-slate-200">{user?.email}</span>
                </p>
                {subscription && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-slate-400">Plano:</span>
                    <Badge className={PLAN_COLORS[subscription.plan] || PLAN_COLORS.trial}>
                      {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                    </Badge>
                    {subscription.is_trial && trialDaysLeft > 0 && (
                      <span className="text-xs text-slate-500">{trialDaysLeft} dias restantes</span>
                    )}
                    {subscription.trial_expired && (
                      <Badge className="bg-red-900/30 text-red-400 text-xs">Expirado</Badge>
                    )}
                  </div>
                )}
              </div>
              {subscription && !subscription.is_trial && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={cancelLoading}
                  className="border-red-800 text-red-400 hover:bg-red-950 text-xs"
                >
                  {cancelLoading ? 'Cancelando...' : 'Cancelar assinatura'}
                </Button>
              )}
            </div>
            {subscription && (
              <div className="text-xs text-slate-500">
                Livros este mês: {subscription.books_this_month}/{subscription.books_limit === -1 ? '\u221E' : subscription.books_limit}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plans */}
        {!loading && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Planos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => {
                const isCurrent = subscription?.plan === plan.id;
                return (
                  <Card
                    key={plan.id}
                    className={`border-slate-700 bg-slate-900/50 relative ${
                      plan.popular ? 'ring-1 ring-amber-500/30 border-amber-800/50' : ''
                    } ${isCurrent ? 'ring-1 ring-emerald-500/30 border-emerald-800/50' : ''}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-amber-500 text-slate-900 text-xs font-bold">Popular</Badge>
                      </div>
                    )}
                    <CardContent className="p-5 space-y-4">
                      <div>
                        <h3 className="font-semibold text-white">{plan.name}</h3>
                        <p className="text-amber-400 font-bold text-lg">{plan.price_brl}</p>
                        <p className="text-xs text-slate-500">{plan.price_usd}</p>
                      </div>
                      <div className="text-sm text-slate-400">
                        {plan.books_per_month}
                      </div>
                      <ul className="space-y-1">
                        {plan.features.map((f, i) => (
                          <li key={i} className="text-xs text-slate-500 flex items-start gap-1.5">
                            <span className="text-emerald-500 mt-0.5">{'\u2713'}</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                      {isCurrent ? (
                        <Badge className="w-full justify-center bg-emerald-900/30 text-emerald-400">
                          Plano atual
                        </Badge>
                      ) : plan.id !== 'trial' ? (
                        <div className="space-y-2">
                          {gateways.stripe && (
                            <Button
                              size="sm"
                              onClick={() => handleCheckout(plan.id, 'stripe')}
                              disabled={checkoutLoading !== null}
                              className="w-full bg-[#1E3A8A] hover:bg-[#1E40AF] text-white text-xs"
                            >
                              {checkoutLoading === `${plan.id}-stripe` ? 'Redirecionando...' : 'Assinar (Stripe)'}
                            </Button>
                          )}
                          {gateways.hotmart && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckout(plan.id, 'hotmart')}
                              disabled={checkoutLoading !== null}
                              className="w-full border-slate-600 text-slate-300 text-xs"
                            >
                              {checkoutLoading === `${plan.id}-hotmart` ? 'Redirecionando...' : 'Assinar (Hotmart)'}
                            </Button>
                          )}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Social Add-on */}
        <Card className="border-purple-800/30 bg-purple-950/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base">{'\u{1F3AC}'} Social Studio Add-on</CardTitle>
              <Badge className="bg-purple-900/30 text-purple-400">R$39/mês por rede</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400 mb-4">
              Gere reels, posts e carrosséis a partir dos seus livros para impulsionar vendas nas redes sociais.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(['Instagram', 'TikTok', 'Twitter/X', 'Facebook', 'LinkedIn']).map((name) => (
                <div key={name} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700">
                  <span className="text-xs text-slate-400">{name}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Disponível como add-on em qualquer plano. Contate o suporte para ativar.
            </p>
          </CardContent>
        </Card>

        {/* Session */}
        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-white text-base">Sessão</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={signOut}
              className="border-red-800 text-red-400 hover:bg-red-950 hover:text-red-300"
            >
              Sair da conta
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
