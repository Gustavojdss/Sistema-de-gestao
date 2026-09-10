export interface Usuario {
  id: number;
  nome: string;
  email: string;
  senha?: string;
  tipo: 'admin' | 'gestor';
  obra_id?: number | null;
  obra_nome?: string;
  foto_perfil?: string;
  ativo: boolean;
  created_at?: string;
}

export interface Obra {
  id: number;
  nome: string;
  endereco: string;
  foto_obra?: string;
  gestor_id?: number | null;
  gestor_nome?: string;
  status: 'planejamento' | 'em_andamento' | 'pausada' | 'concluida';
  data_inicio: string;
  data_previsao_termino: string;
  orcamento_total: number;
  orcamento_materiais: number;
  orcamento_almoxarifado: number;
  observacoes?: string;
  created_at?: string;
  total_colaboradores?: number;
  total_itens?: number;
  vistorias_pendentes?: number;
  valor_estoque?: number;
  fase_atual?: 'fundacao' | 'estrutura' | 'alvenaria' | 'instalacoes' | 'acabamento';
  progresso?: number;
}

export interface Colaborador {
  id: number;
  nome: string;
  matricula: string;
  cpf: string;
  rg?: string;
  data_nascimento?: string;
  foto?: string;
  cargo: string;
  funcao?: string;
  tipo: 'proprio' | 'terceiro';
  empresa_terceiro?: string;
  empresa_terceira?: string;
  telefone?: string;
  email?: string;
  obra_id?: number | null;
  obra_nome?: string;
  data_admissao?: string;
  status: 'ativo' | 'inativo' | 'transferido';
  created_at?: string;
}

export interface DocumentoColaborador {
  id: number;
  colaborador_id: number;
  colaborador_nome?: string;
  colaborador_matricula?: string;
  obra_nome?: string;
  tipo_documento: 'nr35' | 'nr12' | 'nr10' | 'nr18' | 'nr33' | 'aso' | 'carteira_trabalho' | 'certificado' | 'epi' | 'vacina' | 'contrato' | 'ordem_servico' | 'integracao' | 'outro';
  nome_documento: string;
  arquivo_url?: string;
  data_emissao?: string;
  data_validade?: string;
  status: 'pendente' | 'aprovado' | 'reprovado' | 'vencido';
  motivo_reprovacao?: string;
  observacao?: string;
  uploaded_by?: number;
  uploaded_by_nome?: string;
  created_at: string;
}

