import React, { useState } from 'react';
import { 
  ClipboardList, 
  Plus, 
  ArrowDownRight, 
  ArrowUpRight, 
  ShoppingCart, 
  Search, 
  SlidersHorizontal, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Truck, 
  DollarSign,
  TrendingDown,
  Layers,
  FileSpreadsheet,
  Package
} from 'lucide-react';
import { MaterialConsumo, SolicitacaoMaterial, MovimentacaoMaterial, CategoriaMaterial, Obra, Usuario } from '../types/erp';
import { calcularCurvaABC, verificarEstoqueCritico, calcularValorTotalEstoque } from '../services/estoqueService';

interface MateriaisViewProps {
  materiais: MaterialConsumo[];
  solicitacoes: SolicitacaoMaterial[];
  movimentacoes: MovimentacaoMaterial[];
  categorias: CategoriaMaterial[];
  obras: Obra[];
  selectedObraId: number | 'all';
  currentUser: Usuario;
  onOpenNovoMaterial: () => void;
  onOpenMovimentacao: (materialId?: number) => void;
  onOpenSolicitar: () => void;
  onAprovarSolicitacao: (solicitacao: SolicitacaoMaterial) => void;
  onRejeitarSolicitacao: (solicitacao: SolicitacaoMaterial) => void;
  onEntregarSolicitacao: (solicitacao: SolicitacaoMaterial) => void;
}

