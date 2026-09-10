import React, { useMemo, useState } from 'react';
import { 
  PieChart as PieChartIcon, 
  Wallet, 
  DollarSign, 
  TrendingUp, 
  Building2, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip 
} from 'recharts';
import { Obra } from '../types/erp';

interface BudgetDonutChartCardProps {
  obras: Obra[];
  selectedObraId: string;
  onSelectObra?: (obraId: string) => void;
  onNavigate?: (tab: any) => void;
  onOpenNovaSolicitacao?: () => void;
}

const formatBRL = (val: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(val);
};

const formatShortBRL = (val: number): string => {
  if (val >= 1000000) {
    return `R$ ${(val / 1000000).toFixed(1)}M`;
  }
  if (val >= 1000) {
    return `R$ ${(val / 1000).toFixed(0)}k`;
  }
  return `R$ ${val.toFixed(0)}`;
};

export const BudgetDonutChartCard: React.FC<BudgetDonutChartCardProps> = ({
  obras,
  selectedObraId,
  onSelectObra,
  onNavigate,
  onOpenNovaSolicitacao
}) => {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  // Determine active obra object
  const activeObra = useMemo(() => {
    if (selectedObraId === 'all') return null;
    return obras.find(o => String(o.id) === selectedObraId) || null;
  }, [obras, selectedObraId]);

  // Compute budget figures
  const budgetStats = useMemo(() => {
    if (activeObra) {
      const orcTotal = activeObra.orcamento_total || 0;
      const progresso = activeObra.progresso !== undefined ? activeObra.progresso : 50;
      const comprometido = Math.round(orcTotal * (progresso / 100));
      const disponivel = Math.max(0, orcTotal - comprometido);
      const pctComprometido = orcTotal > 0 ? Math.round((comprometido / orcTotal) * 100) : 0;
      const pctDisponivel = Math.max(0, 100 - pctComprometido);

      return {
        isPortfolio: false,
        obraNome: activeObra.nome,
        orcamentoTotal: orcTotal,
        comprometido,
        disponivel,
        pctComprometido,
        pctDisponivel,
        materiais: activeObra.orcamento_materiais || 0,
        almoxarifado: activeObra.orcamento_almoxarifado || 0,
        servicos: Math.max(0, orcTotal - ((activeObra.orcamento_materiais || 0) + (activeObra.orcamento_almoxarifado || 0)))
      };
    }

    // Consolidated Portfolio
    const orcTotal = obras.reduce((sum, o) => sum + (o.orcamento_total || 0), 0);
    const comprometido = Math.round(obras.reduce((sum, o) => {
      const prog = o.progresso !== undefined ? o.progresso : 50;
      return sum + ((o.orcamento_total || 0) * (prog / 100));
    }, 0));
    const disponivel = Math.max(0, orcTotal - comprometido);
    const pctComprometido = orcTotal > 0 ? Math.round((comprometido / orcTotal) * 100) : 0;
    const pctDisponivel = Math.max(0, 100 - pctComprometido);

    return {
      isPortfolio: true,
      obraNome: 'Portfólio Global Consolidado',
      orcamentoTotal: orcTotal,
      comprometido,
      disponivel,
      pctComprometido,
      pctDisponivel,
      materiais: obras.reduce((s, o) => s + (o.orcamento_materiais || 0), 0),
      almoxarifado: obras.reduce((s, o) => s + (o.orcamento_almoxarifado || 0), 0),
      servicos: Math.max(0, orcTotal - obras.reduce((s, o) => s + ((o.orcamento_materiais || 0) + (o.orcamento_almoxarifado || 0)), 0))
    };
  }, [obras, activeObra]);

  // Chart dataset for Recharts Donut
  const chartData = useMemo(() => [
    {
      name: 'Comprometido',
      value: budgetStats.comprometido,
      pct: budgetStats.pctComprometido,
      color: '#DC2626', // Red-600
      hoverColor: '#B91C1C',
      descricao: 'Verbas já executadas, faturadas ou empenhadas em suprimentos e MDO'
    },
    {
      name: 'Disponível',
      value: budgetStats.disponivel,
      pct: budgetStats.pctDisponivel,
      color: '#10B981', // Emerald-500
      hoverColor: '#059669',
      descricao: 'Saldo remanescente de verba contratual para etapas futuras'
    }
  ], [budgetStats]);

  // Risk status indicator
  const riskStatus = useMemo(() => {
    const pct = budgetStats.pctComprometido;
    if (pct >= 90) {
      return {
        label: 'Atenção Crítica (≥90%)',
        textColor: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-300',
        badge: 'bg-red-600 text-white'
      };
    }
    if (pct >= 75) {
      return {
        label: 'Atenção Orçamentária (75-89%)',
        textColor: 'text-amber-700',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-300',
        badge: 'bg-amber-500 text-white'
      };
    }
    return {
      label: 'Dentro do Limite (<75%)',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-300',
      badge: 'bg-emerald-600 text-white'
    };
  }, [budgetStats.pctComprometido]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isComprometido = data.name === 'Comprometido';

      return (
        <div className="bg-slate-950/95 text-white p-2.5 rounded-lg shadow-xl border border-slate-700 backdrop-blur-md text-[9px] min-w-[190px] z-50">
          <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: data.color }} 
              />
              <span className="font-bold text-white uppercase text-[8.5px]">
                {data.name}
              </span>
            </div>
            <span className={`text-[7.5px] px-1.5 py-0.2 rounded font-mono font-bold ${
              isComprometido ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {data.pct}%
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center bg-slate-900 px-1.5 py-1 rounded">
              <span className="text-slate-400">Montante Total:</span>
              <span className="font-mono font-black text-slate-100 text-[10px]">
                {formatBRL(data.value)}
              </span>
            </div>
            <p className="text-[7.5px] text-slate-400 italic leading-tight pt-0.5">
              {data.descricao}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      id="budget-donut-chart-card"
      className="bg-white p-3 rounded-md border border-slate-200 shadow-2xs transition-all hover:border-slate-300"
    >
      {/* 1. Header with Title, Obra Badge and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-red-50 border border-red-200 text-red-700 flex items-center justify-center shrink-0 shadow-2xs">
            <PieChartIcon className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-black text-slate-900 text-xs tracking-tight uppercase">
                Status do Orçamento das Obras
              </h3>
              <span className="text-[7.5px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">
                Comprometido vs. Disponível
              </span>
              <span className={`text-[7px] font-bold px-1.5 py-0.2 rounded-full uppercase ${riskStatus.badge}`}>
                {riskStatus.label}
              </span>
            </div>
            <span className="text-[8px] text-slate-400 block mt-0.5">
              Alinhado ao filtro de obra selecionado no menu superior: <strong className="text-slate-700 font-semibold">{budgetStats.obraNome}</strong>
            </span>
          </div>
        </div>

        {/* Quick Obra Filter Selector & Action */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {onSelectObra && (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
              <Filter className="w-2.5 h-2.5 text-slate-500" />
              <select
                id="budget-donut-obra-filter"
                value={selectedObraId}
                onChange={(e) => onSelectObra(e.target.value)}
                className="text-[8px] font-bold bg-transparent text-slate-800 focus:outline-none cursor-pointer"
                title="Filtrar canteiro para o gráfico de rosca"
              >
                <option value="all">Portfólio Global (Todas as Obras)</option>
                {obras.map(o => (
                  <option key={o.id} value={String(o.id)}>
                    {o.nome} ({o.progresso !== undefined ? `${o.progresso}%` : '50%'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {onNavigate && (
            <button
              onClick={() => onNavigate('obras')}
              className="text-[7.5px] font-bold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100/60 border border-red-200 rounded px-2 py-0.5 flex items-center gap-0.5 transition-colors cursor-pointer"
            >
              <span>Gerenciar Obras</span>
              <ChevronRight className="w-2 h-2" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Content Grid: Donut Chart on Left, KPI Cards and Breakdown on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        
        {/* Left Column: Recharts Donut Ring with Center Metric (Cols 5) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50/70 border border-slate-100">
          <div className="relative w-full h-[180px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <RechartsTooltip content={<CustomTooltip />} />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2}
                  onMouseEnter={(_, index) => setHoveredSlice(chartData[index].name)}
                  onMouseLeave={() => setHoveredSlice(null)}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Donut Stat */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                {hoveredSlice ? hoveredSlice : 'Executado'}
              </span>
              <span className="text-xl font-black text-slate-900 tracking-tight leading-none mt-0.5">
                {hoveredSlice === 'Disponível' 
                  ? `${budgetStats.pctDisponivel}%` 
                  : `${budgetStats.pctComprometido}%`}
              </span>
              <span className="text-[7px] text-slate-500 font-medium mt-0.5">
                {hoveredSlice === 'Disponível' ? 'Saldo Livre' : 'Comprometido'}
              </span>
            </div>
          </div>

          {/* Mini Legend Below Chart */}
          <div className="flex items-center justify-center gap-3 mt-1 w-full pt-1.5 border-t border-slate-200/80">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-red-600 shrink-0" />
              <span className="text-[8px] font-bold text-slate-700">Comprometido</span>
              <span className="text-[8px] font-mono font-black text-red-700 bg-red-50 px-1 rounded">
                {budgetStats.pctComprometido}%
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 shrink-0" />
              <span className="text-[8px] font-bold text-slate-700">Disponível</span>
              <span className="text-[8px] font-mono font-black text-emerald-700 bg-emerald-50 px-1 rounded">
                {budgetStats.pctDisponivel}%
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Key Financial Stat Blocks (Cols 7) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-2">
          
          {/* Top 3 KPI Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Teto Total */}
            <div className="bg-slate-50 p-2 rounded border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[7px] font-bold uppercase tracking-wider">Teto Orçado</span>
                <DollarSign className="w-2.5 h-2.5 text-slate-400" />
              </div>
              <div className="mt-1">
                <span className="text-xs font-black text-slate-900 block truncate leading-tight">
                  {formatBRL(budgetStats.orcamentoTotal)}
                </span>
                <span className="text-[7px] text-slate-400">100% da verba aprovada</span>
              </div>
            </div>

            {/* Comprometido */}
            <div className="bg-red-50/80 p-2 rounded border border-red-200 flex flex-col justify-between">
              <div className="flex items-center justify-between text-red-700">
                <span className="text-[7px] font-bold uppercase tracking-wider">Comprometido</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
              </div>
              <div className="mt-1">
                <span className="text-xs font-black text-red-900 block truncate leading-tight">
                  {formatBRL(budgetStats.comprometido)}
                </span>
                <span className="text-[7px] font-bold text-red-700">
                  {budgetStats.pctComprometido}% do teto total
                </span>
              </div>
            </div>

            {/* Saldo Disponível */}
            <div className="bg-emerald-50/80 p-2 rounded border border-emerald-200 flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-700">
                <span className="text-[7px] font-bold uppercase tracking-wider">Saldo Disponível</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <div className="mt-1">
                <span className="text-xs font-black text-emerald-900 block truncate leading-tight">
                  {formatBRL(budgetStats.disponivel)}
                </span>
                <span className="text-[7px] font-bold text-emerald-700">
                  {budgetStats.pctDisponivel}% remanescente
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar Representation */}
          <div className="bg-white p-2 rounded border border-slate-200">
            <div className="flex justify-between items-center text-[7.5px] font-bold text-slate-700 mb-1">
              <span>Proporção de Consumo Financeiro</span>
              <span className="font-mono">
                {formatShortBRL(budgetStats.comprometido)} de {formatShortBRL(budgetStats.orcamentoTotal)}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex shadow-inner">
              <div 
                className="bg-red-600 h-full transition-all duration-500"
                style={{ width: `${budgetStats.pctComprometido}%` }}
                title={`Comprometido: ${budgetStats.pctComprometido}%`}
              />
              <div 
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${budgetStats.pctDisponivel}%` }}
                title={`Disponível: ${budgetStats.pctDisponivel}%`}
              />
            </div>
            <div className="flex justify-between text-[6.5px] text-slate-400 mt-1">
              <span>0% Inicial</span>
              <span className="text-slate-600 font-semibold">{budgetStats.pctComprometido}% Consumido</span>
              <span>100% Teto</span>
            </div>
          </div>

          {/* Obra Quick Navigation Pills / Portfolio Multi-Site Compare */}
          <div className="pt-0.5">
            <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Alternar Canteiro / Comparativo de Orçamento:
            </span>
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {/* All Obras Button */}
              <button
                onClick={() => onSelectObra && onSelectObra('all')}
                className={`px-2 py-0.5 rounded text-[7.5px] font-bold shrink-0 transition-colors flex items-center gap-1 cursor-pointer ${
                  selectedObraId === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Building2 className="w-2.5 h-2.5" />
                <span>Portfólio Todo ({obras.length})</span>
              </button>

              {/* Individual Obra Pills */}
              {obras.map(obra => {
                const isSelected = String(obra.id) === selectedObraId;
                const prog = obra.progresso !== undefined ? obra.progresso : 50;

                return (
                  <button
                    key={obra.id}
                    onClick={() => onSelectObra && onSelectObra(String(obra.id))}
                    className={`px-2 py-0.5 rounded text-[7.5px] font-semibold shrink-0 transition-colors flex items-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-red-700 text-white font-bold shadow-2xs ring-1 ring-red-300'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${prog >= 90 ? 'bg-red-500' : prog >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <span className="truncate max-w-[110px]">{obra.nome}</span>
                    <span className={`text-[6.5px] font-mono px-1 rounded ${isSelected ? 'bg-red-800 text-red-100' : 'bg-slate-100 text-slate-600'}`}>
                      {prog}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
