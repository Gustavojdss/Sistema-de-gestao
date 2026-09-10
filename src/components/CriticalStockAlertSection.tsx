import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  AlertOctagon, 
  Package, 
  ShoppingCart, 
  Zap, 
  Check, 
  Building2, 
  Search, 
  SlidersHorizontal, 
  ChevronRight, 
  ExternalLink, 
  ArrowUpRight, 
  Layers, 
  Clock, 
  DollarSign, 
  Sparkles, 
  RefreshCw, 
  FileSpreadsheet, 
  CheckCircle2, 
  Truck
} from 'lucide-react';
import { MaterialConsumo, Obra, SolicitacaoMaterial } from '../types/erp';

interface CriticalStockAlertSectionProps {
  materiais: MaterialConsumo[];
  obras?: Obra[];
  onNavigate?: (tab: string) => void;
  onOpenNovaSolicitacao?: () => void;
  onQuickReplenish?: (material: MaterialConsumo, suggestedQty?: number) => void;
}

export interface CriticalMaterialDetail {
  material: MaterialConsumo;
  deficitQtd: number;
  percentualEstoqueSeguranca: number;
  statusCritico: 'ruptura' | 'critico_severo' | 'critico_moderado' | 'seguro';
  sugestaoReposicao: number;
  custoEstimadoReposicao: number;
  obraNome: string;
}