export const MateriaisView: React.FC<MateriaisViewProps> = ({
  materiais,
  solicitacoes,
  movimentacoes,
  categorias,
  obras,
  selectedObraId,
  currentUser,
  onOpenNovoMaterial,
  onOpenMovimentacao,
  onOpenSolicitar,
  onAprovarSolicitacao,
  onRejeitarSolicitacao,
  onEntregarSolicitacao
}) => {
  const [activeTab, setActiveTab] = useState<'estoque' | 'solicitacoes' | 'historico' | 'curvaABC'>('estoque');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all');
  const [statusSolicitacaoFilter, setStatusSolicitacaoFilter] = useState<string>('all');

  const filteredByObra = selectedObraId === 'all' 
    ? materiais 
    : materiais.filter(m => m.obra_id === selectedObraId);

  const filteredMateriais = filteredByObra.filter(m => {
    const matchSearch = m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        m.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (m.localizacao && m.localizacao.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCat = categoriaFilter === 'all' || m.categoria_id?.toString() === categoriaFilter;
    return matchSearch && matchCat;
  });

  const filteredSolicitacoes = (selectedObraId === 'all' ? solicitacoes : solicitacoes.filter(s => s.obra_id === selectedObraId))
    .filter(s => statusSolicitacaoFilter === 'all' || s.status === statusSolicitacaoFilter);

  // Estatísticas via estoqueService
  const totalItens = filteredByObra.length;
  const criticos = filteredByObra.filter(verificarEstoqueCritico).length;
  const pendentes = solicitacoes.filter(s => s.status === 'pendente').length;
  const valorTotalEstoque = calcularValorTotalEstoque(filteredByObra);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Curva ABC calculation via estoqueService (RN-MAT-006)
  const abcItems = calcularCurvaABC(filteredByObra).map(item => ({
    ...item,
    accumulatedPercent: item.pctAcumulado
  }));

  return (
    <div className="space-y-3.5">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-red-700" />
            <h1 className="text-base sm:text-lg font-black text-slate-900">Gestão de Materiais de Consumo & Suprimentos</h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Controle de saldo em almoxarifado, alerta de reposição, requisições de compra e curva ABC de insumos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => onOpenMovimentacao()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>Movimentar Estoque</span>
          </button>
          <button
            onClick={onOpenSolicitar}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
            <span>Solicitar Material</span>
          </button>
          <button
            onClick={onOpenNovoMaterial}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Insumo</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200 border-l-4 border-l-red-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Itens Cadastrados</span>
            <Package className="w-4 h-4 text-red-800/60" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">{totalItens}</p>
          <span className="text-[10px] text-slate-400">materiais de construção civil</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 border-l-4 border-l-amber-500 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Estoque Mínimo Crítico</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-amber-900 mt-1">{criticos}</p>
          <span className="text-[10px] text-slate-400">necessitam reposição urgente</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 border-l-4 border-l-purple-600 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Solicitações Pendentes</span>
            <ShoppingCart className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl font-black text-purple-900 mt-1">{pendentes}</p>
          <span className="text-[10px] text-slate-400">aguardando aprovação</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 border-l-4 border-l-emerald-600 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Valor Total em Estoque</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg font-black text-slate-900 mt-1 truncate">{formatCurrency(valorTotalEstoque)}</p>
          <span className="text-[10px] text-slate-400">custo total valorizado</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex items-center gap-1.5 border-b border-slate-200 p-1.5 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('estoque')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'estoque'
                ? 'bg-red-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Estoque Físico ({filteredMateriais.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('solicitacoes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'solicitacoes'
                ? 'bg-red-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Solicitações ({solicitacoes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'historico'
                ? 'bg-red-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Movimentações & NF-e</span>
          </button>
          <button
            onClick={() => setActiveTab('curvaABC')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'curvaABC'
                ? 'bg-red-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Curva ABC</span>
          </button>
        </div>

        {/* Tab 1: Estoque */}
        {activeTab === 'estoque' && (
          <div className="p-3 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar material por código, nome ou localização..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-red-700"
                />
              </div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <select
                  aria-label="Filtrar por Categoria"
                  value={categoriaFilter}
                  onChange={(e) => setCategoriaFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="all">Todas as Categorias</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id.toString()}>{c.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs border-collapse min-w-[840px] lg:min-w-full">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-28">Código</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2">Material de Consumo</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-32">Categoria</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-36">Localização</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-24 text-right">Saldo Atual</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-24 text-right">Estoque Mín.</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-24 text-right">Unitário</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-28 text-right">Total</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-20 text-center">Status</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-28 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMateriais.map((mat) => {
                    const isCritico = mat.quantidade_atual <= mat.quantidade_minima;
                    return (
                      <tr key={mat.id} className={`odd:bg-white even:bg-slate-50/70 hover:bg-red-50/40 transition-colors ${isCritico ? 'bg-amber-50/60' : ''}`}>
                        <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 font-mono font-bold text-slate-900">{mat.codigo}</td>
                        <td className="px-2.5 py-1.5 sm:px-3 sm:py-2">
                          <span className="font-bold text-slate-900 block truncate">{mat.nome}</span>
                          <span className="text-[10px] text-slate-400 truncate max-w-xs block">{mat.descricao}</span>
                        </td>
                        <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-slate-600 font-medium truncate">{mat.categoria_nome || 'Geral'}</td>
                        <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-slate-500 truncate">{mat.localizacao || 'Canteiro Principal'}</td>
                        <td className={`px-2.5 py-1.5 sm:px-3 sm:py-2 text-right font-bold ${isCritico ? 'text-red-700 font-black' : 'text-slate-800'}`}>
                          {mat.quantidade_atual} {mat.unidade_medida}
                        </td>
                        <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-right text-slate-500 font-medium">
                          {mat.quantidade_minima} {mat.unidade_medida}
                        </td>
                        <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-right font-mono text-slate-700">
                          {formatCurrency(mat.valor_unitario)}
                        </td>
                        <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(mat.valor_total)}
                        </td>
                        <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-center">
                          {isCritico ? (
                            <span className="bg-red-100 text-red-800 font-black px-1.5 py-0.5 rounded-full text-[9px] uppercase border border-red-300">
                              Crítico
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full text-[9px]">
                              Regular
                            </span>
                          )}
                        </td>
                        <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-right">
                          <button
                            onClick={() => onOpenMovimentacao(mat.id)}
                            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-[10px]"
                          >
                            Movimentar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Solicitações de Compra */}
        {activeTab === 'solicitacoes' && (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Filtrar status:</span>
                <select
                  aria-label="Filtrar por Status da Solicitação"
                  value={statusSolicitacaoFilter}
                  onChange={(e) => setStatusSolicitacaoFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="all">Todas as Solicitações</option>
                  <option value="pendente">Pendentes</option>
                  <option value="aprovado">Aprovadas</option>
                  <option value="entregue">Entregues</option>
                  <option value="rejeitado">Rejeitadas</option>
                </select>
              </div>

              <button
                onClick={onOpenSolicitar}
                className="px-2.5 py-1 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Nova Solicitação</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs border-collapse min-w-[780px] lg:min-w-full">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-24">Data</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2">Material Solicitado</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-36">Obra</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-28">Quantidade</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-28">Valor Estimado</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-32">Solicitante</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-24">Status</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-28 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSolicitacoes.map((sol) => (
                    <tr key={sol.id} className="odd:bg-white even:bg-slate-50/70 hover:bg-red-50/40 transition-colors">
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 font-mono text-slate-600">{sol.data_solicitacao.split(' ')[0]}</td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2">
                        <strong className="text-slate-900 block truncate">{sol.nome_material}</strong>
                        <span className="text-[10px] text-slate-500 truncate max-w-xs block">{sol.especificacoes || 'Sem especificações'}</span>
                      </td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-slate-700 font-medium truncate">{sol.obra_nome}</td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 font-bold text-slate-900">{sol.quantidade_solicitada} {sol.unidade_medida}</td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 font-mono text-slate-700">{formatCurrency(sol.valor_total_estimado || 0)}</td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-slate-600 truncate">{sol.solicitante_nome}</td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2">
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          sol.status === 'pendente' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          sol.status === 'aprovado' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                          sol.status === 'entregue' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          'bg-red-100 text-red-800 border border-red-300'
                        }`}>
                          {sol.status}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {sol.status === 'pendente' && currentUser.tipo === 'admin' && (
                            <>
                              <button
                                onClick={() => onAprovarSolicitacao(sol)}
                                className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold text-[10px]"
                              >
                                Aprovar
                              </button>
                              <button
                                onClick={() => onRejeitarSolicitacao(sol)}
                                className="px-2 py-0.5 bg-red-700 hover:bg-red-600 text-white rounded font-bold text-[10px]"
                              >
                                Rejeitar
                              </button>
                            </>
                          )}
                          {sol.status === 'aprovado' && (
                            <button
                              onClick={() => onEntregarSolicitacao(sol)}
                              className="px-2 py-0.5 bg-blue-700 hover:bg-blue-600 text-white rounded font-bold text-[10px] flex items-center gap-1"
                            >
                              <Truck className="w-3 h-3" />
                              <span>Entrega</span>
                            </button>
                          )}
                          {sol.status === 'entregue' && (
                            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Concluído</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Histórico de Movimentações */}
        {activeTab === 'historico' && (
          <div className="p-3">
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs border-collapse min-w-[760px] lg:min-w-full">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-36">Data e Hora</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2">Material</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-24">Tipo</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-24 text-right">Qtd</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-28 text-right">Valor Total</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-36">Responsável</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2">Observação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movimentacoes.map((mov) => (
                    <tr key={mov.id} className="odd:bg-white even:bg-slate-50/70 hover:bg-red-50/40 transition-colors">
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 font-mono text-slate-600">{mov.data_movimentacao}</td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 font-bold text-slate-900 truncate">{mov.material_nome}</td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2">
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          mov.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-800' :
                          mov.tipo === 'saida' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {mov.tipo}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-right font-bold text-slate-800">{mov.quantidade}</td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-right font-mono text-slate-800">{formatCurrency(mov.valor_total || 0)}</td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-slate-700 truncate">{mov.colaborador_nome || mov.responsavel_nome || 'Almoxarife'}</td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-slate-500 truncate">{mov.observacao || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Curva ABC */}
        {activeTab === 'curvaABC' && (
          <div className="p-3 space-y-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-xs uppercase">Curva ABC de Valorização do Estoque</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  <strong>Classe A (80% do valor):</strong> Alto impacto financeiro. 
                  <strong> Classe B (15%):</strong> Intermediários. 
                  <strong> Classe C (5%):</strong> Baixo custo unitário.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2 py-0.5 bg-red-100 text-red-900 rounded-md text-[11px] font-bold">Classe A: {abcItems.filter(i => i.classe === 'A').length}</span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md text-[11px] font-bold">Classe B: {abcItems.filter(i => i.classe === 'B').length}</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded-md text-[11px] font-bold">Classe C: {abcItems.filter(i => i.classe === 'C').length}</span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs border-collapse min-w-[760px] lg:min-w-full">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-20">Classe</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-28">Código</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2">Material</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-28 text-right">Saldo</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-28 text-right">Valor Unitário</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-36 text-right">Valor Total em Estoque</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-28 text-right">% Acumulada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {abcItems.map((item) => (
                    <tr key={item.id} className="odd:bg-white even:bg-slate-50/70 hover:bg-red-50/40 transition-colors">
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${
                          item.classe === 'A' ? 'bg-red-800 text-white shadow-xs' :
                          item.classe === 'B' ? 'bg-amber-500 text-white shadow-xs' : 'bg-blue-600 text-white'
                        }`}>
                          {item.classe}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 font-mono font-bold text-slate-900">{item.codigo}</td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 font-bold text-slate-900 truncate">{item.nome}</td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-right text-slate-700">{item.quantidade_atual} {item.unidade_medida}</td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-right font-mono text-slate-600">{formatCurrency(item.valor_unitario)}</td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-right font-mono font-bold text-slate-900">{formatCurrency(item.valor_total)}</td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-right font-mono font-bold text-slate-700">{item.accumulatedPercent.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
