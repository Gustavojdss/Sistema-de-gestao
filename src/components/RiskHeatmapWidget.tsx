import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  Eye, 
  Bell, 
  Check, 
  X, 
  AlertOctagon, 
  Zap, 
  Layers, 
  Activity, 
  Maximize2, 
  HardHat, 
  TrendingUp, 
  ChevronRight, 
  Info, 
  Sliders, 
  ShieldCheck,
  Send,
  HelpCircle
} from 'lucide-react';
import { Obra, Vistoria, DocumentoColaborador, Colaborador, IncidenteSeguranca } from '../types/erp';

interface RiskHeatmapWidgetProps {
  obras: Obra[];
  vistorias: Vistoria[];
  documentos?: DocumentoColaborador[];
  colaboradores?: Colaborador[];
  incidentes?: IncidenteSeguranca[];
  onNavigate?: (tab: string) => void;
  onOpenNovaVistoria?: () => void;
  onSendNotification?: (notif: { titulo: string; mensagem: string; obra_id?: number; obra_nome?: string }) => void;
  onAddIncidente?: (novoIncidente: IncidenteSeguranca) => void;
}

// Categorias de Vetor de Risco na Construção Civil
export interface VetorRiscoConfig {
  id: string;
  nome: string;
  sigla: string;
  nrReferencia: string;
  icone: any;
  corBase: string;
}

export interface ObraRiskScore {
  obra: Obra;
  scoreGlobal: number;
  classificacao: 'critico' | 'alto' | 'medio' | 'baixo';
  totalIncidentesAtivos: number;
  totalVistoriasNaoConformes: number;
  vetores: Record<string, {
    score: number;
    nivel: 'critico' | 'alto' | 'medio' | 'baixo' | 'seguro';
    incidentes: IncidenteSeguranca[];
    vistorias: Vistoria[];
    documentosPendentes: DocumentoColaborador[];
  }>;
}

const VETORES_RISCO: VetorRiscoConfig[] = [
  { id: 'trabalho_altura', nome: 'Trabalho em Altura & Fachadas', sigla: 'ALT', nrReferencia: 'NR-35 / NR-18', icone: Activity, corBase: 'red' },
  { id: 'eletrica', nome: 'Instalações & Painéis Elétricos', sigla: 'ELE', nrReferencia: 'NR-10', icone: Zap, corBase: 'amber' },
  { id: 'escavacao_estruturas', nome: 'Escavações & Estrutura/Lajes', sigla: 'EST', nrReferencia: 'NR-18 / NBR', icone: Layers, corBase: 'orange' },
  { id: 'maquinas_equipamentos', nome: 'Máquinas, Gruas & Andaimes', sigla: 'MAQ', nrReferencia: 'NR-12 / NR-18', icone: Sliders, corBase: 'purple' },
  { id: 'epi_epc', nome: 'EPCs & Fichas de EPI', sigla: 'EPI', nrReferencia: 'NR-06', icone: HardHat, corBase: 'blue' },
  { id: 'incendio', nome: 'PPCI & Proteção Contra Incêndio', sigla: 'INC', nrReferencia: 'CBMDF / NR-23', icone: Flame, corBase: 'rose' },
  { id: 'ergonomia_saude', nome: 'Saúde Ocupacional & ASO', sigla: 'SST', nrReferencia: 'NR-07 / NR-17', icone: ShieldCheck, corBase: 'emerald' }
];

