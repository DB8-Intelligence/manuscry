import PDFDocument from 'pdfkit';
import type { WrittenChapter, BookDesignData } from '@manuscry/shared';

interface PdfOptions {
  title: string;
  subtitle?: string;
  author: string;
  design?: BookDesignData | null;
}

const PT_PER_INCH = 72;

function inchesToPt(inches: number): number {
  return inches * PT_PER_INCH;
}

export async function generatePdf(
  chapters: WrittenChapter[],
  options: PdfOptions,
): Promise<Buffer> {
  const sorted = [...chapters].sort((a, b) => a.number - b.number);
  const design = options.design;

  const pageWidth = inchesToPt(design?.trim_size.width_inches || 6);
  const pageHeight = inchesToPt(design?.trim_size.height_inches || 9);
  const marginTop = inchesToPt(design?.interior.margins.top_inches || 0.75);
  const marginBottom = inchesToPt(design?.interior.margins.bottom_inches || 0.75);
  const marginInside = inchesToPt(design?.interior.margins.inside_inches || 0.875);
  const marginOutside = inchesToPt(design?.interior.margins.outside_inches || 0.625);

  const bodySize = design?.typography.body_size_pt || 11;
  const headingSize = design?.typography.heading_size_pt || 18;
  const lineSpacing = design?.typography.line_spacing || 1.4;
  const indent = inchesToPt(design?.typography.paragraph_indent_inches || 0.3);

  const doc = new PDFDocument({
    size: [pageWidth, pageHeight],
    margins: {
      top: marginTop,
      bottom: marginBottom,
      left: marginInside,
      right: marginOutside,
    },
    info: {
      Title: options.title,
      Author: options.author,
    },
    bufferPages: true,
  });

  const buffers: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => buffers.push(chunk));

  // Title page
  doc.moveDown(8);
  doc.fontSize(28).font('Helvetica-Bold').text(options.title, { align: 'center' });
  if (options.subtitle) {
    doc.moveDown(0.5);
    doc.fontSize(16).font('Helvetica').fillColor('#666666').text(options.subtitle, { align: 'center' });
  }
  doc.moveDown(2);
  doc.fontSize(14).font('Helvetica').fillColor('#333333').text(options.author, { align: 'center' });
  doc.fillColor('#000000');

  // Chapters
  for (const chapter of sorted) {
    doc.addPage();

    // Chapter heading
    doc.moveDown(3);
    doc.fontSize(headingSize).font('Helvetica-Bold').text(
      `${chapter.number}`,
      { align: 'center' },
    );
    doc.moveDown(0.3);
    doc.fontSize(headingSize - 4).font('Helvetica').text(
      chapter.title,
      { align: 'center' },
    );
    doc.moveDown(2);

    // Body text
    doc.fontSize(bodySize).font('Times-Roman');
    const paragraphs = chapter.content.split(/\n\n+/).filter(Boolean);

    for (let i = 0; i < paragraphs.length; i++) {
      const text = paragraphs[i].trim();
      if (!text) continue;

      doc.text(text, {
        align: 'justify',
        indent: i > 0 ? indent : 0,
        lineGap: bodySize * (lineSpacing - 1),
        paragraphGap: bodySize * 0.3,
      });
    }
  }

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
  });
}
