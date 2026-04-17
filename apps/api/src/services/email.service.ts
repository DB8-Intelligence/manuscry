import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@manuscry.ai';

export async function sendWelcomeEmail(email: string, name: string | null): Promise<void> {
  if (!resend) {
    console.log(`[Email] Resend not configured. Would send welcome to ${email}`);
    return;
  }

  await resend.emails.send({
    from: `Manuscry <${FROM}>`,
    to: email,
    subject: name ? `${name}, bem-vindo ao Manuscry!` : 'Bem-vindo ao Manuscry!',
    html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <h1 style="color: #1E3A8A; font-size: 28px; margin-bottom: 8px;">Manuscry</h1>
      <p style="color: #64748B; font-size: 14px; margin-bottom: 32px;">Do conceito ao livro publicado</p>

      <h2 style="color: #0F172A; font-size: 20px;">Olá${name ? `, ${name}` : ''}!</h2>

      <p style="color: #334155; line-height: 1.6;">
        Sua conta foi criada com sucesso. Você tem <strong>14 dias grátis</strong> para
        explorar todo o pipeline editorial do Manuscry.
      </p>

      <p style="color: #334155; line-height: 1.6;">O que você pode fazer agora:</p>
      <ul style="color: #334155; line-height: 1.8;">
        <li>Análise de mercado KDP com score de oportunidade</li>
        <li>Book Bible completo com personagens e estrutura</li>
        <li>Escrita com streaming em tempo real</li>
        <li>Capas profissionais via IA</li>
        <li>EPUB e PDF prontos para publicação</li>
      </ul>

      <a href="${process.env.FRONTEND_URL || 'https://manuscry.ai'}/dashboard"
         style="display: inline-block; background: #F59E0B; color: #0F172A; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
        Criar meu primeiro livro
      </a>

      <p style="color: #94A3B8; font-size: 12px; margin-top: 40px; border-top: 1px solid #E2E8F0; padding-top: 16px;">
        Manuscry &mdash; DB8 Intelligence<br/>
        Este email foi enviado para ${email}
      </p>
    </div>`,
  });
}

export async function sendPlanActivatedEmail(
  email: string,
  planName: string,
): Promise<void> {
  if (!resend) return;

  await resend.emails.send({
    from: `Manuscry <${FROM}>`,
    to: email,
    subject: `Plano ${planName} ativado!`,
    html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <h1 style="color: #1E3A8A; font-size: 28px;">Manuscry</h1>
      <h2 style="color: #0F172A;">Plano ${planName} ativado!</h2>
      <p style="color: #334155; line-height: 1.6;">
        Sua assinatura do plano <strong>${planName}</strong> foi confirmada.
        Todos os recursos do plano já estão disponíveis na sua conta.
      </p>
      <a href="${process.env.FRONTEND_URL || 'https://manuscry.ai'}/dashboard"
         style="display: inline-block; background: #F59E0B; color: #0F172A; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
        Ir para o Dashboard
      </a>
    </div>`,
  });
}