export const RiskHeatmapWidget: React.FC<RiskHeatmapWidgetProps> = ({
  obras,
  vistorias,
  documentos = [],
  colaboradores = [],
  incidentes: initialIncidentes = [],
  onNavigate,
  onOpenNovaVistoria,
  onSendNotification,
  onAddIncidente
}) => {
  // Local incidents state to allow dynamic addition and status updates
  const [incidentesList, setIncidentesList] = useState<IncidenteSeguranca[]>(initialIncidentes);
  
  // Sync if props update
  React.useEffect(() => {
    if (initialIncidentes && initialIncidentes.length > 0) {
      setIncidentesList(initialIncidentes);
    }
  }, [initialIncidentes]);

  // View mode: 'heatmap_grade' (Canteiros x Vetores) or 'matriz_5x5' (Probabilidade x Impacto)
  const [viewMode, setViewMode] = useState<'heatmap_grade' | 'matriz_5x5' | 'lista_ocorrencias'>('heatmap_grade');
  
  // Filters
  const [selectedObraFilter, setSelectedObraFilter] = useState<string>('all');
  const [selectedVetorFilter, setSelectedVetorFilter] = useState<string>('all');
  const [selectedGravidadeFilter, setSelectedGravidadeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected Item / Modals
  const [selectedCellData, setSelectedCellData] = useState<{
    obra: Obra;
    vetor: VetorRiscoConfig;
    score: number;
    incidentes: IncidenteSeguranca[];
    vistorias: Vistoria[];
    documentosPendentes: DocumentoColaborador[];
  } | null>(null);

  const [modalNovoIncidente, setModalNovoIncidente] = useState<boolean>(false);
  const [selectedIncidenteModal, setSelectedIncidenteModal] = useState<IncidenteSeguranca | null>(null);
  const [notifiedIncidenteId, setNotifiedIncidenteId] = useState<number | null>(null);

  // Form State for new incident
  const [formNovoIncidente, setFormNovoIncidente] = useState({
    obra_id: obras[0]?.id || 1,
    titulo: '',
    descricao: '',
    tipo: 'condicao_insegura' as IncidenteSeguranca['tipo'],
    categoria_risco: 'trabalho_altura' as IncidenteSeguranca['categoria_risco'],
    gravidade: 'alto' as IncidenteSeguranca['gravidade'],
    probabilidade: 3 as 1 | 2 | 3 | 4 | 5,
    impacto: 4 as 1 | 2 | 3 | 4 | 5,
    local_especifico: '',
    plano_acao_sugerido: '',
    prazo_correcao: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // Calculate Comprehensive Risk Scores for Each Project and Risk Vector
  const heatmapCalculation = useMemo<Record<number, ObraRiskScore>>(() => {
    const scoresPorObra: Record<number, ObraRiskScore> = {};

    obras.forEach(obra => {
      // Find all incidents for this project
      const obraIncidentes = incidentesList.filter(inc => inc.obra_id === obra.id);
      
      // Find all vistorias for this project
      const obraVistorias = vistorias.filter(v => v.obra_id === obra.id);

      // Find all pending/expired docs for this project
      const obraDocs = documentos.filter(d => {
        const matchesObra = d.obra_nome?.toLowerCase().includes(obra.nome.toLowerCase()) ||
                            colaboradores.some(c => c.id === d.colaborador_id && c.obra_id === obra.id);
        return matchesObra && (d.status === 'vencido' || d.status === 'reprovado' || d.status === 'pendente');
      });

      let totalPontosObra = 0;
      let totalIncidentesAtivos = 0;
      let totalVistoriasNaoConformes = 0;

      const vetoresData: Record<string, any> = {};

      VETORES_RISCO.forEach(vetor => {
        // Filter incidents for this vector
        const vetorIncidentes = obraIncidentes.filter(inc => {
          if (vetor.id === 'trabalho_altura') return inc.categoria_risco === 'trabalho_altura';
          if (vetor.id === 'eletrica') return inc.categoria_risco === 'eletrica';
          if (vetor.id === 'escavacao_estruturas') return inc.categoria_risco === 'escavacao_estruturas';
          if (vetor.id === 'maquinas_equipamentos') return inc.categoria_risco === 'maquinas_equipamentos';
          if (vetor.id === 'epi_epc') return inc.categoria_risco === 'epi_epc';
          if (vetor.id === 'incendio') return inc.categoria_risco === 'incendio';
          if (vetor.id === 'ergonomia_saude') return inc.categoria_risco === 'ergonomia_saude';
          return false;
        });

        // Filter inspections related to this vector
        const vetorVistorias = obraVistorias.filter(v => {
          const text = `${v.titulo} ${v.tipo || ''} ${v.descricao || ''} ${v.local_inspecao || ''}`.toLowerCase();
          if (vetor.id === 'trabalho_altura') return text.includes('altura') || text.includes('nr-35') || text.includes('guarda-corpo') || text.includes('linha de vida') || text.includes('fachada');
          if (vetor.id === 'eletrica') return text.includes('elétric') || text.includes('nr-10') || text.includes('quadro') || text.includes('qgbt');
          if (vetor.id === 'escavacao_estruturas') return text.includes('armadura') || text.includes('concreta') || text.includes('escava') || text.includes('laje') || text.includes('estrutural');
          if (vetor.id === 'maquinas_equipamentos') return text.includes('nr-12') || text.includes('grua') || text.includes('guincho') || text.includes('betoneira') || text.includes('equipamento');
          if (vetor.id === 'epi_epc') return text.includes('epi') || text.includes('epc') || text.includes('proteção individual');
          if (vetor.id === 'incendio') return text.includes('incêndio') || text.includes('bombeiro') || text.includes('cbmdf') || text.includes('hidrante') || text.includes('splinkler') || text.includes('extintor');
          if (vetor.id === 'ergonomia_saude') return text.includes('aso') || text.includes('saúde') || text.includes('pcmso') || text.includes('ergonomia');
          return false;
        });

        // Filter documents related to this vector
        const vetorDocs = obraDocs.filter(d => {
          const type = (d.tipo_documento || '').toLowerCase();
          const name = (d.nome_documento || '').toLowerCase();
          if (vetor.id === 'trabalho_altura') return type === 'nr35' || name.includes('nr-35') || name.includes('altura');
          if (vetor.id === 'eletrica') return type === 'nr10' || name.includes('nr-10') || name.includes('elétrica');
          if (vetor.id === 'escavacao_estruturas') return type === 'nr18' || name.includes('nr-18') || name.includes('estrutura');
          if (vetor.id === 'maquinas_equipamentos') return type === 'nr12' || name.includes('nr-12') || name.includes('máquinas');
          if (vetor.id === 'epi_epc') return type === 'epi' || name.includes('epi') || name.includes('ficha');
          if (vetor.id === 'incendio') return name.includes('bombeiro') || name.includes('incêndio');
          if (vetor.id === 'ergonomia_saude') return type === 'aso' || name.includes('aso') || name.includes('saúde');
          return false;
        });

        // Score calculation for this cell:
        // Weight: Critical Incidents = 25 pts, High = 15 pts, Medium = 8 pts, Low = 3 pts
        // Non-conforming Inspection = 12 pts
        // Pending/Expired Document = 5 pts
        let cellScore = 0;

        vetorIncidentes.forEach(inc => {
          if (inc.status !== 'concluido') {
            totalIncidentesAtivos++;
            if (inc.gravidade === 'critico') cellScore += 30;
            else if (inc.gravidade === 'alto') cellScore += 18;
            else if (inc.gravidade === 'medio') cellScore += 9;
            else cellScore += 4;
          }
        });

        vetorVistorias.forEach(v => {
          if (v.status === 'pendente' && (v.prioridade === 'urgente' || v.prioridade === 'alta')) {
            cellScore += 14;
          }
          if (v.itens_conformes !== undefined && v.total_itens !== undefined && v.itens_conformes < v.total_itens) {
            totalVistoriasNaoConformes++;
            cellScore += (v.total_itens - v.itens_conformes) * 4;
          }
        });

        cellScore += vetorDocs.length * 5;

        // Cap at 100
        const finalCellScore = Math.min(100, cellScore);
        totalPontosObra += finalCellScore;

        let nivel: 'critico' | 'alto' | 'medio' | 'baixo' | 'seguro' = 'seguro';
        if (finalCellScore >= 45) nivel = 'critico';
        else if (finalCellScore >= 25) nivel = 'alto';
        else if (finalCellScore >= 12) nivel = 'medio';
        else if (finalCellScore > 0) nivel = 'baixo';

        vetoresData[vetor.id] = {
          score: finalCellScore,
          nivel,
          incidentes: vetorIncidentes,
          vistorias: vetorVistorias,
          documentosPendentes: vetorDocs
        };
      });

      // Composite Project Score (Normalized to 0-100)
      const rawAvg = totalPontosObra / VETORES_RISCO.length;
      const scoreGlobal = Math.min(100, Math.round(rawAvg * 1.6));

      let classificacao: 'critico' | 'alto' | 'medio' | 'baixo' = 'baixo';
      if (scoreGlobal >= 55) classificacao = 'critico';
      else if (scoreGlobal >= 35) classificacao = 'alto';
      else if (scoreGlobal >= 18) classificacao = 'medio';

      scoresPorObra[obra.id] = {
        obra,
        scoreGlobal,
        classificacao,
        totalIncidentesAtivos,
        totalVistoriasNaoConformes,
        vetores: vetoresData
      };
    });

    return scoresPorObra;
  }, [obras, incidentesList, vistorias, documentos, colaboradores]);

  // Aggregate Top Metrics
  const aggregateMetrics = useMemo(() => {
    const list: ObraRiskScore[] = Object.values(heatmapCalculation);
    const totalObras = list.length || 1;
    const mediaScore = Math.round(list.reduce((acc, curr) => acc + curr.scoreGlobal, 0) / totalObras);

    // Find highest risk project
    const sortedByRisk = [...list].sort((a, b) => b.scoreGlobal - a.scoreGlobal);
    const obraMaisCritica = sortedByRisk[0];

    const totalIncidentes = incidentesList.length;
    const incidentesCriticos = incidentesList.filter(i => i.gravidade === 'critico' && i.status !== 'concluido').length;
    const incidentesAltos = incidentesList.filter(i => i.gravidade === 'alto' && i.status !== 'concluido').length;
    const incidentesResolvidos = incidentesList.filter(i => i.status === 'concluido' || i.status === 'mitigado').length;
    
    const taxaMitigacao = totalIncidentes > 0 
      ? Math.round((incidentesResolvidos / totalIncidentes) * 100) 
      : 100;

    // Vistorias com pendência
    const vistoriasComPendencia = vistorias.filter(v => 
      v.status === 'pendente' && (v.prioridade === 'urgente' || v.prioridade === 'alta')
    ).length;

    return {
      mediaScore,
      obraMaisCritica,
      totalIncidentes,
      incidentesCriticos,
      incidentesAltos,
      taxaMitigacao,
      vistoriasComPendencia
    };
  }, [heatmapCalculation, incidentesList, vistorias]);

  // Matrix 5x5 Grid Data
  const matrix5x5Data = useMemo(() => {
    const matrix: Record<string, IncidenteSeguranca[]> = {};
    for (let p = 1; p <= 5; p++) {
      for (let i = 1; i <= 5; i++) {
        matrix[`${p}-${i}`] = [];
      }
    }

    incidentesList.forEach(inc => {
      const p = inc.probabilidade || 3;
      const i = inc.impacto || 3;
      const key = `${p}-${i}`;
      if (matrix[key]) {
        matrix[key].push(inc);
      }
    });

    return matrix;
  }, [incidentesList]);

  // Filtered Incidents List
  const filteredIncidentes = useMemo(() => {
    return incidentesList.filter(inc => {
      if (selectedObraFilter !== 'all' && String(inc.obra_id) !== selectedObraFilter) return false;
      if (selectedVetorFilter !== 'all' && inc.categoria_risco !== selectedVetorFilter) return false;
      if (selectedGravidadeFilter !== 'all' && inc.gravidade !== selectedGravidadeFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const m1 = inc.titulo.toLowerCase().includes(q);
        const m2 = inc.descricao.toLowerCase().includes(q);
        const m3 = inc.local_especifico.toLowerCase().includes(q);
        const m4 = (inc.obra_nome || '').toLowerCase().includes(q);
        if (!m1 && !m2 && !m3 && !m4) return false;
      }
      return true;
    });
  }, [incidentesList, selectedObraFilter, selectedVetorFilter, selectedGravidadeFilter, searchTerm]);

  // Cell Color Generator for Heatmap
  const getCellBgColor = (score: number, nivel: string) => {
    if (nivel === 'critico') return 'bg-red-600 text-white font-extrabold shadow-2xs hover:bg-red-700';
    if (nivel === 'alto') return 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-600';
    if (nivel === 'medio') return 'bg-yellow-300 text-slate-900 font-medium hover:bg-yellow-400';
    if (nivel === 'baixo') return 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200';
    return 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100';
  };

  // Matrix Cell Risk Level Color (P x I)
  const getMatrixCellColor = (probabilidade: number, impacto: number) => {
    const riskScore = probabilidade * impacto; // 1 to 25
    if (riskScore >= 16) return 'bg-red-600 border-red-700 text-white'; // Extremo / Crítico
    if (riskScore >= 10) return 'bg-amber-500 border-amber-600 text-slate-950'; // Alto
    if (riskScore >= 6) return 'bg-yellow-300 border-yellow-400 text-slate-900'; // Moderado
    return 'bg-emerald-100 border-emerald-300 text-emerald-900'; // Baixo
  };

  // Submit New Incident
  const handleSaveNovoIncidente = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedObra = obras.find(o => o.id === Number(formNovoIncidente.obra_id));
    const newInc: IncidenteSeguranca = {
      id: Date.now(),
      obra_id: Number(formNovoIncidente.obra_id),
      obra_nome: matchedObra ? matchedObra.nome : 'Canteiro Principal',
      titulo: formNovoIncidente.titulo,
      descricao: formNovoIncidente.descricao,
      tipo: formNovoIncidente.tipo,
      categoria_risco: formNovoIncidente.categoria_risco,
      gravidade: formNovoIncidente.gravidade,
      probabilidade: formNovoIncidente.probabilidade,
      impacto: formNovoIncidente.impacto,
      local_especifico: formNovoIncidente.local_especifico || 'Área Geral do Canteiro',
      data_ocorrencia: new Date().toISOString().split('T')[0],
      status: 'aberto',
      responsavel_nome: 'SESMT / Eng. de Segurança',
      plano_acao_sugerido: formNovoIncidente.plano_acao_sugerido,
      prazo_correcao: formNovoIncidente.prazo_correcao,
      created_at: new Date().toISOString()
    };

    setIncidentesList(prev => [newInc, ...prev]);

    if (onAddIncidente) {
      onAddIncidente(newInc);
    }

    if (onSendNotification) {
      onSendNotification({
        titulo: `Novo Risco Registrado: ${newInc.titulo}`,
        mensagem: `Alerta SST em ${newInc.obra_nome}: ${newInc.descricao} (Gravidade: ${newInc.gravidade.toUpperCase()})`,
        obra_id: newInc.obra_id,
        obra_nome: newInc.obra_nome
      });
    }

    setModalNovoIncidente(false);
    setFormNovoIncidente({
      obra_id: obras[0]?.id || 1,
      titulo: '',
      descricao: '',
      tipo: 'condicao_insegura',
      categoria_risco: 'trabalho_altura',
      gravidade: 'alto',
      probabilidade: 3,
      impacto: 4,
      local_especifico: '',
      plano_acao_sugerido: '',
      prazo_correcao: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  };

  // Toggle Status of an Incident
  const handleUpdateStatus = (incId: number, newStatus: IncidenteSeguranca['status']) => {
    setIncidentesList(prev => prev.map(item => {
      if (item.id === incId) {
        return { ...item, status: newStatus };
      }
      return item;
    }));

    if (selectedIncidenteModal && selectedIncidenteModal.id === incId) {
      setSelectedIncidenteModal(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Dispatch Emergency Alert to Supervisor
  const handleNotifyUrgent = (inc: IncidenteSeguranca) => {
    if (onSendNotification) {
      onSendNotification({
        titulo: `ALERTA CRÍTICO DE RISCO: ${inc.titulo}`,
        mensagem: `Atenção Encarregados de ${inc.obra_nome}: Pendência de segurança em ${inc.local_especifico}. Plano de ação imediato requerido!`,
        obra_id: inc.obra_id,
        obra_nome: inc.obra_nome
      });
    }
    setNotifiedIncidenteId(inc.id);
    setTimeout(() => setNotifiedIncidenteId(null), 3000);
  };

  return (
    <div 
      id="mapa-de-calor-de-riscos-dashboard"
      className="bg-white rounded-lg border border-slate-200 shadow-2xs p-3 transition-all relative overflow-hidden"
    >
      {/* Top Banner if there are Critical Safety Points */}
      {aggregateMetrics.incidentesCriticos > 0 && (
        <div className="bg-red-700 text-white px-2.5 py-1 -mx-3 -mt-3 mb-2.5 flex items-center justify-between text-[7.5px] font-bold shadow-2xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <Flame className="w-3.5 h-3.5 shrink-0 text-amber-300 animate-pulse" />
            <span className="truncate">
              <strong>MAPA TÉRMICO DE RISCO (SST):</strong> Detectados <strong>{aggregateMetrics.incidentesCriticos} incidentes/desvios críticos</strong> com risco de paralisação ou acidente grave!
            </span>
          </div>
          <button
            onClick={() => {
              setViewMode('lista_ocorrencias');
              setSelectedGravidadeFilter('critico');
            }}
            className="px-2 py-0.5 bg-white text-red-700 hover:bg-red-50 rounded text-[7px] font-extrabold uppercase shrink-0 transition-all cursor-pointer shadow-2xs"
          >
            Ver Pontos Críticos
          </button>
        </div>
      )}

      {/* Header: Title & View Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 flex items-center justify-center shrink-0 shadow-2xs">
            <Flame className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight">
                Mapa de Calor de Riscos & Matriz de Ocorrências
              </h3>
              <span className={`text-[7px] font-black px-1.5 py-0.2 rounded font-mono uppercase tracking-wider ${
                aggregateMetrics.mediaScore >= 35 ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                ICR Médio: {aggregateMetrics.mediaScore}/100
              </span>
            </div>
            <p className="text-[8px] text-slate-500 mt-0.5">
              Cruzamento preditivo de vistorias com não conformidades, incidentes reportados e pendências de segurança por canteiro
            </p>
          </div>
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          {/* Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 text-[7.5px] font-bold">
            <button
              onClick={() => setViewMode('heatmap_grade')}
              className={`px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'heatmap_grade' ? 'bg-slate-900 text-white shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-2.5 h-2.5" />
              <span>Grade Térmica (Canteiros × NRs)</span>
            </button>
            <button
              onClick={() => setViewMode('matriz_5x5')}
              className={`px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'matriz_5x5' ? 'bg-slate-900 text-white shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-2.5 h-2.5" />
              <span>Matriz 5×5 (Prob. × Impacto)</span>
            </button>
            <button
              onClick={() => setViewMode('lista_ocorrencias')}
              className={`px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'lista_ocorrencias' ? 'bg-slate-900 text-white shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-2.5 h-2.5" />
              <span>Lista de Incidentes ({incidentesList.length})</span>
            </button>
          </div>

          {/* Report Button */}
          <button
            onClick={() => setModalNovoIncidente(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[8px] font-extrabold transition-all cursor-pointer shadow-2xs"
            title="Registrar novo quase-acidente, condição insegura ou desvio de segurança"
          >
            <Plus className="w-3 h-3" />
            <span>Reportar Ocorrência</span>
          </button>
        </div>
      </div>

      {/* Top Executive KPI Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 mb-2.5">
        {/* KPI 1: Canteiro Mais Crítico */}
        <div className="bg-red-50/70 p-2 rounded border border-red-200 text-red-950 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-bold uppercase text-red-900">Canteiro Mais Crítico</span>
            <AlertOctagon className="w-2.5 h-2.5 text-red-600" />
          </div>
          <div className="mt-0.5">
            <span className="text-[9px] font-black text-red-900 block truncate" title={aggregateMetrics.obraMaisCritica?.obra.nome}>
              {aggregateMetrics.obraMaisCritica?.obra.nome || 'Nenhum'}
            </span>
            <span className="text-[7px] text-red-700 font-bold font-mono">
              Score: {aggregateMetrics.obraMaisCritica?.scoreGlobal}/100 ({aggregateMetrics.obraMaisCritica?.totalIncidentesAtivos} ocorrências)
            </span>
          </div>
        </div>

        {/* KPI 2: Incidentes Críticos / Altos */}
        <div className="bg-amber-50/70 p-2 rounded border border-amber-200 text-amber-950 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-bold uppercase text-amber-900">Gravidade Alta/Crítica</span>
            <Flame className="w-2.5 h-2.5 text-amber-600" />
          </div>
          <div className="mt-0.5">
            <div className="flex items-baseline gap-1">
              <span className="text-xs sm:text-sm font-black text-amber-950 font-mono leading-none">
                {aggregateMetrics.incidentesCriticos + aggregateMetrics.incidentesAltos}
              </span>
              <span className="text-[7px] text-amber-800 font-bold">pontos de atenção</span>
            </div>
            <span className="text-[6.5px] text-amber-700 block mt-0.5">
              {aggregateMetrics.incidentesCriticos} críticos · {aggregateMetrics.incidentesAltos} altos
            </span>
          </div>
        </div>

        {/* KPI 3: Vistorias com Itens Não Conformes */}
        <div className="bg-slate-50 p-2 rounded border border-slate-200 text-slate-900 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-bold uppercase text-slate-700">Vistorias Pendentes</span>
            <Clock className="w-2.5 h-2.5 text-slate-600" />
          </div>
          <div className="mt-0.5">
            <div className="flex items-baseline gap-1">
              <span className="text-xs sm:text-sm font-black text-slate-900 font-mono leading-none">
                {aggregateMetrics.vistoriasComPendencia}
              </span>
              <span className="text-[7px] text-slate-500">urgentes/altas</span>
            </div>
            <span className="text-[6.5px] text-slate-500 block mt-0.5">
              Aguardando liberação em campo
            </span>
          </div>
        </div>

        {/* KPI 4: Taxa de Mitigação de Riscos */}
        <div className="bg-emerald-50/70 p-2 rounded border border-emerald-200 text-emerald-950 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-bold uppercase text-emerald-900">Taxa de Mitigação</span>
            <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
          </div>
          <div className="mt-0.5">
            <div className="flex items-baseline gap-1">
              <span className="text-xs sm:text-sm font-black text-emerald-800 font-mono leading-none">
                {aggregateMetrics.taxaMitigacao}%
              </span>
              <span className="text-[7px] text-emerald-700 font-bold">resolvidos</span>
            </div>
            <span className="text-[6.5px] text-emerald-700 block mt-0.5">
              Planos de ação executados
            </span>
          </div>
        </div>

        {/* KPI 5: Dias Sem Acidentes com Afastamento */}
        <div className="bg-slate-900 text-white p-2 rounded border border-slate-800 flex flex-col justify-between shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-bold uppercase text-slate-300">Segurança Zero Acidente</span>
            <HardHat className="w-2.5 h-2.5 text-amber-400" />
          </div>
          <div className="mt-0.5">
            <span className="text-xs sm:text-sm font-black font-mono block leading-none text-emerald-400">
              142 Dias
            </span>
            <span className="text-[6.5px] text-slate-400 block mt-0.5">
              Sem acidentes com afastamento (CPTP)
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: GRADE TÉRMICA (HEATMAP CANTEIROS × VETORES DE RISCO NRs)         */}
      {/* ========================================================================= */}
      {viewMode === 'heatmap_grade' && (
        <div className="space-y-2">
          {/* Legenda Térmica Superior */}
          <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-200 text-[7px]">
            <span className="font-bold text-slate-700">Intensidade Térmica de Risco:</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-100 border border-emerald-300" />
                <span className="text-slate-600">Baixo / Seguro (0-11)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-yellow-300 border border-yellow-400" />
                <span className="text-slate-600">Moderado (12-24)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 border border-amber-600" />
                <span className="text-slate-900 font-bold">Alto (25-44)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-red-600 border border-red-700" />
                <span className="text-red-700 font-extrabold">Crítico (45+)</span>
              </div>
            </div>
          </div>

          {/* Tabela do Mapa de Calor */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs">
            <table className="w-full text-left border-collapse text-[7.5px]">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="p-2 border-r border-slate-800 min-w-[160px]">Canteiro de Obras</th>
                  <th className="p-2 text-center border-r border-slate-800 w-16">ICR Global</th>
                  {VETORES_RISCO.map(v => (
                    <th key={v.id} className="p-2 text-center border-r border-slate-800 min-w-[90px]">
                      <div className="flex flex-col items-center">
                        <span className="font-mono text-[7px] text-amber-300">{v.sigla}</span>
                        <span className="text-[7.5px] leading-tight truncate w-full text-center">{v.nome}</span>
                        <span className="text-[6px] text-slate-400 font-normal">{v.nrReferencia}</span>
                      </div>
                    </th>
                  ))}
                  <th className="p-2 text-center w-16">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {obras.map(obra => {
                  const obraCalc = heatmapCalculation[obra.id];
                  if (!obraCalc) return null;

                  return (
                    <tr key={obra.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Obra Name & Meta */}
                      <td className="p-2 border-r border-slate-200">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                          <div className="min-w-0">
                            <strong className="text-slate-900 block truncate text-[8.5px]">{obra.nome}</strong>
                            <span className="text-[6.5px] text-slate-500">
                              {obraCalc.totalIncidentesAtivos} ocorrências ativas · {obraCalc.totalVistoriasNaoConformes} vist. com pendência
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Composite Score */}
                      <td className="p-2 text-center border-r border-slate-200">
                        <span className={`inline-block px-1.5 py-0.5 rounded font-mono font-black text-[8px] ${
                          obraCalc.scoreGlobal >= 45 ? 'bg-red-600 text-white' :
                          obraCalc.scoreGlobal >= 25 ? 'bg-amber-500 text-slate-950' :
                          obraCalc.scoreGlobal >= 12 ? 'bg-yellow-300 text-slate-900' : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {obraCalc.scoreGlobal}
                        </span>
                      </td>

                      {/* Vector Cells (Dynamic Heatmap Colors) */}
                      {VETORES_RISCO.map(v => {
                        const cell = obraCalc.vetores[v.id];
                        const countItems = (cell.incidentes.length || 0) + (cell.vistorias.length || 0) + (cell.documentosPendentes.length || 0);

                        return (
                          <td 
                            key={v.id} 
                            onClick={() => setSelectedCellData({
                              obra,
                              vetor: v,
                              score: cell.score,
                              incidentes: cell.incidentes,
                              vistorias: cell.vistorias,
                              documentosPendentes: cell.documentosPendentes
                            })}
                            className={`p-2 text-center border-r border-slate-200 transition-all cursor-pointer ${getCellBgColor(cell.score, cell.nivel)}`}
                            title={`Clique para inspecionar ${v.nome} em ${obra.nome}: Score ${cell.score}/100 (${countItems} registros)`}
                          >
                            <div className="flex flex-col items-center justify-center">
                              <span className="font-mono text-[8px] leading-none">
                                {cell.score} pts
                              </span>
                              {countItems > 0 && (
                                <span className="text-[6px] opacity-90 mt-0.5 font-bold">
                                  {countItems} {countItems === 1 ? 'item' : 'itens'}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Action Cell */}
                      <td className="p-2 text-center">
                        <button
                          onClick={() => {
                            if (onSendNotification) {
                              onSendNotification({
                                titulo: `Auditoria Preventiva Solicitada: ${obra.nome}`,
                                mensagem: `Engenheiro residente notificado para revisão das pendências térmicas de segurança com ICR ${obraCalc.scoreGlobal}.`,
                                obra_id: obra.id,
                                obra_nome: obra.nome
                              });
                            }
                          }}
                          className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[6.5px] font-bold cursor-pointer transition-all shadow-2xs"
                          title="Notificar encarregados do canteiro"
                        >
                          Alertar
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

      {/* ========================================================================= */}
      {/* VISTA 2: MATRIZ DE RISCO 5×5 (PROBABILIDADE × IMPACTO)                     */}
      {/* ========================================================================= */}
      {viewMode === 'matriz_5x5' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-200 text-[7px]">
            <span className="font-bold text-slate-700">Matriz de Probabilidade vs Impacto (NR-01 / PGR):</span>
            <span className="text-slate-500 font-mono">Clique em qualquer quadrante para ver os incidentes correspondentes</span>
          </div>

          <div className="grid grid-cols-6 gap-1 p-2 bg-slate-900 rounded-lg text-white text-[7px] overflow-x-auto">
            {/* Header Y label */}
            <div className="col-span-1 flex items-center justify-center font-extrabold text-amber-400 rotate-0 sm:-rotate-90">
              PROBABILIDADE
            </div>

            {/* Matrix 5 columns */}
            <div className="col-span-5 grid grid-cols-5 gap-1">
              {/* Matrix Rows from 5 (Frequent) to 1 (Rare) */}
              {[5, 4, 3, 2, 1].map(prob => (
                <React.Fragment key={prob}>
                  {[1, 2, 3, 4, 5].map(imp => {
                    const key = `${prob}-${imp}`;
                    const itemsInCell = matrix5x5Data[key] || [];
                    const colorClass = getMatrixCellColor(prob, imp);

                    return (
                      <div
                        key={key}
                        onClick={() => {
                          if (itemsInCell.length > 0) {
                            setSelectedIncidenteModal(itemsInCell[0]);
                          }
                        }}
                        className={`h-14 sm:h-16 p-1 rounded border flex flex-col justify-between transition-all cursor-pointer hover:scale-[1.02] ${colorClass}`}
                      >
                        <div className="flex justify-between items-center text-[6px] font-mono opacity-80">
                          <span>P:{prob} × I:{imp}</span>
                          <span className="font-bold">{prob * imp}</span>
                        </div>

                        <div className="text-center my-auto">
                          {itemsInCell.length > 0 ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white font-mono font-black text-[8px] shadow-sm">
                              {itemsInCell.length}
                            </span>
                          ) : (
                            <span className="text-[6px] opacity-40">-</span>
                          )}
                        </div>

                        <div className="text-[6px] font-extrabold text-center truncate">
                          {prob * imp >= 16 ? 'CRÍTICO' : prob * imp >= 10 ? 'ALTO' : prob * imp >= 6 ? 'MÉDIO' : 'BAIXO'}
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}

              {/* Bottom X label */}
              <div className="col-span-5 flex justify-between px-1 text-[7px] font-extrabold text-amber-400 pt-1 border-t border-slate-700">
                <span>1 - Insignificante</span>
                <span>2 - Leve</span>
                <span>3 - Moderado</span>
                <span>4 - Grave</span>
                <span>5 - Catastrófico (IMPACTO)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 3: LISTA DINÂMICA DE INCIDENTES & PENDÊNCIAS DE SEGURANÇA           */}
      {/* ========================================================================= */}
      {viewMode === 'lista_ocorrencias' && (
        <div className="space-y-2">
          {/* Controls & Search */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 bg-slate-50 rounded-md border border-slate-200 text-[7.5px]">
            <div className="flex items-center gap-1 flex-wrap">
              {/* Obra Filter */}
              <select
                value={selectedObraFilter}
                onChange={(e) => setSelectedObraFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-900 font-bold focus:outline-none"
              >
                <option value="all">Todos os Canteiros</option>
                {obras.map(o => <option key={o.id} value={String(o.id)}>{o.nome}</option>)}
              </select>

              {/* Vetor Filter */}
              <select
                value={selectedVetorFilter}
                onChange={(e) => setSelectedVetorFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-900 font-bold focus:outline-none"
              >
                <option value="all">Todas as Categorias de Risco</option>
                {VETORES_RISCO.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
              </select>

              {/* Gravidade Filter */}
              <select
                value={selectedGravidadeFilter}
                onChange={(e) => setSelectedGravidadeFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-900 font-bold focus:outline-none"
              >
                <option value="all">Todas as Gravidades</option>
                <option value="critico">Crítico (Vermelho)</option>
                <option value="alto">Alto (Laranja)</option>
                <option value="medio">Médio (Amarelo)</option>
                <option value="baixo">Baixo (Verde)</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative flex items-center">
              <Search className="w-2.5 h-2.5 text-slate-400 absolute left-1.5" />
              <input
                type="text"
                placeholder="Buscar incidente, local, NR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-5 pr-2 py-0.5 bg-white border border-slate-200 rounded text-slate-900 placeholder-slate-400 focus:outline-none w-36 sm:w-44 text-[7px]"
              />
            </div>
          </div>

          {/* Incident Cards */}
          <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-0.5">
            {filteredIncidentes.map(inc => {
              const isNotified = notifiedIncidenteId === inc.id;

              return (
                <div
                  key={inc.id}
                  className={`p-2 rounded-md border transition-all ${
                    inc.gravidade === 'critico' ? 'bg-red-50/70 border-red-300' :
                    inc.gravidade === 'alto' ? 'bg-amber-50/70 border-amber-300' :
                    inc.gravidade === 'medio' ? 'bg-yellow-50/70 border-yellow-300' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-1.5 py-0.2 rounded text-[6.5px] font-mono font-black uppercase text-white ${
                        inc.gravidade === 'critico' ? 'bg-red-700' :
                        inc.gravidade === 'alto' ? 'bg-amber-600' :
                        inc.gravidade === 'medio' ? 'bg-yellow-600' : 'bg-emerald-600'
                      }`}>
                        {inc.gravidade.toUpperCase()}
                      </span>
                      <strong className="text-slate-900 text-[9px]">{inc.titulo}</strong>
                      <span className="text-[6.5px] text-slate-500 font-mono">
                        ({inc.tipo.replace('_', ' ').toUpperCase()})
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className={`px-1.5 py-0.2 rounded text-[6.5px] font-bold ${
                        inc.status === 'concluido' ? 'bg-emerald-100 text-emerald-900' :
                        inc.status === 'mitigado' ? 'bg-blue-100 text-blue-900' :
                        inc.status === 'plano_acao' ? 'bg-purple-100 text-purple-900' : 'bg-red-100 text-red-900'
                      }`}>
                        Status: {inc.status.toUpperCase()}
                      </span>

                      <button
                        onClick={() => handleNotifyUrgent(inc)}
                        disabled={isNotified}
                        className={`px-1.5 py-0.5 rounded text-[6.5px] font-bold transition-all cursor-pointer flex items-center gap-0.5 ${
                          isNotified ? 'bg-emerald-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-2xs'
                        }`}
                      >
                        {isNotified ? <Check className="w-2 h-2" /> : <Bell className="w-2 h-2 text-amber-300" />}
                        <span>{isNotified ? 'Notificado' : 'Cobrar Ação'}</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[7.5px] text-slate-700 mb-1 leading-relaxed">
                    {inc.descricao}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-1 bg-white/90 rounded border border-slate-200 text-[6.5px]">
                    <div>
                      <span className="text-slate-400 font-bold block">Local & Canteiro:</span>
                      <span className="text-slate-800 font-semibold">{inc.local_especifico} ({inc.obra_nome})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">Plano de Ação Sugerido:</span>
                      <span className="text-slate-800 italic">{inc.plano_acao_sugerido || 'Em elaboração pelo SESMT'}</span>
                    </div>
                  </div>

                  {/* Actions to change status */}
                  <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-200/60 text-[6.5px]">
                    <span className="text-slate-400 font-mono">
                      Data: {inc.data_ocorrencia} · Resp: {inc.responsavel_nome || 'SESMT'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUpdateStatus(inc.id, 'plano_acao')}
                        className="px-1 py-0.2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded cursor-pointer"
                      >
                        Plano de Ação
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(inc.id, 'mitigado')}
                        className="px-1 py-0.2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded cursor-pointer"
                      >
                        Marcar Mitigado
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(inc.id, 'concluido')}
                        className="px-1 py-0.2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded cursor-pointer"
                      >
                        Concluir / Fechar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredIncidentes.length === 0 && (
              <div className="text-center py-6 bg-slate-50 rounded border border-dashed border-slate-200 text-[8px] text-slate-500">
                Nenhum incidente ou ocorrência cadastrada com os filtros selecionados.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[7px] text-slate-500 gap-1">
        <div className="flex items-center gap-1">
          <Info className="w-2.5 h-2.5 text-slate-400 shrink-0" />
          <span>
            <strong>Gestão Integrada de SST (PGR/NR-01):</strong> O calor térmico calcula desvios acumulados de vistorias técnicas, pendências de ASO/EPI e ocorrências em campo.
          </span>
        </div>
        <span className="font-mono text-slate-400">
          Auditoria Ativa · {obras.length} Canteiros Monitorados
        </span>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: INSPEÇÃO DE CÉLULA TÉRMICA SELECIONADA                           */}
      {/* ========================================================================= */}
      {selectedCellData && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden text-slate-900">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900 text-white border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <div>
                  <h4 className="font-bold text-xs">Inspeção Térmica: {selectedCellData.vetor.nome}</h4>
                  <p className="text-[7px] text-slate-300">Canteiro: {selectedCellData.obra.nome} · Score: {selectedCellData.score}/100</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCellData(null)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 overflow-y-auto space-y-2 text-[7.5px]">
              {/* Vector Info Header */}
              <div className="bg-slate-50 p-2 rounded border border-slate-200">
                <span className="text-slate-500 font-bold block">Norma Regulamentadora de Referência:</span>
                <strong className="text-slate-900 text-[8.5px]">{selectedCellData.vetor.nrReferencia}</strong>
              </div>

              {/* Incidentes in this Cell */}
              <div>
                <h5 className="font-bold text-slate-900 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-red-600" />
                  Incidentes e Quase-Acidentes Registrados ({selectedCellData.incidentes.length}):
                </h5>
                {selectedCellData.incidentes.length > 0 ? (
                  <div className="space-y-1">
                    {selectedCellData.incidentes.map(inc => (
                      <div key={inc.id} className="p-1.5 bg-red-50/60 rounded border border-red-200">
                        <div className="flex justify-between font-bold">
                          <span className="text-red-950">{inc.titulo}</span>
                          <span className="text-red-800 uppercase text-[6.5px]">{inc.gravidade}</span>
                        </div>
                        <p className="text-slate-600 mt-0.5 text-[7px]">{inc.descricao}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Nenhum incidente ativo nesta categoria.</p>
                )}
              </div>

              {/* Vistorias in this Cell */}
              <div>
                <h5 className="font-bold text-slate-900 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  Vistorias Técnicas Relacionadas ({selectedCellData.vistorias.length}):
                </h5>
                {selectedCellData.vistorias.length > 0 ? (
                  <div className="space-y-1">
                    {selectedCellData.vistorias.map(v => (
                      <div key={v.id} className="p-1.5 bg-amber-50/60 rounded border border-amber-200 flex justify-between items-center">
                        <div>
                          <strong className="text-slate-900 block">{v.titulo}</strong>
                          <span className="text-slate-500 text-[6.5px]">{v.local_inspecao || 'Canteiro Geral'} · Status: {v.status}</span>
                        </div>
                        <span className="font-mono text-[7px] font-bold text-amber-900">
                          {v.itens_conformes}/{v.total_itens} conformes
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Nenhuma vistoria pendente nesta categoria.</p>
                )}
              </div>
            </div>

            <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedCellData(null)}
                className="px-3 py-1 bg-slate-900 text-white rounded text-[7.5px] font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REPORTAR NOVO INCIDENTE / OCORRÊNCIA                             */}
      {/* ========================================================================= */}
      {modalNovoIncidente && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-md flex flex-col overflow-hidden text-slate-900">
            <div className="flex items-center justify-between px-3 py-2 bg-red-700 text-white">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-300" />
                <h4 className="font-bold text-xs">Reportar Incidente / Ocorrência de Risco</h4>
              </div>
              <button onClick={() => setModalNovoIncidente(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNovoIncidente} className="p-3 space-y-2 text-[7.5px]">
              <div>
                <label className="font-bold text-slate-700 block mb-0.5">Canteiro de Obras:</label>
                <select
                  value={formNovoIncidente.obra_id}
                  onChange={(e) => setFormNovoIncidente({ ...formNovoIncidente, obra_id: Number(e.target.value) })}
                  className="w-full p-1 border border-slate-300 rounded font-bold"
                >
                  {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-0.5">Título da Ocorrência:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Falha na trava do andaime balancim"
                  value={formNovoIncidente.titulo}
                  onChange={(e) => setFormNovoIncidente({ ...formNovoIncidente, titulo: e.target.value })}
                  className="w-full p-1 border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">Categoria de Risco:</label>
                  <select
                    value={formNovoIncidente.categoria_risco}
                    onChange={(e) => setFormNovoIncidente({ ...formNovoIncidente, categoria_risco: e.target.value as any })}
                    className="w-full p-1 border border-slate-300 rounded font-semibold"
                  >
                    {VETORES_RISCO.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">Gravidade:</label>
                  <select
                    value={formNovoIncidente.gravidade}
                    onChange={(e) => setFormNovoIncidente({ ...formNovoIncidente, gravidade: e.target.value as any })}
                    className="w-full p-1 border border-slate-300 rounded font-bold text-red-700"
                  >
                    <option value="critico">Crítico (Risco Iminente)</option>
                    <option value="alto">Alto</option>
                    <option value="medio">Médio</option>
                    <option value="baixo">Baixo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">Probabilidade (1 a 5):</label>
                  <select
                    value={formNovoIncidente.probabilidade}
                    onChange={(e) => setFormNovoIncidente({ ...formNovoIncidente, probabilidade: Number(e.target.value) as any })}
                    className="w-full p-1 border border-slate-300 rounded font-mono"
                  >
                    <option value={1}>1 - Muito Baixa (Rara)</option>
                    <option value={2}>2 - Baixa</option>
                    <option value={3}>3 - Média</option>
                    <option value={4}>4 - Alta</option>
                    <option value={5}>5 - Frequente</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">Impacto (1 a 5):</label>
                  <select
                    value={formNovoIncidente.impacto}
                    onChange={(e) => setFormNovoIncidente({ ...formNovoIncidente, impacto: Number(e.target.value) as any })}
                    className="w-full p-1 border border-slate-300 rounded font-mono"
                  >
                    <option value={1}>1 - Insignificante</option>
                    <option value={2}>2 - Leve</option>
                    <option value={3}>3 - Moderado</option>
                    <option value={4}>4 - Grave</option>
                    <option value={5}>5 - Catastrófico</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-0.5">Local Específico no Canteiro:</label>
                <input
                  type="text"
                  placeholder="Ex: Torre A - Fachada Leste (5º Pavimento)"
                  value={formNovoIncidente.local_especifico}
                  onChange={(e) => setFormNovoIncidente({ ...formNovoIncidente, local_especifico: e.target.value })}
                  className="w-full p-1 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-0.5">Descrição Detalhada do Desvio:</label>
                <textarea
                  rows={2}
                  placeholder="Descreva a condição insegura ou o quase-acidente ocorrido..."
                  value={formNovoIncidente.descricao}
                  onChange={(e) => setFormNovoIncidente({ ...formNovoIncidente, descricao: e.target.value })}
                  className="w-full p-1 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-0.5">Plano de Ação Corretivo Imediato:</label>
                <input
                  type="text"
                  placeholder="Ex: Interdição do bordo, reforço da linha de vida e advertência técnica"
                  value={formNovoIncidente.plano_acao_sugerido}
                  onChange={(e) => setFormNovoIncidente({ ...formNovoIncidente, plano_acao_sugerido: e.target.value })}
                  className="w-full p-1 border border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalNovoIncidente(false)}
                  className="px-2.5 py-1 bg-slate-200 text-slate-800 rounded font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold cursor-pointer shadow-2xs"
                >
                  Salvar Ocorrência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
