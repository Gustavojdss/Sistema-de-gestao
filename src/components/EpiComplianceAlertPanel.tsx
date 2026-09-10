import React, { useState, useMemo } from 'react';
import { 
  HardHat, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  User, 
  Building2, 
  Upload, 
  FileText, 
  Printer, 
  Bell, 
  Search, 
  Filter, 
  ExternalLink, 
  Sparkles, 
  Check, 
  Download, 
  Eye, 
  ChevronRight, 
  Info, 
  FileCheck, 
  X,
  FileWarning,
  Send,
  AlertCircle,
  ShieldCheck,
  UserX,
  UserCheck
} from 'lucide-react';
import { Colaborador, DocumentoColaborador, Obra } from '../types/erp';

interface EpiComplianceAlertPanelProps {
  colaboradores: Colaborador[];
  documentos: DocumentoColaborador[];
  obras?: Obra[];
  onNavigate?: (tab: string) => void;
  onSendNotification?: (notif: { titulo: string; mensagem: string; obra_id?: number; obra_nome?: string }) => void;
  onUploadEpiDoc?: (newDoc: Partial<DocumentoColaborador>) => void;
}

export type EpiComplianceStatus = 
  | 'sem_ficha'       // Nenhum documento de EPI cadastrado
  | 'pendente_upload' // Registrado mas sem arquivo_url ou pendente
  | 'vencida'         // Status vencido ou validade ultrapassada
  | 'reprovada'       // Reprovado pelo SESMT
  | 'vencendo_30d'    // Vencendo nos próximos 30 dias
  | 'conforme';       // Aprovado e vigente com arquivo

export interface ColaboradorEpiItem {
  colaborador: Colaborador;
  status: EpiComplianceStatus;
  statusLabel: string;
  statusColor: {
    bg: string;
    text: string;
    border: string;
    badge: string;
    ring: string;
  };
  documentoMaisRecente?: DocumentoColaborador;
  totalDocsEpi: number;
  diasValidadeRestantes: number | null;
  dataValidadeFormatada: string;
  dataEmissaoFormatada: string;
  obraNome: string;
  episRecomendados: string[];
}

// Kits de EPIs recomendados por cargo na construção civil (NR-06)
const EPIS_POR_CARGO: Record<string, string[]> = {
  'Pedreiro': ['Capacete c/ Carneira (CA 31.469)', 'Botina Bico de Aço (CA 28.511)', 'Óculos de Proteção Incolor (CA 18.828)', 'Luva de Látex/Malha Pigmentada', 'Protetor Auricular Tipo Plug (CA 15.624)'],
  'Servente': ['Capacete c/ Carneira (CA 31.469)', 'Botina Bico de Aço (CA 28.511)', 'Óculos de Proteção Incolor (CA 18.828)', 'Luva de Raspa/Vaqueta (CA 12.012)', 'Máscara PFF2 Poeiras'],
  'Eletricista': ['Capacete Classe B Dielétrico (CA 29.738)', 'Botina Dielétrica sem Bico Metálico (CA 35.120)', 'Óculos UV Escuro/Incolor (CA 18.828)', 'Luvas de Alta Tensão 1000V (CA 21.840)', 'Vestimenta RF Risco 2'],
  'Armador': ['Capacete c/ Carneira (CA 31.469)', 'Botina Bico de Aço (CA 28.511)', 'Luva de Raspa Cano Longo (CA 12.012)', 'Óculos de Proteção Incolor (CA 18.828)', 'Protetor Auricular Plug'],
  'Carpinteiro': ['Capacete c/ Carneira (CA 31.469)', 'Botina Bico de Aço (CA 28.511)', 'Óculos Ampla Visão (CA 18.828)', 'Protetor Auricular Tipo Concha (CA 14.235)', 'Luva de Malha Pigmentada'],
  'Encarregado': ['Capacete Branco com Jugular (CA 31.469)', 'Botina de Couro (CA 28.511)', 'Óculos de Segurança (CA 18.828)', 'Protetor Auricular Plug', 'Colete Refletivo'],
  'Engenheiro': ['Capacete Branco com Jugular (CA 31.469)', 'Botina de Couro Nobuck (CA 28.511)', 'Óculos de Segurança (CA 18.828)', 'Colete Refletivo Alta Visibilidade'],
  'Técnico de Segurança': ['Capacete Verde com Jugular (CA 31.469)', 'Botina de Couro (CA 28.511)', 'Óculos de Proteção (CA 18.828)', 'Protetor Auricular Concha', 'Colete Refletivo SST'],
  'Operador de Máquinas': ['Capacete c/ Carneira (CA 31.469)', 'Botina Bico de Aço (CA 28.511)', 'Protetor Auricular Tipo Concha (CA 14.235)', 'Óculos Escuros Proteção Solar (CA 18.828)', 'Luva de Vaqueta Mista'],
  'Pintor': ['Capacete c/ Carneira (CA 31.469)', 'Óculos Ampla Visão (CA 18.828)', 'Respirador Semi-Facial com Filtro Vapores Orgânicos (CA 41.152)', 'Luvas de Nitrila', 'Macacão Tyvek']
};

