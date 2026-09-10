import React, { useState } from 'react';
import { 
  Building2, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ChevronRight, 
  Target, 
  Layers, 
  BarChart3,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Obra } from '../types/erp';

interface GlobalProgressStatusCardProps {
  obras: Obra[];
  onNavigate: (tab: string) => void;
  onSelectObra?: (obra: Obra) => void;
}

export const GlobalProgressStatusCard: React.FC<GlobalProgressStatusCardProps> = ({
  obras,
  onNavigate,
  onSelectObra
}) => {
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);

  const totalObras = obras.length;

  // Cálculo exato do percentual médio de conclusão global de todas as obras cadastradas
  const percentualMedioGlobal = totalObras > 0
    ? Math.round(
        obras.reduce((acc, o) => {
          const prog = typeof o.progresso === 'number' ? o.progresso : (o.status === 'concluida' ? 100 : 0);
          return acc + prog;
        }, 0) / totalObras
      )
    : 0;

  // Classificação das obras
  const obrasConcluidas = obras.filter(
    o => o.status === 'concluida' || (typeof o.progresso === 'number' && o.progresso >= 100)
  );
  const obrasEmAndamento = obras.filter(
    o => o.status === 'em_andamento' || (typeof o.progresso === 'number' && o.progresso > 0 && o.progresso < 100)
  );
  const obrasPlanejamento = obras.filter(
    o => o.status === 'planejamento' || (o.status !== 'concluida' && (o.progresso === undefined || o.progresso === 0))
  );

  // Status visual textual do ritmo global
  const getRitmoStatus = (pct: number) => {
    if (pct >= 80) return { label: 'Fase de Conclusão Avançada', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (pct >= 50) return { label: 'Execução em Ritmo Pleno', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (pct >= 25) return { label: 'Avanço de Estrutura & Vedações', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
    return { label: 'Fase Inicial / Fundações', color: 'text-amber-800 bg-amber-50 border-amber-200' };
  };

  const ritmo = getRitmoStatus(percentualMedioGlobal);

  return (
    <div 
      id="status-card-conclusao-global-obras"
      className="bg-white rounded-md border border-slate-200 p-2.5 shadow-2xs transition-all hover:border-slate-300"
    >
      {/* Header & Main Percentage Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
            <Target className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-slate-900 text-xs leading-none">
                Percentual Médio de Conclusão Global
              </h3>
              <span className={`text-[7px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${ritmo.color}`}>
                {ritmo.label}
              </span>
            </div>
            <p className="text-[7.5px] text-slate-500 mt-0.5 font-medium">
              Avanço físico ponderado calculado sobre o portfólio total de <strong className="text-slate-800 font-bold">{totalObras} obras cadastradas</strong>
            </p>
          </div>
        </div>

        {/* Big Number & Action */}
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          <div className="text-right">
            <div className="flex items-baseline gap-1 justify-end">
              <span 
                id="metric-percentual-medio-global" 
                className="text-lg font-black font-mono text-slate-900 leading-none"
              >
                {percentualMedioGlobal}%
              </span>
              <span className="text-[8px] font-bold text-emerald-700">médio geral</span>
            </div>
            <span className="text-[6.5px] text-slate-400 block mt-0.5 font-mono">
              {obrasConcluidas.length} de {totalObras} concluídas (100%)
            </span>
          </div>

          <button
            id="btn-ver-todas-obras-status-card"
            onClick={() => onNavigate('obras')}
            className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-red-700 text-white rounded text-[7.5px] font-bold transition-all cursor-pointer shadow-2xs"
            title="Ver lista detalhada de obras cadastradas"
          >
            <span>Ver Obras</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Global Progress Bar Visual */}
      <div className="pt-2">
        <div className="flex items-center justify-between text-[7px] font-semibold text-slate-600 mb-1">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-2.5 h-2.5 text-emerald-600" />
            <span>Progresso Médio Acumulado</span>
          </span>
          <span className="font-mono text-slate-700 font-bold">
            {percentualMedioGlobal}% de 100%
          </span>
        </div>

        {/* Multi-tier styled progress bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80">
          <div 
            id="progress-bar-conclusao-global-fill"
            className="h-full bg-emerald-600 rounded-full transition-all duration-700 relative"
            style={{ width: `${Math.max(2, Math.min(100, percentualMedioGlobal))}%` }}
          />
        </div>

        {/* Milestone Steps Markers */}
        <div className="flex justify-between text-[6px] text-slate-400 font-mono mt-1 px-0.5">
          <span>0% (Início)</span>
          <span>25% (Fundações)</span>
          <span>50% (Estrutura)</span>
          <span>75% (Acabamento)</span>
          <span>100% (Entrega)</span>
        </div>
      </div>

      {/* Status Breakdown Pills */}
      <div className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-slate-100">
        <div className="bg-slate-50 p-1.5 rounded border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[6.5px] uppercase font-bold text-slate-400 block truncate">Em Andamento</span>
              <span className="text-[9px] font-black text-slate-800 leading-none font-mono">
                {obrasEmAndamento.length}
              </span>
            </div>
          </div>
          <span className="text-[6.5px] font-mono text-blue-700 bg-blue-50 px-1 py-0.2 rounded font-bold">
            {totalObras > 0 ? Math.round((obrasEmAndamento.length / totalObras) * 100) : 0}%
          </span>
        </div>

        <div className="bg-slate-50 p-1.5 rounded border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[6.5px] uppercase font-bold text-slate-400 block truncate">Concluídas</span>
              <span className="text-[9px] font-black text-slate-800 leading-none font-mono">
                {obrasConcluidas.length}
              </span>
            </div>
          </div>
          <span className="text-[6.5px] font-mono text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded font-bold">
            {totalObras > 0 ? Math.round((obrasConcluidas.length / totalObras) * 100) : 0}%
          </span>
        </div>

        <div className="bg-slate-50 p-1.5 rounded border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[6.5px] uppercase font-bold text-slate-400 block truncate">Planejamento</span>
              <span className="text-[9px] font-black text-slate-800 leading-none font-mono">
                {obrasPlanejamento.length}
              </span>
            </div>
          </div>
          <span className="text-[6.5px] font-mono text-amber-700 bg-amber-50 px-1 py-0.2 rounded font-bold">
            {totalObras > 0 ? Math.round((obrasPlanejamento.length / totalObras) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Toggle Individual Obra Progress List */}
      <div className="mt-1.5 pt-1.5 border-t border-slate-100">
        <button
          id="btn-toggle-detalhes-obras-progresso"
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full flex items-center justify-between text-[7px] font-bold text-slate-600 hover:text-slate-900 transition-colors py-0.5 cursor-pointer"
        >
          <span className="flex items-center gap-1">
            <Layers className="w-2.5 h-2.5 text-slate-500" />
            <span>Detalhamento por Obra ({totalObras} cadastradas)</span>
          </span>
          <span className="flex items-center gap-0.5 text-blue-700">
            <span>{showBreakdown ? 'Ocultar' : 'Exibir Obras'}</span>
            {showBreakdown ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
          </span>
        </button>

        {showBreakdown && (
          <div className="mt-1.5 space-y-1 max-h-48 overflow-y-auto pr-0.5">
            {obras.map((obra) => {
              const prog = typeof obra.progresso === 'number' ? obra.progresso : (obra.status === 'concluida' ? 100 : 0);
              return (
                <div
                  key={obra.id}
                  id={`obra-progress-row-${obra.id}`}
                  onClick={() => onSelectObra ? onSelectObra(obra) : onNavigate('obras')}
                  className="p-1 bg-slate-50 hover:bg-slate-100 rounded border border-slate-100 flex items-center justify-between gap-2 cursor-pointer transition-colors text-[7px]"
                  title="Clique para inspecionar esta obra"
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      prog >= 100 ? 'bg-emerald-500' :
                      prog > 50 ? 'bg-blue-600' :
                      prog > 0 ? 'bg-amber-500' : 'bg-slate-400'
                    }`} />
                    <span className="font-bold text-slate-800 truncate">{obra.nome}</span>
                    <span className="text-[6px] text-slate-400 uppercase font-mono">
                      {obra.fase_atual || obra.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-16 h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          prog >= 100 ? 'bg-emerald-600' :
                          prog > 50 ? 'bg-blue-600' :
                          prog > 0 ? 'bg-amber-500' : 'bg-slate-300'
                        }`}
                        style={{ width: `${prog}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold text-slate-900 w-7 text-right">
                      {prog}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
