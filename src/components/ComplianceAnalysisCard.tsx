import React, { useMemo, useState } from 'react';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Building2, 
  Calendar, 
  ChevronRight, 
  Filter, 
  Award, 
  PlusCircle,
  FileCheck2,
  CheckSquare,
  Sparkles,
  Info,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { Obra, Vistoria } from '../types/erp';

interface ComplianceAnalysisCardProps {
  vistorias: Vistoria[];
  obras: Obra[];
  selectedObraId: string;
  onSelectObra?: (obraId: string) => void;
  onNavigate?: (tab: any) => void;
  onOpenNovaVistoria?: () => void;
  onSendNotification?: (notif: { titulo: string; mensagem: string; obra_id?: number; obra_nome?: string }) => void;
}

export interface CanteiroComplianceStats {
  obra: Obra;
  vistoriasRealizadas30d: Vistoria[];
  qtdVistorias: number;
  totalItensAvaliados: number;
  totalItensConformes: number;
  totalNaoConformidades: number;
  taxaConformidadePct: number;
  mediaItensPorVistoria: number;
  status: 'excelente' | 'moderado' | 'critico';
  statusLabel: string;
  statusColor: string;
  statusBg: string;
  statusBorder: string;
  progressBarColor: string;
}

export const ComplianceAnalysisCard: React.FC<ComplianceAnalysisCardProps> = ({
  vistorias,
  obras,
  selectedObraId,
  onSelectObra,
  onNavigate,
  onOpenNovaVistoria,
  onSendNotification
}) => {
  const [selectedCanteiroTab, setSelectedCanteiroTab] = useState<string | 'all'>('all');
  const [expandedCanteiroId, setExpandedCanteiroId] = useState<number | null>(null);

  // Synchronize with external selectedObraId if provided and not 'all'
  const effectiveFilterId = selectedObraId !== 'all' ? selectedObraId : selectedCanteiroTab;

  // Filter vistorias realizadas nos últimos 30 dias
  const vistorias30d = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    return vistorias.filter(v => {
      // Must be completed / performed
      if (v.status !== 'realizada' && v.status !== 'concluida') return false;

      const dateStr = v.realizada_em || v.data_vistoria || v.data_agendada || v.created_at;
      if (!dateStr) return false;

      const d = new Date(dateStr.replace(' ', 'T'));
      if (isNaN(d.getTime())) return true; // Fallback include if date cannot be parsed

      // Verify within 30 days
      return d >= thirtyDaysAgo && d <= now;
    });
  }, [vistorias]);

  // Aggregate stats for each canteiro (obra)
  const canteirosStats = useMemo<CanteiroComplianceStats[]>(() => {
    return obras.map(obra => {
      const vistoriasCanteiro = vistorias30d.filter(v => 
        v.obra_id === obra.id || v.obra_nome === obra.nome
      );

      const qtdVistorias = vistoriasCanteiro.length;
      const totalItensAvaliados = vistoriasCanteiro.reduce((sum, v) => sum + (v.total_itens || 15), 0);
      const totalItensConformes = vistoriasCanteiro.reduce((sum, v) => sum + (v.itens_conformes || (v.total_itens || 15)), 0);
      const totalNaoConformidades = Math.max(0, totalItensAvaliados - totalItensConformes);

      const taxaConformidadePct = totalItensAvaliados > 0 
        ? Math.round((totalItensConformes / totalItensAvaliados) * 1000) / 10 
        : 100;

      const mediaItensPorVistoria = qtdVistorias > 0 
        ? Math.round((totalItensAvaliados / qtdVistorias) * 10) / 10 
        : 0;

      let status: 'excelente' | 'moderado' | 'critico' = 'excelente';
      let statusLabel = 'Alta Conformidade (≥90%)';
      let statusColor = 'text-emerald-700';
      let statusBg = 'bg-emerald-50';
      let statusBorder = 'border-emerald-200';
      let progressBarColor = 'bg-emerald-500';

      if (taxaConformidadePct < 75) {
        status = 'critico';
        statusLabel = 'Atenção Crítica (<75%)';
        statusColor = 'text-red-700';
        statusBg = 'bg-red-50';
        statusBorder = 'border-red-200';
        progressBarColor = 'bg-red-600';
      } else if (taxaConformidadePct < 90) {
        status = 'moderado';
        statusLabel = 'Conformidade Moderada (75-89%)';
        statusColor = 'text-amber-700';
        statusBg = 'bg-amber-50';
        statusBorder = 'border-amber-200';
        progressBarColor = 'bg-amber-500';
      }

      return {
        obra,
        vistoriasRealizadas30d: vistoriasCanteiro,
        qtdVistorias,
        totalItensAvaliados,
        totalItensConformes,
        totalNaoConformidades,
        taxaConformidadePct,
        mediaItensPorVistoria,
        status,
        statusLabel,
        statusColor,
        statusBg,
        statusBorder,
        progressBarColor
      };
    });
  }, [obras, vistorias30d]);

  // Global Consolidated Compliance Metrics
  const globalStats = useMemo(() => {
    const totalVistorias = canteirosStats.reduce((s, c) => s + c.qtdVistorias, 0);
    const totalItens = canteirosStats.reduce((s, c) => s + c.totalItensAvaliados, 0);
    const totalConformes = canteirosStats.reduce((s, c) => s + c.totalItensConformes, 0);
    const totalNaoConformes = canteirosStats.reduce((s, c) => s + c.totalNaoConformidades, 0);
    const taxaGeral = totalItens > 0 ? Math.round((totalConformes / totalItens) * 1000) / 10 : 100;

    return {
      totalVistorias,
      totalItens,
      totalConformes,
      totalNaoConformes,
      taxaGeral
    };
  }, [canteirosStats]);

  // Filtered list of canteiros to display
  const displayedCanteiros = useMemo(() => {
    if (effectiveFilterId === 'all') return canteirosStats;
    return canteirosStats.filter(c => String(c.obra.id) === effectiveFilterId);
  }, [canteirosStats, effectiveFilterId]);

  return (
    <div 
      id="compliance-analysis-card"
      className="bg-white p-3 rounded-md border border-slate-200 shadow-2xs transition-all hover:border-slate-300"
    >
      {/* 1. Header with Standards and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
            <ClipboardCheck className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-black text-slate-900 text-xs tracking-tight uppercase">
                Análise de Conformidade
              </h3>
              <span className="text-[7.5px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" />
                <span>Últimos 30 Dias</span>
              </span>
              <span className="text-[7px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                PBQP-H · NR-18 · ISO 9001
              </span>
            </div>
            <span className="text-[8px] text-slate-400 block mt-0.5">
              Porcentagem de itens técnicos conformes em relação ao total de vistorias realizadas para cada canteiro de obras
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {onOpenNovaVistoria && (
            <button
              onClick={onOpenNovaVistoria}
              className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[8px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
              title="Agendar ou Registrar Nova Vistoria Técnica"
            >
              <PlusCircle className="w-2.5 h-2.5" />
              <span>Nova Vistoria</span>
            </button>
          )}

          {onNavigate && (
            <button
              onClick={() => onNavigate('vistorias')}
              className="text-[7.5px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded px-2 py-1 flex items-center gap-0.5 transition-colors cursor-pointer"
            >
              <span>Ver Vistorias</span>
              <ChevronRight className="w-2 h-2" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Consolidated High-Level Metric Ribbons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {/* Metric 1: Taxa Geral de Conformidade */}
        <div className="bg-emerald-50/70 p-2 rounded border border-emerald-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[7px] font-bold uppercase tracking-wider">Conformidade Geral</span>
            <Award className="w-3 h-3 text-emerald-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-sm font-black text-emerald-950 font-mono leading-none">
              {globalStats.taxaGeral}%
            </span>
            <span className="text-[7px] text-emerald-700 font-semibold">média ponderada</span>
          </div>
        </div>

        {/* Metric 2: Vistorias Realizadas 30d */}
        <div className="bg-slate-50 p-2 rounded border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[7px] font-bold uppercase tracking-wider">Vistorias (30d)</span>
            <CheckSquare className="w-3 h-3 text-slate-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-sm font-black text-slate-900 font-mono leading-none">
              {globalStats.totalVistorias}
            </span>
            <span className="text-[7px] text-slate-500">auditorias concluídas</span>
          </div>
        </div>

        {/* Metric 3: Itens Inspecionados */}
        <div className="bg-slate-50 p-2 rounded border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[7px] font-bold uppercase tracking-wider">Itens Avaliados</span>
            <Layers className="w-3 h-3 text-slate-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-sm font-black text-slate-900 font-mono leading-none">
              {globalStats.totalItens}
            </span>
            <span className="text-[7px] text-slate-500">
              ({globalStats.totalConformes} conformes)
            </span>
          </div>
        </div>

        {/* Metric 4: Apontamentos / Não Conformidades */}
        <div className="bg-amber-50/70 p-2 rounded border border-amber-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[7px] font-bold uppercase tracking-wider">Não Conformidades</span>
            <AlertTriangle className="w-3 h-3 text-amber-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-sm font-black text-amber-950 font-mono leading-none">
              {globalStats.totalNaoConformes}
            </span>
            <span className="text-[7px] text-amber-700 font-semibold">apontamentos em tratativa</span>
          </div>
        </div>
      </div>

      {/* 3. Canteiros Filter Strip */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-[7.5px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            Canteiro:
          </span>

          <button
            onClick={() => {
              setSelectedCanteiroTab('all');
              if (onSelectObra && selectedObraId !== 'all') onSelectObra('all');
            }}
            className={`px-2 py-0.5 rounded text-[7.5px] font-bold transition-all shrink-0 cursor-pointer ${
              effectiveFilterId === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Todos os Canteiros ({canteirosStats.length})
          </button>

          {canteirosStats.map(c => {
            const isSelected = String(c.obra.id) === effectiveFilterId;
            return (
              <button
                key={c.obra.id}
                onClick={() => {
                  setSelectedCanteiroTab(String(c.obra.id));
                  if (onSelectObra) onSelectObra(String(c.obra.id));
                }}
                className={`px-2 py-0.5 rounded text-[7.5px] font-semibold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'excelente' ? 'bg-emerald-500' : c.status === 'moderado' ? 'bg-amber-500' : 'bg-red-500'}`} />
                <span className="truncate max-w-[120px]">{c.obra.nome}</span>
                <span className={`text-[6.5px] font-mono px-1 rounded ${isSelected ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {c.taxaConformidadePct}%
                </span>
              </button>
            );
          })}
        </div>

        {effectiveFilterId !== 'all' && (
          <button
            onClick={() => {
              setSelectedCanteiroTab('all');
              if (onSelectObra) onSelectObra('all');
            }}
            className="text-[7.5px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
          >
            Limpar filtro de canteiro
          </button>
        )}
      </div>

      {/* 4. Grid of Canteiros with Compliance Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {displayedCanteiros.map(c => {
          const isExpanded = expandedCanteiroId === c.obra.id;
          const isFocused = String(c.obra.id) === selectedObraId;

          return (
            <div
              key={c.obra.id}
              className={`p-2.5 rounded-lg border transition-all flex flex-col justify-between ${
                isFocused 
                  ? 'bg-emerald-50/30 border-emerald-400 ring-1 ring-emerald-200 shadow-2xs' 
                  : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Canteiro Header */}
                <div className="flex items-start justify-between gap-1.5 mb-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                      <h4 className="font-bold text-slate-900 text-[9.5px] leading-tight truncate" title={c.obra.nome}>
                        {c.obra.nome}
                      </h4>
                    </div>
                    <span className="text-[7px] text-slate-400 block mt-0.5">
                      Gestor: <strong className="text-slate-600 font-semibold">{c.obra.gestor_nome || 'Carlos Silva'}</strong> · Fase: <span className="capitalize">{c.obra.fase_atual || 'Estrutura'}</span>
                    </span>
                  </div>

                  {/* Conformity Percentage Big Badge */}
                  <div className="text-right shrink-0">
                    <div className="flex items-baseline justify-end gap-0.5">
                      <span className="text-base font-black text-slate-900 font-mono leading-none">
                        {c.taxaConformidadePct}%
                      </span>
                    </div>
                    <span className={`text-[6.5px] font-bold px-1.5 py-0.2 rounded uppercase border block mt-0.5 ${c.statusBg} ${c.statusColor} ${c.statusBorder}`}>
                      {c.status === 'excelente' ? 'Alta Conformidade' : c.status === 'moderado' ? 'Atenção' : 'Crítico'}
                    </span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-[7px] text-slate-500 mb-0.5">
                    <span className="font-bold">Itens Conformes</span>
                    <span className="font-mono">
                      {c.totalItensConformes} de {c.totalItensAvaliados} ({c.totalNaoConformidades} pendentes)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${c.progressBarColor}`}
                      style={{ width: `${Math.min(100, Math.max(5, c.taxaConformidadePct))}%` }}
                    />
                  </div>
                </div>

                {/* Sub-Metrics Pill Strip */}
                <div className="grid grid-cols-2 gap-1 bg-white p-1.5 rounded border border-slate-100 text-[7px] mb-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-slate-500">Vistorias (30d):</span>
                    <span className="font-mono font-bold text-slate-800">{c.qtdVistorias}</span>
                  </div>
                  <div className="flex items-center justify-between px-1 border-l border-slate-100">
                    <span className="text-slate-500">Média Itens:</span>
                    <span className="font-mono font-bold text-slate-800">{c.mediaItensPorVistoria}/vist</span>
                  </div>
                </div>

                {/* Recent Vistorias Preview for this Canteiro */}
                {c.vistoriasRealizadas30d.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[6.5px] font-bold uppercase tracking-wider text-slate-400 block">
                      Auditorias Recentes ({c.vistoriasRealizadas30d.length}):
                    </span>
                    <div className="space-y-0.5">
                      {c.vistoriasRealizadas30d.slice(0, isExpanded ? 5 : 2).map(v => {
                        const vistoriaPct = v.total_itens 
                          ? Math.round(((v.itens_conformes || 0) / v.total_itens) * 100) 
                          : 100;

                        return (
                          <div 
                            key={v.id} 
                            className="bg-white px-1.5 py-1 rounded border border-slate-100 flex items-center justify-between text-[7px]"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-slate-800 truncate block leading-tight">
                                {v.titulo}
                              </span>
                              <span className="text-[6px] text-slate-400">
                                {v.data_vistoria || v.realizada_em?.split(' ')[0]} · {v.tipo || 'Técnica'}
                              </span>
                            </div>
                            <div className="text-right shrink-0 ml-1">
                              <span className={`font-mono font-bold text-[7.5px] ${vistoriaPct >= 90 ? 'text-emerald-700' : 'text-amber-700'}`}>
                                {v.itens_conformes}/{v.total_itens} ({vistoriaPct}%)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer: Expand toggle & Action */}
              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                {c.vistoriasRealizadas30d.length > 2 ? (
                  <button
                    onClick={() => setExpandedCanteiroId(isExpanded ? null : c.obra.id)}
                    className="text-[7px] text-slate-500 hover:text-slate-800 font-bold underline cursor-pointer"
                  >
                    {isExpanded ? 'Ver menos' : `Ver todas (${c.vistoriasRealizadas30d.length})`}
                  </button>
                ) : (
                  <span className="text-[6.5px] text-slate-400 font-medium">100% monitorado</span>
                )}

                <button
                  onClick={() => {
                    if (onSendNotification) {
                      onSendNotification({
                        titulo: `Relatório de Conformidade: ${c.obra.nome}`,
                        mensagem: `O canteiro ${c.obra.nome} atingiu ${c.taxaConformidadePct}% de itens conformes nas últimas ${c.qtdVistorias} vistorias.`,
                        obra_id: c.obra.id,
                        obra_nome: c.obra.nome
                      });
                    }
                  }}
                  className="text-[7px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-0.5 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 transition-colors"
                  title="Emitir notificação executiva aos fiscais do canteiro"
                >
                  <span>Notificar Equipe</span>
                  <ArrowUpRight className="w-2 h-2" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Footer Quality Seal */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[7.5px] text-slate-500 gap-1">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>
            Critério de Pontuação: <strong>Conformes / Total Inspecionado</strong> (amostras com ensaios tecnológicos e check-lists rastreáveis).
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>Meta Corporativa: <strong className="text-slate-800 font-bold">≥ 90.0%</strong></span>
          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
            {globalStats.taxaGeral >= 90 ? 'Meta Atingida' : 'Abaixo da Meta'}
          </span>
        </div>
      </div>
    </div>
  );
};