export const CriticalStockAlertSection: React.FC<CriticalStockAlertSectionProps> = ({
  materiais,
  obras = [],
  onNavigate,
  onOpenNovaSolicitacao,
  onQuickReplenish
}) => {
  const [selectedObraId, setSelectedObraId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'ruptura' | 'severo'>('all');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [repositionedIds, setRepositionedIds] = useState<Record<number, boolean>>({});
  const [customModalItem, setCustomModalItem] = useState<CriticalMaterialDetail | null>(null);
  const [customQty, setCustomQty] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const formatBRL = (val?: number) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Process all materials and identify those below safety stock (quantidade_minima)
  const criticalItems = useMemo<CriticalMaterialDetail[]>(() => {
    return materiais
      .filter(m => {
        const saldo = Number(m.quantidade_atual) || 0;
        const minimo = Number(m.quantidade_minima) || 0;
        return saldo <= minimo && minimo > 0;
      })
      .map(material => {
        const saldo = Number(material.quantidade_atual) || 0;
        const minimo = Number(material.quantidade_minima) || 0;
        const deficitQtd = Math.max(0, minimo - saldo);
        const percentualEstoqueSeguranca = minimo > 0 ? Math.round((saldo / minimo) * 100) : 100;
        
        // Sugestão de reposição inteligente: atingir 2x o estoque de segurança (lote regulador)
        const sugestaoReposicao = Math.max(minimo, (minimo * 2) - saldo);
        const custoEstimadoReposicao = sugestaoReposicao * (Number(material.valor_unitario) || 0);

        let statusCritico: CriticalMaterialDetail['statusCritico'] = 'critico_moderado';
        if (saldo === 0) {
          statusCritico = 'ruptura';
        } else if (percentualEstoqueSeguranca <= 50) {
          statusCritico = 'critico_severo';
        }

        const obra = obras.find(o => o.id === material.obra_id);
        const obraNome = material.obra_nome || obra?.nome || 'Canteiro Principal';

        return {
          material,
          deficitQtd,
          percentualEstoqueSeguranca,
          statusCritico,
          sugestaoReposicao,
          custoEstimadoReposicao,
          obraNome
        };
      })
      .sort((a, b) => {
        // Ordenar: primeiro ruptura (0 saldo), depois menor percentual de estoque
        if (a.material.quantidade_atual === 0 && b.material.quantidade_atual !== 0) return -1;
        if (b.material.quantidade_atual === 0 && a.material.quantidade_atual !== 0) return 1;
        return a.percentualEstoqueSeguranca - b.percentualEstoqueSeguranca;
      });
  }, [materiais, obras]);

  // Filter items based on user criteria
  const filteredCriticalItems = useMemo(() => {
    return criticalItems.filter(item => {
      // Obra filter
      if (selectedObraId !== 'all') {
        const targetObra = obras.find(o => String(o.id) === selectedObraId);
        if (targetObra && !item.obraNome.toLowerCase().includes(targetObra.nome.toLowerCase())) {
          return false;
        }
      }

      // Severity filter
      if (filterSeverity === 'ruptura' && item.statusCritico !== 'ruptura') return false;
      if (filterSeverity === 'severo' && item.statusCritico !== 'ruptura' && item.statusCritico !== 'critico_severo') return false;

      // Search term
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchName = item.material.nome.toLowerCase().includes(term);
        const matchCode = item.material.codigo.toLowerCase().includes(term);
        const matchCat = (item.material.categoria_nome || '').toLowerCase().includes(term);
        const matchForn = (item.material.fornecedor_padrao || '').toLowerCase().includes(term);
        if (!matchName && !matchCode && !matchCat && !matchForn) return false;
      }

      return true;
    });
  }, [criticalItems, selectedObraId, filterSeverity, searchTerm, obras]);

  // Metrics summary
  const summary = useMemo(() => {
    const totalCriticos = criticalItems.length;
    const totalRupturas = criticalItems.filter(i => i.statusCritico === 'ruptura').length;
    const totalSeveros = criticalItems.filter(i => i.statusCritico === 'critico_severo').length;
    const custoTotalRecomposicao = criticalItems.reduce((acc, curr) => acc + curr.custoEstimadoReposicao, 0);

    return {
      totalCriticos,
      totalRupturas,
      totalSeveros,
      custoTotalRecomposicao
    };
  }, [criticalItems]);

  // 1-Click Replenish Handler for single item
  const handleSingle1ClickReplenish = (item: CriticalMaterialDetail) => {
    setProcessingId(item.material.id);
    
    setTimeout(() => {
      if (onQuickReplenish) {
        onQuickReplenish(item.material, item.sugestaoReposicao);
      }
      setRepositionedIds(prev => ({ ...prev, [item.material.id]: true }));
      setProcessingId(null);
      setToastMessage(`⚡ Pedido de reposição de ${item.sugestaoReposicao} ${item.material.unidade_medida} de "${item.material.nome}" enviado com sucesso!`);
      setTimeout(() => setToastMessage(null), 4000);
    }, 400);
  };

  // 1-Click Replenish ALL critical items in batch
  const handleBatch1ClickReplenish = () => {
    if (filteredCriticalItems.length === 0) return;
    
    filteredCriticalItems.forEach(item => {
      if (onQuickReplenish) {
        onQuickReplenish(item.material, item.sugestaoReposicao);
      }
    });

    const newMap: Record<number, boolean> = { ...repositionedIds };
    filteredCriticalItems.forEach(item => {
      newMap[item.material.id] = true;
    });
    setRepositionedIds(newMap);

    setToastMessage(`⚡ ${filteredCriticalItems.length} solicitações de reposição em lote geradas com sucesso para o departamento de compras!`);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Open custom modal to edit quantity
  const handleOpenCustomReplenish = (item: CriticalMaterialDetail) => {
    setCustomModalItem(item);
    setCustomQty(item.sugestaoReposicao);
  };

  const handleConfirmCustomReplenish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customModalItem || customQty <= 0) return;

    if (onQuickReplenish) {
      onQuickReplenish(customModalItem.material, customQty);
    }

    setRepositionedIds(prev => ({ ...prev, [customModalItem.material.id]: true }));
    setToastMessage(`Solicitação de ${customQty} ${customModalItem.material.unidade_medida} de "${customModalItem.material.nome}" confirmada!`);
    setCustomModalItem(null);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div 
      id="section-estoque-seguranca" 
      className="bg-white rounded-lg border border-red-200/90 shadow-xs overflow-hidden transition-all animate-fadeIn"
    >
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="bg-slate-900 text-white px-3 py-1.5 text-[8px] font-bold flex items-center justify-between gap-2 animate-fadeIn border-b border-red-500">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400 animate-bounce" />
            <span className="text-amber-200">{toastMessage}</span>
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
      {/* 1. CABEÇALHO DO PAINEL DE ESTOQUE DE SEGURANÇA                            */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-red-950 via-slate-950 to-slate-900 text-white px-3 py-2 sm:px-4 sm:py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-red-900/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs ring-2 ring-red-400/40">
            <AlertOctagon className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-extrabold text-[12px] sm:text-[13px] text-white tracking-tight leading-tight flex items-center gap-1.5">
                <span>Alerta de Estoque de Segurança & Reposição em 1-Clique</span>
              </h3>
              <span className="text-[7.5px] font-bold bg-red-500/20 text-red-300 px-1.5 py-0.2 rounded border border-red-500/40 flex items-center gap-1">
                <Package className="w-2.5 h-2.5 text-red-400" />
                <span>Saldo ≤ Estoque Mínimo Regulador</span>
              </span>
              {summary.totalCriticos > 0 && (
                <span className="text-[7px] font-black bg-red-600 text-white px-1.5 py-0.2 rounded-full uppercase tracking-tight animate-pulse">
                  {summary.totalCriticos} {summary.totalCriticos === 1 ? 'Item Crítico' : 'Itens Críticos'}
                </span>
              )}
            </div>
            <p className="text-[7.5px] sm:text-[8px] text-slate-300/80 truncate mt-0.5">
              Monitoramento em tempo real de materiais com saldo inferior à quantidade mínima de segurança com solicitação imediata de compra.
            </p>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          {summary.totalCriticos > 0 && (
            <button
              id="btn-repor-todos-criticos"
              onClick={handleBatch1ClickReplenish}
              className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded text-[8px] flex items-center gap-1 shadow-2xs transition-all cursor-pointer border border-red-400 animate-pulse"
              title="Disparar solicitação de compra em lote para todos os materiais abaixo do estoque de segurança"
            >
              <Zap className="w-2.5 h-2.5 text-amber-300" />
              <span>Repor Todos ({filteredCriticalItems.length}) em 1-Clique</span>
            </button>
          )}

          {onNavigate && (
            <button
              id="btn-ver-materiais-completo"
              onClick={() => onNavigate('materiais')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded text-[8px] flex items-center gap-1 shadow-2xs border border-slate-700 transition-all cursor-pointer"
              title="Abrir módulo completo de Almoxarifado e Estoque"
            >
              <ShoppingCart className="w-2.5 h-2.5" />
              <span>Ver Almoxarifado</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STATS KPI MINI-STRIP                                                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-2 bg-red-50/50 border-b border-red-200 text-[8px]">
        
        {/* KPI 1: Ruptura Total (Saldo = 0) */}
        <div className="bg-white p-1.5 rounded border border-red-300 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[7px] font-bold text-red-900 uppercase block">Ruptura Total (Saldo = 0)</span>
            <span className="text-[13px] font-black text-red-700 leading-none">{summary.totalRupturas}</span>
          </div>
          <div className="w-5 h-5 rounded-full bg-red-100 text-red-800 flex items-center justify-center font-bold">
            <AlertOctagon className="w-3 h-3 text-red-700 animate-pulse" />
          </div>
        </div>

        {/* KPI 2: Crítico Severo (≤ 50% do Mínimo) */}
        <div className="bg-white p-1.5 rounded border border-orange-300 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[7px] font-bold text-orange-900 uppercase block">Crítico Severo (≤ 50%)</span>
            <span className="text-[13px] font-black text-orange-700 leading-none">{summary.totalSeveros}</span>
          </div>
          <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center font-bold">
            <AlertTriangle className="w-3 h-3 text-orange-700" />
          </div>
        </div>

        {/* KPI 3: Total de Itens Abaixo do Mínimo */}
        <div className="bg-white p-1.5 rounded border border-amber-300 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[7px] font-bold text-amber-900 uppercase block">Abaixo da Segurança</span>
            <span className="text-[13px] font-black text-amber-800 leading-none">{summary.totalCriticos}</span>
          </div>
          <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Package className="w-3 h-3 text-amber-800" />
          </div>
        </div>

        {/* KPI 4: Investimento Estimado de Recomposição */}
        <div className="bg-white p-1.5 rounded border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[7px] font-bold text-slate-600 uppercase block">Investimento Recomposição</span>
            <span className="text-[12px] font-black text-slate-900 leading-none">{formatBRL(summary.custoTotalRecomposicao)}</span>
          </div>
          <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <DollarSign className="w-3 h-3" />
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. FILTROS & BARRA DE PESQUISA                                            */}
      {/* ========================================================================= */}
      <div className="p-2 sm:p-2.5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 text-[8px]">
        
        {/* Severity Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          <button
            id="tab-filter-criticos-todos"
            onClick={() => setFilterSeverity('all')}
            className={`px-2 py-1 rounded font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              filterSeverity === 'all'
                ? 'bg-red-800 text-white shadow-2xs font-extrabold'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>Todos os Críticos ({summary.totalCriticos})</span>
          </button>

          <button
            id="tab-filter-criticos-ruptura"
            onClick={() => setFilterSeverity('ruptura')}
            className={`px-2 py-1 rounded font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              filterSeverity === 'ruptura'
                ? 'bg-red-950 text-white shadow-2xs font-extrabold ring-1 ring-red-500'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertOctagon className="w-2.5 h-2.5 text-red-400" />
            <span>Ruptura Total ({summary.totalRupturas})</span>
          </button>

          <button
            id="tab-filter-criticos-severos"
            onClick={() => setFilterSeverity('severo')}
            className={`px-2 py-1 rounded font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              filterSeverity === 'severo'
                ? 'bg-orange-800 text-white shadow-2xs font-extrabold'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-2.5 h-2.5 text-orange-300" />
            <span>Críticos ≤ 50% ({summary.totalSeveros + summary.totalRupturas})</span>
          </button>
        </div>

        {/* Obra Filter & Search Input */}
        <div className="flex items-center gap-1.5 flex-1 md:max-w-md justify-end">
          {/* Obra Select */}
          <div className="flex items-center gap-1 bg-white border border-slate-300 px-1.5 py-0.5 rounded text-[7.5px] shrink-0">
            <Building2 className="w-2.5 h-2.5 text-slate-500" />
            <select
              value={selectedObraId}
              onChange={(e) => setSelectedObraId(e.target.value)}
              aria-label="Filtrar por canteiro no painel de estoque de segurança"
              className="bg-transparent text-slate-800 font-semibold text-[7.5px] focus:outline-hidden cursor-pointer max-w-[110px] truncate"
            >
              <option value="all">Todas as Obras</option>
              {obras.map(o => (
                <option key={o.id} value={String(o.id)}>{o.nome}</option>
              ))}
            </select>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-2.5 h-2.5 text-slate-400 absolute left-1.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar material, código ou fornecedor..."
              className="w-full pl-5 pr-2 py-0.5 bg-white border border-slate-300 rounded text-[7.5px] text-slate-800 focus:outline-hidden focus:border-red-500"
            />
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. LISTAGEM EM GRADE / CARDS DE MATERIAIS CRÍTICOS                        */}
      {/* ========================================================================= */}
      <div className="p-2.5 sm:p-3">
        {filteredCriticalItems.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1.5 opacity-80" />
            <h4 className="text-[10px] font-bold text-slate-800">Estoque de Segurança 100% Suprido</h4>
            <p className="text-[8px] text-slate-500 mt-0.5 max-w-sm mx-auto">
              Nenhum material de consumo está abaixo da quantidade mínima necessária para a continuidade das frentes de obra.
            </p>
            {onNavigate && (
              <button
                onClick={() => onNavigate('materiais')}
                className="mt-2 px-2.5 py-1 bg-slate-900 text-white rounded text-[7.5px] font-bold hover:bg-slate-800 cursor-pointer"
              >
                Abrir Catálogo de Materiais
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filteredCriticalItems.map((item) => {
              const mat = item.material;
              const isRuptura = item.statusCritico === 'ruptura';
              const isRepositioned = repositionedIds[mat.id];
              const isProcessing = processingId === mat.id;

              return (
                <div
                  key={mat.id}
                  className={`rounded-lg p-2.5 border transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs ${
                    isRepositioned
                      ? 'bg-emerald-50/90 border-emerald-300 ring-1 ring-emerald-200'
                      : isRuptura 
                      ? 'bg-red-50/90 border-red-300 ring-1 ring-red-200' 
                      : 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-100'
                  }`}
                >
                  {/* Top Bar: Gravidade & Código */}
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className={`px-1.5 py-0.2 rounded text-[7px] font-black uppercase flex items-center gap-1 ${
                        isRepositioned
                          ? 'bg-emerald-700 text-white'
                          : isRuptura 
                          ? 'bg-red-700 text-white animate-pulse' 
                          : 'bg-amber-600 text-slate-950 font-black'
                      }`}>
                        {isRepositioned ? (
                          <>
                            <Check className="w-2.5 h-2.5" />
                            <span>Solicitação Enviada</span>
                          </>
                        ) : isRuptura ? (
                          <>
                            <AlertOctagon className="w-2.5 h-2.5" />
                            <span>Ruptura de Estoque (0 {mat.unidade_medida})</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>Abaixo do Mínimo ({item.percentualEstoqueSeguranca}% do Estoque)</span>
                          </>
                        )}
                      </span>

                      <span className="text-[7px] font-mono font-bold text-slate-500 bg-white px-1 py-0.2 rounded border border-slate-200">
                        {mat.codigo}
                      </span>
                    </div>

                    {/* Material Title & Category */}
                    <div className="mb-2">
                      <h4 className="font-bold text-[10px] text-slate-900 leading-tight truncate" title={mat.nome}>
                        {mat.nome}
                      </h4>
                      <div className="flex items-center gap-1 text-[7.5px] text-slate-500 mt-0.5 flex-wrap">
                        <span className="font-semibold text-slate-700">{mat.categoria_nome || 'Consumo'}</span>
                        <span>·</span>
                        <span className="truncate max-w-[130px]">{item.obraNome}</span>
                      </div>
                    </div>

                    {/* Visual Comparison: Saldo Atual vs Estoque de Segurança */}
                    <div className="bg-white/90 p-2 rounded border border-slate-200/90 space-y-1.5 text-[7.5px] mb-2">
                      
                      {/* Bar comparison */}
                      <div>
                        <div className="flex justify-between items-center text-[7px] mb-0.5">
                          <span className="text-slate-500 font-bold">Nível do Estoque de Segurança:</span>
                          <span className={`font-mono font-extrabold ${isRuptura ? 'text-red-700' : 'text-amber-800'}`}>
                            {mat.quantidade_atual} / {mat.quantidade_minima} {mat.unidade_medida} ({item.percentualEstoqueSeguranca}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex">
                          <div 
                            className={`h-full transition-all ${
                              isRuptura ? 'bg-red-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, item.percentualEstoqueSeguranca)}%` }}
                          />
                        </div>
                      </div>

                      {/* Stock Figures Grid */}
                      <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-100 text-center font-mono">
                        <div className="bg-slate-50 p-1 rounded">
                          <span className="text-[6.5px] text-slate-400 block uppercase">Saldo Atual</span>
                          <span className={`font-bold text-[9px] ${isRuptura ? 'text-red-700' : 'text-slate-900'}`}>
                            {mat.quantidade_atual} {mat.unidade_medida}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-1 rounded">
                          <span className="text-[6.5px] text-slate-400 block uppercase">Estoque Mín.</span>
                          <span className="font-bold text-[9px] text-slate-700">
                            {mat.quantidade_minima} {mat.unidade_medida}
                          </span>
                        </div>

                        <div className="bg-red-50/80 p-1 rounded border border-red-200/60">
                          <span className="text-[6.5px] text-red-700 block uppercase font-bold">Déficit</span>
                          <span className="font-bold text-[9px] text-red-800">
                            -{item.deficitQtd} {mat.unidade_medida}
                          </span>
                        </div>
                      </div>

                      {/* Financial info */}
                      <div className="flex items-center justify-between text-[7px] text-slate-500 pt-0.5">
                        <span>Fornecedor: <strong className="text-slate-700">{mat.fornecedor_padrao || 'Mercado Geral'}</strong></span>
                        <span>Unit: <strong className="font-mono text-slate-800">{formatBRL(mat.valor_unitario)}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* 1-CLICK ACTIONS & CUSTOM REPLENISH */}
                  <div className="space-y-1 pt-1 border-t border-slate-200/80">
                    <div className="flex items-center justify-between text-[7px] text-slate-600 mb-0.5">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Sparkles className="w-2 h-2 text-amber-500" />
                        Lote Recomendado:
                      </span>
                      <strong className="font-mono text-slate-900">
                        {item.sugestaoReposicao} {mat.unidade_medida} ({formatBRL(item.custoEstimadoReposicao)})
                      </strong>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* 1-Click Primary Replenish Button */}
                      <button
                        id={`btn-1clique-repor-${mat.id}`}
                        onClick={() => handleSingle1ClickReplenish(item)}
                        disabled={isProcessing}
                        className={`flex-1 py-1 px-1.5 rounded font-extrabold text-[8px] flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer border ${
                          isRepositioned
                            ? 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-600'
                            : isRuptura
                            ? 'bg-red-600 hover:bg-red-500 text-white border-red-500 animate-pulse'
                            : 'bg-red-800 hover:bg-red-700 text-white border-red-700'
                        }`}
                        title={`Solicitar reposição de ${item.sugestaoReposicao} ${mat.unidade_medida} com 1 clique`}
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                            <span>Processando...</span>
                          </>
                        ) : isRepositioned ? (
                          <>
                            <Check className="w-2.5 h-2.5 text-emerald-200" />
                            <span>Repor Novamente</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-2.5 h-2.5 text-amber-300" />
                            <span>Solicitar Reposição (1-Clique)</span>
                          </>
                        )}
                      </button>

                      {/* Custom quantity button */}
                      <button
                        id={`btn-ajustar-repor-${mat.id}`}
                        onClick={() => handleOpenCustomReplenish(item)}
                        className="py-1 px-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[7.5px] font-bold transition-all cursor-pointer shadow-2xs"
                        title="Ajustar quantidade antes de solicitar"
                      >
                        Ajustar
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL DE AJUSTE MANUAL DE QUANTIDADE DE REPOSIÇÃO                      */}
      {/* ========================================================================= */}
      {customModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-sm overflow-hidden animate-scaleUp">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-900 to-slate-900 text-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-red-600 text-white flex items-center justify-center font-bold">
                  <ShoppingCart className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-[11px] text-white">Solicitação de Reposição</h4>
                  <span className="text-[7.5px] text-red-200">Recomposição de Estoque de Segurança</span>
                </div>
              </div>
              <button
                onClick={() => setCustomModalItem(null)}
                className="text-red-200 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmCustomReplenish} className="p-3.5 space-y-2.5 text-[8.5px]">
              
              <div className="bg-red-50 p-2 rounded border border-red-200">
                <span className="text-[7px] text-red-800 font-bold uppercase block">Material:</span>
                <strong className="text-[9.5px] text-slate-900 block truncate">{customModalItem.material.nome}</strong>
                <div className="flex justify-between text-[7.5px] text-slate-600 mt-1">
                  <span>Saldo Atual: <strong>{customModalItem.material.quantidade_atual} {customModalItem.material.unidade_medida}</strong></span>
                  <span>Estoque Mínimo: <strong>{customModalItem.material.quantidade_minima} {customModalItem.material.unidade_medida}</strong></span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-0.5">
                  Quantidade a Solicitar ({customModalItem.material.unidade_medida}):
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={customQty}
                  onChange={(e) => setCustomQty(Number(e.target.value))}
                  required
                  className="w-full p-1.5 border border-slate-300 rounded text-[9px] font-bold text-slate-900 focus:outline-hidden focus:border-red-600"
                />
              </div>

              <div className="bg-slate-50 p-2 rounded border border-slate-200 flex justify-between items-center text-[7.5px]">
                <span className="text-slate-600">Valor Estimado Total:</span>
                <strong className="font-mono text-slate-900 text-[9.5px]">
                  {formatBRL(customQty * customModalItem.material.valor_unitario)}
                </strong>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCustomModalItem(null)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[8px] font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[8px] font-extrabold flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Zap className="w-2.5 h-2.5 text-amber-300" />
                  <span>Enviar Solicitação</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
