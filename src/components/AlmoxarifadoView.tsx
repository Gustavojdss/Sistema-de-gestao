import React, { useState } from 'react';
import { 
  Boxes, 
  Plus, 
  ArrowUpRight, 
  Undo2, 
  Wrench, 
  FileText, 
  QrCode, 
  Search, 
  SlidersHorizontal, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Package,
  Layers,
  Sparkles,
  Printer,
  Calendar,
  MapPin,
  ShieldCheck,
  User,
  History,
  Tag,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { ItemAlmoxarifado, MovimentacaoAlmoxarifado, Obra, Usuario } from '../types/erp';
import { EquipmentQrCode } from './EquipmentQrCode';

interface AlmoxarifadoViewProps {
  itens: ItemAlmoxarifado[];
  movimentacoes: MovimentacaoAlmoxarifado[];
  obras: Obra[];
  selectedObraId: number | 'all';
  currentUser: Usuario;
  onOpenNovoItem: () => void;
  onOpenSaida: (itemId?: number) => void;
  onOpenDevolucao: (itemId?: number) => void;
  onOpenManutencao: (itemId: number) => void;
  onExportPDF: () => void;
}

export const AlmoxarifadoView: React.FC<AlmoxarifadoViewProps> = ({
  itens,
  movimentacoes,
  obras,
  selectedObraId,
  currentUser,
  onOpenNovoItem,
  onOpenSaida,
  onOpenDevolucao,
  onOpenManutencao,
  onExportPDF
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'estoque' | 'emprestimos' | 'historico'>('estoque');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all');
  const [selectedQrItem, setSelectedQrItem] = useState<ItemAlmoxarifado | null>(null);
  const [copiedSerial, setCopiedSerial] = useState(false);

  const filteredByObra = selectedObraId === 'all' 
    ? itens 
    : itens.filter(i => i.obra_id === selectedObraId);

  const filteredItens = filteredByObra.filter(i => {
    const matchSearch = i.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        i.numero_serie.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (i.localizacao && i.localizacao.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCat = categoriaFilter === 'all' || i.categoria === categoriaFilter;
    return matchSearch && matchCat;
  });

  const emprestimosAtivos = filteredByObra.filter(i => i.status === 'uso');
  
  // KPIs
  const totalItens = filteredByObra.length;
  const itensCriticos = filteredByObra.filter(i => i.quantidade_atual <= i.quantidade_minima).length;
  
  const hoje = new Date();
  const itensAtrasados = emprestimosAtivos.filter(item => {
    if (!item.data_previsao_devolucao) return false;
    const prev = new Date(item.data_previsao_devolucao);
    return prev < hoje;
  }).length;

  const itensManutencao = filteredByObra.filter(i => i.status === 'manutencao').length;

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Get item-specific history log
  const getItemHistory = (item: ItemAlmoxarifado) => {
    return movimentacoes.filter(m => m.item_id === item.id || m.item_nome === item.nome);
  };

  const handleCopySerial = (serial: string) => {
    navigator.clipboard.writeText(serial);
    setCopiedSerial(true);
    setTimeout(() => setCopiedSerial(false), 2000);
  };

  return (
    <div className="space-y-3.5">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 sm:w-5 sm:h-5 text-red-700" />
            <h1 className="text-base sm:text-lg font-black text-slate-900">Almoxarifado de Equipamentos & Ferramentas</h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Controle de maquinário com QR Code individual, rastreabilidade de manutenções e histórico de empréstimos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={onExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Exportar PDF</span>
          </button>
          <button
            onClick={() => onOpenSaida()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
            <span>Registrar Saída</span>
          </button>
          <button
            onClick={() => onOpenDevolucao()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            <Undo2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Registrar Devolução</span>
          </button>
          <button
            onClick={onOpenNovoItem}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Item</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200 border-l-4 border-l-red-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Cadastrado</span>
            <Boxes className="w-4 h-4 text-red-800/60" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">{totalItens}</p>
          <span className="text-[10px] text-slate-400">equipamentos com QR Code</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 border-l-4 border-l-amber-500 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Estoque Crítico</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-amber-900 mt-1">{itensCriticos}</p>
          <span className="text-[10px] text-slate-400">itens abaixo do limite</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 border-l-4 border-l-red-600 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Atrasos na Devolução</span>
            <Clock className="w-4 h-4 text-red-600" />
          </div>
          <p className={`text-xl font-black mt-1 ${itensAtrasados > 0 ? 'text-red-700 animate-pulse' : 'text-slate-900'}`}>
            {itensAtrasados}
          </p>
          <span className="text-[10px] text-slate-400">devoluções vencidas</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 border-l-4 border-l-blue-600 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Em Manutenção</span>
            <Wrench className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-black text-blue-900 mt-1">{itensManutencao}</p>
          <span className="text-[10px] text-slate-400">oficina ou revisão técnica</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex items-center gap-1.5 border-b border-slate-200 p-1.5 bg-slate-50/50">
          <button
            onClick={() => setActiveSubTab('estoque')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'estoque'
                ? 'bg-red-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Itens em Estoque ({filteredItens.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('emprestimos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'emprestimos'
                ? 'bg-red-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Empréstimos Ativos ({emprestimosAtivos.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('historico')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'historico'
                ? 'bg-red-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Histórico Geral</span>
          </button>
        </div>

        {/* Tab 1: Itens em Estoque */}
        {activeSubTab === 'estoque' && (
          <div className="p-3 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filtrar por nome, patrimônio/série ou prateleira..."
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
                  <option value="Equipamentos">Equipamentos</option>
                  <option value="Ferramentas">Ferramentas</option>
                  <option value="Medição">Medição</option>
                  <option value="EPI">EPI</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs border-collapse min-w-[760px] lg:min-w-full">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-44">QR Code & Patrimônio</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2">Equipamento</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-28">Categoria</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-36">Localização</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-20 text-center">Qtd</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-24">Condição</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-28">Status</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-36 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItens.map((item) => {
                    const isCritico = item.quantidade_atual <= item.quantidade_minima;
                    return (
                      <tr key={item.id} className={`odd:bg-white even:bg-slate-50/70 hover:bg-red-50/40 transition-colors ${isCritico ? 'bg-amber-50/60' : ''}`}>
                        <td className="px-2.5 py-1.5 sm:px-3 sm:py-2">
                          <button
                            onClick={() => setSelectedQrItem(item)}
                            className="flex items-center gap-2 group text-left cursor-pointer p-1 -m-1 rounded-lg hover:bg-red-50 transition-all"
                            title="Clique para abrir detalhes, histórico e status de manutenção deste item"
                          >
                            <div className="shrink-0 group-hover:scale-105 transition-transform">
                              <EquipmentQrCode item={item} size={30} />
                            </div>
                            <div>
                              <span className="font-mono font-bold text-slate-900 block group-hover:text-red-700 transition-colors text-[11px]">
                                {item.numero_serie}
                              </span>
                              <span className="text-[9px] text-red-700 font-semibold flex items-center gap-0.5">
                                <QrCode className="w-2.5 h-2.5" />
                                <span>Ver Detalhes</span>
                              </span>
                            </div>
                          </button>
                        </td>
                        <td className="px-2.5 py-1.5 sm:px-3 sm:py-2">
                          <span className="font-semibold text-slate-900 block truncate">{item.nome}</span>
                          <span className="text-[10px] text-slate-400 truncate max-w-xs block">{item.descricao}</span>
                        </td>
                        <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-slate-600 font-medium truncate">{item.categoria}</td>
                        <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-slate-500 truncate">{item.localizacao || 'Almoxarifado Central'}</td>
                        <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-center font-bold text-slate-800">
                          {item.quantidade_atual} {item.unidade_medida}
                          {isCritico && (
                            <span className="block text-[8px] text-amber-700 font-bold">(Mín: {item.quantidade_minima})</span>
                          )}
                        </td>
                        <td className="px-2.5 py-1.5 sm:px-3 sm:py-2">
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            item.condicao === 'nova' ? 'bg-emerald-100 text-emerald-800' :
                            item.condicao === 'usada' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.condicao}
                          </span>
                        </td>
                        <td className="px-2.5 py-1.5 sm:px-3 sm:py-2">
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            item.status === 'estoque' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            item.status === 'uso' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            'bg-red-100 text-red-800 border border-red-300'
                          }`}>
                            {item.status === 'estoque' ? 'Em Estoque' : item.status === 'uso' ? 'Em Campo' : 'Manutenção'}
                          </span>
                        </td>
                        <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedQrItem(item)}
                              className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                              title="Visualizar QR Code, Manutenção e Histórico"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                            {item.status === 'estoque' && (
                              <button
                                onClick={() => onOpenSaida(item.id)}
                                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-[10px]"
                              >
                                Emprestar
                              </button>
                            )}
                            {item.status === 'uso' && (
                              <button
                                onClick={() => onOpenDevolucao(item.id)}
                                className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold text-[10px]"
                              >
                                Devolver
                              </button>
                            )}
                            <button
                              onClick={() => onOpenManutencao(item.id)}
                              className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded"
                              title="Alternar Status de Manutenção"
                            >
                              <Wrench className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Empréstimos Ativos */}
        {activeSubTab === 'emprestimos' && (
          <div className="p-3 space-y-3">
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs border-collapse min-w-[720px] lg:min-w-full">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-44">QR Code & Patrimônio</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2">Equipamento</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-48">Responsável</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-28">Saída</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-32">Prev. Retorno</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-28">Situação</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-24 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {emprestimosAtivos.map((item) => {
                    const prev = item.data_previsao_devolucao ? new Date(item.data_previsao_devolucao) : null;
                    let isAtrasado = false;
                    let diasRestantes: number | null = null;
                    if (prev) {
                       const diffTime = prev.getTime() - hoje.getTime();
                      diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      isAtrasado = diasRestantes < 0;
                    }

                    return (
                      <tr key={item.id} className={`odd:bg-white even:bg-slate-50/70 hover:bg-red-50/40 transition-colors ${isAtrasado ? 'bg-red-50/60' : ''}`}>
                        <td className="px-2.5 py-1.5 sm:px-3 sm:py-2">
                          <button
                            onClick={() => setSelectedQrItem(item)}
                            className="flex items-center gap-2 group text-left cursor-pointer p-1 -m-1 rounded-lg hover:bg-red-50 transition-all"
                            title="Ver detalhes do item"
                          >
                            <EquipmentQrCode item={item} size={26} />
                            <span className="font-mono font-bold text-slate-900 group-hover:text-red-700 text-[11px]">
                              {item.numero_serie}
                            </span>
                          </button>
                        </td>
                        <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 font-semibold text-slate-800 truncate">{item.nome}</td>
                        <td className="px-2.5 py-1.5 sm:px-3 sm:py-2">
                          <strong className="text-slate-900 block truncate">{item.colaborador_nome || 'N/A'}</strong>
                        </td>
                        <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-slate-600">{item.data_retirada ? item.data_retirada.split(' ')[0] : '-'}</td>
                        <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 font-mono font-semibold text-slate-800">{item.data_previsao_devolucao || 'Indeterminado'}</td>
                        <td className="px-2.5 py-1.5 sm:px-3 sm:py-2">
                          {isAtrasado ? (
                            <span className="bg-red-100 text-red-800 font-black px-1.5 py-0.5 rounded-full text-[9px] uppercase border border-red-300">
                              Atrasado {Math.abs(diasRestantes || 0)}d
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full text-[9px]">
                              {diasRestantes}d restantes
                            </span>
                          )}
                        </td>
                        <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-right">
                          <button
                            onClick={() => onOpenDevolucao(item.id)}
                            className="px-2.5 py-1 bg-red-800 hover:bg-red-700 text-white rounded font-bold text-[11px] shadow-xs"
                          >
                            Retorno
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {emprestimosAtivos.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-500">
                        Nenhum equipamento emprestado no momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Histórico */}
        {activeSubTab === 'historico' && (
          <div className="p-3">
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs border-collapse min-w-[760px] lg:min-w-full">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-36">Data e Hora</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2">Equipamento</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-28">Tipo</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-44">Colaborador / Destino</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-36">Autorizado Por</th>
                    <th className="px-2.5 py-1.5 sm:px-3 sm:py-2">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movimentacoes.map((m) => (
                    <tr key={m.id} className="odd:bg-white even:bg-slate-50/70 hover:bg-red-50/40 transition-colors">
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 font-mono text-slate-600">{m.data_movimentacao}</td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 font-semibold text-slate-900 truncate">{m.item_nome}</td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2">
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          m.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-800' :
                          m.tipo === 'saida' ? 'bg-amber-100 text-amber-800' :
                          m.tipo === 'devolucao' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {m.tipo}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-slate-800 font-medium truncate">{m.colaborador_nome || '-'}</td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-slate-600 truncate">{m.responsavel_nome || '-'}</td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-slate-500 truncate">{m.observacao || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Comprehensive QR Code & Maintenance Detail Modal */}
      {selectedQrItem && (() => {
        const itemHistory = getItemHistory(selectedQrItem);
        const isEmManutencao = selectedQrItem.status === 'manutencao';
        const isEmUso = selectedQrItem.status === 'uso';
        const obraItem = obras.find(o => o.id === selectedQrItem.obra_id);

        return (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200 my-auto">
              
              {/* Header Bar */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-red-800 text-white shadow-xs">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-white">{selectedQrItem.nome}</h3>
                    <p className="text-[11px] text-slate-300 flex items-center gap-2">
                      <span className="font-mono text-red-400 font-bold">{selectedQrItem.numero_serie}</span>
                      <span>·</span>
                      <span>{selectedQrItem.categoria}</span>
                      <span>·</span>
                      <span>{obraItem?.nome || 'Almoxarifado Central'}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedQrItem(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                
                {/* Top Section: Dynamic QR Code Tag & Equipment Specs */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                  {/* High-res QR Display */}
                  <div className="sm:col-span-5 flex flex-col items-center justify-center bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs text-center">
                    <EquipmentQrCode item={selectedQrItem} size={140} />
                    <div className="mt-2 text-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Etiqueta Patrimonial</span>
                      <span className="font-mono text-xs font-black text-slate-800">{selectedQrItem.numero_serie}</span>
                    </div>
                    <button
                      onClick={() => handleCopySerial(selectedQrItem.numero_serie)}
                      className="mt-2 text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                    >
                      {copiedSerial ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSerial ? 'Copiado!' : 'Copiar Série'}</span>
                    </button>
                  </div>

                  {/* Identification Specs */}
                  <div className="sm:col-span-7 space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status Operacional</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          selectedQrItem.status === 'estoque' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          selectedQrItem.status === 'uso' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                          'bg-red-100 text-red-800 border-red-300'
                        }`}>
                          {selectedQrItem.status === 'estoque' ? 'Disponível no Estoque' : selectedQrItem.status === 'uso' ? 'Em Campo / Empréstimo' : 'Em Manutenção / Oficina'}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1.5 text-xs">
                        <div className="flex justify-between border-b border-slate-200/60 pb-1">
                          <span className="text-slate-500">Localização Física:</span>
                          <strong className="text-slate-800">{selectedQrItem.localizacao || 'Prateleira Central'}</strong>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/60 pb-1">
                          <span className="text-slate-500">Condição do Item:</span>
                          <span className="capitalize font-bold text-slate-800">{selectedQrItem.condicao}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/60 pb-1">
                          <span className="text-slate-500">Valor Contábil / Aquisição:</span>
                          <span className="font-bold text-slate-900">{formatCurrency(selectedQrItem.valor_aquisicao)}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/60 pb-1">
                          <span className="text-slate-500">Data de Entrada:</span>
                          <span className="font-mono text-slate-700">{selectedQrItem.data_aquisicao}</span>
                        </div>
                        {selectedQrItem.colaborador_nome && (
                          <div className="flex justify-between pt-1">
                            <span className="text-slate-500">Operador Atual:</span>
                            <strong className="text-amber-800">{selectedQrItem.colaborador_nome}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => {
                          onOpenManutencao(selectedQrItem.id);
                          setSelectedQrItem(prev => prev ? {
                            ...prev,
                            status: prev.status === 'manutencao' ? 'estoque' : 'manutencao'
                          } : null);
                        }}
                        className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs ${
                          isEmManutencao 
                            ? 'bg-emerald-700 hover:bg-emerald-600 text-white' 
                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                        }`}
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>{isEmManutencao ? 'Liberar da Manutenção' : 'Enviar para Manutenção'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section 2: Maintenance Status & Health Diagnostics */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-red-700" />
                      <span>Diagnóstico de Manutenção & Integridade Técnica</span>
                    </h4>
                    <span className="text-[10px] text-slate-400">Revisão Preventiva Brasal</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Índice de Saúde</span>
                      <span className={`text-sm font-black mt-0.5 block ${
                        selectedQrItem.condicao === 'nova' ? 'text-emerald-700' :
                        selectedQrItem.condicao === 'usada' ? 'text-blue-700' : 'text-red-700'
                      }`}>
                        {selectedQrItem.condicao === 'nova' ? '100% (Excelente)' : selectedQrItem.condicao === 'usada' ? '85% (Operacional)' : '40% (Requer Revisão)'}
                      </span>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Última Revisão</span>
                      <span className="text-xs font-mono font-bold text-slate-800 mt-0.5 block">
                        {itemHistory.find(h => h.tipo === 'entrada')?.data_movimentacao.split(' ')[0] || selectedQrItem.data_aquisicao}
                      </span>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Próxima Preventiva</span>
                      <span className="text-xs font-mono font-bold text-slate-800 mt-0.5 block">
                        {new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Historical Log for this Item */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <History className="w-4 h-4 text-red-700" />
                      <span>Histórico & Log de Movimentações ({itemHistory.length})</span>
                    </h4>
                    <span className="text-[10px] text-slate-500">Rastreabilidade completa do item</span>
                  </div>

                  {itemHistory.length > 0 ? (
                    <div className="overflow-x-auto max-h-44 rounded-lg border border-slate-200">
                      <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                            <th className="px-2.5 py-1.5">Data / Hora</th>
                            <th className="px-2.5 py-1.5">Tipo</th>
                            <th className="px-2.5 py-1.5">Colaborador / Destino</th>
                            <th className="px-2.5 py-1.5">Supervisor</th>
                            <th className="px-2.5 py-1.5">Observação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {itemHistory.map(h => (
                            <tr key={h.id} className="odd:bg-white even:bg-slate-50/60">
                              <td className="px-2.5 py-1.5 font-mono text-[10px] text-slate-600">{h.data_movimentacao}</td>
                              <td className="px-2.5 py-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  h.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-800' :
                                  h.tipo === 'saida' ? 'bg-amber-100 text-amber-800' :
                                  h.tipo === 'devolucao' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {h.tipo}
                                </span>
                              </td>
                              <td className="px-2.5 py-1.5 font-medium text-slate-800">{h.colaborador_nome || 'Almoxarifado'}</td>
                              <td className="px-2.5 py-1.5 text-slate-600">{h.responsavel_nome || '-'}</td>
                              <td className="px-2.5 py-1.5 text-slate-500 text-[11px] truncate max-w-[150px]">{h.observacao || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-500 text-xs border border-dashed border-slate-200">
                      Nenhuma movimentação anterior registrada especificamente para este patrimônio além do cadastro inicial.
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer Actions */}
              <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Compatível com leitor de código de barras & câmera 2D</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="flex-1 sm:flex-none px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir Etiqueta</span>
                  </button>
                  <button
                    onClick={() => setSelectedQrItem(null)}
                    className="flex-1 sm:flex-none px-4 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs"
                  >
                    Fechar
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};

