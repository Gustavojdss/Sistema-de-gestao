import React, { useState } from 'react';
import { 
  CalendarCheck, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText, 
  UserCheck, 
  Building2,
  Calendar,
  CheckSquare,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Eye
} from 'lucide-react';
import { Vistoria, Obra, Usuario } from '../types/erp';

interface VistoriasViewProps {
  vistorias: Vistoria[];
  obras: Obra[];
  selectedObraId: number | 'all';
  currentUser: Usuario;
  onOpenNovaVistoria: () => void;
  onConcluirVistoria: (vistoria: Vistoria) => void;
}

export const VistoriasView: React.FC<VistoriasViewProps> = ({
  vistorias,
  obras,
  selectedObraId,
  currentUser,
  onOpenNovaVistoria,
  onConcluirVistoria
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedVistoriaDetail, setSelectedVistoriaDetail] = useState<Vistoria | null>(null);

  const filteredByObra = selectedObraId === 'all' 
    ? vistorias 
    : vistorias.filter(v => v.obra_id === selectedObraId);

  const filteredVistorias = filteredByObra.filter(v => {
    const matchSearch = v.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        v.obra_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        v.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        v.responsavel_nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    const matchTipo = tipoFilter === 'all' || v.tipo === tipoFilter;
    return matchSearch && matchStatus && matchTipo;
  });

  const pendentesCount = vistorias.filter(v => v.status === 'pendente').length;
  const concluidasCount = vistorias.filter(v => v.status === 'concluida').length;

  return (
    <div className="space-y-3.5">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5 text-red-700" />
            <h1 className="text-base sm:text-lg font-black text-slate-900">Vistorias Técnicas & Auditorias de Canteiro</h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Agendamento de vistorias estruturais, auditorias de segurança do trabalho e controle de não-conformidades.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Visualização em Tabela Compacta"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Tabela</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Visualização em Grade de Cards"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Cards</span>
            </button>
          </div>

          <button
            onClick={onOpenNovaVistoria}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Vistoria</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar vistoria por título, obra, auditor ou tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-red-700"
          />
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <select
            aria-label="Filtrar por Status da Vistoria"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">Todos os Status</option>
            <option value="pendente">Pendentes ({pendentesCount})</option>
            <option value="concluida">Concluídas ({concluidasCount})</option>
            <option value="cancelada">Canceladas</option>
          </select>

          <select
            aria-label="Filtrar por Tipo de Vistoria"
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">Todos os Tipos</option>
            <option value="Segurança">Segurança</option>
            <option value="Qualidade">Qualidade</option>
            <option value="Estrutural">Estrutural</option>
          </select>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[780px] lg:min-w-full">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-28">Data</th>
                  <th className="px-2.5 py-1.5 sm:px-3 sm:py-2">Vistoria / Checklist</th>
                  <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-36">Obra</th>
                  <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-24">Tipo</th>
                  <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-36">Auditor / Resp.</th>
                  <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-32 text-center">Conformidade</th>
                  <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-24 text-center">Status</th>
                  <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-32 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVistorias.map((v) => {
                  const taxaConformidade = (v.itens_conformes !== undefined && v.total_itens !== undefined && v.total_itens > 0)
                    ? Math.round((v.itens_conformes / v.total_itens) * 100)
                    : null;

                  return (
                    <tr key={v.id} className="odd:bg-white even:bg-slate-50/70 hover:bg-red-50/40 transition-colors">
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 font-mono text-slate-600">{v.data_vistoria}</td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2">
                        <strong className="text-slate-900 block truncate">{v.titulo}</strong>
                        {v.nao_conformidades && (
                          <span className="text-[9px] text-red-600 font-bold block truncate max-w-xs">
                            ⚠️ {v.nao_conformidades}
                          </span>
                        )}
                      </td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-slate-700 font-medium truncate">{v.obra_nome}</td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          v.tipo === 'Segurança' ? 'bg-red-100 text-red-800' :
                          v.tipo === 'Qualidade' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {v.tipo}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-slate-600 truncate">{v.responsavel_nome}</td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-center">
                        {taxaConformidade !== null ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden shrink-0">
                              <div 
                                className={`h-full rounded-full ${taxaConformidade >= 80 ? 'bg-emerald-500' : taxaConformidade >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${taxaConformidade}%` }}
                              ></div>
                            </div>
                            <span className="font-bold text-[10px] text-slate-700">{taxaConformidade}%</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          v.status === 'concluida' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          v.status === 'pendente' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-red-100 text-red-800'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedVistoriaDetail(v)}
                            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                            title="Ver Detalhes"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {v.status === 'pendente' && (
                            <button
                              onClick={() => onConcluirVistoria(v)}
                              className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold text-[10px] flex items-center gap-1"
                            >
                              <CheckSquare className="w-3 h-3" />
                              <span>Executar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredVistorias.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-slate-500">
                      Nenhuma vistoria encontrada com os filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredVistorias.map((vistoria) => (
            <div 
              key={vistoria.id}
              className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    vistoria.tipo === 'Segurança' ? 'bg-red-100 text-red-800' :
                    vistoria.tipo === 'Qualidade' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {vistoria.tipo}
                  </span>

                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    vistoria.status === 'concluida' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    vistoria.status === 'pendente' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-red-100 text-red-800'
                  }`}>
                    {vistoria.status}
                  </span>
                </div>

                <h3 className="font-bold text-xs text-slate-900 mt-2">{vistoria.titulo}</h3>
                
                <div className="mt-2 space-y-1 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span className="font-semibold text-slate-700">{vistoria.obra_nome}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Data: <strong className="text-slate-800">{vistoria.data_vistoria}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3 h-3 text-slate-400" />
                    <span>Auditor: <strong className="text-slate-800">{vistoria.responsavel_nome}</strong></span>
                  </div>
                </div>

                {vistoria.itens_conformes !== undefined && vistoria.total_itens !== undefined && (
                  <div className="mt-2.5 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                      <span>Conformidade</span>
                      <span>{Math.round((vistoria.itens_conformes / vistoria.total_itens) * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${(vistoria.itens_conformes / vistoria.total_itens) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5 block">
                      {vistoria.itens_conformes} de {vistoria.total_itens} itens conformes
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedVistoriaDetail(vistoria)}
                  className="text-[11px] font-bold text-slate-600 hover:text-slate-900"
                >
                  Ver Detalhes
                </button>

                {vistoria.status === 'pendente' && (
                  <button
                    onClick={() => onConcluirVistoria(vistoria)}
                    className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-md text-[11px] font-bold flex items-center gap-1"
                  >
                    <CheckSquare className="w-3 h-3" />
                    <span>Executar Checklist</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedVistoriaDetail && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">{selectedVistoriaDetail.tipo}</span>
                <h3 className="text-base font-black text-slate-900">{selectedVistoriaDetail.titulo}</h3>
                <p className="text-xs text-slate-500">{selectedVistoriaDetail.obra_nome}</p>
              </div>
              <button
                onClick={() => setSelectedVistoriaDetail(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
              <p><strong>Observações da Auditoria:</strong> {selectedVistoriaDetail.observacoes || 'Sem observações adicionais.'}</p>
              {selectedVistoriaDetail.nao_conformidades && (
                <div className="p-2.5 bg-red-50 text-red-800 rounded-lg border border-red-200">
                  <strong>Não Conformidades Identificadas:</strong> {selectedVistoriaDetail.nao_conformidades}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedVistoriaDetail(null)}
              className="w-full py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

