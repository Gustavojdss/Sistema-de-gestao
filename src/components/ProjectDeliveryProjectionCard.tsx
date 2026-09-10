import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Zap, 
  ArrowRight, 
  Sliders, 
  ChevronRight, 
  Building2, 
  Search, 
  Filter, 
  Info, 
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  FastForward,
  UserCheck
} from 'lucide-react';
import { Obra } from '../types/erp';

interface ProjectDeliveryProjectionCardProps {
  obras: Obra[];
  onNavigate?: (tab: string) => void;
  onSelectObra?: (obra: Obra) => void;
  onSendNotification?: (title: string, message: string, recipientRole: string) => void;
}

export interface ObraDeliveryProjection {
  obra: Obra;
  dataInicio: Date;
  dataPrevisaoOriginal: Date;
  dataInicioStr: string;
  dataPrevisaoOriginalStr: string;
  progressoAtual: number;
  diasDecorridos: number;
  diasTotaisPlanejados: number;
  diasRestantesPlanejados: number;
  diasPorPontoPct: number; // Média de dias por ponto percentual de evolução
  pctPorDia: number;
  pctPorMes: number;
  pctRestante: number;
  diasRestantesProjetados: number;
  dataProjetada: Date;
  dataProjetadaStr: string;
  desvioDias: number; // >0 atraso, <0 adiantado
  statusPrazo: 'adiantado' | 'no_prazo' | 'atraso_moderado' | 'atraso_critico' | 'concluida';
  diasPorPontoNecessario: number;
  aceleracaoNecessariaPct: number;
}

