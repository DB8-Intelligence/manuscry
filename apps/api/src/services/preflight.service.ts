import type {
  Project, Phase0Data, Phase1Data, Phase2Data, Phase3Data, Phase4Data, Phase5Data,
  WrittenChapter, BookDesignData, KdpMetadata, BiographyData, CoverData,
} from '@manuscry/shared';

export type CheckStatus = 'pass' | 'fail' | 'warn' | 'skip';
export type CheckCategory = 'manuscript' | 'metadata' | 'design' | 'cover' | 'biography' | 'compliance';

export interface PreflightCheck {
  id: string;
  category: CheckCategory;
  name: string;
  description: string;
  status: CheckStatus;
  detail: string;
}

export interface PreflightReport {
  project_id: string;
  project_name: string;
  timestamp: string;
  total_checks: number;
  passed: number;
  failed: number;
  warnings: number;
  skipped: number;
  ready_to_publish: boolean;
  checks: PreflightCheck[];
}

function check(
  id: string,
  category: CheckCategory,
  name: string,
  description: string,
  condition: boolean | null,
  passDetail: string,
  failDetail: string,
): PreflightCheck {
  if (condition === null) {
    return { id, category, name, description, status: 'skip', detail: 'Dados não disponíveis' };
  }
  return {
    id, category, name, description,
    status: condition ? 'pass' : 'fail',
    detail: condition ? passDetail : failDetail,
  };
}

function warn(
  id: string,
  category: CheckCategory,
  name: string,
  description: string,
  condition: boolean | null,
  passDetail: string,
  warnDetail: string,
): PreflightCheck {
  if (condition === null) {
    return { id, category, name, description, status: 'skip', detail: 'Dados não disponíveis' };
  }
  return {
    id, category, name, description,
    status: condition ? 'pass' : 'warn',
    detail: condition ? passDetail : warnDetail,
  };
}

