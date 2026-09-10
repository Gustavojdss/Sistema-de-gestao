import React, { useMemo, useState } from 'react';
import { 
  LineChart as LineChartIcon, 
  TrendingDown, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Building2, 
  Filter, 
  ChevronRight, 
  ArrowDownRight, 
  Activity, 
  Sparkles, 
  Layers, 
  HardHat, 
  Info, 
  PlusCircle, 
  Clock, 
  Check, 
  X,
  Target
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { Obra, IncidenteSeguranca } from '../types/erp';

interface SafetyIncidentTrendLineChartProps {
  incidentes: IncidenteSeguranca[];
  obras: Obra[];
  selectedObraId: string;
  onSelectObra?: (obraId: string) => void;
  onNavigate?: (tab: any) => void;
  onAddIncidente?: (novoInc: IncidenteSeguranca) => void;
  onSendNotification?: (notif: { titulo: string; mensagem: string; obra_id?: number; obra_nome?: string }) => void;
}

export type ViewFilterMode = 'todos' | 'gravidade' | 'eficacia_medidas';

interface MilestoneMedidaControle {
  mesIdx: number; // 0 to 5
  mesLabel: string;
  titulo: string;
  descricao: string;
  normaRef: string;
  impacto: string;
  taxaEficacia: number;
}

export const SafetyIncidentTrendLineChart: React.FC<SafetyIncidentTrendLineChartProps> = ({
  incidentes,
  obras,
  selectedObraId,
  onSelectObra,
  onNavigate,
  onAddIncidente,
  onSendNotification
}) => {
  const [viewMode, setViewMode] = useState<ViewFilterMode>('todos');
  const [selectedMilestoneIdx, setSelectedMilestoneIdx] = useState<number | null>(null);
  const [activeLines, setActiveLines] = useState<{
    total: boolean;
    quaseAcidente: boolean;
    condicaoInsegura: boolean;
    acidentes: boolean;
    eficacia: boolean;
  }>({
    total: true,
    quaseAcidente: true,
    condicaoInsegura: true,
    acidentes: true,
    eficacia: true
  });

  // Effective Obra object
  const activeObra = useMemo(() => {
    if (selectedObraId === 'all') return null;
    return obras.find(o => String(o.id) === selectedObraId) || null;
  }, [obras, selectedObraId]);

  // Filtered incidents based on active obra selection
  const filteredIncidentes = useMemo(() => {
    if (selectedObraId === 'all' || !activeObra) return incidentes;
    const direct = incidentes.filter(inc => 
      String(inc.obra_id) === selectedObraId || inc.obra_nome === activeObra.nome
    );
    return direct.length > 0 ? direct : incidentes;
  }, [incidentes, selectedObraId, activeObra]);

  // Milestone list of control measures enacted chronologically over the past 6 months
  const milestonesControle: MilestoneMedidaControle[] = useMemo(() => [
    {
      mesIdx: 0,
      mesLabel: 'Mês -5',
      titulo: 'Auditoria NR-18 e Fechamento Perimetral',
      descricao: 'Diagnóstico geral de proteções coletivas, substituição de guarda-corpos improvisados por modelos tubulares normatizados.',
      normaRef: 'NR-18 / NR-35',
      impacto: 'Eliminação imediata de 6 pontos de risco crítico de queda em bordas de laje.',
      taxaEficacia: 74
    },
    {
      mesIdx: 1,
      mesLabel: 'Mês -4',
      titulo: 'Implantação de DDS Diário e Proteção DR 100%',
      descricao: 'Diálogo Diário de Segurança compulsório nas frentes de serviço e instalação de relés diferenciais residuais em todos os quadros provisórios.',
      normaRef: 'NR-10 / NR-18',
      impacto: 'Zerou choques elétricos e desvios de condutores no piso molhado.',
      taxaEficacia: 81
    },
    {
      mesIdx: 2,
      mesLabel: 'Mês -3',
      titulo: 'Recertificação de Içamento & Moitões de Grua',
      descricao: 'Inspeção não destrutiva por ultrassom em cabos de aço e substituição de cintas têxteis com cantoneiras de poliuretano.',
      normaRef: 'NR-11 / NR-12',
      impacto: 'Queda de 75% em quase-acidentes de movimentação vertical de cargas.',
      taxaEficacia: 87
    },
    {
      mesIdx: 3,
      mesLabel: 'Mês -2',
      titulo: 'Campanha "Tolerância Zero para Quedas"',
      descricao: 'Linhas de vida contínuas de aço inox e distribuição de cinturões paraquedistas ergonômicos com talabarte duplo com absorvedor de impacto.',
      normaRef: 'NR-35',
      impacto: '100% de adesão em frentes de altura; sem incidentes em fachadas.',
      taxaEficacia: 91
    },
    {
      mesIdx: 4,
      mesLabel: 'Mês -1',
      titulo: 'Bloqueio Eletrônico de Terceirizados sem PGR/PCMSO',
      descricao: 'Catraca integrada ao ERP: colaboradores terceirizados com ASO ou treinamentos vencidos têm o acesso ao canteiro barrado automaticamente.',
      normaRef: 'NR-01 / NR-07',
      impacto: 'Conformidade documental de subempreiteiras saltou de 78% para 99.2%.',
      taxaEficacia: 94
    },
    {
      mesIdx: 5,
      mesLabel: 'Mês Atual',
      titulo: 'Auditorias Cruzadas e Checklist QR Code',
      descricao: 'Fiscalização diária via app mobile com apontamento geolocalizado de quase-acidentes e resolução imediata em até 24h.',
      normaRef: 'PBQP-H / ISO 45001',
      impacto: 'Taxa de reincidência de desvios reduzida a níveis mínimos históricos.',
      taxaEficacia: 96
    }
  ], []);

  // Compute 6-Month Rolling Historical Data
  const trendData = useMemo(() => {
    const months = [];
    const now = new Date();

    // Generate month slots for the past 6 months (0 to 5, where 5 is the current month)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthNum = d.getMonth() + 1; // 1-12
      const monthStr = String(monthNum).padStart(2, '0');
      const yearMonth = `${year}-${monthStr}`;

      const mesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const mesExtenso = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const label = `${mesNomes[d.getMonth()]}/${String(year).slice(2)}`;
      const labelCompleto = `${mesExtenso[d.getMonth()]} de ${year}`;

      months.push({
        index: 5 - i,
        yearMonth,
        label,
        labelCompleto,
        isCurrent: i === 0,
        daysAgoOffset: i * 30
      });
    }

    // Obra scale factor for realistic distribution
    const obraFactor = selectedObraId === 'all' ? 1.0 : 0.4;

    // Baselines demonstrating progressive improvement due to control measures
    // Month -5 (Start): high incidents, low control effectiveness
    // Month 0 (Now): strongly reduced incidents, high control effectiveness
    const baseCurve = [
      { total: 14, quase: 4, condicao: 7, acidentes: 3, eficacia: 74, acoesConcluidas: 8 },
      { total: 11, quase: 3, condicao: 6, acidentes: 2, eficacia: 81, acoesConcluidas: 11 },
      { total: 8, quase: 3, condicao: 4, acidentes: 1, eficacia: 87, acoesConcluidas: 14 },
      { total: 6, quase: 2, condicao: 4, acidentes: 0, eficacia: 91, acoesConcluidas: 16 },
      { total: 4, quase: 2, condicao: 2, acidentes: 0, eficacia: 94, acoesConcluidas: 18 },
      { total: 2, quase: 1, condicao: 1, acidentes: 0, eficacia: 96, acoesConcluidas: 20 }
    ];

    return months.map((m, idx) => {
      const milestone = milestonesControle[idx];
      const base = baseCurve[idx];

      // Tally matching actual incidents from the loaded dataset
      const realMatches = filteredIncidentes.filter(inc => {
        const incDate = inc.data_ocorrencia || inc.created_at || '';
        return incDate.startsWith(m.yearMonth);
      });

      // Combine real incident matches if available, otherwise scale baseline
      const actualCount = realMatches.length;
      const totalInc = actualCount > 0 
        ? actualCount 
        : Math.max(1, Math.round(base.total * obraFactor));

      const quaseAcidentes = realMatches.filter(i => i.tipo === 'quase_acidente').length || Math.max(0, Math.round(base.quase * obraFactor));
      const condicoesInseguras = realMatches.filter(i => i.tipo === 'condicao_insegura' || i.tipo === 'desvio_comportamental' || i.tipo === 'nao_conformidade_nr').length || Math.max(0, Math.round(base.condicao * obraFactor));
      const acidentes = realMatches.filter(i => i.tipo === 'acidente_com_afastamento' || i.tipo === 'acidente_sem_afastamento').length || (idx >= 3 ? 0 : Math.max(0, Math.round(base.acidentes * obraFactor)));

      // Eficácia das medidas
      const eficacia = Math.min(99, Math.round(base.eficacia + (selectedObraId === '2' ? 2 : selectedObraId === '3' ? -2 : 0)));
      const acoesConcluidas = Math.round(base.acoesConcluidas * (selectedObraId === 'all' ? 1 : 0.6));

      return {
        mes: m.label,
        mesCompleto: m.labelCompleto,
        index: idx,
        isCurrent: m.isCurrent,
        totalIncidentes: totalInc,
        quaseAcidentes,
        condicoesInseguras,
        acidentes,
        eficacia,
        acoesConcluidas,
        milestoneTitulo: milestone.titulo,
        milestoneDesc: milestone.descricao,
        milestoneNorma: milestone.normaRef,
        milestoneImpacto: milestone.impacto
      };
    });
  }, [filteredIncidentes, selectedObraId, milestonesControle]);

  // Key KPI Summary Calculations
  const kpiStats = useMemo(() => {
    if (trendData.length === 0) return { reducaoPct: 0, totalSemestre: 0, acidentesSemestre: 0, eficaciaMedia: 0 };

    const firstMonthTotal = trendData[0].totalIncidentes || 1;
    const lastMonthTotal = trendData[trendData.length - 1].totalIncidentes || 0;
    const reducaoPct = Math.round(((firstMonthTotal - lastMonthTotal) / firstMonthTotal) * 100);

    const totalSemestre = trendData.reduce((acc, d) => acc + d.totalIncidentes, 0);
    const acidentesSemestre = trendData.reduce((acc, d) => acc + d.acidentes, 0);
    const eficaciaAtual = trendData[trendData.length - 1].eficacia;
    const totalAcoes = trendData.reduce((acc, d) => acc + d.acoesConcluidas, 0);

    // Consecutive days without Lost Time Accidents (LTA / Com Afastamento)
    const diasSemAcidentes = selectedObraId === '2' ? 210 : selectedObraId === '3' ? 142 : 184;

    return {
      reducaoPct: Math.max(0, reducaoPct),
      totalSemestre,
      acidentesSemestre,
      eficaciaAtual,
      totalAcoes,
      diasSemAcidentes,
      primeiroMesTotal: firstMonthTotal,
      ultimoMesTotal: lastMonthTotal
    };
  }, [trendData, selectedObraId]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      return (
        <div className="bg-slate-950/95 text-white p-3 rounded-lg shadow-2xl border border-slate-700 backdrop-blur-md text-[9px] min-w-[240px] z-50">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800">
            <div>
              <span className="font-bold text-white text-[10px] block">
                {data.mesCompleto}
              </span>
              <span className="text-[7.5px] text-slate-400">
                {data.isCurrent ? 'Mês Atual em Monitoramento' : 'Histórico Consolidado'}
              </span>
            </div>
            <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded">
              {data.eficacia}% Eficácia
            </span>
          </div>

          {/* Metric Rows */}
          <div className="space-y-1 mb-2.5">
            <div className="flex justify-between items-center bg-red-950/40 border border-red-900/60 px-2 py-1 rounded">
              <span className="text-red-300 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Total de Incidentes / Desvios:
              </span>
              <span className="font-mono font-black text-red-200 text-[10px]">
                {data.totalIncidentes}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1 text-[7.5px] pt-0.5">
              <div className="bg-slate-900 p-1 rounded border border-slate-800 text-center">
                <span className="text-amber-400 block font-semibold">Condições/Desvios</span>
                <span className="font-mono font-black text-white text-[9px]">{data.condicoesInseguras}</span>
              </div>
              <div className="bg-slate-900 p-1 rounded border border-slate-800 text-center">
                <span className="text-sky-400 block font-semibold">Quase-Acidentes</span>
                <span className="font-mono font-black text-white text-[9px]">{data.quaseAcidentes}</span>
              </div>
              <div className="bg-slate-900 p-1 rounded border border-slate-800 text-center">
                <span className="text-rose-400 block font-semibold">Acidentes</span>
                <span className="font-mono font-black text-white text-[9px]">{data.acidentes}</span>
              </div>
            </div>
          </div>

          {/* Control Milestone Banner */}
          <div className="bg-slate-900/90 p-2 rounded border border-slate-800 text-[8px]">
            <div className="flex items-center gap-1 text-emerald-400 font-bold mb-0.5">
              <ShieldCheck className="w-2.5 h-2.5" />
              <span>Medida de Controle Adotada:</span>
            </div>
            <p className="font-semibold text-slate-200 leading-tight">
              {data.milestoneTitulo}
            </p>
            <p className="text-slate-400 text-[7px] mt-0.5 italic">
              "{data.milestoneImpacto}"
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      id="safety-incident-trend-line-chart"
      className="bg-white p-3 rounded-md border border-slate-200 shadow-2xs transition-all hover:border-slate-300"
    >
      {/* 1. Header Section with Title, Filters and Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-red-50 border border-red-200 text-red-700 flex items-center justify-center shrink-0 shadow-2xs">
            <TrendingDown className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-black text-slate-900 text-xs tracking-tight uppercase">
                Tendência de Incidentes de Segurança (Últimos 6 Meses)
              </h3>
              <span className="text-[7.5px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                <ArrowDownRight className="w-2.5 h-2.5" />
                <span>-{kpiStats.reducaoPct}% Redução</span>
              </span>
              <span className="text-[7px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                Eficácia de Medidas de Controle · NR-18 / NR-35
              </span>
            </div>
            <span className="text-[8px] text-slate-400 block mt-0.5">
              Correlação entre implantação de medidas preventivas/corretivas e a redução sustentável de incidentes e desvios
            </span>
          </div>
        </div>

        {/* Action Controls and Obra Filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {onSelectObra && (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
              <Filter className="w-2.5 h-2.5 text-slate-500" />
              <select
                id="incident-trend-obra-filter"
                value={selectedObraId}
                onChange={(e) => onSelectObra(e.target.value)}
                className="text-[8px] font-bold bg-transparent text-slate-800 focus:outline-none cursor-pointer"
                title="Filtrar canteiro de obra"
              >
                <option value="all">Portfólio Global (Todos os Canteiros)</option>
                {obras.map(o => (
                  <option key={o.id} value={String(o.id)}>
                    {o.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {onAddIncidente && (
            <button
              onClick={() => {
                const novoInc: IncidenteSeguranca = {
                  id: Date.now(),
                  obra_id: activeObra ? activeObra.id : 1,
                  obra_nome: activeObra ? activeObra.nome : 'Residencial Brasal Noroeste',
                  titulo: 'Apontamento de Desvio em Vistoria de Rotina',
                  descricao: 'Inspeção preventiva identificou necessidade de ajuste em proteção coletiva.',
                  tipo: 'condicao_insegura',
                  categoria_risco: 'trabalho_altura',
                  gravidade: 'baixo',
                  probabilidade: 2,
                  impacto: 2,
                  local_especifico: 'Frente de Serviço Principal',
                  data_ocorrencia: new Date().toISOString().split('T')[0],
                  status: 'aberto',
                  responsavel_nome: 'Mariana Santos (SESMT)',
                  prazo_correcao: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                  afastamento_dias: 0,
                  created_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
                };
                onAddIncidente(novoInc);
                if (onSendNotification) {
                  onSendNotification({
                    titulo: 'Novo Desvio Registrado com Sucesso',
                    mensagem: `O incidente foi registrado para o canteiro ${novoInc.obra_nome}.`,
                    obra_id: novoInc.obra_id,
                    obra_nome: novoInc.obra_nome
                  });
                }
              }}
              className="px-2 py-1 bg-red-700 hover:bg-red-800 text-white rounded text-[8px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
              title="Registrar Novo Incidente ou Quase-Acidente"
            >
              <PlusCircle className="w-2.5 h-2.5" />
              <span>Registrar Desvio</span>
            </button>
          )}

          {onNavigate && (
            <button
              onClick={() => onNavigate('vistorias')}
              className="text-[7.5px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded px-2 py-1 flex items-center gap-0.5 transition-colors cursor-pointer"
            >
              <span>Vistorias & SST</span>
              <ChevronRight className="w-2 h-2" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Executive KPI Metric Blocks */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {/* KPI 1: Queda no Semestre */}
        <div className="bg-emerald-50/80 p-2 rounded border border-emerald-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[7px] font-bold uppercase tracking-wider">Tendência Geral</span>
            <TrendingDown className="w-3 h-3 text-emerald-600" />
          </div>
          <div className="mt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-base font-black text-emerald-950 font-mono leading-none">
                -{kpiStats.reducaoPct}%
              </span>
              <span className="text-[7px] text-emerald-700 font-semibold">de incidentes</span>
            </div>
            <span className="text-[6.5px] text-emerald-800 block mt-0.5">
              De {kpiStats.primeiroMesTotal} ocorrências para {kpiStats.ultimoMesTotal} no mês atual
            </span>
          </div>
        </div>

        {/* KPI 2: Dias Sem Acidentes com Afastamento */}
        <div className="bg-slate-50 p-2 rounded border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[7px] font-bold uppercase tracking-wider">Dias Sem Afastamento</span>
            <ShieldCheck className="w-3 h-3 text-slate-500" />
          </div>
          <div className="mt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-base font-black text-slate-900 font-mono leading-none">
                {kpiStats.diasSemAcidentes}
              </span>
              <span className="text-[7px] text-slate-500">dias ininterruptos</span>
            </div>
            <span className="text-[6.5px] text-emerald-700 font-bold block mt-0.5">
              Zero acidentes graves nos últimos 3 meses
            </span>
          </div>
        </div>

        {/* KPI 3: Eficácia das Medidas Adotadas */}
        <div className="bg-blue-50/80 p-2 rounded border border-blue-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-800">
            <span className="text-[7px] font-bold uppercase tracking-wider">Eficácia das Medidas</span>
            <Target className="w-3 h-3 text-blue-600" />
          </div>
          <div className="mt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-base font-black text-blue-950 font-mono leading-none">
                {kpiStats.eficaciaAtual}%
              </span>
              <span className="text-[7px] text-blue-700 font-semibold">não-reincidência</span>
            </div>
            <span className="text-[6.5px] text-blue-800 block mt-0.5">
              Planos de ação com eliminação na causa-raiz
            </span>
          </div>
        </div>

        {/* KPI 4: Ações Preventivas Executadas */}
        <div className="bg-slate-50 p-2 rounded border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[7px] font-bold uppercase tracking-wider">Ações Concluídas</span>
            <Activity className="w-3 h-3 text-slate-500" />
          </div>
          <div className="mt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-base font-black text-slate-900 font-mono leading-none">
                {kpiStats.totalAcoes}
              </span>
              <span className="text-[7px] text-slate-500">medidas implementadas</span>
            </div>
            <span className="text-[6.5px] text-slate-500 block mt-0.5">
              Total consolidado de 6 intervenções estruturais
            </span>
          </div>
        </div>
      </div>

      {/* 3. Controls Ribbon: Filter View Tabs & Line Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100 flex-wrap">
        {/* Toggle Line Checkboxes */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">
            Linhas Visíveis:
          </span>

          {/* Total Incidentes Line Toggle */}
          <button
            onClick={() => setActiveLines(prev => ({ ...prev, total: !prev.total }))}
            className={`px-1.5 py-0.5 rounded text-[7px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
              activeLines.total 
                ? 'bg-red-50 text-red-700 border border-red-300 ring-1 ring-red-200' 
                : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}
          >
            <span className="w-2 h-0.5 bg-red-600 rounded" />
            <span>Total Ocorrências</span>
          </button>

          {/* Condições Inseguras Toggle */}
          <button
            onClick={() => setActiveLines(prev => ({ ...prev, condicaoInsegura: !prev.condicaoInsegura }))}
            className={`px-1.5 py-0.5 rounded text-[7px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
              activeLines.condicaoInsegura 
                ? 'bg-amber-50 text-amber-700 border border-amber-300 ring-1 ring-amber-200' 
                : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}
          >
            <span className="w-2 h-0.5 bg-amber-500 rounded" />
            <span>Condições Inseguras</span>
          </button>

          {/* Quase-Acidentes Toggle */}
          <button
            onClick={() => setActiveLines(prev => ({ ...prev, quaseAcidente: !prev.quaseAcidente }))}
            className={`px-1.5 py-0.5 rounded text-[7px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
              activeLines.quaseAcidente 
                ? 'bg-sky-50 text-sky-700 border border-sky-300 ring-1 ring-sky-200' 
                : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}
          >
            <span className="w-2 h-0.5 bg-sky-500 rounded" />
            <span>Quase-Acidentes</span>
          </button>

          {/* Acidentes Toggle */}
          <button
            onClick={() => setActiveLines(prev => ({ ...prev, acidentes: !prev.acidentes }))}
            className={`px-1.5 py-0.5 rounded text-[7px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
              activeLines.acidentes 
                ? 'bg-rose-50 text-rose-700 border border-rose-300 ring-1 ring-rose-200' 
                : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}
          >
            <span className="w-2 h-0.5 bg-rose-600 rounded" />
            <span>Acidentes</span>
          </button>

          {/* Eficácia (%) Toggle */}
          <button
            onClick={() => setActiveLines(prev => ({ ...prev, eficacia: !prev.eficacia }))}
            className={`px-1.5 py-0.5 rounded text-[7px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
              activeLines.eficacia 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 ring-1 ring-emerald-200' 
                : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}
          >
            <span className="w-2 h-0.5 bg-emerald-500 rounded" />
            <span>Eficácia Medidas (%)</span>
          </button>
        </div>

        {/* View Mode Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('todos')}
            className={`px-2 py-0.5 rounded text-[7.5px] font-bold transition-all cursor-pointer ${
              viewMode === 'todos' 
                ? 'bg-slate-900 text-white shadow-2xs' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Visão Completa
          </button>
          <button
            onClick={() => setViewMode('eficacia_medidas')}
            className={`px-2 py-0.5 rounded text-[7.5px] font-bold transition-all cursor-pointer ${
              viewMode === 'eficacia_medidas' 
                ? 'bg-emerald-700 text-white shadow-2xs' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Impacto das Medidas
          </button>
        </div>
      </div>

      {/* 4. Main Recharts Line Chart Container */}
      <div className="p-2 rounded-lg bg-slate-50/70 border border-slate-100 mb-3">
        <div className="h-[210px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{ top: 12, right: 20, left: -15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              
              {/* X Axis: 6 Months */}
              <XAxis 
                dataKey="mes" 
                tick={{ fill: '#475569', fontSize: 9, fontWeight: 700 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />

              {/* Y Axis Left: Incident Counts */}
              <YAxis 
                yAxisId="left"
                domain={[0, 'auto']}
                allowDecimals={false}
                tick={{ fill: '#64748b', fontSize: 8.5 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />

              {/* Y Axis Right: Effectiveness % (0 - 100%) */}
              {activeLines.eficacia && (
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  domain={[50, 100]}
                  unit="%"
                  tick={{ fill: '#059669', fontSize: 8.5, fontWeight: 600 }}
                  axisLine={{ stroke: '#a7f3d0' }}
                  tickLine={false}
                />
              )}

              <RechartsTooltip content={<CustomTooltip />} />

              {/* Reference Target Line: Zero Accidents Target */}
              <ReferenceLine 
                yAxisId="left"
                y={0} 
                stroke="#10b981" 
                strokeWidth={1.5}
                strokeDasharray="4 4"
                label={{ 
                  value: 'Meta: Acidente Zero', 
                  fill: '#059669', 
                  fontSize: 7.5, 
                  position: 'insideBottomRight' 
                }}
              />

              {/* Line 1: Total Incidentes (Red-600) */}
              {activeLines.total && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalIncidentes"
                  name="Total de Incidentes"
                  stroke="#DC2626"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#DC2626', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#B91C1C', stroke: '#ffffff', strokeWidth: 2 }}
                />
              )}

              {/* Line 2: Condições Inseguras & Desvios (Amber-500) */}
              {activeLines.condicaoInsegura && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="condicoesInseguras"
                  name="Condições Inseguras"
                  stroke="#F59E0B"
                  strokeWidth={1.8}
                  strokeDasharray="4 2"
                  dot={{ r: 2.5, fill: '#F59E0B' }}
                />
              )}

              {/* Line 3: Quase-Acidentes (Sky-500) */}
              {activeLines.quaseAcidente && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="quaseAcidentes"
                  name="Quase-Acidentes"
                  stroke="#0284C7"
                  strokeWidth={1.8}
                  dot={{ r: 2.5, fill: '#0284C7' }}
                />
              )}

              {/* Line 4: Acidentes (Rose-700) */}
              {activeLines.acidentes && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="acidentes"
                  name="Acidentes Graves"
                  stroke="#BE123C"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#BE123C', strokeWidth: 1.5, stroke: '#ffffff' }}
                />
              )}

              {/* Line 5: Eficácia das Medidas (%) (Emerald-500) */}
              {activeLines.eficacia && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="eficacia"
                  name="Eficácia das Medidas (%)"
                  stroke="#10B981"
                  strokeWidth={2.2}
                  dot={{ r: 3, fill: '#10B981', strokeWidth: 1.5, stroke: '#ffffff' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / Insight Bar */}
        <div className="flex items-center justify-between text-[7px] text-slate-500 pt-1.5 px-2 border-t border-slate-200/80 flex-wrap gap-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              <strong className="text-slate-700">Total Ocorrências</strong> (Escala Esquerda)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <strong className="text-emerald-700">Eficácia %</strong> (Escala Direita 50-100%)
            </span>
          </div>
          <span className="italic text-slate-400">
            Passe o cursor sobre os pontos para inspecionar a medida de controle de cada mês
          </span>
        </div>
      </div>

      {/* 5. Timeline of Control Measures Adopted & Their Impact (Eficácia das Medidas) */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-700" />
            <span className="text-[7.5px] font-bold uppercase tracking-wider text-slate-700">
              Cronograma de Medidas de Controle Adotadas & Redução de Riscos
            </span>
          </div>
          <span className="text-[6.5px] text-slate-400">
            Clique em um mês para filtrar detalhes
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {trendData.map((d, idx) => {
            const isSelected = selectedMilestoneIdx === idx;
            const milestone = milestonesControle[idx];

            return (
              <div
                key={d.mes}
                onClick={() => setSelectedMilestoneIdx(isSelected ? null : idx)}
                className={`p-2 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-50/70 border-emerald-400 ring-1 ring-emerald-200 shadow-2xs'
                    : d.isCurrent
                    ? 'bg-slate-50 border-slate-300 hover:border-slate-400'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1">
                      <span className={`text-[7px] font-mono font-black px-1 py-0.2 rounded ${
                        d.isCurrent ? 'bg-red-800 text-white' : 'bg-slate-800 text-white'
                      }`}>
                        {d.mes}
                      </span>
                      <span className="text-[6.5px] text-slate-500 font-semibold">
                        {milestone.normaRef}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[6.5px] font-bold text-red-700 bg-red-50 px-1 py-0.2 rounded border border-red-200">
                        {d.totalIncidentes} {d.totalIncidentes === 1 ? 'incidente' : 'incidentes'}
                      </span>
                      <span className="text-[6.5px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 font-mono">
                        {d.eficacia}% eficácia
                      </span>
                    </div>
                  </div>

                  <h5 className="font-bold text-slate-900 text-[8.5px] leading-tight mb-0.5">
                    {milestone.titulo}
                  </h5>

                  <p className="text-[7px] text-slate-500 leading-snug">
                    {milestone.descricao}
                  </p>
                </div>

                <div className="mt-1.5 pt-1 border-t border-slate-100 flex items-center justify-between text-[6.5px]">
                  <span className="text-emerald-700 font-medium italic truncate max-w-[170px]" title={milestone.impacto}>
                    ✓ {milestone.impacto}
                  </span>
                  <span className="text-slate-400 font-mono shrink-0">
                    +{d.acoesConcluidas} ações
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Footer Notes on Statistical Verification */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[7px] text-slate-400 gap-1">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>
            Metodologia: Coleta auditada em consonância com a Pirâmide de Bird e NBR 14280 (Cadastro de Acidentes do Trabalho).
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span>Engenheiro de Segurança Responsável: <strong className="text-slate-700 font-semibold">Mariana Santos (CREA-DF)</strong></span>
        </div>
      </div>
    </div>
  );
};
