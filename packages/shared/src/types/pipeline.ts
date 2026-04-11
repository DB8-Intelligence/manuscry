export interface PipelinePhase {
  id: number;
  name: string;
  description: string;
  status: 'locked' | 'active' | 'completed';
}

export const PIPELINE_PHASES: PipelinePhase[] = [
  { id: 0, name: 'Market Analyst', description: 'Análise de mercado KDP + score de oportunidade', status: 'locked' },
  { id: 1, name: 'Theme Selector', description: 'Seleção e validação do tema + UBA', status: 'locked' },
  { id: 2, name: 'Concept Builder', description: 'DNA completo do livro (Book Bible)', status: 'locked' },
  { id: 3, name: 'Narrative Architect', description: 'Roteiro capítulo a capítulo + mapa de tensão', status: 'locked' },
  { id: 4, name: 'Writing Engine', description: 'Escrita + humanização + audiobook', status: 'locked' },
  { id: 5, name: 'Production Studio', description: 'Capa, biografia, formatação e distribuição', status: 'locked' },
];
