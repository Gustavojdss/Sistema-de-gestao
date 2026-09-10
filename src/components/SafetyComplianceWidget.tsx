import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  FileCheck, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  HardHat, 
  Activity, 
  Building2, 
  ChevronRight, 
  Filter, 
  ArrowUpRight, 
  Award, 
  HeartPulse, 
  Info, 
  Plus, 
  BarChart3, 
  PieChart as PieChartIcon,
  Check,
  Calendar,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import { DocumentoColaborador, Vistoria, Obra, Colaborador } from '../types/erp';

interface SafetyComplianceWidgetProps {
  documentos: DocumentoColaborador[];
  vistorias: Vistoria[];
  obras: Obra[];
  colaboradores?: Colaborador[];
  onNavigate?: (tab: string) => void;
  onOpenNovaVistoria?: () => void;
}

export interface IncidentItem {
  id: number;
  vistoriaId: number;
  obraId: number;
  obraNome: string;
  tipo: string;
  titulo: string;
  descricao: string;
  data: string;
  severidade: 'critica' | 'moderada' | 'leve';
  status: 'aberto' | 'em_tratamento' | 'resolvido';
  categoria: 'trabalho_altura' | 'eletrica' | 'epi' | 'maquinas' | 'canteiro_nr18' | 'saude_ocupacional';
  responsavel: string;
}

const TIPO_DOC_NOMES: Record<string, string> = {
  nr35: 'NR-35 (Altura)',
  nr10: 'NR-10 (Elétrica)',
  nr12: 'NR-12 (Máquinas)',
  nr18: 'NR-18 (Canteiro)',
  nr33: 'NR-33 (Espaço Confinado)',
  aso: 'ASO (Atestado)',
  epi: 'Ficha EPI',
  carteira_trabalho: 'CTPS / CLT',
  certificado: 'Certificados',
  vacina: 'Vacinas',
  contrato: 'Contratos',
  ordem_servico: 'Ordem Serviço',
  integracao: 'Integração',
  outro: 'Gerais'
};

const SEVERITY_COLORS = {
  critica: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', dot: 'bg-red-600', label: 'Crítico' },
  moderada: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', dot: 'bg-amber-500', label: 'Moderado' },
  leve: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', dot: 'bg-blue-500', label: 'Leve' }
};

