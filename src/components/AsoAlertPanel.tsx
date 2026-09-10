import React, { useState, useMemo } from 'react';
import { 
  HeartPulse, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  UserCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Search, 
  Filter, 
  Building2, 
  Mail, 
  Send, 
  Download, 
  ExternalLink, 
  Phone, 
  FileText, 
  Stethoscope, 
  HardHat, 
  Bell, 
  Check, 
  Sparkles,
  Info
} from 'lucide-react';
import { DocumentoColaborador, Colaborador, Obra, Notificacao } from '../types/erp';

interface AsoAlertPanelProps {
  documentos: DocumentoColaborador[];
  colaboradores?: Colaborador[];
  obras?: Obra[];
  onNavigate?: (tab: string) => void;
  onSendNotification?: (notif: { titulo: string; mensagem: string; obra_id?: number; obra_nome?: string }) => void;
}

export interface AsoItemDetail {
  doc: DocumentoColaborador;
  colaborador?: Colaborador;
  diasRestantes: number;
  urgencia: 'vencido' | 'urgente_7d' | 'atencao_15d' | 'preventivo_30d' | 'regular';
  dataValidadeFormatada: string;
  dataEmissaoFormatada: string;
  obraNome: string;
}

export const AsoAlertPanel: React.FC<AsoAlertPanelProps> = ({
  documentos,
  colaboradores = [],
  obras = [],
  onNavigate,
  onSendNotification
}) => {
  const [filterPeriod, setFilterPeriod] = useState<'30d' | '7d' | 'vencidos' | 'todos'>('30d');
  const [selectedObraId, setSelectedObraId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [scheduledModal, setScheduledModal] = useState<{ open: boolean; item?: AsoItemDetail | null }>({ open: false });
  const [agendamentoForm, setAgendamentoForm] = useState({
    clinica: 'Clínica Ocupacional MedSeg - Brasília',
    dataAgendada: '',
    tipoExame: 'Periódico Ocupacional (NR-7 + NR-35 / NR-18)',
    observacoes: 'Solicitar emissão de 2 vias do ASO com parecer de aptidão para trabalho em altura.'
  });
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Helper to calculate days to expiration
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

  // Filter ASO documents and compute rich metadata
  const asoList = useMemo<AsoItemDetail[]>(() => {
    // Filter documents where type is ASO or name contains ASO
    const rawAsos = documentos.filter(d => {
      const typeMatch = (d.tipo_documento || '').toLowerCase() === 'aso';
      const nameMatch = (d.nome_documento || '').toLowerCase().includes('aso') || 
                         (d.nome_documento || '').toLowerCase().includes('saúde ocupacional') ||
                         (d.nome_documento || '').toLowerCase().includes('atestado de saúde');
      return typeMatch || nameMatch;
    });

    return rawAsos.map(doc => {
      const diasRestantes = parseDaysRemaining(doc.data_validade);
      const colab = colaboradores.find(c => c.id === doc.colaborador_id || c.matricula === doc.colaborador_matricula);

      let urgencia: AsoItemDetail['urgencia'] = 'regular';
      if (diasRestantes < 0 || doc.status === 'vencido') {
        urgencia = 'vencido';
      } else if (diasRestantes <= 7) {
        urgencia = 'urgente_7d';
      } else if (diasRestantes <= 15) {
        urgencia = 'atencao_15d';
      } else if (diasRestantes <= 30) {
        urgencia = 'preventivo_30d';
      }

      return {
        doc,
        colaborador: colab,
        diasRestantes,
        urgencia,
        dataValidadeFormatada: formatDate(doc.data_validade),
        dataEmissaoFormatada: formatDate(doc.data_emissao),
        obraNome: doc.obra_nome || colab?.obra_nome || 'Canteiro Central'
      };
    }).sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [documentos, colaboradores]);

  // Filtered dataset
  const filteredAsos = useMemo(() => {
    return asoList.filter(item => {
      // Period filter
      if (filterPeriod === '30d' && (item.diasRestantes > 30 || item.diasRestantes < 0)) return false;
      if (filterPeriod === '7d' && (item.diasRestantes > 7 || item.diasRestantes < 0)) return false;
      if (filterPeriod === 'vencidos' && item.diasRestantes >= 0 && item.doc.status !== 'vencido') return false;

      // Obra filter
      if (selectedObraId !== 'all') {
        const targetObra = obras.find(o => String(o.id) === selectedObraId);
        if (targetObra && !item.obraNome.toLowerCase().includes(targetObra.nome.toLowerCase())) {
          return false;
        }
      }

      // Search term
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchName = (item.doc.colaborador_nome || '').toLowerCase().includes(term);
        const matchMat = (item.doc.colaborador_matricula || '').toLowerCase().includes(term);
        const matchDoc = (item.doc.nome_documento || '').toLowerCase().includes(term);
        const matchCargo = (item.colaborador?.cargo || '').toLowerCase().includes(term);
        if (!matchName && !matchMat && !matchDoc && !matchCargo) return false;
      }

      return true;
    });
  }, [asoList, filterPeriod, selectedObraId, searchTerm, obras]);

  // Summary counters
  const counters = useMemo(() => {
    const total = asoList.length;
    const vencer30d = asoList.filter(a => a.diasRestantes >= 0 && a.diasRestantes <= 30).length;
    const vencer7d = asoList.filter(a => a.diasRestantes >= 0 && a.diasRestantes <= 7).length;
    const vencidos = asoList.filter(a => a.diasRestantes < 0 || a.doc.status === 'vencido').length;
    const emDia = asoList.filter(a => a.diasRestantes > 30 && a.doc.status !== 'vencido').length;
    const taxaConformidade = total > 0 ? Math.round((emDia / total) * 100) : 100;

    return {
      total,
      vencer30d,
      vencer7d,
      vencidos,
      emDia,
      taxaConformidade
    };
  }, [asoList]);

  // Handlers for interactive actions
  const handleNotifySingle = (item: AsoItemDetail) => {
    const colabName = item.doc.colaborador_nome || 'Colaborador';
    const dias = item.diasRestantes;
    const msg = dias < 0 
      ? `🚨 URGENTE: O ASO de ${colabName} está VENCIDO há ${Math.abs(dias)} dias. Agendamento imediato de exame clínico necessário.`
      : `⚠️ ALERTA SESMT: O ASO de ${colabName} expira em ${dias} dias (${item.dataValidadeFormatada}). Agendar exame periódico.`;

    if (onSendNotification) {
      onSendNotification({
        titulo: `Aviso de ASO: ${colabName}`,
        mensagem: msg,
        obra_nome: item.obraNome
      });
    }

    setActionSuccessMsg(`Notificação enviada com sucesso para o SESMT e gestor de ${colabName}!`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleNotifyAllExpiring = () => {
    const totalNotificados = asoList.filter(a => a.diasRestantes <= 30).length;
    if (onSendNotification) {
      onSendNotification({
        titulo: `Disparo Global SESMT: ${totalNotificados} ASOs a vencer nos próximos 30 dias`,
        mensagem: `Alerta consolidado gerado pelo Painel de Conformidade de Segurança. Verificar agenda de exames periódicos PCMSO.`,
        obra_nome: 'Todos os Canteiros'
      });
    }
    setActionSuccessMsg(`Alerta consolidado disparado para ${totalNotificados} colaboradores e seus respectivos engenheiros residentes!`);
    setTimeout(() => setActionSuccessMsg(null), 4500);
  };

  const handleOpenAgendamento = (item: AsoItemDetail) => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 3);
    setAgendamentoForm(prev => ({
      ...prev,
      dataAgendada: nextWeek.toISOString().split('T')[0]
    }));
    setScheduledModal({ open: true, item });
  };

  const handleConfirmAgendamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledModal.item) return;

    const colabName = scheduledModal.item.doc.colaborador_nome || 'Colaborador';
    if (onSendNotification) {
      onSendNotification({
        titulo: `Exame Ocupacional Agendado: ${colabName}`,
        mensagem: `Exame periódico (${agendamentoForm.tipoExame}) agendado para ${formatDate(agendamentoForm.dataAgendada)} na clínica ${agendamentoForm.clinica}. Guia de encaminhamento gerada.`,
        obra_nome: scheduledModal.item.obraNome
      });
    }

    setActionSuccessMsg(`Exame de ${colabName} agendado para ${formatDate(agendamentoForm.dataAgendada)} na ${agendamentoForm.clinica}!`);
    setScheduledModal({ open: false, item: null });
    setTimeout(() => setActionSuccessMsg(null), 4500);
  };

  const handleExportCSV = () => {
    const headers = ["Colaborador", "Matrícula", "Cargo", "Obra", "Data_Emissao", "Data_Validade", "Dias_Restantes", "Status_Alerta"];
    const rows = asoList.map(item => [
      `"${item.doc.colaborador_nome || ''}"`,
      `"${item.doc.colaborador_matricula || ''}"`,
      `"${item.colaborador?.cargo || ''}"`,
      `"${item.obraNome}"`,
      `"${item.dataEmissaoFormatada}"`,
      `"${item.dataValidadeFormatada}"`,
      item.diasRestantes,
      `"${item.urgencia.toUpperCase()}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_asos_pcmso_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActionSuccessMsg("Relatório de ASOs do SESMT exportado com sucesso em CSV!");
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  return (
    <div 
      id="panel-alertas-aso"
      className="bg-white rounded-lg border border-amber-300/80 shadow-xs overflow-hidden transition-all animate-fadeIn"
    >
      {/* Toast de feedback rápido */}
      {actionSuccessMsg && (
        <div className="bg-emerald-800 text-white px-3 py-1.5 text-[8px] font-bold flex items-center justify-between gap-2 animate-fadeIn border-b border-emerald-900">
          <div className="flex items-center gap-1.5">
            <Check className="w-3 h-3 text-emerald-300" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button 
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-300 hover:text-white text-[7.5px] cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. CABEÇALHO DO PAINEL DE AVISOS DE ASO                                    */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-950 to-slate-900 text-white px-3 py-2 sm:px-4 sm:py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-amber-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs ring-2 ring-amber-300/40">
            <HeartPulse className="w-4 h-4 text-slate-950 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-extrabold text-[12px] sm:text-[13px] text-white tracking-tight leading-tight flex items-center gap-1.5">
                <span>Painel de Avisos: ASOs a Vencer nos Próximos 30 Dias</span>
              </h3>
              <span className="text-[7.5px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-400/40 flex items-center gap-1">
                <Stethoscope className="w-2.5 h-2.5 text-amber-300" />
                <span>NR-7 / PCMSO & Aptidão Ocupacional</span>
              </span>
              {counters.vencer30d > 0 && (
                <span className="text-[7px] font-black bg-red-600 text-white px-1.5 py-0.2 rounded-full uppercase tracking-tight animate-pulse">
                  {counters.vencer30d} {counters.vencer30d === 1 ? 'Colaborador em Alerta' : 'Colaboradores em Alerta'}
                </span>
              )}
            </div>
            <p className="text-[7.5px] sm:text-[8px] text-amber-200/80 truncate mt-0.5">
              Monitoramento preventivo de exames médicos periódicos e liberação de aptidão para trabalho em altura (NR-35) e canteiros.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          <button
            id="btn-aso-notificar-todos"
            onClick={handleNotifyAllExpiring}
            className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-[8px] flex items-center gap-1 shadow-2xs transition-all cursor-pointer border border-amber-400"
            title="Disparar notificações automáticas para todos os gestores e colaboradores"
          >
            <Send className="w-2.5 h-2.5 text-slate-950" />
            <span>Notificar Todos ({counters.vencer30d + counters.vencidos})</span>
          </button>

          <button
            id="btn-aso-exportar-csv"
            onClick={handleExportCSV}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-200 hover:text-white font-bold rounded text-[8px] flex items-center gap-1 shadow-2xs border border-slate-700 transition-all cursor-pointer"
            title="Baixar planilha CSV com o status de todos os ASOs"
          >
            <Download className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">Relatório SESMT</span>
          </button>

          {onNavigate && (
            <button
              id="btn-aso-ir-documentos"
              onClick={() => onNavigate('documentos')}
              className="px-2 py-1 bg-slate-800/90 hover:bg-slate-700 text-white font-bold rounded text-[8px] flex items-center gap-1 shadow-2xs border border-slate-700 transition-all cursor-pointer"
              title="Abrir módulo de Documentos e Certificados"
            >
              <span>Auditoria NR</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STATS KPI MINI-STRIP                                                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-2 bg-amber-50/70 border-b border-amber-200 text-[8px]">
        
        {/* KPI 1: A vencer em 30 dias */}
        <div className="bg-white p-1.5 rounded border border-amber-300 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[7px] font-bold text-amber-800 uppercase block">A Vencer (≤ 30d)</span>
            <span className="text-[13px] font-black text-amber-900 leading-none">{counters.vencer30d}</span>
          </div>
          <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-3 h-3" />
          </div>
        </div>

        {/* KPI 2: Críticos em 7 dias */}
        <div className="bg-white p-1.5 rounded border border-red-300 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[7px] font-bold text-red-800 uppercase block">Crítico (≤ 7d)</span>
            <span className="text-[13px] font-black text-red-700 leading-none">{counters.vencer7d}</span>
          </div>
          <div className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold">
            <ShieldAlert className="w-3 h-3 animate-pulse" />
          </div>
        </div>

        {/* KPI 3: Vencidos / Inaptos */}
        <div className="bg-white p-1.5 rounded border border-red-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[7px] font-bold text-red-900 uppercase block">ASOs Vencidos</span>
            <span className="text-[13px] font-black text-red-800 leading-none">{counters.vencidos}</span>
          </div>
          <div className="w-5 h-5 rounded-full bg-red-100 text-red-800 flex items-center justify-center font-bold">
            <XCircle className="w-3 h-3" />
          </div>
        </div>

        {/* KPI 4: Em dia */}
        <div className="bg-white p-1.5 rounded border border-emerald-300 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[7px] font-bold text-emerald-800 uppercase block">ASOs Em Dia</span>
            <span className="text-[13px] font-black text-emerald-800 leading-none">{counters.emDia}</span>
          </div>
          <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-3 h-3" />
          </div>
        </div>

        {/* KPI 5: Conformidade PCMSO */}
        <div className="col-span-2 sm:col-span-1 bg-white p-1.5 rounded border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[7px] font-bold text-slate-600 uppercase block">Conformidade NR-7</span>
            <span className={`text-[13px] font-black leading-none ${counters.taxaConformidade >= 85 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {counters.taxaConformidade}%
            </span>
          </div>
          <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[8px]">
            {counters.total}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. FILTROS & BARRA DE PESQUISA                                            */}
      {/* ========================================================================= */}
      <div className="p-2 sm:p-2.5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 text-[8px]">
        
        {/* Period Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          <button
            id="tab-aso-filter-30d"
            onClick={() => setFilterPeriod('30d')}
            className={`px-2 py-1 rounded font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              filterPeriod === '30d'
                ? 'bg-amber-600 text-slate-950 shadow-2xs font-extrabold'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-2.5 h-2.5" />
            <span>Próximos 30 Dias ({counters.vencer30d})</span>
          </button>

          <button
            id="tab-aso-filter-7d"
            onClick={() => setFilterPeriod('7d')}
            className={`px-2 py-1 rounded font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              filterPeriod === '7d'
                ? 'bg-red-700 text-white shadow-2xs font-extrabold'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-2.5 h-2.5 text-red-500" />
            <span>Críticos ≤ 7 Dias ({counters.vencer7d})</span>
          </button>

          <button
            id="tab-aso-filter-vencidos"
            onClick={() => setFilterPeriod('vencidos')}
            className={`px-2 py-1 rounded font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              filterPeriod === 'vencidos'
                ? 'bg-red-950 text-white shadow-2xs font-extrabold'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <XCircle className="w-2.5 h-2.5 text-red-400" />
            <span>Vencidos ({counters.vencidos})</span>
          </button>

          <button
            id="tab-aso-filter-todos"
            onClick={() => setFilterPeriod('todos')}
            className={`px-2 py-1 rounded font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              filterPeriod === 'todos'
                ? 'bg-slate-900 text-white shadow-2xs font-extrabold'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Todos os ASOs ({counters.total})</span>
          </button>
        </div>

        {/* Obra Filter & Search Input */}
        <div className="flex items-center gap-1.5 flex-1 md:max-w-md justify-end">
          {/* Obra Select */}
          <div className="flex items-center gap-1 bg-white border border-slate-300 px-1.5 py-0.5 rounded text-[7.5px] shrink-0">
            <Building2 className="w-2.5 h-2.5 text-slate-500" />
            <select
              value={selectedObraId}
              onChange={(e) => setSelectedObraId(e.target.value)}
              aria-label="Filtrar por obra no painel de ASO"
              className="bg-transparent text-slate-800 font-semibold text-[7.5px] focus:outline-hidden cursor-pointer max-w-[110px] truncate"
            >
              <option value="all">Todas as Obras</option>
              {obras.map(o => (
                <option key={o.id} value={String(o.id)}>{o.nome}</option>
              ))}
            </select>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-2.5 h-2.5 text-slate-400 absolute left-1.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar colaborador, matrícula ou cargo..."
              className="w-full pl-5 pr-2 py-0.5 bg-white border border-slate-300 rounded text-[7.5px] text-slate-800 focus:outline-hidden focus:border-amber-500"
            />
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. CARDS DE COLABORADORES COM ASO A VENCER / EM ALERTA                    */}
      {/* ========================================================================= */}
      <div className="p-2.5 sm:p-3">
        {filteredAsos.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1.5 opacity-80" />
            <h4 className="text-[10px] font-bold text-slate-800">Nenhum ASO em Alerta Crítico no Filtro Selecionado</h4>
            <p className="text-[8px] text-slate-500 mt-0.5 max-w-sm mx-auto">
              Todos os colaboradores avaliados estão em conformidade com o cronograma médico do PCMSO ou não correspondem aos critérios de busca.
            </p>
            <button
              onClick={() => { setFilterPeriod('todos'); setSearchTerm(''); setSelectedObraId('all'); }}
              className="mt-2 px-2.5 py-1 bg-slate-900 text-white rounded text-[7.5px] font-bold hover:bg-slate-800 cursor-pointer"
            >
              Exibir Todos os Documentos de ASO
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filteredAsos.map((item) => {
              const colab = item.colaborador;
              const dias = item.diasRestantes;
              const isVencido = dias < 0 || item.doc.status === 'vencido';
              const isUrgente7 = dias >= 0 && dias <= 7;
              const isAtencao15 = dias > 7 && dias <= 15;
              const isPreventivo30 = dias > 15 && dias <= 30;

              return (
                <div
                  key={item.doc.id}
                  className={`rounded-lg p-2.5 border transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs ${
                    isVencido 
                      ? 'bg-red-50/90 border-red-300 ring-1 ring-red-200' 
                      : isUrgente7
                      ? 'bg-amber-50/90 border-amber-300 ring-1 ring-amber-200'
                      : isAtencao15
                      ? 'bg-orange-50/70 border-orange-200'
                      : isPreventivo30
                      ? 'bg-amber-50/40 border-amber-200/80'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Top Bar: Urgência e Contagem Regressiva */}
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className={`px-1.5 py-0.2 rounded text-[7px] font-black uppercase flex items-center gap-1 ${
                        isVencido 
                          ? 'bg-red-700 text-white' 
                          : isUrgente7
                          ? 'bg-red-600 text-white animate-pulse'
                          : isAtencao15
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : isPreventivo30
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isVencido && <XCircle className="w-2.5 h-2.5" />}
                        {(isUrgente7 || isAtencao15) && <AlertTriangle className="w-2.5 h-2.5" />}
                        {isPreventivo30 && <Clock className="w-2.5 h-2.5" />}
                        {!isVencido && !isUrgente7 && !isAtencao15 && !isPreventivo30 && <CheckCircle2 className="w-2.5 h-2.5" />}
                        <span>
                          {isVencido 
                            ? `Vencido há ${Math.abs(dias)} dias` 
                            : dias === 0 
                            ? 'Vence Hoje!' 
                            : `Expira em ${dias} dias`}
                        </span>
                      </span>

                      <span className="text-[7px] text-slate-500 font-mono font-bold bg-white px-1 py-0.2 rounded border border-slate-200">
                        {item.doc.colaborador_matricula || 'MAT-000'}
                      </span>
                    </div>

                    {/* Colaborador Info */}
                    <div className="flex items-start gap-2 mb-1.5">
                      {colab?.foto ? (
                        <img 
                          src={colab.foto} 
                          alt={item.doc.colaborador_nome || 'Colaborador'} 
                          className="w-8 h-8 rounded-full object-cover border border-slate-300 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0 border border-slate-300">
                          {(item.doc.colaborador_nome || 'C')[0]}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-[10px] text-slate-900 leading-tight truncate">
                          {item.doc.colaborador_nome || 'Colaborador Sem Nome'}
                        </h4>
                        <div className="flex items-center gap-1 text-[7.5px] text-slate-600 mt-0.5 flex-wrap">
                          <span className="font-semibold text-slate-800">{colab?.cargo || 'Colaborador Operacional'}</span>
                          <span>·</span>
                          <span className="truncate max-w-[130px] text-slate-500">{item.obraNome}</span>
                        </div>
                      </div>
                    </div>

                    {/* Document & Validity Details */}
                    <div className="bg-white/90 p-1.5 rounded border border-slate-200/80 space-y-1 text-[7.5px] mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Documento:</span>
                        <span className="font-semibold text-slate-800 truncate max-w-[140px]" title={item.doc.nome_documento}>
                          {item.doc.nome_documento}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Data de Validade:</span>
                        <span className={`font-mono font-bold ${isVencido ? 'text-red-700' : 'text-slate-900'}`}>
                          {item.dataValidadeFormatada}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[7px] text-slate-500 pt-0.5 border-t border-slate-100">
                        <span>Emissão Anterior:</span>
                        <span className="font-mono">{item.dataEmissaoFormatada}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 pt-1.5 border-t border-slate-200/80">
                    <button
                      id={`btn-aso-notificar-${item.doc.id}`}
                      onClick={() => handleNotifySingle(item)}
                      className="flex-1 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded text-[7.5px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                      title="Enviar alerta para o colaborador e gestor da obra"
                    >
                      <Bell className="w-2.5 h-2.5 text-amber-700" />
                      <span>Notificar</span>
                    </button>

                    <button
                      id={`btn-aso-agendar-${item.doc.id}`}
                      onClick={() => handleOpenAgendamento(item)}
                      className="flex-1 py-1 bg-amber-600 hover:bg-amber-700 text-slate-950 font-extrabold rounded text-[7.5px] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs border border-amber-500"
                      title="Agendar exame clínico periódico com clínica credenciada"
                    >
                      <Calendar className="w-2.5 h-2.5 text-slate-950" />
                      <span>Agendar Exame</span>
                    </button>

                    {onNavigate && (
                      <button
                        id={`btn-aso-ver-doc-${item.doc.id}`}
                        onClick={() => onNavigate('documentos')}
                        className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[7.5px] border border-slate-300 transition-all cursor-pointer shrink-0"
                        title="Ver ficha documental"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL DE AGENDAMENTO DE EXAME PERIÓDICO OCUPACIONAL                      */}
      {/* ========================================================================= */}
      {scheduledModal.open && scheduledModal.item && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden animate-scaleUp">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-800 to-slate-900 text-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Stethoscope className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-[11px] text-white">Agendamento de Exame Ocupacional (ASO)</h4>
                  <span className="text-[7.5px] text-amber-200">Emissão de Guia de Encaminhamento Médico</span>
                </div>
              </div>
              <button
                onClick={() => setScheduledModal({ open: false, item: null })}
                className="text-amber-200 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmAgendamento} className="p-3.5 space-y-2.5 text-[8.5px]">
              
              {/* Target Colaborador Banner */}
              <div className="bg-amber-50 p-2 rounded border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[7px] text-amber-800 font-bold uppercase block">Colaborador Selecionado:</span>
                  <strong className="text-[9.5px] text-slate-900">{scheduledModal.item.doc.colaborador_nome}</strong>
                  <div className="text-[7.5px] text-slate-600">
                    {scheduledModal.item.colaborador?.cargo} · {scheduledModal.item.obraNome}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[7px] text-slate-500 block">Validade Atual:</span>
                  <span className="font-mono font-bold text-red-700 text-[9px]">
                    {scheduledModal.item.dataValidadeFormatada}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-0.5">Clínica Credenciada do Trabalho:</label>
                <input
                  type="text"
                  value={agendamentoForm.clinica}
                  onChange={(e) => setAgendamentoForm({ ...agendamentoForm, clinica: e.target.value })}
                  required
                  className="w-full p-1.5 border border-slate-300 rounded text-[8px] bg-slate-50 text-slate-900 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">Data do Exame Clínico:</label>
                  <input
                    type="date"
                    value={agendamentoForm.dataAgendada}
                    onChange={(e) => setAgendamentoForm({ ...agendamentoForm, dataAgendada: e.target.value })}
                    required
                    className="w-full p-1.5 border border-slate-300 rounded text-[8px] text-slate-900 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">Modalidade do Exame:</label>
                  <select
                    value={agendamentoForm.tipoExame}
                    onChange={(e) => setAgendamentoForm({ ...agendamentoForm, tipoExame: e.target.value })}
                    className="w-full p-1.5 border border-slate-300 rounded text-[8px] text-slate-900 focus:outline-hidden focus:border-amber-500"
                  >
                    <option value="Periódico Ocupacional (NR-7 + NR-35 / NR-18)">Periódico Ocupacional (NR-7 / NR-35)</option>
                    <option value="Retorno ao Trabalho">Retorno ao Trabalho</option>
                    <option value="Mudança de Risco Ocupacional">Mudança de Risco Ocupacional</option>
                    <option value="Exame Complementar de Altura (ECG/EEG)">Exame Complementar (ECG/EEG)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-0.5">Observações e Recomendações:</label>
                <textarea
                  value={agendamentoForm.observacoes}
                  onChange={(e) => setAgendamentoForm({ ...agendamentoForm, observacoes: e.target.value })}
                  rows={2}
                  className="w-full p-1.5 border border-slate-300 rounded text-[8px] text-slate-900 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setScheduledModal({ open: false, item: null })}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[8px] font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-slate-950 rounded text-[8px] font-extrabold flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Check className="w-3 h-3" />
                  <span>Confirmar & Emitir Guia</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
