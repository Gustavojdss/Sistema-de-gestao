import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  ShieldCheck, 
  FileText, 
  Phone, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  UploadCloud,
  FileCheck2
} from 'lucide-react';
import { Colaborador, DocumentoColaborador, Obra, Usuario } from '../types/erp';

interface EquipeViewProps {
  colaboradores: Colaborador[];
  documentos: DocumentoColaborador[];
  obras: Obra[];
  selectedObraId: number | 'all';
  currentUser: Usuario;
  onOpenNovoColaborador: () => void;
  onOpenUploadDocumento: (colaboradorId: number) => void;
}

export const EquipeView: React.FC<EquipeViewProps> = ({
  colaboradores,
  documentos,
  obras,
  selectedObraId,
  currentUser,
  onOpenNovoColaborador,
  onOpenUploadDocumento
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedColabDetails, setSelectedColabDetails] = useState<Colaborador | null>(null);

  const filteredByObra = selectedObraId === 'all' 
    ? colaboradores 
    : colaboradores.filter(c => c.obra_id === selectedObraId);

  const filteredColaboradores = filteredByObra.filter(c => {
    const matchSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.cpf.includes(searchTerm) ||
                        c.funcao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (c.empresa_terceira && c.empresa_terceira.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchTipo = tipoFilter === 'all' || c.tipo === tipoFilter;
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchTipo && matchStatus;
  });

  const getColabDocs = (colabId: number) => {
    return documentos.filter(d => d.colaborador_id === colabId);
  };

  return (
    <div className="space-y-3.5">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-red-700" />
            <h1 className="text-base sm:text-lg font-black text-slate-900">Equipe de Canteiro & Colaboradores</h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Cadastro de operários próprios e terceirizados, alocação em frentes de obra e conformidade trabalhista/SST.
          </p>
        </div>

        <button
          onClick={onOpenNovoColaborador}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Cadastrar Colaborador</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF, cargo/função ou empreiteira terceirizada..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-red-700"
          />
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <select
            aria-label="Filtrar por Vínculo"
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">Todos os Vínculos</option>
            <option value="proprio">Próprio (CLT)</option>
            <option value="terceiro">Terceirizado</option>
          </select>
          <select
            aria-label="Filtrar por Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">Todos os Status</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
        </div>
      </div>

      {/* Colaboradores Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[760px] lg:min-w-full">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="px-2.5 py-1.5 sm:px-3 sm:py-2">Colaborador</th>
                <th className="px-2.5 py-1.5 sm:px-3 sm:py-2">Função / Cargo</th>
                <th className="px-2.5 py-1.5 sm:px-3 sm:py-2">Obra Alocada</th>
                <th className="px-2.5 py-1.5 sm:px-3 sm:py-2">Vínculo</th>
                <th className="px-2.5 py-1.5 sm:px-3 sm:py-2">Contato</th>
                <th className="px-2.5 py-1.5 sm:px-3 sm:py-2">Documentos SST</th>
                <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredColaboradores.map((colab) => {
                const docs = getColabDocs(colab.id);
                const hasPending = docs.some(d => d.status === 'pendente');
                const allApproved = docs.length > 0 && docs.every(d => d.status === 'aprovado');

                return (
                  <tr key={colab.id} className="odd:bg-white even:bg-slate-50/70 hover:bg-red-50/40 transition-colors">
                    <td className="px-2.5 py-1.5 sm:px-3 sm:py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {colab.nome.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">{colab.nome}</span>
                          <span className="text-[9px] text-slate-400 font-mono">CPF: {colab.cpf}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 font-semibold text-slate-800 truncate">{colab.funcao}</td>
                    <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-slate-600 font-medium truncate">{colab.obra_nome || 'Central Brasal'}</td>
                    <td className="px-2.5 py-1.5 sm:px-3 sm:py-2">
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        colab.tipo === 'proprio' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {colab.tipo === 'proprio' ? 'Próprio CLT' : `Terceiro (${colab.empresa_terceira || 'Empreiteira'})`}
                      </span>
                    </td>
                    <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-slate-600">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{colab.telefone || '-'}</span>
                      </div>
                    </td>
                    <td className="px-2.5 py-1.5 sm:px-3 sm:py-2">
                      {docs.length === 0 ? (
                        <span className="text-[10px] text-slate-400">Nenhum doc</span>
                      ) : allApproved ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[9px]">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          <span>{docs.length} Docs OK</span>
                        </span>
                      ) : hasPending ? (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold text-[9px]">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>Pendente</span>
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold text-[9px]">
                          {docs.length} Docs
                        </span>
                      )}
                    </td>
                    <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onOpenUploadDocumento(colab.id)}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-[10px] font-bold flex items-center gap-1"
                          title="Anexar ASO / NR-35 / Certificados"
                        >
                          <UploadCloud className="w-3 h-3 text-blue-400" />
                          <span>Anexar</span>
                        </button>
                        <button
                          onClick={() => setSelectedColabDetails(colab)}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] font-bold"
                        >
                          Dossiê
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

      {/* Dossier Modal */}
      {selectedColabDetails && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">Dossiê do Colaborador</span>
                <h3 className="text-base font-black text-slate-900">{selectedColabDetails.nome}</h3>
                <p className="text-xs text-slate-500">{selectedColabDetails.funcao} · {selectedColabDetails.tipo === 'proprio' ? 'CLT Próprio' : selectedColabDetails.empresa_terceira}</p>
              </div>
              <button
                onClick={() => setSelectedColabDetails(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">CPF</span>
                <strong className="text-slate-800 font-mono">{selectedColabDetails.cpf}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">RG</span>
                <strong className="text-slate-800 font-mono">{selectedColabDetails.rg || '-'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Obra Alocada</span>
                <strong className="text-slate-800">{selectedColabDetails.obra_nome || 'Geral'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Admissão</span>
                <strong className="text-slate-800">{selectedColabDetails.data_admissao || '-'}</strong>
              </div>
            </div>

            {/* Docs List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">Documentos e Certificados SST</span>
                <button
                  onClick={() => {
                    const id = selectedColabDetails.id;
                    setSelectedColabDetails(null);
                    onOpenUploadDocumento(id);
                  }}
                  className="text-xs font-bold text-red-700 hover:underline"
                >
                  + Enviar Novo
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {getColabDocs(selectedColabDetails.id).map(doc => (
                  <div key={doc.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{doc.nome_documento || doc.tipo_documento}</span>
                      <span className="text-[10px] text-slate-500">Validade: {doc.data_validade || 'Indeterminado'}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      doc.status === 'aprovado' ? 'bg-emerald-100 text-emerald-800' :
                      doc.status === 'pendente' ? 'bg-amber-100 text-amber-800' :
                      doc.status === 'vencido' ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                ))}
                {getColabDocs(selectedColabDetails.id).length === 0 && (
                  <p className="text-xs text-slate-400 italic py-2 text-center">Nenhum documento registrado para este colaborador.</p>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedColabDetails(null)}
              className="w-full py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
            >
              Fechar Dossiê
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
