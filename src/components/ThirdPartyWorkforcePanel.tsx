import React, { useState, useMemo } from 'react';
import {
  Users,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  ShieldAlert,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Mail,
  Send,
  UserX,
  UserCheck,
  Briefcase,
  AlertCircle,
  FileCheck,
  Plus,
  RefreshCw,
  Info,
  Phone,
  Calendar,
  X,
  Check,
  Lock,
  Unlock,
  Printer
} from 'lucide-react';
import {
  Obra,
  Colaborador,
  DocumentoColaborador,
  ContratoSubempreiteira,
  DocumentoSubempreiteira
} from '../types/erp';

interface ThirdPartyWorkforcePanelProps {
  obras: Obra[];
  colaboradores: Colaborador[];
  documentos: DocumentoColaborador[];
  contratos?: ContratoSubempreiteira[];
  onNavigate?: (tab: string, subTab?: string) => void;
  onSendNotification?: (notif: { titulo: string; mensagem: string; obra_id?: number; obra_nome?: string }) => void;
  onUpdateContrato?: (contrato: ContratoSubempreiteira) => void;
}

export const ThirdPartyWorkforcePanel: React.FC<ThirdPartyWorkforcePanelProps> = ({
  obras,
  colaboradores,
  documentos,
  contratos = [],
  onNavigate,
  onSendNotification,
  onUpdateContrato
}) => {
  // Navigation tabs inside the widget
  const [activeTab, setActiveTab] = useState<'visao_obras' | 'matriz_contratos' | 'colaboradores_terceiros'>('visao_obras');
  
  // Filters
  const [selectedObraId, setSelectedObraId] = useState<number | 'todas'>('todas');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendentes' | 'bloqueados' | 'homologados'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal & Selection States
  const [selectedContratoModal, setSelectedContratoModal] = useState<ContratoSubempreiteira | null>(null);
  const [notificationSuccessMsg, setNotificationSuccessMsg] = useState<string | null>(null);
  const [isAddingDocModal, setIsAddingDocModal] = useState(false);
  const [newDocType, setNewDocType] = useState<DocumentoSubempreiteira['tipo']>('pgr');
  const [newDocName, setNewDocName] = useState('');
  const [newDocValidity, setNewDocValidity] = useState('');

  // 1. Process Collaborators & Workforce Distribution
  const workforceStats = useMemo(() => {
    const totalGeral = colaboradores.filter(c => c.status === 'ativo').length;
    const proprios = colaboradores.filter(c => c.status === 'ativo' && c.tipo === 'proprio');
    const terceiros = colaboradores.filter(c => c.status === 'ativo' && c.tipo === 'terceiro');
    
    const totalProprios = proprios.length;
    const totalTerceiros = terceiros.length;
    const percentTerceiros = totalGeral > 0 ? Math.round((totalTerceiros / totalGeral) * 100) : 0;

    // By Project Breakdown
    const porObra = obras.map(obra => {
      const colabsObra = colaboradores.filter(c => c.obra_id === obra.id && c.status === 'ativo');
      const propObra = colabsObra.filter(c => c.tipo === 'proprio');
      const tercObra = colabsObra.filter(c => c.tipo === 'terceiro');
      
      const contratosObra = contratos.filter(ctr => ctr.obra_id === obra.id);
      const contratosComPendencia = contratosObra.filter(ctr => ctr.status_homologacao_sst !== 'homologado');
      
      // Third-party subcontracts and their specific headcounts
      const empresasNoCanteiro: string[] = Array.from(new Set(tercObra.map(c => (c.empresa_terceiro || c.empresa_terceira || 'Não especificada') as string)));
      
      const empresasBreakdown = empresasNoCanteiro.map(empresaNome => {
        const trabalhadores = tercObra.filter(c => (c.empresa_terceiro || c.empresa_terceira) === empresaNome);
        const contratoVinculado = contratosObra.find(c => 
          c.empresa_nome_fantasia.toLowerCase().includes(String(empresaNome).toLowerCase()) || 
          String(empresaNome).toLowerCase().includes(c.empresa_nome_fantasia.toLowerCase())
        );

        // Check workers SST docs
        const trabIds = trabalhadores.map(t => t.id);
        const docsTrab = documentos.filter(d => trabIds.includes(d.colaborador_id));
        const docsVencidos = docsTrab.filter(d => d.status === 'vencido');
        const docsPendentes = docsTrab.filter(d => d.status === 'pendente');

        return {
          empresaNome,
          totalTrabalhadores: trabalhadores.length,
          contrato: contratoVinculado,
          statusSST: contratoVinculado ? contratoVinculado.status_homologacao_sst : (docsVencidos.length > 0 ? 'irregular_bloqueado' : 'homologado'),
          docsVencidosCount: docsVencidos.length,
          docsPendentesCount: docsPendentes.length,
          trabalhadores
        };
      });

      return {
        obra,
        totalGeral: colabsObra.length,
        propriosCount: propObra.length,
        terceirosCount: tercObra.length,
        percentTerceiros: colabsObra.length > 0 ? Math.round((tercObra.length / colabsObra.length) * 100) : 0,
        contratosCount: contratosObra.length,
        contratosComPendenciaCount: contratosComPendencia.length,
        empresasBreakdown
      };
    });

    return {
      totalGeral,
      totalProprios,
      totalTerceiros,
      percentTerceiros,
      porObra
    };
  }, [colaboradores, obras, contratos, documentos]);

  // 2. Process Contracts SST Compliance & Alerts
  const contractsAnalytics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const processed = contratos.map(contrato => {
      // Find all workers of this subempreiteira
      const trabalhadores = colaboradores.filter(c => 
        c.tipo === 'terceiro' && 
        c.obra_id === contrato.obra_id &&
        ((c.empresa_terceiro && c.empresa_terceiro.toLowerCase().includes(contrato.empresa_nome_fantasia.toLowerCase())) ||
         (c.empresa_terceiro && contrato.empresa_razao_social.toLowerCase().includes(c.empresa_terceiro.toLowerCase())))
      );

      // Check institutional documents
      const docsInstitucionais = contrato.documentos_sst || [];
      const docsVencidos = docsInstitucionais.filter(d => {
        if (d.status === 'vencido') return true;
        if (d.data_validade) {
          const valDate = new Date(d.data_validade);
          return valDate < today;
        }
        return false;
      });

      const docsAVencer30d = docsInstitucionais.filter(d => {
        if (d.status === 'pendente') return true;
        if (d.data_validade) {
          const valDate = new Date(d.data_validade);
          const diffDays = Math.ceil((valDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 30;
        }
        return false;
      });

      // Check individual workers SST
      const trabIds = trabalhadores.map(t => t.id);
      const docsTrab = documentos.filter(d => trabIds.includes(d.colaborador_id));
      const trabDocsVencidos = docsTrab.filter(d => d.status === 'vencido');
      const trabDocsPendentes = docsTrab.filter(d => d.status === 'pendente');

      // Workers blocked if they have expired ASO or NRs
      const trabsBloqueados = trabalhadores.filter(t => {
        const d = docsTrab.filter(doc => doc.colaborador_id === t.id);
        return d.some(doc => doc.status === 'vencido');
      });

      // Overall health status determination
      let statusCalculado: 'homologado' | 'pendente_renovacao' | 'irregular_bloqueado' = 'homologado';
      if (docsVencidos.length > 0 || trabDocsVencidos.length > 0 || contrato.status_homologacao_sst === 'irregular_bloqueado') {
        statusCalculado = 'irregular_bloqueado';
      } else if (docsAVencer30d.length > 0 || trabDocsPendentes.length > 0 || contrato.status_homologacao_sst === 'pendente_renovacao') {
        statusCalculado = 'pendente_renovacao';
      }

      return {
        ...contrato,
        statusCalculado,
        trabalhadoresCount: trabalhadores.length,
        trabalhadores,
        docsInstitucionais,
        docsVencidos,
        docsAVencer30d,
        trabDocsVencidos,
        trabDocsPendentes,
        trabsBloqueados
      };
    });

    // High level counters
    const totalContratos = processed.length;
    const contratosHomologados = processed.filter(c => c.statusCalculado === 'homologado').length;
    const contratosPendentes = processed.filter(c => c.statusCalculado === 'pendente_renovacao').length;
    const contratosBloqueados = processed.filter(c => c.statusCalculado === 'irregular_bloqueado').length;
    const totalTrabalhadoresBloqueados = processed.reduce((acc, c) => acc + c.trabsBloqueados.length, 0);

    const indiceHomologacao = totalContratos > 0 
      ? Math.round((contratosHomologados / totalContratos) * 100) 
      : 100;

    return {
      contratos: processed,
      totalContratos,
      contratosHomologados,
      contratosPendentes,
      contratosBloqueados,
      totalTrabalhadoresBloqueados,
      indiceHomologacao
    };
  }, [contratos, colaboradores, documentos]);

  // 3. Process Individual Third-Party Workers List
  const thirdPartyWorkersList = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return colaboradores
      .filter(c => c.tipo === 'terceiro' && c.status === 'ativo')
      .map(colab => {
        const docs = documentos.filter(d => d.colaborador_id === colab.id);
        const asoDoc = docs.find(d => d.tipo_documento === 'aso');
        const nrDocs = docs.filter(d => ['nr35', 'nr10', 'nr12', 'nr18', 'nr33'].includes(d.tipo_documento));
        const epiDoc = docs.find(d => d.tipo_documento === 'epi');
        const integracaoDoc = docs.find(d => d.tipo_documento === 'integracao' || d.tipo_documento === 'ordem_servico');

        const hasVencido = docs.some(d => d.status === 'vencido');
        const hasPendente = docs.some(d => d.status === 'pendente');

        let statusAcesso: 'liberado' | 'alerta_renovacao' | 'bloqueado' = 'liberado';
        if (hasVencido) {
          statusAcesso = 'bloqueado';
        } else if (hasPendente || !asoDoc || !epiDoc) {
          statusAcesso = 'alerta_renovacao';
        }

        return {
          colab,
          docs,
          asoDoc,
          nrDocs,
          epiDoc,
          integracaoDoc,
          hasVencido,
          hasPendente,
          statusAcesso
        };
      });
  }, [colaboradores, documentos]);

  // 4. Filtered Contracts for Matrix View
  const filteredContracts = useMemo(() => {
    return contractsAnalytics.contratos.filter(contrato => {
      // Obra filter
      if (selectedObraId !== 'todas' && contrato.obra_id !== selectedObraId) {
        return false;
      }

      // Status filter
      if (statusFilter === 'pendentes' && contrato.statusCalculado !== 'pendente_renovacao') {
        return false;
      }
      if (statusFilter === 'bloqueados' && contrato.statusCalculado !== 'irregular_bloqueado') {
        return false;
      }
      if (statusFilter === 'homologados' && contrato.statusCalculado !== 'homologado') {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = contrato.empresa_nome_fantasia.toLowerCase().includes(q) || contrato.empresa_razao_social.toLowerCase().includes(q);
        const matchCnpj = contrato.cnpj.includes(q);
        const matchCode = contrato.codigo_contrato.toLowerCase().includes(q);
        const matchSpec = contrato.especialidade.toLowerCase().includes(q);
        const matchObra = contrato.obra_nome.toLowerCase().includes(q);
        return matchName || matchCnpj || matchCode || matchSpec || matchObra;
      }

      return true;
    });
  }, [contractsAnalytics.contratos, selectedObraId, statusFilter, searchQuery]);

  // 5. Filtered Workers for Worker View
  const filteredWorkers = useMemo(() => {
    return thirdPartyWorkersList.filter(item => {
      if (selectedObraId !== 'todas' && item.colab.obra_id !== selectedObraId) {
        return false;
      }

      if (statusFilter === 'bloqueados' && item.statusAcesso !== 'bloqueado') {
        return false;
      }
      if (statusFilter === 'pendentes' && item.statusAcesso !== 'alerta_renovacao') {
        return false;
      }
      if (statusFilter === 'homologados' && item.statusAcesso !== 'liberado') {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.colab.nome.toLowerCase().includes(q);
        const matchMatricula = item.colab.matricula.toLowerCase().includes(q);
        const matchCargo = item.colab.cargo.toLowerCase().includes(q);
        const matchEmpresa = (item.colab.empresa_terceiro || '').toLowerCase().includes(q);
        return matchName || matchMatricula || matchCargo || matchEmpresa;
      }

      return true;
    });
  }, [thirdPartyWorkersList, selectedObraId, statusFilter, searchQuery]);

  // Action: Send Notification to Contractor
  const handleSendContractorAlert = (contrato: typeof contractsAnalytics.contratos[0]) => {
    const pendenciasTxt = [
      ...contrato.docsVencidos.map(d => `• Doc Institucional Vencido: ${d.nome_documento}`),
      ...contrato.docsAVencer30d.map(d => `• Doc Institucional a Renovar: ${d.nome_documento}`),
      ...contrato.trabDocsVencidos.map(d => `• SST do Trabalhador Vencido: ${d.colaborador_nome} (${d.nome_documento})`)
    ].join('\n');

    const notif = {
      titulo: `[URGENTE SST] Regularização Documental - ${contrato.empresa_nome_fantasia}`,
      mensagem: `Cobrança formal de renovação de SST para o contrato ${contrato.codigo_contrato} (${contrato.obra_nome}).\n\nItens Pendentes:\n${pendenciasTxt || '• Documentos anuais pendentes de validação'}\n\nContato enviado para: ${contrato.email} (${contrato.contato_responsavel}).`,
      obra_id: contrato.obra_id,
      obra_nome: contrato.obra_nome
    };

    if (onSendNotification) {
      onSendNotification(notif);
    }

    setNotificationSuccessMsg(`Notificação de cobrança de SST enviada com sucesso para ${contrato.empresa_nome_fantasia}!`);
    setTimeout(() => setNotificationSuccessMsg(null), 4000);
  };

  // Helper format currency
  const formatCurrency = (val?: number) => {
    if (!val) return 'R$ 0,00';
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div id="painel-mao-de-obra-terceirizada" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* ========================================================================= */}
      {/* HEADER PRINCIPAL                                                         */}
      {/* ========================================================================= */}
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-amber-500/20 border border-amber-400/30 rounded-xl text-amber-400 mt-1">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Monitoramento de Mão de Obra Terceirizada & Subempreiteiras
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  NR-01 &bull; PGR Subcontratadas &bull; NR-18
                </span>
                {contractsAnalytics.contratosBloqueados > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/30 text-rose-300 border border-rose-400/40 flex items-center gap-1 animate-pulse">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {contractsAnalytics.contratosBloqueados} {contractsAnalytics.contratosBloqueados === 1 ? 'Contrato Crítico' : 'Contratos Críticos'}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Acompanhamento volumétrico do efetivo terceirizado por canteiro de obras, conformidade dos contratos de prestação de serviços e auditoria contínua de documentação legal de SST (PGR, PCMSO, ART, ASO e NRs).
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onNavigate && onNavigate('rh', 'colaboradores')}
              className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/20 transition-colors flex items-center gap-1.5"
            >
              <Users className="w-4 h-4 text-indigo-300" />
              Gestão RH / Colaboradores
            </button>
            <button
              onClick={() => onNavigate && onNavigate('seguranca')}
              className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <FileCheck className="w-4 h-4" />
              Auditoria SST Geral
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* KPI CARDS BAR                                                            */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
          {/* Card 1: Total Terceiros */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3.5 border border-white/10">
            <div className="flex items-center justify-between text-slate-300 text-xs mb-1">
              <span>Efetivo Terceirizado</span>
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{workforceStats.totalTerceiros}</span>
              <span className="text-xs text-slate-300">
                ({workforceStats.percentTerceiros}% do efetivo)
              </span>
            </div>
            <div className="w-full bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${workforceStats.percentTerceiros}%` }}
              />
            </div>
          </div>

          {/* Card 2: Contratos Ativos */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3.5 border border-white/10">
            <div className="flex items-center justify-between text-slate-300 text-xs mb-1">
              <span>Subempreiteiras</span>
              <Building2 className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{contractsAnalytics.totalContratos}</span>
              <span className="text-xs text-sky-300">contratos ativos</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Distribuição em {workforceStats.porObra.length} canteiros
            </p>
          </div>

          {/* Card 3: Homologados 100% */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3.5 border border-white/10">
            <div className="flex items-center justify-between text-slate-300 text-xs mb-1">
              <span>Homologados (SST OK)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-300">{contractsAnalytics.contratosHomologados}</span>
              <span className="text-xs text-slate-300">({contractsAnalytics.indiceHomologacao}%)</span>
            </div>
            <p className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
              <Check className="w-3 h-3" />
              PGR & PCMSO em dia
            </p>
          </div>

          {/* Card 4: Pendentes de Renovação */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3.5 border border-white/10">
            <div className="flex items-center justify-between text-slate-300 text-xs mb-1">
              <span>Pendente Renovação</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-300">{contractsAnalytics.contratosPendentes}</span>
              <span className="text-xs text-amber-200">a vencer em 30d</span>
            </div>
            <p className="text-[11px] text-amber-300/90 mt-2">
              Cobrança preventiva requerida
            </p>
          </div>

          {/* Card 5: Irregulares / Bloqueados */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3.5 border border-white/10">
            <div className="flex items-center justify-between text-slate-300 text-xs mb-1">
              <span>Contratos Irregulares</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-300">{contractsAnalytics.contratosBloqueados}</span>
              <span className="text-xs text-rose-200">
                ({contractsAnalytics.totalTrabalhadoresBloqueados} trab. bloq.)
              </span>
            </div>
            <p className="text-[11px] text-rose-300/90 mt-2 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Risco trabalhista / embargo
            </p>
          </div>
        </div>
      </div>

      {/* Success Alert Toast */}
      {notificationSuccessMsg && (
        <div className="bg-emerald-50 border-b border-emerald-200 p-3 px-6 flex items-center justify-between text-emerald-800 text-sm font-medium animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{notificationSuccessMsg}</span>
          </div>
          <button onClick={() => setNotificationSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NAVIGATION TABS & FILTER BAR                                             */}
      {/* ========================================================================= */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg">
          <button
            onClick={() => setActiveTab('visao_obras')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'visao_obras'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Volume por Obra
          </button>

          <button
            onClick={() => setActiveTab('matriz_contratos')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'matriz_contratos'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Contratos & Conformidade SST
            {contractsAnalytics.contratosBloqueados + contractsAnalytics.contratosPendentes > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-700 font-bold">
                {contractsAnalytics.contratosBloqueados + contractsAnalytics.contratosPendentes}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('colaboradores_terceiros')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'colaboradores_terceiros'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Prontuário de Trabalhadores ({workforceStats.totalTerceiros})
          </button>
        </div>

        {/* Global Filter Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Obra Filter */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedObraId}
              onChange={e => setSelectedObraId(e.target.value === 'todas' ? 'todas' : Number(e.target.value))}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="todas">Todas as Obras ({obras.length})</option>
              {obras.map(o => (
                <option key={o.id} value={o.id}>{o.nome}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="todos">Todos os Status</option>
              <option value="bloqueados">🚨 Irregulares / Vencidos</option>
              <option value="pendentes">⚠️ Pendentes de Renovação</option>
              <option value="homologados">✅ Homologados 100%</option>
            </select>
          </div>

          {/* Search Query */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar subempreiteira, CNPJ ou colaborador..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-52 lg:w-64"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: VISÃO GERAL DE VOLUME DE TERCEIROS POR OBRA                       */}
      {/* ========================================================================= */}
      {activeTab === 'visao_obras' && (
        <div className="p-6">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Distribuição Comparativa de Mão de Obra (Própria vs. Terceirizada)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Headcount ativo por canteiro de obras, relação percentual de terceirização e taxa de conformidade documental de SST.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-indigo-600 inline-block" />
                <span>Mão de Obra Própria</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
                <span>Mão de Obra Terceirizada</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {workforceStats.porObra
              .filter(item => selectedObraId === 'todas' || item.obra.id === selectedObraId)
              .map(item => {
                const totalCanteiro = item.totalGeral || 1;
                const propPercent = Math.round((item.propriosCount / totalCanteiro) * 100);
                const tercPercent = Math.round((item.terceirosCount / totalCanteiro) * 100);

                return (
                  <div
                    key={item.obra.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Obra Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
                              {item.obra.status.replace('_', ' ')}
                            </span>
                            {item.contratosComPendenciaCount > 0 ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {item.contratosComPendenciaCount} contrato(s) com alerta SST
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                100% Homologado
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-bold text-slate-900 mt-1.5">
                            {item.obra.nome}
                          </h4>
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {item.obra.endereco}
                          </p>
                        </div>
                      </div>

                      {/* Stacked Headcount Bar */}
                      <div className="bg-white p-3.5 rounded-lg border border-slate-200 mb-4">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                          <span>Total Efetivo: {item.totalGeral} colaboradores</span>
                          <span className="text-amber-600 font-bold">{tercPercent}% Terceirizado</span>
                        </div>

                        {/* Visual Bar */}
                        <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                          <div
                            className="bg-indigo-600 h-full transition-all"
                            style={{ width: `${propPercent}%` }}
                            title={`Próprios: ${item.propriosCount} (${propPercent}%)`}
                          />
                          <div
                            className="bg-amber-500 h-full transition-all"
                            style={{ width: `${tercPercent}%` }}
                            title={`Terceiros: ${item.terceirosCount} (${tercPercent}%)`}
                          />
                        </div>

                        {/* Headcount Breakdown Details */}
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                            <div>
                              <span className="text-slate-500 block text-[11px]">Próprios</span>
                              <strong className="text-slate-800">{item.propriosCount} colaboradores</strong>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <div>
                              <span className="text-slate-500 block text-[11px]">Terceirizados</span>
                              <strong className="text-slate-800">{item.terceirosCount} colaboradores</strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Subcontractor Breakdown Table */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
                          <span>Subempreiteiras Mobilizadas ({item.empresasBreakdown.length})</span>
                          <span>Efetivo / SST</span>
                        </div>

                        {item.empresasBreakdown.length === 0 ? (
                          <div className="text-center py-4 bg-white rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
                            Nenhuma subempreiteira alocada neste canteiro.
                          </div>
                        ) : (
                          item.empresasBreakdown.map((emp, idx) => {
                            const isBloqueado = emp.statusSST === 'irregular_bloqueado' || emp.docsVencidosCount > 0;
                            const isPendente = emp.statusSST === 'pendente_renovacao' || emp.docsPendentesCount > 0;

                            return (
                              <div
                                key={idx}
                                className={`p-2.5 rounded-lg border bg-white flex items-center justify-between gap-3 text-xs transition-colors ${
                                  isBloqueado
                                    ? 'border-rose-200 hover:border-rose-300'
                                    : isPendente
                                    ? 'border-amber-200 hover:border-amber-300'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-slate-800 truncate block">
                                      {emp.empresaNome}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-slate-500 truncate block">
                                    {emp.contrato ? emp.contrato.especialidade : 'Prestação de Serviços'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700 text-[11px]">
                                    {emp.totalTrabalhadores} {emp.totalTrabalhadores === 1 ? 'trab.' : 'trab.'}
                                  </span>

                                  {isBloqueado ? (
                                    <span
                                      className="px-2 py-0.5 rounded font-bold text-[10px] bg-rose-100 text-rose-700 flex items-center gap-1"
                                      title={`${emp.docsVencidosCount} documentos vencidos`}
                                    >
                                      <Lock className="w-3 h-3" />
                                      Bloqueado
                                    </span>
                                  ) : isPendente ? (
                                    <span
                                      className="px-2 py-0.5 rounded font-bold text-[10px] bg-amber-100 text-amber-800 flex items-center gap-1"
                                      title="Documentos a renovar em 30 dias"
                                    >
                                      <Clock className="w-3 h-3" />
                                      A Renovar
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                      <Check className="w-3 h-3" />
                                      OK
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Card Footer Button */}
                    <button
                      onClick={() => {
                        setSelectedObraId(item.obra.id);
                        setActiveTab('matriz_contratos');
                      }}
                      className="w-full mt-2 py-2 px-3 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Ver Contratos & SST Desta Obra</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MATRIZ DE CONTRATOS & CONFORMIDADE DOCUMENTAL SST                 */}
      {/* ========================================================================= */}
      {activeTab === 'matriz_contratos' && (
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Matriz de Homologação de Subempreiteiras & SST
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Controle de validade de programas legais de segurança (PGR, PCMSO, ARTs de máquinas e responsabilidade técnica) e conformidade da equipe de campo.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                Mostrando <strong>{filteredContracts.length}</strong> de {contractsAnalytics.totalContratos} contratos
              </span>
            </div>
          </div>

          {filteredContracts.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-700">Nenhum contrato encontrado para os filtros selecionados</h4>
              <p className="text-xs text-slate-500 mt-1">Tente ajustar o filtro de obra, status ou limpar o termo de busca.</p>
              <button
                onClick={() => {
                  setSelectedObraId('todas');
                  setStatusFilter('todos');
                  setSearchQuery('');
                }}
                className="mt-3 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredContracts.map(contrato => {
                const isBloqueado = contrato.statusCalculado === 'irregular_bloqueado';
                const isPendente = contrato.statusCalculado === 'pendente_renovacao';

                return (
                  <div
                    key={contrato.id}
                    className={`bg-white rounded-xl border transition-all p-5 shadow-sm hover:shadow ${
                      isBloqueado
                        ? 'border-rose-300 bg-rose-50/20 ring-1 ring-rose-200'
                        : isPendente
                        ? 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-200'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      {/* Left: Contract Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                          <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {contrato.codigo_contrato}
                          </span>

                          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {contrato.obra_nome}
                          </span>

                          {/* Status Badge */}
                          {isBloqueado ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                              Irregular / Acesso Bloqueado
                            </span>
                          ) : isPendente ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              Pendente de Renovação
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Homologado (SST Regular)
                            </span>
                          )}
                        </div>

                        <div className="flex items-baseline gap-2 flex-wrap">
                          <h4 className="text-base font-bold text-slate-900">
                            {contrato.empresa_nome_fantasia}
                          </h4>
                          <span className="text-xs text-slate-500 font-normal">
                            ({contrato.empresa_razao_social} &bull; CNPJ: {contrato.cnpj})
                          </span>
                        </div>

                        <p className="text-xs text-indigo-700 font-medium mt-1 flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5" />
                          Escopo: {contrato.especialidade}
                        </p>

                        {/* Contacts & Period Meta */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Gestor do Contrato</span>
                            <span className="font-medium text-slate-800">{contrato.gestor_contrato_nome}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Contato da Subempreiteira</span>
                            <span className="font-medium text-slate-800 flex items-center gap-1">
                              {contrato.contato_responsavel} ({contrato.telefone})
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Vigência Contratual</span>
                            <span className="font-medium text-slate-800">
                              {new Date(contrato.data_inicio).toLocaleDateString('pt-BR')} até {new Date(contrato.data_fim).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Workforce & Action Center */}
                      <div className="flex flex-row lg:flex-col items-end justify-between lg:justify-start gap-3 flex-shrink-0">
                        <div className="bg-slate-100/80 p-2.5 rounded-lg border border-slate-200 text-right min-w-[150px]">
                          <span className="text-[11px] text-slate-500 block">Efetivo Mobilizado</span>
                          <div className="flex items-center justify-end gap-1.5 mt-0.5">
                            <span className="text-lg font-black text-slate-900">{contrato.trabalhadoresCount}</span>
                            <span className="text-xs text-slate-600">trabalhador(es)</span>
                          </div>
                          {contrato.trabsBloqueados.length > 0 && (
                            <span className="text-[10px] font-bold text-rose-600 block mt-0.5">
                              ⚠️ {contrato.trabsBloqueados.length} com ASO/NR vencido
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedContratoModal(contrato)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-colors flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Auditar Documentos ({contrato.docsInstitucionais.length})
                          </button>

                          {(isBloqueado || isPendente) && (
                            <button
                              onClick={() => handleSendContractorAlert(contrato)}
                              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                              title="Disparar e-mail e alerta de cobrança formal de renovação"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Cobrar Renovação
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Institutional SST Documents Summary Pills */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                        Status dos Programas e Laudos Institucionais de Segurança (NR-01, NR-07, NR-18):
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                        {contrato.docsInstitucionais.map((doc, dIdx) => {
                          const isDocVencido = doc.status === 'vencido';
                          const isDocPendente = doc.status === 'pendente';

                          return (
                            <div
                              key={dIdx}
                              className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                                isDocVencido
                                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                                  : isDocPendente
                                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                                  : 'bg-slate-50 border-slate-200 text-slate-800'
                              }`}
                            >
                              <div className="min-w-0">
                                <span className="font-semibold block truncate uppercase text-[10px]">
                                  {doc.tipo.replace('_', ' ')}
                                </span>
                                <span className="text-[11px] truncate block text-slate-600">
                                  {doc.nome_documento}
                                </span>
                              </div>

                              <div className="flex-shrink-0 text-right">
                                {isDocVencido ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-800">
                                    Vencido
                                  </span>
                                ) : isDocPendente ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-800">
                                    A Renovar
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    Válido
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-500 block mt-0.5">
                                  Val: {new Date(doc.data_validade).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PRONTUÁRIO INDIVIDUAL DE TRABALHADORES TERCEIRIZADOS              */}
      {/* ========================================================================= */}
      {activeTab === 'colaboradores_terceiros' && (
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Prontuário Individual de Trabalhadores Terceirizados
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Controle individual de acesso físico ao canteiro com validação de ASO Ocupacional (NR-07), Treinamentos de NR e Ficha de Entrega de EPI (NR-06).
              </p>
            </div>

            <div className="text-xs text-slate-500">
              Total listado: <strong>{filteredWorkers.length}</strong> trabalhadores
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="p-3.5 pl-4">Colaborador / Função</th>
                  <th className="p-3.5">Subempreiteira / Canteiro</th>
                  <th className="p-3.5">ASO (NR-07)</th>
                  <th className="p-3.5">Treinamentos NR</th>
                  <th className="p-3.5">Ficha de EPI (NR-06)</th>
                  <th className="p-3.5 text-center">Status de Acesso</th>
                  <th className="p-3.5 pr-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      Nenhum trabalhador terceirizado atende aos filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((item, idx) => {
                    const isBloqueado = item.statusAcesso === 'bloqueado';
                    const isPendente = item.statusAcesso === 'alerta_renovacao';

                    return (
                      <tr
                        key={item.colab.id || idx}
                        className={`hover:bg-slate-50 transition-colors ${
                          isBloqueado ? 'bg-rose-50/30' : isPendente ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        {/* Colaborador Name & Role */}
                        <td className="p-3.5 pl-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.colab.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                              alt={item.colab.nome}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <strong className="text-slate-900 block font-semibold">
                                {item.colab.nome}
                              </strong>
                              <span className="text-[11px] text-slate-500 block">
                                {item.colab.cargo} &bull; Matrícula: {item.colab.matricula}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Subcontractor & Obra */}
                        <td className="p-3.5">
                          <strong className="text-slate-800 block">
                            {item.colab.empresa_terceiro || item.colab.empresa_terceira || 'Subempreiteira'}
                          </strong>
                          <span className="text-[11px] text-slate-500 block">
                            {item.colab.obra_nome}
                          </span>
                        </td>

                        {/* ASO NR-07 */}
                        <td className="p-3.5">
                          {item.asoDoc ? (
                            <div>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.asoDoc.status === 'aprovado'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : item.asoDoc.status === 'vencido'
                                    ? 'bg-rose-100 text-rose-800 font-black'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {item.asoDoc.status === 'aprovado' ? 'Apto' : item.asoDoc.status.toUpperCase()}
                              </span>
                              <span className="text-[10px] text-slate-500 block mt-0.5">
                                Val: {new Date(item.asoDoc.data_validade).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                              Não Anexado
                            </span>
                          )}
                        </td>

                        {/* Treinamentos NR */}
                        <td className="p-3.5">
                          {item.nrDocs.length > 0 ? (
                            <div className="space-y-1">
                              {item.nrDocs.map((nr, nrIdx) => (
                                <span
                                  key={nrIdx}
                                  className={`inline-block mr-1 px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                    nr.status === 'aprovado'
                                      ? 'bg-slate-100 text-slate-700'
                                      : nr.status === 'vencido'
                                      ? 'bg-rose-100 text-rose-700'
                                      : 'bg-amber-100 text-amber-700'
                                  }`}
                                  title={`${nr.nome_documento} (Val: ${nr.data_validade})`}
                                >
                                  {nr.tipo_documento.toUpperCase()}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Pendente de NRs</span>
                          )}
                        </td>

                        {/* Ficha EPI NR-06 */}
                        <td className="p-3.5">
                          {item.epiDoc ? (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.epiDoc.status === 'aprovado'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.epiDoc.status === 'vencido'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.epiDoc.status === 'aprovado' ? 'Assinada' : item.epiDoc.status.toUpperCase()}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Sem Ficha
                            </span>
                          )}
                        </td>

                        {/* Status de Acesso */}
                        <td className="p-3.5 text-center">
                          {isBloqueado ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                              <Lock className="w-3 h-3 text-rose-600" />
                              Catraca Bloqueada
                            </span>
                          ) : isPendente ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              Acesso em Alerta
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              Acesso Liberado
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="p-3.5 pr-4 text-right">
                          <button
                            onClick={() => onNavigate && onNavigate('rh', 'documentos')}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors"
                          >
                            Ver Prontuário
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AUDITORIA & GESTÃO DOCUMENTAL DO CONTRATO                          */}
      {/* ========================================================================= */}
      {selectedContratoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <FileText className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <span className="text-xs font-mono text-indigo-300 block">
                    {selectedContratoModal.codigo_contrato} &bull; {selectedContratoModal.obra_nome}
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    {selectedContratoModal.empresa_nome_fantasia}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedContratoModal(null);
                  setIsAddingDocModal(false);
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Contract General Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[11px]">Razão Social</span>
                  <strong className="font-semibold">{selectedContratoModal.empresa_razao_social}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">CNPJ</span>
                  <strong className="font-semibold">{selectedContratoModal.cnpj}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Contato Responsável</span>
                  <strong className="font-semibold">{selectedContratoModal.contato_responsavel}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Telefone / E-mail</span>
                  <strong className="font-semibold">{selectedContratoModal.telefone}</strong>
                </div>
              </div>

              {/* Institutional Documents List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Documentos Institucionais de Segurança (SESMT / NR)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      PGR, PCMSO, ARTs e Laudos Técnicos apresentados pela empresa subcontratada.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddingDocModal(!isAddingDocModal)}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Laudo / ART
                  </button>
                </div>

                {/* Adding Doc Mini Form */}
                {isAddingDocModal && (
                  <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl mb-4 animate-fadeIn space-y-3">
                    <h5 className="font-bold text-indigo-900 text-xs">Homologar Novo Documento Institucional</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tipo de Documento</label>
                        <select
                          value={newDocType}
                          onChange={e => setNewDocType(e.target.value as any)}
                          className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                        >
                          <option value="pgr">PGR (NR-01)</option>
                          <option value="pcmso">PCMSO (NR-07)</option>
                          <option value="art_rrt">ART / RRT (CREA/CAU)</option>
                          <option value="apolice_seguro">Apólice de Seguro</option>
                          <option value="ltcat">LTCAT Previdenciário</option>
                          <option value="cnd_inss">CND / FGTS</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nome / Descrição</label>
                        <input
                          type="text"
                          placeholder="Ex: Renovação PGR 2024"
                          value={newDocName}
                          onChange={e => setNewDocName(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Data de Validade</label>
                        <input
                          type="date"
                          value={newDocValidity}
                          onChange={e => setNewDocValidity(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setIsAddingDocModal(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-medium"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => {
                          if (!newDocName || !newDocValidity) return;
                          
                          const newDoc: DocumentoSubempreiteira = {
                            id: Date.now(),
                            contrato_id: selectedContratoModal.id,
                            tipo: newDocType,
                            nome_documento: newDocName,
                            data_emissao: new Date().toISOString().split('T')[0],
                            data_validade: newDocValidity,
                            status: 'aprovado'
                          };

                          const updatedDocs = [...(selectedContratoModal.documentos_sst || []), newDoc];
                          const updatedContrato = {
                            ...selectedContratoModal,
                            documentos_sst: updatedDocs,
                            status_homologacao_sst: 'homologado' as const
                          };

                          setSelectedContratoModal(updatedContrato);
                          if (onUpdateContrato) onUpdateContrato(updatedContrato);

                          setNewDocName('');
                          setNewDocValidity('');
                          setIsAddingDocModal(false);
                          setNotificationSuccessMsg('Documento homologado com sucesso!');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                      >
                        Salvar e Homologar
                      </button>
                    </div>
                  </div>
                )}

                {/* Documents Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="p-2.5 pl-3">Tipo / Descrição</th>
                        <th className="p-2.5">Emissão</th>
                        <th className="p-2.5">Validade</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5 pr-3 text-right">Arquivo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {(selectedContratoModal.documentos_sst || []).map((doc, idx) => (
                        <tr key={doc.id || idx}>
                          <td className="p-2.5 pl-3">
                            <strong className="text-slate-800 uppercase text-[10px] block font-mono text-indigo-700">
                              {doc.tipo}
                            </strong>
                            <span className="text-slate-700 font-medium">{doc.nome_documento}</span>
                            {doc.observacao && (
                              <p className="text-[10px] text-slate-500 mt-0.5">{doc.observacao}</p>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-600">
                            {new Date(doc.data_emissao).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="p-2.5 text-slate-800 font-medium">
                            {new Date(doc.data_validade).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                doc.status === 'aprovado'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : doc.status === 'vencido'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {doc.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-2.5 pr-3 text-right">
                            <button
                              onClick={() => window.open('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank')}
                              className="p-1.5 rounded hover:bg-slate-100 text-indigo-600 transition-colors inline-flex items-center gap-1 text-[11px]"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Ver PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Auditoria registrada pelo SESMT &bull; Vigente conforme NR-01 / NR-18
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedContratoModal(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