export const ProjectDeliveryProjectionCard: React.FC<ProjectDeliveryProjectionCardProps> = ({
  obras,
  onNavigate,
  onSelectObra,
  onSendNotification
}) => {
  // Filter and simulation states
  const [filterStatus, setFilterStatus] = useState<'todos' | 'atraso' | 'no_prazo' | 'concluida'>('todos');
  const [sortBy, setSortBy] = useState<'maior_atraso' | 'maior_ritmo' | 'progresso' | 'data_projetada'>('maior_atraso');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [aceleracaoSimuladaPct, setAceleracaoSimuladaPct] = useState<number>(0); // 0%, 15%, 25%, 50% boost
  const [selectedObraId, setSelectedObraId] = useState<number | null>(null);
  const [notificationSentObraId, setNotificationSentObraId] = useState<number | null>(null);

  // Formatting helpers
  const formatDateBR = (d: Date) => {
    if (isNaN(d.getTime())) return '--/--/----';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const parseDateSafe = (dateStr?: string, defaultMonthsOffset: number = 0): Date => {
    const today = new Date();
    if (!dateStr) {
      const fallback = new Date(today);
      fallback.setMonth(today.getMonth() + defaultMonthsOffset);
      return fallback;
    }
    const cleanStr = dateStr.trim();
    // Check if YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(cleanStr)) {
      const parts = cleanStr.split('T')[0].split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      if (!isNaN(d.getTime())) return d;
    }
    // Check if DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}/.test(cleanStr)) {
      const parts = cleanStr.split('/');
      const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      if (!isNaN(d.getTime())) return d;
    }
    const parsed = new Date(cleanStr);
    if (!isNaN(parsed.getTime())) return parsed;

    const fallback = new Date(today);
    fallback.setMonth(today.getMonth() + defaultMonthsOffset);
    return fallback;
  };

  // Base date for calculation
  const today = useMemo(() => new Date(), []);

  // Compute projections for each obra
  const projections = useMemo<ObraDeliveryProjection[]>(() => {
    return obras.map(obra => {
      const isConcluida = obra.status === 'concluida' || (typeof obra.progresso === 'number' && obra.progresso >= 100);
      const progresso = typeof obra.progresso === 'number' ? obra.progresso : (isConcluida ? 100 : 45);

      const dataInicio = parseDateSafe(obra.data_inicio, -5);
      const dataPrevisaoOriginal = parseDateSafe(obra.data_previsao_termino, 6);

      // Elapsed days since start
      const diffInicioMs = today.getTime() - dataInicio.getTime();
      const diasDecorridos = Math.max(1, Math.round(diffInicioMs / (1000 * 60 * 60 * 24)));

      // Total planned duration in days
      const diffTotalMs = dataPrevisaoOriginal.getTime() - dataInicio.getTime();
      const diasTotaisPlanejados = Math.max(1, Math.round(diffTotalMs / (1000 * 60 * 60 * 24)));

      // Remaining days in original schedule
      const diffRestanteMs = dataPrevisaoOriginal.getTime() - today.getTime();
      const diasRestantesPlanejados = Math.round(diffRestanteMs / (1000 * 60 * 60 * 24));

      // 1. Ritmo de evolução: Média de dias por ponto percentual (dias / 1% de evolução)
      // Se progresso for 0, usamos a média planejada (diasTotais / 100)
      const diasPorPontoPctBase = progresso > 0 
        ? diasDecorridos / progresso 
        : (diasTotaisPlanejados / 100);

      // Ritmo com simulação de aceleração
      const fatorAceleracao = 1 + (aceleracaoSimuladaPct / 100);
      const diasPorPontoPct = Math.max(0.2, diasPorPontoPctBase / fatorAceleracao);

      const pctPorDia = 1 / diasPorPontoPct;
      const pctPorMes = pctPorDia * 30;

      // 2. Projeção de dias restantes
      const pctRestante = Math.max(0, 100 - progresso);
      const diasRestantesProjetados = isConcluida 
        ? 0 
        : Math.round(pctRestante * diasPorPontoPct);

      // 3. Data projetada de entrega
      const dataProjetada = new Date(today);
      if (!isConcluida) {
        dataProjetada.setDate(today.getDate() + diasRestantesProjetados);
      } else {
        dataProjetada.setTime(dataPrevisaoOriginal.getTime());
      }

      // 4. Desvio comparado com a data de previsão original (em dias)
      const desvioDias = isConcluida 
        ? 0 
        : Math.round((dataProjetada.getTime() - dataPrevisaoOriginal.getTime()) / (1000 * 60 * 60 * 24));

      // 5. Ritmo necessário para entregar na previsão original
      const diasPorPontoNecessario = diasRestantesPlanejados > 0 && pctRestante > 0
        ? diasRestantesPlanejados / pctRestante
        : 0;

      const aceleracaoNecessariaPct = diasPorPontoNecessario > 0 && diasPorPontoPctBase > diasPorPontoNecessario
        ? Math.round(((diasPorPontoPctBase / diasPorPontoNecessario) - 1) * 100)
        : 0;

      // Status classification
      let statusPrazo: 'adiantado' | 'no_prazo' | 'atraso_moderado' | 'atraso_critico' | 'concluida' = 'no_prazo';
      if (isConcluida) {
        statusPrazo = 'concluida';
      } else if (desvioDias > 30) {
        statusPrazo = 'atraso_critico';
      } else if (desvioDias > 0) {
        statusPrazo = 'atraso_moderado';
      } else if (desvioDias < -7) {
        statusPrazo = 'adiantado';
      } else {
        statusPrazo = 'no_prazo';
      }

      return {
        obra,
        dataInicio,
        dataPrevisaoOriginal,
        dataInicioStr: formatDateBR(dataInicio),
        dataPrevisaoOriginalStr: formatDateBR(dataPrevisaoOriginal),
        progressoAtual: progresso,
        diasDecorridos,
        diasTotaisPlanejados,
        diasRestantesPlanejados,
        diasPorPontoPct: Number(diasPorPontoPct.toFixed(2)),
        pctPorDia: Number(pctPorDia.toFixed(2)),
        pctPorMes: Number(pctPorMes.toFixed(1)),
        pctRestante,
        diasRestantesProjetados,
        dataProjetada,
        dataProjetadaStr: formatDateBR(dataProjetada),
        desvioDias,
        statusPrazo,
        diasPorPontoNecessario: Number(diasPorPontoNecessario.toFixed(2)),
        aceleracaoNecessariaPct
      };
    });
  }, [obras, today, aceleracaoSimuladaPct]);

  // Global Portfolio Delivery Stats
  const globalDeliveryStats = useMemo(() => {
    const ativas = projections.filter(p => p.statusPrazo !== 'concluida');
    const totalAtivas = ativas.length || 1;

    const atrasadas = ativas.filter(p => p.desvioDias > 0);
    const noPrazoOuAdiantadas = ativas.filter(p => p.desvioDias <= 0);
    const concluidas = projections.filter(p => p.statusPrazo === 'concluida');

    const mediaDiasPorPonto = ativas.reduce((sum, p) => sum + p.diasPorPontoPct, 0) / totalAtivas;
    const mediaPctMes = ativas.reduce((sum, p) => sum + p.pctPorMes, 0) / totalAtivas;

    const maiorAtraso = atrasadas.reduce((max, p) => p.desvioDias > max ? p.desvioDias : max, 0);
    const maiorFolga = noPrazoOuAdiantadas.reduce((max, p) => Math.abs(p.desvioDias) > max ? Math.abs(p.desvioDias) : max, 0);

    const mediaDesvioDias = ativas.reduce((sum, p) => sum + p.desvioDias, 0) / totalAtivas;

    return {
      totalObras: projections.length,
      totalAtivas: ativas.length,
      countAtrasadas: atrasadas.length,
      pctAtrasadas: Math.round((atrasadas.length / totalAtivas) * 100),
      countNoPrazo: noPrazoOuAdiantadas.length,
      pctNoPrazo: Math.round((noPrazoOuAdiantadas.length / totalAtivas) * 100),
      countConcluidas: concluidas.length,
      mediaDiasPorPonto: Number(mediaDiasPorPonto.toFixed(1)),
      mediaPctMes: Number(mediaPctMes.toFixed(1)),
      maiorAtraso,
      maiorFolga,
      mediaDesvioDias: Math.round(mediaDesvioDias)
    };
  }, [projections]);

  // Filtered and Sorted list
  const filteredProjections = useMemo(() => {
    let result = [...projections];

    // Status filter
    if (filterStatus === 'atraso') {
      result = result.filter(p => p.desvioDias > 0 && p.statusPrazo !== 'concluida');
    } else if (filterStatus === 'no_prazo') {
      result = result.filter(p => p.desvioDias <= 0 && p.statusPrazo !== 'concluida');
    } else if (filterStatus === 'concluida') {
      result = result.filter(p => p.statusPrazo === 'concluida');
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.obra.nome.toLowerCase().includes(q) ||
        (p.obra.gestor_nome && p.obra.gestor_nome.toLowerCase().includes(q)) ||
        (p.obra.endereco && p.obra.endereco.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'maior_atraso') {
        return b.desvioDias - a.desvioDias;
      }
      if (sortBy === 'maior_ritmo') {
        return a.diasPorPontoPct - b.diasPorPontoPct; // Menos dias por ponto = mais rápido
      }
      if (sortBy === 'progresso') {
        return b.progressoAtual - a.progressoAtual;
      }
      if (sortBy === 'data_projetada') {
        return a.dataProjetada.getTime() - b.dataProjetada.getTime();
      }
      return 0;
    });

    return result;
  }, [projections, filterStatus, searchTerm, sortBy]);

  // Handle Dispatch Alert Notification for Delayed Obra
  const handleNotifyDelayedObra = (p: ObraDeliveryProjection) => {
    const title = `Alerta de Cronograma: ${p.obra.nome}`;
    const msg = `Projeção de entrega para ${p.dataProjetadaStr} (${p.desvioDias > 0 ? `+${p.desvioDias} dias de atraso` : 'no prazo'}). Ritmo atual de ${p.diasPorPontoPct} dias/1%. Aceleração necessária estimada: +${p.aceleracaoNecessariaPct}%.`;
    
    if (onSendNotification) {
      onSendNotification(title, msg, 'gestor');
    }
    setNotificationSentObraId(p.obra.id);
    setTimeout(() => setNotificationSentObraId(null), 3000);
  };

  return (
    <div 
      id="card-projecao-entrega-obras"
      className="bg-white rounded-lg border border-slate-200 shadow-2xs p-3 transition-all relative overflow-hidden"
    >
      {/* Header with Title & Quick Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center justify-center shrink-0 shadow-2xs">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight">
                Projeção de Entrega por Ritmo de Evolução
              </h3>
              <span className="text-[7.5px] font-black px-1.5 py-0.2 rounded bg-slate-900 text-amber-300 font-mono uppercase tracking-wider">
                Média de Dias por Ponto Percentual (dias / 1%)
              </span>
            </div>
            <p className="text-[8px] text-slate-500 mt-0.5">
              Estimativa preditiva de conclusão calculada pela velocidade real de avanço físico comparada à data contratual original
            </p>
          </div>
        </div>

        {/* Global Action & Navigation */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            id="btn-nav-cronograma-obras"
            onClick={() => onNavigate && onNavigate('obras')}
            className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-red-700 text-white rounded text-[8px] font-bold transition-all cursor-pointer shadow-2xs"
            title="Acessar Módulo Completo de Obras"
          >
            <span>Ver Cronogramas</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Global Predictive Portfolio KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2.5">
        {/* Metric 1: Obras no Prazo */}
        <div className="bg-emerald-50/70 p-2 rounded border border-emerald-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-bold uppercase text-emerald-900">No Prazo / Adiantadas</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-0.5">
            <div className="flex items-baseline gap-1">
              <span className="text-xs sm:text-sm font-black text-emerald-950 font-mono leading-none">
                {globalDeliveryStats.countNoPrazo}
              </span>
              <span className="text-[7.5px] font-bold text-emerald-800">
                ({globalDeliveryStats.pctNoPrazo}% ativas)
              </span>
            </div>
            <span className="text-[6.5px] text-emerald-700 mt-0.5 block font-mono">
              Folga máx: {globalDeliveryStats.maiorFolga} dias
            </span>
          </div>
        </div>

        {/* Metric 2: Obras com Atraso Projetado */}
        <div className={`p-2 rounded border flex flex-col justify-between ${
          globalDeliveryStats.countAtrasadas > 0 
            ? 'bg-red-50/80 border-red-200 text-red-950' 
            : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-bold uppercase text-red-900">Risco de Atraso</span>
            {globalDeliveryStats.countAtrasadas > 0 && (
              <span className="px-1 py-0.2 rounded bg-red-600 text-white text-[6px] font-black uppercase">
                Atenção
              </span>
            )}
          </div>
          <div className="mt-0.5">
            <div className="flex items-baseline gap-1">
              <span className="text-xs sm:text-sm font-black text-red-700 font-mono leading-none">
                {globalDeliveryStats.countAtrasadas}
              </span>
              <span className="text-[7.5px] font-bold text-red-800">
                ({globalDeliveryStats.pctAtrasadas}% ativas)
              </span>
            </div>
            <span className="text-[6.5px] text-red-700 mt-0.5 block font-mono font-bold">
              Desvio máx: +{globalDeliveryStats.maiorAtraso} dias
            </span>
          </div>
        </div>

        {/* Metric 3: Ritmo Médio Geral */}
        <div className="bg-slate-50 p-2 rounded border border-slate-200 flex flex-col justify-between">
          <span className="text-[7px] font-bold uppercase text-slate-500">Ritmo Médio Portfólio</span>
          <div className="mt-0.5">
            <div className="flex items-baseline gap-1">
              <span className="text-xs sm:text-sm font-black text-slate-900 font-mono leading-none">
                {globalDeliveryStats.mediaDiasPorPonto}
              </span>
              <span className="text-[7px] text-slate-600 font-bold">dias / 1%</span>
            </div>
            <span className="text-[6.5px] text-slate-500 mt-0.5 block font-mono">
              Equivale a ~{globalDeliveryStats.mediaPctMes}% ao mês
            </span>
          </div>
        </div>

        {/* Metric 4: Desvio Médio Ponderado */}
        <div className="bg-slate-900 text-white p-2 rounded border border-slate-800 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-bold uppercase text-slate-300">Desvio Médio Geral</span>
            <span className={`text-[6.5px] font-bold px-1 py-0.2 rounded ${
              globalDeliveryStats.mediaDesvioDias <= 0 ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-950'
            }`}>
              {globalDeliveryStats.mediaDesvioDias <= 0 ? 'No Cronograma' : `+${globalDeliveryStats.mediaDesvioDias}d`}
            </span>
          </div>
          <div className="mt-0.5">
            <span className={`text-xs sm:text-sm font-black font-mono block leading-none ${
              globalDeliveryStats.mediaDesvioDias <= 0 ? 'text-emerald-400' : 'text-amber-300'
            }`}>
              {globalDeliveryStats.mediaDesvioDias <= 0 
                ? `${Math.abs(globalDeliveryStats.mediaDesvioDias)} dias adiantado`
                : `+${globalDeliveryStats.mediaDesvioDias} dias médio`}
            </span>
            <span className="text-[6.5px] text-slate-400 mt-0.5 block font-mono">
              {globalDeliveryStats.totalObras} projetos sob vigilância
            </span>
          </div>
        </div>
      </div>

      {/* Simulator Ribbon: Test Productivity / Shift Boost */}
      <div className="bg-amber-50/70 border border-amber-200/90 rounded-md p-2 mb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-bold">
            <FastForward className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[8.5px] font-extrabold text-amber-950">
                Simulador Preditivo de Aceleração de Ritmo
              </span>
              {aceleracaoSimuladaPct > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-amber-600 text-white font-mono text-[6.5px] font-bold animate-pulse">
                  +{aceleracaoSimuladaPct}% de produtividade simulada
                </span>
              )}
            </div>
            <p className="text-[7px] text-amber-800">
              Teste o impacto de turnos extras, reforço de equipes ou aumento de efetivo nas datas projetadas de conclusão
            </p>
          </div>
        </div>

        {/* Acceleration Boost Buttons */}
        <div className="flex items-center gap-1 shrink-0 bg-white p-0.5 rounded border border-amber-300 text-[7px] font-bold">
          <span className="text-[6.5px] text-slate-500 px-1">Reforço:</span>
          {[
            { pct: 0, label: 'Ritmo Real (0%)' },
            { pct: 15, label: '+15%' },
            { pct: 25, label: '+25%' },
            { pct: 50, label: '+50%' }
          ].map(b => (
            <button
              key={b.pct}
              onClick={() => setAceleracaoSimuladaPct(b.pct)}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                aceleracaoSimuladaPct === b.pct 
                  ? 'bg-slate-900 text-amber-300 shadow-2xs font-black' 
                  : 'text-slate-700 hover:bg-amber-50'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Control Bar: Filter, Sort & Search */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 bg-slate-50 rounded-md border border-slate-200 mb-2 text-[7.5px]">
        {/* Left: Filter Buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="font-extrabold text-slate-600 uppercase">Filtrar:</span>
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded border border-slate-200">
            <button
              onClick={() => setFilterStatus('todos')}
              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                filterStatus === 'todos' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({projections.length})
            </button>
            <button
              onClick={() => setFilterStatus('atraso')}
              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterStatus === 'atraso' ? 'bg-red-600 text-white shadow-2xs font-extrabold' : 'text-red-700 hover:bg-red-100/50'
              }`}
            >
              <AlertTriangle className="w-2 h-2" />
              <span>Risco de Atraso ({globalDeliveryStats.countAtrasadas})</span>
            </button>
            <button
              onClick={() => setFilterStatus('no_prazo')}
              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterStatus === 'no_prazo' ? 'bg-emerald-700 text-white shadow-2xs font-extrabold' : 'text-emerald-800 hover:bg-emerald-100/50'
              }`}
            >
              <CheckCircle2 className="w-2 h-2" />
              <span>No Prazo ({globalDeliveryStats.countNoPrazo})</span>
            </button>
            <button
              onClick={() => setFilterStatus('concluida')}
              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                filterStatus === 'concluida' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Concluídas ({globalDeliveryStats.countConcluidas})
            </button>
          </div>
        </div>

        {/* Right: Sort & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sort By */}
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-500">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-slate-200 text-slate-900 rounded px-1.5 py-0.5 font-bold focus:ring-1 focus:ring-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="maior_atraso">Maior Atraso Projetado</option>
              <option value="maior_ritmo">Maior Ritmo (Mais Rápida)</option>
              <option value="progresso">Maior Progresso Físico</option>
              <option value="data_projetada">Data de Entrega mais Próxima</option>
            </select>
          </div>

          {/* Quick Search */}
          <div className="relative flex items-center">
            <Search className="w-2.5 h-2.5 text-slate-400 absolute left-1.5" />
            <input
              type="text"
              placeholder="Buscar canteiro ou gestor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-5 pr-2 py-0.5 bg-white border border-slate-200 rounded text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 w-36 sm:w-44 text-[7px]"
            />
          </div>
        </div>
      </div>

      {/* Main List of Obras with Delivery Projections */}
      <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-0.5">
        {filteredProjections.map((p) => {
          const isSelected = selectedObraId === p.obra.id;
          const isAtRisk = p.desvioDias > 0 && p.statusPrazo !== 'concluida';
          const isNotificationSent = notificationSentObraId === p.obra.id;

          return (
            <div
              key={p.obra.id}
              id={`projecao-item-obra-${p.obra.id}`}
              className={`p-2 rounded-md border transition-all ${
                isSelected 
                  ? 'border-red-600 bg-red-50/30 shadow-xs' 
                  : isAtRisk 
                    ? 'border-red-200/90 bg-red-50/20 hover:border-red-400' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {/* Row 1: Obra Header, Progress Badge & Delay/Praise Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 font-bold ${
                    p.statusPrazo === 'concluida' ? 'bg-slate-100 text-slate-700' :
                    p.statusPrazo === 'atraso_critico' ? 'bg-red-600 text-white ring-2 ring-red-200' :
                    p.statusPrazo === 'atraso_moderado' ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-300' :
                    'bg-emerald-600 text-white'
                  }`}>
                    {p.statusPrazo === 'concluida' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                     p.statusPrazo === 'atraso_critico' ? <ShieldAlert className="w-3.5 h-3.5" /> :
                     p.statusPrazo === 'atraso_moderado' ? <AlertTriangle className="w-3.5 h-3.5" /> :
                     <Zap className="w-3.5 h-3.5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-[9.5px] truncate">
                        {p.obra.nome}
                      </span>
                      <span className="text-[6.5px] px-1 py-0.2 rounded font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {p.progressoAtual}% físico
                      </span>
                      {p.obra.gestor_nome && (
                        <span className="text-[6.5px] text-slate-500 flex items-center gap-0.5">
                          <UserCheck className="w-2 h-2 text-slate-400" />
                          {p.obra.gestor_nome}
                        </span>
                      )}
                    </div>
                    <span className="text-[7px] text-slate-500 block truncate">
                      Início: <strong>{p.dataInicioStr}</strong> ({p.diasDecorridos} dias decorridos) · {p.obra.endereco || 'Canteiro Principal'}
                    </span>
                  </div>
                </div>

                {/* Right Badges: Comparison Tags */}
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                  {/* Status Badge */}
                  {p.statusPrazo === 'concluida' ? (
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[7px] font-bold border border-slate-300">
                      Obra Concluída
                    </span>
                  ) : p.desvioDias > 0 ? (
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[7px] font-extrabold border border-red-300 flex items-center gap-1">
                      <TrendingDown className="w-2.5 h-2.5 text-red-600" />
                      <span>+{p.desvioDias} dias de atraso estimado</span>
                    </span>
                  ) : p.desvioDias < 0 ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[7px] font-extrabold border border-emerald-300 flex items-center gap-1">
                      <TrendingUp className="w-2.5 h-2.5 text-emerald-700" />
                      <span>{Math.abs(p.desvioDias)} dias de folga (adiantada)</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 text-[7px] font-extrabold border border-blue-300">
                      No Prazo Exato
                    </span>
                  )}

                  {/* Notify Action Button for At-Risk Projects */}
                  {isAtRisk && (
                    <button
                      onClick={() => handleNotifyDelayedObra(p)}
                      disabled={isNotificationSent}
                      className={`px-1.5 py-0.5 rounded text-[6.5px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        isNotificationSent 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-red-800 hover:bg-red-900 text-white shadow-2xs'
                      }`}
                      title="Emitir notificação preventiva ao gestor sobre o desvio de ritmo"
                    >
                      {isNotificationSent ? (
                        <>
                          <CheckCircle2 className="w-2 h-2" />
                          <span>Notificado!</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-2 h-2" />
                          <span>Notificar Gestor</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Zoom Action */}
                  <button
                    onClick={() => {
                      setSelectedObraId(isSelected ? null : p.obra.id);
                      if (onSelectObra) onSelectObra(p.obra);
                    }}
                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 cursor-pointer"
                    title="Detalhes da Obra"
                  >
                    <ChevronRight className={`w-3 h-3 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Row 2: Metrics Grid Comparison (Previsão Original vs Projeção vs Ritmo) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1.5 bg-slate-50/80 rounded border border-slate-100 text-[7px] mb-1.5">
                {/* 1. Previsão Original */}
                <div className="p-1 bg-white rounded border border-slate-200">
                  <span className="text-[6px] font-bold text-slate-500 uppercase block">Previsão Contratual</span>
                  <div className="mt-0.5 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5 text-slate-400" />
                    <strong className="text-[8px] font-mono text-slate-900">{p.dataPrevisaoOriginalStr}</strong>
                  </div>
                  <span className="text-[6px] text-slate-400 block mt-0.2 font-mono">
                    {p.diasRestantesPlanejados > 0 ? `${p.diasRestantesPlanejados} dias restantes orig.` : 'Prazo esgotado'}
                  </span>
                </div>

                {/* 2. Projeção Baseada no Ritmo */}
                <div className={`p-1 rounded border ${
                  p.desvioDias > 0 ? 'bg-red-50/80 border-red-300' : 'bg-emerald-50/80 border-emerald-300'
                }`}>
                  <span className="text-[6px] font-bold uppercase block text-slate-600">
                    Projeção Pelo Ritmo
                  </span>
                  <div className="mt-0.5 flex items-center gap-1">
                    <Clock className={`w-2.5 h-2.5 ${p.desvioDias > 0 ? 'text-red-600' : 'text-emerald-700'}`} />
                    <strong className={`text-[8.5px] font-mono font-black ${
                      p.desvioDias > 0 ? 'text-red-700' : 'text-emerald-900'
                    }`}>
                      {p.dataProjetadaStr}
                    </strong>
                  </div>
                  <span className="text-[6px] text-slate-500 block mt-0.2 font-mono">
                    {p.statusPrazo === 'concluida' ? 'Obra entregue' : `Faltam ~${p.diasRestantesProjetados} dias`}
                  </span>
                </div>

                {/* 3. Ritmo Atual (Dias por 1%) */}
                <div className="p-1 bg-white rounded border border-slate-200">
                  <span className="text-[6px] font-bold text-slate-500 uppercase block">Ritmo Atual de Avanço</span>
                  <div className="mt-0.5 flex items-baseline gap-1">
                    <strong className="text-[8px] font-mono text-slate-900">{p.diasPorPontoPct}</strong>
                    <span className="text-[6.5px] text-slate-600 font-bold">dias / 1%</span>
                  </div>
                  <span className="text-[6px] text-slate-400 block mt-0.2 font-mono">
                    ~{p.pctPorMes}% de avanço mensal
                  </span>
                </div>

                {/* 4. Ritmo Necessário / Meta */}
                <div className="p-1 bg-white rounded border border-slate-200">
                  <span className="text-[6px] font-bold text-slate-500 uppercase block">Ritmo Meta Contratual</span>
                  <div className="mt-0.5 flex items-baseline gap-1">
                    <strong className="text-[8px] font-mono text-slate-800">
                      {p.diasPorPontoNecessario > 0 ? p.diasPorPontoNecessario : '--'}
                    </strong>
                    <span className="text-[6.5px] text-slate-500">dias / 1%</span>
                  </div>
                  <span className={`text-[6px] block mt-0.2 font-mono font-bold ${
                    p.aceleracaoNecessariaPct > 0 ? 'text-red-700' : 'text-emerald-700'
                  }`}>
                    {p.aceleracaoNecessariaPct > 0 
                      ? `Exige +${p.aceleracaoNecessariaPct}% aceleração` 
                      : 'Ritmo suficiente'}
                  </span>
                </div>
              </div>

              {/* Row 3: Visual Progress Timeline Bar */}
              <div className="px-1 py-1">
                <div className="flex items-center justify-between text-[6.5px] font-mono text-slate-400 mb-0.5">
                  <span>Início: {p.dataInicioStr}</span>
                  <span className="text-slate-600 font-bold">Progresso: {p.progressoAtual}%</span>
                  <span>Prev. Original: {p.dataPrevisaoOriginalStr}</span>
                </div>

                {/* Progress Dual-Track */}
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden relative">
                  {/* Real Physical Progress */}
                  <div 
                    className={`h-full rounded-full transition-all ${
                      p.statusPrazo === 'concluida' ? 'bg-slate-600' :
                      p.desvioDias > 30 ? 'bg-red-600' :
                      p.desvioDias > 0 ? 'bg-amber-500' : 'bg-emerald-600'
                    }`}
                    style={{ width: `${p.progressoAtual}%` }}
                  />
                </div>

                {/* Micro Footnote */}
                <div className="flex items-center justify-between text-[6px] text-slate-500 mt-0.5 font-mono">
                  <span>{p.diasDecorridos}d decorridos ({p.pctRestante}% restante)</span>
                  <span className={`font-bold ${p.desvioDias > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                    {p.desvioDias > 0 
                      ? `Estimativa de atraso: ${p.desvioDias} dias após a meta` 
                      : p.statusPrazo === 'concluida' ? 'Concluída' : 'Entrega garantida no prazo'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredProjections.length === 0 && (
          <div className="text-center py-6 bg-slate-50 rounded border border-dashed border-slate-200 text-[8px] text-slate-500">
            Nenhuma obra encontrada para os filtros selecionados.
          </div>
        )}
      </div>

      {/* Footer Meta & Calculation Explanation */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[7px] text-slate-500 gap-1">
        <div className="flex items-center gap-1">
          <Info className="w-2.5 h-2.5 text-slate-400 shrink-0" />
          <span>
            <strong>Fórmula Preditiva:</strong> Dias por 1% = <em>(Dias Decorridos / % Físico Real)</em> · Projeção = <em>Hoje + (% Restante × Dias por 1%)</em>.
          </span>
        </div>
        <span className="font-mono text-slate-400">
          Base temporal ativa · {obras.length} obras processadas
        </span>
      </div>
    </div>
  );
};
