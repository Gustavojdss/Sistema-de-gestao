import React, { useState, useMemo } from 'react';
import { 
  CalendarCheck, 
  Clock, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  Building2, 
  UserCheck, 
  MapPin, 
  Layers, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  ChevronRight, 
  Eye, 
  CheckSquare, 
  Bell, 
  Calendar, 
  Sparkles, 
  FileSpreadsheet, 
  ArrowUpRight, 
  Filter, 
  List, 
  LayoutGrid, 
  CalendarDays, 
  Check, 
  X,
  Share2,
  HardHat,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Vistoria, Obra } from '../types/erp';

interface InspectionTimelineWidgetProps {
  vistorias: Vistoria[];
  obras?: Obra[];
  onNavigate?: (tab: string) => void;
  onOpenNovaVistoria?: () => void;
  onConcluirVistoria?: (vistoria: Vistoria, dadosExecucao?: Partial<Vistoria>) => void;
  onSendNotification?: (notif: { titulo: string; mensagem: string; obra_id?: number; obra_nome?: string }) => void;
}

export interface TimelineGroup {
  id: string;
  title: string;
  subtitle: string;
  badgeColor: string;
  icon: any;
  items: TimelineItem[];
}

export interface TimelineItem {
  vistoria: Vistoria;
  dateObj: Date;
  daysDiff: number;
  timeStr: string;
  dateStrFormatted: string;
  relativeLabel: string;
  urgencyLevel: 'hoje' | 'amanha' | 'semana' | 'quinzena' | 'futuro' | 'atrasado' | 'concluido';
  prioridadeEfetiva: 'urgente' | 'alta' | 'media' | 'baixa';
  taxaConformidade?: number | null;
}

