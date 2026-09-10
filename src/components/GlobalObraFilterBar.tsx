import React from 'react';
import { 
  Building2, 
  Filter, 
  CheckCircle2, 
  HardHat, 
  Package, 
  ShieldAlert, 
  X, 
  Layers, 
  TrendingUp,
  MapPin,
  User,
  DollarSign,
  Clock,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { Obra } from '../types/erp';

export interface GlobalObraFilterBarProps {
  obras: Obra[];
  selectedObraId: string; // 'all' or string representation of obra.id
  onSelectObra: (obraId: string) => void;
  metrics?: {
    totalObras: number;
    colaboradoresCount: number;
    materiaisCriticosCount: number;
    riscosCriticosCount: number;
    vistoriasCount: number;
    orcamentoTotal: number;
  };
  onNavigate?: (tab: string) => void;
  onSelectObraZoom?: (obra: Obra) => void;
}

export const GlobalObraFilterBar: React.FC<GlobalObraFilterBarProps> = ({
  obras,
  selectedObraId,
  onSelectObra,
  metrics,
  onNavigate,
  onSelectObraZoom
}) => {
  const selectedObra = obras.find(o => String(o.id) === selectedObraId);
  const isFiltered = selectedObraId !== 'all' && selectedObra !== undefined;

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'em_andamento':
        return { label: 'Em Andamento', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'planejamento':
        return { label: 'Planejamento', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'concluida':
        return { label: 'Concluída', dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'pausada':
        return { label: 'Pausada', dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200' };
      default:
        return { label: status, dot: 'bg-slate-400', badge: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div 
      id="global-obra-filter-container" 
      className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden transition-all"
    >
      {/* Top Strip: Filter Header & Main Dropdown */}
      <div className="p-2 sm:p-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/50">
        
        {/* Title & Filter Identity */}
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border transition-all ${
            isFiltered 
              ? 'bg-red-700 text-white border-red-800 shadow-xs' 
              : 'bg-slate-900 text-white border-slate-800'
          }`}>
            <Filter className="w-3.5 h-3.5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-[11px] font-black text-slate-900 leading-none">
                Filtro por Obra
              </h2>
              <span className={`text-[7px] font-bold px-1.5 py-0.2 rounded-full border transition-all ${
                isFiltered 
                  ? 'bg-red-50 text-red-700 border-red-200 font-extrabold' 
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {isFiltered ? `Obra Ativa: ${selectedObra?.nome}` : 'Portfólio Global Consolidado'}
              </span>
              <span className="hidden sm:inline-flex text-[6.5px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold items-center gap-1">
                <Sparkles className="w-2 h-2" />
                Alternância Dinâmica: Risco · Mão de Obra · Materiais
              </span>
            </div>
            <p className="text-[7.5px] text-slate-500 truncate mt-0.5">
              Alterne instantaneamente os dados e KPIs de todo o painel sem recarregar a página
            </p>
          </div>
        </div>

        {/* Dropdown Selector & Reset Action */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          <div className="flex items-center gap-1 bg-slate-100/80 border border-slate-300 rounded px-1.5 py-0.5 shadow-2xs">
            <Building2 className="w-3 h-3 text-slate-500" />
            <select
              id="global-obra-select"
              value={selectedObraId}
              onChange={(e) => onSelectObra(e.target.value)}
              className="text-[8px] font-bold bg-transparent text-slate-900 focus:outline-none cursor-pointer pr-1"
              title="Selecione uma obra específica para filtrar todo o painel"
            >
              <option value="all">🌐 Todas as Obras (Portfólio Global - {obras.length} canteiros)</option>
              {obras.map((obra) => {
                const badge = getStatusBadge(obra.status);
                return (
                  <option key={obra.id} value={String(obra.id)}>
                    🏗️ {obra.nome} ({badge.label} · {obra.progresso ?? 0}%)
                  </option>
                );
              })}
            </select>
          </div>

          {isFiltered && (
            <button
              id="btn-clear-global-obra-filter"
              onClick={() => onSelectObra('all')}
              className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[7.5px] font-bold border border-slate-300 transition-all cursor-pointer shadow-2xs"
              title="Voltar à visualização de todas as obras"
            >
              <X className="w-2.5 h-2.5 text-slate-500" />
              <span>Ver Todas as Obras</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Chips Strip: Single-click toggling between works */}
      <div className="px-2 sm:px-2.5 py-1.5 bg-slate-50/50 border-b border-slate-100 flex items-center gap-1 overflow-x-auto no-scrollbar">
        <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-0.5">
          Canteiros:
        </span>

        {/* 'All Obras' Chip */}
        <button
          id="btn-filter-obra-all"
          onClick={() => onSelectObra('all')}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[7.5px] font-bold transition-all shrink-0 cursor-pointer ${
            selectedObraId === 'all'
              ? 'bg-slate-900 text-white shadow-2xs ring-1 ring-slate-700'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
          }`}
        >
          <Layers className="w-2.5 h-2.5" />
          <span>Todas ({obras.length})</span>
        </button>

        {/* Individual Obra Chips */}
        {obras.map((obra) => {
          const isCurrent = String(obra.id) === selectedObraId;
          const badge = getStatusBadge(obra.status);
          const prog = obra.progresso ?? 0;

          return (
            <button
              key={obra.id}
              id={`btn-filter-obra-${obra.id}`}
              onClick={() => onSelectObra(String(obra.id))}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[7.5px] font-bold transition-all shrink-0 cursor-pointer ${
                isCurrent
                  ? 'bg-red-700 text-white shadow-2xs ring-2 ring-red-300'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
              }`}
              title={`${obra.nome} - Status: ${badge.label} - Progresso: ${prog}%`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCurrent ? 'bg-white' : badge.dot}`} />
              <span className="truncate max-w-[130px] sm:max-w-[160px]">{obra.nome}</span>
              <span className={`px-1 py-0.2 rounded font-mono text-[6.5px] ${
                isCurrent ? 'bg-red-800 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {prog}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Contextual Active Banner: Details of filtered Obra or Global Summary */}
      {isFiltered && selectedObra ? (
        <div 
          id="global-obra-context-banner" 
          className="p-2 sm:p-2.5 bg-gradient-to-r from-red-50/60 via-amber-50/30 to-blue-50/40 flex flex-col md:flex-row md:items-center justify-between gap-2 text-[7.5px]"
        >
          {/* Obra Metadata */}
          <div className="flex items-start sm:items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded bg-white border border-red-200 text-red-700 flex items-center justify-center shrink-0 shadow-2xs font-black text-[10px]">
              {selectedObra.id}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 text-[9.5px] truncate leading-tight">
                  {selectedObra.nome}
                </h3>
                <span className={`px-1.5 py-0.2 rounded border font-bold text-[6.5px] uppercase ${getStatusBadge(selectedObra.status).badge}`}>
                  {getStatusBadge(selectedObra.status).label}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium text-[6.5px]">
                  Fase: <strong className="capitalize">{selectedObra.fase_atual || 'Estrutura'}</strong>
                </span>
              </div>

              <div className="flex items-center gap-3 text-slate-500 text-[7px] mt-0.5 flex-wrap">
                <span className="flex items-center gap-0.5 truncate">
                  <MapPin className="w-2.5 h-2.5 text-slate-400" />
                  {selectedObra.endereco}
                </span>
                <span className="flex items-center gap-0.5">
                  <User className="w-2.5 h-2.5 text-slate-400" />
                  Gestor: <strong className="text-slate-700">{selectedObra.gestor_nome || 'Engenharia'}</strong>
                </span>
                <span className="flex items-center gap-0.5 font-mono">
                  <DollarSign className="w-2.5 h-2.5 text-slate-400" />
                  Orç: <strong className="text-slate-800">{formatCurrency(selectedObra.orcamento_total)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* 3 Domain Impact Status Indicators (Risco, Mão de Obra, Materiais) */}
          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            {/* Risco / SST Indicator */}
            <div 
              onClick={() => onNavigate && onNavigate('documentos')}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-white rounded border border-purple-200 text-purple-900 shadow-2xs cursor-pointer hover:bg-purple-50 transition-colors"
              title="Dados de Risco, Vistorias e SST filtrados para esta obra"
            >
              <ShieldAlert className="w-2.5 h-2.5 text-purple-700" />
              <span className="font-bold">Risco:</span>
              <span className="text-purple-700 font-semibold">SST Filtrado</span>
            </div>

            {/* Mão de Obra Indicator */}
            <div 
              onClick={() => onNavigate && onNavigate('equipe')}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-white rounded border border-blue-200 text-blue-900 shadow-2xs cursor-pointer hover:bg-blue-50 transition-colors"
              title="Efetivo de mão de obra e custos filtrados para esta obra"
            >
              <HardHat className="w-2.5 h-2.5 text-blue-700" />
              <span className="font-bold">MDO:</span>
              <span className="text-blue-700 font-semibold">{metrics?.colaboradoresCount ?? 'Ativos'} colab.</span>
            </div>

            {/* Materiais Indicator */}
            <div 
              onClick={() => onNavigate && onNavigate('materiais')}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-white rounded border border-emerald-200 text-emerald-900 shadow-2xs cursor-pointer hover:bg-emerald-50 transition-colors"
              title="Estoque de materiais e itens do almoxarifado filtrados para esta obra"
            >
              <Package className="w-2.5 h-2.5 text-emerald-700" />
              <span className="font-bold">Materiais:</span>
              <span className="text-emerald-700 font-semibold">Estoque Canteiro</span>
            </div>

            {onSelectObraZoom && (
              <button
                onClick={() => onSelectObraZoom(selectedObra)}
                className="px-1.5 py-0.5 bg-red-700 hover:bg-red-800 text-white rounded font-bold text-[7px] transition-colors shadow-2xs cursor-pointer"
              >
                Detalhes & Fases
              </button>
            )}
          </div>
        </div>
      ) : (
        <div 
          id="global-obra-portfolio-banner"
          className="px-2 sm:px-2.5 py-1 bg-slate-50/80 flex items-center justify-between text-[7px] text-slate-500 border-t border-slate-100"
        >
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Visão Panorâmica Consolidada:
            </span>
            <span>{obras.length} Obras Monitoradas</span>
            <span>·</span>
            <span>{metrics?.colaboradoresCount ?? 0} Colaboradores em Campo</span>
            <span>·</span>
            <span>{metrics?.materiaisCriticosCount ?? 0} Insumos com Alerta</span>
            <span>·</span>
            <span>{metrics?.vistoriasCount ?? 0} Vistorias Agendadas</span>
          </div>

          <span className="font-mono font-bold text-slate-700 hidden md:inline">
            CAPEX Portfólio: {formatCurrency(metrics?.orcamentoTotal ?? 0)}
          </span>
        </div>
      )}
    </div>
  );
};