export interface ItemAlmoxarifado {
  id: number;
  obra_id: number;
  obra_nome?: string;
  nome: string;
  numero_serie: string;
  categoria: 'Equipamentos' | 'Ferramentas' | 'EPI' | 'Medição' | 'Outros';
  descricao?: string;
  valor_aquisicao: number;
  quantidade_atual: number;
  unidade_medida: string;
  quantidade_minima: number;
  condicao: 'nova' | 'usada' | 'defeito';
  localizacao?: string;
  status: 'estoque' | 'uso' | 'manutencao';
  colaborador_retirada_id?: number | null;
  colaborador_nome?: string;
  data_retirada?: string | null;
  data_previsao_devolucao?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MovimentacaoAlmoxarifado {
  id: number;
  item_id: number;
  item_nome?: string;
  obra_id?: number;
  tipo: 'entrada' | 'saida' | 'devolucao' | 'manutencao';
  quantidade: number;
  colaborador_id?: number | null;
  colaborador_nome?: string;
  responsavel_id?: number | null;
  responsavel_nome?: string;
  observacao?: string;
  data_movimentacao: string;
}

export interface CategoriaMaterial {
  id: number;
  nome: string;
  descricao?: string;
}

export interface MaterialConsumo {
  id: number;
  obra_id: number;
  obra_nome?: string;
  codigo: string;
  nome: string;
  descricao?: string;
  categoria_id?: number | null;
  categoria_nome?: string;
  unidade_medida: string;
  quantidade_atual: number;
  quantidade_minima: number;
  valor_unitario: number;
  valor_total: number;
  localizacao?: string;
  status: 'ativo' | 'inativo';
  fornecedor_padrao?: string;
  created_at?: string;
}

export interface SolicitacaoMaterial {
  id: number;
  obra_id: number;
  obra_nome?: string;
  material_id?: number | null;
  nome_material: string;
  especificacoes?: string;
  quantidade_solicitada: number;
  unidade_medida: string;
  valor_unitario_estimado?: number;
  valor_total_estimado?: number;
  valor_unitario_aprovado?: number;
  valor_total_aprovado?: number;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'entregue';
  motivo_rejeicao?: string;
  solicitado_por?: number;
  solicitante_nome?: string;
  aprovado_por?: number;
  aprovador_nome?: string;
  data_solicitacao: string;
  data_aprovacao?: string;
  data_entrega?: string;
}

export interface MovimentacaoMaterial {
  id: number;
  material_id: number;
  material_nome?: string;
  tipo: 'entrada' | 'saida' | 'ajuste';
  quantidade: number;
  valor_unitario?: number;
  valor_total?: number;
  solicitacao_id?: number | null;
  colaborador_retirada_id?: number | null;
  colaborador_nome?: string;
  responsavel_id?: number | null;
  responsavel_nome?: string;
  observacao?: string;
  data_movimentacao: string;
}

export interface Vistoria {
  id: number;
  obra_id: number;
  obra_nome?: string;
  tipo?: string;
  titulo: string;
  descricao?: string;
  data_agendada: string;
  data_vistoria?: string;
  status: 'pendente' | 'realizada' | 'concluida' | 'cancelada';
  prioridade?: 'urgente' | 'alta' | 'media' | 'baixa';
  local_inspecao?: string;
  etapa_obra?: string;
  realizada_em?: string;
  responsavel_id?: number;
  responsavel_nome?: string;
  observacoes?: string;
  nao_conformidades?: string;
  itens_conformes?: number;
  total_itens?: number;
  created_by?: number;
  created_by_nome?: string;
  created_at: string;
}

export interface SolicitacaoTransferencia {
  id: number;
  colaborador_id: number;
  colaborador_nome?: string;
  colaborador_matricula?: string;
  obra_origem_id?: number;
  obra_origem_nome?: string;
  obra_destino_id: number;
  obra_destino_nome?: string;
  motivo?: string;
  status: 'pendente' | 'aprovada' | 'rejeitada';
  solicitado_por?: number;
  solicitante_nome?: string;
  aprovado_por?: number;
  aprovador_nome?: string;
  data_solicitacao: string;
  data_aprovacao?: string;
}

export interface Notificacao {
  id: number;
  usuario_id: number;
  obra_id?: number;
  obra_nome?: string;
  titulo: string;
  mensagem: string;
  tipo: 'vistoria' | 'documento' | 'transferencia' | 'estoque' | 'sistema';
  lida: boolean;
  created_at: string;
}

export interface LogAuditoria {
  id: number;
  created_at: string;
  usuario_id: number;
  usuario_nome: string;
  modulo: string;
  acao: string;
  detalhes: string;
  ip_origem?: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  user_nome?: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'APPROVE' | 'REJECT';
  entity: string;
  entity_id: string;
  old_data?: any;
  new_data?: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface IncidenteSeguranca {
  id: number;
  obra_id: number;
  obra_nome?: string;
  titulo: string;
  descricao: string;
  tipo: 'quase_acidente' | 'desvio_comportamental' | 'condicao_insegura' | 'acidente_sem_afastamento' | 'acidente_com_afastamento' | 'nao_conformidade_nr';
  categoria_risco: 'trabalho_altura' | 'eletrica' | 'escavacao_estruturas' | 'maquinas_equipamentos' | 'epi_epc' | 'incendio' | 'ergonomia_saude';
  gravidade: 'baixo' | 'medio' | 'alto' | 'critico';
  probabilidade: 1 | 2 | 3 | 4 | 5; // 1: Muito Baixa, 5: Frequente
  impacto: 1 | 2 | 3 | 4 | 5;       // 1: Insignificante, 5: Catastrófico
  local_especifico: string;
  data_ocorrencia: string;
  status: 'aberto' | 'em_investigacao' | 'plano_acao' | 'mitigado' | 'concluido';
  responsavel_nome?: string;
  plano_acao_sugerido?: string;
  prazo_correcao?: string;
  afastamento_dias?: number;
  vistoria_relacionada_id?: number;
  created_at: string;
}

export interface DocumentoSubempreiteira {
  id: number;
  contrato_id: number;
  tipo: 'pgr' | 'pcmso' | 'ltcat' | 'art_rrt' | 'gfip_sefip' | 'cnd_inss' | 'apolice_seguro' | 'termo_integracao';
  nome_documento: string;
  arquivo_url?: string;
  data_emissao: string;
  data_validade: string;
  status: 'aprovado' | 'pendente' | 'vencido' | 'reprovado';
  observacao?: string;
}

export interface ContratoSubempreiteira {
  id: number;
  codigo_contrato: string;
  empresa_razao_social: string;
  empresa_nome_fantasia: string;
  cnpj: string;
  especialidade: string;
  obra_id: number;
  obra_nome: string;
  gestor_contrato_nome: string;
  contato_responsavel: string;
  telefone: string;
  email: string;
  data_inicio: string;
  data_fim: string;
  status_contrato: 'ativo' | 'em_mobilizacao' | 'suspenso' | 'encerrado';
  status_homologacao_sst: 'homologado' | 'pendente_renovacao' | 'irregular_bloqueado' | 'em_analise';
  valor_global?: number;
  documentos_sst?: DocumentoSubempreiteira[];
  created_at?: string;
}

export interface EntregaLogisticaMaterial {
  id: number;
  solicitacao_id?: number;
  material_id?: number;
  material_nome: string;
  quantidade: number;
  unidade: string;
  obra_id: number;
  obra_nome: string;
  fornecedor: string;
  transportadora?: string;
  placa_veiculo?: string;
  motorista?: string;
  nota_fiscal?: string;
  data_previsao: string; // YYYY-MM-DD
  horario_previsto?: string;
  status: 'agendado' | 'em_transito' | 'saiu_para_entrega' | 'descarregando' | 'entregue' | 'atrasado';
  frente_servico?: string;
  local_descarga?: string;
  observacoes?: string;
  created_at?: string;
}

