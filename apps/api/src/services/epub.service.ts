import archiver from 'archiver';
import { PassThrough } from 'stream';
import type { WrittenChapter } from '@manuscry/shared';

interface EpubOptions {
  title: string;
  subtitle?: string;
  author: string;
  language: string;
  description?: string;
  genre?: string;
  coverImageUrl?: string;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function chapterToXhtml(chapter: WrittenChapter): string {
  const paragraphs = chapter.content
    .split(/\n\n+/)
    .filter(Boolean)
    .map((p) => `    <p>${escapeXml(p.trim())}</p>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>${escapeXml(chapter.title)}</title>
  <link rel="stylesheet" type="text/css" href="../css/style.css"/>
</head>
<body>
  <section epub:type="chapter">
    <h1>${escapeXml(chapter.title)}</h1>
${paragraphs}
  </section>
</body>
</html>`;
}

export async function generateEpub(
  chapters: WrittenChapter[],
  options: EpubOptions,
): Promise<Buffer> {
  const sorted = [...chapters].sort((a, b) => a.number - b.number);
  const uuid = `urn:uuid:${crypto.randomUUID()}`;
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

  const archive = archiver('zip', { store: true });
  const passthrough = new PassThrough();
  const buffers: Buffer[] = [];

  passthrough.on('data', (chunk: Buffer) => buffers.push(chunk));

  archive.pipe(passthrough);

  // mimetype (must be first, uncompressed)
  archive.append('application/epub+zip', { name: 'mimetype' });

  // META-INF/container.xml
  archive.append(
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
    { name: 'META-INF/container.xml' },
  );

  // CSS
  archive.append(
    `body {
  font-family: Georgia, "Times New Roman", serif;
  line-height: 1.6;
  margin: 1em;
  color: #1a1a1a;
}
h1 {
  font-size: 1.5em;
  margin-top: 2em;
  margin-bottom: 1em;
  text-align: center;
}
p {
  text-indent: 1.5em;
  margin: 0.3em 0;
}
p:first-of-type {
  text-indent: 0;
}`,
    { name: 'OEBPS/css/style.css' },
  );

  // Chapter XHTML files
  for (const ch of sorted) {
    archive.append(chapterToXhtml(ch), {
      name: `OEBPS/chapters/chapter-${ch.number.toString().padStart(3, '0')}.xhtml`,
    });
  }

  // Title page
  archive.append(
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Title</title><link rel="stylesheet" type="text/css" href="css/style.css"/></head>
<body>
  <div style="text-align:center; margin-top:40%;">
    <h1 style="font-size:2em;">${escapeXml(options.title)}</h1>
    ${options.subtitle ? `<p style="font-size:1.2em; color:#666;">${escapeXml(options.subtitle)}</p>` : ''}
    <p style="margin-top:2em; font-size:1.1em;">${escapeXml(options.author)}</p>
  </div>
</body>
</html>`,
    { name: 'OEBPS/title.xhtml' },
  );

  // TOC (nav.xhtml)
  const tocItems = sorted
    .map((ch) => `      <li><a href="chapters/chapter-${ch.number.toString().padStart(3, '0')}.xhtml">${escapeXml(ch.title)}</a></li>`)
    .join('\n');

  archive.append(
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Table of Contents</title></head>
<body>
  <nav epub:type="toc">
    <h1>Sumário</h1>
    <ol>
${tocItems}
    </ol>
  </nav>
</body>
</html>`,
    { name: 'OEBPS/nav.xhtml' },
  );

  // content.opf (package document)
  const manifestItems = sorted
    .map((ch) => `    <item id="ch${ch.number}" href="chapters/chapter-${ch.number.toString().padStart(3, '0')}.xhtml" media-type="application/xhtml+xml"/>`)
    .join('\n');

  const spineItems = sorted
    .map((ch) => `    <itemref idref="ch${ch.number}"/>`)
    .join('\n');

  archive.append(
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">${uuid}</dc:identifier>
    <dc:title>${escapeXml(options.title)}</dc:title>
    <dc:creator>${escapeXml(options.author)}</dc:creator>
    <dc:language>${options.language}</dc:language>
    <dc:description>${escapeXml(options.description || '')}</dc:description>
    <meta property="dcterms:modified">${now}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>
    <item id="css" href="css/style.css" media-type="text/css"/>
${manifestItems}
  </manifest>
  <spine>
    <itemref idref="title"/>
${spineItems}
  </spine>
</package>`,
    { name: 'OEBPS/content.opf' },
  );

  await archive.finalize();

  return new Promise((resolve) => {
    passthrough.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
  });
}