export function runPreflightChecks(project: Project): PreflightReport {
  const checks: PreflightCheck[] = [];

  const p0 = project.phase_0_data as Phase0Data | null;
  const p1 = project.phase_1_data as Phase1Data | null;
  const p2 = project.phase_2_data as Phase2Data | null;
  const p3 = project.phase_3_data as Phase3Data | null;
  const p4 = project.phase_4_data as Phase4Data | null;
  const p5 = project.phase_5_data as Phase5Data | null;

  const chapters = p4?.chapters?.filter((ch: WrittenChapter) => ch.content) || [];
  const totalWords = chapters.reduce((sum: number, ch: WrittenChapter) => sum + ch.word_count, 0);
  const design = p5?.design as BookDesignData | null;
  const metadata = p5?.metadata as KdpMetadata | null;
  const biography = p5?.biography as BiographyData | null;
  const covers = p5?.covers as CoverData | null;
  const selectedCover = covers?.covers?.find((c) => c.selected);

  // ── MANUSCRIPT CHECKS ────────────────────────────────────────────────────

  checks.push(check('ms-01', 'manuscript', 'Pipeline completo',
    'Todas as fases do pipeline foram concluídas',
    project.phases_completed?.length >= 5,
    `${project.phases_completed?.length || 0}/5 fases completas`,
    `Apenas ${project.phases_completed?.length || 0}/5 fases completas`,
  ));

  checks.push(check('ms-02', 'manuscript', 'Book Bible existe',
    'O DNA do livro (Fase 2) foi gerado',
    p2 !== null,
    'Book Bible presente', 'Book Bible não gerado',
  ));

  checks.push(check('ms-03', 'manuscript', 'Roteiro existe',
    'O roteiro completo (Fase 3) foi gerado',
    p3 !== null && (p3?.chapters?.length || 0) > 0,
    `${p3?.chapters?.length || 0} capítulos no roteiro`,
    'Roteiro não gerado',
  ));

  checks.push(check('ms-04', 'manuscript', 'Todos os capítulos escritos',
    'Cada capítulo do roteiro tem conteúdo escrito',
    p3 !== null ? chapters.length >= (p3?.total_chapters || 0) : null,
    `${chapters.length}/${p3?.total_chapters || '?'} capítulos escritos`,
    `${chapters.length}/${p3?.total_chapters || '?'} capítulos — faltam ${(p3?.total_chapters || 0) - chapters.length}`,
  ));

  checks.push(check('ms-05', 'manuscript', 'Contagem mínima de palavras',
    'KDP exige mínimo de 2.500 palavras para ebook',
    totalWords >= 2500,
    `${totalWords.toLocaleString()} palavras (mínimo: 2.500)`,
    `${totalWords.toLocaleString()} palavras — abaixo do mínimo KDP de 2.500`,
  ));

  checks.push(warn('ms-06', 'manuscript', 'Contagem alvo de palavras',
    'O manuscrito atinge a meta de palavras do roteiro',
    p3 !== null ? Math.abs(totalWords - (p3?.total_words_target || 0)) / (p3?.total_words_target || 1) <= 0.15 : null,
    `${totalWords.toLocaleString()} palavras (meta: ${p3?.total_words_target?.toLocaleString() || '?'})`,
    `${totalWords.toLocaleString()} palavras — desvio >15% da meta de ${p3?.total_words_target?.toLocaleString() || '?'}`,
  ));

  checks.push(warn('ms-07', 'manuscript', 'Capítulos humanizados',
    'Capítulos passaram pelo humanizador para voz natural',
    chapters.length > 0 ? chapters.some((ch: WrittenChapter) => ch.status === 'humanized') : null,
    `${chapters.filter((ch: WrittenChapter) => ch.status === 'humanized').length}/${chapters.length} humanizados`,
    'Nenhum capítulo humanizado — texto pode soar artificial',
  ));

  checks.push(check('ms-08', 'manuscript', 'Capítulos sem conteúdo vazio',
    'Nenhum capítulo tem conteúdo em branco',
    chapters.length > 0 ? chapters.every((ch: WrittenChapter) => ch.content.trim().length > 100) : null,
    'Todos os capítulos têm conteúdo',
    'Um ou mais capítulos têm conteúdo insuficiente',
  ));

  checks.push(warn('ms-09', 'manuscript', 'Tamanho médio dos capítulos',
    'Capítulos devem ter entre 1.000 e 10.000 palavras cada',
    chapters.length > 0 ? chapters.every((ch: WrittenChapter) => ch.word_count >= 1000 && ch.word_count <= 10000) : null,
    'Todos os capítulos estão no range ideal',
    'Alguns capítulos estão fora do range 1.000-10.000 palavras',
  ));

  checks.push(check('ms-10', 'manuscript', 'Título definido',
    'O livro tem um título',
    p2 !== null ? !!(p2 as unknown as Record<string, unknown>).title : null,
    `Título: "${(p2 as unknown as Record<string, string>)?.title || ''}"`,
    'Título não definido no Book Bible',
  ));

  // ── METADATA CHECKS ──────────────────────────────────────────────────────

  checks.push(check('mt-01', 'metadata', 'Metadados KDP gerados',
    'Keywords, categorias e descrição foram gerados',
    metadata !== null,
    'Metadados KDP presentes', 'Metadados KDP não gerados — execute na aba Metadata',
  ));

  checks.push(check('mt-02', 'metadata', '7 keywords primárias',
    'KDP permite até 7 keywords (recomendado usar todas)',
    metadata !== null ? (metadata?.keywords?.primary?.length || 0) >= 7 : null,
    `${metadata?.keywords?.primary?.length || 0} keywords definidas`,
    `Apenas ${metadata?.keywords?.primary?.length || 0}/7 keywords — use todas para melhor alcance`,
  ));

  checks.push(check('mt-03', 'metadata', 'Keywords dentro do limite',
    'Cada keyword deve ter no máximo 50 caracteres',
    metadata !== null ? (metadata?.keywords?.primary || []).every((k: string) => k.length <= 50) : null,
    'Todas as keywords dentro do limite',
    'Uma ou mais keywords excedem 50 caracteres',
  ));

  checks.push(check('mt-04', 'metadata', 'Categorias BISAC definidas',
    'Duas categorias BISAC selecionadas (primária + secundária)',
    metadata !== null ? !!(metadata?.categories?.bisac_primary?.code && metadata?.categories?.bisac_secondary?.code) : null,
    `${metadata?.categories?.bisac_primary?.code || ''} + ${metadata?.categories?.bisac_secondary?.code || ''}`,
    'Categorias BISAC incompletas',
  ));

  checks.push(check('mt-05', 'metadata', 'Descrição HTML presente',
    'Descrição formatada para a página do livro na Amazon',
    metadata !== null ? (metadata?.description_html?.length || 0) > 100 : null,
    `${metadata?.description_html?.length || 0} caracteres`,
    'Descrição HTML muito curta ou ausente',
  ));

  checks.push(check('mt-06', 'metadata', 'Descrição dentro do limite KDP',
    'KDP permite máximo de 4.000 caracteres na descrição',
    metadata !== null ? (metadata?.description_html?.length || 0) <= 4000 : null,
    `${metadata?.description_html?.length || 0}/4.000 caracteres`,
    `${metadata?.description_html?.length || 0} caracteres — excede o limite de 4.000`,
  ));

  checks.push(check('mt-07', 'metadata', 'Título de busca definido',
    'Título otimizado para busca na Amazon',
    metadata !== null ? !!(metadata?.search_title) : null,
    `"${metadata?.search_title || ''}"`,
    'Título de busca não definido',
  ));

  checks.push(warn('mt-08', 'metadata', 'A+ Content preparado',
    'A+ Content aumenta conversão em até 20%',
    metadata !== null ? (metadata?.a_plus_content?.modules?.length || 0) > 0 : null,
    `${metadata?.a_plus_content?.modules?.length || 0} módulos A+`,
    'A+ Content não preparado — considere gerar para aumentar conversão',
  ));

  // ── DESIGN CHECKS ────────────────────────────────────────────────────────

  checks.push(check('ds-01', 'design', 'Specs de design geradas',
    'Trim size, tipografia e margens definidos',
    design !== null,
    'Design specs presentes', 'Specs de design não geradas — execute na aba Design',
  ));

  checks.push(check('ds-02', 'design', 'Trim size compatível com KDP',
    'Dimensões aceitas pelo KDP Print',
    design !== null ? design?.trim_size?.kdp_compatible === true : null,
    `${design?.trim_size?.name || ''} — KDP compatível`,
    'Trim size não compatível com KDP',
  ));

  checks.push(warn('ds-03', 'design', 'Compatível com IngramSpark',
    'Trim size aceito pela IngramSpark para distribuição ampla',
    design !== null ? design?.trim_size?.ingram_compatible === true : null,
    'IngramSpark compatível',
    'Trim size não compatível com IngramSpark — limita distribuição',
  ));

  checks.push(check('ds-04', 'design', 'Contagem de páginas viável',
    'KDP aceita entre 24 e 828 páginas',
    design !== null ? (design?.interior?.estimated_page_count || 0) >= 24 && (design?.interior?.estimated_page_count || 0) <= 828 : null,
    `${design?.interior?.estimated_page_count || 0} páginas`,
    `${design?.interior?.estimated_page_count || 0} páginas — fora do range KDP (24-828)`,
  ));

  checks.push(warn('ds-05', 'design', 'Margens adequadas',
    'Margens internas suficientes para leitura confortável',
    design !== null ? (design?.interior?.margins?.inside_inches || 0) >= 0.75 : null,
    `Margem interna: ${design?.interior?.margins?.inside_inches || 0}"`,
    `Margem interna muito estreita: ${design?.interior?.margins?.inside_inches || 0}"`,
  ));

  checks.push(warn('ds-06', 'design', 'Front matter inclui copyright',
    'Página de copyright é obrigatória',
    design !== null ? (design?.front_matter || []).some((item: string) => item.toLowerCase().includes('copyright')) : null,
    'Copyright page incluída',
    'Copyright page não listada no front matter',
  ));

  // ── COVER CHECKS ─────────────────────────────────────────────────────────

  checks.push(check('cv-01', 'cover', 'Capas geradas',
    'Variações de capa foram geradas',
    covers !== null && (covers?.covers?.length || 0) > 0,
    `${covers?.covers?.length || 0} variações geradas`,
    'Nenhuma capa gerada — execute na aba Capas',
  ));

  checks.push(check('cv-02', 'cover', 'Capa selecionada',
    'Uma capa foi escolhida como principal',
    !!selectedCover,
    `Variação ${selectedCover?.variation || '?'}: "${selectedCover?.style || ''}"`,
    'Nenhuma capa selecionada — escolha uma na aba Capas',
  ));

  checks.push(check('cv-03', 'cover', 'Imagem da capa disponível',
    'A capa selecionada tem imagem gerada',
    selectedCover !== undefined ? !!selectedCover?.image_url : null,
    'Imagem disponível',
    'Imagem da capa não foi gerada — regere as capas',
  ));

  checks.push(warn('cv-04', 'cover', 'Score da capa',
    'Score de adequação ao gênero acima de 7.0',
    selectedCover !== undefined ? (selectedCover?.score || 0) >= 7 : null,
    `Score: ${selectedCover?.score?.toFixed(1) || '?'}/10`,
    `Score: ${selectedCover?.score?.toFixed(1) || '?'}/10 — considere selecionar uma capa com score maior`,
  ));

  // ── BIOGRAPHY CHECKS ─────────────────────────────────────────────────────

  checks.push(check('bi-01', 'biography', 'Biografia do autor gerada',
    'Pacote biográfico foi criado',
    biography !== null,
    `Autor: ${biography?.author_name || ''}`,
    'Biografia não gerada — execute na aba Biografia',
  ));

  checks.push(check('bi-02', 'biography', 'Bio KDP presente',
    'Biografia para a página do autor na Amazon',
    biography !== null ? (biography?.bios?.kdp_full?.length || 0) > 50 : null,
    `${biography?.bios?.kdp_full?.length || 0} caracteres`,
    'Bio KDP muito curta ou ausente',
  ));

  checks.push(warn('bi-03', 'biography', 'Bio contracapa presente',
    'Bio curta para impressão na contracapa',
    biography !== null ? (biography?.bios?.back_cover?.length || 0) > 30 : null,
    `${biography?.bios?.back_cover?.length || 0} caracteres`,
    'Bio de contracapa ausente',
  ));

  // ── COMPLIANCE CHECKS ────────────────────────────────────────────────────

  checks.push(check('cp-01', 'compliance', 'Gênero definido',
    'Gênero do livro está configurado',
    !!project.genre,
    `Gênero: ${project.genre}`,
    'Gênero não definido no projeto',
  ));

  checks.push(check('cp-02', 'compliance', 'Mercado definido',
    'Mercado alvo configurado (PT-BR ou EN)',
    !!project.market,
    `Mercado: ${project.market === 'pt-br' ? 'PT-BR (Amazon.com.br)' : 'EN (Amazon.com)'}`,
    'Mercado não definido',
  ));

  checks.push(check('cp-03', 'compliance', 'Idioma consistente',
    'Idioma do livro é consistente com o mercado',
    metadata !== null ? (
      (project.market === 'pt-br' && metadata?.language === 'Portuguese') ||
      (project.market === 'en' && metadata?.language === 'English')
    ) : null,
    `Idioma: ${metadata?.language || '?'} — consistente com mercado ${project.market}`,
    `Idioma ${metadata?.language || '?'} inconsistente com mercado ${project.market}`,
  ));

  checks.push(warn('cp-04', 'compliance', 'Título não excede 200 chars',
    'KDP limita título + subtítulo a 200 caracteres',
    p2 !== null ? (((p2 as unknown as Record<string, string>).title || '') + ((p2 as unknown as Record<string, string>).subtitle || '')).length <= 200 : null,
    'Dentro do limite',
    'Título + subtítulo excede 200 caracteres',
  ));

  checks.push(check('cp-05', 'compliance', 'Projeto não arquivado',
    'O projeto está ativo para publicação',
    project.status === 'active',
    `Status: ${project.status}`,
    `Status: ${project.status} — projeto não está ativo`,
  ));

  checks.push(warn('cp-06', 'compliance', 'Audiobook preparado',
    'Scripts de audiobook foram gerados (opcional)',
    p5 !== null ? (p5?.audiobook?.scripts?.length || 0) > 0 : null,
    `${p5?.audiobook?.scripts?.length || 0} scripts de audiobook`,
    'Audiobook não preparado — opcional mas recomendado para alcance maior',
  ));

  // ── COMPILE REPORT ───────────────────────────────────────────────────────

  const passed = checks.filter((c) => c.status === 'pass').length;
  const failed = checks.filter((c) => c.status === 'fail').length;
  const warnings = checks.filter((c) => c.status === 'warn').length;
  const skipped = checks.filter((c) => c.status === 'skip').length;

  return {
    project_id: project.id,
    project_name: project.name,
    timestamp: new Date().toISOString(),
    total_checks: checks.length,
    passed,
    failed,
    warnings,
    skipped,
    ready_to_publish: failed === 0,
    checks,
  };
}