export const InspectionTimelineWidget: React.FC<InspectionTimelineWidgetProps> = ({
  vistorias = [],
  obras = [],
  onNavigate,
  onOpenNovaVistoria,
  onConcluirVistoria,
  onSendNotification
}) => {
  const [selectedObraId, setSelectedObraId] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [statusTab, setStatusTab] = useState<'todas' | 'pendentes' | 'urgentes' | 'realizadas'>('todas');
  const [prazoFilter, setPrazoFilter] = useState<'todos' | 'hoje_amanha' | 'hoje' | 'amanha' | 'semana'>('todos');
  const [viewMode, setViewMode] = useState<'timeline' | 'cards' | 'agenda'>('timeline');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [detailItem, setDetailItem] = useState<Vistoria | null>(null);
  const [executeModalItem, setExecuteModalItem] = useState<Vistoria | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Execution Form State
  const [execData, setExecData] = useState({
    itensConformes: 15,
    totalItens: 15,
    observacoes: '',
    naoConformidades: ''
  });

  // Calculate now reference
  const now = useMemo(() => new Date(), []);

  // Helper to parse date string into valid Date object
  const parseVistoriaDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    // Handle 'YYYY-MM-DD HH:mm:ss' or 'YYYY-MM-DD'
    const normalized = dateStr.replace(' ', 'T');
    const parsed = new Date(normalized);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  // Process and sort all vistorias with chronological & urgency metadata
  const processedItems = useMemo<TimelineItem[]>(() => {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return vistorias.map(v => {
      const dateObj = parseVistoriaDate(v.data_agendada || v.data_vistoria || v.created_at);
      const itemDateOnly = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
      
      const diffMs = itemDateOnly.getTime() - todayStart.getTime();
      const daysDiff = Math.round(diffMs / (1000 * 60 * 60 * 24));

      // Extract time
      let timeStr = '09:00';
      if (v.data_agendada && v.data_agendada.includes(' ')) {
        timeStr = v.data_agendada.split(' ')[1].substring(0, 5);
      } else if (v.data_agendada && v.data_agendada.includes('T')) {
        timeStr = v.data_agendada.split('T')[1].substring(0, 5);
      }

      // Format date in PT-BR
      const dateStrFormatted = dateObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      // Compute status & relative label
      const isConcluded = v.status === 'realizada' || v.status === 'concluida';
      let urgencyLevel: TimelineItem['urgencyLevel'] = 'futuro';
      let relativeLabel = '';

      if (isConcluded) {
        urgencyLevel = 'concluido';
        relativeLabel = `Realizada (${dateStrFormatted})`;
      } else if (daysDiff < 0) {
        urgencyLevel = 'atrasado';
        relativeLabel = `Atrasada (${Math.abs(daysDiff)} ${Math.abs(daysDiff) === 1 ? 'dia' : 'dias'})`;
      } else if (daysDiff === 0) {
        urgencyLevel = 'hoje';
        relativeLabel = `Hoje às ${timeStr}`;
      } else if (daysDiff === 1) {
        urgencyLevel = 'amanha';
        relativeLabel = `Amanhã às ${timeStr}`;
      } else if (daysDiff <= 7) {
        urgencyLevel = 'semana';
        relativeLabel = `Em ${daysDiff} dias (${dateObj.toLocaleDateString('pt-BR', { weekday: 'short' })})`;
      } else if (daysDiff <= 15) {
        urgencyLevel = 'quinzena';
        relativeLabel = `Em ${daysDiff} dias`;
      } else {
        urgencyLevel = 'futuro';
        relativeLabel = `Em ${daysDiff} dias`;
      }

      // Priority inference if not set
      let prioridadeEfetiva: TimelineItem['prioridadeEfetiva'] = v.prioridade || 'media';
      if (!v.prioridade) {
        const textToAnalyze = `${v.titulo} ${v.tipo} ${v.descricao}`.toLowerCase();
        if (textToAnalyze.includes('urgente') || textToAnalyze.includes('nr-35') || textToAnalyze.includes('concretagem') || textToAnalyze.includes('bombeiro') || textToAnalyze.includes('linha de vida')) {
          prioridadeEfetiva = 'urgente';
        } else if (textToAnalyze.includes('nr-18') || textToAnalyze.includes('nr-10') || textToAnalyze.includes('elétrica') || textToAnalyze.includes('impermeabiliz')) {
          prioridadeEfetiva = 'alta';
        } else if (textToAnalyze.includes('acabamento') || textToAnalyze.includes('alvenaria') || textToAnalyze.includes('qualidade')) {
          prioridadeEfetiva = 'media';
        } else {
          prioridadeEfetiva = 'baixa';
        }
      }

      // Taxa de conformidade
      let taxaConformidade: number | null = null;
      if (v.total_itens && v.total_itens > 0 && v.itens_conformes !== undefined) {
        taxaConformidade = Math.round((v.itens_conformes / v.total_itens) * 100);
      }

      return {
        vistoria: v,
        dateObj,
        daysDiff,
        timeStr,
        dateStrFormatted,
        relativeLabel,
        urgencyLevel,
        prioridadeEfetiva,
        taxaConformidade
      };
    }).sort((a, b) => {
      // Sort: Pendentes first ordered by date ascending, then Concluídas
      const aDone = a.vistoria.status === 'realizada' || a.vistoria.status === 'concluida';
      const bDone = b.vistoria.status === 'realizada' || b.vistoria.status === 'concluida';
      if (!aDone && bDone) return -1;
      if (aDone && !bDone) return 1;
      return a.dateObj.getTime() - b.dateObj.getTime();
    });
  }, [vistorias, now]);

  // Filtered items based on user inputs
  const filteredItems = useMemo(() => {
    return processedItems.filter(item => {
      const v = item.vistoria;
      
      // Obra filter
      if (selectedObraId !== 'all' && String(v.obra_id) !== selectedObraId) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'all' && item.prioridadeEfetiva !== selectedPriority) {
        return false;
      }

      // Prazo Filter (Hoje / Amanhã / Hoje & Amanhã / Semana)
      if (prazoFilter === 'hoje_amanha') {
        const isHojeOuAmanha = item.daysDiff === 0 || item.daysDiff === 1;
        if (!isHojeOuAmanha) return false;
      } else if (prazoFilter === 'hoje') {
        if (item.daysDiff !== 0) return false;
      } else if (prazoFilter === 'amanha') {
        if (item.daysDiff !== 1) return false;
      } else if (prazoFilter === 'semana') {
        if (item.daysDiff < 0 || item.daysDiff > 7) return false;
      }

      // Status Tab filter
      const isConcluded = v.status === 'realizada' || v.status === 'concluida';
      if (statusTab === 'pendentes' && isConcluded) return false;
      if (statusTab === 'realizadas' && !isConcluded) return false;
      if (statusTab === 'urgentes' && (item.prioridadeEfetiva !== 'urgente' || isConcluded)) return false;

      // Search term
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchTitle = v.titulo.toLowerCase().includes(term);
        const matchObra = (v.obra_nome || '').toLowerCase().includes(term);
        const matchTipo = (v.tipo || '').toLowerCase().includes(term);
        const matchResp = (v.responsavel_nome || v.created_by_nome || '').toLowerCase().includes(term);
        const matchLocal = (v.local_inspecao || '').toLowerCase().includes(term);
        const matchEtapa = (v.etapa_obra || '').toLowerCase().includes(term);
        if (!matchTitle && !matchObra && !matchTipo && !matchResp && !matchLocal && !matchEtapa) {
          return false;
        }
      }

      return true;
    });
  }, [processedItems, selectedObraId, selectedPriority, prazoFilter, statusTab, searchTerm]);

  // Group items into timeline phases
  const timelineGroups = useMemo<TimelineGroup[]>(() => {
    const grupos: TimelineGroup[] = [
      {
        id: 'hoje_atrasadas',
        title: 'Hoje & Críticas Imediatas',
        subtitle: 'Vistorias com execução prevista para a data de hoje ou com agendamento prioritário',
        badgeColor: 'bg-red-600 text-white',
        icon: AlertOctagon,
        items: []
      },
      {
        id: 'esta_semana',
        title: 'Amanhã & Esta Semana (Próximos 7 Dias)',
        subtitle: 'Auditorias de segurança, frentes de concretagem e testes de engenharia',
        badgeColor: 'bg-amber-500 text-slate-950 font-black',
        icon: Clock,
        items: []
      },
      {
        id: 'proximos_15_dias',
        title: 'Próximas Semanas (8 a 30 Dias)',
        subtitle: 'Vistorias intermediárias, bombeiros (PPCI) e checagem de instalações',
        badgeColor: 'bg-blue-600 text-white',
        icon: CalendarDays,
        items: []
      },
      {
        id: 'concluidas_recentes',
        title: 'Vistorias Realizadas & Histórico de Conformidade',
        subtitle: 'Inspeções já executadas com emissão de laudo e auditoria de não-conformidades',
        badgeColor: 'bg-emerald-600 text-white',
        icon: CheckCircle2,
        items: []
      }
    ];

    filteredItems.forEach(item => {
      const isConcluded = item.vistoria.status === 'realizada' || item.vistoria.status === 'concluida';
      if (isConcluded) {
        grupos[3].items.push(item);
      } else if (item.daysDiff <= 0) {
        grupos[0].items.push(item);
      } else if (item.daysDiff <= 7) {
        grupos[1].items.push(item);
      } else {
        grupos[2].items.push(item);
      }
    });

    return grupos.filter(g => g.items.length > 0);
  }, [filteredItems]);

  // Overall statistics summary
  const stats = useMemo(() => {
    const total = processedItems.length;
    const pendentes = processedItems.filter(i => i.vistoria.status !== 'realizada' && i.vistoria.status !== 'concluida').length;
    const concluidas = processedItems.filter(i => i.vistoria.status === 'realizada' || i.vistoria.status === 'concluida').length;
    const urgentes = processedItems.filter(i => i.prioridadeEfetiva === 'urgente' && i.vistoria.status !== 'realizada' && i.vistoria.status !== 'concluida').length;
    const hojeCount = processedItems.filter(i => i.daysDiff === 0 && i.vistoria.status !== 'realizada' && i.vistoria.status !== 'concluida').length;
    const amanhaCount = processedItems.filter(i => i.daysDiff === 1 && i.vistoria.status !== 'realizada' && i.vistoria.status !== 'concluida').length;
    const hojeAmanhaCount = processedItems.filter(i => (i.daysDiff === 0 || i.daysDiff === 1) && i.vistoria.status !== 'realizada' && i.vistoria.status !== 'concluida').length;
    const proximos7Dias = processedItems.filter(i => i.daysDiff >= 0 && i.daysDiff <= 7 && i.vistoria.status !== 'realizada' && i.vistoria.status !== 'concluida').length;

    return { total, pendentes, concluidas, urgentes, hojeCount, amanhaCount, hojeAmanhaCount, proximos7Dias };
  }, [processedItems]);

  // Open execute modal
  const handleOpenExecute = (v: Vistoria) => {
    setExecuteModalItem(v);
    setExecData({
      itensConformes: v.itens_conformes || 15,
      totalItens: v.total_itens || 15,
      observacoes: v.observacoes || 'Inspeção realizada com sucesso conforme normas técnicas e padrões do canteiro.',
      naoConformidades: v.nao_conformidades || ''
    });
  };

  // Submit execution
  const handleConfirmExecution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!executeModalItem) return;

    const updatedVistoria: Vistoria = {
      ...executeModalItem,
      status: 'realizada',
      realizada_em: new Date().toISOString().replace('T', ' ').substring(0, 19),
      itens_conformes: execData.itensConformes,
      total_itens: execData.totalItens,
      observacoes: execData.observacoes,
      nao_conformidades: execData.naoConformidades || undefined
    };

    if (onConcluirVistoria) {
      onConcluirVistoria(executeModalItem, updatedVistoria);
    }

    if (onSendNotification) {
      onSendNotification({
        titulo: `Vistoria Concluída: ${executeModalItem.titulo}`,
        mensagem: `A vistoria técnica foi executada em ${executeModalItem.obra_nome}. Conformidade: ${Math.round((execData.itensConformes / execData.totalItens) * 100)}%`,
        obra_id: executeModalItem.obra_id,
        obra_nome: executeModalItem.obra_nome
      });
    }

    setToastMessage(`✓ Vistoria "${executeModalItem.titulo}" registrada como REALIZADA com sucesso!`);
    setExecuteModalItem(null);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Quick reminder dispatcher
  const handleNotifyAuditor = (item: TimelineItem) => {
    const v = item.vistoria;
    if (onSendNotification) {
      onSendNotification({
        titulo: `Lembrete de Vistoria: ${v.titulo}`,
        mensagem: `Agendada para ${item.relativeLabel} em ${v.obra_nome}. Responsável: ${v.responsavel_nome || 'Engenharia'}`,
        obra_id: v.obra_id,
        obra_nome: v.obra_nome
      });
    }
    setToastMessage(`🔔 Lembrete enviado para o responsável técnico da vistoria!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Export timeline to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Data Agendada', 'Obra', 'Titulo', 'Tipo', 'Local', 'Prioridade', 'Status', 'Responsavel'];
    const rows = filteredItems.map(item => [
      item.vistoria.id,
      item.vistoria.data_agendada,
      `"${item.vistoria.obra_nome}"`,
      `"${item.vistoria.titulo}"`,
      `"${item.vistoria.tipo || ''}"`,
      `"${item.vistoria.local_inspecao || ''}"`,
      item.prioridadeEfetiva,
      item.vistoria.status,
      `"${item.vistoria.responsavel_nome || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cronograma_vistorias_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage('Relatório de cronograma de vistorias exportado em CSV!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Render Priority Badge
  const renderPriorityBadge = (prioridade: TimelineItem['prioridadeEfetiva'], isConcluded = false) => {
    if (isConcluded) {
      return (
        <span className="px-1.5 py-0.2 rounded text-[7px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase">
          {prioridade}
        </span>
      );
    }

    switch (prioridade) {
      case 'urgente':
        return (
          <span className="px-1.5 py-0.2 rounded text-[7px] font-black bg-red-600 text-white uppercase flex items-center gap-1 shadow-2xs animate-pulse ring-1 ring-red-400">
            <Zap className="w-2 h-2 text-amber-300" />
            <span>Urgência Crítica</span>
          </span>
        );
      case 'alta':
        return (
          <span className="px-1.5 py-0.2 rounded text-[7px] font-extrabold bg-amber-500 text-slate-950 uppercase flex items-center gap-1 shadow-2xs">
            <AlertTriangle className="w-2 h-2 text-slate-950" />
            <span>Alta Prioridade</span>
          </span>
        );
      case 'media':
        return (
          <span className="px-1.5 py-0.2 rounded text-[7px] font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase">
            Média Prioridade
          </span>
        );
      case 'baixa':
      default:
        return (
          <span className="px-1.5 py-0.2 rounded text-[7px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
            Rotina / Padrão
          </span>
        );
    }
  };

  return (
    <div 
      id="section-timeline-vistorias" 
      className="bg-white rounded-lg border border-slate-200/90 shadow-xs overflow-hidden transition-all animate-fadeIn"
    >
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="bg-slate-900 text-white px-3 py-1.5 text-[8px] font-bold flex items-center justify-between gap-2 animate-fadeIn border-b border-blue-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-blue-400 animate-spin" />
            <span className="text-blue-100">{toastMessage}</span>
          </div>
          <button 
            onClick={() => setToastMessage(null)} 
            className="text-slate-400 hover:text-white text-[7.5px] cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. CABEÇALHO DO CRONOGRAMA & LINHA DO TEMPO                               */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-red-950 text-white px-3 py-2 sm:px-4 sm:py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800">
        
        {/* Title & Description */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-red-700 text-white flex items-center justify-center shrink-0 shadow-xs ring-2 ring-red-400/30">
            <CalendarCheck className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-extrabold text-[12px] sm:text-[13px] text-white tracking-tight leading-tight flex items-center gap-1.5">
                <span>Linha do Tempo de Vistorias & Auditorias Técnicas</span>
              </h3>
              <span className="text-[7.5px] font-bold bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded border border-blue-500/40 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-blue-400" />
                <span>Cronograma de Campo</span>
              </span>
              {stats.urgentes > 0 && (
                <span className="text-[7px] font-black bg-red-600 text-white px-1.5 py-0.2 rounded-full uppercase tracking-tight animate-pulse">
                  {stats.urgentes} {stats.urgentes === 1 ? 'Crítica Pendente' : 'Críticas Pendentes'}
                </span>
              )}
            </div>
            <p className="text-[7.5px] sm:text-[8px] text-slate-300/80 truncate mt-0.5">
              Acompanhamento cronológico de liberações estruturais, ensaios de segurança (NR-18/NR-35) e auditorias de canteiro.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          
          {/* View Mode Switch */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded border border-slate-700">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-1.5 py-0.5 rounded text-[7.5px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'timeline' ? 'bg-red-700 text-white shadow-2xs' : 'text-slate-300 hover:text-white'
              }`}
              title="Visualização em Linha do Tempo Vertical"
            >
              <List className="w-2.5 h-2.5" />
              <span>Timeline</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-1.5 py-0.5 rounded text-[7.5px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'cards' ? 'bg-red-700 text-white shadow-2xs' : 'text-slate-300 hover:text-white'
              }`}
              title="Visualização em Grade de Cards"
            >
              <LayoutGrid className="w-2.5 h-2.5" />
              <span>Cards</span>
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded text-[8px] flex items-center gap-1 border border-slate-700 transition-all cursor-pointer shadow-2xs"
            title="Exportar cronograma de vistorias em formato de planilha CSV"
          >
            <FileSpreadsheet className="w-2.5 h-2.5 text-emerald-400" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          {/* New Inspection Button */}
          {onOpenNovaVistoria && (
            <button
              id="btn-agendar-nova-vistoria-timeline"
              onClick={onOpenNovaVistoria}
              className="px-2 py-1 bg-red-700 hover:bg-red-600 text-white font-extrabold rounded text-[8px] flex items-center gap-1 shadow-2xs transition-all cursor-pointer border border-red-500"
              title="Agendar nova vistoria de canteiro"
            >
              <Plus className="w-2.5 h-2.5" />
              <span>Nova Vistoria</span>
            </button>
          )}

          {/* Module Full Navigation */}
          {onNavigate && (
            <button
              onClick={() => onNavigate('vistorias')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded text-[8px] flex items-center gap-1 border border-slate-700 transition-all cursor-pointer"
              title="Abrir módulo completo de Vistorias"
            >
              <span>Ver Módulo</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STATS KPI STRIP & INTERACTIVE PRAZO CARDS                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-2 bg-slate-50 border-b border-slate-200 text-[8px]">
        
        {/* KPI 1: Vistorias para Hoje */}
        <div 
          id="kpi-vistoria-hoje"
          onClick={() => setPrazoFilter(prazoFilter === 'hoje' ? 'todos' : 'hoje')}
          className={`p-1.5 rounded border shadow-2xs flex items-center justify-between cursor-pointer transition-all ${
            prazoFilter === 'hoje'
              ? 'bg-amber-500 text-slate-950 border-amber-600 ring-2 ring-amber-300 font-bold'
              : 'bg-white hover:border-amber-400 border-slate-200'
          }`}
          title="Clique para filtrar apenas vistorias agendadas para HOJE"
        >
          <div>
            <span className={`text-[7px] font-bold uppercase block ${prazoFilter === 'hoje' ? 'text-slate-950' : 'text-amber-900'}`}>
              Hoje
            </span>
            <span className={`text-[13px] font-black leading-none ${prazoFilter === 'hoje' ? 'text-slate-950' : 'text-amber-700'}`}>
              {stats.hojeCount}
            </span>
          </div>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold ${
            prazoFilter === 'hoje' ? 'bg-slate-950 text-amber-400' : 'bg-amber-100 text-amber-800'
          }`}>
            <Clock className="w-3 h-3 animate-pulse" />
          </div>
        </div>

        {/* KPI 2: Vistorias para Amanhã */}
        <div 
          id="kpi-vistoria-amanha"
          onClick={() => setPrazoFilter(prazoFilter === 'amanha' ? 'todos' : 'amanha')}
          className={`p-1.5 rounded border shadow-2xs flex items-center justify-between cursor-pointer transition-all ${
            prazoFilter === 'amanha'
              ? 'bg-amber-500 text-slate-950 border-amber-600 ring-2 ring-amber-300 font-bold'
              : 'bg-white hover:border-amber-400 border-slate-200'
          }`}
          title="Clique para filtrar vistorias agendadas para AMANHÃ"
        >
          <div>
            <span className={`text-[7px] font-bold uppercase block ${prazoFilter === 'amanha' ? 'text-slate-950' : 'text-slate-600'}`}>
              Amanhã
            </span>
            <span className={`text-[13px] font-black leading-none ${prazoFilter === 'amanha' ? 'text-slate-950' : 'text-slate-800'}`}>
              {stats.amanhaCount}
            </span>
          </div>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold ${
            prazoFilter === 'amanha' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            <Calendar className="w-3 h-3" />
          </div>
        </div>

        {/* KPI 3: Críticas & Urgentes */}
        <div 
          id="kpi-vistoria-urgentes"
          onClick={() => setStatusTab(statusTab === 'urgentes' ? 'todas' : 'urgentes')}
          className={`p-1.5 rounded border shadow-2xs flex items-center justify-between cursor-pointer transition-all ${
            statusTab === 'urgentes'
              ? 'bg-red-600 text-white border-red-700 ring-2 ring-red-400'
              : 'bg-white hover:border-red-300 border-slate-200'
          }`}
          title="Clique para filtrar vistorias de prioridade crítica/urgente"
        >
          <div>
            <span className={`text-[7px] font-bold uppercase block ${statusTab === 'urgentes' ? 'text-red-100' : 'text-red-900'}`}>
              Prioridade Urgente
            </span>
            <span className={`text-[13px] font-black leading-none ${statusTab === 'urgentes' ? 'text-white' : 'text-red-700'}`}>
              {stats.urgentes}
            </span>
          </div>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold ${
            statusTab === 'urgentes' ? 'bg-white text-red-700' : 'bg-red-100 text-red-900'
          }`}>
            <AlertOctagon className="w-3 h-3" />
          </div>
        </div>

        {/* KPI 4: Próximos 7 Dias */}
        <div 
          id="kpi-vistoria-7dias"
          onClick={() => setPrazoFilter(prazoFilter === 'semana' ? 'todos' : 'semana')}
          className={`p-1.5 rounded border shadow-2xs flex items-center justify-between cursor-pointer transition-all ${
            prazoFilter === 'semana'
              ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300'
              : 'bg-white hover:border-blue-300 border-slate-200'
          }`}
          title="Clique para filtrar vistorias dos próximos 7 dias"
        >
          <div>
            <span className={`text-[7px] font-bold uppercase block ${prazoFilter === 'semana' ? 'text-blue-100' : 'text-blue-900'}`}>
              Próximos 7 Dias
            </span>
            <span className={`text-[13px] font-black leading-none ${prazoFilter === 'semana' ? 'text-white' : 'text-blue-700'}`}>
              {stats.proximos7Dias}
            </span>
          </div>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold ${
            prazoFilter === 'semana' ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-800'
          }`}>
            <CalendarDays className="w-3 h-3" />
          </div>
        </div>

        {/* KPI 5: Concluídas com Laudo */}
        <div 
          id="kpi-vistoria-concluidas"
          onClick={() => setStatusTab(statusTab === 'realizadas' ? 'todas' : 'realizadas')}
          className={`p-1.5 rounded border shadow-2xs flex items-center justify-between cursor-pointer transition-all ${
            statusTab === 'realizadas'
              ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-300'
              : 'bg-white hover:border-emerald-300 border-slate-200'
          }`}
          title="Clique para filtrar vistorias já concluídas com laudo"
        >
          <div>
            <span className={`text-[7px] font-bold uppercase block ${statusTab === 'realizadas' ? 'text-emerald-100' : 'text-emerald-900'}`}>
              Realizadas (Laudo)
            </span>
            <span className={`text-[13px] font-black leading-none ${statusTab === 'realizadas' ? 'text-white' : 'text-emerald-700'}`}>
              {stats.concluidas}
            </span>
          </div>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold ${
            statusTab === 'realizadas' ? 'bg-white text-emerald-700' : 'bg-emerald-100 text-emerald-800'
          }`}>
            <CheckCircle2 className="w-3 h-3" />
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2.5. BARRA DE FILTROS RÁPIDOS DE PRAZO (HOJE / AMANHÃ / CAMPO)            */}
      {/* ========================================================================= */}
      <div 
        id="filtro-rapido-prazos-campo"
        className="px-2.5 py-1.5 bg-gradient-to-r from-amber-50/90 via-slate-50 to-blue-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[8px]"
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 text-slate-800 font-extrabold shrink-0">
            <HardHat className="w-3.5 h-3.5 text-amber-700" />
            <span className="text-[8px] uppercase tracking-wider text-slate-900 font-black">
              Filtro Rápido de Campo:
            </span>
          </div>

          {/* Quick Filter: Hoje & Amanhã (Destaque Principal) */}
          <button
            id="btn-filtro-hoje-amanha"
            onClick={() => setPrazoFilter(prazoFilter === 'hoje_amanha' ? 'todos' : 'hoje_amanha')}
            className={`px-2 py-0.5 rounded font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
              prazoFilter === 'hoje_amanha'
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 font-black scale-102'
                : 'bg-amber-100/90 text-amber-900 border border-amber-300 hover:bg-amber-200'
            }`}
            title="Exibir vistorias com agendamento imediato para Hoje e Amanhã"
          >
            <Zap className="w-2.5 h-2.5 text-slate-950 fill-slate-950" />
            <span>Hoje & Amanhã</span>
            <span className="px-1 py-0.2 rounded-full bg-slate-950 text-amber-300 text-[6.5px] font-black ml-0.5">
              {stats.hojeAmanhaCount}
            </span>
          </button>

          {/* Quick Filter: Apenas Hoje */}
          <button
            id="btn-filtro-apenas-hoje"
            onClick={() => setPrazoFilter(prazoFilter === 'hoje' ? 'todos' : 'hoje')}
            className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 transition-all cursor-pointer ${
              prazoFilter === 'hoje'
                ? 'bg-amber-600 text-white font-extrabold ring-1 ring-amber-400'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
            title="Exibir apenas vistorias agendadas para Hoje"
          >
            <Clock className="w-2.5 h-2.5 text-amber-600" />
            <span>Hoje</span>
            <span className="font-mono text-[7px] text-slate-600 font-bold">({stats.hojeCount})</span>
          </button>

          {/* Quick Filter: Apenas Amanhã */}
          <button
            id="btn-filtro-apenas-amanha"
            onClick={() => setPrazoFilter(prazoFilter === 'amanha' ? 'todos' : 'amanha')}
            className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 transition-all cursor-pointer ${
              prazoFilter === 'amanha'
                ? 'bg-blue-600 text-white font-extrabold ring-1 ring-blue-400'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
            title="Exibir apenas vistorias agendadas para Amanhã"
          >
            <Calendar className="w-2.5 h-2.5 text-blue-600" />
            <span>Amanhã</span>
            <span className="font-mono text-[7px] text-slate-600 font-bold">({stats.amanhaCount})</span>
          </button>

          {/* Quick Filter: Esta Semana */}
          <button
            id="btn-filtro-esta-semana"
            onClick={() => setPrazoFilter(prazoFilter === 'semana' ? 'todos' : 'semana')}
            className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
              prazoFilter === 'semana'
                ? 'bg-slate-800 text-white font-extrabold'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
            title="Exibir vistorias dos próximos 7 dias"
          >
            <span>7 Dias ({stats.proximos7Dias})</span>
          </button>

          {/* Quick Filter: Todos os Prazos */}
          {prazoFilter !== 'todos' && (
            <button
              id="btn-filtro-limpar-prazo"
              onClick={() => setPrazoFilter('todos')}
              className="px-1.5 py-0.5 rounded font-bold text-slate-500 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 transition-all flex items-center gap-0.5 cursor-pointer text-[7px]"
              title="Remover filtro de prazo e exibir todas as datas"
            >
              <X className="w-2 h-2 text-slate-400" />
              <span>Ver Todos ({stats.total})</span>
            </button>
          )}
        </div>

        {/* Indicator if active */}
        {prazoFilter !== 'todos' && (
          <div className="flex items-center gap-1 text-[7px] text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-300 font-semibold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
            <span>Filtro de Preparação Ativo: <strong>{prazoFilter === 'hoje_amanha' ? 'Hoje & Amanhã' : prazoFilter === 'hoje' ? 'Hoje' : prazoFilter === 'amanha' ? 'Amanhã' : 'Próximos 7 Dias'}</strong></span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2.8. BANNER DE PREPARAÇÃO IMEDIATA DAS EQUIPES DE CAMPO                   */}
      {/* ========================================================================= */}
      {(prazoFilter === 'hoje_amanha' || prazoFilter === 'hoje' || prazoFilter === 'amanha') && (
        <div 
          id="banner-preparacao-imediata-campo"
          className="mx-2.5 my-2 p-2.5 bg-gradient-to-r from-amber-500/10 via-amber-50/50 to-red-50/40 border border-amber-300 rounded-lg shadow-2xs animate-fadeIn"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <div className="w-7 h-7 rounded-md bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-2xs font-black">
                <HardHat className="w-4 h-4 text-slate-950" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-extrabold text-[10px] text-slate-950 leading-tight">
                    Preparação Imediata de Campo ({prazoFilter === 'hoje_amanha' ? 'Hoje & Amanhã' : prazoFilter === 'hoje' ? 'Hoje' : 'Amanhã'})
                  </h4>
                  <span className="text-[6.5px] font-black bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded uppercase">
                    {filteredItems.length} {filteredItems.length === 1 ? 'vistoria programada' : 'vistorias programadas'}
                  </span>
                </div>
                <p className="text-[7.5px] text-slate-700 mt-0.5 leading-snug">
                  Assegure a checagem prévia dos <strong>EPIs específicos</strong> (NR-35/NR-18/NR-10), calibradores/pranchetas de ensaio, ARTs e o alinhamento com os encarregados antes da mobilização.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
              {onSendNotification && (
                <button
                  id="btn-notificar-equipe-preparacao"
                  onClick={() => {
                    if (onSendNotification) {
                      onSendNotification({
                        titulo: `Alerta de Preparação: Vistorias de ${prazoFilter === 'hoje_amanha' ? 'Hoje & Amanhã' : prazoFilter === 'hoje' ? 'Hoje' : 'Amanhã'}`,
                        mensagem: `${filteredItems.length} vistorias técnicas agendadas requerem preparação imediata de EPIs e equipamentos de medição.`
                      });
                    }
                    setToastMessage(`🔔 Alerta de preparação enviado para as equipes de campo!`);
                    setTimeout(() => setToastMessage(null), 3500);
                  }}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 font-extrabold rounded text-[7.5px] flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                  title="Enviar lembrete para todos os auditores e encarregados das vistorias filtradas"
                >
                  <Bell className="w-2.5 h-2.5 text-amber-300" />
                  <span>Notificar Equipes</span>
                </button>
              )}

              <button
                onClick={() => setPrazoFilter('todos')}
                className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded text-[7.5px] flex items-center gap-0.5 cursor-pointer"
                title="Limpar filtro e voltar à listagem completa"
              >
                <X className="w-2 h-2 text-slate-500" />
                <span>Limpar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FILTROS RÁPIDOS & BARRA DE BUSCA                                       */}
      {/* ========================================================================= */}
      <div className="p-2 sm:p-2.5 bg-slate-50/60 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 text-[8px]">
        
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          <button
            onClick={() => setStatusTab('todas')}
            className={`px-2 py-1 rounded font-bold transition-all cursor-pointer shrink-0 ${
              statusTab === 'todas'
                ? 'bg-slate-900 text-white shadow-2xs font-extrabold'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Todas ({stats.total})
          </button>

          <button
            onClick={() => setStatusTab('pendentes')}
            className={`px-2 py-1 rounded font-bold transition-all cursor-pointer shrink-0 ${
              statusTab === 'pendentes'
                ? 'bg-red-800 text-white shadow-2xs font-extrabold'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Pendentes ({stats.pendentes})
          </button>

          <button
            onClick={() => setStatusTab('urgentes')}
            className={`px-2 py-1 rounded font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              statusTab === 'urgentes'
                ? 'bg-red-600 text-white shadow-2xs font-extrabold animate-pulse'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-2.5 h-2.5 text-amber-300" />
            <span>Críticas / Urgentes ({stats.urgentes})</span>
          </button>

          <button
            onClick={() => setStatusTab('realizadas')}
            className={`px-2 py-1 rounded font-bold transition-all cursor-pointer shrink-0 ${
              statusTab === 'realizadas'
                ? 'bg-emerald-800 text-white shadow-2xs font-extrabold'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Realizadas ({stats.concluidas})
          </button>
        </div>

        {/* Priority & Obra Selects + Search */}
        <div className="flex items-center gap-1.5 flex-1 md:max-w-xl justify-end flex-wrap sm:flex-nowrap">
          
          {/* Obra Select */}
          <div className="flex items-center gap-1 bg-white border border-slate-300 px-1.5 py-0.5 rounded text-[7.5px] shrink-0">
            <Building2 className="w-2.5 h-2.5 text-slate-500" />
            <select
              value={selectedObraId}
              onChange={(e) => setSelectedObraId(e.target.value)}
              aria-label="Filtrar vistorias por canteiro de obra"
              className="bg-transparent text-slate-800 font-semibold text-[7.5px] focus:outline-hidden cursor-pointer max-w-[100px] truncate"
            >
              <option value="all">Todas as Obras</option>
              {obras.map(o => (
                <option key={o.id} value={String(o.id)}>{o.nome}</option>
              ))}
            </select>
          </div>

          {/* Priority Select */}
          <div className="flex items-center gap-1 bg-white border border-slate-300 px-1.5 py-0.5 rounded text-[7.5px] shrink-0">
            <SlidersHorizontal className="w-2.5 h-2.5 text-slate-500" />
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              aria-label="Filtrar vistorias por nível de prioridade"
              className="bg-transparent text-slate-800 font-semibold text-[7.5px] focus:outline-hidden cursor-pointer max-w-[90px]"
            >
              <option value="all">Prioridades</option>
              <option value="urgente">🔴 Urgente</option>
              <option value="alta">🟠 Alta</option>
              <option value="media">🔵 Média</option>
              <option value="baixa">⚪ Baixa</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[130px]">
            <Search className="w-2.5 h-2.5 text-slate-400 absolute left-1.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar vistoria, auditor, local..."
              className="w-full pl-5 pr-2 py-0.5 bg-white border border-slate-300 rounded text-[7.5px] text-slate-800 focus:outline-hidden focus:border-red-600"
            />
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. VISUALIZAÇÃO EM LINHA DO TEMPO (TIMELINE VERTICAL)                      */}
      {/* ========================================================================= */}
      {viewMode === 'timeline' ? (
        <div className="p-3 sm:p-4 space-y-4">
          {timelineGroups.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
              <h4 className="text-[10px] font-bold text-slate-800">Nenhuma Vistoria Encontrada</h4>
              <p className="text-[8px] text-slate-500 mt-0.5">
                Não há registros com os filtros atuais. Altere os critérios ou agende uma nova vistoria.
              </p>
              {onOpenNovaVistoria && (
                <button
                  onClick={onOpenNovaVistoria}
                  className="mt-2.5 px-3 py-1 bg-red-700 text-white rounded text-[8px] font-bold hover:bg-red-600 cursor-pointer shadow-2xs"
                >
                  Agendar Vistoria de Canteiro
                </button>
              )}
            </div>
          ) : (
            timelineGroups.map((group) => {
              const GroupIcon = group.icon;
              return (
                <div key={group.id} className="space-y-2">
                  
                  {/* Phase Group Header */}
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                    <span className={`px-2 py-0.5 rounded text-[7.5px] font-black uppercase tracking-tight flex items-center gap-1 shadow-2xs ${group.badgeColor}`}>
                      <GroupIcon className="w-2.5 h-2.5" />
                      <span>{group.title}</span>
                    </span>
                    <span className="text-[7.5px] text-slate-400 truncate font-medium">
                      ({group.items.length} {group.items.length === 1 ? 'vistoria' : 'vistorias'}) · {group.subtitle}
                    </span>
                  </div>

                  {/* Vertical Timeline Items with Connector */}
                  <div className="relative pl-4 sm:pl-6 space-y-2.5 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {group.items.map((item) => {
                      const v = item.vistoria;
                      const isConcluded = v.status === 'realizada' || v.status === 'concluida';
                      const isUrgent = item.prioridadeEfetiva === 'urgente' && !isConcluded;

                      return (
                        <div key={v.id} className="relative group">
                          
                          {/* Timeline Node Icon Pin */}
                          <div className={`absolute -left-4 sm:-left-6 top-2.5 w-4 sm:w-5 h-4 sm:h-5 rounded-full flex items-center justify-center text-white text-[7px] font-bold shadow-xs border-2 border-white transition-transform group-hover:scale-110 z-10 ${
                            isConcluded 
                              ? 'bg-emerald-600' 
                              : isUrgent 
                              ? 'bg-red-600 animate-pulse ring-2 ring-red-400' 
                              : item.urgencyLevel === 'hoje'
                              ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-amber-300'
                              : 'bg-blue-600'
                          }`}>
                            {isConcluded ? (
                              <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                            ) : isUrgent ? (
                              <Zap className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
                            ) : (
                              <Clock className="w-2.5 h-2.5 text-white" />
                            )}
                          </div>

                          {/* Inspection Card Container */}
                          <div className={`p-2.5 sm:p-3 rounded-lg border transition-all shadow-2xs hover:shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5 ${
                            isConcluded
                              ? 'bg-slate-50/90 border-slate-200'
                              : isUrgent
                              ? 'bg-red-50/70 border-red-300 ring-1 ring-red-200'
                              : item.urgencyLevel === 'hoje'
                              ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-200'
                              : 'bg-white border-slate-200/90 hover:border-slate-300'
                          }`}>
                            
                            {/* Card Main Info */}
                            <div className="flex-1 min-w-0 space-y-1">
                              
                              {/* Meta Header */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {renderPriorityBadge(item.prioridadeEfetiva, isConcluded)}

                                <span className={`px-1.5 py-0.2 rounded text-[7px] font-extrabold uppercase ${
                                  isConcluded 
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                    : item.urgencyLevel === 'hoje'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300 font-black'
                                    : item.urgencyLevel === 'atrasado'
                                    ? 'bg-red-100 text-red-800 border border-red-300 font-bold'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}>
                                  {item.relativeLabel}
                                </span>

                                <span className="text-[7.5px] font-bold text-slate-600 bg-white px-1.5 py-0.2 rounded border border-slate-200 flex items-center gap-1">
                                  <Building2 className="w-2 h-2 text-slate-400" />
                                  <span className="truncate max-w-[140px]">{v.obra_nome}</span>
                                </span>

                                {v.tipo && (
                                  <span className="text-[7px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                    {v.tipo}
                                  </span>
                                )}
                              </div>

                              {/* Title & Description */}
                              <div>
                                <h4 className="font-extrabold text-[10px] sm:text-[11px] text-slate-900 leading-tight">
                                  {v.titulo}
                                </h4>
                                {v.descricao && (
                                  <p className="text-[7.5px] sm:text-[8px] text-slate-500 line-clamp-2 mt-0.5">
                                    {v.descricao}
                                  </p>
                                )}
                              </div>

                              {/* Inspection Details Pills */}
                              <div className="flex items-center gap-2 pt-0.5 text-[7px] text-slate-500 flex-wrap">
                                {v.local_inspecao && (
                                  <span className="flex items-center gap-0.5 text-slate-700 font-medium">
                                    <MapPin className="w-2 h-2 text-slate-400" />
                                    <span>{v.local_inspecao}</span>
                                  </span>
                                )}

                                {v.etapa_obra && (
                                  <span className="flex items-center gap-0.5 text-slate-700 font-medium">
                                    <Layers className="w-2 h-2 text-slate-400" />
                                    <span>Etapa: {v.etapa_obra}</span>
                                  </span>
                                )}

                                {v.responsavel_nome && (
                                  <span className="flex items-center gap-0.5 text-slate-700 font-semibold bg-slate-100 px-1 py-0.2 rounded">
                                    <UserCheck className="w-2 h-2 text-slate-500" />
                                    <span>Auditor: {v.responsavel_nome}</span>
                                  </span>
                                )}

                                {/* Conformity badge if conducted */}
                                {isConcluded && item.taxaConformidade !== null && (
                                  <span className={`px-1.5 py-0.2 rounded font-extrabold text-[7px] flex items-center gap-0.5 ${
                                    item.taxaConformidade >= 85 
                                      ? 'bg-emerald-100 text-emerald-800' 
                                      : item.taxaConformidade >= 60 
                                      ? 'bg-amber-100 text-amber-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    <ShieldCheck className="w-2 h-2" />
                                    <span>Conformidade: {item.taxaConformidade}% ({v.itens_conformes}/{v.total_itens} itens)</span>
                                  </span>
                                )}
                              </div>

                            </div>

                            {/* Card Action Controls */}
                            <div className="flex items-center gap-1 shrink-0 pt-1 md:pt-0 border-t md:border-t-0 border-slate-100 justify-end">
                              
                              {/* Detail Modal Button */}
                              <button
                                onClick={() => setDetailItem(v)}
                                className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded text-[7.5px] font-bold border border-slate-200 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Ver ficha técnica completa da vistoria"
                              >
                                <Eye className="w-2.5 h-2.5 text-slate-500" />
                                <span>Detalhes</span>
                              </button>

                              {/* Notify Reminder Button */}
                              {!isConcluded && onSendNotification && (
                                <button
                                  onClick={() => handleNotifyAuditor(item)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[7.5px] font-bold border border-slate-200 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                  title="Enviar lembrete de agendamento ao responsável técnico"
                                >
                                  <Bell className="w-2.5 h-2.5 text-slate-500" />
                                  <span className="hidden sm:inline">Lembrete</span>
                                </button>
                              )}

                              {/* Execute / Conclude Button */}
                              {!isConcluded ? (
                                <button
                                  onClick={() => handleOpenExecute(v)}
                                  className={`px-2.5 py-1 text-white font-extrabold rounded text-[7.5px] flex items-center gap-1 shadow-2xs transition-all cursor-pointer ${
                                    isUrgent 
                                      ? 'bg-red-700 hover:bg-red-600 animate-pulse' 
                                      : 'bg-emerald-700 hover:bg-emerald-600'
                                  }`}
                                  title="Executar checklist e registrar conclusão técnica"
                                >
                                  <CheckSquare className="w-2.5 h-2.5" />
                                  <span>Executar Vistoria</span>
                                </button>
                              ) : (
                                <span className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[7.5px] font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>Concluída</span>
                                </span>
                              )}

                            </div>

                          </div>

                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* 5. VISUALIZAÇÃO EM GRADE DE CARDS (VIEW MODE: CARDS)                      */
        /* ========================================================================= */
        <div className="p-3 sm:p-4">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
              <h4 className="text-[10px] font-bold text-slate-800">Nenhuma Vistoria Encontrada</h4>
              <p className="text-[8px] text-slate-500 mt-0.5">Altere os filtros de busca para visualizar os agendamentos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filteredItems.map(item => {
                const v = item.vistoria;
                const isConcluded = v.status === 'realizada' || v.status === 'concluida';
                const isUrgent = item.prioridadeEfetiva === 'urgente' && !isConcluded;

                return (
                  <div
                    key={v.id}
                    className={`rounded-lg p-3 border transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs ${
                      isConcluded
                        ? 'bg-slate-50/80 border-slate-200'
                        : isUrgent
                        ? 'bg-red-50/80 border-red-300 ring-1 ring-red-200'
                        : item.urgencyLevel === 'hoje'
                        ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div>
                      {/* Card Header Top */}
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        {renderPriorityBadge(item.prioridadeEfetiva, isConcluded)}
                        <span className="font-mono text-[7px] text-slate-500 font-bold bg-white px-1.5 py-0.2 rounded border border-slate-200">
                          {item.dateStrFormatted}
                        </span>
                      </div>

                      {/* Title & Obra */}
                      <div className="mb-2">
                        <h4 className="font-extrabold text-[10.5px] text-slate-900 leading-tight">
                          {v.titulo}
                        </h4>
                        <div className="flex items-center gap-1 text-[7.5px] text-slate-500 mt-0.5">
                          <Building2 className="w-2 h-2 text-slate-400" />
                          <span className="font-semibold text-slate-700 truncate">{v.obra_nome}</span>
                        </div>
                      </div>

                      {/* Description & Scope */}
                      {v.descricao && (
                        <p className="text-[7.5px] text-slate-600 line-clamp-2 bg-white/80 p-1.5 rounded border border-slate-200/80 mb-2">
                          {v.descricao}
                        </p>
                      )}

                      {/* Location & Auditor Tags */}
                      <div className="space-y-1 text-[7px] text-slate-500 mb-2">
                        {v.local_inspecao && (
                          <div className="flex items-center gap-1 text-slate-700">
                            <MapPin className="w-2 h-2 text-slate-400" />
                            <span className="truncate">{v.local_inspecao}</span>
                          </div>
                        )}
                        {v.responsavel_nome && (
                          <div className="flex items-center gap-1 text-slate-700">
                            <UserCheck className="w-2 h-2 text-slate-400" />
                            <span className="truncate">Auditor: {v.responsavel_nome}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-1">
                      <button
                        onClick={() => setDetailItem(v)}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded text-[7.5px] font-bold border border-slate-200 cursor-pointer"
                      >
                        Ficha
                      </button>

                      {!isConcluded ? (
                        <button
                          onClick={() => handleOpenExecute(v)}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[7.5px] font-extrabold flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <CheckSquare className="w-2.5 h-2.5" />
                          <span>Executar</span>
                        </button>
                      ) : (
                        <span className="text-[7.5px] font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Realizada</span>
                        </span>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL DE EXECUÇÃO / CONCLUSÃO TÉCNICA DE VISTORIA                       */}
      {/* ========================================================================= */}
      {executeModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden animate-scaleUp">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <CheckSquare className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-[11px] text-white">Execução Técnica de Vistoria</h4>
                  <span className="text-[7.5px] text-emerald-200">Registro de Laudo & Conformidade em Campo</span>
                </div>
              </div>
              <button
                onClick={() => setExecuteModalItem(null)}
                className="text-slate-300 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmExecution} className="p-3.5 space-y-2.5 text-[8.5px]">
              
              {/* Vistoria Info Summary */}
              <div className="bg-emerald-50/70 p-2.5 rounded border border-emerald-200">
                <span className="text-[7px] font-bold text-emerald-800 uppercase block">Vistoria Selecionada:</span>
                <strong className="text-[10px] text-slate-900 block leading-tight">{executeModalItem.titulo}</strong>
                <div className="flex items-center gap-2 text-[7.5px] text-slate-600 mt-1 flex-wrap">
                  <span>Obra: <strong>{executeModalItem.obra_nome}</strong></span>
                  <span>·</span>
                  <span>Local: <strong>{executeModalItem.local_inspecao || 'Canteiro Principal'}</strong></span>
                </div>
              </div>

              {/* Checklist Conformity Score Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">
                    Itens Conformes / Aprovados:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={execData.totalItens}
                    value={execData.itensConformes}
                    onChange={(e) => setExecData(prev => ({ ...prev, itensConformes: Number(e.target.value) }))}
                    required
                    className="w-full p-1.5 border border-slate-300 rounded text-[9px] font-bold text-slate-900 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">
                    Total de Itens Auditados:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={execData.totalItens}
                    onChange={(e) => setExecData(prev => ({ ...prev, totalItens: Number(e.target.value) }))}
                    required
                    className="w-full p-1.5 border border-slate-300 rounded text-[9px] font-bold text-slate-900 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Conformity Rate Display */}
              <div className="bg-slate-50 p-2 rounded border border-slate-200 flex justify-between items-center text-[7.5px]">
                <span className="text-slate-600 font-semibold">Índice de Conformidade Resultante:</span>
                <strong className="font-mono text-emerald-800 text-[10px]">
                  {execData.totalItens > 0 ? Math.round((execData.itensConformes / execData.totalItens) * 100) : 0}%
                </strong>
              </div>

              {/* Technical Observations */}
              <div>
                <label className="font-bold text-slate-700 block mb-0.5">
                  Parecer Técnico & Observações:
                </label>
                <textarea
                  rows={2}
                  value={execData.observacoes}
                  onChange={(e) => setExecData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Descreva o parecer do auditor, condições da frente de serviço e liberações..."
                  className="w-full p-1.5 border border-slate-300 rounded text-[8px] text-slate-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              {/* Non-Conformities */}
              <div>
                <label className="font-bold text-slate-700 block mb-0.5 flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
                  <span>Não-Conformidades / Ações Corretivas (Opcional):</span>
                </label>
                <input
                  type="text"
                  value={execData.naoConformidades}
                  onChange={(e) => setExecData(prev => ({ ...prev, naoConformidades: e.target.value }))}
                  placeholder="Ex.: Ajustar estribo da viga V102 antes da concretagem"
                  className="w-full p-1.5 border border-slate-300 rounded text-[8px] text-slate-900 focus:outline-hidden focus:border-red-600"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setExecuteModalItem(null)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[8px] font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[8px] font-extrabold flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>Aprovar & Salvar Laudo</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL DE FICHA TÉCNICA DETALHADA                                       */}
      {/* ========================================================================= */}
      {detailItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden animate-scaleUp">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-950 to-red-950 text-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-red-700 text-white flex items-center justify-center font-bold">
                  <CalendarCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-[11px] text-white">Ficha Técnica da Vistoria</h4>
                  <span className="text-[7.5px] text-slate-300">Auditoria & Planejamento Operacional</span>
                </div>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="text-slate-300 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-3.5 space-y-2.5 text-[8px]">
              <div>
                <span className="text-[7px] font-bold text-slate-400 uppercase block">Título da Vistoria:</span>
                <h3 className="font-extrabold text-[12px] text-slate-900 leading-tight">{detailItem.titulo}</h3>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200">
                <div>
                  <span className="text-[7px] text-slate-400 font-bold uppercase block">Obra / Canteiro:</span>
                  <strong className="text-slate-800 text-[8.5px]">{detailItem.obra_nome}</strong>
                </div>

                <div>
                  <span className="text-[7px] text-slate-400 font-bold uppercase block">Data Agendada:</span>
                  <strong className="text-slate-800 text-[8.5px]">{detailItem.data_agendada}</strong>
                </div>

                <div>
                  <span className="text-[7px] text-slate-400 font-bold uppercase block">Tipo de Vistoria:</span>
                  <span className="text-slate-800 font-semibold">{detailItem.tipo || 'Inspeção Geral'}</span>
                </div>

                <div>
                  <span className="text-[7px] text-slate-400 font-bold uppercase block">Status Atual:</span>
                  <span className={`font-black uppercase text-[7.5px] ${
                    detailItem.status === 'realizada' ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {detailItem.status}
                  </span>
                </div>
              </div>

              {detailItem.descricao && (
                <div>
                  <span className="text-[7px] font-bold text-slate-400 uppercase block mb-0.5">Escopo Técnico:</span>
                  <p className="p-2 bg-slate-50 rounded border border-slate-200 text-slate-700 leading-relaxed">
                    {detailItem.descricao}
                  </p>
                </div>
              )}

              {detailItem.local_inspecao && (
                <div className="flex items-center gap-1 text-slate-700 font-medium">
                  <MapPin className="w-2.5 h-2.5 text-slate-400" />
                  <span>Localização Exata: <strong>{detailItem.local_inspecao}</strong></span>
                </div>
              )}

              {detailItem.responsavel_nome && (
                <div className="flex items-center gap-1 text-slate-700 font-medium">
                  <UserCheck className="w-2.5 h-2.5 text-slate-400" />
                  <span>Auditor Designado: <strong>{detailItem.responsavel_nome}</strong></span>
                </div>
              )}

              {detailItem.observacoes && (
                <div className="p-2 bg-emerald-50 rounded border border-emerald-200 text-emerald-900">
                  <span className="font-bold block text-[7px] uppercase">Parecer de Realização:</span>
                  <span>{detailItem.observacoes}</span>
                </div>
              )}

              {detailItem.nao_conformidades && (
                <div className="p-2 bg-red-50 rounded border border-red-200 text-red-900">
                  <span className="font-bold block text-[7px] uppercase">Apontamentos de Não-Conformidade:</span>
                  <span>⚠️ {detailItem.nao_conformidades}</span>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-200">
                <button
                  onClick={() => setDetailItem(null)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[8px] font-bold cursor-pointer"
                >
                  Fechar
                </button>
                {detailItem.status !== 'realizada' && (
                  <button
                    onClick={() => {
                      const item = detailItem;
                      setDetailItem(null);
                      handleOpenExecute(item);
                    }}
                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[8px] font-extrabold flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <CheckSquare className="w-2.5 h-2.5" />
                    <span>Executar Vistoria</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
