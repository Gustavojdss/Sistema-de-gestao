import React, { useState, useMemo } from 'react';
import {
  Clock,
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  FileCheck,
  RefreshCw,
  Calendar,
  CheckCircle2,
  HardHat,
  Building2,
  ChevronRight,
  ShieldAlert,
  FileText,
  Check,
  X,
  Send,
  Download,
  ExternalLink,
  Sparkles,
  Stethoscope,
  Award,
  Zap,
  Filter,
  Search,
  UploadCloud,
  Eye,
  User,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DocumentoColaborador, Colaborador, Obra } from '../types/erp';

export interface ExpiringCollaboratorDocItem {
  colaborador: Colaborador;
  documento: DocumentoColaborador;
  diasRestantes: number;
  urgencia: 'vencido' | 'urgente_3d' | 'atencao_7d' | 'preventivo_15d';
  dataValidadeFormatada: string;
  dataEmissaoFormatada: string;
  obraNome: string;
}

interface UpcomingExpiringDocsSectionProps {
  documentos: DocumentoColaborador[];
  colaboradores: Colaborador[];
  obras: Obra[];
  onRenovarDocumento?: (
    docId: number,
    dadosRenovacao: {
      data_emissao: string;
      data_validade: string;
      observacao?: string;
      arquivo_url?: string;
      status?: 'aprovado' | 'pendente';
      clinica?: string;
    }
  ) => void;
  onSendNotification?: (notif: { titulo: string; mensagem: string; obra_id?: number; obra_nome?: string }) => void;
  onNavigate?: (tab: string, subTab?: string) => void;
}

