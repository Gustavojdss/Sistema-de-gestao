import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  ChevronRight, 
  Clock, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  PlayCircle,
  Building2,
  Filter,
  Maximize2,
  Minimize2,
  Hammer,
  Sparkles,
  Info,
  CalendarDays
} from 'lucide-react';
import { Obra } from '../types/erp';

export interface FaseGantt {
  id: string;
  nome: string;
  categoria: 'fundacao' | 'estrutura' | 'instalacoes' | 'acabamento' | 'entrega';
  inicio: Date;
  fim: Date;
  duracaoDias: number;
  progresso: number;
  status: 'concluida' | 'em_andamento' | 'planejada' | 'atrasada';
  responsavel?: string;
  marcos?: string[];
}

interface GanttCronogramaViewProps {
  obras: Obra[];
  selectedObraId?: number | 'all';
  onSelectObra?: (obraId: number) => void;
  simplifiedModeDefault?: boolean;
}

export const GanttCronogramaView: React.FC<GanttCronogramaViewProps> = ({
  obras,
  selectedObraId = 'all',
  onSelectObra,
  simplifiedModeDefault = true
}) => {
  const [filterObraId, setFilterObraId] = useState<number | 'all'>(selectedObraId);
  const [phaseMode, setPhaseMode] = useState<'simplified' | 'detailed'>('simplified');
  const [expandedObraIds, setExpandedObraIds] = useState<number[]>(obras.map(o => o.id));
  const [hoveredFase, setHoveredFase] = useState<{ obraId: number; fase: FaseGantt } | null>(null);

  // Today reference
  const hoje = useMemo(() => new Date(), []);

  // Compute phases for each obra dynamically based on data_inicio and data_previsao_termino
  const obrasComFases = useMemo(() => {
    return obras.map(obra => {
      // Parse dates safely
      const dInicio = obra.data_inicio ? new Date(obra.data_inicio + 'T00:00:00') : new Date('2024-01-01T00:00:00');
      const dFim = obra.data_previsao_termino ? new Date(obra.data_previsao_termino + 'T23:59:59') : new Date('2025-06-30T23:59:59');
      
      const totalMillis = Math.max(86400000, dFim.getTime() - dInicio.getTime());
      const totalDias = Math.ceil(totalMillis / (1000 * 60 * 60 * 24));
      
      const overallProgress = obra.progresso !== undefined ? obra.progresso : 50;

      // Helper to compute sub-date range from ratio
      const getDateAtRatio = (ratio: number) => new Date(dInicio.getTime() + totalMillis * ratio);

      let fases: FaseGantt[] = [];

      if (phaseMode === 'simplified') {
        // Core 3-phase simplified mapping: Fundação, Estrutura, Acabamento
        
        // 1. Fundação: 0% to 30% of project schedule
        const f1Inicio = dInicio;
        const f1Fim = getDateAtRatio(0.30);
        const f1Dias = Math.max(1, Math.ceil((f1Fim.getTime() - f1Inicio.getTime()) / 86400000));
        const f1Prog = overallProgress >= 30 ? 100 : Math.round((overallProgress / 30) * 100);
        const f1Status: FaseGantt['status'] = f1Prog === 100 ? 'concluida' : hoje > f1Fim ? 'atrasada' : (f1Prog > 0 || hoje >= f1Inicio ? 'em_andamento' : 'planejada');

        // 2. Estrutura & Alvenaria: 25% to 75% of project schedule
        const f2Inicio = getDateAtRatio(0.25);
        const f2Fim = getDateAtRatio(0.75);
        const f2Dias = Math.max(1, Math.ceil((f2Fim.getTime() - f2Inicio.getTime()) / 86400000));
        let f2Prog = 0;
        if (overallProgress > 25) {
          f2Prog = Math.min(100, Math.round(((overallProgress - 25) / 50) * 100));
        }
        const f2Status: FaseGantt['status'] = f2Prog === 100 ? 'concluida' : f2Prog > 0 ? (hoje > f2Fim ? 'atrasada' : 'em_andamento') : 'planejada';

        // 3. Acabamento & Revestimentos: 70% to 100% of project schedule
        const f3Inicio = getDateAtRatio(0.70);
        const f3Fim = dFim;
        const f3Dias = Math.max(1, Math.ceil((f3Fim.getTime() - f3Inicio.getTime()) / 86400000));
        let f3Prog = 0;
        if (overallProgress > 70) {
          f3Prog = Math.min(100, Math.round(((overallProgress - 70) / 30) * 100));
        }
        const f3Status: FaseGantt['status'] = f3Prog === 100 ? 'concluida' : f3Prog > 0 ? (hoje > f3Fim ? 'atrasada' : 'em_andamento') : 'planejada';

        fases = [
          {
            id: `fundacao-${obra.id}`,
            nome: '1. Fundação & Contenções',
            categoria: 'fundacao',
            inicio: f1Inicio,
            fim: f1Fim,
            duracaoDias: f1Dias,
            progresso: f1Prog,
            status: f1Status,
            responsavel: obra.gestor_nome || 'Eng. de Fundação',
            marcos: ['Terraplanagem concluída', 'Estacas cravadas', 'Blocos de coroamento']
          },
          {
            id: `estrutura-${obra.id}`,
            nome: '2. Estrutura & Alvenaria',
            categoria: 'estrutura',
            inicio: f2Inicio,
            fim: f2Fim,
            duracaoDias: f2Dias,
            progresso: f2Prog,
            status: f2Status,
            responsavel: obra.gestor_nome || 'Eng. Estrutural',
            marcos: ['Pilares e vigas', 'Lajes dos pavimentos concretadas', 'Fechamento em alvenaria']
          },
          {
            id: `acabamento-${obra.id}`,
            nome: '3. Acabamento & Entrega',
            categoria: 'acabamento',
            inicio: f3Inicio,
            fim: f3Fim,
            duracaoDias: f3Dias,
            progresso: f3Prog,
            status: f3Status,
            responsavel: obra.gestor_nome || 'Comissão de Qualidade Brasal',
            marcos: ['Revestimentos e porcelanatos', 'Pintura final', 'Habite-se e Vistoria final']
          }
        ];
      } else {
        // Detailed 5-phase breakdown
        const f1Inicio = dInicio;
        const f1Fim = getDateAtRatio(0.25);
        const f1Prog = overallProgress >= 25 ? 100 : Math.round((overallProgress / 25) * 100);
        const f1Status: FaseGantt['status'] = f1Prog === 100 ? 'concluida' : hoje > f1Fim ? 'atrasada' : 'em_andamento';

        const f2Inicio = getDateAtRatio(0.20);
        const f2Fim = getDateAtRatio(0.60);
        let f2Prog = overallProgress > 20 ? Math.min(100, Math.round(((overallProgress - 20) / 40) * 100)) : 0;
        const f2Status: FaseGantt['status'] = f2Prog === 100 ? 'concluida' : f2Prog > 0 ? (hoje > f2Fim ? 'atrasada' : 'em_andamento') : 'planejada';

        const f3Inicio = getDateAtRatio(0.45);
        const f3Fim = getDateAtRatio(0.75);
        let f3Prog = overallProgress > 45 ? Math.min(100, Math.round(((overallProgress - 45) / 30) * 100)) : 0;
        const f3Status: FaseGantt['status'] = f3Prog === 100 ? 'concluida' : f3Prog > 0 ? (hoje > f3Fim ? 'atrasada' : 'em_andamento') : 'planejada';

        const f4Inicio = getDateAtRatio(0.65);
        const f4Fim = getDateAtRatio(0.92);
        let f4Prog = overallProgress > 65 ? Math.min(100, Math.round(((overallProgress - 65) / 27) * 100)) : 0;
        const f4Status: FaseGantt['status'] = f4Prog === 100 ? 'concluida' : f4Prog > 0 ? (hoje > f4Fim ? 'atrasada' : 'em_andamento') : 'planejada';

        const f5Inicio = getDateAtRatio(0.90);
        const f5Fim = dFim;
        let f5Prog = overallProgress > 90 ? Math.min(100, Math.round(((overallProgress - 90) / 10) * 100)) : 0;
        const f5Status: FaseGantt['status'] = f5Prog === 100 ? 'concluida' : f5Prog > 0 ? 'em_andamento' : 'planejada';

        fases = [
          {
            id: `fundacao-${obra.id}`,
            nome: '1. Fundação & Contenções',
            categoria: 'fundacao',
            inicio: f1Inicio,
            fim: f1Fim,
            duracaoDias: Math.ceil((f1Fim.getTime() - f1Inicio.getTime()) / 86400000),
            progresso: f1Prog,
            status: f1Status,
            responsavel: obra.gestor_nome || 'Eng. Residente',
            marcos: ['Estacas cravadas', 'Blocos de coroamento concretados']
          },
          {
            id: `estrutura-${obra.id}`,
            nome: '2. Estrutura & Alvenaria',
            categoria: 'estrutura',
            inicio: f2Inicio,
            fim: f2Fim,
            duracaoDias: Math.ceil((f2Fim.getTime() - f2Inicio.getTime()) / 86400000),
            progresso: f2Prog,
            status: f2Status,
            responsavel: obra.gestor_nome || 'Eng. Residente',
            marcos: ['Lajes concretadas', 'Alvenaria de vedação']
          },
          {
            id: `instalacoes-${obra.id}`,
            nome: '3. Instalações Hidráulicas & Elétricas',
            categoria: 'instalacoes',
            inicio: f3Inicio,
            fim: f3Fim,
            duracaoDias: Math.ceil((f3Fim.getTime() - f3Inicio.getTime()) / 86400000),
            progresso: f3Prog,
            status: f3Status,
            responsavel: 'Equipe de Instalações',
            marcos: ['Prumadas testadas', 'Quadros de comando']
          },
          {
            id: `acabamento-${obra.id}`,
            nome: '4. Acabamento & Revestimentos',
            categoria: 'acabamento',
            inicio: f4Inicio,
            fim: f4Fim,
            duracaoDias: Math.ceil((f4Fim.getTime() - f4Inicio.getTime()) / 86400000),
            progresso: f4Prog,
            status: f4Status,
            responsavel: 'Equipe de Acabamentos',
            marcos: ['Porcelanatos assentados', 'Pintura']
          },
          {
            id: `entrega-${obra.id}`,
            nome: '5. Vistoria Final & Habite-se',
            categoria: 'entrega',
            inicio: f5Inicio,
            fim: f5Fim,
            duracaoDias: Math.ceil((f5Fim.getTime() - f5Inicio.getTime()) / 86400000),
            progresso: f5Prog,
            status: f5Status,
            responsavel: 'Comissão de Qualidade Brasal',
            marcos: ['Vistoria dos clientes', 'Emissão do Habite-se']
          }
        ];
      }

      return {
        ...obra,
        dataInicioObj: dInicio,
        dataFimObj: dFim,
        totalDias,
        fases
      };
    });
  }, [obras, hoje, phaseMode]);

  // Determine global timeline window
  const { minTimelineDate, maxTimelineDate, totalDays } = useMemo(() => {
    let minD = new Date('2024-01-01T00:00:00').getTime();
    let maxD = new Date('2025-12-31T23:59:59').getTime();

    if (obrasComFases.length > 0) {
      minD = Math.min(...obrasComFases.map(o => o.dataInicioObj.getTime()));
      maxD = Math.max(...obrasComFases.map(o => o.dataFimObj.getTime()));
    }

    // Add margin on both sides
    const start = new Date(minD);
    start.setDate(1); // start at beginning of month
    const end = new Date(maxD);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0); // end of month

    const days = Math.max(30, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      minTimelineDate: start,
      maxTimelineDate: end,
      totalDays: days
    };
  }, [obrasComFases]);

  // Generate monthly markers for timeline header
  const timelineMonths = useMemo(() => {
    const months: { label: string; year: number; startDayOffset: number; widthPercent: number }[] = [];
    const curr = new Date(minTimelineDate);
    const startMs = minTimelineDate.getTime();
    const totalMs = maxTimelineDate.getTime() - startMs;

    while (curr <= maxTimelineDate) {
      const monthStart = new Date(curr.getFullYear(), curr.getMonth(), 1);
      const monthEnd = new Date(curr.getFullYear(), curr.getMonth() + 1, 0, 23, 59, 59);

      const offset = Math.max(0, (monthStart.getTime() - startMs) / totalMs) * 100;
      const endOffset = Math.min(100, (monthEnd.getTime() - startMs) / totalMs) * 100;
      const width = Math.max(1, endOffset - offset);

      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      months.push({
        label: `${monthNames[curr.getMonth()]}/${curr.getFullYear().toString().slice(2)}`,
        year: curr.getFullYear(),
        startDayOffset: offset,
        widthPercent: width
      });

      curr.setMonth(curr.getMonth() + 1);
    }
    return months;
  }, [minTimelineDate, maxTimelineDate]);

  // Calculate percentage position on timeline
  const getPercentPosition = (date: Date) => {
    const startMs = minTimelineDate.getTime();
    const totalMs = maxTimelineDate.getTime() - startMs;
    const currentMs = date.getTime() - startMs;
    return Math.max(0, Math.min(100, (currentMs / totalMs) * 100));
  };

  const hojePos = getPercentPosition(hoje);

  const toggleExpand = (obraId: number) => {
    setExpandedObraIds(prev => 
      prev.includes(obraId) ? prev.filter(id => id !== obraId) : [...prev, obraId]
    );
  };

  const expandAll = () => setExpandedObraIds(obras.map(o => o.id));
  const collapseAll = () => setExpandedObraIds([]);

  const filteredObrasList = obrasComFases.filter(o => 
    filterObraId === 'all' || o.id === filterObraId
  );

  const getFaseColor = (categoria: FaseGantt['categoria'], status: FaseGantt['status']) => {
    if (status === 'concluida') return 'bg-emerald-600 border-emerald-700 text-white shadow-xs';
    if (status === 'atrasada') return 'bg-red-600 border-red-700 text-white shadow-xs';
    
    switch (categoria) {
      case 'fundacao': return 'bg-amber-600 border-amber-700 text-white shadow-xs';
      case 'estrutura': return 'bg-blue-600 border-blue-700 text-white shadow-xs';
      case 'instalacoes': return 'bg-cyan-600 border-cyan-700 text-white shadow-xs';
      case 'acabamento': return 'bg-purple-600 border-purple-700 text-white shadow-xs';
      case 'entrega': return 'bg-emerald-700 border-emerald-800 text-white shadow-xs';
      default: return 'bg-slate-600 border-slate-700 text-white shadow-xs';
    }
  };

  const getFaseBadge = (status: FaseGantt['status']) => {
    switch (status) {
      case 'concluida':
        return <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">100% Concluída</span>;
      case 'em_andamento':
        return <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-200">Em Andamento</span>;
      case 'atrasada':
        return <span className="bg-red-100 text-red-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-200">Requer Atenção</span>;
      case 'planejada':
        return <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-200">Planejada</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* Header Controls */}
      <div className="p-3 sm:p-3.5 border-b border-slate-200 bg-slate-50/80 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-100 text-red-800 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-none">Gráfico de Gantt — Cronograma de Fases</h2>
                <span className="bg-red-50 text-red-700 text-[9px] font-black px-1.5 py-0.2 rounded border border-red-200">
                  Mapeamento Temporal
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Projeção direta das fases (<strong className="text-slate-700">Fundação</strong>, <strong className="text-slate-700">Estrutura</strong>, <strong className="text-slate-700">Acabamento</strong>) com base nas datas de início e previsão de término de cada canteiro.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-center">
          {/* Phase Mode Toggle */}
          <div className="flex items-center bg-white p-0.5 border border-slate-200 rounded-lg shadow-2xs">
            <button
              onClick={() => setPhaseMode('simplified')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                phaseMode === 'simplified' ? 'bg-red-800 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Fases Principais (Fundação, Estrutura, Acabamento)"
            >
              Fases Principais (3)
            </button>
            <button
              onClick={() => setPhaseMode('detailed')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                phaseMode === 'detailed' ? 'bg-red-800 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Visão com 5 Fases Detalhadas"
            >
              Detalhadas (5)
            </button>
          </div>

          {/* Obra Filter */}
          <div className="flex items-center gap-1 bg-white px-2 py-1 border border-slate-200 rounded-lg shadow-2xs">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              aria-label="Filtrar Obra no Gantt"
              value={filterObraId}
              onChange={(e) => setFilterObraId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="text-[11px] font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">Todas as Obras ({obras.length})</option>
              {obras.map(o => (
                <option key={o.id} value={o.id}>{o.nome}</option>
              ))}
            </select>
          </div>

          {/* Expand/Collapse buttons */}
          <div className="flex items-center gap-0.5 bg-white p-0.5 border border-slate-200 rounded-lg shadow-2xs">
            <button
              onClick={expandAll}
              className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100"
              title="Expandir todas as fases"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            <button
              onClick={collapseAll}
              className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100"
              title="Recolher todas as fases"
            >
              <Minimize2 className="w-3 h-3" />
            </button>
          </div>

          {/* Legend helper */}
          <div className="hidden xl:flex items-center gap-2 text-[9px] text-slate-600 bg-white px-2 py-1 border border-slate-200 rounded-lg">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-xs bg-amber-600 inline-block"></span> Fundação</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-xs bg-blue-600 inline-block"></span> Estrutura</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-xs bg-purple-600 inline-block"></span> Acabamento</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-xs bg-emerald-600 inline-block"></span> 100% Concluído</span>
          </div>
        </div>
      </div>

      {/* Main Gantt Canvas */}
      <div className="overflow-x-auto">
        <div className="min-w-[960px] p-3 sm:p-4">
          
          {/* Gantt Timeline Header Bar */}
          <div className="flex border-b border-slate-300 pb-1.5 mb-2.5 sticky top-0 bg-white z-10">
            {/* Left label column */}
            <div className="w-72 shrink-0 pr-4">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Canteiro / Fases Mapeadas</span>
            </div>

            {/* Right date scale column */}
            <div className="flex-1 relative h-6">
              {timelineMonths.map((m, idx) => (
                <div
                  key={idx}
                  className="absolute top-0 bottom-0 border-l border-slate-200 pl-1 flex flex-col justify-end"
                  style={{
                    left: `${m.startDayOffset}%`,
                    width: `${m.widthPercent}%`
                  }}
                >
                  <span className="text-[9px] font-bold text-slate-500 truncate block">
                    {m.label}
                  </span>
                </div>
              ))}

              {/* Hoje Marker in Header */}
              <div 
                className="absolute top-0 bottom-0 z-20 pointer-events-none flex flex-col items-center"
                style={{ left: `${hojePos}%` }}
              >
                <div className="bg-red-700 text-white text-[8px] font-black px-1 py-0.2 rounded shadow-xs -translate-x-1/2 -top-1 absolute uppercase">
                  Hoje
                </div>
              </div>
            </div>
          </div>

          {/* Obras & Phases Rows */}
          <div className="space-y-3">
            {filteredObrasList.map((obra) => {
              const isExpanded = expandedObraIds.includes(obra.id);
              const obraStartPos = getPercentPosition(obra.dataInicioObj);
              const obraEndPos = getPercentPosition(obra.dataFimObj);
              const obraWidth = Math.max(1, obraEndPos - obraStartPos);

              return (
                <div key={obra.id} className="bg-slate-50/70 border border-slate-200 rounded-xl p-2 space-y-1.5 shadow-2xs">
                  
                  {/* Master Obra Timeline Row */}
                  <div className="flex items-center">
                    <div className="w-72 shrink-0 pr-3 flex items-center gap-1.5">
                      <button
                        onClick={() => toggleExpand(obra.id)}
                        className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-200/60 transition-colors"
                        title={isExpanded ? 'Recolher fases' : 'Expandir fases'}
                      >
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                      <div className="truncate min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-black text-xs text-slate-900 truncate" title={obra.nome}>
                            {obra.nome}
                          </span>
                          <span className={`text-[8px] px-1 py-0.2 rounded font-bold uppercase shrink-0 ${
                            obra.status === 'em_andamento' ? 'bg-emerald-100 text-emerald-800' :
                            obra.status === 'planejamento' ? 'bg-amber-100 text-amber-800' :
                            obra.status === 'concluida' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {obra.status.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono block">
                          {obra.data_inicio} → {obra.data_previsao_termino} ({obra.totalDias} dias)
                        </span>
                      </div>
                    </div>

                    {/* Obra Progress Bar on Timeline */}
                    <div className="flex-1 relative h-7 flex items-center">
                      
                      {/* Grid guideline background lines */}
                      {timelineMonths.map((m, idx) => (
                        <div
                          key={idx}
                          className="absolute top-0 bottom-0 border-l border-slate-200/70 pointer-events-none"
                          style={{ left: `${m.startDayOffset}%` }}
                        />
                      ))}

                      {/* Hoje line */}
                      <div 
                        className="absolute top-0 bottom-0 border-l-2 border-dashed border-red-600/80 pointer-events-none z-10"
                        style={{ left: `${hojePos}%` }}
                      />

                      {/* Master Project Track */}
                      <div
                        className="absolute h-5 rounded-md bg-slate-200 border border-slate-300 overflow-hidden shadow-2xs flex items-center"
                        style={{
                          left: `${obraStartPos}%`,
                          width: `${obraWidth}%`
                        }}
                      >
                        <div
                          className="h-full bg-gradient-to-r from-red-800 to-red-600 rounded-l-md transition-all flex items-center justify-end pr-1.5"
                          style={{ width: `${obra.progresso || 50}%` }}
                        >
                          {(obra.progresso || 50) > 15 && (
                            <span className="text-[9px] font-black text-white drop-shadow-xs">
                              {obra.progresso || 50}%
                            </span>
                          )}
                        </div>
                        {(obra.progresso || 50) <= 15 && (
                          <span className="text-[9px] font-bold text-slate-700 pl-1.5">
                            {obra.progresso || 50}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sub-phases breakdown */}
                  {isExpanded && (
                    <div className="pl-5 border-l-2 border-red-800/30 ml-2.5 space-y-1 pt-1">
                      {obra.fases.map((fase) => {
                        const fStartPos = getPercentPosition(fase.inicio);
                        const fEndPos = getPercentPosition(fase.fim);
                        const fWidth = Math.max(1.5, fEndPos - fStartPos);
                        const isHovered = hoveredFase?.fase.id === fase.id;

                        const dateRangeStr = `${fase.inicio.toLocaleDateString('pt-BR')} até ${fase.fim.toLocaleDateString('pt-BR')}`;

                        return (
                          <div 
                            key={fase.id} 
                            className={`flex items-center rounded-lg p-0.5 transition-colors ${isHovered ? 'bg-white shadow-2xs' : ''}`}
                            onMouseEnter={() => setHoveredFase({ obraId: obra.id, fase })}
                            onMouseLeave={() => setHoveredFase(null)}
                          >
                            {/* Phase Info */}
                            <div className="w-[268px] shrink-0 pr-3 flex items-center justify-between">
                              <div className="truncate min-w-0">
                                <span className="font-bold text-[10px] text-slate-800 block truncate" title={fase.nome}>
                                  {fase.nome}
                                </span>
                                <span className="text-[8px] text-slate-400 font-mono block">
                                  {dateRangeStr} ({fase.duracaoDias}d)
                                </span>
                              </div>
                              <div className="shrink-0 ml-1">
                                {getFaseBadge(fase.status)}
                              </div>
                            </div>

                            {/* Phase Gantt Bar */}
                            <div className="flex-1 relative h-6 flex items-center">
                              
                              {/* Background guideline lines */}
                              {timelineMonths.map((m, idx) => (
                                <div
                                  key={idx}
                                  className="absolute top-0 bottom-0 border-l border-slate-200/50 pointer-events-none"
                                  style={{ left: `${m.startDayOffset}%` }}
                                />
                              ))}

                              {/* Hoje line */}
                              <div 
                                className="absolute top-0 bottom-0 border-l-2 border-dashed border-red-600/80 pointer-events-none z-10"
                                style={{ left: `${hojePos}%` }}
                              />

                              {/* Phase Bar */}
                              <div
                                className={`absolute h-4.5 rounded border text-[9px] font-bold flex items-center overflow-hidden transition-all shadow-2xs group cursor-pointer ${getFaseColor(fase.categoria, fase.status)}`}
                                style={{
                                  left: `${fStartPos}%`,
                                  width: `${fWidth}%`
                                }}
                                title={`${fase.nome}: ${fase.progresso}% concluído (${dateRangeStr})`}
                              >
                                {/* Inner Progress Strip */}
                                <div
                                  className="h-full bg-black/25 absolute left-0 top-0"
                                  style={{ width: `${fase.progresso}%` }}
                                />
                                
                                <span className="relative z-10 px-1.5 truncate drop-shadow-xs flex items-center gap-1">
                                  {fase.progresso === 100 ? (
                                    <CheckCircle2 className="w-2.5 h-2.5 text-white inline shrink-0" />
                                  ) : (
                                    <PlayCircle className="w-2.5 h-2.5 text-white/90 inline shrink-0" />
                                  )}
                                  <span className="truncate">{fase.nome.split('.')[1] || fase.nome} ({fase.progresso}%)</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* Interactive Phase Detail Card below chart when hovered */}
          {hoveredFase && (
            <div className="mt-3 p-2.5 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-600/30 text-red-400 border border-red-500/30">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">{hoveredFase.fase.nome}</h4>
                  <p className="text-[10px] text-slate-400">
                    Janela Executiva: <strong className="text-slate-200">{hoveredFase.fase.inicio.toLocaleDateString('pt-BR')}</strong> até <strong className="text-slate-200">{hoveredFase.fase.fim.toLocaleDateString('pt-BR')}</strong> ({hoveredFase.fase.duracaoDias} dias) · Resp: {hoveredFase.fase.responsavel}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[9px] uppercase text-slate-400 font-bold block">Progresso Real</span>
                  <span className="text-xs font-black text-emerald-400">{hoveredFase.fase.progresso}%</span>
                </div>
                {hoveredFase.fase.marcos && hoveredFase.fase.marcos.length > 0 && (
                  <div className="hidden md:block pl-3 border-l border-slate-700 text-[9px] text-slate-300">
                    <span className="text-slate-400 font-bold block">Marcos Construtivos:</span>
                    <span>{hoveredFase.fase.marcos.join(' · ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Footer Summary & Phase Mapping Legend */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-600 gap-2">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-red-600" />
          <span>A linha vertical vermelha indica a <strong>Data de Acompanhamento (Hoje)</strong>. Fases mapeadas proporcionalmente ao período total da obra.</span>
        </div>
        <span className="font-semibold text-slate-700">
          {obras.length} canteiros com cronograma ativo
        </span>
      </div>
    </div>
  );
};

