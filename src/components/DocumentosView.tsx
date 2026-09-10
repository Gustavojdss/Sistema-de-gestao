import React, { useState } from 'react';
import { 
  FileCheck2, 
  Search, 
  SlidersHorizontal, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Eye, 
  ShieldCheck, 
  Calendar,
  Download,
  Building2,
  User,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  FileSpreadsheet,
  X,
  RotateCcw,
  Filter
} from 'lucide-react';
import { DocumentoColaborador, Usuario } from '../types/erp';

interface DocumentosViewProps {
  documentos: DocumentoColaborador[];
  currentUser: Usuario;
  onAprovarDocumento: (doc: DocumentoColaborador, validade: string) => void;
  onRejeitarDocumento: (doc: DocumentoColaborador, motivo: string) => void;
}

const TIPO_DOC_LABELS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  nr35: { label: 'NR-35 Trabalho em Altura', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  nr10: { label: 'NR-10 Instalações Elétricas', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  nr12: { label: 'NR-12 Segurança em Máquinas', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  nr18: { label: 'NR-18 Condições no Canteiro', bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
  nr33: { label: 'NR-33 Espaço Confinado', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  aso: { label: 'ASO Atestado Ocupacional', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  epi: { label: 'Ficha de Entrega de EPI', bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
  carteira_trabalho: { label: 'CTPS Digital / CLT', bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
  certificado: { label: 'Certificado Técnico', bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200' },
  vacina: { label: 'Carteira de Vacinação', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  contrato: { label: 'Contrato de Trabalho', bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
  ordem_servico: { label: 'Ordem de Serviço (OS)', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  integracao: { label: 'Treinamento de Integração', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  outro: { label: 'Documento Geral', bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200' }
};

export const DocumentosView: React.FC<DocumentosViewProps> = ({
  documentos,
  currentUser,
  onAprovarDocumento,
  onRejeitarDocumento
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [selectedDocModal, setSelectedDocModal] = useState<DocumentoColaborador | null>(null);
  const [actionType, setActionType] = useState<'view' | 'approve' | 'reject'>('view');
  const [validadeInput, setValidadeInput] = useState('');
  const [motivoRejeicao, setMotivoRejeicao] = useState('');

  // Motivos frequentes para agilizar reprovações
  const motivosFrequentes = [
    'Documento ilegível ou foto cortada',
    'Falta carimbo / CRM do médico coordenador no ASO',
    'Treinamento normativo com validade bienal expirada',
    'Carga horária teórica/prática abaixo da exigência da NR',
    'Falta assinatura do colaborador na Ficha de EPI'
  ];

  const pendentesCount = documentos.filter(d => d.status === 'pendente').length;
  const aprovadosCount = documentos.filter(d => d.status === 'aprovado').length;
  const reprovadosCount = documentos.filter(d => d.status === 'reprovado').length;
  const vencidosCount = documentos.filter(d => d.status === 'vencido').length;

  const filteredDocs = documentos.filter(d => {
    const docName = (d.nome_documento || '').toLowerCase();
    const colabName = (d.colaborador_nome || '').toLowerCase();
    const docType = (d.tipo_documento || '').toLowerCase();
    const matricula = (d.colaborador_matricula || '').toLowerCase();
    const obra = (d.obra_nome || '').toLowerCase();
    const search = searchTerm.toLowerCase().trim();

    const matchSearch = !search || 
                        docName.includes(search) ||
                        colabName.includes(search) ||
                        docType.includes(search) ||
                        matricula.includes(search) ||
                        obra.includes(search);

    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchTipo = tipoFilter === 'all' || d.tipo_documento === tipoFilter;

    return matchSearch && matchStatus && matchTipo;
  });

  const hasActiveFilters = searchTerm.trim() !== '' || statusFilter !== 'all' || tipoFilter !== 'all';

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTipoFilter('all');
  };

  const getTipoBadge = (tipo?: string) => {
    const key = tipo || 'outro';
    const info = TIPO_DOC_LABELS[key] || TIPO_DOC_LABELS.outro;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${info.bg} ${info.text} ${info.border}`}>
        {info.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            <span>Aprovado</span>
          </span>
        );
      case 'reprovado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-300">
            <XCircle className="w-3 h-3" />
            <span>Reprovado</span>
          </span>
        );
      case 'vencido':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-300">
            <Clock className="w-3 h-3" />
            <span>Vencido</span>
          </span>
        );
      case 'pendente':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            <span>Pendente</span>
          </span>
        );
    }
  };

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return 'Não informado';
    try {
      const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
      const parts = clean.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return clean;
    } catch {
      return dateStr;
    }
  };

  const handleOpenApprove = (doc: DocumentoColaborador) => {
    setSelectedDocModal(doc);
    setActionType('approve');
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setValidadeInput(doc.data_validade || nextYear.toISOString().split('T')[0]);
  };

  const handleOpenReject = (doc: DocumentoColaborador) => {
    setSelectedDocModal(doc);
    setActionType('reject');
    setMotivoRejeicao('');
  };

  const handleOpenView = (doc: DocumentoColaborador) => {
    setSelectedDocModal(doc);
    setActionType('view');
  };

  return (
    <div id="documentos-view-container" className="space-y-4">
      
      {/* Header & Controls */}
      <div id="documentos-header-card" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-100 text-red-800 rounded-lg">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900">Validação & Conformidade Documental (SST)</h1>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Central de auditoria e liberação técnica de ASOs, treinamentos normativos (NR-10, NR-18, NR-35) e fichas de EPI.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span id="badge-pendentes-header" className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            <span>{pendentesCount} {pendentesCount === 1 ? 'Pendente de Despacho' : 'Pendentes de Despacho'}</span>
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div id="documentos-kpi-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'pendente' ? 'all' : 'pendente')}
          className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'pendente' 
              ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/40 shadow-xs' 
              : 'bg-white border-slate-200 border-l-4 border-l-amber-500 hover:bg-slate-50'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Aguardando Validação</span>
          <p className="text-2xl font-black text-amber-900 mt-1">{pendentesCount}</p>
          <span className="text-[10px] text-slate-400">necessitam análise técnica</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'aprovado' ? 'all' : 'aprovado')}
          className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'aprovado' 
              ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-400/40 shadow-xs' 
              : 'bg-white border-slate-200 border-l-4 border-l-emerald-600 hover:bg-slate-50'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Documentos Conformes</span>
          <p className="text-2xl font-black text-emerald-900 mt-1">{aprovadosCount}</p>
          <span className="text-[10px] text-slate-400">validados e vigentes</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'reprovado' ? 'all' : 'reprovado')}
          className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'reprovado' 
              ? 'bg-red-50/80 border-red-400 ring-2 ring-red-400/40 shadow-xs' 
              : 'bg-white border-slate-200 border-l-4 border-l-red-600 hover:bg-slate-50'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Reprovados / Inconformes</span>
          <p className="text-2xl font-black text-red-900 mt-1">{reprovadosCount}</p>
          <span className="text-[10px] text-slate-400">devolvidos para correção</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'vencido' ? 'all' : 'vencido')}
          className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'vencido' 
              ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-400/40 shadow-xs' 
              : 'bg-white border-slate-200 border-l-4 border-l-purple-600 hover:bg-slate-50'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Vencidos / Expirados</span>
          <p className="text-2xl font-black text-purple-900 mt-1">{vencidosCount}</p>
          <span className="text-[10px] text-slate-400">reciclagem obrigatória</span>
        </button>
      </div>

      {/* Top Search and Status Filter Section */}
      <div id="documentos-filter-controls" className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        
        {/* Main Controls Row: Text Search + Status Dropdown + Tipo Dropdown */}
        <div className="flex flex-col lg:flex-row gap-3">
          
          {/* Text Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="documentos-search-input"
              type="text"
              placeholder="Buscar por colaborador, documento, matrícula (ex: MAT-010), tipo normativo ou obra..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearchTerm('');
              }}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-red-700 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-1 focus:ring-red-700"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="Limpar texto de busca"
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            
            {/* Status Filter Dropdown */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="documentos-status-filter" className="text-xs font-bold text-slate-600 shrink-0 hidden sm:inline">
                Status:
              </label>
              <div className="relative">
                <select
                  id="documentos-status-filter"
                  aria-label="Filtrar por Status do Documento"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 cursor-pointer"
                >
                  <option value="all">Todos os Status ({documentos.length})</option>
                  <option value="pendente">⏳ Pendentes ({pendentesCount})</option>
                  <option value="aprovado">✅ Aprovados ({aprovadosCount})</option>
                  <option value="reprovado">❌ Reprovados ({reprovadosCount})</option>
                  <option value="vencido">⚠️ Vencidos ({vencidosCount})</option>
                </select>
              </div>
            </div>

            {/* Tipo de Documento Filter Dropdown */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="documentos-tipo-filter" className="text-xs font-bold text-slate-600 shrink-0 hidden sm:inline">
                Tipo:
              </label>
              <select
                id="documentos-tipo-filter"
                aria-label="Filtrar por Tipo de Documento"
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 cursor-pointer"
              >
                <option value="all">Todos os Tipos</option>
                <option value="nr35">NR-35 (Trabalho em Altura)</option>
                <option value="nr10">NR-10 (Elétrica)</option>
                <option value="nr12">NR-12 (Máquinas)</option>
                <option value="nr18">NR-18 (Canteiro)</option>
                <option value="nr33">NR-33 (Espaço Confinado)</option>
                <option value="aso">ASO (Atestado Ocupacional)</option>
                <option value="epi">Ficha de EPI</option>
                <option value="certificado">Certificados Técnicos</option>
                <option value="carteira_trabalho">CTPS Digital</option>
              </select>
            </div>

            {/* Reset Filters button if any filter is active */}
            {hasActiveFilters && (
              <button
                id="btn-clear-document-filters"
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 flex items-center gap-1 transition-colors shrink-0"
                title="Limpar todos os filtros e busca"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Limpar</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick-filter pill chips + Counter row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Filtro Rápido:</span>
            </span>

            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({documentos.length})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('pendente')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                statusFilter === 'pendente'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Pendentes ({pendentesCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('aprovado')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                statusFilter === 'aprovado'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Aprovados ({aprovadosCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('reprovado')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                statusFilter === 'reprovado'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
              }`}
            >
              <XCircle className="w-3 h-3" />
              <span>Reprovados ({reprovadosCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('vencido')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                statusFilter === 'vencido'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Vencidos ({vencidosCount})</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Exibindo <strong className="text-slate-800">{filteredDocs.length}</strong> de <strong className="text-slate-800">{documentos.length}</strong> documentos
          </div>
        </div>

      </div>

      {/* Documentos Table */}
      <div id="documentos-table-wrapper" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[850px] lg:min-w-full">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="px-3 py-2.5 w-60">Colaborador / Obra</th>
                <th className="px-3 py-2.5">Documento / Tipo</th>
                <th className="px-3 py-2.5 w-28">Emissão</th>
                <th className="px-3 py-2.5 w-28">Validade</th>
                <th className="px-3 py-2.5 w-32">Status</th>
                <th className="px-3 py-2.5 w-40 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="odd:bg-white even:bg-slate-50/70 hover:bg-red-50/40 transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                        {doc.colaborador_nome ? doc.colaborador_nome.charAt(0) : 'C'}
                      </div>
                      <div className="min-w-0">
                        <strong className="text-slate-900 block truncate">{doc.colaborador_nome || 'Colaborador'}</strong>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium truncate">
                          <span>{doc.colaborador_matricula || 'MAT-000'}</span>
                          <span>•</span>
                          <span className="truncate">{doc.obra_nome || 'Canteiro Central'}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-2.5">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 block truncate">{doc.nome_documento}</span>
                      <div>{getTipoBadge(doc.tipo_documento)}</div>
                      {doc.motivo_reprovacao && (
                        <p className="text-[10px] text-red-700 font-medium bg-red-50 p-1 rounded border border-red-200">
                          <strong>Motivo:</strong> {doc.motivo_reprovacao}
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-2.5 font-mono text-slate-600 text-[11px]">
                    {formatDateDisplay(doc.data_emissao)}
                  </td>

                  <td className="px-3 py-2.5 font-mono text-slate-800 text-[11px]">
                    {doc.data_validade ? (
                      <span className={new Date(doc.data_validade) < new Date() ? 'text-red-700 font-bold' : 'text-slate-800 font-semibold'}>
                        {formatDateDisplay(doc.data_validade)}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Indeterminado</span>
                    )}
                  </td>

                  <td className="px-3 py-2.5">
                    {getStatusBadge(doc.status)}
                  </td>

                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenView(doc)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Inspecionar Dossiê do Documento"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {currentUser.tipo === 'admin' && doc.status === 'pendente' && (
                        <>
                          <button
                            onClick={() => handleOpenApprove(doc)}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold text-[10px] transition-colors shadow-2xs flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Aprovar</span>
                          </button>
                          <button
                            onClick={() => handleOpenReject(doc)}
                            className="px-2.5 py-1 bg-red-700 hover:bg-red-600 text-white rounded-lg font-bold text-[10px] transition-colors shadow-2xs flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Rejeitar</span>
                          </button>
                        </>
                      )}

                      {currentUser.tipo === 'admin' && doc.status !== 'pendente' && (
                        <button
                          onClick={() => handleOpenApprove(doc)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[10px] transition-colors"
                          title="Reavaliar ou atualizar validade"
                        >
                          Reavaliar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileCheck2 className="w-10 h-10 text-slate-300" />
                      <p className="font-bold text-sm text-slate-700">Nenhum documento encontrado</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Não encontramos nenhum registro para os termos pesquisados ou status selecionado.
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-2 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 rounded-lg text-xs font-bold border border-red-200 flex items-center gap-1.5 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Limpar Filtros e Busca</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Ação / Visualização */}
      {selectedDocModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">Validação & Conformidade Legal SST</span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">{selectedDocModal.nome_documento}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {getTipoBadge(selectedDocModal.tipo_documento)}
                  {getStatusBadge(selectedDocModal.status)}
                </div>
              </div>
              <button
                onClick={() => setSelectedDocModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Document Details Grid */}
            <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block font-semibold">Colaborador</span>
                <strong className="text-slate-800">{selectedDocModal.colaborador_nome}</strong>
                <span className="text-[10px] text-slate-500 block font-mono">{selectedDocModal.colaborador_matricula}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-semibold">Obra Vinculada</span>
                <strong className="text-slate-800">{selectedDocModal.obra_nome || 'Geral'}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-semibold">Data de Emissão</span>
                <strong className="text-slate-800 font-mono">{formatDateDisplay(selectedDocModal.data_emissao)}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-semibold">Validade Atual</span>
                <strong className="text-slate-800 font-mono">{formatDateDisplay(selectedDocModal.data_validade)}</strong>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-200">
                <span className="text-slate-400 text-[10px] block font-semibold">Responsável pelo Envio</span>
                <span className="text-slate-700 font-medium text-[11px]">
                  {selectedDocModal.uploaded_by_nome || 'Carlos Silva (Téc. SST)'} • {formatDateDisplay(selectedDocModal.created_at)}
                </span>
              </div>
            </div>

            {/* Inconformidade Apontada (se houver) */}
            {selectedDocModal.motivo_reprovacao && (
              <div className="p-3 bg-red-50 text-red-800 rounded-xl text-xs border border-red-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-red-900">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Motivo da Inconformidade Registrada:</span>
                </div>
                <p className="text-red-800 font-medium">{selectedDocModal.motivo_reprovacao}</p>
              </div>
            )}

            {/* Document Digital File Visualizer Box */}
            <div className="p-3.5 bg-slate-900 rounded-xl text-white space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-bold font-mono">
                    {selectedDocModal.arquivo_url ? selectedDocModal.arquivo_url.split('/').pop() : 'laudo_sst_assinado.pdf'}
                  </span>
                </div>
                <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">PDF Assinado Digitalmente</span>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-lg text-[11px] text-slate-300 border border-slate-700/50 flex items-center justify-between">
                <span>Certificado de autenticidade ICP-Brasil emitido pelo médico do trabalho/instrutor credenciado.</span>
                <a
                  href={selectedDocModal.arquivo_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-red-800 hover:bg-red-700 text-white rounded text-[10px] font-bold flex items-center gap-1 shrink-0 ml-2"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Abrir</span>
                </a>
              </div>
            </div>

            {/* Action = Approve */}
            {actionType === 'approve' && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Definir Data de Validade do Certificado / ASO:
                  </label>
                  <input
                    type="date"
                    value={validadeInput}
                    onChange={(e) => setValidadeInput(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-red-700"
                  />
                </div>

                {/* Quick Presets for Validade */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-semibold">Atalhos:</span>
                  {[
                    { label: '+6 Meses', months: 6 },
                    { label: '+1 Ano (Padrão)', months: 12 },
                    { label: '+2 Anos (NR-35)', months: 24 }
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setMonth(d.getMonth() + p.months);
                        setValidadeInput(d.toISOString().split('T')[0]);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      onAprovarDocumento(selectedDocModal, validadeInput);
                      setSelectedDocModal(null);
                    }}
                    className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Aprovação Legal</span>
                  </button>
                  <button
                    onClick={() => setSelectedDocModal(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Action = Reject */}
            {actionType === 'reject' && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Motivo Obrigatório da Inconformidade (SST):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Especifique com precisão a inconformidade (ex.: falta de assinatura, validade expirada, médico sem CRM)..."
                    value={motivoRejeicao}
                    onChange={(e) => setMotivoRejeicao(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-red-700 font-medium"
                  />
                </div>

                {/* Motivos Rápidos */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold block">Ou selecione um motivo comum:</span>
                  <div className="flex flex-wrap gap-1">
                    {motivosFrequentes.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMotivoRejeicao(m)}
                        className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-red-50 hover:text-red-800 rounded border border-slate-200 text-slate-700 text-left truncate max-w-full"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    disabled={!motivoRejeicao.trim()}
                    onClick={() => {
                      onRejeitarDocumento(selectedDocModal, motivoRejeicao);
                      setSelectedDocModal(null);
                    }}
                    className="flex-1 py-2.5 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Registrar Reprovação Técnica</span>
                  </button>
                  <button
                    onClick={() => setSelectedDocModal(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Action = View only */}
            {actionType === 'view' && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                {currentUser.tipo === 'admin' && (
                  <>
                    <button
                      onClick={() => handleOpenApprove(selectedDocModal)}
                      className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Aprovar</span>
                    </button>
                    <button
                      onClick={() => handleOpenReject(selectedDocModal)}
                      className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Rejeitar</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedDocModal(null)}
                  className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-xl text-xs font-bold"
                >
                  Fechar
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