export const UpcomingExpiringDocsSection: React.FC<UpcomingExpiringDocsSectionProps> = ({
  documentos,
  colaboradores,
  obras,
  onRenovarDocumento,
  onSendNotification,
  onNavigate
}) => {
  // Filters
  const [selectedObraFilter, setSelectedObraFilter] = useState<string>('todas');
  const [tipoDocFilter, setTipoDocFilter] = useState<'todos' | 'aso' | 'nrs' | 'epi'>('todos');
  const [urgenciaFilter, setUrgenciaFilter] = useState<'todos' | 'vencidos' | 'urgentes' | 'proximos'>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State for Direct Renewal
  const [renewalModalItem, setRenewalModalItem] = useState<ExpiringCollaboratorDocItem | null>(null);
  const [previewDocItem, setPreviewDocItem] = useState<ExpiringCollaboratorDocItem | null>(null);
  
  // Renewal Form State
  const [renewalForm, setRenewalForm] = useState({
    data_emissao: new Date().toISOString().split('T')[0],
    data_validade: '',
    clinica_entidade: 'Clínica MedSeg Ocupacional & Engenharia',
    medico_responsavel: 'Dr. Roberto Campos - CRM-DF 18.420 (Médico do Trabalho)',
    observacao: 'Renovação periódica regularizada conforme diretrizes das NRs e PCMSO corporativo.',
    status: 'aprovado' as 'aprovado' | 'pendente',
    arquivo_nome: 'Laudo_Renovado_Digitalizado.pdf'
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper to calculate days remaining
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

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'Não informada';
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

  // 1. Process all documents expiring within next 15 days or already expired (vencidos)
  const allExpiringDocs = useMemo<ExpiringCollaboratorDocItem[]>(() => {
    const list: ExpiringCollaboratorDocItem[] = [];

    documentos.forEach(doc => {
      if (!doc.data_validade) return;
      const dias = parseDaysRemaining(doc.data_validade);
      // Capture expired documents (dias < 0 or status === 'vencido') and docs expiring in <= 15 days
      if (dias <= 15 || doc.status === 'vencido') {
        const colab = colaboradores.find(c => c.id === doc.colaborador_id);
        if (colab) {
          let urgencia: ExpiringCollaboratorDocItem['urgencia'] = 'preventivo_15d';
          if (dias < 0 || doc.status === 'vencido') {
            urgencia = 'vencido';
          } else if (dias <= 3) {
            urgencia = 'urgente_3d';
          } else if (dias <= 7) {
            urgencia = 'atencao_7d';
          }

          list.push({
            colaborador: colab,
            documento: doc,
            diasRestantes: dias,
            urgencia,
            dataValidadeFormatada: formatDate(doc.data_validade),
            dataEmissaoFormatada: formatDate(doc.data_emissao),
            obraNome: colab.obra_nome || doc.obra_nome || 'Canteiro Geral'
          });
        }
      }
    });

    // Sort by days remaining ascending: expired documents first, then closest to expire
    return list.sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [documentos, colaboradores]);

  // 2. Extract Distinct Top 5 Collaborators with their most urgent SST document
  const top5Collaborators = useMemo<ExpiringCollaboratorDocItem[]>(() => {
    let filtered = allExpiringDocs;

    // Filter by Urgência status
    if (urgenciaFilter === 'vencidos') {
      filtered = filtered.filter(item => item.urgencia === 'vencido');
    } else if (urgenciaFilter === 'urgentes') {
      filtered = filtered.filter(item => item.urgencia === 'urgente_3d');
    } else if (urgenciaFilter === 'proximos') {
      filtered = filtered.filter(item => item.urgencia === 'atencao_7d' || item.urgencia === 'preventivo_15d');
    }

    // Filter by Obra
    if (selectedObraFilter !== 'todas') {
      const obraIdNum = Number(selectedObraFilter);
      filtered = filtered.filter(item => item.colaborador.obra_id === obraIdNum);
    }

    // Filter by Tipo Doc
    if (tipoDocFilter === 'aso') {
      filtered = filtered.filter(item => item.documento.tipo_documento === 'aso');
    } else if (tipoDocFilter === 'nrs') {
      filtered = filtered.filter(item => ['nr35', 'nr10', 'nr12', 'nr18', 'nr33'].includes(item.documento.tipo_documento));
    } else if (tipoDocFilter === 'epi') {
      filtered = filtered.filter(item => item.documento.tipo_documento === 'epi');
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.colaborador.nome.toLowerCase().includes(q) ||
        item.colaborador.matricula.toLowerCase().includes(q) ||
        item.colaborador.cargo.toLowerCase().includes(q) ||
        item.documento.nome_documento.toLowerCase().includes(q) ||
        item.obraNome.toLowerCase().includes(q)
      );
    }

    // Ensure 1 primary most urgent document per collaborator, up to 5 collaborators
    const seenColabIds = new Set<number>();
    const distinctColabs: ExpiringCollaboratorDocItem[] = [];

    for (const item of filtered) {
      if (!seenColabIds.has(item.colaborador.id)) {
        seenColabIds.add(item.colaborador.id);
        distinctColabs.push(item);
        if (distinctColabs.length === 5) break;
      }
    }

    return distinctColabs;
  }, [allExpiringDocs, urgenciaFilter, selectedObraFilter, tipoDocFilter, searchQuery]);

  // Handler to open the direct renewal modal
  const handleOpenRenewalModal = (item: ExpiringCollaboratorDocItem) => {
    setRenewalModalItem(item);

    // Calculate default new validity (+1 year from now)
    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);
    const defValidade = nextYear.toISOString().split('T')[0];

    // Suggest appropriate clinics/examiners based on document type
    let defaultClinica = 'Clínica MedSeg Ocupacional & Medicina do Trabalho';
    let defaultResp = 'Dr. Roberto Campos - CRM-DF 18.420 (Médico do Trabalho)';
    let defaultObs = `Renovação periódica do ${item.documento.nome_documento} realizada com sucesso. Colaborador apto para as atividades laborais.`;

    if (item.documento.tipo_documento === 'nr35') {
      defaultClinica = 'Instituto Senai de Segurança do Trabalho - DF';
      defaultResp = 'Eng. André Luis Vasconcelos - CREA-DF 38.991/D (Eng. de Segurança)';
      defaultObs = 'Curso prático de reciclagem NR-35 (8h) com aprovação em teste de montagem de pontos de ancoragem e retenção de queda.';
    } else if (item.documento.tipo_documento === 'nr10') {
      defaultClinica = 'Centro de Capacitação Eletrotécnica & SST';
      defaultResp = 'Eng. Eletricista Marcelo Silveira - CREA-DF 21.054';
      defaultObs = 'Reciclagem bienal NR-10 básica (16h) com emissão de certificado digital e ART de instrução.';
    } else if (item.documento.tipo_documento === 'epi') {
      defaultClinica = 'Almoxarifado Central & SESMT da Obra';
      defaultResp = 'Técnico de Segurança do Trabalho - Reg. MTE 00421';
      defaultObs = 'Entrega periódica e substituição de EPIs com Certificado de Aprovação (CA) válido e termo de guarda assinado.';
    }

    setRenewalForm({
      data_emissao: today.toISOString().split('T')[0],
      data_validade: defValidade,
      clinica_entidade: defaultClinica,
      medico_responsavel: defaultResp,
      observacao: defaultObs,
      status: 'aprovado',
      arquivo_nome: `${item.documento.tipo_documento.toUpperCase()}_Renovado_${item.colaborador.matricula}.pdf`
    });
  };

  // Quick preset dates for renewal
  const handleSetValidityPreset = (months: number) => {
    const base = new Date();
    base.setMonth(base.getMonth() + months);
    setRenewalForm(prev => ({
      ...prev,
      data_validade: base.toISOString().split('T')[0]
    }));
  };

  // Submit Renewal
  const handleSubmitRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewalModalItem) return;

    if (!renewalForm.data_validade) {
      alert('Por favor, informe a nova data de validade legal.');
      return;
    }

    // Call external handler if supplied
    if (onRenovarDocumento) {
      onRenovarDocumento(renewalModalItem.documento.id, {
        data_emissao: renewalForm.data_emissao,
        data_validade: renewalForm.data_validade,
        observacao: `${renewalForm.observacao} | Emissor: ${renewalForm.clinica_entidade} (${renewalForm.medico_responsavel})`,
        status: renewalForm.status,
        clinica: renewalForm.clinica_entidade
      });
    }

    // Direct in-place mutation to ensure immediate UI reactivity
    renewalModalItem.documento.data_emissao = renewalForm.data_emissao;
    renewalModalItem.documento.data_validade = renewalForm.data_validade;
    renewalModalItem.documento.status = renewalForm.status;
    renewalModalItem.documento.observacao = renewalForm.observacao;

    // Send notification
    if (onSendNotification) {
      onSendNotification({
        titulo: `Documento Renovado: ${renewalModalItem.colaborador.nome}`,
        mensagem: `O documento "${renewalModalItem.documento.nome_documento}" foi renovado até ${formatDate(renewalForm.data_validade)} pela ${renewalForm.clinica_entidade}.`,
        obra_id: renewalModalItem.colaborador.obra_id,
        obra_nome: renewalModalItem.obraNome
      });
    }

    const colabNome = renewalModalItem.colaborador.nome;
    const docNome = renewalModalItem.documento.nome_documento;
    const novaVal = formatDate(renewalForm.data_validade);

    setRenewalModalItem(null);
    setToastMessage(`Documento "${docNome}" de ${colabNome} renovado com sucesso até ${novaVal}!`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Send immediate warning notification for a collaborator
  const handleNotifyCollaborator = (item: ExpiringCollaboratorDocItem) => {
    const notif = {
      titulo: `[URGENTE SST] Vencimento Próximo: ${item.colaborador.nome} (${item.documento.nome_documento})`,
      mensagem: `Atenção: O documento legal ${item.documento.nome_documento} vence em ${item.diasRestantes} dia(s) (validade: ${item.dataValidadeFormatada}). Favor providenciar a renovação clínica ou treinamento de reciclagem imediatamente para evitar restrições de acesso ao canteiro ${item.obraNome}.`,
      obra_id: item.colaborador.obra_id,
      obra_nome: item.obraNome
    };

    if (onSendNotification) {
      onSendNotification(notif);
    }

    setToastMessage(`Notificação de cobrança de renovação disparada para o gestor da obra ${item.obraNome}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Get document badge color and icon
  const getDocTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'aso':
        return <Stethoscope className="w-3.5 h-3.5 text-rose-600" />;
      case 'nr35':
        return <Award className="w-3.5 h-3.5 text-indigo-600" />;
      case 'nr10':
        return <Zap className="w-3.5 h-3.5 text-amber-600" />;
      case 'nr12':
        return <HardHat className="w-3.5 h-3.5 text-orange-600" />;
      case 'epi':
        return <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div id="secao-documentos-proximos-vencimento" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center justify-between text-emerald-800 text-xs font-semibold animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-500/20 border border-amber-400/30 rounded-xl text-amber-400 mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Colaboradores com Documentos Vencidos e Próximos ao Vencimento
                </h3>
                {allExpiringDocs.filter(d => d.urgencia === 'vencido').length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-red-500/30 text-red-300 border border-red-400/40 flex items-center gap-1 animate-pulse">
                    <AlertOctagon className="w-3 h-3 text-red-400" />
                    {allExpiringDocs.filter(d => d.urgencia === 'vencido').length} Vencido(s)
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Janela 15 Dias
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                  Top Críticos
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Acompanhamento prioritário de atestados médicos ocupacionais (NR-7), treinamentos de segurança (NR-35, NR-10, NR-12, NR-18) e fichas de EPI vencidos ou prestes a expirar. Utilize a renovação direta para emitir laudos e manter a conformidade do canteiro.
              </p>
            </div>
          </div>

          {/* Quick Counter Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-red-950/60 border border-red-500/40 rounded-lg px-3 py-1.5 text-center">
              <span className="text-[10px] text-red-300 block uppercase font-bold">Vencidos</span>
              <span className="text-base font-black text-red-400">
                {allExpiringDocs.filter(d => d.urgencia === 'vencido').length}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-1.5 text-center">
              <span className="text-[10px] text-slate-300 block uppercase font-medium">Urgentes (&le; 3d)</span>
              <span className="text-base font-black text-rose-400">
                {allExpiringDocs.filter(d => d.urgencia === 'urgente_3d').length}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-1.5 text-center">
              <span className="text-[10px] text-slate-300 block uppercase font-medium">Total Crítico</span>
              <span className="text-base font-black text-amber-400">{allExpiringDocs.length} laudos</span>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('rh', 'colaboradores')}
              className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <FileCheck className="w-4 h-4" />
              Ver Todos no RH
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Urgency Filter */}
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-300">
            <button
              onClick={() => setUrgenciaFilter('todos')}
              className={`px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                urgenciaFilter === 'todos' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Todos ({allExpiringDocs.length})
            </button>
            <button
              onClick={() => setUrgenciaFilter('vencidos')}
              className={`px-2 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                urgenciaFilter === 'vencidos' ? 'bg-red-600 text-white shadow-xs' : 'text-red-700 hover:bg-red-50'
              }`}
            >
              <AlertOctagon className="w-3 h-3" />
              Vencidos ({allExpiringDocs.filter(d => d.urgencia === 'vencido').length})
            </button>
            <button
              onClick={() => setUrgenciaFilter('urgentes')}
              className={`px-2 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                urgenciaFilter === 'urgentes' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              &le; 3 Dias ({allExpiringDocs.filter(d => d.urgencia === 'urgente_3d').length})
            </button>
            <button
              onClick={() => setUrgenciaFilter('proximos')}
              className={`px-2 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                urgenciaFilter === 'proximos' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              <Clock className="w-3 h-3" />
              4-15 Dias ({allExpiringDocs.filter(d => d.urgencia === 'atencao_7d' || d.urgencia === 'preventivo_15d').length})
            </button>
          </div>

          {/* Obra selector */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedObraFilter}
              onChange={(e) => setSelectedObraFilter(e.target.value)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="todas">Todas as Obras ({obras.length})</option>
              {obras.map(o => (
                <option key={o.id} value={o.id}>{o.nome}</option>
              ))}
            </select>
          </div>

          {/* Tipo Doc Filter */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={tipoDocFilter}
              onChange={(e) => setTipoDocFilter(e.target.value as any)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="todos">Todos os Laudos</option>
              <option value="aso">🩺 Somente ASO (NR-07)</option>
              <option value="nrs">🏅 Treinamentos NRs (35, 10, 12, 18)</option>
              <option value="epi">🛡️ Ficha de EPI (NR-06)</option>
            </select>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar colaborador ou laudo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 w-44 sm:w-56"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
          <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <span>Fila prioritária com animações de urgência visual</span>
        </div>
      </div>

      {/* Main List: Top 5 Collaborators */}
      <div className="p-5">
        {top5Collaborators.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300 p-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              Nenhum colaborador com documento pendente no filtro selecionado!
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Todos os colaboradores avaliados estão em conformidade legal com ASO, certificações NRs e fichas de EPI.
            </p>
            {(selectedObraFilter !== 'todas' || tipoDocFilter !== 'todos' || urgenciaFilter !== 'todos' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedObraFilter('todas');
                  setTipoDocFilter('todos');
                  setUrgenciaFilter('todos');
                  setSearchQuery('');
                }}
                className="mt-3 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Limpar Todos os Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {top5Collaborators.map((item, index) => {
                const isVencido = item.urgencia === 'vencido' || item.diasRestantes < 0;
                const isUrgent = !isVencido && item.diasRestantes <= 3;
                const isAttention = !isVencido && item.diasRestantes > 3 && item.diasRestantes <= 7;

                return (
                  <motion.div
                    key={`${item.colaborador.id}-${item.documento.id}`}
                    layout
                    initial={{ opacity: 0, y: 24, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.96 }}
                    transition={{
                      duration: 0.38,
                      delay: Math.min(index * 0.08, 0.4),
                      ease: [0.22, 1, 0.36, 1]
                    }}
                    whileHover={{
                      y: -2,
                      transition: { duration: 0.2 }
                    }}
                    className={`relative rounded-xl border transition-all p-4 bg-white shadow-xs hover:shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 overflow-hidden ${
                      isVencido
                        ? 'border-red-500 bg-gradient-to-r from-red-50/95 via-red-50/30 to-white ring-2 ring-red-200/90'
                        : isUrgent
                        ? 'border-rose-400 bg-gradient-to-r from-rose-50/60 via-white to-white ring-1 ring-rose-200'
                        : isAttention
                        ? 'border-amber-300 bg-gradient-to-r from-amber-50/30 via-white to-white'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Left: Collaborator Info & Avatar */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                      {/* Priority Ranking Pill */}
                      <div className="flex-shrink-0 flex flex-col items-center justify-center">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${
                            isVencido
                              ? 'bg-red-600 text-white animate-pulse'
                              : isUrgent
                              ? 'bg-rose-600 text-white animate-pulse'
                              : isAttention
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                          title={
                            isVencido
                              ? '🚨 Prioridade Crítica: Documento VENCIDO'
                              : `Prioridade #${index + 1} na fila de renovação`
                          }
                        >
                          #{index + 1}
                        </span>
                      </div>

                      {/* Avatar with Status Beacon */}
                      <div className="relative flex-shrink-0">
                        {item.colaborador.foto ? (
                          <img
                            src={item.colaborador.foto}
                            alt={item.colaborador.nome}
                            className={`w-11 h-11 rounded-full object-cover border-2 shadow-sm ${
                              isVencido
                                ? 'border-red-500 ring-2 ring-red-300'
                                : isUrgent
                                ? 'border-rose-400'
                                : 'border-slate-200'
                            }`}
                          />
                        ) : (
                          <div
                            className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm ${
                              isVencido
                                ? 'bg-red-100 text-red-700 border-2 border-red-500 ring-2 ring-red-300'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {item.colaborador.nome.charAt(0)}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-sm">
                          {getDocTypeIcon(item.documento.tipo_documento)}
                        </div>

                        {/* Pulsing Beacon for Expired Document */}
                        {isVencido && (
                          <span className="absolute -top-1 -left-1 flex h-3 w-3" title="Documento Vencido">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                          </span>
                        )}
                      </div>

                      {/* Info text */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {item.colaborador.nome}
                          </h4>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                            {item.colaborador.matricula}
                          </span>
                          {isVencido && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white flex items-center gap-1 shadow-xs animate-pulse">
                              <AlertOctagon className="w-2.5 h-2.5" />
                              VENCIDO
                            </span>
                          )}
                          {item.colaborador.tipo === 'terceiro' ? (
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                              Terceirizado: {item.colaborador.empresa_terceiro || 'Subempreiteira'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                              Próprio
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                          <span className="font-medium text-slate-700">{item.colaborador.cargo}</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1 text-slate-600">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {item.obraNome}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Center: Expiring Document Specifics */}
                    <div
                      className={`flex-1 lg:max-w-md p-3 rounded-lg border text-xs ${
                        isVencido
                          ? 'bg-red-50/70 border-red-200'
                          : 'bg-slate-50/80 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800 min-w-0">
                          {getDocTypeIcon(item.documento.tipo_documento)}
                          <span className="truncate block font-bold text-slate-900" title={item.documento.nome_documento}>
                            {item.documento.nome_documento}
                          </span>
                        </div>
                        <span
                          className={`px-1.5 py-0.2 rounded uppercase text-[9px] font-extrabold flex-shrink-0 ${
                            isVencido
                              ? 'bg-red-200 text-red-900'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {item.documento.tipo_documento.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-200/80 text-[11px]">
                        <div className="text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>
                            Validade: <strong className={isVencido ? 'text-red-700' : 'text-slate-800'}>{item.dataValidadeFormatada}</strong>
                          </span>
                        </div>

                        {/* Countdown / Status badge */}
                        {isVencido ? (
                          <span className="px-2.5 py-0.5 rounded-full font-black text-[10px] bg-red-600 text-white shadow-xs flex items-center gap-1.5 animate-pulse">
                            <AlertOctagon className="w-3 h-3" />
                            <span>
                              {item.diasRestantes < 0 ? `Vencido há ${Math.abs(item.diasRestantes)} dia(s)` : 'Vence HOJE!'}
                            </span>
                          </span>
                        ) : isUrgent ? (
                          <span className="px-2 py-0.5 rounded-full font-black text-[10px] bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            {item.diasRestantes === 0 ? 'Vence HOJE!' : `Vence em ${item.diasRestantes} dia(s)`}
                          </span>
                        ) : isAttention ? (
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            Vence em {item.diasRestantes} dias
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-yellow-100 text-yellow-900 border border-yellow-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-yellow-700" />
                            Vence em {item.diasRestantes} dias
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Direct Actions & Renewal Link */}
                    <div className="flex items-center justify-end gap-2 flex-shrink-0">
                      <button
                        onClick={() => setPreviewDocItem(item)}
                        className="px-2.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Visualizar laudo atual e histórico"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ver Laudo</span>
                      </button>

                      <button
                        onClick={() => handleNotifyCollaborator(item)}
                        className="px-2.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Disparar notificação imediata de cobrança ao gestor e encarregado"
                      >
                        <Send className="w-3.5 h-3.5 text-amber-600" />
                        <span className="hidden sm:inline">Cobrar</span>
                      </button>

                      {/* DIRECT LINK TO RENEWAL MODAL */}
                      <button
                        id={`btn-renovar-doc-${item.colaborador.id}`}
                        onClick={() => handleOpenRenewalModal(item)}
                        className={`px-3.5 py-2 rounded-lg text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 hover:shadow group cursor-pointer ${
                          isVencido
                            ? 'bg-red-600 hover:bg-red-700 ring-2 ring-red-300'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        <RefreshCw className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
                        <span>{isVencido ? 'Renovar Imediatamente' : 'Renovar Documento'}</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE RENOVAÇÃO DOCUMENTAL DE SST (DIRETO E COMPLETO)                  */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {renewalModalItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Renovação de Documento de SST
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Atualização legal de atestados, certificações e laudos de segurança (NRs / PCMSO)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRenewalModalItem(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

            {/* Collaborator & Expiring Document Context Summary Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {renewalModalItem.colaborador.foto ? (
                    <img
                      src={renewalModalItem.colaborador.foto}
                      alt={renewalModalItem.colaborador.nome}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm">
                      {renewalModalItem.colaborador.nome.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {renewalModalItem.colaborador.nome}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {renewalModalItem.colaborador.cargo} &bull; Matrícula: {renewalModalItem.colaborador.matricula}
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                      Canteiro: <strong>{renewalModalItem.obraNome}</strong>
                    </p>
                  </div>
                </div>

                <div className="sm:text-right bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Documento em Renovação</span>
                  <span className="text-xs font-bold text-slate-800 block truncate max-w-[200px]">
                    {renewalModalItem.documento.nome_documento}
                  </span>
                  <span className="text-[11px] font-bold text-rose-600 block mt-0.5">
                    Vence em {renewalModalItem.diasRestantes} dias ({renewalModalItem.dataValidadeFormatada})
                  </span>
                </div>
              </div>
            </div>

            {/* Renewal Form */}
            <form onSubmit={handleSubmitRenewal} className="space-y-4 mt-5 text-xs">
              {/* Emission and Validity Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nova Data de Emissão / Realização *
                  </label>
                  <input
                    type="date"
                    required
                    value={renewalForm.data_emissao}
                    onChange={(e) => setRenewalForm({ ...renewalForm, data_emissao: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Data em que o exame ou treinamento foi realizado.
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">
                      Nova Data de Validade Legal *
                    </label>
                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleSetValidityPreset(6)}
                        className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium"
                      >
                        +6m
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetValidityPreset(12)}
                        className="px-1.5 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold"
                      >
                        +1 ano
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetValidityPreset(24)}
                        className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium"
                      >
                        +2 anos
                      </button>
                    </div>
                  </div>
                  <input
                    type="date"
                    required
                    value={renewalForm.data_validade}
                    onChange={(e) => setRenewalForm({ ...renewalForm, data_validade: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Padrão: 1 ano para ASO/NR-18 e 2 anos para NR-35/NR-10.
                  </span>
                </div>
              </div>

              {/* Clinic and Doctor / Professional Entity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Clínica Ocupacional ou Entidade Emissora
                  </label>
                  <input
                    type="text"
                    required
                    value={renewalForm.clinica_entidade}
                    onChange={(e) => setRenewalForm({ ...renewalForm, clinica_entidade: e.target.value })}
                    placeholder="Ex: Clínica MedSeg Ocupacional"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Médico Examinador ou Instrutor Responsável (CRM/CREA/MTE)
                  </label>
                  <input
                    type="text"
                    required
                    value={renewalForm.medico_responsavel}
                    onChange={(e) => setRenewalForm({ ...renewalForm, medico_responsavel: e.target.value })}
                    placeholder="Ex: Dr. Nome Sobrenome - CRM-DF 00000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Status and Document Upload Simulation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Status da Homologação Após Renovação
                  </label>
                  <select
                    value={renewalForm.status}
                    onChange={(e) => setRenewalForm({ ...renewalForm, status: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-800"
                  >
                    <option value="aprovado">✅ Aprovado / Homologado Imediatamente</option>
                    <option value="pendente">⏳ Em Auditoria pelo SESMT (Pendente)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Anexo do Novo Laudo / Certificado (PDF)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl truncate text-slate-600 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">{renewalForm.arquivo_nome}</span>
                    </div>
                    <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1">
                      <UploadCloud className="w-4 h-4 text-slate-500" />
                      <span>Substituir</span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setRenewalForm({ ...renewalForm, arquivo_nome: e.target.files[0].name });
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Observations / Medical Aptitude Note */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Parecer Técnico / Observações da Renovação
                </label>
                <textarea
                  rows={2}
                  value={renewalForm.observacao}
                  onChange={(e) => setRenewalForm({ ...renewalForm, observacao: e.target.value })}
                  placeholder="Ex: Apto sem restrições para trabalho em altura, eletricidade e esforço físico..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRenewalModalItem(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar e Registrar Renovação</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL DE PRÉ-VISUALIZAÇÃO DE LAUDO / CERTIFICADO ATUAL                   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {previewDocItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    Prontuário SST - {previewDocItem.colaborador.nome}
                  </h3>
                </div>
                <button onClick={() => setPreviewDocItem(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="my-4 space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Documento Legal</span>
                  <p className="font-bold text-slate-800 text-sm">{previewDocItem.documento.nome_documento}</p>
                  <p className="text-slate-500 mt-0.5">Norma Regulamentadora: {previewDocItem.documento.tipo_documento.toUpperCase()}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold">Emissão Atual</span>
                    <span className="font-bold text-slate-800">{previewDocItem.dataEmissaoFormatada}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold">Validade Atual</span>
                    <span className={`font-bold ${previewDocItem.urgencia === 'vencido' ? 'text-red-600' : 'text-rose-600'}`}>
                      {previewDocItem.dataValidadeFormatada} ({previewDocItem.urgencia === 'vencido' ? 'VENCIDO' : `${previewDocItem.diasRestantes} dias`})
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                  <span className="text-[10px] font-bold text-amber-800 block uppercase mb-0.5">Observação Registrada</span>
                  <p className="text-xs">{previewDocItem.documento.observacao || 'Nenhuma ressalva registrada.'}</p>
                </div>
              </div>

              <div className="flex justify-between gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setPreviewDocItem(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    const target = previewDocItem;
                    setPreviewDocItem(null);
                    handleOpenRenewalModal(target);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Abrir Renovação Deste Documento</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
