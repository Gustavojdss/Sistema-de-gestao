import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  FileSpreadsheet, 
  Search, 
  SlidersHorizontal, 
  Users, 
  Boxes, 
  ClipboardCheck, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Edit3, 
  Trash2, 
  ArrowRight,
  Hammer,
  PackageCheck,
  BarChart3,
  LayoutGrid,
  Layers
} from 'lucide-react';
import { Obra, Usuario } from '../types/erp';
import { GanttCronogramaView } from './GanttCronogramaView';

interface ObrasViewProps {
  obras: Obra[];
  currentUser: Usuario;
  onOpenNovaObra: () => void;
  onOpenEditarObra: (obra: Obra) => void;
  onDeleteObra: (id: number) => void;
  onNavigateToAlmoxarifado: (obraId: number) => void;
  onNavigateToMateriais: (obraId: number) => void;
  onExportExcel: () => void;
}

export const ObrasView: React.FC<ObrasViewProps> = ({
  obras,
  currentUser,
  onOpenNovaObra,
  onOpenEditarObra,
  onDeleteObra,
  onNavigateToAlmoxarifado,
  onNavigateToMateriais,
  onExportExcel
}) => {
  const [activeTabMode, setActiveTabMode] = useState<'both' | 'gantt' | 'cards'>('both');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredObras = obras.filter(o => {
    const matchSearch = o.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        o.endereco.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getStatusBadge = (status: Obra['status']) => {
    switch (status) {
      case 'em_andamento':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border border-emerald-300">Em Andamento</span>;
      case 'planejamento':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border border-amber-300">Planejamento</span>;
      case 'pausada':
        return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border border-red-300">Pausada</span>;
      case 'concluida':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border border-blue-300">Concluída</span>;
    }
  };

  return (
    <div className="space-y-3.5">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-700" />
            <span>Gestão de Obras & Empreendimentos</span>
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Cadastre, monitore cronogramas, fases de engenharia (Fundação, Estrutura, Acabamento) e custos por canteiro.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTabMode('both')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                activeTabMode === 'both' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Exibir Gantt e Cards"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Visão Completa</span>
            </button>
            <button
              onClick={() => setActiveTabMode('gantt')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                activeTabMode === 'gantt' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Apenas Cronograma Gantt"
            >
              <BarChart3 className="w-3.5 h-3.5 text-red-700" />
              <span className="text-[11px]">Gantt</span>
            </button>
            <button
              onClick={() => setActiveTabMode('cards')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                activeTabMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Apenas Cards de Obras"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="text-[11px]">Cards</span>
            </button>
          </div>

          <button
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          {currentUser.tipo === 'admin' && (
            <button
              onClick={onOpenNovaObra}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Obra</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Gantt Chart Section */}
      {(activeTabMode === 'both' || activeTabMode === 'gantt') && (
        <GanttCronogramaView obras={filteredObras} />
      )}

      {/* Filter & Search Bar for Cards */}
      {(activeTabMode === 'both' || activeTabMode === 'cards') && (
        <>
          <div className="flex flex-col sm:flex-row gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar obra por nome, endereço ou bairro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-red-700 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 ml-1" />
              <select
                aria-label="Filtrar por Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-red-700 cursor-pointer"
              >
                <option value="all">Todos os Status ({obras.length})</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="planejamento">Planejamento</option>
                <option value="pausada">Pausada</option>
                <option value="concluida">Concluída</option>
              </select>
            </div>
          </div>

          {/* Obras Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredObras.map((obra) => (
              <div 
                key={obra.id} 
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Photo & Status Banner */}
                  <div className="relative h-36 bg-slate-800 overflow-hidden group">
                    <img 
                      src={obra.foto_obra || 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80'} 
                      alt={obra.nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent"></div>
                    <div className="absolute top-2.5 right-2.5">
                      {getStatusBadge(obra.status)}
                    </div>
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                      <h2 className="font-bold text-xs sm:text-sm leading-snug drop-shadow-md">{obra.nome}</h2>
                      <div className="flex items-center gap-1 text-[10px] text-slate-200 mt-0.5 drop-shadow-xs">
                        <MapPin className="w-3 h-3 shrink-0 text-red-400" />
                        <span className="truncate">{obra.endereco}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress & Phases */}
                  <div className="p-3 border-b border-slate-100">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                      <span className="flex items-center gap-1">
                        <Hammer className="w-3 h-3 text-red-700" />
                        <span>Fase Vigente: <strong className="text-slate-800 uppercase">{obra.fase_atual || 'Estrutura'}</strong></span>
                      </span>
                      <span className="text-red-700 font-bold">{obra.progresso || 50}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-700 to-red-600 rounded-full transition-all"
                        style={{ width: `${obra.progresso || 50}%` }}
                      ></div>
                    </div>

                    {/* Phase Mini Gantt Timeline */}
                    <div className="mt-2.5 p-2 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-red-700" />
                          <span>Cronograma de Fases Mapeadas</span>
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {obra.data_inicio} → {obra.data_previsao_termino}
                        </span>
                      </div>

                      {/* 3 Mapped Phases Gantt Mini Bar */}
                      <div className="space-y-1 text-[9px]">
                        {(() => {
                          const dInicio = obra.data_inicio ? new Date(obra.data_inicio + 'T00:00:00') : new Date('2024-01-01');
                          const dFim = obra.data_previsao_termino ? new Date(obra.data_previsao_termino + 'T23:59:59') : new Date('2025-06-30');
                          const totalMs = Math.max(86400000, dFim.getTime() - dInicio.getTime());
                          const prog = obra.progresso !== undefined ? obra.progresso : 50;

                          const f1Fim = new Date(dInicio.getTime() + totalMs * 0.30);
                          const f2Inicio = new Date(dInicio.getTime() + totalMs * 0.25);
                          const f2Fim = new Date(dInicio.getTime() + totalMs * 0.75);
                          const f3Inicio = new Date(dInicio.getTime() + totalMs * 0.70);

                          const f1Prog = prog >= 30 ? 100 : Math.round((prog / 30) * 100);
                          const f2Prog = prog > 25 ? Math.min(100, Math.round(((prog - 25) / 50) * 100)) : 0;
                          const f3Prog = prog > 70 ? Math.min(100, Math.round(((prog - 70) / 30) * 100)) : 0;

                          const formatDate = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });

                          return (
                            <>
                              {/* 1. Fundação */}
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="font-semibold text-slate-700 w-16 truncate">1. Fundação</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all ${f1Prog === 100 ? 'bg-emerald-600' : 'bg-amber-600'}`}
                                    style={{ width: `${f1Prog}%` }}
                                  />
                                </div>
                                <span className="text-[8px] font-mono text-slate-500 w-24 text-right truncate">
                                  {formatDate(dInicio)} - {formatDate(f1Fim)} ({f1Prog}%)
                                </span>
                              </div>

                              {/* 2. Estrutura */}
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="font-semibold text-slate-700 w-16 truncate">2. Estrutura</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all ${f2Prog === 100 ? 'bg-emerald-600' : 'bg-blue-600'}`}
                                    style={{ width: `${f2Prog}%` }}
                                  />
                                </div>
                                <span className="text-[8px] font-mono text-slate-500 w-24 text-right truncate">
                                  {formatDate(f2Inicio)} - {formatDate(f2Fim)} ({f2Prog}%)
                                </span>
                              </div>

                              {/* 3. Acabamento */}
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="font-semibold text-slate-700 w-16 truncate">3. Acabamento</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all ${f3Prog === 100 ? 'bg-emerald-600' : 'bg-purple-600'}`}
                                    style={{ width: `${f3Prog}%` }}
                                  />
                                </div>
                                <span className="text-[8px] font-mono text-slate-500 w-24 text-right truncate">
                                  {formatDate(f3Inicio)} - {formatDate(dFim)} ({f3Prog}%)
                                </span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-slate-100 text-center">
                      <div className="bg-slate-50 p-1.5 rounded-md">
                        <span className="text-[9px] text-slate-500 font-bold uppercase block">Orç. Total</span>
                        <span className="text-[11px] font-black text-slate-900 truncate block">{formatCurrency(obra.orcamento_total)}</span>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded-md">
                        <span className="text-[9px] text-slate-500 font-bold uppercase block">Materiais</span>
                        <span className="text-[11px] font-bold text-slate-800 truncate block">{formatCurrency(obra.orcamento_materiais)}</span>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded-md">
                        <span className="text-[9px] text-slate-500 font-bold uppercase block">Almoxarifado</span>
                        <span className="text-[11px] font-bold text-slate-800 truncate block">{formatCurrency(obra.orcamento_almoxarifado)}</span>
                      </div>
                    </div>

                    {/* Dates & Manager */}
                    <div className="mt-2 text-[10px] text-slate-500 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Eng. Gestor:</span>
                        <strong className="text-slate-800">{obra.gestor_nome || 'Não atribuído'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Previsão:</span>
                        <span className="text-slate-700 font-mono">{obra.data_previsao_termino}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="p-2 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onNavigateToAlmoxarifado(obra.id)}
                      className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                      title="Almoxarifado de Ferramentas da Obra"
                    >
                      <Boxes className="w-3 h-3 text-amber-600" />
                      <span>Almox.</span>
                    </button>
                    <button
                      onClick={() => onNavigateToMateriais(obra.id)}
                      className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                      title="Materiais de Consumo da Obra"
                    >
                      <PackageCheck className="w-3 h-3 text-emerald-600" />
                      <span>Materiais</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => onOpenEditarObra(obra)}
                      className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-white rounded-md transition-colors"
                      title="Editar dados da obra"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {currentUser.tipo === 'admin' && (
                      <button
                        onClick={() => onDeleteObra(obra.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Excluir obra"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>

          {filteredObras.length === 0 && (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">Nenhuma obra encontrada</h3>
              <p className="text-xs text-slate-500 mt-1">Tente ajustar os filtros ou termos da sua busca.</p>
            </div>
          )}
        </>
      )}

    </div>
  );
};

