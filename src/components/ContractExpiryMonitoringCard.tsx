import React, { useState, useMemo } from 'react';
import {
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertOctagon,
  FileText,
  Building2,
  ChevronRight,
  Send,
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Phone,
  Mail,
  User,
  DollarSign,
  ArrowUpRight,
  Check,
  X,
  PlusCircle,
  FileCheck2,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { ContratoSubempreiteira, Obra } from '../types/erp';

export type CriticalityLevel = 'expired' | 'critical' | 'high' | 'moderate' | 'regular';

export interface ContractExpiryItem {
  contrato: ContratoSubempreiteira;
  diasRestantes: number;
  criticality: CriticalityLevel;
  criticalityLabel: string;
  isVencido: boolean;
  isMenor30Dias: boolean;
  percentualDecorrido: number;
}

interface ContractExpiryMonitoringCardProps {
  contratos: ContratoSubempreiteira[];
  obras?: Obra[];
  selectedObraId?: string;
  onNavigate?: (tab: string, subTab?: string) => void;
  onSendNotification?: (notif: { titulo: string; mensagem: string; obra_id?: number; obra_nome?: string }) => void;
  onUpdateContrato?: (contrato: ContratoSubempreiteira) => void;
}

export const ContractExpiryMonitoringCard: React.FC<ContractExpiryMonitoringCardProps> = ({
  contratos = [],
  obras = [],
  selectedObraId = 'all',
  onNavigate,
  onSendNotification,
  onUpdateContrato
}) => {
  // Filter and view state
  const [filterMode, setFilterMode] = useState<'menor_30' | 'criticos' | 'alto' | 'moderado' | 'vencidos' | 'todos'>('menor_30');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'urgencia' | 'data' | 'valor' | 'nome'>('urgencia');
  
  // Quick Extension Modal State
  const [modalContrato, setModalContrato] = useState<ContratoSubempreiteira | null>(null);
  const [diasProrrogacao, setDiasProrrogacao] = useState<number>(30);
  const [novaDataTermino, setNovaDataTermino] = useState<string>('');
  const [justificativaAditivo, setJustificativaAditivo] = useState<string>('Prorrogação de cronograma e continuidade de serviços essenciais.');
  const [valorAditivo, setValorAditivo] = useState<string>('0');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Helper to calculate days remaining
  const calculateContractMetrics = (contrato: ContratoSubempreiteira): ContractExpiryItem => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dataFimStr = contrato.data_fim || '';
    const [anoF, mesF, diaF] = dataFimStr.split('-').map(Number);
    const dataFim = dataFimStr ? new Date(anoF, (mesF || 1) - 1, diaF || 1) : new Date(today.getTime() + 60 * 86400000);
    dataFim.setHours(0, 0, 0, 0);

    const diffTime = dataFim.getTime() - today.getTime();
    const diasRestantes = Math.round(diffTime / (1000 * 60 * 60 * 24));

    // Calculate contract progress (% elapsed)
    let percentualDecorrido = 50;
    if (contrato.data_inicio && contrato.data_fim) {
      const [anoI, mesI, diaI] = contrato.data_inicio.split('-').map(Number);
      const dataInicio = new Date(anoI, (mesI || 1) - 1, diaI || 1);
      const totalDuracao = Math.max(1, dataFim.getTime() - dataInicio.getTime());
      const decorrido = Math.max(0, today.getTime() - dataInicio.getTime());
      percentualDecorrido = Math.min(100, Math.round((decorrido / totalDuracao) * 100));
    }

    let criticality: CriticalityLevel = 'regular';
    let criticalityLabel = 'Vigência Regular (> 30 dias)';

    if (diasRestantes < 0) {
      criticality = 'expired';
      criticalityLabel = `Vencido há ${Math.abs(diasRestantes)} dia${Math.abs(diasRestantes) === 1 ? '' : 's'}`;
    } else if (diasRestantes <= 7) {
      criticality = 'critical';
      criticalityLabel = diasRestantes === 0 ? 'Vence Hoje' : `Crítico (Vence em ${diasRestantes} dia${diasRestantes === 1 ? '' : 's'})`;
    } else if (diasRestantes <= 15) {
      criticality = 'high';
      criticalityLabel = `Alerta Alto (Vence em ${diasRestantes} dias)`;
    } else if (diasRestantes <= 30) {
      criticality = 'moderate';
      criticalityLabel = `Atenção (Vence em ${diasRestantes} dias)`;
    }

    return {
      contrato,
      diasRestantes,
      criticality,
      criticalityLabel,
      isVencido: diasRestantes < 0,
      isMenor30Dias: diasRestantes <= 30,
      percentualDecorrido
    };
  };

  // Process all contracts
  const items = useMemo(() => {
    return contratos.map(c => calculateContractMetrics(c));
  }, [contratos]);

  // Metric counters
  const counts = useMemo(() => {
    const expired = items.filter(i => i.criticality === 'expired').length;
    const critical = items.filter(i => i.criticality === 'critical').length;
    const high = items.filter(i => i.criticality === 'high').length;
    const moderate = items.filter(i => i.criticality === 'moderate').length;
    const under30 = items.filter(i => i.isMenor30Dias).length;
    const regular = items.filter(i => i.criticality === 'regular').length;
    return { expired, critical, high, moderate, under30, regular, total: items.length };
  }, [items]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        // Mode filter
        if (filterMode === 'menor_30') return item.isMenor30Dias;
        if (filterMode === 'criticos') return item.criticality === 'critical';
        if (filterMode === 'alto') return item.criticality === 'high';
        if (filterMode === 'moderado') return item.criticality === 'moderate';
        if (filterMode === 'vencidos') return item.criticality === 'expired';
        return true; // 'todos'
      })
      .filter(item => {
        // Search filter
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.contrato.empresa_nome_fantasia.toLowerCase().includes(q) ||
          item.contrato.empresa_razao_social.toLowerCase().includes(q) ||
          item.contrato.codigo_contrato.toLowerCase().includes(q) ||
          item.contrato.especialidade.toLowerCase().includes(q) ||
          item.contrato.obra_nome.toLowerCase().includes(q) ||
          item.contrato.gestor_contrato_nome.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'urgencia') {
          // Put expired and critically closest to expiry first
          return a.diasRestantes - b.diasRestantes;
        }
        if (sortBy === 'data') {
          return (a.contrato.data_fim || '').localeCompare(b.contrato.data_fim || '');
        }
        if (sortBy === 'valor') {
          return (b.contrato.valor_global || 0) - (a.contrato.valor_global || 0);
        }
        if (sortBy === 'nome') {
          return a.contrato.empresa_nome_fantasia.localeCompare(b.contrato.empresa_nome_fantasia);
        }
        return 0;
      });
  }, [items, filterMode, searchQuery, sortBy]);

  // Styling helper for criticality levels
  const getCriticalityStyles = (criticality: CriticalityLevel) => {
    switch (criticality) {
      case 'expired':
        return {
          cardBg: 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60',
          accentBorder: 'border-l-4 border-l-rose-600 dark:border-l-rose-500',
          badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border border-rose-300 dark:border-rose-800',
          indicatorColor: 'bg-rose-600',
          progressColor: 'bg-rose-600',
          textColor: 'text-rose-700 dark:text-rose-400',
          icon: AlertOctagon,
          severityText: 'Vigência Expirada - Ação Imediata'
        };
      case 'critical':
        return {
          cardBg: 'bg-red-50/60 dark:bg-red-950/20 border-red-300 dark:border-red-900/60',
          accentBorder: 'border-l-4 border-l-red-600 dark:border-l-red-500',
          badgeBg: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200 border border-red-300 dark:border-red-800',
          indicatorColor: 'bg-red-600 animate-pulse',
          progressColor: 'bg-red-600',
          textColor: 'text-red-700 dark:text-red-400',
          icon: AlertTriangle,
          severityText: 'Criticidade Máxima (≤ 7 dias)'
        };
      case 'high':
        return {
          cardBg: 'bg-orange-50/60 dark:bg-orange-950/20 border-orange-300 dark:border-orange-900/60',
          accentBorder: 'border-l-4 border-l-orange-500 dark:border-l-orange-500',
          badgeBg: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200 border border-orange-300 dark:border-orange-800',
          indicatorColor: 'bg-orange-500',
          progressColor: 'bg-orange-500',
          textColor: 'text-orange-700 dark:text-orange-400',
          icon: Clock,
          severityText: 'Alerta Prioritário (8-15 dias)'
        };
      case 'moderate':
        return {
          cardBg: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60',
          accentBorder: 'border-l-4 border-l-amber-500 dark:border-l-amber-500',
          badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-800',
          indicatorColor: 'bg-amber-500',
          progressColor: 'bg-amber-500',
          textColor: 'text-amber-700 dark:text-amber-400',
          icon: Calendar,
          severityText: 'Atenção Moderada (16-30 dias)'
        };
      case 'regular':
      default:
        return {
          cardBg: 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/40',
          accentBorder: 'border-l-4 border-l-emerald-500 dark:border-l-emerald-500',
          badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800',
          indicatorColor: 'bg-emerald-500',
          progressColor: 'bg-emerald-500',
          textColor: 'text-emerald-700 dark:text-emerald-400',
          icon: CheckCircle2,
          severityText: 'Vigência Regular (> 30 dias)'
        };
    }
  };

  // Format currency
  const formatBRL = (val?: number) => {
    if (!val) return 'R$ 0,00';
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  };

  // Format date dd/mm/aaaa
  const formatDateBR = (dateStr?: string) => {
    if (!dateStr) return '—';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // Handle open modal
  const handleOpenAditivoModal = (contrato: ContratoSubempreiteira) => {
    setModalContrato(contrato);
    setDiasProrrogacao(30);
    // calculate default new date (+30 days from current data_fim or today)
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 30);
    setNovaDataTermino(baseDate.toISOString().split('T')[0]);
    setValorAditivo('0');
  };

  // Handle apply extension
  const handleConfirmAditivo = () => {
    if (!modalContrato || !onUpdateContrato) return;

    let targetDateStr = novaDataTermino;
    if (!targetDateStr) {
      const d = new Date();
      d.setDate(d.getDate() + diasProrrogacao);
      targetDateStr = d.toISOString().split('T')[0];
    }

    const aditivoVal = parseFloat(valorAditivo.replace(/\./g, '').replace(',', '.')) || 0;
    const novoValorGlobal = (modalContrato.valor_global || 0) + aditivoVal;

    const updatedContrato: ContratoSubempreiteira = {
      ...modalContrato,
      data_fim: targetDateStr,
      valor_global: novoValorGlobal
    };

    onUpdateContrato(updatedContrato);

    // Send notification
    if (onSendNotification) {
      onSendNotification({
        titulo: `Termo Aditivo Emitido: ${modalContrato.codigo_contrato}`,
        mensagem: `Vigência do contrato com ${modalContrato.empresa_nome_fantasia} prorrogada até ${formatDateBR(targetDateStr)}. ${justificativaAditivo}`,
        obra_id: modalContrato.obra_id,
        obra_nome: modalContrato.obra_nome
      });
    }

    setActionSuccessMsg(`Termo Aditivo do contrato ${modalContrato.codigo_contrato} registrado com sucesso! Nova vigência: ${formatDateBR(targetDateStr)}.`);
    setTimeout(() => setActionSuccessMsg(null), 4500);
    setModalContrato(null);
  };

  // Handle notify manager
  const handleNotifyManager = (item: ContractExpiryItem) => {
    if (onSendNotification) {
      onSendNotification({
        titulo: `⚠️ Alerta de Vigência de Contrato: ${item.contrato.codigo_contrato}`,
        mensagem: `Atenção ${item.contrato.gestor_contrato_nome}: O contrato da subempreiteira ${item.contrato.empresa_nome_fantasia} (${item.contrato.especialidade}) na obra ${item.contrato.obra_nome} ${item.diasRestantes < 0 ? `está vencido há ${Math.abs(item.diasRestantes)} dias` : `vencerá em ${item.diasRestantes} dias (${formatDateBR(item.contrato.data_fim)})`}. Providenciar termo aditivo ou desmobilização.`,
        obra_id: item.contrato.obra_id,
        obra_nome: item.contrato.obra_nome
      });
    }

    setActionSuccessMsg(`Notificação enviada ao gestor ${item.contrato.gestor_contrato_nome} para o contrato ${item.contrato.codigo_contrato}.`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  return (
    <div 
      id="contract-expiry-monitoring-card" 
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 transition-all duration-200"
    >
      {/* 1. HEADER & IDENTIDADE DO CARD */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0 mt-0.5">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Monitoramento de Vigência
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Subempreiteiras & Terceiros
              </span>
              {counts.under30 > 0 && (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-800 flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {counts.under30} {counts.under30 === 1 ? 'contrato crítico (< 30d)' : 'contratos críticos (< 30d)'}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Controle de prazos de vigência com código de cores e sinalização de contratos a expirar em menos de 30 dias para evitar desmobilizações e paradas de canteiro.
            </p>
          </div>
        </div>

        {/* Global Navigation or Refresh */}
        <div className="flex items-center gap-2 self-end lg:self-center">
          {onNavigate && (
            <button
              id="btn-navigate-to-third-party"
              onClick={() => onNavigate('equipe', 'terceiros')}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
              title="Acessar Matriz Geral de Subempreiteiras"
            >
              <span>Ver Matriz de Contratos</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. SUCCESS FEEDBACK TOAST */}
      {actionSuccessMsg && (
        <div className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{actionSuccessMsg}</span>
          </div>
          <button 
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. CARDS DE CRITICIDADE (STAT PILLS / METRIC CARDS) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3.5 my-4">
        {/* Total < 30 dias */}
        <button
          onClick={() => setFilterMode('menor_30')}
          className={`p-3 rounded-xl border text-left transition-all ${
            filterMode === 'menor_30'
              ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-800 dark:border-slate-600 shadow-sm'
              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-medium opacity-80 mb-1">
            <span>Menor que 30d</span>
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl sm:text-2xl font-black">
            {counts.under30}
          </div>
          <div className="text-[10px] opacity-75 truncate">
            Foco regulatório
          </div>
        </button>

        {/* Vencidos */}
        <button
          onClick={() => setFilterMode('vencidos')}
          className={`p-3 rounded-xl border text-left transition-all ${
            filterMode === 'vencidos'
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 hover:border-rose-300 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-medium opacity-90 mb-1">
            <span>Expirados (&lt; 0d)</span>
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-300">
            {counts.expired}
          </div>
          <div className="text-[10px] opacity-75 truncate text-rose-600 dark:text-rose-400 font-semibold">
            Bloquear ou aditivar
          </div>
        </button>

        {/* Crítico (≤ 7 dias) */}
        <button
          onClick={() => setFilterMode('criticos')}
          className={`p-3 rounded-xl border text-left transition-all ${
            filterMode === 'criticos'
              ? 'bg-red-600 text-white border-red-600 shadow-sm'
              : 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 hover:border-red-300 text-red-900 dark:text-red-200'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-medium opacity-90 mb-1">
            <span>Crítico (≤ 7d)</span>
            <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-red-700 dark:text-red-300">
            {counts.critical}
          </div>
          <div className="text-[10px] opacity-75 truncate text-red-600 dark:text-red-400 font-semibold">
            Vencimento iminente
          </div>
        </button>

        {/* Alto (8 a 15 dias) */}
        <button
          onClick={() => setFilterMode('alto')}
          className={`p-3 rounded-xl border text-left transition-all ${
            filterMode === 'alto'
              ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
              : 'bg-orange-50/60 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50 hover:border-orange-300 text-orange-900 dark:text-orange-200'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-medium opacity-90 mb-1">
            <span>Alerta (8-15d)</span>
            <Clock className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-orange-700 dark:text-orange-300">
            {counts.high}
          </div>
          <div className="text-[10px] opacity-75 truncate text-orange-600 dark:text-orange-400 font-semibold">
            Tramitação urgente
          </div>
        </button>

        {/* Moderado (16 a 30 dias) */}
        <button
          onClick={() => setFilterMode('moderado')}
          className={`col-span-2 sm:col-span-1 p-3 rounded-xl border text-left transition-all ${
            filterMode === 'moderado'
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
              : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 hover:border-amber-300 text-amber-900 dark:text-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-medium opacity-90 mb-1">
            <span>Atenção (16-30d)</span>
            <Info className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-300">
            {counts.moderate}
          </div>
          <div className="text-[10px] opacity-75 truncate text-amber-600 dark:text-amber-400 font-semibold">
            Acompanhamento
          </div>
        </button>
      </div>

      {/* 4. BARRA DE FILTROS, BUSCA & ORDENAÇÃO */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 pt-1">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por subempreiteira, especialidade, contrato ou obra..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mode Selector & Sort */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5 text-xs">
            <button
              onClick={() => setFilterMode('menor_30')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                filterMode === 'menor_30'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              &lt; 30 dias ({counts.under30})
            </button>
            <button
              onClick={() => setFilterMode('todos')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                filterMode === 'todos'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Todos ({counts.total})
            </button>
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="urgencia">Ordenar por Urgência</option>
              <option value="data">Data de Término</option>
              <option value="valor">Maior Valor</option>
              <option value="nome">Nome da Empresa</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. LISTA DE CONTRATOS SINALIZADOS */}
      {filteredItems.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Nenhum contrato pendente neste filtro
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {filterMode === 'menor_30'
              ? 'Não há contratos de subempreiteiras com encerramento previsto para os próximos 30 dias no filtro atual.'
              : 'Nenhum contrato encontrado para os critérios de busca selecionados.'}
          </p>
          {filterMode !== 'todos' && (
            <button
              onClick={() => setFilterMode('todos')}
              className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300"
            >
              Exibir todos os contratos ({counts.total})
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const styles = getCriticalityStyles(item.criticality);
            const IconComponent = styles.icon;
            const contrato = item.contrato;

            // Document status breakdown
            const totalDocs = contrato.documentos_sst?.length || 0;
            const validDocs = contrato.documentos_sst?.filter(d => d.status === 'aprovado').length || 0;
            const pendingOrExpiredDocs = totalDocs - validDocs;

            return (
              <div
                key={contrato.id}
                id={`contract-item-${contrato.id}`}
                className={`rounded-xl border p-3.5 sm:p-4 transition-all hover:shadow-md ${styles.cardBg} ${styles.accentBorder}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                  {/* Left Column: Identificação & Criticidade */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Badge de criticidade com código de cores */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${styles.badgeBg}`}>
                        <span className={`w-2 h-2 rounded-full ${styles.indicatorColor}`} />
                        <IconComponent className="w-3.5 h-3.5" />
                        <span>{item.criticalityLabel}</span>
                      </span>

                      {/* Código do contrato */}
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {contrato.codigo_contrato}
                      </span>

                      {/* Obra badge */}
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-800/60 px-2 py-0.5 rounded border border-slate-200/80 dark:border-slate-700/80">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{contrato.obra_nome}</span>
                      </span>

                      {/* SST Homologação Badge */}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        contrato.status_homologacao_sst === 'homologado' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300' 
                          : contrato.status_homologacao_sst === 'irregular_bloqueado'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                      }`}>
                        {contrato.status_homologacao_sst === 'homologado' ? 'SST Homologado' :
                         contrato.status_homologacao_sst === 'irregular_bloqueado' ? 'SST Bloqueado' : 'SST Pendente'}
                      </span>
                    </div>

                    {/* Razão social e Nome fantasia */}
                    <div className="flex items-baseline gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                        {contrato.empresa_nome_fantasia}
                      </h4>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:inline">
                        ({contrato.empresa_razao_social})
                      </span>
                    </div>

                    {/* Especialidade & CNPJ */}
                    <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {contrato.especialidade}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="font-mono text-slate-500">CNPJ: {contrato.cnpj}</span>
                      {contrato.valor_global && (
                        <>
                          <span className="text-slate-400">•</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            Valor: {formatBRL(contrato.valor_global)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Prazos, Vigência & Barra de Progresso */}
                  <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 sm:min-w-[250px]">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Término de Vigência:
                      </span>
                      <strong className={`font-mono font-bold ${styles.textColor}`}>
                        {formatDateBR(contrato.data_fim)}
                      </strong>
                    </div>

                    {/* Barra visual de tempo decorrido */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Início: {formatDateBR(contrato.data_inicio)}</span>
                        <span>{item.percentualDecorrido}% decorrido</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${styles.progressColor}`}
                          style={{ width: `${Math.min(100, item.percentualDecorrido)}%` }}
                        />
                      </div>
                    </div>

                    {/* Gestor & Contato rápido */}
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="truncate flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        Gestor: <strong className="text-slate-700 dark:text-slate-300">{contrato.gestor_contrato_nome}</strong>
                      </span>
                      {contrato.telefone && (
                        <a
                          href={`tel:${contrato.telefone}`}
                          className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-0.5 ml-2"
                          title={`Ligar: ${contrato.telefone}`}
                        >
                          <Phone className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Ações Rápidas em 1 Clique */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                    <button
                      id={`btn-aditivo-${contrato.id}`}
                      onClick={() => handleOpenAditivoModal(contrato)}
                      className="px-3 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors flex items-center gap-1.5"
                      title="Emitir termo aditivo e prorrogar data de término"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Emitir Aditivo</span>
                    </button>

                    <button
                      id={`btn-notificar-${contrato.id}`}
                      onClick={() => handleNotifyManager(item)}
                      className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
                      title="Notificar gestor da obra e equipe de compras"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Notificar</span>
                    </button>
                  </div>
                </div>

                {/* Footer contextual: Documentos de suporte SST */}
                {contrato.documentos_sst && contrato.documentos_sst.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Conformidade Documental SST:</span>
                      <span className="text-slate-600 dark:text-slate-300">
                        {validDocs} de {totalDocs} documentos aprovados
                      </span>
                      {pendingOrExpiredDocs > 0 && (
                        <span className="text-red-600 dark:text-red-400 font-bold">
                          ({pendingOrExpiredDocs} pendente/vencido)
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      {contrato.documentos_sst.map(d => (
                        <span
                          key={d.id}
                          className={`px-1.5 py-0.2 rounded text-[9.5px] font-mono uppercase ${
                            d.status === 'aprovado'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                              : d.status === 'vencido'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                          }`}
                          title={`${d.nome_documento} - Validade: ${formatDateBR(d.data_validade)}`}
                        >
                          {d.tipo}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 6. MODAL DE EMISSÃO DE TERMO ADITIVO / PRORROGAÇÃO RÁPIDA */}
      {modalContrato && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Emitir Termo Aditivo de Vigência
                  </h3>
                  <p className="text-xs text-slate-500">
                    {modalContrato.codigo_contrato} - {modalContrato.empresa_nome_fantasia}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalContrato(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informações Atuais */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Obra Alocada:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{modalContrato.obra_nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vigência Atual:</span>
                <span className="font-mono font-bold text-red-600 dark:text-red-400">
                  {formatDateBR(modalContrato.data_inicio)} até {formatDateBR(modalContrato.data_fim)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valor Global Atual:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatBRL(modalContrato.valor_global)}</span>
              </div>
            </div>

            {/* Opções de Prorrogação Rápida */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Selecione o Prazo de Prorrogação:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[30, 60, 90, 180].map((dias) => (
                  <button
                    key={dias}
                    type="button"
                    onClick={() => {
                      setDiasProrrogacao(dias);
                      const d = new Date();
                      d.setDate(d.getDate() + dias);
                      setNovaDataTermino(d.toISOString().split('T')[0]);
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border text-center transition-all ${
                      diasProrrogacao === dias
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                    }`}
                  >
                    +{dias} Dias
                  </button>
                ))}
              </div>

              {/* Data Customizada */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Nova Data de Término da Vigência:
                </label>
                <input
                  type="date"
                  value={novaDataTermino}
                  onChange={(e) => {
                    setNovaDataTermino(e.target.value);
                    setDiasProrrogacao(0);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Acréscimo Financeiro Opcional */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Acréscimo de Valor Global (R$) (Opcional):
                </label>
                <input
                  type="text"
                  value={valorAditivo}
                  onChange={(e) => setValorAditivo(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Justificativa */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Justificativa Técnica do Aditivo:
                </label>
                <textarea
                  rows={2}
                  value={justificativaAditivo}
                  onChange={(e) => setJustificativaAditivo(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalContrato(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAditivo}
                className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar e Prorrogar Vigência</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
