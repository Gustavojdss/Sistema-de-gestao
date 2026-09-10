import React, { useState, useMemo } from 'react';
import { 
  BarChart as BarChartIcon, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Building2, 
  Filter, 
  Layers, 
  Activity, 
  Zap, 
  ChevronRight, 
  Info,
  SlidersHorizontal,
  Flame
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ReferenceLine,
  Cell
} from 'recharts';
import { Obra } from '../types/erp';

interface ProductivityVsProgressRechartsChartProps {
  obras: Obra[];
  selectedObraId: string;
  onSelectObra?: (obraId: string) => void;
  onNavigate?: (tab: any) => void;
}

export type FrenteServico = 'todas' | 'estrutura' | 'alvenaria' | 'instalacoes' | 'acabamento';

interface WeeklyProductivityData {
  semana: string;
  semanaLabel: string;
  periodo: string;
  horasTrabalhadas: number; // Média de horas alocadas por equipe/semana
  progressoReal: number; // % avanço físico real
  progressoEsperado: number; // % avanço físico planejado
  produtividadeRatio: number; // Horas por 1% de avanço (quanto menor, mais eficiente)
  temGargalo: boolean;
  motivoGargalo?: string;
  frenteDestaque: string;
}

export const ProductivityVsProgressRechartsChart: React.FC<ProductivityVsProgressRechartsChartProps> = ({
  obras,
  selectedObraId,
  onSelectObra,
  onNavigate
}) => {
  const [selectedFrente, setSelectedFrente] = useState<FrenteServico>('todas');
  const [selectedSemana, setSelectedSemana] = useState<WeeklyProductivityData | null>(null);

  // Selected Obra instance
  const activeObra = useMemo(() => {
    if (selectedObraId === 'all') return null;
    return obras.find(o => String(o.id) === selectedObraId) || null;
  }, [obras, selectedObraId]);

  // Dataset generation for the past 8 weeks based on selected frente and obra
  const chartData: WeeklyProductivityData[] = useMemo(() => {
    // Base curves per frente de serviço
    const dataByFrente: Record<FrenteServico, WeeklyProductivityData[]> = {
      todas: [
        { semana: 'Sem 01', semanaLabel: 'Semana 01', periodo: '15/Jul - 21/Jul', horasTrabalhadas: 44.5, progressoReal: 2.8, progressoEsperado: 2.5, produtividadeRatio: 15.8, temGargalo: false, frenteDestaque: 'Estrutura & Lajes' },
        { semana: 'Sem 02', semanaLabel: 'Semana 02', periodo: '22/Jul - 28/Jul', horasTrabalhadas: 46.0, progressoReal: 3.1, progressoEsperado: 2.8, produtividadeRatio: 14.8, temGargalo: false, frenteDestaque: 'Alvenaria Externa' },
        { semana: 'Sem 03', semanaLabel: 'Semana 03', periodo: '29/Jul - 04/Ago', horasTrabalhadas: 52.0, progressoReal: 1.2, progressoEsperado: 3.0, produtividadeRatio: 43.3, temGargalo: true, motivoGargalo: 'Atraso na entrega de formas metálicas e retrabalho de armações no 4º pav.', frenteDestaque: 'Estrutura' },
        { semana: 'Sem 04', semanaLabel: 'Semana 04', periodo: '05/Ago - 11/Ago', horasTrabalhadas: 48.5, progressoReal: 2.9, progressoEsperado: 2.7, produtividadeRatio: 16.7, temGargalo: false, frenteDestaque: 'Instalações Hidráulicas' },
        { semana: 'Sem 05', semanaLabel: 'Semana 05', periodo: '12/Ago - 18/Ago', horasTrabalhadas: 51.5, progressoReal: 1.4, progressoEsperado: 3.2, produtividadeRatio: 36.7, temGargalo: true, motivoGargalo: 'Falta de tubulações de esgoto primário e excesso de horas extras com baixa conversão.', frenteDestaque: 'Instalações' },
        { semana: 'Sem 06', semanaLabel: 'Semana 06', periodo: '19/Ago - 25/Ago', horasTrabalhadas: 45.0, progressoReal: 3.4, progressoEsperado: 3.0, produtividadeRatio: 13.2, temGargalo: false, frenteDestaque: 'Alvenaria & Revestimento' },
        { semana: 'Sem 07', semanaLabel: 'Semana 07', periodo: '26/Ago - 01/Set', horasTrabalhadas: 44.0, progressoReal: 3.2, progressoEsperado: 3.0, produtividadeRatio: 13.7, temGargalo: false, frenteDestaque: 'Concretagem Laje L5' },
        { semana: 'Sem 08', semanaLabel: 'Semana 08', periodo: '02/Set - 08/Set', horasTrabalhadas: 43.5, progressoReal: 3.5, progressoEsperado: 3.1, produtividadeRatio: 12.4, temGargalo: false, frenteDestaque: 'Impermeabilização Cobertura' }
      ],
      estrutura: [
        { semana: 'Sem 01', semanaLabel: 'Semana 01', periodo: '15/Jul - 21/Jul', horasTrabalhadas: 45.0, progressoReal: 3.2, progressoEsperado: 3.0, produtividadeRatio: 14.0, temGargalo: false, frenteDestaque: 'Concretagem Pilares L3' },
        { semana: 'Sem 02', semanaLabel: 'Semana 02', periodo: '22/Jul - 28/Jul', horasTrabalhadas: 44.0, progressoReal: 3.4, progressoEsperado: 3.0, produtividadeRatio: 12.9, temGargalo: false, frenteDestaque: 'Armação de Vigas' },
        { semana: 'Sem 03', semanaLabel: 'Semana 03', periodo: '29/Jul - 04/Ago', horasTrabalhadas: 54.0, progressoReal: 1.1, progressoEsperado: 3.2, produtividadeRatio: 49.0, temGargalo: true, motivoGargalo: 'Emperramento de guincho de coluna e desencaixe de escoramento metálico.', frenteDestaque: 'Formas & Escoramento' },
        { semana: 'Sem 04', semanaLabel: 'Semana 04', periodo: '05/Ago - 11/Ago', horasTrabalhadas: 46.0, progressoReal: 3.0, progressoEsperado: 2.8, produtividadeRatio: 15.3, temGargalo: false, frenteDestaque: 'Concretagem Laje L4' },
        { semana: 'Sem 05', semanaLabel: 'Semana 05', periodo: '12/Ago - 18/Ago', horasTrabalhadas: 45.5, progressoReal: 3.1, progressoEsperado: 3.0, produtividadeRatio: 14.6, temGargalo: false, frenteDestaque: 'Desforma e Cura Úmida' },
        { semana: 'Sem 06', semanaLabel: 'Semana 06', periodo: '19/Ago - 25/Ago', horasTrabalhadas: 43.5, progressoReal: 3.5, progressoEsperado: 3.2, produtividadeRatio: 12.4, temGargalo: false, frenteDestaque: 'Montagem Laje L5' },
        { semana: 'Sem 07', semanaLabel: 'Semana 07', periodo: '26/Ago - 01/Set', horasTrabalhadas: 44.0, progressoReal: 3.3, progressoEsperado: 3.0, produtividadeRatio: 13.3, temGargalo: false, frenteDestaque: 'Concretagem Laje L5' },
        { semana: 'Sem 08', semanaLabel: 'Semana 08', periodo: '02/Set - 08/Set', horasTrabalhadas: 42.0, progressoReal: 3.8, progressoEsperado: 3.2, produtividadeRatio: 11.0, temGargalo: false, frenteDestaque: 'Pilares L6' }
      ],
      alvenaria: [
        { semana: 'Sem 01', semanaLabel: 'Semana 01', periodo: '15/Jul - 21/Jul', horasTrabalhadas: 43.0, progressoReal: 2.5, progressoEsperado: 2.2, produtividadeRatio: 17.2, temGargalo: false, frenteDestaque: 'Marcação Pav. 2' },
        { semana: 'Sem 02', semanaLabel: 'Semana 02', periodo: '22/Jul - 28/Jul', horasTrabalhadas: 45.0, progressoReal: 2.8, progressoEsperado: 2.5, produtividadeRatio: 16.0, temGargalo: false, frenteDestaque: 'Elevação Pav. 2' },
        { semana: 'Sem 03', semanaLabel: 'Semana 03', periodo: '29/Jul - 04/Ago', horasTrabalhadas: 44.0, progressoReal: 2.7, progressoEsperado: 2.5, produtividadeRatio: 16.2, temGargalo: false, frenteDestaque: 'Vergas e Contravergas' },
        { semana: 'Sem 04', semanaLabel: 'Semana 04', periodo: '05/Ago - 11/Ago', horasTrabalhadas: 49.0, progressoReal: 1.5, progressoEsperado: 2.8, produtividadeRatio: 32.6, temGargalo: true, motivoGargalo: 'Argamassa estabilizada fora do prazo de trabalhabilidade gerando rejeição.', frenteDestaque: 'Elevação Pav. 3' },
        { semana: 'Sem 05', semanaLabel: 'Semana 05', periodo: '12/Ago - 18/Ago', horasTrabalhadas: 46.0, progressoReal: 2.9, progressoEsperado: 2.8, produtividadeRatio: 15.8, temGargalo: false, frenteDestaque: 'Encunhamento com Espuma' },
        { semana: 'Sem 06', semanaLabel: 'Semana 06', periodo: '19/Ago - 25/Ago', horasTrabalhadas: 44.5, progressoReal: 3.1, progressoEsperado: 2.9, produtividadeRatio: 14.3, temGargalo: false, frenteDestaque: 'Marcação Pav. 4' },
        { semana: 'Sem 07', semanaLabel: 'Semana 07', periodo: '26/Ago - 01/Set', horasTrabalhadas: 43.0, progressoReal: 3.2, progressoEsperado: 3.0, produtividadeRatio: 13.4, temGargalo: false, frenteDestaque: 'Elevação Pav. 4' },
        { semana: 'Sem 08', semanaLabel: 'Semana 08', periodo: '02/Set - 08/Set', horasTrabalhadas: 42.5, progressoReal: 3.3, progressoEsperado: 3.0, produtividadeRatio: 12.8, temGargalo: false, frenteDestaque: 'Vergas Pav. 4' }
      ],
      instalacoes: [
        { semana: 'Sem 01', semanaLabel: 'Semana 01', periodo: '15/Jul - 21/Jul', horasTrabalhadas: 44.0, progressoReal: 2.2, progressoEsperado: 2.0, produtividadeRatio: 20.0, temGargalo: false, frenteDestaque: 'Prumadas de Água Fria' },
        { semana: 'Sem 02', semanaLabel: 'Semana 02', periodo: '22/Jul - 28/Jul', horasTrabalhadas: 45.0, progressoReal: 2.4, progressoEsperado: 2.2, produtividadeRatio: 18.7, temGargalo: false, frenteDestaque: 'Eletrodutos na Laje L4' },
        { semana: 'Sem 03', semanaLabel: 'Semana 03', periodo: '29/Jul - 04/Ago', horasTrabalhadas: 46.0, progressoReal: 2.3, progressoEsperado: 2.3, produtividadeRatio: 20.0, temGargalo: false, frenteDestaque: 'Caixas de Passagem' },
        { semana: 'Sem 04', semanaLabel: 'Semana 04', periodo: '05/Ago - 11/Ago', horasTrabalhadas: 47.0, progressoReal: 2.1, progressoEsperado: 2.4, produtividadeRatio: 22.3, temGargalo: false, frenteDestaque: 'Esgoto Secundário' },
        { semana: 'Sem 05', semanaLabel: 'Semana 05', periodo: '12/Ago - 18/Ago', horasTrabalhadas: 53.0, progressoReal: 0.9, progressoEsperado: 2.6, produtividadeRatio: 58.8, temGargalo: true, motivoGargalo: 'Conflito espacial entre dutos de exaustão e prumada hidráulica exigindo compatibilização BIM.', frenteDestaque: 'Shafts Hidráulicos' },
        { semana: 'Sem 06', semanaLabel: 'Semana 06', periodo: '19/Ago - 25/Ago', horasTrabalhadas: 46.0, progressoReal: 2.8, progressoEsperado: 2.5, produtividadeRatio: 16.4, temGargalo: false, frenteDestaque: 'Fiação de Circuitos' },
        { semana: 'Sem 07', semanaLabel: 'Semana 07', periodo: '26/Ago - 01/Set', horasTrabalhadas: 44.0, progressoReal: 2.9, progressoEsperado: 2.6, produtividadeRatio: 15.1, temGargalo: false, frenteDestaque: 'Quadros de Distribuição' },
        { semana: 'Sem 08', semanaLabel: 'Semana 08', periodo: '02/Set - 08/Set', horasTrabalhadas: 43.0, progressoReal: 3.0, progressoEsperado: 2.8, produtividadeRatio: 14.3, temGargalo: false, frenteDestaque: 'Teste de Estanqueidade' }
      ],
      acabamento: [
        { semana: 'Sem 01', semanaLabel: 'Semana 01', periodo: '15/Jul - 21/Jul', horasTrabalhadas: 42.0, progressoReal: 1.8, progressoEsperado: 1.8, produtividadeRatio: 23.3, temGargalo: false, frenteDestaque: 'Chapisco Rolado Pav. 1' },
        { semana: 'Sem 02', semanaLabel: 'Semana 02', periodo: '22/Jul - 28/Jul', horasTrabalhadas: 43.5, progressoReal: 2.1, progressoEsperado: 2.0, produtividadeRatio: 20.7, temGargalo: false, frenteDestaque: 'Emboço Paulista' },
        { semana: 'Sem 03', semanaLabel: 'Semana 03', periodo: '29/Jul - 04/Ago', horasTrabalhadas: 44.0, progressoReal: 2.3, progressoEsperado: 2.2, produtividadeRatio: 19.1, temGargalo: false, frenteDestaque: 'Contrapiso Aderido' },
        { semana: 'Sem 04', semanaLabel: 'Semana 04', periodo: '05/Ago - 11/Ago', horasTrabalhadas: 45.0, progressoReal: 2.5, progressoEsperado: 2.4, produtividadeRatio: 18.0, temGargalo: false, frenteDestaque: 'Impermeabilização Banheiros' },
        { semana: 'Sem 05', semanaLabel: 'Semana 05', periodo: '12/Ago - 18/Ago', horasTrabalhadas: 44.0, progressoReal: 2.6, progressoEsperado: 2.5, produtividadeRatio: 16.9, temGargalo: false, frenteDestaque: 'Cerâmica Parede Pav. 1' },
        { semana: 'Sem 06', semanaLabel: 'Semana 06', periodo: '19/Ago - 25/Ago', horasTrabalhadas: 50.0, progressoReal: 1.2, progressoEsperado: 2.8, produtividadeRatio: 41.6, temGargalo: true, motivoGargalo: 'Descolamento de piso porcelanato devido a umidade excessiva do contrapiso.', frenteDestaque: 'Piso Pav. 1' },
        { semana: 'Sem 07', semanaLabel: 'Semana 07', periodo: '26/Ago - 01/Set', horasTrabalhadas: 45.0, progressoReal: 2.7, progressoEsperado: 2.6, produtividadeRatio: 16.6, temGargalo: false, frenteDestaque: 'Gesso Liso Paredes' },
        { semana: 'Sem 08', semanaLabel: 'Semana 08', periodo: '02/Set - 08/Set', horasTrabalhadas: 43.0, progressoReal: 3.0, progressoEsperado: 2.8, produtividadeRatio: 14.3, temGargalo: false, frenteDestaque: 'Pintura Fundo Selador' }
      ]
    };

    return dataByFrente[selectedFrente] || dataByFrente.todas;
  }, [selectedFrente]);

  // Executive summary statistics
  const stats = useMemo(() => {
    const totalHoras = chartData.reduce((acc, d) => acc + d.horasTrabalhadas, 0);
    const mediaHoras = Math.round((totalHoras / chartData.length) * 10) / 10;
    const totalProgresso = chartData.reduce((acc, d) => acc + d.progressoReal, 0);
    const progressoAcumulado = Math.round(totalProgresso * 10) / 10;
    const gargalosCount = chartData.filter(d => d.temGargalo).length;
    const razaoMedia = Math.round((totalHoras / (totalProgresso || 1)) * 10) / 10;

    return {
      mediaHoras,
      progressoAcumulado,
      gargalosCount,
      razaoMedia
    };
  }, [chartData]);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: WeeklyProductivityData = payload[0].payload;

      return (
        <div className="bg-slate-950/95 text-white p-3 rounded-lg shadow-2xl border border-slate-700 backdrop-blur-md text-[9px] min-w-[250px] z-50">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800">
            <div>
              <span className="font-bold text-white text-[10px] block">
                {data.semanaLabel} ({data.periodo})
              </span>
              <span className="text-[7.5px] text-slate-400">
                Frente: <strong className="text-slate-200">{data.frenteDestaque}</strong>
              </span>
            </div>
            {data.temGargalo ? (
              <span className="bg-red-950 text-red-300 border border-red-800 text-[7.5px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                Gargalo
              </span>
            ) : (
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[7.5px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                Alta Eficiência
              </span>
            )}
          </div>

          <div className="space-y-1.5 mb-2">
            <div className="flex justify-between items-center bg-slate-900 px-2 py-1 rounded border border-slate-800">
              <span className="text-slate-300 flex items-center gap-1 font-semibold">
                <Clock className="w-2.5 h-2.5 text-blue-400" />
                Média Horas Trabalhadas:
              </span>
              <span className="font-mono font-black text-blue-300 text-[10px]">
                {data.horasTrabalhadas}h
              </span>
            </div>

            <div className="flex justify-between items-center bg-slate-900 px-2 py-1 rounded border border-slate-800">
              <span className="text-slate-300 flex items-center gap-1 font-semibold">
                <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
                Progresso Físico Real:
              </span>
              <span className="font-mono font-black text-emerald-300 text-[10px]">
                +{data.progressoReal}%
              </span>
            </div>

            <div className="flex justify-between items-center text-[7.5px] px-1 text-slate-400">
              <span>Progresso Planejado: <strong className="text-slate-200">+{data.progressoEsperado}%</strong></span>
              <span>Razão: <strong className={data.temGargalo ? "text-red-400" : "text-emerald-400"}>{data.produtividadeRatio}h / 1%</strong></span>
            </div>
          </div>

          {data.temGargalo && data.motivoGargalo && (
            <div className="bg-red-950/70 border border-red-900/80 p-2 rounded text-[7.5px] text-red-200">
              <span className="font-bold flex items-center gap-1 mb-0.5 text-red-300">
                <AlertTriangle className="w-2.5 h-2.5" />
                Causa Raiz do Gargalo de Produtividade:
              </span>
              <p className="italic leading-tight">
                "{data.motivoGargalo}"
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      id="productivity-vs-progress-recharts-chart"
      className="bg-white p-3 rounded-md border border-slate-200 shadow-2xs transition-all hover:border-slate-300 mb-3"
    >
      {/* 1. Header with Controls & Obra Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-2 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-center shrink-0 shadow-2xs">
            <BarChartIcon className="w-3.5 h-3.5 text-blue-700" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-black text-slate-900 text-xs tracking-tight uppercase">
                Média de Horas Trabalhadas vs. Progresso da Obra
              </h3>
              <span className="text-[7px] font-bold text-blue-800 bg-blue-100/90 border border-blue-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                <Activity className="w-2 h-2" />
                <span>Produtividade Semanal</span>
              </span>
              <span className="text-[7px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                Detecção de Gargalos Físico-Operacionais
              </span>
            </div>
            <span className="text-[8px] text-slate-400 block mt-0.5">
              Comparativo de esforço alocado em mão de obra versus entrega física real por frente de serviço
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {onSelectObra && (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
              <Filter className="w-2.5 h-2.5 text-slate-500" />
              <select
                id="productivity-obra-filter"
                value={selectedObraId}
                onChange={(e) => onSelectObra(e.target.value)}
                className="text-[8px] font-bold bg-transparent text-slate-800 focus:outline-none cursor-pointer"
                title="Filtrar por canteiro"
              >
                <option value="all">Portfólio Global</option>
                {obras.map(o => (
                  <option key={o.id} value={String(o.id)}>
                    {o.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {onNavigate && (
            <button
              onClick={() => onNavigate('equipe')}
              className="text-[7.5px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded px-2 py-1 flex items-center gap-0.5 transition-colors cursor-pointer"
            >
              <span>Equipe & MDO</span>
              <ChevronRight className="w-2 h-2" />
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
        {/* KPI 1: Média de Horas */}
        <div className="bg-slate-50 p-2 rounded border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[7px] font-bold uppercase tracking-wider">Carga Horária Média</span>
            <Clock className="w-3 h-3 text-blue-600" />
          </div>
          <div className="mt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-base font-black text-slate-900 font-mono leading-none">
                {stats.mediaHoras}h
              </span>
              <span className="text-[7px] text-slate-500 font-semibold">/semana</span>
            </div>
            <span className="text-[6.5px] text-slate-500 block mt-0.5">
              Jornada média por frente de serviço
            </span>
          </div>
        </div>

        {/* KPI 2: Progresso Físico Total */}
        <div className="bg-emerald-50/80 p-2 rounded border border-emerald-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[7px] font-bold uppercase tracking-wider">Avanço Físico 8 Semanas</span>
            <TrendingUp className="w-3 h-3 text-emerald-600" />
          </div>
          <div className="mt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-base font-black text-emerald-950 font-mono leading-none">
                +{stats.progressoAcumulado}%
              </span>
              <span className="text-[7px] text-emerald-700 font-semibold">acumulado</span>
            </div>
            <span className="text-[6.5px] text-emerald-800 block mt-0.5">
              Avanço global das frentes no ciclo
            </span>
          </div>
        </div>

        {/* KPI 3: Razão de Produtividade */}
        <div className="bg-blue-50/80 p-2 rounded border border-blue-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-800">
            <span className="text-[7px] font-bold uppercase tracking-wider">Taxa de Eficiência</span>
            <Zap className="w-3 h-3 text-blue-600" />
          </div>
          <div className="mt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-base font-black text-blue-950 font-mono leading-none">
                {stats.razaoMedia}h
              </span>
              <span className="text-[7px] text-blue-700 font-semibold">/ 1% avanço</span>
            </div>
            <span className="text-[6.5px] text-blue-800 block mt-0.5">
              Horas gastas para converter 1% de obra
            </span>
          </div>
        </div>

        {/* KPI 4: Gargalos Detectados */}
        <div className={`p-2 rounded border flex flex-col justify-between ${
          stats.gargalosCount > 0 
            ? 'bg-red-50 border-red-200 text-red-900' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-bold uppercase tracking-wider">Gargalos Identificados</span>
            <AlertTriangle className={`w-3 h-3 ${stats.gargalosCount > 0 ? 'text-red-600' : 'text-emerald-600'}`} />
          </div>
          <div className="mt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-base font-black font-mono leading-none">
                {stats.gargalosCount}
              </span>
              <span className="text-[7px] font-semibold">
                {stats.gargalosCount === 1 ? 'semana crítica' : 'semanas críticas'}
              </span>
            </div>
            <span className="text-[6.5px] block mt-0.5">
              {stats.gargalosCount > 0 
                ? 'Excesso de horas com avanço físico reduzido' 
                : 'Todas as frentes operando em alta produtividade'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Frente de Serviço Select Pills */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 flex-wrap gap-1">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            Frente de Serviço:
          </span>

          {[
            { id: 'todas', label: 'Todas as Frentes (Consolidado)' },
            { id: 'estrutura', label: 'Estrutura & Concreto' },
            { id: 'alvenaria', label: 'Alvenaria & Vedações' },
            { id: 'instalacoes', label: 'Instalações Hidráulicas & Elétricas' },
            { id: 'acabamento', label: 'Acabamento & Revestimento' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFrente(f.id as FrenteServico)}
              className={`px-2 py-0.5 rounded text-[7.5px] font-bold transition-all cursor-pointer ${
                selectedFrente === f.id
                  ? 'bg-blue-800 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <span className="text-[7px] text-slate-400 italic">
          Barras vermelhas indicam semanas com gargalo operacional
        </span>
      </div>

      {/* 4. Recharts BarChart Container */}
      <div className="p-2 rounded-lg bg-slate-50/70 border border-slate-100 mb-2">
        <div className="h-[210px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

              <XAxis 
                dataKey="semana" 
                tick={{ fill: '#475569', fontSize: 9, fontWeight: 700 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />

              {/* Y Axis Left: Horas Trabalhadas */}
              <YAxis 
                yAxisId="left"
                domain={[30, 60]}
                tick={{ fill: '#2563eb', fontSize: 8.5, fontWeight: 600 }}
                axisLine={{ stroke: '#93c5fd' }}
                tickLine={false}
                unit="h"
              />

              {/* Y Axis Right: Progresso Físico % */}
              <YAxis 
                yAxisId="right"
                orientation="right"
                domain={[0, 5]}
                tick={{ fill: '#059669', fontSize: 8.5, fontWeight: 600 }}
                axisLine={{ stroke: '#a7f3d0' }}
                tickLine={false}
                unit="%"
              />

              <RechartsTooltip content={<CustomTooltip />} />

              {/* Benchmark Reference Line: Meta de Horas Padrão (44h) */}
              <ReferenceLine 
                yAxisId="left"
                y={44} 
                stroke="#64748b" 
                strokeDasharray="3 3"
                label={{ value: 'Jornada Padrão 44h', fill: '#64748b', fontSize: 7, position: 'insideTopLeft' }}
              />

              {/* Bar 1: Horas Trabalhadas (Highlighted in Red if Gargalo) */}
              <Bar 
                yAxisId="left"
                dataKey="horasTrabalhadas" 
                name="Média Horas Trabalhadas" 
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-horas-${index}`} 
                    fill={entry.temGargalo ? '#DC2626' : '#2563EB'} 
                  />
                ))}
              </Bar>

              {/* Bar 2: Progresso Físico % */}
              <Bar 
                yAxisId="right"
                dataKey="progressoReal" 
                name="Progresso Físico (%)" 
                fill="#10B981" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[7px] text-slate-500 pt-1.5 px-2 border-t border-slate-200/80 flex-wrap gap-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2 rounded bg-blue-600" />
              <strong className="text-slate-700">Média Horas Trabalhadas</strong> (Eixo Esquerdo)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2 rounded bg-emerald-500" />
              <strong className="text-slate-700">Progresso Físico (%)</strong> (Eixo Direito)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2 rounded bg-red-600" />
              <strong className="text-red-700">Gargalo Identificado</strong> (Baixa conversão)
            </span>
          </div>

          <span className="text-slate-400">
            Dica: Clique ou passe o cursor sobre as barras para analisar as causas de retrabalho
          </span>
        </div>
      </div>

      {/* 5. Bottleneck Analysis Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {chartData.filter(d => d.temGargalo).map((g, idx) => (
          <div 
            key={g.semana}
            className="p-2 rounded-lg bg-red-50/70 border border-red-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[7px] font-mono font-bold bg-red-800 text-white px-1.5 py-0.2 rounded">
                  {g.semanaLabel} ({g.periodo})
                </span>
                <span className="text-[6.5px] font-bold text-red-700">
                  Gargalo: {g.produtividadeRatio}h para converter 1%
                </span>
              </div>
              <h5 className="font-bold text-slate-900 text-[8px] mb-0.5">
                Frente: {g.frenteDestaque} · {g.horasTrabalhadas}h gastas para apenas +{g.progressoReal}% de avanço
              </h5>
              <p className="text-[7px] text-slate-600 italic">
                "{g.motivoGargalo}"
              </p>
            </div>
            <div className="mt-1.5 pt-1 border-t border-red-200/60 flex items-center justify-between text-[6.5px] text-red-800">
              <span className="font-semibold">Ação Corretiva: Readequação de equipes e reforço logístico de insumos</span>
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