export const EpiComplianceAlertPanel: React.FC<EpiComplianceAlertPanelProps> = ({
  colaboradores,
  documentos,
  obras = [],
  onNavigate,
  onSendNotification,
  onUploadEpiDoc
}) => {
  const [filterStatus, setFilterStatus] = useState<'sem_ficha' | 'pendentes_ou_vencidos' | 'conforme' | 'todos'>('sem_ficha');
  const [selectedObraId, setSelectedObraId] = useState<string>('all');
  const [selectedTipo, setSelectedTipo] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals state
  const [printModalItem, setPrintModalItem] = useState<ColaboradorEpiItem | null>(null);
  const [uploadModalItem, setUploadModalItem] = useState<ColaboradorEpiItem | null>(null);
  const [notifiedWorkerId, setNotifiedWorkerId] = useState<number | null>(null);
  const [quickUploadSuccess, setQuickUploadSuccess] = useState<boolean>(false);

  // Form state for quick upload modal
  const [uploadForm, setUploadForm] = useState({
    nomeDocumento: 'Ficha de Entrega e Controle de EPI (NR-06)',
    dataEmissao: new Date().toISOString().split('T')[0],
    dataValidade: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    arquivoNome: 'Ficha_EPI_Assinada.pdf',
    observacao: 'Ficha assinada e digitalizada pelo canteiro de obras.'
  });

  // Calculate days to expiration helper
  const parseDaysRemaining = (dateStr?: string): number => {
    if (!dateStr) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
    const parts = clean.split('-');
    if (parts.length !== 3) return 999;

    const expDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    expDate.setHours(0, 0, 0, 0);

    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDateBR = (dateStr?: string): string => {
    if (!dateStr) return '--/--/----';
    try {
      const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
      const parts = clean.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return clean;
    } catch {
      return dateStr;
    }
  };

  // Cross-reference Colaboradores with Documentos to evaluate EPI compliance
  const epiAuditList = useMemo<ColaboradorEpiItem[]>(() => {
    return colaboradores.map(colab => {
      // Find all documents for this worker that relate to EPI
      const colabDocs = documentos.filter(d => 
        (d.colaborador_id === colab.id || (colab.matricula && d.colaborador_matricula === colab.matricula))
      );

      const epiDocs = colabDocs.filter(d => {
        const typeMatch = (d.tipo_documento || '').toLowerCase() === 'epi';
        const name = (d.nome_documento || '').toLowerCase();
        const nameMatch = name.includes('epi') || 
                          name.includes('ficha de entrega') || 
                          name.includes('proteção individual') ||
                          name.includes('termo de entrega');
        return typeMatch || nameMatch;
      });

      // Sort by latest created_at or id
      epiDocs.sort((a, b) => (b.id || 0) - (a.id || 0));
      const latestDoc = epiDocs[0];

      let status: EpiComplianceStatus = 'sem_ficha';
      let diasValidadeRestantes: number | null = null;

      if (!latestDoc) {
        status = 'sem_ficha';
      } else {
        diasValidadeRestantes = parseDaysRemaining(latestDoc.data_validade);

        if (latestDoc.status === 'reprovado') {
          status = 'reprovada';
        } else if (latestDoc.status === 'vencido' || (diasValidadeRestantes !== null && diasValidadeRestantes < 0)) {
          status = 'vencida';
        } else if (latestDoc.status === 'pendente' || !latestDoc.arquivo_url) {
          status = 'pendente_upload';
        } else if (diasValidadeRestantes !== null && diasValidadeRestantes <= 30) {
          status = 'vencendo_30d';
        } else {
          status = 'conforme';
        }
      }

      // Status configuration
      const statusConfigs: Record<EpiComplianceStatus, { label: string; bg: string; text: string; border: string; badge: string; ring: string }> = {
        sem_ficha: {
          label: 'Ficha Não Cadastrada (Risco Crítico)',
          bg: 'bg-red-50/70',
          text: 'text-red-950',
          border: 'border-red-300',
          badge: 'bg-red-600 text-white',
          ring: 'ring-1 ring-red-300'
        },
        pendente_upload: {
          label: 'Pendente de Upload / Sem Arquivo',
          bg: 'bg-amber-50/70',
          text: 'text-amber-950',
          border: 'border-amber-300',
          badge: 'bg-amber-500 text-slate-950',
          ring: 'ring-1 ring-amber-300'
        },
        vencida: {
          label: 'Ficha Vencida / Expirada',
          bg: 'bg-rose-50/70',
          text: 'text-rose-950',
          border: 'border-rose-300',
          badge: 'bg-rose-700 text-white',
          ring: 'ring-1 ring-rose-300'
        },
        reprovada: {
          label: 'Ficha Reprovada pelo SESMT',
          bg: 'bg-red-50/80',
          text: 'text-red-950',
          border: 'border-red-400',
          badge: 'bg-red-700 text-white',
          ring: 'ring-1 ring-red-400'
        },
        vencendo_30d: {
          label: 'Ficha Vencendo em Breve',
          bg: 'bg-yellow-50/70',
          text: 'text-yellow-950',
          border: 'border-yellow-300',
          badge: 'bg-yellow-500 text-slate-950',
          ring: 'ring-1 ring-yellow-300'
        },
        conforme: {
          label: 'Ficha Vigente & Arquivo Anexado',
          bg: 'bg-emerald-50/50',
          text: 'text-emerald-950',
          border: 'border-emerald-200',
          badge: 'bg-emerald-600 text-white',
          ring: 'ring-1 ring-emerald-200'
        }
      };

      const matchedObra = obras.find(o => o.id === colab.obra_id);
      const obraNome = matchedObra ? matchedObra.nome : (colab.obra_nome || 'Canteiro Principal');

      const episRecomendados = EPIS_POR_CARGO[colab.cargo] || [
        'Capacete com Carneira e Jugular (NR-06)',
        'Botina de Segurança com Biqueira',
        'Óculos de Proteção Anti-impacto',
        'Protetor Auricular Plug/Concha',
        'Luvas de Proteção Adequadas à Atividade'
      ];

      return {
        colaborador: colab,
        status,
        statusLabel: statusConfigs[status].label,
        statusColor: statusConfigs[status],
        documentoMaisRecente: latestDoc,
        totalDocsEpi: epiDocs.length,
        diasValidadeRestantes,
        dataValidadeFormatada: latestDoc ? formatDateBR(latestDoc.data_validade) : '--/--/----',
        dataEmissaoFormatada: latestDoc ? formatDateBR(latestDoc.data_emissao) : '--/--/----',
        obraNome,
        episRecomendados
      };
    });
  }, [colaboradores, documentos, obras]);

  // Global Aggregate Statistics
  const stats = useMemo(() => {
    const total = epiAuditList.length || 1;
    const semFicha = epiAuditList.filter(i => i.status === 'sem_ficha');
    const pendenteUpload = epiAuditList.filter(i => i.status === 'pendente_upload');
    const vencidasOuReprovadas = epiAuditList.filter(i => i.status === 'vencida' || i.status === 'reprovada');
    const vencendo30d = epiAuditList.filter(i => i.status === 'vencendo_30d');
    const conformes = epiAuditList.filter(i => i.status === 'conforme');

    const naoConformesTotal = semFicha.length + pendenteUpload.length + vencidasOuReprovadas.length;
    const taxaConformidade = Math.round((conformes.length / total) * 100);

    return {
      total,
      countSemFicha: semFicha.length,
      countPendenteUpload: pendenteUpload.length,
      countVencidas: vencidasOuReprovadas.length,
      countVencendo30d: vencendo30d.length,
      countConformes: conformes.length,
      countNaoConformesTotal: naoConformesTotal,
      taxaConformidade
    };
  }, [epiAuditList]);

  // Filtered List based on user selection
  const filteredList = useMemo(() => {
    return epiAuditList.filter(item => {
      // Status Filter
      if (filterStatus === 'sem_ficha') {
        if (item.status !== 'sem_ficha') return false;
      } else if (filterStatus === 'pendentes_ou_vencidos') {
        if (item.status !== 'pendente_upload' && item.status !== 'vencida' && item.status !== 'reprovada' && item.status !== 'vencendo_30d') return false;
      } else if (filterStatus === 'conforme') {
        if (item.status !== 'conforme') return false;
      }

      // Obra Filter
      if (selectedObraId !== 'all') {
        if (String(item.colaborador.obra_id) !== selectedObraId) return false;
      }

      // Tipo Colaborador Filter
      if (selectedTipo !== 'all') {
        if (item.colaborador.tipo !== selectedTipo) return false;
      }

      // Search Term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = item.colaborador.nome.toLowerCase().includes(q);
        const matchCargo = item.colaborador.cargo.toLowerCase().includes(q);
        const matchMatricula = (item.colaborador.matricula || '').toLowerCase().includes(q);
        const matchCpf = (item.colaborador.cpf || '').toLowerCase().includes(q);
        const matchObra = item.obraNome.toLowerCase().includes(q);
        const matchEmpresa = (item.colaborador.empresa_terceiro || '').toLowerCase().includes(q);
        if (!matchName && !matchCargo && !matchMatricula && !matchCpf && !matchObra && !matchEmpresa) return false;
      }

      return true;
    });
  }, [epiAuditList, filterStatus, selectedObraId, selectedTipo, searchTerm]);

  // Handle Dispatch Notification for Non-compliant Worker
  const handleNotifySupervisor = (item: ColaboradorEpiItem) => {
    const colab = item.colaborador;
    const title = `Alerta NR-06: Ficha de EPI Pendente - ${colab.nome}`;
    let msg = `O colaborador ${colab.nome} (${colab.cargo} - Mat: ${colab.matricula || 'S/M'}) no canteiro ${item.obraNome} `;
    
    if (item.status === 'sem_ficha') {
      msg += `NÃO POSSUI cadastro ou upload da Ficha de Entrega de EPI vigente. Regularização imediata exigida.`;
    } else if (item.status === 'pendente_upload') {
      msg += `está com a ficha de EPI pendente de upload do comprovante assinado.`;
    } else if (item.status === 'vencida') {
      msg += `está com a ficha de EPI expirada/vencida desde ${item.dataValidadeFormatada}.`;
    } else {
      msg += `requer atenção com a renovação da ficha de EPI.`;
    }

    if (onSendNotification) {
      onSendNotification({
        titulo: title,
        mensagem: msg,
        obra_id: colab.obra_id || undefined,
        obra_nome: item.obraNome
      });
    }

    setNotifiedWorkerId(colab.id);
    setTimeout(() => setNotifiedWorkerId(null), 3000);
  };

  // Submit quick upload of EPI sheet
  const handleSaveUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModalItem) return;

    const colab = uploadModalItem.colaborador;
    const newDoc: Partial<DocumentoColaborador> = {
      colaborador_id: colab.id,
      colaborador_nome: colab.nome,
      colaborador_matricula: colab.matricula,
      obra_nome: uploadModalItem.obraNome,
      tipo_documento: 'epi',
      nome_documento: uploadForm.nomeDocumento,
      data_emissao: uploadForm.dataEmissao,
      data_validade: uploadForm.dataValidade,
      arquivo_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      status: 'aprovado',
      observacao: uploadForm.observacao,
      created_at: new Date().toISOString()
    };

    if (onUploadEpiDoc) {
      onUploadEpiDoc(newDoc);
    }

    setQuickUploadSuccess(true);
    setTimeout(() => {
      setQuickUploadSuccess(false);
      setUploadModalItem(null);
    }, 1500);
  };

  return (
    <div 
      id="alerta-conformidade-epi-nr06"
      className="bg-white rounded-lg border border-slate-200 shadow-2xs p-3 transition-all relative overflow-hidden"
    >
      {/* Top Banner Alert Ribbon if There are Workers Without EPI Sheet */}
      {stats.countSemFicha > 0 && (
        <div className="bg-red-600 text-white px-2.5 py-1 -mx-3 -mt-3 mb-2.5 flex items-center justify-between text-[7.5px] font-bold shadow-2xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-300 animate-pulse" />
            <span className="truncate">
              <strong>ALERTA DE SEGURANÇA DO TRABALHO (NR-06):</strong> Existem <strong>{stats.countSemFicha} colaboradores</strong> atuando em campo sem comprovação de entrega de EPI no sistema!
            </span>
          </div>
          <button
            onClick={() => setFilterStatus('sem_ficha')}
            className="px-2 py-0.5 bg-white text-red-700 hover:bg-red-50 rounded text-[7px] font-extrabold uppercase shrink-0 transition-all cursor-pointer shadow-2xs"
          >
            Exibir Não Cadastrados
          </button>
        </div>
      )}

      {/* Header with Title & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0 shadow-2xs">
            <HardHat className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight">
                Auditoria de Fichas de Entrega de EPI (NR-06)
              </h3>
              <span className={`text-[7px] font-black px-1.5 py-0.2 rounded font-mono uppercase tracking-wider ${
                stats.countNaoConformesTotal > 0 ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {stats.countNaoConformesTotal > 0 ? `${stats.countNaoConformesTotal} Pendências Críticas` : '100% Conforme'}
              </span>
            </div>
            <p className="text-[8px] text-slate-500 mt-0.5">
              Cruzamento dinâmico entre lista de colaboradores e acervo documental para prevenção de passivos trabalhistas e autos de infração
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          <button
            id="btn-nav-docs-epi"
            onClick={() => onNavigate && onNavigate('documentos')}
            className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[8px] font-bold transition-all cursor-pointer shadow-2xs"
            title="Ir para Central de Documentos"
          >
            <FileText className="w-3 h-3" />
            <span>Ver Documentos</span>
          </button>
        </div>
      </div>

      {/* Metric Counters Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 mb-2.5">
        {/* Metric 1: Sem Ficha (Crítico) */}
        <div 
          onClick={() => setFilterStatus('sem_ficha')}
          className={`p-2 rounded border transition-all cursor-pointer flex flex-col justify-between ${
            stats.countSemFicha > 0 
              ? 'bg-red-50/80 border-red-300 text-red-950 hover:bg-red-100/70 shadow-2xs' 
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-bold uppercase text-red-900">Sem Ficha de EPI</span>
            <UserX className="w-2.5 h-2.5 text-red-600" />
          </div>
          <div className="mt-0.5">
            <div className="flex items-baseline gap-1">
              <span className="text-xs sm:text-sm font-black text-red-700 font-mono leading-none">
                {stats.countSemFicha}
              </span>
              <span className="text-[7px] font-bold text-red-800">
                ({Math.round((stats.countSemFicha / stats.total) * 100)}%)
              </span>
            </div>
            <span className="text-[6.5px] text-red-700 font-bold block mt-0.5">
              Não cadastradas no SST
            </span>
          </div>
        </div>

        {/* Metric 2: Pendentes de Upload */}
        <div 
          onClick={() => setFilterStatus('pendentes_ou_vencidos')}
          className="bg-amber-50/70 p-2 rounded border border-amber-200 text-amber-950 hover:bg-amber-100/60 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-bold uppercase text-amber-900">Pendente de Upload</span>
            <Upload className="w-2.5 h-2.5 text-amber-600" />
          </div>
          <div className="mt-0.5">
            <div className="flex items-baseline gap-1">
              <span className="text-xs sm:text-sm font-black text-amber-900 font-mono leading-none">
                {stats.countPendenteUpload}
              </span>
              <span className="text-[7px] text-amber-800">colab.</span>
            </div>
            <span className="text-[6.5px] text-amber-700 block mt-0.5">
              Aguardando arquivo assinado
            </span>
          </div>
        </div>

        {/* Metric 3: Fichas Vencidas / Reprovadas */}
        <div 
          onClick={() => setFilterStatus('pendentes_ou_vencidos')}
          className="bg-rose-50/70 p-2 rounded border border-rose-200 text-rose-950 hover:bg-rose-100/60 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-bold uppercase text-rose-900">Vencidas / Reprovadas</span>
            <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
          </div>
          <div className="mt-0.5">
            <div className="flex items-baseline gap-1">
              <span className="text-xs sm:text-sm font-black text-rose-700 font-mono leading-none">
                {stats.countVencidas}
              </span>
              <span className="text-[7px] text-rose-800">expiradas</span>
            </div>
            <span className="text-[6.5px] text-rose-700 block mt-0.5">
              Exigem renovação do termo
            </span>
          </div>
        </div>

        {/* Metric 4: Fichas Vigentes */}
        <div 
          onClick={() => setFilterStatus('conforme')}
          className="bg-emerald-50/70 p-2 rounded border border-emerald-200 text-emerald-950 hover:bg-emerald-100/60 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-bold uppercase text-emerald-900">Em Conformidade</span>
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
          </div>
          <div className="mt-0.5">
            <div className="flex items-baseline gap-1">
              <span className="text-xs sm:text-sm font-black text-emerald-800 font-mono leading-none">
                {stats.countConformes}
              </span>
              <span className="text-[7px] font-bold text-emerald-800">/{stats.total} total</span>
            </div>
            <span className="text-[6.5px] text-emerald-700 block mt-0.5">
              Fichas ativas com anexo
            </span>
          </div>
        </div>

        {/* Metric 5: Taxa de Cobertura NR-06 */}
        <div className="bg-slate-900 text-white p-2 rounded border border-slate-800 flex flex-col justify-between shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-bold uppercase text-slate-300">Índice NR-06</span>
            <span className={`text-[6px] font-bold px-1 py-0.2 rounded ${
              stats.taxaConformidade >= 80 ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-950'
            }`}>
              {stats.taxaConformidade >= 80 ? 'Conforme' : 'Irregular'}
            </span>
          </div>
          <div className="mt-0.5">
            <span className="text-xs sm:text-sm font-black font-mono block leading-none text-amber-300">
              {stats.taxaConformidade}%
            </span>
            <div className="w-full h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  stats.taxaConformidade >= 80 ? 'bg-emerald-500' : stats.taxaConformidade >= 50 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${stats.taxaConformidade}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 bg-slate-50 rounded-md border border-slate-200 mb-2 text-[7.5px]">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="font-extrabold text-slate-600 uppercase">Filtrar:</span>
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded border border-slate-200">
            <button
              onClick={() => setFilterStatus('sem_ficha')}
              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterStatus === 'sem_ficha' ? 'bg-red-600 text-white shadow-2xs font-extrabold' : 'text-red-700 hover:bg-red-100/50'
              }`}
            >
              <UserX className="w-2 h-2" />
              <span>Não Cadastrados ({stats.countSemFicha})</span>
            </button>
            <button
              onClick={() => setFilterStatus('pendentes_ou_vencidos')}
              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterStatus === 'pendentes_ou_vencidos' ? 'bg-amber-500 text-slate-950 shadow-2xs font-extrabold' : 'text-amber-800 hover:bg-amber-100/50'
              }`}
            >
              <AlertTriangle className="w-2 h-2" />
              <span>Pendentes/Vencidos ({stats.countPendenteUpload + stats.countVencidas + stats.countVencendo30d})</span>
            </button>
            <button
              onClick={() => setFilterStatus('conforme')}
              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterStatus === 'conforme' ? 'bg-emerald-700 text-white shadow-2xs font-extrabold' : 'text-emerald-800 hover:bg-emerald-100/50'
              }`}
            >
              <CheckCircle2 className="w-2 h-2" />
              <span>Conformes ({stats.countConformes})</span>
            </button>
            <button
              onClick={() => setFilterStatus('todos')}
              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                filterStatus === 'todos' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({stats.total})
            </button>
          </div>
        </div>

        {/* Right Selectors & Search */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Obra Select */}
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-500">Canteiro:</span>
            <select
              value={selectedObraId}
              onChange={(e) => setSelectedObraId(e.target.value)}
              className="bg-white border border-slate-200 text-slate-900 rounded px-1.5 py-0.5 font-bold focus:ring-1 focus:ring-slate-900 focus:outline-none cursor-pointer text-[7.5px]"
            >
              <option value="all">Todos os Canteiros</option>
              {obras.map(o => (
                <option key={o.id} value={String(o.id)}>{o.nome}</option>
              ))}
            </select>
          </div>

          {/* Tipo Colaborador Select */}
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-500">Vínculo:</span>
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="bg-white border border-slate-200 text-slate-900 rounded px-1.5 py-0.5 font-bold focus:ring-1 focus:ring-slate-900 focus:outline-none cursor-pointer text-[7.5px]"
            >
              <option value="all">Todos (CLT + Terc)</option>
              <option value="proprio">Próprio (CLT)</option>
              <option value="terceiro">Terceirizado</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex items-center">
            <Search className="w-2.5 h-2.5 text-slate-400 absolute left-1.5" />
            <input
              type="text"
              placeholder="Buscar colaborador, cargo, CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-5 pr-2 py-0.5 bg-white border border-slate-200 rounded text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 w-36 sm:w-44 text-[7px]"
            />
          </div>
        </div>
      </div>

      {/* Dynamic List of Workers & EPI Compliance Status */}
      <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-0.5">
        {filteredList.map((item) => {
          const colab = item.colaborador;
          const isNotified = notifiedWorkerId === colab.id;
          const isCritical = item.status === 'sem_ficha' || item.status === 'reprovada';

          return (
            <div
              key={colab.id}
              id={`epi-colaborador-card-${colab.id}`}
              className={`p-2 rounded-md border transition-all ${item.statusColor.bg} ${item.statusColor.border}`}
            >
              {/* Header: Colaborador Info + Status Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Photo or Initials Avatar */}
                  <div className="relative shrink-0">
                    {colab.foto ? (
                      <img 
                        src={colab.foto} 
                        alt={colab.nome} 
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full object-cover border border-slate-300 shadow-2xs"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[8.5px]">
                        {colab.nome.charAt(0)}
                      </div>
                    )}
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${
                      item.status === 'conforme' ? 'bg-emerald-500' :
                      item.status === 'sem_ficha' ? 'bg-red-600' :
                      item.status === 'pendente_upload' ? 'bg-amber-500' : 'bg-rose-500'
                    }`} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-[9.5px] truncate">
                        {colab.nome}
                      </span>
                      <span className="text-[6.5px] px-1 py-0.2 rounded font-mono font-bold bg-white text-slate-700 border border-slate-200">
                        {colab.matricula || `ID-${colab.id}`}
                      </span>
                      <span className={`text-[6.5px] px-1 py-0.2 rounded font-bold ${
                        colab.tipo === 'proprio' ? 'bg-blue-100 text-blue-900' : 'bg-purple-100 text-purple-900'
                      }`}>
                        {colab.tipo === 'proprio' ? 'CLT Brasal' : `Terc: ${colab.empresa_terceiro || 'Parceira'}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[7px] text-slate-600 flex-wrap mt-0.5">
                      <span className="font-semibold text-slate-800">{colab.cargo}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5 text-slate-500">
                        <Building2 className="w-2 h-2 text-slate-400" />
                        {item.obraNome}
                      </span>
                      {colab.cpf && (
                        <>
                          <span>·</span>
                          <span className="font-mono text-slate-400">CPF: {colab.cpf}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badge & Top Action */}
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                  <span className={`px-2 py-0.5 rounded text-[7px] font-extrabold flex items-center gap-1 shadow-2xs ${item.statusColor.badge}`}>
                    {item.status === 'sem_ficha' ? <UserX className="w-2.5 h-2.5" /> :
                     item.status === 'conforme' ? <CheckCircle2 className="w-2.5 h-2.5" /> :
                     item.status === 'pendente_upload' ? <Clock className="w-2.5 h-2.5" /> :
                     <AlertTriangle className="w-2.5 h-2.5" />}
                    <span>{item.statusLabel}</span>
                  </span>

                  {/* Notify Action Button */}
                  {item.status !== 'conforme' && (
                    <button
                      onClick={() => handleNotifySupervisor(item)}
                      disabled={isNotified}
                      className={`px-1.5 py-0.5 rounded text-[6.5px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        isNotified 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-slate-900 hover:bg-slate-800 text-white shadow-2xs'
                      }`}
                      title="Enviar notificação ao gestor do canteiro para cobrar regularização"
                    >
                      {isNotified ? (
                        <>
                          <Check className="w-2 h-2" />
                          <span>Notificado!</span>
                        </>
                      ) : (
                        <>
                          <Bell className="w-2 h-2 text-amber-300" />
                          <span>Cobrar Regularização</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Middle Row: Document Status Details + Recommended EPIs Kit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 p-1.5 bg-white/90 rounded border border-slate-200 text-[7px] mb-1.5">
                {/* Left: Document details */}
                <div>
                  <span className="text-[6px] font-bold text-slate-500 uppercase block mb-0.5">
                    Situação Documental da Ficha de EPI:
                  </span>
                  {item.documentoMaisRecente ? (
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 truncate">
                          {item.documentoMaisRecente.nome_documento}
                        </span>
                        <span className={`font-mono text-[6.5px] font-bold ${
                          item.status === 'conforme' ? 'text-emerald-700' : 'text-red-700'
                        }`}>
                          {item.diasValidadeRestantes !== null && item.diasValidadeRestantes < 0 
                            ? `Vencida há ${Math.abs(item.diasValidadeRestantes)} dias`
                            : `Vence em ${item.dataValidadeFormatada}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[6.5px] text-slate-500 font-mono">
                        <span>Emitida em: {item.dataEmissaoFormatada}</span>
                        {item.documentoMaisRecente.arquivo_url ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                            <FileCheck className="w-2 h-2" /> Arquivo Anexado
                          </span>
                        ) : (
                          <span className="text-amber-700 font-bold flex items-center gap-0.5">
                            <FileWarning className="w-2 h-2" /> Sem arquivo PDF
                          </span>
                        )}
                      </div>
                      {item.documentoMaisRecente.observacao && (
                        <p className="text-[6.5px] text-slate-600 italic bg-slate-50 p-1 rounded border border-slate-100 mt-0.5">
                          Obs: {item.documentoMaisRecente.observacao}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-1 rounded bg-red-50 border border-red-200 text-red-900 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <div>
                        <strong className="block text-[7.5px] text-red-950 font-bold">
                          Nenhum comprovante de entrega de EPI registrado no sistema.
                        </strong>
                        <span className="text-[6.5px] text-red-800">
                          Colaborador admitido em {formatDateBR(colab.data_admissao)}. Exigência legal imediata pela NR-06 e NR-18.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Recommended PPE Kit for this Job Function */}
                <div className="border-t md:border-t-0 md:border-l border-slate-100 md:pl-2">
                  <span className="text-[6px] font-bold text-slate-500 uppercase block mb-0.5">
                    Kit de EPIs Obrigatórios para {colab.cargo}:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {item.episRecomendados.map((epi, idx) => (
                      <span 
                        key={idx}
                        className="px-1 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[6.5px] font-medium"
                      >
                        {epi}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[7px]">
                <span className="text-slate-500 font-mono">
                  {item.totalDocsEpi > 0 
                    ? `${item.totalDocsEpi} registro(s) no histórico`
                    : 'Pendente de homologação pelo SESMT'}
                </span>

                <div className="flex items-center gap-1.5">
                  {/* Generate / Print NR-06 Standard Sheet Button */}
                  <button
                    onClick={() => setPrintModalItem(item)}
                    className="flex items-center gap-1 px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded font-bold cursor-pointer transition-all shadow-2xs"
                    title="Visualizar e Imprimir Ficha de EPI NR-06 preenchida"
                  >
                    <Printer className="w-2.5 h-2.5 text-slate-600" />
                    <span>Gerar Ficha NR-06 (Imprimir)</span>
                  </button>

                  {/* Quick Upload / Attach Button */}
                  <button
                    onClick={() => {
                      setUploadModalItem(item);
                      setUploadForm({
                        nomeDocumento: `Ficha de Entrega de EPI - ${colab.nome}`,
                        dataEmissao: new Date().toISOString().split('T')[0],
                        dataValidade: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        arquivoNome: `Ficha_EPI_${colab.matricula || colab.id}.pdf`,
                        observacao: 'Ficha de EPI regularizada e anexada via Cockpit da Dashboard.'
                      });
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 bg-teal-700 hover:bg-teal-800 text-white rounded font-bold cursor-pointer transition-all shadow-2xs"
                    title="Fazer upload do arquivo digitalizado ou regularizar a ficha"
                  >
                    <Upload className="w-2.5 h-2.5" />
                    <span>Anexar Ficha Assinada</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredList.length === 0 && (
          <div className="text-center py-6 bg-slate-50 rounded border border-dashed border-slate-200 text-[8px] text-slate-500">
            Nenhum colaborador encontrado para os filtros selecionados.
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[7px] text-slate-500 gap-1">
        <div className="flex items-center gap-1">
          <Info className="w-2.5 h-2.5 text-slate-400 shrink-0" />
          <span>
            <strong>Base Legal NR-06 (MTE):</strong> A empresa é obrigada a fornecer aos empregados, gratuitamente, EPI adequado ao risco, registrando o fornecimento mediante recibo assinado.
          </span>
        </div>
        <span className="font-mono text-slate-400">
          {colaboradores.length} colaboradores auditados · Auditoria SST Ativa
        </span>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: VISUALIZADOR & IMPRESSÃO DA FICHA DE EPI PADRONIZADA NR-06       */}
      {/* ========================================================================= */}
      {printModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900 text-white border-b border-slate-800">
              <div className="flex items-center gap-2">
                <HardHat className="w-4 h-4 text-amber-400" />
                <div>
                  <h4 className="font-bold text-xs">Ficha de Entrega e Controle de EPI (NR-06)</h4>
                  <p className="text-[7px] text-slate-300">Modelo Oficial para Assinatura e Arquivamento Físico/Digital</p>
                </div>
              </div>
              <button 
                onClick={() => setPrintModalItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Document Body */}
            <div className="p-4 overflow-y-auto space-y-3 text-[8px] bg-slate-50/50">
              {/* Document Header */}
              <div className="bg-white p-3 rounded border border-slate-300 shadow-2xs">
                <div className="flex justify-between items-start border-b border-slate-200 pb-2 mb-2">
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-900">CONSTRUTORA & INCORPORADORA BRASAL</h5>
                    <span className="text-[7.5px] text-slate-600 block">CNPJ: 00.000.000/0001-00 · SESMT - Segurança e Medicina do Trabalho</span>
                    <span className="text-[7px] text-slate-500 font-mono">Canteiro: <strong>{printModalItem.obraNome}</strong></span>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono font-bold text-[7.5px]">
                      NR-06 / NR-18
                    </span>
                    <span className="block text-[6.5px] text-slate-400 mt-1 font-mono">Via do Empregador</span>
                  </div>
                </div>

                {/* Worker Identity Box */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded border border-slate-200 text-[7.5px]">
                  <div>
                    <span className="text-slate-500 text-[6.5px] block font-bold">Colaborador:</span>
                    <strong className="text-slate-900">{printModalItem.colaborador.nome}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[6.5px] block font-bold">Matrícula / CPF:</span>
                    <span className="font-mono">{printModalItem.colaborador.matricula || 'S/M'} · {printModalItem.colaborador.cpf || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[6.5px] block font-bold">Cargo / Função:</span>
                    <span className="font-semibold text-slate-800">{printModalItem.colaborador.cargo}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[6.5px] block font-bold">Data de Admissão:</span>
                    <span className="font-mono">{formatDateBR(printModalItem.colaborador.data_admissao)}</span>
                  </div>
                </div>
              </div>

              {/* PPEs Table */}
              <div className="bg-white p-3 rounded border border-slate-300 shadow-2xs">
                <h6 className="font-extrabold text-[8.5px] text-slate-900 mb-1.5 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-teal-700" />
                  Relação de Equipamentos de Proteção Individual Fornecidos:
                </h6>

                <table className="w-full text-left border-collapse text-[7px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-extrabold">
                      <th className="p-1">Item / Descrição do EPI</th>
                      <th className="p-1">C.A. (Certif. Aprovação)</th>
                      <th className="p-1">Qtd</th>
                      <th className="p-1">Data Entrega</th>
                      <th className="p-1">Motivo</th>
                      <th className="p-1 text-center">Assinatura / Rubrica</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {printModalItem.episRecomendados.map((epi, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-1 font-medium text-slate-900">{epi}</td>
                        <td className="p-1 font-mono text-slate-600">Vigente MTE</td>
                        <td className="p-1 font-mono">01 un</td>
                        <td className="p-1 font-mono">{new Date().toLocaleDateString('pt-BR')}</td>
                        <td className="p-1 text-slate-600">Fornecimento Inicial</td>
                        <td className="p-1 text-center font-mono text-slate-400 border-b border-dashed border-slate-300">
                          ____________________
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legal Declaration */}
              <div className="bg-white p-3 rounded border border-slate-300 shadow-2xs text-[6.5px] text-slate-600 leading-relaxed space-y-1">
                <h6 className="font-bold text-slate-900 text-[7.5px]">TERMO DE RESPONSABILIDADE E GUARDA (NR-06):</h6>
                <p>
                  Declaro ter recebido da empresa, gratuitamente, os Equipamentos de Proteção Individual (EPI) acima relacionados, novos e em perfeito estado de conservação, bem como ter sido devidamente treinado e instruído sobre o uso correto, guarda e conservação. Comprometo-me a:
                </p>
                <ol className="list-decimal pl-3 space-y-0.5">
                  <li>Usar o EPI apenas para a finalidade a que se destina durante toda a jornada no canteiro de obras;</li>
                  <li>Responsabilizar-me pela guarda, conservação e higienização dos equipamentos recebidos;</li>
                  <li>Comunicar imediatamente ao SESMT/Encarregado qualquer dano, extravio ou alteração que o torne impróprio para uso;</li>
                  <li>Devolver o EPI quando da rescisão contratual ou na troca por desgaste natural.</li>
                </ol>

                <div className="grid grid-cols-2 gap-4 pt-4 mt-2 border-t border-slate-200 text-center">
                  <div>
                    <div className="border-b border-slate-400 pb-1 mb-1 font-mono text-slate-800 text-[7px]">
                      {printModalItem.colaborador.nome}
                    </div>
                    <span className="text-slate-500 font-bold block text-[6.5px]">Assinatura do Empregado (CPF: {printModalItem.colaborador.cpf || 'S/N'})</span>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 pb-1 mb-1 font-mono text-slate-800 text-[7px]">
                      Técnico de Segurança / SESMT
                    </div>
                    <span className="text-slate-500 font-bold block text-[6.5px]">Responsável pela Entrega e Treinamento</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-[7.5px]">
              <span className="text-slate-500">Pronto para impressão em formato A4</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPrintModalItem(null)}
                  className="px-2 py-1 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded font-bold cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3 h-3" />
                  <span>Imprimir Ficha</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: UPLOAD & REGULARIZAÇÃO RÁPIDA DA FICHA DE EPI                    */}
      {/* ========================================================================= */}
      {uploadModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden text-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900 text-white border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-teal-400" />
                <div>
                  <h4 className="font-bold text-xs">Anexar e Regularizar Ficha de EPI</h4>
                  <p className="text-[7px] text-slate-300">Colaborador: {uploadModalItem.colaborador.nome}</p>
                </div>
              </div>
              <button 
                onClick={() => setUploadModalItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUpload} className="p-3 space-y-2.5 text-[7.5px]">
              {quickUploadSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded text-center text-emerald-900 space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto animate-bounce" />
                  <h5 className="font-extrabold text-xs">Ficha de EPI Anexada com Sucesso!</h5>
                  <p className="text-[7.5px]">O status do colaborador foi atualizado para "Em Conformidade".</p>
                </div>
              ) : (
                <>
                  {/* File Dropzone Mockup */}
                  <div className="p-3 border-2 border-dashed border-teal-300 bg-teal-50/50 rounded-lg text-center cursor-pointer hover:bg-teal-50 transition-all">
                    <FileCheck className="w-6 h-6 text-teal-600 mx-auto mb-1" />
                    <span className="font-bold text-slate-800 block text-[8px]">
                      {uploadForm.arquivoNome}
                    </span>
                    <span className="text-[6.5px] text-slate-500">
                      Clique para selecionar ou arraste o PDF digitalizado da ficha assinada (Máx 15MB)
                    </span>
                  </div>

                  {/* Form fields */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Título do Documento:</label>
                      <input
                        type="text"
                        value={uploadForm.nomeDocumento}
                        onChange={(e) => setUploadForm({ ...uploadForm, nomeDocumento: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-1 font-medium focus:ring-1 focus:ring-slate-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Canteiro de Lotação:</label>
                      <input
                        type="text"
                        value={uploadModalItem.obraNome}
                        disabled
                        className="w-full bg-slate-100 border border-slate-200 rounded p-1 font-medium text-slate-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Data de Emissão / Entrega:</label>
                      <input
                        type="date"
                        value={uploadForm.dataEmissao}
                        onChange={(e) => setUploadForm({ ...uploadForm, dataEmissao: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-1 font-mono focus:ring-1 focus:ring-slate-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Data de Validade / Renovação:</label>
                      <input
                        type="date"
                        value={uploadForm.dataValidade}
                        onChange={(e) => setUploadForm({ ...uploadForm, dataValidade: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-1 font-mono focus:ring-1 focus:ring-slate-900"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5">Observações do SESMT:</label>
                    <textarea
                      rows={2}
                      value={uploadForm.observacao}
                      onChange={(e) => setUploadForm({ ...uploadForm, observacao: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-1 font-medium focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setUploadModalItem(null)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Homologar e Salvar Ficha</span>
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
