import PDFDocument from 'pdfkit';
import type { SalesOverview, BookPerformance, ReportMeta } from '@manuscry/shared';

export async function generateSalesReportPdf(
  meta: ReportMeta,
  overview: SalesOverview,
  performances: BookPerformance[],
): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
  const buffers: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => buffers.push(chunk));

  const blue = '#1E3A8A';
  const amber = '#F59E0B';

  // Title page
  doc.moveDown(4);
  doc.fontSize(28).fillColor(blue).font('Helvetica-Bold').text('Manuscry', { align: 'center' });
  doc.fontSize(12).fillColor('#666').font('Helvetica').text('Relatório de Vendas e Performance', { align: 'center' });
  doc.moveDown(2);
  doc.fontSize(18).fillColor('#333').font('Helvetica-Bold').text(meta.title, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor('#666').font('Helvetica').text(`Período: ${meta.period}`, { align: 'center' });
  doc.text(`Autor: ${meta.author_name}`, { align: 'center' });
  doc.text(`Gerado em: ${new Date(meta.generated_at).toLocaleDateString('pt-BR')}`, { align: 'center' });

  // Sales Overview page
  doc.addPage();
  doc.fontSize(18).fillColor(blue).font('Helvetica-Bold').text('Resumo de Vendas');
  doc.moveDown(1);

  const formatCurrency = (cents: number) => {
    const val = cents / 100;
    return overview.currency === 'BRL' ? `R$ ${val.toFixed(2)}` : `$ ${val.toFixed(2)}`;
  };

  const summaryData = [
    ['Receita bruta', formatCurrency(overview.total_revenue_cents)],
    ['Comissões', formatCurrency(overview.total_commission_cents)],
    ['Receita líquida', formatCurrency(overview.total_net_cents)],
    ['Total de vendas', String(overview.total_sales)],
    ['Livros publicados', String(overview.total_books_published)],
    ['Canais ativos', String(overview.active_channels)],
    ['Preço médio', formatCurrency(overview.avg_price_cents)],
  ];

  doc.fontSize(11).fillColor('#333').font('Helvetica');
  for (const [label, value] of summaryData) {
    doc.text(`${label}: `, { continued: true }).font('Helvetica-Bold').text(value).font('Helvetica');
  }

  // By channel
  if (overview.by_channel.length > 0) {
    doc.moveDown(1.5);
    doc.fontSize(14).fillColor(blue).font('Helvetica-Bold').text('Vendas por Canal');
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#333').font('Helvetica');
    for (const ch of overview.by_channel) {
      doc.text(`${ch.channel_name}: ${ch.total_sales} vendas — ${formatCurrency(ch.net_cents)} líquido (${ch.commission_cents > 0 ? `-${formatCurrency(ch.commission_cents)} comissão` : 'sem comissão'})`);
    }
  }

  // By book
  if (overview.by_book.length > 0) {
    doc.moveDown(1.5);
    doc.fontSize(14).fillColor(blue).font('Helvetica-Bold').text('Vendas por Livro');
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#333').font('Helvetica');
    for (const book of overview.by_book) {
      doc.text(`"${book.title}" (${book.genre}): ${book.total_sales} vendas — ${formatCurrency(book.revenue_cents)}`);
    }
  }

  // Monthly evolution
  if (overview.by_period.length > 0) {
    doc.moveDown(1.5);
    doc.fontSize(14).fillColor(blue).font('Helvetica-Bold').text('Evolução Mensal');
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#333').font('Helvetica');
    for (const period of overview.by_period) {
      doc.text(`${period.period}: ${period.sales} vendas — ${formatCurrency(period.net_cents)}`);
    }
  }

  // Book performance pages
  for (const perf of performances) {
    doc.addPage();
    doc.fontSize(16).fillColor(blue).font('Helvetica-Bold').text(`Performance: "${perf.title}"`);
    doc.fontSize(10).fillColor('#666').font('Helvetica').text(`${perf.genre}`);
    doc.moveDown(1);

    doc.fontSize(11).fillColor('#333').font('Helvetica');
    doc.text(`Vendas totais: ${perf.metrics.total_sales}`);
    doc.text(`Receita: ${formatCurrency(perf.metrics.revenue_cents)}`);
    doc.text(`Média diária: ${perf.metrics.avg_daily_sales.toFixed(1)} vendas/dia`);
    doc.text(`Melhor dia: ${perf.metrics.best_day_sales} vendas`);
    doc.text(`Page reads (KU): ${perf.metrics.page_reads_ku.toLocaleString()}`);

    if (perf.market_trends.length > 0) {
      doc.moveDown(1);
      doc.fontSize(12).fillColor(blue).font('Helvetica-Bold').text('Tendências de Mercado');
      doc.fontSize(10).fillColor('#333').font('Helvetica');
      for (const t of perf.market_trends) {
        doc.text(`• "${t.keyword}" — Volume: ${t.search_volume} | Tendência: ${t.trend} | Competição: ${t.competition}`);
      }
    }

    if (perf.competitors.length > 0) {
      doc.moveDown(1);
      doc.fontSize(12).fillColor(blue).font('Helvetica-Bold').text('Top Concorrentes');
      doc.fontSize(10).fillColor('#333').font('Helvetica');
      for (const c of perf.competitors) {
        doc.text(`• "${c.title}" por ${c.author} — BSR #${c.bsr.toLocaleString()} | ${c.rating}★ (${c.reviews} reviews) | ${c.price}`);
      }
    }

    if (perf.recommendations.length > 0) {
      doc.moveDown(1);
      doc.fontSize(12).fillColor(amber).font('Helvetica-Bold').text('Recomendações');
      doc.fontSize(10).fillColor('#333').font('Helvetica');
      for (const r of perf.recommendations) {
        doc.text(`→ ${r}`);
      }
    }
  }

  // Footer
  doc.addPage();
  doc.moveDown(8);
  doc.fontSize(14).fillColor(blue).font('Helvetica-Bold').text('Manuscry', { align: 'center' });
  doc.fontSize(10).fillColor('#666').font('Helvetica').text('Do conceito ao livro publicado com IA', { align: 'center' });
  doc.moveDown(1);
  doc.text('manuscry.ai', { align: 'center' });

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
  });
}