export const SafetyComplianceWidget: React.FC<SafetyComplianceWidgetProps> = ({
  documentos,
  vistorias,
  obras,
  colaboradores = [],
  onNavigate,
  onOpenNovaVistoria
}) => {
  const [selectedObraFilter, setSelectedObraFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'geral' | 'documentos' | 'incidentes' | 'normas'>('geral');
  const [incidentStatusFilter, setIncidentStatusFilter] = useState<'all' | 'aberto' | 'em_tratamento' | 'resolvido'>('all');

  // Filtered dataset by Obra
  const filteredDocs = useMemo(() => {
    if (selectedObraFilter === 'all') return documentos;
    const targetObra = obras.find(o => String(o.id) === selectedObraFilter);
    if (!targetObra) return documentos;
    return documentos.filter(d => d.obra_nome === targetObra.nome);
  }, [documentos, selectedObraFilter, obras]);

  const filteredVistorias = useMemo(() => {
    if (selectedObraFilter === 'all') return vistorias;
    return vistorias.filter(v => String(v.obra_id) === selectedObraFilter);
  }, [vistorias, selectedObraFilter]);

  // Document status metrics
  const docMetrics = useMemo(() => {
    const total = filteredDocs.length || 0;
    const aprovados = filteredDocs.filter(d => d.status === 'aprovado').length;
    const pendentes = filteredDocs.filter(d => d.status === 'pendente').length;
    const vencidos = filteredDocs.filter(d => d.status === 'vencido').length;
    const reprovados = filteredDocs.filter(d => d.status === 'reprovado').length;
    const criticos = vencidos + reprovados;

    const complianceRate = total > 0 ? Math.round((aprovados / total) * 100) : 100;
    const pendingRate = total > 0 ? Math.round((pendentes / total) * 100) : 0;
    const criticalRate = total > 0 ? Math.round((criticos / total) * 100) : 0;

    return {
      total,
      aprovados,
      pendentes,
      vencidos,
      reprovados,
      criticos,
      complianceRate,
      pendingRate,
      criticalRate
    };
  }, [filteredDocs]);

  // Documents by Category / Norm
  const docsByCategoryData = useMemo(() => {
    const categories: Record<string, { name: string; aprovados: number; pendentes: number; vencidos: number; total: number }> = {};

    filteredDocs.forEach(d => {
      const typeKey = d.tipo_documento || 'outro';
      const label = TIPO_DOC_NOMES[typeKey] || typeKey.toUpperCase();
      if (!categories[label]) {
        categories[label] = { name: label, aprovados: 0, pendentes: 0, vencidos: 0, total: 0 };
      }
      categories[label].total += 1;
      if (d.status === 'aprovado') categories[label].aprovados += 1;
      else if (d.status === 'pendente') categories[label].pendentes += 1;
      else categories[label].vencidos += 1;
    });

    return Object.values(categories).sort((a, b) => b.total - a.total).slice(0, 6);
  }, [filteredDocs]);

  // Documents by Obra breakdown for comparison
  const docsByObraData = useMemo(() => {
    return obras.map(obra => {
      const obraDocs = documentos.filter(d => d.obra_nome === obra.nome);
      const total = obraDocs.length;
      const aprovados = obraDocs.filter(d => d.status === 'aprovado').length;
      const pendentes = obraDocs.filter(d => d.status === 'pendente').length;
      const vencidos = obraDocs.filter(d => d.status === 'vencido' || d.status === 'reprovado').length;
      const taxaConformidade = total > 0 ? Math.round((aprovados / total) * 100) : 100;

      return {
        obraId: obra.id,
        obraNome: obra.nome.length > 18 ? obra.nome.slice(0, 18) + '...' : obra.nome,
        nomeCompleto: obra.nome,
        aprovados,
        pendentes,
        vencidos,
        taxaConformidade,
        total
      };
    });
  }, [obras, documentos]);

  // Pie chart data for document statuses
  const pieStatusData = useMemo(() => {
    return [
      { name: 'Aprovados (Em Conformidade)', value: docMetrics.aprovados, color: '#059669' },
      { name: 'Pendentes de Validação', value: docMetrics.pendentes, color: '#d97706' },
      { name: 'Vencidos', value: docMetrics.vencidos, color: '#dc2626' },
      { name: 'Reprovados / Irregulares', value: docMetrics.reprovados, color: '#991b1b' }
    ].filter(item => item.value > 0);
  }, [docMetrics]);

  // Incidentes & Não-Conformidades derivation from Vistorias & Field Audits
  const incidentesList = useMemo<IncidentItem[]>(() => {
    const list: IncidentItem[] = [];

    vistorias.forEach((v, idx) => {
      const isSST = (v.tipo || '').toLowerCase().includes('seguran') || 
                    (v.tipo || '').toLowerCase().includes('nr') || 
                    (v.titulo || '').toLowerCase().includes('seguran') ||
                    (v.titulo || '').toLowerCase().includes('nr-18') ||
                    (v.titulo || '').toLowerCase().includes('ancoragem') ||
                    (v.titulo || '').toLowerCase().includes('hidrost');

      if (isSST || v.status === 'pendente' || (v.observacoes && v.observacoes.length > 0)) {
        // Obra 1 incident: Linhas de vida & Ancoragem
        if (v.id === 2 || (v.titulo || '').includes('NR-18')) {
          list.push({
            id: 101,
            vistoriaId: v.id,
            obraId: v.obra_id,
            obraNome: v.obra_nome || 'Residencial Brasal Noroeste',
            tipo: 'Não Conformidade NR-18',
            titulo: 'Ancoragem perimetral e proteção de periferia no 4º pavimento',
            descricao: 'Ponto de fixação da linha de vida na fachada leste necessita de ensaio de arrancamento e reaperto.',
            data: v.data_agendada || '2024-08-30',
            severidade: 'critica',
            status: 'em_tratamento',
            categoria: 'trabalho_altura',
            responsavel: 'Eng. Carlos Silva'
          });
          list.push({
            id: 102,
            vistoriaId: v.id,
            obraId: v.obra_id,
            obraNome: v.obra_nome || 'Residencial Brasal Noroeste',
            tipo: 'Desvio Operacional',
            titulo: 'Sinalização provisória do poço do elevador',
            descricao: 'Falta placa de advertência de risco de queda no 3º subsolo.',
            data: v.data_agendada || '2024-08-28',
            severidade: 'moderada',
            status: 'aberto',
            categoria: 'canteiro_nr18',
            responsavel: 'Téc. SST Lucas Mendes'
          });
        }

        // Obra 2 incident: Teste e Grua
        if (v.id === 3 || (v.titulo || '').includes('Hidrostático')) {
          list.push({
            id: 103,
            vistoriaId: v.id,
            obraId: v.obra_id,
            obraNome: v.obra_nome || 'Comercial Lago Norte Corporate',
            tipo: 'Apontamento Preventivo',
            titulo: 'Certificado de calibração do manômetro da bomba de pressurização',
            descricao: 'Manômetro com certificado emitido há mais de 12 meses. Aprovado com ressalva de substituição.',
            data: v.realizada_em || '2024-08-15',
            severidade: 'leve',
            status: 'resolvido',
            categoria: 'maquinas',
            responsavel: 'Eng. Mariana Santos'
          });
        }

        // Vistoria 1: Estrutural & Escoramento
        if (v.id === 1 || (v.titulo || '').includes('Estrutural')) {
          list.push({
            id: 104,
            vistoriaId: v.id,
            obraId: v.obra_id,
            obraNome: v.obra_nome || 'Residencial Brasal Noroeste',
            tipo: 'Segurança Estrutural',
            titulo: 'Travamento de torres de escoramento metálico',
            descricao: 'Verificação da capacidade de carga dos pés-direitos duplos no hall social.',
            data: v.data_agendada || '2024-08-28',
            severidade: 'moderada',
            status: 'em_tratamento',
            categoria: 'canteiro_nr18',
            responsavel: 'Mestre Antonio'
          });
        }
      }
    });

    // Se houver documentos vencidos ou reprovados, adicionar incidentes de conformidade documental automática
    documentos.filter(d => d.status === 'vencido' || d.status === 'reprovado').forEach((doc, i) => {
      list.push({
        id: 200 + doc.id,
        vistoriaId: 0,
        obraId: 2,
        obraNome: doc.obra_nome || 'Comercial Lago Norte Corporate',
        tipo: 'Bloqueio SST - Norma Regulamentadora',
        titulo: `Documento irregular: ${doc.nome_documento}`,
        descricao: doc.motivo_reprovacao || `Certificado ${doc.tipo_documento.toUpperCase()} de colaborador expirado sem reciclagem.`,
        data: doc.data_validade || doc.created_at || '2024-08-24',
        severidade: 'critica',
        status: 'aberto',
        categoria: doc.tipo_documento === 'nr35' ? 'trabalho_altura' : doc.tipo_documento === 'nr10' ? 'eletrica' : doc.tipo_documento === 'nr12' ? 'maquinas' : 'saude_ocupacional',
        responsavel: doc.colaborador_nome || 'Gestão de SST'
      });
    });

    return list;
  }, [vistorias, documentos]);

  // Filtered incidents
  const filteredIncidentes = useMemo(() => {
    return incidentesList.filter(item => {
      const matchObra = selectedObraFilter === 'all' || String(item.obraId) === selectedObraFilter;
      const matchStatus = incidentStatusFilter === 'all' || item.status === incidentStatusFilter;
      return matchObra && matchStatus;
    });
  }, [incidentesList, selectedObraFilter, incidentStatusFilter]);

  // Incident summary counters
  const incidentCounters = useMemo(() => {
    const total = incidentesList.length;
    const abertos = incidentesList.filter(i => i.status === 'aberto').length;
    const emTratamento = incidentesList.filter(i => i.status === 'em_tratamento').length;
    const resolvidos = incidentesList.filter(i => i.status === 'resolvido').length;
    const criticos = incidentesList.filter(i => i.severidade === 'critica' && i.status !== 'resolvido').length;
    const moderados = incidentesList.filter(i => i.severidade === 'moderada' && i.status !== 'resolvido').length;
    const leves = incidentesList.filter(i => i.severidade === 'leve' && i.status !== 'resolvido').length;

    const taxaResolucao = total > 0 ? Math.round((resolvidos / total) * 100) : 100;
    
    // Safe workdays (Dias sem acidentes de trabalho com afastamento)
    const diasSemAcidentes = 184;

    return {
      total,
      abertos,
      emTratamento,
      resolvidos,
      criticos,
      moderados,
      leves,
      taxaResolucao,
      diasSemAcidentes
    };
  }, [incidentesList]);

  return (
    <div 
      id="safety-compliance-widget"
      className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden transition-all"
    >
      {/* ========================================================================= */}
      {/* 1. WIDGET HEADER                                                         */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 text-white px-3 py-2 sm:px-4 sm:py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-600/90 text-white flex items-center justify-center shrink-0 shadow-xs ring-2 ring-emerald-500/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-extrabold text-[12.5px] sm:text-[13.5px] text-white tracking-tight leading-tight">
                Conformidade de Segurança & Gestão de SST
              </h2>
              <span className="text-[7.5px] font-bold bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-700/60 flex items-center gap-1">
                <HeartPulse className="w-2.5 h-2.5 text-emerald-400" />
                <span>NR-18 / NR-35 / NR-10 / ASO</span>
              </span>
            </div>
            <p className="text-[8px] sm:text-[8.5px] text-slate-400 truncate">
              Monitoramento contínuo de certificações normativas, documentação de colaboradores e apontamentos de vistorias técnicas.
            </p>
          </div>
        </div>

        {/* Global Controls & Obra Filter */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          {/* Obra Filter */}
          <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700 px-2 py-0.5 rounded text-[7.5px]">
            <Filter className="w-2.5 h-2.5 text-slate-400" />
            <select
              id="select-safety-obra-filter"
              value={selectedObraFilter}
              onChange={(e) => setSelectedObraFilter(e.target.value)}
              aria-label="Filtrar canteiro de obras para conformidade de segurança"
              className="bg-transparent text-white font-semibold text-[7.5px] focus:outline-hidden cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">Todos os Canteiros ({obras.length})</option>
              {obras.map(o => (
                <option key={o.id} value={String(o.id)} className="bg-slate-900 text-white">
                  {o.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Action: Nova Vistoria */}
          {onOpenNovaVistoria && (
            <button
              id="btn-safety-nova-vistoria"
              onClick={onOpenNovaVistoria}
              className="px-2 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-[8px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-2.5 h-2.5" />
              <span>Nova Vistoria</span>
            </button>
          )}

          {/* Action: Ver Auditoria Documental */}
          {onNavigate && (
            <button
              id="btn-safety-ver-docs"
              onClick={() => onNavigate('documentos')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded text-[8px] font-bold flex items-center gap-1 border border-slate-700 transition-all cursor-pointer"
            >
              <span>Auditoria NR</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP SUMMARY HIGHLIGHT COUNTERS & KPI STRIP                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 p-2.5 sm:p-3 bg-slate-50 border-b border-slate-200">
        
        {/* KPI 1: Taxa de Conformidade Documental */}
        <div 
          onClick={() => onNavigate && onNavigate('documentos')}
          className="bg-white p-2 rounded-md border border-slate-200/80 shadow-2xs hover:border-emerald-400 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-tight">Conformidade Docs</span>
            <div className={`w-4 h-4 rounded flex items-center justify-center ${docMetrics.complianceRate >= 90 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              <ShieldCheck className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={`text-[15px] font-black tracking-tight ${docMetrics.complianceRate >= 90 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {docMetrics.complianceRate}%
            </span>
            <span className="text-[7.5px] text-slate-500 font-medium">({docMetrics.aprovados}/{docMetrics.total})</span>
          </div>
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
            <div 
              className={`h-full rounded-full ${docMetrics.complianceRate >= 90 ? 'bg-emerald-600' : 'bg-amber-500'}`}
              style={{ width: `${docMetrics.complianceRate}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Documentos Pendentes de Análise */}
        <div 
          onClick={() => onNavigate && onNavigate('documentos')}
          className="bg-white p-2 rounded-md border border-slate-200/80 shadow-2xs hover:border-amber-400 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-tight">Docs Pendentes</span>
            <div className="w-4 h-4 rounded bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-[15px] font-black text-amber-700 tracking-tight">
              {docMetrics.pendentes}
            </span>
            <span className="text-[7.5px] text-amber-800 font-medium">aguardando</span>
          </div>
          <span className="text-[7px] text-slate-400 mt-1 block truncate">
            {docMetrics.pendingRate}% da base documental
          </span>
        </div>

        {/* KPI 3: Documentos Vencidos / Reprovados (Críticos) */}
        <div 
          onClick={() => onNavigate && onNavigate('documentos')}
          className="bg-white p-2 rounded-md border border-slate-200/80 shadow-2xs hover:border-red-400 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-tight">Vencidos / Reprovados</span>
            <div className="w-4 h-4 rounded bg-red-100 text-red-700 flex items-center justify-center">
              <ShieldAlert className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-[15px] font-black text-red-700 tracking-tight">
              {docMetrics.criticos}
            </span>
            <span className="text-[7.5px] text-red-800 font-bold">({docMetrics.vencidos} v / {docMetrics.reprovados} r)</span>
          </div>
          <span className="text-[7px] text-red-600 font-semibold mt-1 block truncate">
            Risco de interdição / multa
          </span>
        </div>

        {/* KPI 4: Contador de Incidentes & Não Conformidades */}
        <div 
          onClick={() => setActiveTab('incidentes')}
          className="bg-white p-2 rounded-md border border-slate-200/80 shadow-2xs hover:border-orange-400 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-tight">Incidentes / Desvios</span>
            <div className="w-4 h-4 rounded bg-orange-100 text-orange-700 flex items-center justify-center">
              <AlertTriangle className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-[15px] font-black text-slate-900 tracking-tight">
              {incidentCounters.total}
            </span>
            <span className="text-[7.5px] text-orange-800 font-bold">
              ({incidentCounters.abertos + incidentCounters.emTratamento} ativos)
            </span>
          </div>
          <div className="flex items-center gap-1 text-[7px] text-slate-500 mt-1">
            <span className="text-red-700 font-bold">{incidentCounters.criticos} críticos</span>
            <span>·</span>
            <span className="text-amber-700 font-bold">{incidentCounters.moderados} mod</span>
          </div>
        </div>

        {/* KPI 5: Dias Sem Acidentes com Afastamento (Safe Workdays) */}
        <div className="bg-white p-2 rounded-md border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-tight">Zero Acidentes</span>
            <div className="w-4 h-4 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Award className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-[15px] font-black text-emerald-800 tracking-tight font-mono">
              {incidentCounters.diasSemAcidentes}
            </span>
            <span className="text-[7.5px] text-emerald-700 font-bold">dias seguidos</span>
          </div>
          <span className="text-[7px] text-slate-400 mt-1 block truncate">
            Meta Canteiro Seguro: &gt;180 dias
          </span>
        </div>

        {/* KPI 6: Vistorias & Auditorias Realizadas */}
        <div 
          onClick={() => onNavigate && onNavigate('vistorias')}
          className="bg-white p-2 rounded-md border border-slate-200/80 shadow-2xs hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-tight">Vistorias Técnicas</span>
            <div className="w-4 h-4 rounded bg-blue-100 text-blue-700 flex items-center justify-center">
              <Activity className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-[15px] font-black text-blue-800 tracking-tight">
              {vistorias.length}
            </span>
            <span className="text-[7.5px] text-blue-700 font-medium">laudos emitidos</span>
          </div>
          <span className="text-[7px] text-emerald-700 font-semibold mt-1 block truncate">
            {incidentCounters.taxaResolucao}% apontamentos resolvidos
          </span>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. SUB-NAVIGATION TABS                                                    */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100/80 border-b border-slate-200 text-[8px] overflow-x-auto">
        <div className="flex items-center gap-1">
          <button
            id="tab-safety-geral"
            onClick={() => setActiveTab('geral')}
            className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'geral' 
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-300' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <PieChartIcon className="w-2.5 h-2.5 text-slate-600" />
            <span>Visão Integrada & Gráficos</span>
          </button>

          <button
            id="tab-safety-documentos"
            onClick={() => setActiveTab('documentos')}
            className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'documentos' 
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-300' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileCheck className="w-2.5 h-2.5 text-slate-600" />
            <span>Status Documental ({docMetrics.total})</span>
            {docMetrics.criticos > 0 && (
              <span className="px-1 py-0.2 rounded-full bg-red-600 text-white text-[6.5px] font-mono font-bold">
                {docMetrics.criticos}
              </span>
            )}
          </button>

          <button
            id="tab-safety-incidentes"
            onClick={() => setActiveTab('incidentes')}
            className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'incidentes' 
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-300' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
            <span>Contador de Incidentes ({incidentCounters.total})</span>
            {incidentCounters.criticos > 0 && (
              <span className="px-1 py-0.2 rounded-full bg-red-600 text-white text-[6.5px] font-mono font-bold">
                {incidentCounters.criticos}
              </span>
            )}
          </button>

          <button
            id="tab-safety-normas"
            onClick={() => setActiveTab('normas')}
            className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'normas' 
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-300' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <BarChart3 className="w-2.5 h-2.5 text-slate-600" />
            <span>Matriz por Norma Regulamentadora (NR)</span>
          </button>
        </div>

        <div className="flex items-center gap-1 text-[7px] text-slate-500 shrink-0">
          <span className="hidden sm:inline">Auditoria em tempo real</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB CONTENTS & INTERACTIVE CHARTS                                      */}
      {/* ========================================================================= */}
      <div className="p-3">
        
        {/* ----------------------------------------------------------------------- */}
        {/* TAB 1: VISÃO GERAL INTEGRADA (GRÁFICO DONUT + BARRAS POR CANTEIRO)      */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === 'geral' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              
              {/* Donut Chart: Distribuição de Status de Documentos */}
              <div className="lg:col-span-5 bg-slate-50/70 p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-200/80">
                  <div className="flex items-center gap-1.5">
                    <PieChartIcon className="w-3.5 h-3.5 text-emerald-700" />
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-900">Status Geral de Documentos</h4>
                      <span className="text-[7px] text-slate-500">Proporção de conformidade, pendências e vencimentos</span>
                    </div>
                  </div>
                  <span className="text-[7.5px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-200">
                    {docMetrics.complianceRate}% Em Dia
                  </span>
                </div>

                {/* Donut Chart with Recharts */}
                <div className="h-44 w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={68}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={1.5} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const pct = Math.round((data.value / docMetrics.total) * 100);
                            return (
                              <div className="bg-slate-900 text-white p-1.5 rounded shadow-lg text-[8px] border border-slate-700">
                                <span className="font-bold block">{data.name}</span>
                                <span className="text-emerald-300 font-mono font-black">{data.value} documentos ({pct}%)</span>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Centered Donut Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[14px] font-black text-slate-900 leading-none">{docMetrics.total}</span>
                    <span className="text-[6.5px] text-slate-500 font-bold uppercase tracking-tight">Docs</span>
                  </div>
                </div>

                {/* Status Legend Pills */}
                <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-slate-200/80 text-[7.5px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                    <span className="text-slate-700 truncate">Aprovados: <strong>{docMetrics.aprovados}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-slate-700 truncate">Pendentes: <strong>{docMetrics.pendentes}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                    <span className="text-slate-700 truncate">Vencidos: <strong className="text-red-700">{docMetrics.vencidos}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-800 shrink-0" />
                    <span className="text-slate-700 truncate">Reprovados: <strong className="text-rose-800">{docMetrics.reprovados}</strong></span>
                  </div>
                </div>
              </div>

              {/* Bar Chart: Conformidade por Canteiro de Obras */}
              <div className="lg:col-span-7 bg-slate-50/70 p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-200/80">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-700" />
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-900">Conformidade Documental por Canteiro</h4>
                      <span className="text-[7px] text-slate-500">Comparativo de documentos válidos, pendentes e vencidos</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('normas')}
                    className="text-[7.5px] text-blue-800 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Ver por Norma</span>
                    <ChevronRight className="w-2 h-2" />
                  </button>
                </div>

                {/* Stacked / Grouped Bar Chart */}
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={docsByObraData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis 
                        dataKey="obraNome" 
                        tick={{ fontSize: 8, fill: '#475569', fontWeight: 600 }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 8, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white p-2 rounded-lg shadow-xl border border-slate-700 text-[8px] min-w-[150px]">
                                <span className="font-bold text-[9px] text-white block mb-1">{data.nomeCompleto}</span>
                                <div className="space-y-0.5 font-mono">
                                  <div className="flex justify-between text-emerald-400">
                                    <span>Aprovados:</span>
                                    <strong>{data.aprovados}</strong>
                                  </div>
                                  <div className="flex justify-between text-amber-400">
                                    <span>Pendentes:</span>
                                    <strong>{data.pendentes}</strong>
                                  </div>
                                  <div className="flex justify-between text-red-400">
                                    <span>Vencidos/Reprovados:</span>
                                    <strong>{data.vencidos}</strong>
                                  </div>
                                  <div className="pt-1 mt-1 border-t border-slate-700 flex justify-between font-bold text-white">
                                    <span>Conformidade:</span>
                                    <span>{data.taxaConformidade}%</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="aprovados" name="Aprovados" fill="#059669" radius={[2, 2, 0, 0]} stackId="a" />
                      <Bar dataKey="pendentes" name="Pendentes" fill="#d97706" radius={[2, 2, 0, 0]} stackId="a" />
                      <Bar dataKey="vencidos" name="Vencidos/Reprovados" fill="#dc2626" radius={[2, 2, 0, 0]} stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Micro Canteiro Cards Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1.5 border-t border-slate-200/80 text-[7px]">
                  {docsByObraData.map(item => (
                    <div key={item.obraId} className="bg-white p-1 rounded border border-slate-200 flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 truncate block">{item.obraNome}</span>
                        <span className="text-[6.5px] text-slate-500">{item.aprovados}/{item.total} docs válidos</span>
                      </div>
                      <span className={`px-1 py-0.2 rounded font-mono font-bold text-[7.5px] ${
                        item.taxaConformidade >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.taxaConformidade}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Quick Incidents Feed Strip */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  <h4 className="text-[10px] font-bold text-slate-900">
                    Apontamentos & Incidentes em Destaque nas Vistorias ({incidentCounters.total})
                  </h4>
                </div>
                <button
                  onClick={() => setActiveTab('incidentes')}
                  className="text-[7.5px] text-red-800 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Ver Todos os Incidentes</span>
                  <ChevronRight className="w-2 h-2" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {incidentesList.slice(0, 3).map(inc => {
                  const sev = SEVERITY_COLORS[inc.severidade];
                  return (
                    <div 
                      key={inc.id}
                      className={`p-2 rounded border transition-all ${
                        inc.severidade === 'critica' ? 'bg-red-50/80 border-red-200' :
                        inc.severidade === 'moderada' ? 'bg-amber-50/80 border-amber-200' :
                        'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[6.5px] px-1 py-0.2 rounded font-bold uppercase ${sev.bg} ${sev.text} border ${sev.border}`}>
                          {sev.label}
                        </span>
                        <span className={`text-[6.5px] font-bold px-1 py-0.2 rounded ${
                          inc.status === 'resolvido' ? 'bg-emerald-100 text-emerald-800' :
                          inc.status === 'em_tratamento' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {inc.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h5 className="font-bold text-[9px] text-slate-900 leading-tight mb-0.5 line-clamp-1">
                        {inc.titulo}
                      </h5>
                      <p className="text-[7.5px] text-slate-600 line-clamp-2 leading-relaxed mb-1">
                        {inc.descricao}
                      </p>
                      <div className="flex items-center justify-between text-[6.5px] text-slate-500 pt-1 border-t border-slate-200/60 font-medium">
                        <span className="truncate max-w-[65%]">{inc.obraNome}</span>
                        <span className="font-mono">{inc.data}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 2: DETALHAMENTO DE DOCUMENTOS (PENDENTES / VENCIDOS / APROVADOS)      */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === 'documentos' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-2 rounded border border-slate-200 text-[8px]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Filtrar Documentos por Status:</span>
                <span className="text-slate-500">Exibindo registros da base de colaboradores</span>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('documentos')}
                className="px-2 py-1 bg-purple-800 hover:bg-purple-900 text-white rounded font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <FileCheck className="w-2.5 h-2.5" />
                <span>Central de Validação e Upload</span>
              </button>
            </div>

            {/* Documentos Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-[8px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-1.5">Colaborador / Matrícula</th>
                    <th className="p-1.5">Obra / Canteiro</th>
                    <th className="p-1.5">Tipo de Norma / Documento</th>
                    <th className="p-1.5">Validade</th>
                    <th className="p-1.5 text-center">Status</th>
                    <th className="p-1.5">Observações / Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.map((doc) => {
                    const isVencido = doc.status === 'vencido' || doc.status === 'reprovado';
                    const isPendente = doc.status === 'pendente';
                    return (
                      <tr 
                        key={doc.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isVencido ? 'bg-red-50/40' : isPendente ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        <td className="p-1.5 font-bold text-slate-900">
                          <div>{doc.colaborador_nome || 'Colaborador Sem Nome'}</div>
                          <span className="text-[6.5px] text-slate-500 font-mono">{doc.colaborador_matricula || 'MAT-000'}</span>
                        </td>
                        <td className="p-1.5 text-slate-700 font-medium">{doc.obra_nome || '-'}</td>
                        <td className="p-1.5">
                          <span className="font-semibold text-slate-800 block">{doc.nome_documento}</span>
                          <span className="text-[6.5px] text-slate-500 uppercase font-mono">{TIPO_DOC_NOMES[doc.tipo_documento] || doc.tipo_documento}</span>
                        </td>
                        <td className="p-1.5 font-mono">
                          <span className={isVencido ? 'text-red-700 font-black' : 'text-slate-700 font-medium'}>
                            {doc.data_validade || 'Indeterminada'}
                          </span>
                        </td>
                        <td className="p-1.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase inline-block ${
                            doc.status === 'aprovado' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            doc.status === 'pendente' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            'bg-red-100 text-red-800 border border-red-300'
                          }`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="p-1.5 text-slate-600 max-w-xs truncate">
                          {doc.motivo_reprovacao || doc.observacao || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 3: CONTADOR E LISTA COMPLETA DE INCIDENTES DAS VISTORIAS            */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === 'incidentes' && (
          <div className="space-y-3">
            {/* Filter Pills for Incidents */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-2 rounded border border-slate-200 text-[8px]">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-700 mr-1">Status do Incidente:</span>
                {(['all', 'aberto', 'em_tratamento', 'resolvido'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setIncidentStatusFilter(st)}
                    className={`px-2 py-0.5 rounded text-[7.5px] font-bold cursor-pointer transition-all ${
                      incidentStatusFilter === st 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st === 'all' ? `Todos (${incidentesList.length})` :
                     st === 'aberto' ? `Abertos (${incidentCounters.abertos})` :
                     st === 'em_tratamento' ? `Em Tratamento (${incidentCounters.emTratamento})` :
                     `Resolvidos (${incidentCounters.resolvidos})`}
                  </button>
                ))}
              </div>

              {onOpenNovaVistoria && (
                <button
                  onClick={onOpenNovaVistoria}
                  className="px-2 py-1 bg-red-700 hover:bg-red-600 text-white rounded font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>Registrar Novo Apontamento</span>
                </button>
              )}
            </div>

            {/* Incident Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredIncidentes.map(inc => {
                const sev = SEVERITY_COLORS[inc.severidade];
                return (
                  <div 
                    key={inc.id}
                    className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-400 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${sev.dot} animate-pulse`} />
                          <span className={`text-[7px] px-1.5 py-0.2 rounded font-extrabold uppercase ${sev.bg} ${sev.text} border ${sev.border}`}>
                            Severidade {sev.label}
                          </span>
                          <span className="text-[7px] text-slate-500 font-semibold">{inc.tipo}</span>
                        </div>
                        <span className={`text-[7px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          inc.status === 'resolvido' ? 'bg-emerald-100 text-emerald-800' :
                          inc.status === 'em_tratamento' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {inc.status.replace('_', ' ')}
                        </span>
                      </div>

                      <h4 className="font-bold text-[10.5px] text-slate-900 leading-snug mb-1">
                        {inc.titulo}
                      </h4>
                      <p className="text-[8px] text-slate-600 leading-relaxed mb-2">
                        {inc.descricao}
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[7.5px] text-slate-500">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-2.5 h-2.5 text-slate-400" />
                        <span className="font-semibold text-slate-800">{inc.obraNome}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span>Resp: <strong className="text-slate-700">{inc.responsavel}</strong></span>
                        <span>{inc.data}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 4: MATRIZ POR NORMAS REGULAMENTADORAS (NR-35, NR-10, NR-12, ASO)   */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === 'normas' && (
          <div className="space-y-3">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-200">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-900">Distribuição por Norma Regulamentadora (NR)</h4>
                  <span className="text-[7px] text-slate-500">Volume de documentos e percentual de conformidade por requisito legal</span>
                </div>
                <span className="text-[7.5px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-300">
                  Normas Técnicas Ativas
                </span>
              </div>

              {/* Bar Chart by Category */}
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={docsByCategoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 8, fill: '#475569', fontWeight: 600 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 8, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const pct = data.total > 0 ? Math.round((data.aprovados / data.total) * 100) : 100;
                          return (
                            <div className="bg-slate-900 text-white p-2 rounded shadow-lg text-[8px] border border-slate-700 min-w-[140px]">
                              <span className="font-bold text-[9px] text-white block mb-0.5">{data.name}</span>
                              <div className="space-y-0.5 font-mono">
                                <div className="text-emerald-400 flex justify-between">
                                  <span>Aprovados:</span> <strong>{data.aprovados}</strong>
                                </div>
                                <div className="text-amber-400 flex justify-between">
                                  <span>Pendentes:</span> <strong>{data.pendentes}</strong>
                                </div>
                                <div className="text-red-400 flex justify-between">
                                  <span>Vencidos:</span> <strong>{data.vencidos}</strong>
                                </div>
                                <div className="pt-0.5 mt-0.5 border-t border-slate-700 font-bold flex justify-between">
                                  <span>Taxa Conformidade:</span> <span>{pct}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="aprovados" name="Aprovados" fill="#059669" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="pendentes" name="Pendentes" fill="#d97706" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="vencidos" name="Vencidos/Reprovados" fill="#dc2626" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Norms Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-200 text-[8px]">
                {docsByCategoryData.map((cat, i) => {
                  const pct = cat.total > 0 ? Math.round((cat.aprovados / cat.total) * 100) : 100;
                  return (
                    <div key={i} className="bg-white p-1.5 rounded border border-slate-200 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 truncate">{cat.name}</span>
                        <span className={`font-mono font-bold text-[7px] ${pct >= 90 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden my-1">
                        <div 
                          className={`h-full rounded-full ${pct >= 90 ? 'bg-emerald-600' : 'bg-amber-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[6.5px] text-slate-500">
                        <span>{cat.aprovados} ok · {cat.pendentes} pend</span>
                        <span className="text-red-700 font-bold">{cat.vencidos} venc</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 5. FOOTER PROTOCOL INFO                                                  */}
      {/* ========================================================================= */}
      <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[7px] text-slate-500 gap-1">
        <div className="flex items-center gap-1.5">
          <HardHat className="w-2.5 h-2.5 text-slate-400" />
          <span>Diretoria de Engenharia & Segurança Ocupacional (SST) · Auditoria em conformidade com as Portarias MTP/NR</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Última sincronização: <strong>Hoje, 16:30</strong></span>
          <span className="text-emerald-700 font-bold bg-emerald-100 px-1 py-0.2 rounded border border-emerald-200">
            Conformidade Ativa
          </span>
        </div>
      </div>

    </div>
  );
};
