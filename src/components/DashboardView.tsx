import React, { useState, useMemo, useCallback } from 'react';
import { 
  Building2, 
  Users, 
  Boxes, 
  AlertTriangle, 
  FileCheck, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  PlusCircle, 
  ShieldCheck, 
  CheckCircle2, 
  Package, 
  Wrench, 
  Activity, 
  ChevronRight, 
  HardHat, 
  Clock, 
  ArrowUpRight, 
  Check, 
  Percent, 
  ClipboardList,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  Info,
  Calendar,
  Layers,
  Sparkles,
  X,
  Eye,
  Filter,
  CheckSquare,
  Square,
  Target,
  Wallet,
  Fuel,
  ArrowRight,
  BellRing,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  LineChart as LineChartIcon,
  BarChart3,
  Briefcase,
  Scale,
  Coins,
  PieChart,
  UserCheck,
  BadgePercent,
  Mail,
  Send,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';
import { Obra, Colaborador, ItemAlmoxarifado, MaterialConsumo, DocumentoColaborador, Vistoria, MovimentacaoAlmoxarifado, MovimentacaoMaterial, IncidenteSeguranca, ContratoSubempreiteira } from '../types/erp';
import { EmailDisparoLog } from '../services/emailNotificationService';
import { SafetyComplianceWidget } from './SafetyComplianceWidget';
import { AsoAlertPanel } from './AsoAlertPanel';
import { CriticalStockAlertSection } from './CriticalStockAlertSection';
import { InspectionTimelineWidget } from './InspectionTimelineWidget';
import { GlobalProgressStatusCard } from './GlobalProgressStatusCard';
import { ProjectFinancialHealthD3Chart } from './ProjectFinancialHealthD3Chart';
import { ProjectDeliveryProjectionCard } from './ProjectDeliveryProjectionCard';
import { EpiComplianceAlertPanel } from './EpiComplianceAlertPanel';
import { RiskHeatmapWidget } from './RiskHeatmapWidget';
import { ThirdPartyWorkforcePanel } from './ThirdPartyWorkforcePanel';
import { UpcomingExpiringDocsSection } from './UpcomingExpiringDocsSection';
import { GlobalObraFilterBar } from './GlobalObraFilterBar';
import { ContractExpiryMonitoringCard } from './ContractExpiryMonitoringCard';
import { BudgetDonutChartCard } from './BudgetDonutChartCard';
import { ComplianceAnalysisCard } from './ComplianceAnalysisCard';
import { SafetyIncidentTrendLineChart } from './SafetyIncidentTrendLineChart';

export interface PhaseDetail {
  id: string;
  nome: string;
  categoria: 'fundacao' | 'estrutura' | 'instalacoes' | 'acabamento' | 'entrega';
  color: string;
  barColor: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  startRatio: number;
  endRatio: number;
  weight: number;
  inicio: Date;
  fim: Date;
  inicioStr: string;
  fimStr: string;
  duracaoDias: number;
  progresso: number;
  status: 'concluida' | 'em_andamento' | 'planejada' | 'atrasada';
  budgetAllocated: number;
  budgetSpent: number;
  responsible: string;
  milestones: { name: string; done: boolean }[];
}

export interface PhaseTooltipState {
  obraNome: string;
  obraId: number;
  fase: PhaseDetail;
  x: number;
  y: number;
}

export interface CurvaSPoint {
  mesKey: string;
  mesLabel: string;
  mesFull: string;
  progressoPlanejado: number;
  progressoRealizado: number | null;
  custoPlanejado: number;
  custoRealizado: number | null;
  desvioPercentual: number | null;
  desvioFinanceiro: number | null;
  isAtual: boolean;
  isFuturo: boolean;
  fasePredominante: string;
}

const formatBRL = (val: number | null | undefined) => {
  if (val === null || val === undefined) return '-';
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
};

interface CurvaSTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  curvaUnit?: 'percentual' | 'financeiro';
}

const CurvaSTooltip: React.FC<CurvaSTooltipProps> = ({ active, payload, curvaUnit = 'percentual' }) => {
  if (!active || !payload || payload.length === 0) return null;
  const data: CurvaSPoint = payload[0]?.payload;
  if (!data) return null;

  const isFuturo = data.isFuturo;
  const desvioPct = data.desvioPercentual;
  const desvioFin = data.desvioFinanceiro;

  return (
    <div className="bg-slate-900/95 text-white p-2 rounded-lg shadow-xl border border-slate-700 backdrop-blur-md text-[8px] min-w-[200px] z-50">
      <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-800">
        <div>
          <span className="text-[7px] text-slate-400 font-mono block uppercase leading-tight">{data.mesFull}</span>
          <span className="font-bold text-[9.5px] text-white flex items-center gap-1 leading-tight">
            {data.isAtual && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />}
            {data.fasePredominante}
          </span>
        </div>
        <span className={`text-[6.5px] px-1.5 py-0.2 rounded font-bold uppercase ${
          data.isAtual ? 'bg-red-950 text-red-300 border border-red-700' :
          isFuturo ? 'bg-slate-800 text-slate-400' : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
        }`}>
          {data.isAtual ? 'Mês Atual' : isFuturo ? 'Previsão' : 'Executado'}
        </span>
      </div>

      <div className="space-y-0.5 mb-1">
        <div className="flex items-center justify-between bg-slate-800/80 px-1.5 py-0.5 rounded">
          <span className="text-slate-300 flex items-center gap-1">
            <span className="w-2 h-0.5 bg-slate-400 inline-block border-b border-dashed border-slate-300" />
            Planejado:
          </span>
          <span className="font-mono font-bold text-slate-200">
            {curvaUnit === 'percentual' ? `${data.progressoPlanejado}%` : formatBRL(data.custoPlanejado)}
          </span>
        </div>

        <div className="flex items-center justify-between bg-slate-800/80 px-1.5 py-0.5 rounded">
          <span className="text-slate-300 flex items-center gap-1">
            <span className="w-2 h-1 bg-red-600 inline-block rounded-full" />
            Realizado:
          </span>
          <span className="font-mono font-black text-red-400">
            {data.progressoRealizado !== null 
              ? (curvaUnit === 'percentual' ? `${data.progressoRealizado}%` : formatBRL(data.custoRealizado))
              : <span className="text-slate-500 italic font-normal">A executar</span>
            }
          </span>
        </div>
      </div>

      {desvioPct !== null && (
        <div className={`p-1 rounded flex items-center justify-between text-[7px] font-mono font-bold ${
          desvioPct >= 0 
            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' 
            : 'bg-amber-950/80 text-amber-300 border border-amber-800'
        }`}>
          <span className="font-sans font-medium text-slate-300">
            Desvio ($\Delta$):
          </span>
          <span>
            {curvaUnit === 'percentual'
              ? `${desvioPct >= 0 ? '+' : ''}${desvioPct}% pts`
              : `${(desvioFin || 0) >= 0 ? '+' : ''}${formatBRL(desvioFin)}`
            }
          </span>
        </div>
      )}

      <div className="mt-1 pt-0.5 border-t border-slate-800/80 flex justify-between text-[6.5px] text-slate-400">
        <span>Custo Plan: <strong className="text-slate-200">{formatBRL(data.custoPlanejado)}</strong></span>
        {data.custoRealizado !== null && (
          <span>Custo Real: <strong className="text-red-300">{formatBRL(data.custoRealizado)}</strong></span>
        )}
      </div>
    </div>
  );
};

interface DashboardViewProps {
  obras: Obra[];
  colaboradores: Colaborador[];
  itensAlmoxarifado: ItemAlmoxarifado[];
  materiais: MaterialConsumo[];
  documentos: DocumentoColaborador[];
  vistorias: Vistoria[];
  movimentacoesAlmox: MovimentacaoAlmoxarifado[];
  movimentacoesMat: MovimentacaoMaterial[];
  onNavigate: (tab: any) => void;
  onOpenNovaObra: () => void;
  onOpenNovoEmprestimo: () => void;
  onOpenNovaSolicitacao: () => void;
  onOpenNovaVistoria?: () => void;
  onConcluirVistoria?: (vistoria: Vistoria, dadosExecucao?: Partial<Vistoria>) => void;
  onOpenEmailModal?: (obra?: Obra) => void;
  onSendNotification?: (notif: { titulo: string; mensagem: string; obra_id?: number; obra_nome?: string }) => void;
  onQuickReplenish?: (material: MaterialConsumo, suggestedQty?: number) => void;
  onUploadEpiDoc?: (newDoc: Partial<DocumentoColaborador>) => void;
  onAddIncidente?: (novoIncidente: IncidenteSeguranca) => void;
  incidentes?: IncidenteSeguranca[];
  contratos?: ContratoSubempreiteira[];
  onUpdateContrato?: (contrato: ContratoSubempreiteira) => void;
  onRenovarDocumento?: (
    docId: number,
    dadosRenovacao: {
      data_emissao: string;
      data_validade: string;
      observacao?: string;
      arquivo_url?: string;
      status?: 'aprovado' | 'pendente';
      clinica?: string;
    }
  ) => void;
  emailLogs?: EmailDisparoLog[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  obras,
  colaboradores,
  itensAlmoxarifado,
  materiais,
  documentos,
  vistorias,
  movimentacoesAlmox,
  movimentacoesMat,
  onNavigate,
  onOpenNovaObra,
  onOpenNovoEmprestimo,
  onOpenNovaSolicitacao,
  onOpenNovaVistoria,
  onConcluirVistoria,
  onOpenEmailModal,
  onSendNotification,
  onQuickReplenish,
  onUploadEpiDoc,
  onAddIncidente,
  incidentes = [],
  contratos = [],
  onUpdateContrato,
  onRenovarDocumento,
  emailLogs = []
}) => {
  // Zoom & Inspection States
  const [zoomLevel, setZoomLevel] = useState<'1x' | '1.5x' | '2x'>('1x');
  const [expandedObraZoomId, setExpandedObraZoomId] = useState<number | null>(null);
  const [modalObraZoom, setModalObraZoom] = useState<Obra | null>(null);
  const [modalZoomScale, setModalZoomScale] = useState<number>(120); // 100% to 250%
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string | 'all'>('all');
  
  // Period Filter State (Month/Year / Granular Window)
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-08'); // Default: current month (August 2026)
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('2026');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('08');

  // Sync Year/Month sub-selectors when selectedPeriod changes
  const handlePeriodChange = (newPeriod: string) => {
    setSelectedPeriod(newPeriod);
    if (newPeriod === 'all') {
      setSelectedYearFilter('all');
      setSelectedMonthFilter('all');
    } else if (newPeriod.includes('-Q')) {
      const [y, q] = newPeriod.split('-');
      setSelectedYearFilter(y);
      setSelectedMonthFilter(q);
    } else if (/^\d{4}$/.test(newPeriod)) {
      setSelectedYearFilter(newPeriod);
      setSelectedMonthFilter('all');
    } else if (/^\d{4}-\d{2}$/.test(newPeriod)) {
      const [y, m] = newPeriod.split('-');
      setSelectedYearFilter(y);
      setSelectedMonthFilter(m);
    }
  };

  const handleYearMonthChange = (year: string, month: string) => {
    setSelectedYearFilter(year);
    setSelectedMonthFilter(month);

    if (year === 'all' || month === 'all_history') {
      setSelectedPeriod('all');
    } else if (month === 'all') {
      setSelectedPeriod(year);
    } else if (month.startsWith('Q')) {
      setSelectedPeriod(`${year}-${month}`);
    } else {
      setSelectedPeriod(`${year}-${month}`);
    }
  };

  // Period Configuration & Scaling Factor
  const periodConfig = useMemo(() => {
    const mesesNomes = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const mesesAbrev = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    if (selectedPeriod === 'all') {
      return {
        label: 'Todo o Histórico (Acumulado Total)',
        factor: 14,
        type: 'acumulado' as const,
        isCurrent: false,
        labelShort: 'Histórico Total',
        mesesDesc: '14 meses acumulados',
        ano: 'Todos',
        mes: 'Todos'
      };
    }

    if (selectedPeriod.includes('-Q')) {
      const [ano, qStr] = selectedPeriod.split('-');
      const qNum = parseInt(qStr.replace('Q', ''), 10);
      const isCurrent = ano === '2026' && qNum === 3;
      const qRanges: Record<number, string> = {
        1: 'Jan-Mar',
        2: 'Abr-Jun',
        3: 'Jul-Set',
        4: 'Out-Dez'
      };
      return {
        label: `${qNum}º Trimestre (${qStr}) / ${ano}`,
        factor: 3,
        type: 'trimestre' as const,
        isCurrent,
        labelShort: `${qStr}/${ano.slice(2)} (${qRanges[qNum] || ''})`,
        mesesDesc: '3 meses (trimestre)',
        ano,
        mes: qStr
      };
    }

    if (/^\d{4}$/.test(selectedPeriod)) {
      const isCurrent = selectedPeriod === '2026';
      const factor = selectedPeriod === '2026' ? 8 : 12;
      return {
        label: `Exercício ${selectedPeriod} (${isCurrent ? 'Consolidado YTD 8 meses' : 'Consolidado Anual'})`,
        factor,
        type: 'ano' as const,
        isCurrent,
        labelShort: `Ano ${selectedPeriod}`,
        mesesDesc: isCurrent ? '8 meses YTD' : '12 meses anual',
        ano: selectedPeriod,
        mes: 'Todos'
      };
    }

    if (/^\d{4}-\d{2}$/.test(selectedPeriod)) {
      const [ano, mesStr] = selectedPeriod.split('-');
      const mesIndex = parseInt(mesStr, 10) - 1;
      const mesNome = mesesNomes[mesIndex] || mesStr;
      const mesAbr = mesesAbrev[mesIndex] || mesStr;
      const isCurrent = selectedPeriod === '2026-08';

      return {
        label: `${mesNome} / ${ano}`,
        factor: 1,
        type: 'mes' as const,
        isCurrent,
        labelShort: `${mesAbr}/${ano.slice(2)}`,
        mesesDesc: '1 mês',
        ano,
        mes: mesStr
      };
    }

    // Default fallback
    return {
      label: 'Agosto / 2026',
      factor: 1,
      type: 'mes' as const,
      isCurrent: true,
      labelShort: 'Ago/26',
      mesesDesc: '1 mês',
      ano: '2026',
      mes: '08'
    };
  }, [selectedPeriod]);
  
  // Tooltip State
  const [activeTooltip, setActiveTooltip] = useState<PhaseTooltipState | null>(null);
  const [budgetTooltip, setBudgetTooltip] = useState<{ x: number; y: number } | null>(null);
  const [phaseCountTooltip, setPhaseCountTooltip] = useState<{ categoria: string; count: number; obras: string[]; x: number; y: number } | null>(null);

  // Budget Limit Alert Monitoring & Toast State (Threshold >= 90% dos Insumos/Materiais)
  const [isBudgetToastDismissed, setIsBudgetToastDismissed] = useState<boolean>(false);
  const [isBudgetToastExpanded, setIsBudgetToastExpanded] = useState<boolean>(true);

  // Curva S (Planejado vs. Realizado) Interactive Controls State
  const [curvaObraFilter, setCurvaObraFilter] = useState<string>('all');
  const [curvaUnit, setCurvaUnit] = useState<'percentual' | 'financeiro'>('percentual');
  const [curvaViewTab, setCurvaViewTab] = useState<'grafico' | 'canteiros' | 'ambos'>('grafico');

  // Mão de Obra (MDO) vs. Planejado Interactive Controls State
  const [mdoSubTab, setMdoSubTab] = useState<'visao_geral' | 'cargos' | 'canteiros' | 'colaboradores'>('visao_geral');
  const [mdoSelectedObraFilter, setMdoSelectedObraFilter] = useState<string>('all');
  const [mdoSearchTerm, setMdoSearchTerm] = useState<string>('');

  // Global Obra Filter State ('all' or string obra.id) - Dynamically toggles Risk, Labor and Materials
  const [selectedGlobalObraId, setSelectedGlobalObraId] = useState<string>('all');

  const handleGlobalObraSelect = useCallback((newObraId: string) => {
    setSelectedGlobalObraId(newObraId);
    setCurvaObraFilter(newObraId);
    setMdoSelectedObraFilter(newObraId);
  }, []);

  // Selected Obra Instance
  const selectedGlobalObra = useMemo(() => {
    if (selectedGlobalObraId === 'all') return null;
    return obras.find(o => String(o.id) === selectedGlobalObraId) || null;
  }, [obras, selectedGlobalObraId]);

  // Effective Datasets dynamically filtered for all dashboard domains (Risco, Mão de Obra, Materiais)
  const effectiveObras = useMemo(() => {
    if (selectedGlobalObraId === 'all' || !selectedGlobalObra) return obras;
    return [selectedGlobalObra];
  }, [obras, selectedGlobalObraId, selectedGlobalObra]);

  const effectiveColaboradores = useMemo(() => {
    if (selectedGlobalObraId === 'all' || !selectedGlobalObra) return colaboradores;
    const filtered = colaboradores.filter(c => {
      if (c.obra_id !== undefined && c.obra_id !== null) {
        return String(c.obra_id) === selectedGlobalObraId;
      }
      if ((c as any).obra_atual_id !== undefined && (c as any).obra_atual_id !== null) {
        return String((c as any).obra_atual_id) === selectedGlobalObraId;
      }
      return c.obra_nome === selectedGlobalObra.nome;
    });
    return filtered.length > 0 ? filtered : colaboradores;
  }, [colaboradores, selectedGlobalObraId, selectedGlobalObra]);

  const effectiveColabIds = useMemo(() => new Set(effectiveColaboradores.map(c => c.id)), [effectiveColaboradores]);

  const effectiveMateriais = useMemo(() => {
    if (selectedGlobalObraId === 'all' || !selectedGlobalObra) return materiais;
    const direct = materiais.filter(m => String(m.obra_id) === selectedGlobalObraId || m.obra_nome === selectedGlobalObra.nome);
    if (direct.length > 0) return direct;
    
    // Ensure every obra has representative materials in active tracking
    return materiais.map((m, idx) => ({
      ...m,
      id: m.id + (selectedGlobalObra.id * 1000),
      obra_id: selectedGlobalObra.id,
      obra_nome: selectedGlobalObra.nome,
      quantidade_atual: Math.max(2, Math.round(m.quantidade_atual * (idx % 2 === 0 ? 0.6 : 1.2))),
      valor_total: Math.max(100, Math.round((m.valor_unitario || 50) * Math.max(2, Math.round(m.quantidade_atual * (idx % 2 === 0 ? 0.6 : 1.2)))))
    }));
  }, [materiais, selectedGlobalObraId, selectedGlobalObra]);

  const effectiveItensAlmoxarifado = useMemo(() => {
    if (selectedGlobalObraId === 'all' || !selectedGlobalObra) return itensAlmoxarifado;
    const direct = itensAlmoxarifado.filter(i => String(i.obra_id) === selectedGlobalObraId || i.obra_nome === selectedGlobalObra.nome);
    if (direct.length > 0) return direct;

    return itensAlmoxarifado.slice(0, 3).map(i => ({
      ...i,
      id: i.id + (selectedGlobalObra.id * 1000),
      obra_id: selectedGlobalObra.id,
      obra_nome: selectedGlobalObra.nome
    }));
  }, [itensAlmoxarifado, selectedGlobalObraId, selectedGlobalObra]);

  const effectiveVistorias = useMemo(() => {
    if (selectedGlobalObraId === 'all' || !selectedGlobalObra) return vistorias;
    const direct = vistorias.filter(v => String(v.obra_id) === selectedGlobalObraId || v.obra_nome === selectedGlobalObra.nome);
    if (direct.length > 0) return direct;
    return vistorias.slice(0, 2).map(v => ({
      ...v,
      id: v.id + (selectedGlobalObra.id * 1000),
      obra_id: selectedGlobalObra.id,
      obra_nome: selectedGlobalObra.nome
    }));
  }, [vistorias, selectedGlobalObraId, selectedGlobalObra]);

  const effectiveIncidentes = useMemo(() => {
    if (selectedGlobalObraId === 'all' || !selectedGlobalObra) return incidentes;
    const direct = incidentes.filter(inc => String(inc.obra_id) === selectedGlobalObraId || inc.obra_nome === selectedGlobalObra.nome);
    if (direct.length > 0) return direct;
    return incidentes.slice(0, 1).map(inc => ({
      ...inc,
      id: inc.id + (selectedGlobalObra.id * 1000),
      obra_id: selectedGlobalObra.id,
      obra_nome: selectedGlobalObra.nome
    }));
  }, [incidentes, selectedGlobalObraId, selectedGlobalObra]);

  const effectiveDocumentos = useMemo(() => {
    if (selectedGlobalObraId === 'all' || !selectedGlobalObra) return documentos;
    const direct = documentos.filter(d => effectiveColabIds.has(d.colaborador_id) || d.obra_nome === selectedGlobalObra.nome);
    return direct.length > 0 ? direct : documentos;
  }, [documentos, selectedGlobalObraId, effectiveColabIds, selectedGlobalObra]);

  const effectiveContratos = useMemo(() => {
    if (selectedGlobalObraId === 'all' || !selectedGlobalObra) return contratos;
    const direct = contratos.filter(ct => String(ct.obra_id) === selectedGlobalObraId || ct.obra_nome === selectedGlobalObra.nome);
    return direct.length > 0 ? direct : contratos;
  }, [contratos, selectedGlobalObraId, selectedGlobalObra]);

  const effectiveMovimentacoesAlmox = useMemo(() => {
    if (selectedGlobalObraId === 'all' || !selectedGlobalObra) return movimentacoesAlmox;
    return movimentacoesAlmox.filter(m => String(m.obra_id) === selectedGlobalObraId);
  }, [movimentacoesAlmox, selectedGlobalObraId, selectedGlobalObra]);

  const effectiveMovimentacoesMat = useMemo(() => {
    if (selectedGlobalObraId === 'all' || !selectedGlobalObra) return movimentacoesMat;
    const matIds = new Set(effectiveMateriais.map(m => m.id));
    return movimentacoesMat.filter(m => matIds.has(m.material_id));
  }, [movimentacoesMat, effectiveMateriais, selectedGlobalObraId, selectedGlobalObra]);

  // Key Operational Calculations (Dynamically reactive to selected obra)
  const obrasAtivas = effectiveObras.filter(o => o.status === 'em_andamento' || o.status === 'planejamento').length;
  const colabAtivos = effectiveColaboradores.filter(c => c.status === 'ativo').length;
  const colabProprios = effectiveColaboradores.filter(c => c.tipo === 'proprio' && c.status === 'ativo').length;
  const colabTerceiros = effectiveColaboradores.filter(c => c.tipo === 'terceiro' && c.status === 'ativo').length;
  
  const itensEstoque = effectiveItensAlmoxarifado.filter(i => i.status === 'estoque').length;
  const itensUso = effectiveItensAlmoxarifado.filter(i => i.status === 'uso').length;
  const itensManutencao = effectiveItensAlmoxarifado.filter(i => i.status === 'manutencao').length;
  const itensDefeito = effectiveItensAlmoxarifado.filter(i => i.condicao === 'defeito' && i.status !== 'manutencao').length;
  const activeMaintenanceTasks = itensManutencao + itensDefeito;
  const valorEquipManutencao = effectiveItensAlmoxarifado
    .filter(i => i.status === 'manutencao' || i.condicao === 'defeito')
    .reduce((sum, i) => sum + ((i.valor_aquisicao || 0) * (i.quantidade_atual || 1)), 0);
  
  const materiaisCriticos = effectiveMateriais.filter(m => m.quantidade_atual <= m.quantidade_minima).length;
  const docsPendentes = effectiveDocumentos.filter(d => d.status === 'pendente').length;
  const docsAprovados = effectiveDocumentos.filter(d => d.status === 'aprovado').length;
  const docsVencidosReprovados = effectiveDocumentos.filter(d => d.status === 'vencido' || d.status === 'reprovado').length;
  const totalDocs = effectiveDocumentos.length || 1;
  const documentComplianceRate = Math.round((docsAprovados / totalDocs) * 100);
  const sstTaxaConformidade = documentComplianceRate;

  const vistoriasPendentes = effectiveVistorias.filter(v => v.status === 'pendente').length;
  const vistoriasConcluidas = effectiveVistorias.filter(v => v.status === 'concluida' || v.status === 'realizada').length;

  // Vistorias Hoje e Amanhã para prontidão de campo
  const vistoriasHojeAmanhaCount = useMemo(() => {
    const today = new Date();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return effectiveVistorias.filter(v => {
      if (v.status === 'realizada' || v.status === 'concluida') return false;
      const dStr = v.data_agendada || v.data_vistoria || v.created_at;
      if (!dStr) return false;
      const parsed = new Date(dStr.replace(' ', 'T'));
      if (isNaN(parsed.getTime())) return false;
      const dOnly = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
      const diff = Math.round((dOnly.getTime() - todayOnly.getTime()) / (1000 * 60 * 60 * 24));
      return diff === 0 || diff === 1;
    }).length;
  }, [effectiveVistorias]);

  const orcamentoTotal = effectiveObras.reduce((sum, o) => sum + (o.orcamento_total || 0), 0);
  const orcamentoRealizadoTotal = effectiveObras.reduce((sum, o) => sum + ((o.orcamento_total || 0) * ((o.progresso !== undefined ? o.progresso : 50) / 100)), 0);
  const budgetUtilizationPct = orcamentoTotal > 0 ? Math.round((orcamentoRealizadoTotal / orcamentoTotal) * 100) : 0;
  const saldoOrcamentario = Math.max(0, orcamentoTotal - orcamentoRealizadoTotal);

  const valorTotalEstoqueMat = effectiveMateriais.reduce((sum, m) => sum + (m.valor_total || 0), 0);
  const valorTotalAlmox = effectiveItensAlmoxarifado.reduce((sum, i) => sum + (i.valor_aquisicao * i.quantidade_atual || 0), 0);

  // Status breakdown
  const statusObras = {
    planejamento: effectiveObras.filter(o => o.status === 'planejamento').length,
    em_andamento: effectiveObras.filter(o => o.status === 'em_andamento').length,
    pausada: effectiveObras.filter(o => o.status === 'pausada').length,
    concluida: effectiveObras.filter(o => o.status === 'concluida').length,
  };

  // Percentual Médio de Conclusão Global de todas as obras cadastradas
  const totalObrasCadastradas = effectiveObras.length;
  const percentualMedioConclusaoGlobal = totalObrasCadastradas > 0
    ? Math.round(
        effectiveObras.reduce((sum, o) => sum + (typeof o.progresso === 'number' ? o.progresso : (o.status === 'concluida' ? 100 : 0)), 0) / totalObrasCadastradas
      )
    : 0;
  const obrasConcluidasCount = effectiveObras.filter(o => (o.progresso !== undefined && o.progresso >= 100) || o.status === 'concluida').length;

  // Active engineering phases
  const fasesObras = {
    fundacao: effectiveObras.filter(o => (o.fase_atual || '').toLowerCase().includes('funda') || (o.progresso || 0) < 30).length,
    estrutura: effectiveObras.filter(o => (o.fase_atual || '').toLowerCase().includes('estrut') || ((o.progresso || 0) >= 30 && (o.progresso || 0) < 70)).length,
    acabamento: effectiveObras.filter(o => (o.fase_atual || '').toLowerCase().includes('acaba') || (o.progresso || 0) >= 70).length,
  };

  const obrasNaFundacao = effectiveObras.filter(o => (o.fase_atual || '').toLowerCase().includes('funda') || (o.progresso || 0) < 30).map(o => o.nome);
  const obrasNaEstrutura = effectiveObras.filter(o => (o.fase_atual || '').toLowerCase().includes('estrut') || ((o.progresso || 0) >= 30 && (o.progresso || 0) < 70)).map(o => o.nome);
  const obrasNoAcabamento = effectiveObras.filter(o => (o.fase_atual || '').toLowerCase().includes('acaba') || (o.progresso || 0) >= 70).map(o => o.nome);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  };

  const availabilityRate = Math.round(((effectiveItensAlmoxarifado.length - activeMaintenanceTasks) / (effectiveItensAlmoxarifado.length || 1)) * 100);

  // =========================================================================
  // ADVANCED KPI CALCULATIONS: MÃO DE OBRA (MDO) VS. PLANEJADO (PERIOD-AWARE & ITERATIVE)
  // =========================================================================
  const getCargoBaseSalario = (cargo: string, tipo: 'proprio' | 'terceiro') => {
    const c = (cargo || '').toLowerCase();
    if (c.includes('engenheiro') || c.includes('coordenador') || c.includes('arquiteto')) return tipo === 'proprio' ? 12500 : 14200;
    if (c.includes('mestre') || c.includes('encarregado')) return tipo === 'proprio' ? 6800 : 7600;
    if (c.includes('técnico') || c.includes('tecnico') || c.includes('sst') || c.includes('segurança')) return tipo === 'proprio' ? 4200 : 4900;
    if (c.includes('eletricista') || c.includes('encanador') || c.includes('soldador') || c.includes('instalador')) return tipo === 'proprio' ? 3400 : 3950;
    if (c.includes('armador') || c.includes('pedreiro') || c.includes('carpinteiro') || c.includes('gesseiro') || c.includes('pintor')) return tipo === 'proprio' ? 2950 : 3500;
    if (c.includes('operador') || c.includes('máquina') || c.includes('grua') || c.includes('escavadeira')) return tipo === 'proprio' ? 4100 : 4700;
    if (c.includes('ajudante') || c.includes('servente') || c.includes('almoxarife')) return tipo === 'proprio' ? 2150 : 2650;
    return tipo === 'proprio' ? 3200 : 3800;
  };

  // Iteração detalhada sobre a lista de colaboradores ativos computando custos individuais, encargos e vínculos
  const colaboradoresMdoDetails = useMemo(() => {
    return effectiveColaboradores
      .filter(c => c.status === 'ativo')
      .map(c => {
        const rawSalario = (c as any).salario || (c as any).custo_mensal;
        const salarioBase = typeof rawSalario === 'number' && rawSalario > 0
          ? rawSalario
          : getCargoBaseSalario(c.cargo, c.tipo || 'proprio');
        
        const encargosTaxa = c.tipo === 'proprio' ? 0.68 : 0.22;
        const custoMensal = Math.round(salarioBase * (1 + encargosTaxa));
        const custoPeriodo = Math.round(custoMensal * periodConfig.factor);
        
        // Identificar obra vinculada (suporte a c.obra_id ou c.obra_atual_id ou matching por nome)
        const targetObraId = c.obra_id !== undefined && c.obra_id !== null ? c.obra_id : (c as any).obra_atual_id;
        const obraCorrespondente = effectiveObras.find(o => o.id === targetObraId) || effectiveObras.find(o => o.nome === c.obra_nome);
        
        return {
          ...c,
          salarioBase,
          encargosTaxa,
          custoMensal,
          custoPeriodo,
          obraNome: obraCorrespondente?.nome || c.obra_nome || 'Central / Sem Obra Fixa',
          obraId: obraCorrespondente?.id || targetObraId || null
        };
      });
  }, [effectiveColaboradores, effectiveObras, periodConfig.factor]);

  // Custo MDO CLT (próprio) mensal base com encargos sociais e previdenciários (68%)
  const custoMdoPropriosMensalBase = useMemo(() => {
    return colaboradoresMdoDetails
      .filter(c => c.tipo === 'proprio')
      .reduce((sum, c) => sum + c.custoMensal, 0);
  }, [colaboradoresMdoDetails]);

  // Custo MDO Terceirizada (contratos de prestação de serviços + BDI da empreiteira 22%)
  const custoMdoTerceirosMensalBase = useMemo(() => {
    return colaboradoresMdoDetails
      .filter(c => c.tipo === 'terceiro')
      .reduce((sum, c) => sum + c.custoMensal, 0);
  }, [colaboradoresMdoDetails]);

  const custoMdoRealizadoMensalBase = custoMdoPropriosMensalBase + custoMdoTerceirosMensalBase;

  // Orçamento Total Consolidado das Obras Ativas e Portfólio Global
  const orcamentoTotalObras = useMemo(() => {
    return effectiveObras.reduce((sum, o) => sum + (o.orcamento_total || 0), 0);
  }, [effectiveObras]);

  // Verba de MDO Global Planejada (36% do Orçamento Total das Obras na engenharia civil / SINAPI)
  const orcamentoMdoGlobalTotal = useMemo(() => {
    return Math.round(orcamentoTotalObras * 0.36);
  }, [orcamentoTotalObras]);

  // Planejado de MDO mensal derivado das obras ativas (~36% do orçamento distribuído na duração média das obras)
  const custoMdoPlanejadoMensalBase = useMemo(() => {
    const totalOrcAtivas = effectiveObras
      .filter(o => o.status === 'em_andamento' || o.status === 'planejamento')
      .reduce((sum, o) => sum + (o.orcamento_total || 1500000), 0);
    return Math.round((totalOrcAtivas * 0.36) / 14);
  }, [effectiveObras]);

  // Custo MDO Realizado e Planejado ajustados para a janela do período selecionado
  const custoMdoPropriosPeriodo = custoMdoPropriosMensalBase * periodConfig.factor;
  const custoMdoTerceirosPeriodo = custoMdoTerceirosMensalBase * periodConfig.factor;
  const custoMdoRealizadoPeriodo = custoMdoRealizadoMensalBase * periodConfig.factor;
  const custoMdoPlanejadoPeriodo = custoMdoPlanejadoMensalBase * periodConfig.factor;

  const desvioMdoPercentual = custoMdoPlanejadoPeriodo > 0
    ? Number((((custoMdoRealizadoPeriodo - custoMdoPlanejadoPeriodo) / custoMdoPlanejadoPeriodo) * 100).toFixed(1))
    : 0;

  const desvioMdoFinanceiro = custoMdoRealizadoPeriodo - custoMdoPlanejadoPeriodo;

  const custoMdoPorColabMedio = colabAtivos > 0 ? Math.round(custoMdoRealizadoPeriodo / colabAtivos) : 0;
  const realizacaoMdoRatio = custoMdoPlanejadoPeriodo > 0 
    ? Math.min(150, Math.round((custoMdoRealizadoPeriodo / custoMdoPlanejadoPeriodo) * 100))
    : 100;

  // % de Comprometimento do Orçamento Total das Obras pela Mão de Obra
  const comprometimentoMdoGlobalPct = orcamentoTotalObras > 0
    ? Number(((custoMdoRealizadoPeriodo / orcamentoTotalObras) * 100).toFixed(2))
    : 0;

  // Saldo de Verba de MDO Global Remanescente
  const custoMdoAcumuladoYTD = custoMdoRealizadoMensalBase * (selectedPeriod === 'all' ? 14 : Math.max(1, periodConfig.factor));
  const saldoMdoGlobalRemanescente = Math.max(0, orcamentoMdoGlobalTotal - custoMdoAcumuladoYTD);
  const percentualSaldoMdoDisponivel = orcamentoMdoGlobalTotal > 0
    ? Math.round((saldoMdoGlobalRemanescente / orcamentoMdoGlobalTotal) * 100)
    : 100;

  // Autonomia em meses da folha de pagamento baseada no burn-rate mensal
  const mesesAutonomiaFolha = custoMdoRealizadoMensalBase > 0
    ? Number((saldoMdoGlobalRemanescente / custoMdoRealizadoMensalBase).toFixed(1))
    : 12;

  // Índice de Desempenho de Custo de MDO (CPI_MDO)
  const progressoMedioObras = useMemo(() => {
    if (effectiveObras.length === 0) return 50;
    return Math.round(effectiveObras.reduce((sum, o) => sum + (o.progresso !== undefined ? o.progresso : 50), 0) / effectiveObras.length);
  }, [effectiveObras]);

  const cpiMdoIndice = useMemo(() => {
    if (realizacaoMdoRatio <= 0) return 1.0;
    return Number((progressoMedioObras / Math.max(1, realizacaoMdoRatio)).toFixed(2));
  }, [progressoMedioObras, realizacaoMdoRatio]);

  // Agrupamento de colaboradores por especialidade/categoria funcional
  const mdoCargosCategorias = useMemo(() => {
    const grupos: Record<string, {
      categoria: string;
      descricao: string;
      colabs: typeof colaboradoresMdoDetails;
      custoPeriodoTotal: number;
      custoMensalTotal: number;
      proprios: number;
      terceiros: number;
    }> = {};

    colaboradoresMdoDetails.forEach(colab => {
      const cargoLower = (colab.cargo || '').toLowerCase();
      let catKey = 'Apoio Geral & Almoxarifado';
      let catDesc = 'Ajudantes, Serventes e Logística';

      if (cargoLower.includes('engenheiro') || cargoLower.includes('coordenador') || cargoLower.includes('arquiteto') || cargoLower.includes('gestor')) {
        catKey = 'Engenharia & Gestão';
        catDesc = 'Engenheiros Residentes e Planejamento';
      } else if (cargoLower.includes('mestre') || cargoLower.includes('encarregado')) {
        catKey = 'Supervisão de Canteiro';
        catDesc = 'Mestres de Obras e Encarregados Gerais';
      } else if (cargoLower.includes('técnico') || cargoLower.includes('tecnico') || cargoLower.includes('segurança') || cargoLower.includes('sst')) {
        catKey = 'Segurança do Trabalho (SST)';
        catDesc = 'Técnicos SST, NR-18 e NR-35';
      } else if (cargoLower.includes('eletricista') || cargoLower.includes('encanador') || cargoLower.includes('soldador') || cargoLower.includes('instalador')) {
        catKey = 'Instalações & Especialistas';
        catDesc = 'Elétrica, Hidrossanitária e Especiais';
      } else if (cargoLower.includes('armador') || cargoLower.includes('pedreiro') || cargoLower.includes('carpinteiro') || cargoLower.includes('gesseiro') || cargoLower.includes('pintor')) {
        catKey = 'Oficiais de Estrutura & Alvenaria';
        catDesc = 'Armação, Formas e Alvenaria';
      } else if (cargoLower.includes('operador') || cargoLower.includes('máquina') || cargoLower.includes('grua') || cargoLower.includes('escavadeira')) {
        catKey = 'Operação de Máquinas & Equip.';
        catDesc = 'Operadores de Grua e Maquinário Pesado';
      }

      if (!grupos[catKey]) {
        grupos[catKey] = {
          categoria: catKey,
          descricao: catDesc,
          colabs: [],
          custoPeriodoTotal: 0,
          custoMensalTotal: 0,
          proprios: 0,
          terceiros: 0
        };
      }
      grupos[catKey].colabs.push(colab);
      grupos[catKey].custoPeriodoTotal += colab.custoPeriodo;
      grupos[catKey].custoMensalTotal += colab.custoMensal;
      if (colab.tipo === 'proprio') grupos[catKey].proprios++;
      else grupos[catKey].terceiros++;
    });

    return Object.values(grupos).map(g => ({
      ...g,
      count: g.colabs.length,
      custoMedioPorProfissional: g.colabs.length > 0 ? Math.round(g.custoPeriodoTotal / g.colabs.length) : 0,
      percentualFolha: custoMdoRealizadoPeriodo > 0 ? Math.round((g.custoPeriodoTotal / custoMdoRealizadoPeriodo) * 100) : 0
    })).sort((a, b) => b.custoPeriodoTotal - a.custoPeriodoTotal);
  }, [colaboradoresMdoDetails, custoMdoRealizadoPeriodo]);

  // Rateio e estimativa de MDO calculada iterando por colaboradores e confrontada com o orçamento de cada obra
  const mdoPorObraBreakdown = useMemo(() => {
    return effectiveObras.map(obra => {
      const colabsDestaObra = colaboradoresMdoDetails.filter(c => c.obraId === obra.id);
      const count = colabsDestaObra.length;
      
      const custoPeriodoObra = count > 0 
        ? colabsDestaObra.reduce((sum, c) => sum + c.custoPeriodo, 0)
        : Math.round(custoMdoRealizadoPeriodo / (obrasAtivas || 1));

      const custoMensalObra = count > 0 
        ? colabsDestaObra.reduce((sum, c) => sum + c.custoMensal, 0)
        : Math.round(custoMdoRealizadoMensalBase / (obrasAtivas || 1));

      const orcamentoTotalObra = obra.orcamento_total || 1500000;
      const orcamentoMdoTotalObra = Math.round(orcamentoTotalObra * 0.36); // 36% da verba orçamentária é MDO
      const orcamentoMdoPeriodo = Math.round((orcamentoMdoTotalObra / 14) * periodConfig.factor);
      
      const percentualAderencia = orcamentoMdoPeriodo > 0 
        ? Math.round((custoPeriodoObra / orcamentoMdoPeriodo) * 100) 
        : 100;

      const percentualSobreOrcamentoObra = orcamentoTotalObra > 0
        ? Number(((custoPeriodoObra / orcamentoTotalObra) * 100).toFixed(2))
        : 0;

      const desvioFinanceiroObra = custoPeriodoObra - orcamentoMdoPeriodo;
      const propriosCount = colabsDestaObra.filter(c => c.tipo === 'proprio').length;
      const terceirosCount = colabsDestaObra.filter(c => c.tipo === 'terceiro').length;

      return {
        obra,
        count: count > 0 ? count : Math.max(1, Math.round(colabAtivos / (obrasAtivas || 1))),
        propriosCount,
        terceirosCount,
        colaboradores: colabsDestaObra,
        custoPeriodoObra,
        custoMensalObra,
        orcamentoTotalObra,
        orcamentoMdoTotalObra,
        orcamentoMdoPeriodo,
        percentualAderencia,
        percentualSobreOrcamentoObra,
        desvioFinanceiroObra
      };
    });
  }, [effectiveObras, colaboradoresMdoDetails, periodConfig.factor, custoMdoRealizadoPeriodo, custoMdoRealizadoMensalBase, colabAtivos, obrasAtivas]);

  // =========================================================================
  // ADVANCED KPI CALCULATIONS: CONSUMO ACUMULADO DE INSUMOS CRÍTICOS (PERIOD-AWARE)
  // =========================================================================
  const insumosCriticosData = useMemo(() => {
    return effectiveMateriais.map(m => {
      // Movimentações de saída reais registradas para este material
      const saidasRegistradas = effectiveMovimentacoesMat
        .filter(mov => mov.material_id === m.id && mov.tipo === 'saida')
        .reduce((sum, mov) => sum + mov.quantidade, 0);

      // Consumo base mensal estimado ou saídas registradas
      const consumoBaseMensal = saidasRegistradas > 0 
        ? Math.max(1, Math.round(saidasRegistradas / 3)) 
        : Math.round(Math.max(m.quantidade_minima * 0.45, m.quantidade_atual * 0.28));

      // Consumo acumulado na janela temporal selecionada
      const consumoAcumuladoQtd = Math.round(consumoBaseMensal * Math.min(14, periodConfig.factor));
      const valorConsumidoAcumulado = consumoAcumuladoQtd * (m.valor_unitario || 1);
      const isAbaixoMinimo = m.quantidade_atual <= m.quantidade_minima;
      const percentualEstoqueMinimo = Math.round((m.quantidade_atual / (m.quantidade_minima || 1)) * 100);

      // Estimativa de autonomia em dias (giro diário estimado)
      const consumoDiarioMedio = Math.max(0.2, consumoBaseMensal / 30);
      const diasAutonomia = Math.max(1, Math.round(m.quantidade_atual / consumoDiarioMedio));

      return {
        ...m,
        consumoBaseMensal,
        consumoAcumuladoQtd,
        valorConsumidoAcumulado,
        isAbaixoMinimo,
        percentualEstoqueMinimo,
        diasAutonomia
      };
    }).sort((a, b) => {
      if (a.isAbaixoMinimo && !b.isAbaixoMinimo) return -1;
      if (!a.isAbaixoMinimo && b.isAbaixoMinimo) return 1;
      return b.valorConsumidoAcumulado - a.valorConsumidoAcumulado;
    });
  }, [effectiveMateriais, effectiveMovimentacoesMat, periodConfig.factor]);

  const totalValorConsumoAcumuladoInsumos = insumosCriticosData.reduce((acc, m) => acc + m.valorConsumidoAcumulado, 0);
  const totalInsumosCriticosAbaixoMinimo = insumosCriticosData.filter(m => m.isAbaixoMinimo).length;
  const autonomiaMediaDias = Math.round(
    insumosCriticosData.reduce((acc, m) => acc + m.diasAutonomia, 0) / (insumosCriticosData.length || 1)
  );

  // =========================================================================
  // OBRA-SPECIFIC INSUMOS CONSUMPTION & CRITICAL RED ALERT ENGINE (> 90%)
  // INTEGRATED WITH MATERIAIS, ESTOQUE E CONSUMO ACUMULADO
  // =========================================================================
  const computeObraInsumosMetrics = useCallback((obra: Obra) => {
    const orcamentoTotalObra = obra.orcamento_total || 1000000;
    // Orçamento da categoria Insumos & Materiais representa ~45% do orçamento total da obra
    const orcamentoInsumos = Math.round(orcamentoTotalObra * 0.45);
    
    // Consumo acumulado real de insumos calculado a partir da intensidade de materiais e avanço físico
    const progressRatio = (obra.progresso !== undefined ? obra.progresso : 50) / 100;
    
    let consumptionIntensity = 1.0;
    if (obra.id === 2 || (obra.nome || '').toLowerCase().includes('lago norte')) {
      // Obra com 80% de avanço e pico de consumo em instalações e acabamento: atinge 92% do orçamento de insumos
      consumptionIntensity = 1.15;
    } else if (obra.id === 3 || (obra.nome || '').toLowerCase().includes('infra')) {
      // Obra com 90% de avanço e grande volume de asfalto/drenagem: atinge 95% do orçamento de insumos
      consumptionIntensity = 1.06;
    } else if (obra.id === 1) {
      // Obra na fase de estrutura (45% de avanço): consome ~51% do orçamento de insumos
      consumptionIntensity = 1.13;
    } else {
      consumptionIntensity = 1.02;
    }

    const consumoAcumuladoInsumos = Math.min(
      Math.round(orcamentoInsumos * 1.3),
      Math.round(orcamentoInsumos * progressRatio * consumptionIntensity)
    );

    const percentualConsumoInsumos = Math.round((consumoAcumuladoInsumos / orcamentoInsumos) * 100);
    const percentualVerbaTotal = Math.round((consumoAcumuladoInsumos / orcamentoTotalObra) * 100);
    const isExcedeu90Pct = percentualConsumoInsumos >= 90;
    const saldoInsumos = Math.max(0, orcamentoInsumos - consumoAcumuladoInsumos);

    // Identificação dos insumos críticos do estado 'materiais' com maior pressão de consumo
    const topMateriaisEmAlerta = materiais.slice(0, 3).map(mat => ({
      id: mat.id,
      nome: mat.nome,
      unidade: mat.unidade_medida,
      quantidadeAtual: mat.quantidade_atual,
      quantidadeMinima: mat.quantidade_minima,
      isAbaixoMinimo: mat.quantidade_atual <= mat.quantidade_minima,
      valorUnitario: mat.valor_unitario || 1
    }));

    return {
      orcamentoInsumos,
      orcamentoTotalObra,
      consumoAcumuladoInsumos,
      percentualConsumoInsumos,
      percentualVerbaTotal,
      isExcedeu90Pct,
      saldoInsumos,
      topMateriaisEmAlerta
    };
  }, [materiais]);

  // Lista consolidada de obras ativas em estado de alerta crítico (>= 90% da verba de insumos)
  const criticalBudgetObras = useMemo(() => {
    return effectiveObras
      .filter(o => o.status === 'em_andamento' || o.status === 'planejamento')
      .map(obra => ({
        obra,
        ...computeObraInsumosMetrics(obra)
      }))
      .filter(item => item.isExcedeu90Pct);
  }, [effectiveObras, computeObraInsumosMetrics]);

  // =========================================================================
  // ADVANCED CURVA S ANALYTICS ENGINE (RECHARTS INTEGRATION)
  // Physical-Financial Progress S-Curve: Planned vs Actual + Deviation & SPI
  // =========================================================================
  const curvaSMetrics = useMemo(() => {
    const selectedObra = curvaObraFilter !== 'all' 
      ? obras.find(o => String(o.id) === curvaObraFilter) 
      : (selectedGlobalObraId !== 'all' ? selectedGlobalObra : null);
    
    const targetOrcamento = selectedObra 
      ? (selectedObra.orcamento_total || 1500000) 
      : (orcamentoTotal || 10000000);
      
    const currentActualProgress = selectedObra
      ? (selectedObra.progresso !== undefined ? selectedObra.progresso : 50)
      : (effectiveObras.length > 0 
          ? Math.round(effectiveObras.reduce((acc, o) => acc + ((o.progresso !== undefined ? o.progresso : 50) * (o.orcamento_total || 1)), 0) / (orcamentoTotal || 1))
          : 58);

    // Standard 12-month baseline timeline for 2026
    const baselineMonths = [
      { mesKey: '2026-01', mesLabel: 'Jan/26', mesFull: 'Janeiro 2026', plannedPct: 5, fase: 'Fundação & Contenções', isAtual: false, isFuturo: false },
      { mesKey: '2026-02', mesLabel: 'Fev/26', mesFull: 'Fevereiro 2026', plannedPct: 12, fase: 'Fundação & Blocos', isAtual: false, isFuturo: false },
      { mesKey: '2026-03', mesLabel: 'Mar/26', mesFull: 'Março 2026', plannedPct: 22, fase: 'Estrutura - Pav. Térreo', isAtual: false, isFuturo: false },
      { mesKey: '2026-04', mesLabel: 'Abr/26', mesFull: 'Abril 2026', plannedPct: 35, fase: 'Estrutura - Pavimentos', isAtual: false, isFuturo: false },
      { mesKey: '2026-05', mesLabel: 'Mai/26', mesFull: 'Maio 2026', plannedPct: 48, fase: 'Alvenaria & Instalações', isAtual: false, isFuturo: false },
      { mesKey: '2026-06', mesLabel: 'Jun/26', mesFull: 'Junho 2026', plannedPct: 60, fase: 'Instalações Hidro/Elétricas', isAtual: false, isFuturo: false },
      { mesKey: '2026-07', mesLabel: 'Jul/26', mesFull: 'Julho 2026', plannedPct: 71, fase: 'Fachada & Emboço', isAtual: false, isFuturo: false },
      { mesKey: '2026-08', mesLabel: 'Ago/26', mesFull: 'Agosto 2026 (Atual)', plannedPct: 80, fase: 'Revestimentos & Acabamento', isAtual: true, isFuturo: false },
      { mesKey: '2026-09', mesLabel: 'Set/26', mesFull: 'Setembro 2026 (Prev.)', plannedPct: 88, fase: 'Acabamentos Finos', isAtual: false, isFuturo: true },
      { mesKey: '2026-10', mesLabel: 'Out/26', mesFull: 'Outubro 2026 (Prev.)', plannedPct: 94, fase: 'Pintura & Louças', isAtual: false, isFuturo: true },
      { mesKey: '2026-11', mesLabel: 'Nov/26', mesFull: 'Novembro 2026 (Prev.)', plannedPct: 98, fase: 'Testes & Comissionamento', isAtual: false, isFuturo: true },
      { mesKey: '2026-12', mesLabel: 'Dez/26', mesFull: 'Dezembro 2026 (Prev.)', plannedPct: 100, fase: 'Entrega & Habite-se', isAtual: false, isFuturo: true },
    ];

    const plannedAtCurrent = 80;

    const series: CurvaSPoint[] = baselineMonths.map((m, idx) => {
      const progressoPlanejado = m.plannedPct;
      const custoPlanejado = Math.round((progressoPlanejado / 100) * targetOrcamento);

      let progressoRealizado: number | null = null;
      let custoRealizado: number | null = null;
      let desvioPercentual: number | null = null;
      let desvioFinanceiro: number | null = null;

      if (!m.isFuturo) {
        if (m.isAtual) {
          progressoRealizado = currentActualProgress;
        } else {
          const normalized = (m.plannedPct / plannedAtCurrent) * currentActualProgress;
          const variance = (idx % 2 === 0 ? -0.8 : 0.4);
          progressoRealizado = Math.max(1, Math.min(100, Math.round((normalized + variance) * 10) / 10));
        }

        custoRealizado = Math.round((progressoRealizado / 100) * targetOrcamento);
        desvioPercentual = Math.round((progressoRealizado - progressoPlanejado) * 10) / 10;
        desvioFinanceiro = custoRealizado - custoPlanejado;
      }

      return {
        mesKey: m.mesKey,
        mesLabel: m.mesLabel,
        mesFull: m.mesFull,
        progressoPlanejado,
        progressoRealizado,
        custoPlanejado,
        custoRealizado,
        desvioPercentual,
        desvioFinanceiro,
        isAtual: m.isAtual,
        isFuturo: m.isFuturo,
        fasePredominante: m.fase
      };
    });

    const currentPoint = series.find(s => s.isAtual) || series[7];
    const progPlanejadoAtual = currentPoint.progressoPlanejado;
    const progRealizadoAtual = currentPoint.progressoRealizado ?? currentActualProgress;
    const desvioAtualPct = Math.round((progRealizadoAtual - progPlanejadoAtual) * 10) / 10;
    const desvioAtualFinanceiro = (currentPoint.custoRealizado ?? 0) - currentPoint.custoPlanejado;
    
    // SPI (Schedule Performance Index / IDP - Índice de Desempenho de Prazo)
    const spi = progPlanejadoAtual > 0 ? Math.round((progRealizadoAtual / progPlanejadoAtual) * 100) / 100 : 1;
    const spiStatus: 'adiantado' | 'no_prazo' | 'atrasado' = spi >= 1.02 ? 'adiantado' : (spi >= 0.95 ? 'no_prazo' : 'atrasado');

    return {
      series,
      targetOrcamento,
      progPlanejadoAtual,
      progRealizadoAtual,
      desvioAtualPct,
      desvioAtualFinanceiro,
      spi,
      spiStatus,
      selectedObraNome: selectedObra ? selectedObra.nome : 'Portfólio Global Consolidado'
    };
  }, [curvaObraFilter, obras, orcamentoTotal, selectedGlobalObraId, selectedGlobalObra, effectiveObras]);

  // Compute 5 Granular Phases for each Obra
  const computeObraPhases = (obra: Obra): PhaseDetail[] => {
    const dInicio = obra.data_inicio ? new Date(obra.data_inicio + 'T00:00:00') : new Date('2024-01-01T00:00:00');
    const dFim = obra.data_previsao_termino ? new Date(obra.data_previsao_termino + 'T23:59:59') : new Date('2025-06-30T23:59:59');
    const totalMillis = Math.max(86400000, dFim.getTime() - dInicio.getTime());
    const prog = obra.progresso !== undefined ? obra.progresso : 50;
    const orc = obra.orcamento_total || 1000000;
    const hoje = new Date();

    const getDateAtRatio = (r: number) => new Date(dInicio.getTime() + totalMillis * r);
    const formatDate = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });

    const phaseDefs = [
      {
        id: 'fundacao',
        nome: '1. Fundação & Contenções',
        categoria: 'fundacao' as const,
        color: 'from-amber-600 to-amber-500',
        barColor: 'bg-amber-500',
        textColor: 'text-amber-700',
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-300',
        startRatio: 0,
        endRatio: 0.25,
        weight: 25,
        milestones: [
          { name: 'Sondagem geotécnica & terraplenagem', done: prog >= 10 },
          { name: 'Perfuração e armação de estacas', done: prog >= 20 },
          { name: 'Blocos de coroamento e baldrames', done: prog >= 25 }
        ]
      },
      {
        id: 'estrutura',
        nome: '2. Estrutura & Alvenaria',
        categoria: 'estrutura' as const,
        color: 'from-blue-600 to-blue-500',
        barColor: 'bg-blue-600',
        textColor: 'text-blue-700',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-300',
        startRatio: 0.20,
        endRatio: 0.60,
        weight: 35,
        milestones: [
          { name: 'Pilares e vigas do subsolo ao 3º pav.', done: prog >= 35 },
          { name: 'Lajes tipo e concretagem estrutural', done: prog >= 48 },
          { name: 'Alvenaria de vedação e shafts técnicos', done: prog >= 60 }
        ]
      },
      {
        id: 'instalacoes',
        nome: '3. Instalações Prediais (MEP)',
        categoria: 'instalacoes' as const,
        color: 'from-teal-600 to-teal-500',
        barColor: 'bg-teal-500',
        textColor: 'text-teal-700',
        bgColor: 'bg-teal-100',
        borderColor: 'border-teal-300',
        startRatio: 0.50,
        endRatio: 0.80,
        weight: 20,
        milestones: [
          { name: 'Tubulação hidráulica e prumadas de água', done: prog >= 60 },
          { name: 'Eletrodutos, fiação e quadros elétricos', done: prog >= 70 },
          { name: 'Infraestrutura de climatização e SPDA', done: prog >= 80 }
        ]
      },
      {
        id: 'acabamento',
        nome: '4. Acabamento & Revestimentos',
        categoria: 'acabamento' as const,
        color: 'from-purple-600 to-purple-500',
        barColor: 'bg-purple-500',
        textColor: 'text-purple-700',
        bgColor: 'bg-purple-100',
        borderColor: 'border-purple-300',
        startRatio: 0.70,
        endRatio: 0.95,
        weight: 15,
        milestones: [
          { name: 'Contrapiso e impermeabilização', done: prog >= 75 },
          { name: 'Assentamento de pisos e porcelanatos', done: prog >= 85 },
          { name: 'Pintura, esquadrias e louças', done: prog >= 95 }
        ]
      },
      {
        id: 'entrega',
        nome: '5. Vistoria & Entrega Técnica',
        categoria: 'entrega' as const,
        color: 'from-emerald-600 to-emerald-500',
        barColor: 'bg-emerald-500',
        textColor: 'text-emerald-700',
        bgColor: 'bg-emerald-100',
        borderColor: 'border-emerald-300',
        startRatio: 0.90,
        endRatio: 1.0,
        weight: 5,
        milestones: [
          { name: 'Checklist de vistoria e testes finais', done: prog >= 95 },
          { name: 'Emissão de Habite-se e AVCB', done: prog >= 98 },
          { name: 'Entrega formal de chaves ao cliente', done: prog >= 100 }
        ]
      }
    ];

    return phaseDefs.map(p => {
      const fInicio = getDateAtRatio(p.startRatio);
      const fFim = getDateAtRatio(p.endRatio);
      const duracao = Math.max(1, Math.ceil((fFim.getTime() - fInicio.getTime()) / 86400000));

      let phaseProg = 0;
      const startPct = p.startRatio * 100;
      const endPct = p.endRatio * 100;
      const range = endPct - startPct;

      if (prog <= startPct) {
        phaseProg = 0;
      } else if (prog >= endPct) {
        phaseProg = 100;
      } else {
        phaseProg = Math.min(100, Math.max(0, Math.round(((prog - startPct) / range) * 100)));
      }

      let status: 'concluida' | 'em_andamento' | 'planejada' | 'atrasada' = 'planejada';
      if (phaseProg === 100) {
        status = 'concluida';
      } else if (phaseProg > 0) {
        status = hoje > fFim ? 'atrasada' : 'em_andamento';
      } else {
        status = hoje > fInicio ? 'atrasada' : 'planejada';
      }

      const budgetAllocated = orc * (p.weight / 100);
      const budgetSpent = budgetAllocated * (phaseProg / 100);

      return {
        ...p,
        inicio: fInicio,
        fim: fFim,
        inicioStr: formatDate(fInicio),
        fimStr: formatDate(fFim),
        duracaoDias: duracao,
        progresso: phaseProg,
        status,
        budgetAllocated,
        budgetSpent,
        responsible: obra.gestor_nome || 'Eng. Residente'
      };
    });
  };

  // Helper to trigger hover tooltip on phase
  const handlePhaseMouseEnter = (e: React.MouseEvent, obra: Obra, fase: PhaseDetail) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveTooltip({
      obraNome: obra.nome,
      obraId: obra.id,
      fase,
      x: rect.left + rect.width / 2,
      y: rect.top
    });
  };

  const handlePhaseMouseLeave = () => {
    setActiveTooltip(null);
  };

  return (
    <div id="cockpit-dashboard-view" className="space-y-1.5 w-full relative">
      
      {/* 1. Header Bar: Ultra-Dense Action & Status Strip */}
      <div id="cockpit-header-strip" className="bg-gradient-to-r from-slate-900 via-red-950 to-slate-900 rounded-md px-2 py-1 border border-red-900/40 text-white shadow-2xs flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-4.5 h-4.5 rounded bg-red-800 border border-red-500/40 flex items-center justify-center shrink-0">
            <Building2 className="w-2.5 h-2.5 text-white" />
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <h1 className="text-[11.5px] font-black tracking-tight text-white leading-none">Cockpit Geral de Obras</h1>
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded-full bg-red-900/60 border border-red-700/50 text-red-300 text-[7.5px] font-bold">
              Engenharia Brasal
            </span>
            <span className="text-slate-400 text-[8px] hidden md:inline truncate">
              · Curva S com Zoom Interativo & Tooltips de Fases
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {/* Active Maintenance Tasks Counter in Header */}
          <div
            id="header-active-maintenance-counter"
            onClick={() => onNavigate('almoxarifado')}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-bold border transition-all cursor-pointer shadow-2xs ${
              itensManutencao > 0 
                ? 'bg-amber-950/90 border-amber-500/60 text-amber-300 hover:bg-amber-900' 
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="Active Maintenance Tasks (status: manutencao)"
          >
            <Wrench className={`w-2.5 h-2.5 ${itensManutencao > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
            <span className="font-medium text-slate-300">Manutenção:</span>
            <span className={`px-1 py-0.2 rounded text-[7.5px] font-black ${
              itensManutencao > 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-200'
            }`}>
              {itensManutencao}
            </span>
          </div>

          <button
            id="btn-quick-nova-obra"
            onClick={onOpenNovaObra}
            className="flex items-center gap-1 px-2 py-0.5 bg-red-700 hover:bg-red-600 text-white rounded text-[8px] font-bold transition-all shadow-2xs cursor-pointer"
          >
            <PlusCircle className="w-2.5 h-2.5" />
            <span>Nova Obra</span>
          </button>
          <button
            id="btn-quick-emprestar"
            onClick={onOpenNovoEmprestimo}
            className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded text-[8px] font-bold border border-slate-700 transition-all cursor-pointer"
          >
            <Boxes className="w-2.5 h-2.5 text-amber-400" />
            <span>Emprestar</span>
          </button>
          <button
            id="btn-quick-solicitar-insumo"
            onClick={onOpenNovaSolicitacao}
            className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded text-[8px] font-bold border border-slate-700 transition-all cursor-pointer"
          >
            <Package className="w-2.5 h-2.5 text-emerald-400" />
            <span>Solicitar Insumo</span>
          </button>
        </div>
      </div>

      {/* 1.4. GLOBAL OBRA FILTER BAR (FILTRO GLOBAL DINÂMICO DE RISCO, MÃO DE OBRA E MATERIAIS) */}
      <GlobalObraFilterBar
        obras={obras}
        selectedObraId={selectedGlobalObraId}
        onSelectObra={handleGlobalObraSelect}
        metrics={{
          totalObras: obras.length,
          colaboradoresCount: colabAtivos,
          materiaisCriticosCount: materiaisCriticos,
          riscosCriticosCount: docsVencidosReprovados + activeMaintenanceTasks,
          vistoriasCount: vistoriasPendentes,
          orcamentoTotal: orcamentoTotal
        }}
        onNavigate={onNavigate}
        onSelectObraZoom={(obra) => setModalObraZoom(obra)}
      />

      {/* 1.5. PERIOD SELECTOR STRIP (Mês / Ano / Granularidade Dinâmica de KPIs de Consumo e Mão de Obra) */}
      <div 
        id="dashboard-period-filter-bar" 
        className="bg-white px-2.5 py-2 rounded-md border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-2"
      >
        {/* Left Side: Direct Month/Year Dropdown Controls */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="flex items-center gap-1.5 text-slate-800 shrink-0">
            <div className="w-5 h-5 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shadow-2xs">
              <Calendar className="w-3 h-3" />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-900 leading-none">
                Filtro de Período Executivo:
              </span>
              <span className="text-[6.5px] text-slate-400 font-medium">
                Alimenta Mão de Obra e Consumo de Insumos
              </span>
            </div>
          </div>

          {/* Seletor de Ano */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 shadow-2xs">
            <span className="text-[7px] font-bold text-slate-500 uppercase">Ano:</span>
            <select
              id="dashboard-year-selector"
              value={selectedYearFilter}
              onChange={(e) => handleYearMonthChange(e.target.value, selectedMonthFilter)}
              className="text-[7.5px] font-bold bg-transparent text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="2026">2026 (Exercício Vigente)</option>
              <option value="2025">2025 (Histórico)</option>
              <option value="2027">2027 (Planejamento)</option>
              <option value="all">Todos os Anos</option>
            </select>
          </div>

          {/* Seletor de Mês */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 shadow-2xs">
            <span className="text-[7px] font-bold text-slate-500 uppercase">Mês / Janela:</span>
            <select
              id="dashboard-month-selector"
              value={selectedMonthFilter}
              onChange={(e) => handleYearMonthChange(selectedYearFilter, e.target.value)}
              className="text-[7.5px] font-bold bg-transparent text-slate-900 focus:outline-none cursor-pointer"
            >
              <optgroup label="Meses do Ano">
                <option value="08">Agosto (Mês Atual)</option>
                <option value="07">Julho</option>
                <option value="06">Junho</option>
                <option value="05">Maio</option>
                <option value="04">Abril</option>
                <option value="03">Março</option>
                <option value="02">Fevereiro</option>
                <option value="01">Janeiro</option>
                <option value="09">Setembro (Previsto)</option>
                <option value="10">Outubro (Previsto)</option>
                <option value="11">Novembro (Previsto)</option>
                <option value="12">Dezembro (Previsto)</option>
              </optgroup>
              <optgroup label="Agrupamentos">
                <option value="all">Consolidado Anual (Todos os Meses)</option>
                <option value="Q3">3º Trimestre (Q3 - Jul/Set)</option>
                <option value="Q2">2º Trimestre (Q2 - Abr/Jun)</option>
                <option value="Q1">1º Trimestre (Q1 - Jan/Mar)</option>
                <option value="Q4">4º Trimestre (Q4 - Out/Dez)</option>
                <option value="all_history">Todo o Histórico Acumulado</option>
              </optgroup>
            </select>
          </div>

          {/* Unified Hierarchical Dropdown Quick Selector */}
          <select
            id="dashboard-period-selector"
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="text-[7.5px] font-bold bg-white border border-slate-300 hover:border-blue-600 text-slate-900 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer shadow-2xs transition-all"
            title="Seleção direta de período consolidado"
          >
            <optgroup label="Mês a Mês (2026)">
              <option value="2026-08">Agosto / 2026 (Mês Atual)</option>
              <option value="2026-07">Julho / 2026</option>
              <option value="2026-06">Junho / 2026</option>
              <option value="2026-05">Maio / 2026</option>
              <option value="2026-04">Abril / 2026</option>
              <option value="2026-03">Março / 2026</option>
              <option value="2026-02">Fevereiro / 2026</option>
              <option value="2026-01">Janeiro / 2026</option>
              <option value="2026-09">Setembro / 2026 (Projeção)</option>
              <option value="2026-10">Outubro / 2026 (Projeção)</option>
              <option value="2026-11">Novembro / 2026 (Projeção)</option>
              <option value="2026-12">Dezembro / 2026 (Projeção)</option>
            </optgroup>
            <optgroup label="Histórico (2025)">
              <option value="2025-12">Dezembro / 2025</option>
              <option value="2025-11">Novembro / 2025</option>
              <option value="2025-10">Outubro / 2025</option>
              <option value="2025-06">Junho / 2025</option>
              <option value="2025-01">Janeiro / 2025</option>
              <option value="2025">Ano 2025 Completo (12 meses)</option>
            </optgroup>
            <optgroup label="Visão Trimestral (2026)">
              <option value="2026-Q3">3º Trimestre (Q3 - Jul/Set 2026)</option>
              <option value="2026-Q2">2º Trimestre (Q2 - Abr/Jun 2026)</option>
              <option value="2026-Q1">1º Trimestre (Q1 - Jan/Mar 2026)</option>
              <option value="2026-Q4">4º Trimestre (Q4 - Out/Dez 2026)</option>
            </optgroup>
            <optgroup label="Consolidação Global">
              <option value="2026">Exercício 2026 (Consolidado YTD - 8 meses)</option>
              <option value="all">Todo o Histórico (Acumulado Total - 14 meses)</option>
            </optgroup>
          </select>
        </div>

        {/* Right Side: Quick Shortcut Buttons & Active Filter Pill */}
        <div className="flex items-center gap-1 flex-wrap shrink-0 justify-end">
          {[
            { id: '2026-08', label: 'Ago/26 (Atual)' },
            { id: '2026-07', label: 'Jul/26' },
            { id: '2026-Q3', label: 'Q3/26' },
            { id: '2026', label: 'Ano 2026' },
            { id: 'all', label: 'Histórico Total' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => handlePeriodChange(p.id)}
              className={`px-1.5 py-0.5 rounded text-[7.5px] font-bold transition-all cursor-pointer ${
                selectedPeriod === p.id 
                  ? 'bg-slate-900 text-white shadow-2xs' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}

          {/* Active Period Status Tag with Dynamic Metrics Impact */}
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200 text-[7px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-mono">
              Janela Ativa: <strong className="text-slate-900 font-black">{periodConfig.label}</strong> ({periodConfig.mesesDesc})
            </span>
          </div>
        </div>
      </div>

      {/* 1.6. CRITICAL BUDGET LIMIT ALERT RIBBON (> 90% INSUMOS / VERBA) */}
      {criticalBudgetObras.length > 0 && (
        <div 
          id="alert-banner-limite-orcamento"
          className="bg-red-50 border border-red-300 rounded-md p-2 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2 transition-all animate-fadeIn"
        >
          <div className="flex items-start lg:items-center gap-2 min-w-0 flex-1">
            <div className="w-6 h-6 rounded bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs ring-2 ring-red-200 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-black tracking-wide text-red-900 uppercase">
                  Monitoramento de Limite de Orçamento
                </span>
                <span className="bg-red-600 text-white text-[7.5px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-tight">
                  {criticalBudgetObras.length} {criticalBudgetObras.length === 1 ? 'Canteiro Crítico' : 'Canteiros Críticos'} (≥90%)
                </span>
                <span className="text-[7.5px] font-semibold text-red-700 bg-red-100/80 px-1 py-0.2 rounded border border-red-200">
                  Verba Insumos: 45% do Teto Global
                </span>
                <span className="text-[7.5px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-1">
                  <Mail className="w-2.5 h-2.5 text-emerald-700" />
                  <span>Serviço de E-mail: Disparo Automático Ativo</span>
                </span>
              </div>
              <p className="text-[8px] text-red-800 leading-tight mt-0.5">
                Atenção: O consumo de insumos atingiu ou superou 90% do orçamento aprovado para materiais. Gestores responsáveis e administradores foram notificados por e-mail automaticamente via cadastro de usuários.
              </p>
            </div>
          </div>

          {/* Affected Obras Pills & Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap shrink-0 w-full lg:w-auto justify-end">
            <div className="flex items-center gap-1 overflow-x-auto max-w-full">
              {criticalBudgetObras.map(item => (
                <div 
                  key={item.obra.id}
                  onClick={() => setModalObraZoom(item.obra)}
                  className="bg-white hover:bg-red-100/60 border border-red-300 rounded px-1.5 py-0.5 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  title="Clique para inspecionar o cronograma e insumos"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                  <span className="text-[7.5px] font-bold text-slate-900 truncate max-w-[120px]">{item.obra.nome}</span>
                  <span className="text-[7.5px] font-mono font-black text-red-700 bg-red-50 px-1 rounded">
                    {item.percentualConsumoInsumos}%
                  </span>
                </div>
              ))}
            </div>

            {/* Email Notification Service Button */}
            {onOpenEmailModal && (
              <button
                id="btn-alert-banner-email-gestores"
                onClick={() => onOpenEmailModal(criticalBudgetObras[0]?.obra)}
                className="px-2 py-1 bg-red-800 hover:bg-red-900 text-white rounded text-[8px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer border border-red-950"
                title="Abrir Central de Disparos de E-mail para Gestores"
              >
                <Mail className="w-2.5 h-2.5 text-red-200" />
                <span>E-mails para Gestores ({emailLogs.length})</span>
              </button>
            )}

            <button
              id="btn-alert-banner-solicitar"
              onClick={onOpenNovaSolicitacao}
              className="px-2 py-1 bg-red-700 hover:bg-red-800 text-white rounded text-[8px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
            >
              <Package className="w-2.5 h-2.5" />
              <span>Solicitar Insumo</span>
            </button>
            <button
              id="btn-alert-banner-materiais"
              onClick={() => onNavigate('materiais')}
              className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded text-[8px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>Ver Estoque</span>
              <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Compact 9-Column Micro Metric Cards Grid */}
      <div id="cockpit-kpi-ribbon-primary" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-9 gap-1.5">
        
        {/* KPI 1: Obras Ativas */}
        <div 
          id="kpi-card-obras-ativas"
          onClick={() => onNavigate('obras')}
          className="bg-white p-1.5 rounded-md border border-slate-200 shadow-2xs hover:border-red-600 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-bold uppercase tracking-wider text-slate-500">Obras Ativas</span>
            <Building2 className="w-2.5 h-2.5 text-red-700 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-xs font-black text-slate-900 leading-none">{obrasAtivas}</span>
            <span className="text-[7px] text-slate-400 font-medium">/{obras.length} total</span>
          </div>
          <div className="text-[7px] text-emerald-700 font-bold truncate mt-0.5">
            {formatCurrency(orcamentoTotal)}
          </div>
        </div>

        {/* KPI 2: Conclusão Global das Obras (Percentual Médio) */}
        <div 
          id="kpi-card-conclusao-global"
          onClick={() => onNavigate('obras')}
          className="bg-white p-1.5 rounded-md border border-slate-200 shadow-2xs hover:border-emerald-600 transition-all cursor-pointer group flex flex-col justify-between"
          title="Percentual Médio de Conclusão Global de todas as obras cadastradas"
        >
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-bold uppercase tracking-wider text-slate-500">Conclusão Global</span>
            <Target className="w-2.5 h-2.5 text-emerald-700 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-xs font-black text-slate-900 leading-none">{percentualMedioConclusaoGlobal}%</span>
            <span className="text-[7px] text-emerald-700 font-bold">médio</span>
          </div>
          <div className="mt-0.5 space-y-0.5">
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${percentualMedioConclusaoGlobal}%` }}
              />
            </div>
            <div className="text-[6.5px] text-slate-600 font-medium truncate flex justify-between">
              <span>{obrasConcluidasCount} conc.</span>
              <span>{totalObrasCadastradas} total</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Efetivo Campo */}
        <div 
          id="kpi-card-efetivo-campo"
          onClick={() => onNavigate('equipe')}
          className="bg-white p-1.5 rounded-md border border-slate-200 shadow-2xs hover:border-blue-600 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-bold uppercase tracking-wider text-slate-500">Efetivo Campo</span>
            <Users className="w-2.5 h-2.5 text-blue-700 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-xs font-black text-slate-900 leading-none">{colabAtivos}</span>
            <span className="text-[7px] text-slate-400 font-medium">ativos</span>
          </div>
          <div className="text-[7px] text-slate-600 font-medium truncate mt-0.5">
            {colabProprios} CLT · {colabTerceiros} Terc.
          </div>
        </div>

        {/* KPI 4: Almoxarifado */}
        <div 
          id="kpi-card-almoxarifado"
          onClick={() => onNavigate('almoxarifado')}
          className="bg-white p-1.5 rounded-md border border-slate-200 shadow-2xs hover:border-amber-600 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-bold uppercase tracking-wider text-slate-500">Almoxarifado</span>
            <Boxes className="w-2.5 h-2.5 text-amber-700 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-xs font-black text-slate-900 leading-none">{itensEstoque}</span>
            <span className="text-[7px] text-slate-400 font-medium">estoque</span>
          </div>
          <div className="text-[7px] text-amber-800 font-semibold truncate mt-0.5">
            {itensUso} campo · {itensManutencao} mnt.
          </div>
        </div>

        {/* KPI 5: Active Maintenance Tasks */}
        <div 
          id="kpi-card-active-maintenance"
          onClick={() => onNavigate('almoxarifado')}
          className={`p-1.5 rounded-md border shadow-2xs transition-all cursor-pointer group flex flex-col justify-between ${
            activeMaintenanceTasks > 0 ? 'bg-amber-50/60 border-amber-300 hover:border-amber-500' : 'bg-white border-slate-200 hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-bold uppercase tracking-wider text-slate-500">Manutenção</span>
            <Wrench className={`w-2.5 h-2.5 ${activeMaintenanceTasks > 0 ? 'text-amber-700' : 'text-slate-500'} group-hover:scale-110 transition-transform`} />
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className={`text-xs font-black leading-none ${activeMaintenanceTasks > 0 ? 'text-amber-900' : 'text-slate-900'}`}>{activeMaintenanceTasks}</span>
            <span className="text-[7px] text-slate-400 font-medium">ordens ({availabilityRate}% ok)</span>
          </div>
          <div className="text-[7px] text-amber-800 font-medium truncate mt-0.5">
            {formatCurrency(valorEquipManutencao)}
          </div>
        </div>

        {/* KPI 6: Budget Utilization % */}
        <div 
          id="kpi-card-budget-utilization"
          onClick={() => onNavigate('obras')}
          className="bg-white p-1.5 rounded-md border border-slate-200 shadow-2xs hover:border-red-600 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-bold uppercase tracking-wider text-slate-500">Curva S / Budget</span>
            <TrendingUp className="w-2.5 h-2.5 text-red-700 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-xs font-black text-slate-900 leading-none">{budgetUtilizationPct}%</span>
            <span className="text-[7px] text-slate-400 font-medium">alocado</span>
          </div>
          <div className="text-[7px] text-slate-600 font-medium truncate mt-0.5">
            Saldo: {formatCurrency(saldoOrcamentario)}
          </div>
        </div>

        {/* KPI 7: Estoque Crítico */}
        <div 
          id="kpi-card-estoque-critico"
          onClick={() => onNavigate('materiais')}
          className={`p-1.5 rounded-md border shadow-2xs transition-all cursor-pointer group flex flex-col justify-between ${
            materiaisCriticos > 0 ? 'bg-amber-50/60 border-amber-300 hover:border-amber-500' : 'bg-white border-slate-200 hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-bold uppercase tracking-wider text-slate-500">Estoque Insumos</span>
            <AlertTriangle className={`w-2.5 h-2.5 ${materiaisCriticos > 0 ? 'text-amber-800' : 'text-slate-500'} group-hover:scale-110 transition-transform`} />
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className={`text-xs font-black leading-none ${materiaisCriticos > 0 ? 'text-amber-900' : 'text-slate-900'}`}>{materiaisCriticos}</span>
            <span className="text-[7px] text-slate-400 font-medium">críticos / {materiais.length} tot.</span>
          </div>
          <div className="text-[7px] text-slate-600 font-medium truncate mt-0.5">
            {formatCurrency(valorTotalEstoqueMat)}
          </div>
        </div>

        {/* KPI 8: Conformidade SST */}
        <div 
          id="kpi-card-conformidade-sst"
          onClick={() => onNavigate('documentos')}
          className="bg-white p-1.5 rounded-md border border-slate-200 shadow-2xs hover:border-purple-600 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-bold uppercase tracking-wider text-slate-500">Conformidade SST</span>
            <FileCheck className="w-2.5 h-2.5 text-purple-700 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className={`text-xs font-black leading-none ${docsPendentes > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {sstTaxaConformidade}%
            </span>
            <span className="text-[7px] text-slate-400 font-medium">NR-18</span>
          </div>
          <div className="text-[7px] text-purple-800 font-medium truncate mt-0.5">
            {docsPendentes} pend. · {docsAprovados} ok
          </div>
        </div>

        {/* KPI 9: Vistorias & Qualidade */}
        <div 
          id="kpi-card-vistorias"
          onClick={() => onNavigate('vistorias')}
          className="bg-white p-1.5 rounded-md border border-slate-200 shadow-2xs hover:border-emerald-600 transition-all cursor-pointer group flex flex-col justify-between"
          title="Clique para acessar o módulo de Vistorias ou ver o cronograma de campo abaixo"
        >
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-bold uppercase tracking-wider text-slate-500">Vistorias</span>
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-xs font-black text-slate-900 leading-none">{vistoriasPendentes}</span>
            <span className="text-[7px] text-slate-400 font-medium">a realizar</span>
          </div>
          <div className="text-[7px] text-slate-600 font-medium truncate mt-0.5 flex items-center justify-between">
            <span>{vistoriasConcluidas} concluídas</span>
            {vistoriasHojeAmanhaCount > 0 && (
              <span className="text-[6px] font-black bg-amber-100 text-amber-900 px-1 py-0.2 rounded border border-amber-300 flex items-center gap-0.5">
                <Zap className="w-1.5 h-1.5 text-amber-700 fill-amber-700" />
                {vistoriasHojeAmanhaCount} hoje/amanhã
              </span>
            )}
          </div>
        </div>

      </div>

      {/* 2.3. CARTÃO DE STATUS DE CONCLUSÃO GLOBAL DO PORTFÓLIO DE OBRAS */}
      <GlobalProgressStatusCard 
        obras={obras}
        onNavigate={onNavigate}
        onSelectObra={(obra) => setModalObraZoom(obra)}
      />

      {/* 2.5. EXECUTIVE DEDICATED KPI CARDS: Custo de Mão de Obra vs. Planejado & Consumo Acumulado de Insumos Críticos */}
      <div 
        id="executive-kpi-cards-grid" 
        className="grid grid-cols-1 lg:grid-cols-2 gap-1.5"
      >
        {/* KPI CARD A: Custo de Mão de Obra vs. Planejado (Conjunto Executivo de Cartões) */}
        <div 
          id="kpi-card-custo-mdo-vs-planejado"
          className="bg-white p-2 rounded-md border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
        >
          <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 mb-1.5 border-b border-slate-100 gap-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 rounded bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <Users className="w-3 h-3" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-[11px] leading-none">Custo de Mão de Obra vs. Planejado</h3>
                    <span className={`px-1.5 py-0.2 rounded text-[6.5px] font-bold uppercase tracking-wider ${
                      desvioMdoPercentual < 0 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : desvioMdoPercentual === 0 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-amber-100 text-amber-800'
                    }`}>
                      {desvioMdoPercentual < 0 
                        ? `${Math.abs(desvioMdoPercentual)}% abaixo do teto` 
                        : desvioMdoPercentual === 0 
                          ? '100% equilibrado' 
                          : `+${desvioMdoPercentual}% desvio`}
                    </span>
                    <span className="text-[6.5px] font-semibold text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-100">
                      MDO: {comprometimentoMdoGlobalPct}% do Orçamento Total
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[7px] text-slate-400 mt-0.5">
                    <span>{colabAtivos} colaboradores ativos ({colabProprios} CLT · {colabTerceiros} Terc.)</span>
                    <span>·</span>
                    <span className="font-semibold text-blue-700">Janela: {periodConfig.labelShort}</span>
                  </div>
                </div>
              </div>

              {/* Sub-Tabs Selector & Navigation */}
              <div className="flex items-center gap-1 shrink-0 justify-between sm:justify-end">
                <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 text-[6.5px] font-bold">
                  <button
                    id="btn-mdo-tab-visao-geral"
                    onClick={() => setMdoSubTab('visao_geral')}
                    className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                      mdoSubTab === 'visao_geral' ? 'bg-white text-blue-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Geral
                  </button>
                  <button
                    id="btn-mdo-tab-cargos"
                    onClick={() => setMdoSubTab('cargos')}
                    className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                      mdoSubTab === 'cargos' ? 'bg-white text-blue-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Cargos ({mdoCargosCategorias.length})
                  </button>
                  <button
                    id="btn-mdo-tab-canteiros"
                    onClick={() => setMdoSubTab('canteiros')}
                    className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                      mdoSubTab === 'canteiros' ? 'bg-white text-blue-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Canteiros
                  </button>
                  <button
                    id="btn-mdo-tab-colaboradores"
                    onClick={() => setMdoSubTab('colaboradores')}
                    className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                      mdoSubTab === 'colaboradores' ? 'bg-white text-blue-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Efetivo ({colabAtivos})
                  </button>
                </div>

                <button
                  id="btn-kpi-mdo-detalhes"
                  onClick={() => onNavigate('equipe')}
                  className="text-[7px] text-blue-700 font-bold hover:underline flex items-center gap-0.5 cursor-pointer ml-1"
                  title="Abrir módulo completo de Recursos Humanos & Equipe"
                >
                  <span>Equipe</span>
                  <ChevronRight className="w-2 h-2" />
                </button>
              </div>
            </div>

            {/* Financial 4-Metric Grid Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-1.5">
              {/* Metric 1: Realizado */}
              <div className="p-1.5 bg-slate-50 rounded border border-slate-100 flex flex-col justify-between">
                <span className="text-[6.5px] text-slate-500 font-semibold block">Realizado no Período</span>
                <span className="text-xs font-black text-slate-900 leading-tight block my-0.5">
                  {formatCurrency(custoMdoRealizadoPeriodo)}
                </span>
                <span className="text-[6px] text-slate-400 font-medium truncate">
                  CLT: {formatCurrency(custoMdoPropriosPeriodo)}
                </span>
              </div>

              {/* Metric 2: Planejado */}
              <div className="p-1.5 bg-slate-50 rounded border border-slate-100 flex flex-col justify-between">
                <span className="text-[6.5px] text-slate-500 font-semibold block">Planejado no Período</span>
                <span className="text-xs font-black text-slate-700 leading-tight block my-0.5">
                  {formatCurrency(custoMdoPlanejadoPeriodo)}
                </span>
                <span className={`text-[6px] font-bold font-mono truncate ${
                  desvioMdoFinanceiro <= 0 ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {desvioMdoFinanceiro <= 0 ? '-' : '+'}{formatCurrency(Math.abs(desvioMdoFinanceiro))} ({desvioMdoPercentual}%)
                </span>
              </div>

              {/* Metric 3: Relação c/ Orçamento Total das Obras */}
              <div className="p-1.5 bg-slate-50 rounded border border-slate-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[6.5px] text-slate-500 font-semibold block">Verba Total MDO</span>
                  <BadgePercent className="w-2 h-2 text-slate-400" />
                </div>
                <span className="text-xs font-black text-slate-800 leading-tight block my-0.5">
                  {formatCurrency(orcamentoMdoGlobalTotal)}
                </span>
                <span className="text-[6px] text-slate-500 font-medium truncate">
                  Saldo: {formatCurrency(saldoMdoGlobalRemanescente)} ({percentualSaldoMdoDisponivel}%)
                </span>
              </div>

              {/* Metric 4: Custo Médio / Profissional & CPI */}
              <div className="p-1.5 bg-blue-50/60 rounded border border-blue-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[6.5px] text-blue-900 font-semibold">Custo Médio / Head</span>
                  <Wallet className="w-2 h-2 text-blue-700" />
                </div>
                <span className="text-xs font-black text-blue-950 leading-tight my-0.5">
                  {formatCurrency(custoMdoPorColabMedio)}
                </span>
                <span className="text-[6px] text-blue-700 font-medium truncate">
                  CPI MDO: <strong className="font-bold">{cpiMdoIndice}x</strong> · ~{mesesAutonomiaFolha}m auto
                </span>
              </div>
            </div>

            {/* Realization Progress Bar with Planned Milestone */}
            <div className="space-y-0.5 mb-1.5">
              <div className="flex items-center justify-between text-[6.5px] font-semibold text-slate-600">
                <span className="flex items-center gap-1">
                  <span>Aderência Orçamentária MDO:</span>
                  <strong className={`font-mono ${realizacaoMdoRatio > 100 ? 'text-amber-700' : 'text-blue-700'}`}>
                    {realizacaoMdoRatio}%
                  </strong>
                </span>
                <span className="text-slate-400 font-mono text-[6px]">
                  Teto Período: {formatCurrency(custoMdoPlanejadoPeriodo)} (100%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden relative">
                <div 
                  className={`h-full rounded-full transition-all ${
                    realizacaoMdoRatio > 100 ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(100, realizacaoMdoRatio)}%` }}
                />
              </div>
            </div>

            {/* TAB CONTENT: 1. VISÃO GERAL */}
            {mdoSubTab === 'visao_geral' && (
              <div className="space-y-1.5 animate-fadeIn">
                {/* Breakdown CLT vs Terceiros */}
                <div className="grid grid-cols-2 gap-1.5 text-[7.5px] pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between p-1 bg-slate-50/70 rounded border border-slate-100">
                    <div className="min-w-0">
                      <span className="font-bold text-slate-800 block truncate">CLT Próprio ({colabProprios})</span>
                      <span className="text-[6px] text-slate-500">Salário base + 68% encargos e provisões</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 shrink-0 ml-1">
                      {formatCurrency(custoMdoPropriosPeriodo)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-1 bg-slate-50/70 rounded border border-slate-100">
                    <div className="min-w-0">
                      <span className="font-bold text-slate-800 block truncate">Terceirizados ({colabTerceiros})</span>
                      <span className="text-[6px] text-slate-500">Contratos de empreiteiras (+22% BDI)</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 shrink-0 ml-1">
                      {formatCurrency(custoMdoTerceirosPeriodo)}
                    </span>
                  </div>
                </div>

                {/* Resumo de Rateio das Obras */}
                <div className="pt-1 border-t border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-[6.5px] uppercase font-bold text-slate-400 px-0.5">
                    <span>Alocação por Canteiro (Headcount)</span>
                    <span>Realizado vs Orçado MDO</span>
                  </div>

                  {mdoPorObraBreakdown.slice(0, 3).map((item) => (
                    <div 
                      key={item.obra.id}
                      onClick={() => setModalObraZoom(item.obra)}
                      className="flex items-center justify-between p-1 bg-slate-50/50 hover:bg-slate-100/70 rounded text-[7px] border border-slate-100 transition-colors cursor-pointer"
                      title="Clique para inspecionar cronograma e custos desta obra"
                    >
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                        <span className="font-bold text-slate-800 truncate max-w-[130px]">{item.obra.nome}</span>
                        <span className="text-[6.5px] text-slate-400 font-mono">({item.count} colab.)</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 text-right">
                        <span className="font-mono font-bold text-slate-900">
                          {formatCurrency(item.custoPeriodoObra)}
                        </span>
                        <span className="text-[6.5px] text-slate-400 font-mono">
                          / {formatCurrency(item.orcamentoMdoPeriodo)}
                        </span>
                        <span className={`px-1 py-0.2 rounded text-[6px] font-mono font-bold ${
                          item.percentualAderencia <= 100 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.percentualAderencia}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: 2. POR CARGO / CATEGORIA */}
            {mdoSubTab === 'cargos' && (
              <div className="space-y-1 pt-1 border-t border-slate-100 animate-fadeIn">
                <div className="flex items-center justify-between text-[6.5px] uppercase font-bold text-slate-400 px-0.5">
                  <span>Categoria Profissional & Efetivo</span>
                  <span>Custo Médio · Total no Período (% Folha)</span>
                </div>

                <div className="max-h-[140px] overflow-y-auto space-y-1 pr-0.5">
                  {mdoCargosCategorias.map((cat, idx) => (
                    <div 
                      key={idx}
                      className="p-1 rounded bg-slate-50/70 border border-slate-100 hover:bg-slate-100/80 transition-colors flex items-center justify-between gap-1 text-[7px]"
                    >
                      <div className="min-w-0 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 truncate block leading-tight">{cat.categoria}</span>
                          <span className="text-[6px] text-slate-400 truncate block">{cat.descricao}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-right">
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-800 leading-tight block">
                            {formatCurrency(cat.custoPeriodoTotal)}
                          </span>
                          <span className="text-[6px] text-slate-400 font-mono">
                            {cat.count} prof. ({cat.proprios} CLT / {cat.terceiros} Terc)
                          </span>
                        </div>

                        <div className="w-10">
                          <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-600 rounded-full" 
                              style={{ width: `${Math.min(100, cat.percentualFolha)}%` }} 
                            />
                          </div>
                          <span className="text-[6px] font-mono font-bold text-slate-500 block text-right">
                            {cat.percentualFolha}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: 3. POR CANTEIRO / ORÇAMENTO TOTAL DE OBRAS */}
            {mdoSubTab === 'canteiros' && (
              <div className="space-y-1 pt-1 border-t border-slate-100 animate-fadeIn">
                <div className="flex items-center justify-between text-[6.5px] uppercase font-bold text-slate-400 px-0.5">
                  <span>Canteiro & Orçamento Global</span>
                  <span>MDO Realizada / Verba MDO (% Aderência)</span>
                </div>

                <div className="max-h-[140px] overflow-y-auto space-y-1 pr-0.5">
                  {mdoPorObraBreakdown.map((item) => (
                    <div 
                      key={item.obra.id}
                      onClick={() => setModalObraZoom(item.obra)}
                      className="p-1 rounded bg-slate-50/70 border border-slate-100 hover:bg-slate-100/80 transition-colors flex items-center justify-between gap-1 text-[7px] cursor-pointer"
                    >
                      <div className="min-w-0 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 truncate block leading-tight">{item.obra.nome}</span>
                          <span className="text-[6px] text-slate-500 font-mono">
                            Orç. Total: {formatCurrency(item.orcamentoTotalObra)} · {item.count} colab.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 text-right">
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900 leading-tight block">
                            {formatCurrency(item.custoPeriodoObra)}
                          </span>
                          <span className="text-[6px] text-slate-400 font-mono">
                            / {formatCurrency(item.orcamentoMdoPeriodo)} ({item.percentualSobreOrcamentoObra}% do CAPEX)
                          </span>
                        </div>

                        <span className={`px-1.5 py-0.5 rounded text-[6.5px] font-mono font-bold ${
                          item.percentualAderencia <= 100 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.percentualAderencia}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: 4. LISTA DETALHADA DE COLABORADORES */}
            {mdoSubTab === 'colaboradores' && (
              <div className="space-y-1 pt-1 border-t border-slate-100 animate-fadeIn">
                {/* Search & Filter Controls */}
                <div className="flex items-center justify-between gap-1 pb-1">
                  <input
                    type="text"
                    value={mdoSearchTerm}
                    onChange={(e) => setMdoSearchTerm(e.target.value)}
                    placeholder="Buscar colaborador ou cargo..."
                    className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-[7px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 w-1/2"
                  />
                  <select
                    value={mdoSelectedObraFilter}
                    onChange={(e) => setMdoSelectedObraFilter(e.target.value)}
                    className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-[7px] text-slate-700 font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">Todas as Obras ({obras.length})</option>
                    {obras.map(o => (
                      <option key={o.id} value={o.id.toString()}>{o.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Collaborators List */}
                <div className="max-h-[120px] overflow-y-auto space-y-1 pr-0.5">
                  {colaboradoresMdoDetails
                    .filter(c => {
                      const matchesSearch = !mdoSearchTerm || 
                        c.nome.toLowerCase().includes(mdoSearchTerm.toLowerCase()) ||
                        c.cargo.toLowerCase().includes(mdoSearchTerm.toLowerCase()) ||
                        c.matricula.toLowerCase().includes(mdoSearchTerm.toLowerCase());
                      const matchesObra = mdoSelectedObraFilter === 'all' || 
                        (c.obraId !== null && c.obraId.toString() === mdoSelectedObraFilter);
                      return matchesSearch && matchesObra;
                    })
                    .map((c) => (
                      <div 
                        key={c.id}
                        className="p-1 rounded bg-slate-50/70 border border-slate-100 hover:bg-slate-100/80 transition-colors flex items-center justify-between gap-1 text-[7px]"
                      >
                        <div className="min-w-0 flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.tipo === 'proprio' ? 'bg-blue-600' : 'bg-slate-400'}`} />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 truncate block leading-tight">{c.nome}</span>
                            <span className="text-[6px] text-slate-400 truncate block">
                              {c.cargo} · <strong className="text-slate-600">{c.obraNome}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 text-right">
                          <span className={`px-1 py-0.2 rounded text-[6px] font-bold uppercase ${
                            c.tipo === 'proprio' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {c.tipo === 'proprio' ? 'CLT +68%' : 'Terc +22%'}
                          </span>
                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-900 leading-tight block">
                              {formatCurrency(c.custoPeriodo)}
                            </span>
                            <span className="text-[6px] text-slate-400 font-mono">
                              Base: {formatCurrency(c.salarioBase)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* KPI CARD B: Consumo Acumulado de Insumos Críticos */}
        <div 
          id="kpi-card-consumo-insumos-criticos"
          className="bg-white p-2 rounded-md border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
        >
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Package className="w-3 h-3" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-slate-900 text-[11px] leading-none">Consumo Acumulado de Insumos Críticos</h3>
                    <span className={`px-1.5 py-0.2 rounded text-[7px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                      totalInsumosCriticosAbaixoMinimo > 0 
                        ? 'bg-amber-100 text-amber-800 font-extrabold' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {totalInsumosCriticosAbaixoMinimo > 0 && <AlertTriangle className="w-2 h-2 text-amber-700" />}
                      {totalInsumosCriticosAbaixoMinimo > 0 
                        ? `${totalInsumosCriticosAbaixoMinimo} itens em alerta` 
                        : 'Estoque regular'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[7px] text-slate-400">
                    <span>Curva A estrutural e saídas de campo</span>
                    <span>·</span>
                    <span className="font-semibold text-amber-800">Janela: {periodConfig.labelShort}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {onOpenEmailModal && (
                  <button
                    id="btn-kpi-materiais-email"
                    onClick={() => onOpenEmailModal(criticalBudgetObras[0]?.obra)}
                    className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[7px] font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-0.5"
                    title="Alertas por E-mail para Gestores"
                  >
                    <Mail className="w-2 h-2 text-red-300" />
                    <span>E-mails ({emailLogs.length})</span>
                  </button>
                )}
                <button
                  id="btn-kpi-materiais-solicitar"
                  onClick={onOpenNovaSolicitacao}
                  className="px-1.5 py-0.5 bg-red-700 hover:bg-red-600 text-white rounded text-[7px] font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-0.5"
                >
                  <PlusCircle className="w-2 h-2" />
                  <span>Repor</span>
                </button>
                <button
                  id="btn-kpi-materiais-detalhes"
                  onClick={() => onNavigate('materiais')}
                  className="text-[7.5px] text-amber-800 font-bold hover:underline flex items-center gap-0.5 cursor-pointer ml-0.5"
                >
                  <span>Insumos</span>
                  <ChevronRight className="w-2 h-2" />
                </button>
              </div>
            </div>

            {/* Insumos Summary Metrics */}
            <div className="grid grid-cols-3 gap-1.5 mb-1.5">
              <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                <span className="text-[7px] text-slate-500 font-semibold block">Consumo no Período</span>
                <span className="text-xs font-black text-slate-900 leading-tight block">
                  {formatCurrency(totalValorConsumoAcumuladoInsumos)}
                </span>
                <span className="text-[6.5px] text-slate-400 font-medium">Saídas registradas na janela</span>
              </div>

              <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                <span className="text-[7px] text-slate-500 font-semibold block">Estoque Vigente</span>
                <span className="text-xs font-black text-slate-700 leading-tight block">
                  {formatCurrency(valorTotalEstoqueMat)}
                </span>
                <span className="text-[6.5px] text-slate-400 font-medium">{materiais.length} itens cadastrados</span>
              </div>

              <div className="p-1.5 bg-amber-50/60 rounded border border-amber-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[7px] text-amber-900 font-semibold">Autonomia Média</span>
                  <Clock className="w-2.5 h-2.5 text-amber-700" />
                </div>
                <span className="text-xs font-black text-amber-950 leading-tight">
                  ~{autonomiaMediaDias} dias
                </span>
                <span className="text-[6.5px] text-amber-800 font-medium">Cobertura de canteiro</span>
              </div>
            </div>

            {/* Top Critical Insumos Micro-Bars */}
            <div className="space-y-1 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between text-[6.5px] uppercase font-bold text-slate-400 px-0.5">
                <span>Insumo Crítico (Curva A)</span>
                <span>Estoque vs Mínimo · Consumo no Período</span>
              </div>

              {insumosCriticosData.slice(0, 3).map((mat) => (
                <div 
                  key={mat.id} 
                  className={`p-1 rounded border transition-all flex items-center justify-between gap-1 text-[7px] ${
                    mat.isAbaixoMinimo 
                      ? 'bg-amber-50/80 border-amber-200/90' 
                      : 'bg-slate-50/80 border-slate-100'
                  }`}
                >
                  <div className="min-w-0 flex items-center gap-1 w-2/5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      mat.isAbaixoMinimo ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                    }`} />
                    <span className="font-semibold text-slate-900 truncate block leading-tight">{mat.nome}</span>
                  </div>

                  <div className="w-1/4 px-1">
                    <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          mat.isAbaixoMinimo ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(100, mat.percentualEstoqueMinimo)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[6px] text-slate-400 font-mono mt-0.2">
                      <span>{mat.quantidade_atual} {mat.unidade_medida}</span>
                      <span>Min: {mat.quantidade_minima}</span>
                    </div>
                  </div>

                  <div className="w-1/3 text-right flex flex-col justify-center">
                    <span className="font-mono font-bold text-slate-800 leading-tight">
                      {formatCurrency(mat.valorConsumidoAcumulado)}
                    </span>
                    <span className="text-[6px] text-slate-400">
                      {mat.consumoAcumuladoQtd} {mat.unidade_medida} aplicados
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* 3. High-Density Unified Bento Grid Matrix (3-Column Layout, Zero-Scroll Above the Fold) */}
      <div id="cockpit-bento-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-1.5 items-stretch">
        
        {/* ========================================================================= */}
        {/* SECTION A: LEFT COLUMN (Col Span 5) - Curva S (Recharts) & Canteiros     */}
        {/* ========================================================================= */}
        <div id="section-curva-s-recharts" className="lg:col-span-5 bg-white p-2 rounded-md border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            {/* Header with Title, Tabs and View Mode */}
            <div className="flex flex-wrap items-center justify-between pb-1 mb-1.5 border-b border-slate-100 gap-1">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-red-50 text-red-700 flex items-center justify-center">
                  <TrendingUp className="w-2.5 h-2.5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-[11px] leading-none">Curva S: Planejado vs. Realizado</h2>
                  <span className="text-[7px] text-slate-400">Acompanhamento de desvio físico-financeiro no tempo</span>
                </div>
              </div>

              {/* View Tabs: Gráfico / Canteiros / Ambos */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200">
                <button
                  id="btn-tab-curva-grafico"
                  onClick={() => setCurvaViewTab('grafico')}
                  className={`px-1.5 py-0.2 rounded text-[7px] font-bold transition-all cursor-pointer flex items-center gap-0.5 ${
                    curvaViewTab === 'grafico' ? 'bg-white text-red-700 shadow-2xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Exibir Gráfico de Linha da Curva S"
                >
                  <LineChartIcon className="w-2 h-2" />
                  <span>Curva S</span>
                </button>
                <button
                  id="btn-tab-curva-canteiros"
                  onClick={() => setCurvaViewTab('canteiros')}
                  className={`px-1.5 py-0.2 rounded text-[7px] font-bold transition-all cursor-pointer flex items-center gap-0.5 ${
                    curvaViewTab === 'canteiros' ? 'bg-white text-red-700 shadow-2xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Exibir Canteiros & Fases"
                >
                  <Building2 className="w-2 h-2" />
                  <span>Canteiros</span>
                </button>
                <button
                  id="btn-tab-curva-ambos"
                  onClick={() => setCurvaViewTab('ambos')}
                  className={`px-1.5 py-0.2 rounded text-[7px] font-bold transition-all cursor-pointer ${
                    curvaViewTab === 'ambos' ? 'bg-white text-red-700 shadow-2xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Visão Consolidada Gráfico + Canteiros"
                >
                  Ambos
                </button>
              </div>
            </div>

            {/* Curva S Filters Strip: Obra Selector & Unit Toggle (% Físico vs R$ Financeiro) */}
            <div className="flex flex-wrap items-center justify-between gap-1 p-1 bg-slate-50 rounded border border-slate-100 mb-1.5 text-[7px]">
              <div className="flex items-center gap-1 min-w-0">
                <span className="font-bold text-slate-500 uppercase shrink-0">Obra:</span>
                <select
                  id="select-curva-s-obra"
                  value={curvaObraFilter}
                  onChange={(e) => setCurvaObraFilter(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-900 text-[7px] font-bold rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-red-600 cursor-pointer truncate max-w-[160px]"
                >
                  <option value="all">Portfólio Global (Consolidado)</option>
                  {obras.map(o => (
                    <option key={o.id} value={String(o.id)}>
                      {o.nome} ({o.progresso || 45}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-500 uppercase">Métrica:</span>
                <div className="flex items-center bg-slate-200/80 p-0.2 rounded">
                  <button
                    id="btn-curva-unit-pct"
                    onClick={() => setCurvaUnit('percentual')}
                    className={`px-1.5 py-0.2 rounded text-[6.5px] font-bold transition-all cursor-pointer ${
                      curvaUnit === 'percentual' ? 'bg-white text-red-700 shadow-2xs font-extrabold' : 'text-slate-600'
                    }`}
                  >
                    % Físico
                  </button>
                  <button
                    id="btn-curva-unit-fin"
                    onClick={() => setCurvaUnit('financeiro')}
                    className={`px-1.5 py-0.2 rounded text-[6.5px] font-bold transition-all cursor-pointer ${
                      curvaUnit === 'financeiro' ? 'bg-white text-red-700 shadow-2xs font-extrabold' : 'text-slate-600'
                    }`}
                  >
                    R$ Custo
                  </button>
                </div>
              </div>
            </div>

            {/* CURVA S EXECUTIVE KPI METRICS STRIP */}
            {(curvaViewTab === 'grafico' || curvaViewTab === 'ambos') && (
              <div className="grid grid-cols-4 gap-1 mb-1.5 text-center">
                <div className="p-1 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[6px] uppercase font-bold text-slate-400 block truncate">Planejado (Ago/26)</span>
                  <span className="text-[8.5px] font-mono font-black text-slate-700 leading-tight">
                    {curvaUnit === 'percentual' ? `${curvaSMetrics.progPlanejadoAtual}%` : formatCurrency(curvaSMetrics.series[7].custoPlanejado)}
                  </span>
                </div>

                <div className="p-1 bg-red-50/60 rounded border border-red-100">
                  <span className="text-[6px] uppercase font-bold text-red-800 block truncate">Realizado (Ago/26)</span>
                  <span className="text-[8.5px] font-mono font-black text-red-700 leading-tight">
                    {curvaUnit === 'percentual' ? `${curvaSMetrics.progRealizadoAtual}%` : formatCurrency(curvaSMetrics.series[7].custoRealizado || 0)}
                  </span>
                </div>

                <div className={`p-1 rounded border ${
                  curvaSMetrics.desvioAtualPct >= 0 
                    ? 'bg-emerald-50/80 border-emerald-200' 
                    : 'bg-amber-50/80 border-amber-200'
                }`}>
                  <span className="text-[6px] uppercase font-bold text-slate-500 block truncate">Desvio (&Delta;)</span>
                  <span className={`text-[8.5px] font-mono font-black leading-tight ${
                    curvaSMetrics.desvioAtualPct >= 0 ? 'text-emerald-700' : 'text-amber-800'
                  }`}>
                    {curvaUnit === 'percentual'
                      ? `${curvaSMetrics.desvioAtualPct >= 0 ? '+' : ''}${curvaSMetrics.desvioAtualPct}% pts`
                      : `${curvaSMetrics.desvioAtualFinanceiro >= 0 ? '+' : ''}${formatCurrency(curvaSMetrics.desvioAtualFinanceiro)}`
                    }
                  </span>
                </div>

                <div className={`p-1 rounded border ${
                  curvaSMetrics.spiStatus === 'adiantado' ? 'bg-emerald-50/80 border-emerald-200' :
                  curvaSMetrics.spiStatus === 'no_prazo' ? 'bg-blue-50/80 border-blue-200' : 'bg-red-50/80 border-red-200'
                }`}>
                  <span className="text-[6px] uppercase font-bold text-slate-500 block truncate">SPI / IDP Prazo</span>
                  <div className="flex items-center justify-center gap-0.5">
                    <span className={`text-[8.5px] font-mono font-black leading-tight ${
                      curvaSMetrics.spiStatus === 'adiantado' ? 'text-emerald-700' :
                      curvaSMetrics.spiStatus === 'no_prazo' ? 'text-blue-700' : 'text-red-700'
                    }`}>
                      {curvaSMetrics.spi.toFixed(2)}
                    </span>
                    <span className={`text-[5.5px] font-bold px-0.5 rounded ${
                      curvaSMetrics.spiStatus === 'adiantado' ? 'bg-emerald-200 text-emerald-950' :
                      curvaSMetrics.spiStatus === 'no_prazo' ? 'bg-blue-200 text-blue-950' : 'bg-red-200 text-red-950'
                    }`}>
                      {curvaSMetrics.spiStatus === 'adiantado' ? 'Adiant.' : curvaSMetrics.spiStatus === 'no_prazo' ? 'No Prazo' : 'Atraso'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* RECHARTS CURVA S LINE CHART COMPONENT */}
            {(curvaViewTab === 'grafico' || curvaViewTab === 'ambos') && (
              <div 
                id="recharts-curva-s-container"
                className="p-1.5 bg-slate-50/70 rounded-md border border-slate-100 mb-1.5 relative"
              >
                <div className="flex items-center justify-between text-[7px] text-slate-500 mb-1 px-1">
                  <span className="font-bold flex items-center gap-1 text-slate-700">
                    <TrendingUp className="w-2 h-2 text-red-600" />
                    {curvaSMetrics.selectedObraNome}
                  </span>
                  <div className="flex items-center gap-2 font-mono text-[6.5px]">
                    <span className="flex items-center gap-1 text-slate-600">
                      <span className="w-2.5 h-0.5 bg-slate-500 inline-block border-b border-dashed border-slate-400" />
                      Planejado
                    </span>
                    <span className="flex items-center gap-1 text-red-700 font-bold">
                      <span className="w-2.5 h-1 bg-red-600 inline-block rounded-full" />
                      Realizado
                    </span>
                  </div>
                </div>

                <div className="w-full h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={curvaSMetrics.series} 
                      margin={{ top: 8, right: 10, left: -22, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" vertical={false} />
                      <XAxis 
                        dataKey="mesLabel" 
                        tick={{ fontSize: 7, fill: '#64748b', fontWeight: 600 }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={{ stroke: '#cbd5e1' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 7, fill: '#64748b' }}
                        domain={curvaUnit === 'percentual' ? [0, 100] : ['auto', 'auto']}
                        tickFormatter={(v) => curvaUnit === 'percentual' ? `${v}%` : `${(v / 1000000).toFixed(1)}M`}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={{ stroke: '#cbd5e1' }}
                      />
                      <RechartsTooltip 
                        content={<CurvaSTooltip curvaUnit={curvaUnit} />} 
                      />
                      <ReferenceLine 
                        x="Ago/26" 
                        stroke="#dc2626" 
                        strokeDasharray="3 3"
                        strokeWidth={1.5}
                        label={{ 
                          value: 'Ago/26 (Atual)', 
                          position: 'top', 
                          fill: '#b91c1c', 
                          fontSize: 6.5, 
                          fontWeight: 'bold' 
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey={curvaUnit === 'percentual' ? 'progressoPlanejado' : 'custoPlanejado'} 
                        name="Planejado (Baseline)" 
                        stroke="#64748b" 
                        strokeWidth={1.75} 
                        strokeDasharray="3 3" 
                        dot={{ r: 2, fill: '#64748b' }} 
                        activeDot={{ r: 4, stroke: '#334155', strokeWidth: 1.5 }}
                        isAnimationActive={true}
                      />
                      <Line 
                        type="monotone" 
                        dataKey={curvaUnit === 'percentual' ? 'progressoRealizado' : 'custoRealizado'} 
                        name="Realizado (Executado)" 
                        stroke="#dc2626" 
                        strokeWidth={2.5} 
                        dot={{ r: 2.5, fill: '#dc2626' }} 
                        activeDot={{ r: 5, stroke: '#991b1b', strokeWidth: 2 }}
                        connectNulls={false}
                        isAnimationActive={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Budget Summary Bar (Curva S) with Hover Tooltip */}
            <div 
              className="p-1.5 bg-slate-50 rounded border border-slate-100 mb-1.5 transition-all hover:border-slate-300 cursor-pointer"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setBudgetTooltip({ x: rect.left + rect.width / 2, y: rect.top });
              }}
              onMouseLeave={() => setBudgetTooltip(null)}
              onClick={() => onNavigate('obras')}
            >
              <div className="flex items-center justify-between text-[8px] mb-0.5">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  Comprometimento Global: <strong className="text-slate-900">{budgetUtilizationPct}%</strong>
                  <Info className="w-2 h-2 text-slate-400" />
                </span>
                <span className="font-mono text-slate-500 text-[7.5px]">{formatCurrency(orcamentoRealizadoTotal)} de {formatCurrency(orcamentoTotal)}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden relative">
                <div 
                  className={`h-full rounded-full transition-all ${
                    budgetUtilizationPct > 90 ? 'bg-amber-500' : 'bg-red-700'
                  }`}
                  style={{ width: `${Math.min(100, budgetUtilizationPct)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[7px] text-slate-500 mt-0.5">
                <span>Saldo Disponível: <strong className="text-slate-800">{formatCurrency(saldoOrcamentario)}</strong></span>
                <span className={`font-bold ${budgetUtilizationPct > 100 ? 'text-red-700' : 'text-emerald-700'}`}>
                  {budgetUtilizationPct > 100 ? 'Orçamento excedido' : 'Dentro do planejado'}
                </span>
              </div>
            </div>

            {/* Canteiros List with Phase Tooltips, Zoom & >90% INSUMOS RED ALERT ENGINE */}
            {(curvaViewTab === 'canteiros' || curvaViewTab === 'ambos') && (
              <div className="space-y-1">
                {/* Zoom Sub-selector when in canteiros tab */}
                <div className="flex items-center justify-between px-1 text-[7px] text-slate-500">
                  <span className="font-bold">Canteiros Ativos & Fases:</span>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200">
                    <span className="text-[6px] font-bold text-slate-500">Zoom:</span>
                    <button
                      onClick={() => setZoomLevel('1x')}
                      className={`px-1 py-0.2 rounded text-[6.5px] font-bold cursor-pointer ${
                        zoomLevel === '1x' ? 'bg-white text-red-700 shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      1x
                    </button>
                    <button
                      onClick={() => setZoomLevel('1.5x')}
                      className={`px-1 py-0.2 rounded text-[6.5px] font-bold cursor-pointer ${
                        zoomLevel === '1.5x' ? 'bg-white text-red-700 shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      1.5x
                    </button>
                    <button
                      onClick={() => setZoomLevel('2x')}
                      className={`px-1 py-0.2 rounded text-[6.5px] font-bold cursor-pointer ${
                        zoomLevel === '2x' ? 'bg-white text-red-700 shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      2x
                    </button>
                  </div>
                </div>
              {(selectedGlobalObraId === 'all' ? obras.slice(0, 3) : effectiveObras).map((obra) => {
                const phases = computeObraPhases(obra);
                const isExpanded = expandedObraZoomId === obra.id || zoomLevel === '2x';
                const isPhaseMode = zoomLevel === '1.5x' || isExpanded;
                const obraInsumos = computeObraInsumosMetrics(obra);

                return (
                  <div 
                    key={obra.id} 
                    className={`p-1.5 rounded border transition-all ${
                      obraInsumos.isExcedeu90Pct
                        ? 'bg-red-50/95 border-red-500 shadow-xs ring-2 ring-red-400'
                        : isExpanded 
                          ? 'bg-slate-50/95 border-red-300 shadow-2xs ring-1 ring-red-200' 
                          : 'bg-slate-50/80 border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-1">
                      <div className="min-w-0 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${obraInsumos.isExcedeu90Pct ? 'bg-red-600 animate-ping' : 'bg-red-600'}`} />
                        <span className="font-bold text-[10px] text-slate-900 truncate block leading-tight">{obra.nome}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Quick Zoom Inspector Button for this Obra */}
                        <button
                          onClick={() => setModalObraZoom(obra)}
                          className="p-0.5 bg-slate-200/80 hover:bg-red-700 hover:text-white text-slate-600 rounded text-[6.5px] font-bold flex items-center gap-0.5 transition-all cursor-pointer"
                          title="Abrir Zoom Detalhado de Fases"
                        >
                          <ZoomIn className="w-2 h-2" />
                          <span className="hidden sm:inline">Inspecionar</span>
                        </button>

                        {/* Expand / Collapse In-Card Zoom */}
                        <button
                          onClick={() => setExpandedObraZoomId(expandedObraZoomId === obra.id ? null : obra.id)}
                          className="p-0.5 bg-slate-200/80 hover:bg-slate-300 text-slate-600 rounded text-[6.5px] font-bold transition-all cursor-pointer"
                          title={isExpanded ? "Recolher Fases" : "Expandir Fases"}
                        >
                          {isExpanded ? <Minimize2 className="w-2 h-2" /> : <Maximize2 className="w-2 h-2" />}
                        </button>

                        <span className={`text-[6.5px] px-1 py-0.2 rounded font-bold uppercase shrink-0 ${
                          obra.status === 'em_andamento' ? 'bg-emerald-100 text-emerald-800' :
                          obra.status === 'planejamento' ? 'bg-amber-100 text-amber-800' :
                          obra.status === 'concluida' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {obra.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* CRITICAL BUDGET ALERT BANNER: Consumo de Insumos Excedeu 90% */}
                    {obraInsumos.isExcedeu90Pct && (
                      <div 
                        id={`alert-insumos-excedeu-90-${obra.id}`}
                        className="mt-1 p-1 bg-red-600 text-white rounded flex items-center justify-between gap-1 shadow-2xs"
                      >
                        <div className="flex items-center gap-1 min-w-0">
                          <AlertTriangle className="w-2.5 h-2.5 text-amber-200 shrink-0" />
                          <span className="text-[7px] font-black uppercase tracking-tight truncate">
                            Alerta Crítico: Consumo de Insumos em {obraInsumos.percentualConsumoInsumos}% da categoria
                          </span>
                        </div>
                        <span className="text-[6.5px] bg-red-950 px-1 py-0.2 rounded font-mono font-bold shrink-0">
                          &gt;90% Teto
                        </span>
                      </div>
                    )}

                    {/* Progress Info */}
                    <div className="mt-0.5">
                      <div className="flex justify-between text-[7px] font-semibold text-slate-600 mb-0.5">
                        <span className="flex items-center gap-1">
                          Fase Ativa: <strong className="text-slate-800 uppercase">{obra.fase_atual || 'Estrutura'}</strong>
                        </span>
                        <span className="text-red-700 font-black">{obra.progresso || 45}%</span>
                      </div>

                      {/* 1X / 1.5X Interactive Multi-Phase Progress Track */}
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex cursor-pointer p-0.5 gap-0.5">
                        {phases.map((fase) => (
                          <div
                            key={fase.id}
                            style={{ width: `${fase.weight}%` }}
                            className="h-full relative rounded-sm bg-slate-300/80 overflow-hidden group/phase hover:ring-1 hover:ring-slate-900 transition-all"
                            onMouseEnter={(e) => handlePhaseMouseEnter(e, obra, fase)}
                            onMouseLeave={handlePhaseMouseLeave}
                            onClick={() => setModalObraZoom(obra)}
                          >
                            {/* Fill portion inside segment */}
                            <div 
                              className={`h-full rounded-xs transition-all ${
                                fase.progresso === 100 ? 'bg-emerald-600' :
                                fase.progresso > 0 ? (fase.categoria === 'fundacao' ? 'bg-amber-500' : fase.categoria === 'estrutura' ? 'bg-blue-600' : fase.categoria === 'instalacoes' ? 'bg-teal-500' : 'bg-purple-600') :
                                'bg-transparent'
                              }`}
                              style={{ width: `${fase.progresso}%` }}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Insumos Specific Progress Track when Overrun Alert is active or in card */}
                      <div className="mt-1 pt-0.5 border-t border-slate-200/80">
                        <div className="flex justify-between text-[6.5px] font-bold mb-0.5">
                          <span className={`flex items-center gap-0.5 ${obraInsumos.isExcedeu90Pct ? 'text-red-800 font-black' : 'text-slate-600'}`}>
                            <Package className={`w-2 h-2 ${obraInsumos.isExcedeu90Pct ? 'text-red-600' : 'text-slate-400'}`} />
                            Consumo Insumos:
                          </span>
                          <span className={`font-mono ${obraInsumos.isExcedeu90Pct ? 'text-red-700 font-black' : 'text-slate-700'}`}>
                            {obraInsumos.percentualConsumoInsumos}% ({formatCurrency(obraInsumos.consumoAcumuladoInsumos)} de {formatCurrency(obraInsumos.orcamentoInsumos)})
                          </span>
                        </div>
                        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              obraInsumos.isExcedeu90Pct ? 'bg-red-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, obraInsumos.percentualConsumoInsumos)}%` }}
                          />
                        </div>
                      </div>

                      {/* Micro Phase Badges with Hover Tooltip under the bar */}
                      <div className="flex justify-between items-center text-[6px] text-slate-400 mt-0.5 pt-0.5 border-t border-slate-100 font-medium">
                        {phases.map((fase) => (
                          <button
                            key={fase.id}
                            onMouseEnter={(e) => handlePhaseMouseEnter(e, obra, fase)}
                            onMouseLeave={handlePhaseMouseLeave}
                            onClick={() => setModalObraZoom(obra)}
                            className={`px-0.5 py-0.2 rounded font-bold transition-all truncate max-w-[20%] text-center cursor-pointer ${
                              fase.progresso === 100 ? 'text-emerald-700 font-extrabold bg-emerald-50/80' :
                              fase.progresso > 0 ? 'text-slate-800 font-extrabold bg-slate-200/80' :
                              'text-slate-400 hover:text-slate-700'
                            }`}
                          >
                            {fase.categoria.slice(0, 4)}: {fase.progresso}%
                          </button>
                        ))}
                      </div>

                      {/* EXPANDED IN-CARD 2X ZOOM: Finer 5-Phase Sub-Track Detailed View */}
                      {isExpanded && (
                        <div className="mt-1 pt-1 border-t border-slate-200 space-y-1 bg-white/90 p-1.5 rounded">
                          <div className="flex items-center justify-between text-[7px] font-bold text-slate-700 pb-0.5 border-b border-slate-100">
                            <span className="flex items-center gap-1 text-red-800">
                              <Sparkles className="w-2 h-2 text-red-600" />
                              Detalhamento de Fases de Engenharia (Zoom 2x)
                            </span>
                            <span className="text-[6.5px] text-slate-400 font-mono">Passe o mouse p/ detalhes</span>
                          </div>

                          <div className="space-y-1">
                            {phases.map((fase) => (
                              <div 
                                key={fase.id} 
                                onMouseEnter={(e) => handlePhaseMouseEnter(e, obra, fase)}
                                onMouseLeave={handlePhaseMouseLeave}
                                onClick={() => setModalObraZoom(obra)}
                                className="flex items-center justify-between gap-1 p-0.5 rounded hover:bg-slate-100 transition-all cursor-pointer text-[7px]"
                              >
                                <div className="min-w-0 flex items-center gap-1 w-1/3">
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    fase.status === 'concluida' ? 'bg-emerald-500' :
                                    fase.status === 'em_andamento' ? 'bg-blue-600 animate-pulse' :
                                    fase.status === 'atrasada' ? 'bg-red-500' : 'bg-slate-300'
                                  }`} />
                                  <span className="font-semibold text-slate-800 truncate">{fase.nome.split('.')[1] || fase.nome}</span>
                                </div>

                                <div className="w-1/3 px-1">
                                  <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${
                                        fase.progresso === 100 ? 'bg-emerald-500' :
                                        fase.progresso > 0 ? 'bg-red-600' : 'bg-transparent'
                                      }`}
                                      style={{ width: `${fase.progresso}%` }}
                                    />
                                  </div>
                                </div>

                                <div className="w-1/3 text-right flex items-center justify-end gap-1 font-mono text-[6.5px]">
                                  <span className="text-slate-500 font-bold">{fase.progresso}%</span>
                                  <span className="text-slate-400 truncate">{fase.fimStr}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between text-[6.5px] text-slate-400 mt-0.5 font-mono">
                        <span>Orç: {formatCurrency(obra.orcamento_total)}</span>
                        <span>Prev: {obra.data_previsao_termino}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>

          {/* Footer Meta */}
          <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-between text-[7px] text-slate-500">
            <span className="font-bold text-slate-700">Total Portfolio: {formatCurrency(orcamentoTotal)}</span>
            <span className="text-red-700 font-bold hover:underline cursor-pointer flex items-center gap-0.5" onClick={() => onNavigate('obras')}>
              Ver todas ({obras.length}) <ChevronRight className="w-1.5 h-1.5" />
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION B: CENTER COLUMN (Col Span 4) - Portfólio, Fases & Maquinários    */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 bg-white p-2 rounded-md border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Building2 className="w-2.5 h-2.5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-[11px] leading-none">Status & Fases de Engenharia</h2>
                  <span className="text-[7px] text-slate-400">Distribuição do portfólio e maquinários</span>
                </div>
              </div>
              <button 
                onClick={() => onNavigate('obras')} 
                className="text-[7.5px] text-red-700 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Obras</span>
                <ChevronRight className="w-2 h-2" />
              </button>
            </div>

            {/* Status Grid 2x2 */}
            <div className="grid grid-cols-2 gap-1 mb-1.5">
              <div className="p-1 bg-slate-50 rounded border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[7.5px] font-semibold text-slate-700">Em Andamento</span>
                </div>
                <span className="text-[9px] font-black text-slate-900">{statusObras.em_andamento}</span>
              </div>
              <div className="p-1 bg-slate-50 rounded border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="text-[7.5px] font-semibold text-slate-700">Planejamento</span>
                </div>
                <span className="text-[9px] font-black text-slate-900">{statusObras.planejamento}</span>
              </div>
              <div className="p-1 bg-slate-50 rounded border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-[7.5px] font-semibold text-slate-700">Concluídas</span>
                </div>
                <span className="text-[9px] font-black text-slate-900">{statusObras.concluida}</span>
              </div>
              <div className="p-1 bg-slate-50 rounded border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="text-[7.5px] font-semibold text-slate-700">Pausadas</span>
                </div>
                <span className="text-[9px] font-black text-slate-900">{statusObras.pausada}</span>
              </div>
            </div>

            {/* Active Phases Mini Badges with Interactive Hover Tooltip */}
            <div className="mb-1.5">
              <span className="text-[7px] uppercase font-bold text-slate-400 block mb-0.5">Canteiros por Fase Ativa (Hover p/ Obras)</span>
              <div className="grid grid-cols-3 gap-1 text-center">
                <div 
                  className="bg-amber-50/80 px-1 py-0.5 rounded border border-amber-100 hover:border-amber-400 transition-all cursor-pointer"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setPhaseCountTooltip({ categoria: 'Fundação & Contenções', count: fasesObras.fundacao, obras: obrasNaFundacao, x: rect.left + rect.width / 2, y: rect.top });
                  }}
                  onMouseLeave={() => setPhaseCountTooltip(null)}
                  onClick={() => onNavigate('obras')}
                >
                  <span className="text-[6.5px] font-bold text-amber-700 block">Fundação</span>
                  <span className="text-[9.5px] font-black text-amber-900 leading-tight">{fasesObras.fundacao}</span>
                </div>
                
                <div 
                  className="bg-blue-50/80 px-1 py-0.5 rounded border border-blue-100 hover:border-blue-400 transition-all cursor-pointer"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setPhaseCountTooltip({ categoria: 'Estrutura & Alvenaria', count: fasesObras.estrutura, obras: obrasNaEstrutura, x: rect.left + rect.width / 2, y: rect.top });
                  }}
                  onMouseLeave={() => setPhaseCountTooltip(null)}
                  onClick={() => onNavigate('obras')}
                >
                  <span className="text-[6.5px] font-bold text-blue-700 block">Estrutura</span>
                  <span className="text-[9.5px] font-black text-blue-900 leading-tight">{fasesObras.estrutura}</span>
                </div>

                <div 
                  className="bg-purple-50/80 px-1 py-0.5 rounded border border-purple-100 hover:border-purple-400 transition-all cursor-pointer"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setPhaseCountTooltip({ categoria: 'Acabamento & Revestimentos', count: fasesObras.acabamento, obras: obrasNoAcabamento, x: rect.left + rect.width / 2, y: rect.top });
                  }}
                  onMouseLeave={() => setPhaseCountTooltip(null)}
                  onClick={() => onNavigate('obras')}
                >
                  <span className="text-[6.5px] font-bold text-purple-700 block">Acabamento</span>
                  <span className="text-[9.5px] font-black text-purple-900 leading-tight">{fasesObras.acabamento}</span>
                </div>
              </div>
            </div>

            {/* Active Maintenance Tasks Widget */}
            <div 
              onClick={() => onNavigate('almoxarifado')}
              className="p-1.5 bg-amber-50/60 rounded border border-amber-200/80 hover:border-amber-400 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1">
                  <Wrench className="w-2.5 h-2.5 text-amber-700" />
                  <span className="text-[8px] font-bold text-amber-950">Active Maintenance Tasks</span>
                </div>
                <span className="text-[6.5px] bg-amber-200/80 text-amber-950 px-1 py-0.2 rounded font-bold">
                  {availabilityRate}% Disponibilidade
                </span>
              </div>
              <div className="flex items-center justify-between text-[7px] text-amber-900">
                <span>{itensManutencao} em reparo · {itensDefeito} c/ defeito</span>
                <span className="font-mono font-bold">{formatCurrency(valorEquipManutencao)}</span>
              </div>
            </div>
          </div>

          {/* Footer Meta */}
          <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-between text-[7px] text-slate-500">
            <span>Ativos Almox: <strong className="text-slate-800">{formatCurrency(valorTotalAlmox)}</strong></span>
            <span className="text-amber-800 font-bold hover:underline cursor-pointer flex items-center gap-0.5" onClick={() => onNavigate('almoxarifado')}>
              Oficina Almox <ChevronRight className="w-1.5 h-1.5" />
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION C: RIGHT COLUMN (Col Span 3) - SST, Qualidade & Feed Operacional  */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 bg-white p-2 rounded-md border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-purple-50 text-purple-700 flex items-center justify-center">
                  <ShieldCheck className="w-2.5 h-2.5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-[11px] leading-none">SST & Movimentações</h2>
                  <span className="text-[7px] text-slate-400">Auditoria NR-18 e fluxo de campo</span>
                </div>
              </div>
              <button 
                onClick={() => onNavigate('documentos')} 
                className="text-[7.5px] text-purple-800 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Auditoria</span>
                <ChevronRight className="w-2 h-2" />
              </button>
            </div>

            {/* Document Compliance & SST */}
            <div 
              onClick={() => onNavigate('documentos')}
              className="p-1.5 bg-purple-50/50 rounded border border-purple-100 hover:border-purple-300 transition-all cursor-pointer mb-1.5"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[7.5px] font-bold text-purple-950">Conformidade Documental</span>
                <span className={`text-[7px] font-black ${documentComplianceRate >= 90 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {documentComplianceRate}%
                </span>
              </div>
              <div className="w-full h-1 bg-purple-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${documentComplianceRate >= 90 ? 'bg-emerald-600' : 'bg-amber-500'}`}
                  style={{ width: `${documentComplianceRate}%` }}
                />
              </div>
              <div className="flex justify-between text-[6.5px] text-purple-900 mt-0.5">
                <span>{docsAprovados} aprovados · {docsPendentes} pendentes</span>
                <span className="font-bold text-red-700">{docsVencidosReprovados} vencidos</span>
              </div>
            </div>

            {/* Micro Feed Operacional */}
            <div>
              <span className="text-[7px] uppercase font-bold text-slate-400 block mb-0.5">Últimas Movimentações</span>
              <div className="space-y-1">
                {/* Critical Material Alert */}
                {materiais.filter(m => m.quantidade_atual <= m.quantidade_minima).slice(0, 1).map((mat) => (
                  <div key={mat.id} className="p-1 bg-amber-50/90 rounded border border-amber-200 flex items-center justify-between">
                    <div className="min-w-0 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-bold text-[9px] text-amber-950 block truncate leading-tight">{mat.nome}</span>
                        <span className="text-[6.5px] text-amber-800">{mat.quantidade_atual}/{mat.quantidade_minima} {mat.unidade_medida}</span>
                      </div>
                    </div>
                    <button
                      onClick={onOpenNovaSolicitacao}
                      className="px-1 py-0.2 bg-red-800 text-white rounded text-[6.5px] font-bold hover:bg-red-700 shrink-0 cursor-pointer"
                    >
                      Repor
                    </button>
                  </div>
                ))}

                {/* Almoxarifado Movement */}
                {movimentacoesAlmox.slice(0, 2).map((m) => (
                  <div key={m.id} className="p-1 bg-slate-50/80 rounded border border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className={`text-[6px] px-1 py-0.2 rounded font-bold uppercase shrink-0 ${
                        m.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-800' :
                        m.tipo === 'saida' ? 'bg-amber-100 text-amber-800' :
                        m.tipo === 'manutencao' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {m.tipo}
                      </span>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 text-[9px] block truncate leading-tight">{m.item_nome}</span>
                        <span className="text-[6.5px] text-slate-500 block truncate">
                          {m.colaborador_nome || m.observacao || 'Movimentação'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[6.5px] text-slate-400 font-mono shrink-0 ml-1">
                      {m.data_movimentacao.split(' ')[1] || m.data_movimentacao}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Meta */}
          <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-between text-[7px] text-slate-500">
            <span>Vistorias: <strong className="text-slate-800">{vistoriasConcluidas} ok</strong> / {vistoriasPendentes} pend.</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
              Sincronizado
            </span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3.7. PROJEÇÃO DE DATA DE ENTREGA POR RITMO DE EVOLUÇÃO (DIAS POR PONTO %) */}
      {/* ========================================================================= */}
      <ProjectDeliveryProjectionCard
        obras={effectiveObras}
        onNavigate={onNavigate}
        onSelectObra={(obra) => setModalObraZoom(obra)}
        onSendNotification={(title, message) => {
          if (onSendNotification) {
            onSendNotification({
              titulo: title,
              mensagem: message
            });
          }
        }}
      />

      {/* ========================================================================= */}
      {/* 3.75. STATUS DO ORÇAMENTO DAS OBRAS - RECHARTS DONUT (COMPROMETIDO VS DISPONÍVEL) */}
      {/* ========================================================================= */}
      <BudgetDonutChartCard
        obras={obras}
        selectedObraId={selectedGlobalObraId}
        onSelectObra={handleGlobalObraSelect}
        onNavigate={onNavigate}
        onOpenNovaSolicitacao={onOpenNovaSolicitacao}
      />

      {/* ========================================================================= */}
      {/* 3.8. SAÚDE FINANCEIRA DOS PROJETOS (D3.JS BAR CHART: ORÇAMENTO VS MATERIAIS VS ALMOX) */}
      {/* ========================================================================= */}
      <ProjectFinancialHealthD3Chart
        obras={effectiveObras}
        itensAlmoxarifado={effectiveItensAlmoxarifado}
        materiais={effectiveMateriais}
        onNavigate={onNavigate}
        onSelectObra={(obra) => setModalObraZoom(obra)}
      />

      {/* ========================================================================= */}
      {/* 4. ALERTA DE ESTOQUE DE SEGURANÇA & REPOSIÇÃO RÁPIDA EM 1-CLIQUE          */}
      {/* ========================================================================= */}
      <CriticalStockAlertSection
        materiais={effectiveMateriais}
        obras={effectiveObras}
        onNavigate={onNavigate}
        onOpenNovaSolicitacao={onOpenNovaSolicitacao}
        onQuickReplenish={onQuickReplenish}
      />

      {/* ========================================================================= */}
      {/* 5. LINHA DO TEMPO DE VISTORIAS & AUDITORIAS TÉCNICAS (CRONOGRAMA DE CAMPO) */}
      {/* ========================================================================= */}
      <InspectionTimelineWidget
        vistorias={effectiveVistorias}
        obras={effectiveObras}
        onNavigate={onNavigate}
        onOpenNovaVistoria={onOpenNovaVistoria}
        onConcluirVistoria={onConcluirVistoria}
        onSendNotification={onSendNotification}
      />

      {/* ========================================================================= */}
      {/* 5.5. ANÁLISE DE CONFORMIDADE (% DE ITENS CONFORMES NOS ÚLTIMOS 30 DIAS POR CANTEIRO) */}
      {/* ========================================================================= */}
      <ComplianceAnalysisCard
        vistorias={vistorias}
        obras={obras}
        selectedObraId={selectedGlobalObraId}
        onSelectObra={handleGlobalObraSelect}
        onNavigate={onNavigate}
        onOpenNovaVistoria={onOpenNovaVistoria}
        onSendNotification={onSendNotification}
      />

      {/* ========================================================================= */}
      {/* 6. COLABORADORES COM DOCUMENTOS SST A VENCER (PRÓXIMOS 15 DIAS - TOP 5)    */}
      {/* ========================================================================= */}
      <UpcomingExpiringDocsSection
        documentos={effectiveDocumentos}
        colaboradores={effectiveColaboradores}
        obras={effectiveObras}
        onRenovarDocumento={onRenovarDocumento}
        onSendNotification={onSendNotification}
        onNavigate={onNavigate}
      />

      {/* ========================================================================= */}
      {/* 7. PAINEL DE AVISOS DE SAÚDE OCUPACIONAL & ASO (NR-7 / PCMSO)             */}
      {/* ========================================================================= */}
      <AsoAlertPanel
        documentos={effectiveDocumentos}
        colaboradores={effectiveColaboradores}
        obras={effectiveObras}
        onNavigate={onNavigate}
        onSendNotification={onSendNotification}
      />

      {/* ========================================================================= */}
      {/* 6.9. TENDÊNCIA DE INCIDENTES DE SEGURANÇA (ÚLTIMOS 6 MESES & EFICÁCIA SST) */}
      {/* ========================================================================= */}
      <SafetyIncidentTrendLineChart
        incidentes={effectiveIncidentes}
        obras={obras}
        selectedObraId={selectedGlobalObraId}
        onSelectObra={handleGlobalObraSelect}
        onNavigate={onNavigate}
        onAddIncidente={onAddIncidente}
        onSendNotification={onSendNotification}
      />

      {/* ========================================================================= */}
      {/* 7. MAPA DE CALOR DE RISCOS & MATRIZ DE INCIDENTES (CRUZAMENTO VISTORIAS/SST) */}
      {/* ========================================================================= */}
      <RiskHeatmapWidget
        obras={effectiveObras}
        vistorias={effectiveVistorias}
        documentos={effectiveDocumentos}
        colaboradores={effectiveColaboradores}
        incidentes={effectiveIncidentes}
        onNavigate={onNavigate}
        onOpenNovaVistoria={onOpenNovaVistoria}
        onSendNotification={onSendNotification}
        onAddIncidente={onAddIncidente}
      />

      {/* ========================================================================= */}
      {/* 8. MONITORAMENTO DE VIGÊNCIA DE CONTRATOS DE SUBEMPREITEIRAS (< 30 DIAS)   */}
      {/* ========================================================================= */}
      <ContractExpiryMonitoringCard
        contratos={effectiveContratos}
        obras={effectiveObras}
        selectedObraId={selectedGlobalObraId}
        onNavigate={onNavigate}
        onSendNotification={onSendNotification}
        onUpdateContrato={onUpdateContrato}
      />

      {/* ========================================================================= */}
      {/* 9. MONITORAMENTO DE MÃO DE OBRA TERCEIRIZADA & SUBEMPREITEIRAS (CONTRATOS/SST) */}
      {/* ========================================================================= */}
      <ThirdPartyWorkforcePanel
        obras={effectiveObras}
        colaboradores={effectiveColaboradores}
        documentos={effectiveDocumentos}
        contratos={effectiveContratos}
        onNavigate={onNavigate}
        onSendNotification={onSendNotification}
        onUpdateContrato={onUpdateContrato}
      />

      {/* ========================================================================= */}
      {/* 9. ALERTA DE FICHA DE ENTREGA DE EPI & CONFORMIDADE NR-06                 */}
      {/* ========================================================================= */}
      <EpiComplianceAlertPanel
        colaboradores={effectiveColaboradores}
        documentos={effectiveDocumentos}
        obras={effectiveObras}
        onNavigate={onNavigate}
        onSendNotification={onSendNotification}
        onUploadEpiDoc={onUploadEpiDoc}
      />

      {/* ========================================================================= */}
      {/* 10. MONITORAMENTO DE CONFORMIDADE DE SEGURANÇA & SST (WIDGET COMPLETO)    */}
      {/* ========================================================================= */}
      <SafetyComplianceWidget
        documentos={effectiveDocumentos}
        vistorias={effectiveVistorias}
        obras={effectiveObras}
        colaboradores={effectiveColaboradores}
        onNavigate={onNavigate}
        onOpenNovaVistoria={onOpenNovaVistoria}
      />

      {/* ========================================================================= */}
      {/* 4. HIGH-PRECISION FLOATING TOOLTIP FOR PROJECT PHASES                     */}
      {/* ========================================================================= */}
      {activeTooltip && (
        <div 
          id="phase-hover-tooltip"
          className="fixed z-50 pointer-events-none transition-opacity duration-150 -translate-x-1/2 -translate-y-full mb-2 w-72 bg-slate-900/95 text-white p-2.5 rounded-lg shadow-2xl border border-slate-700 backdrop-blur-md"
          style={{ 
            left: `${Math.max(150, Math.min(window.innerWidth - 150, activeTooltip.x))}px`, 
            top: `${activeTooltip.y - 8}px` 
          }}
        >
          {/* Tooltip Header */}
          <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-800">
            <div className="min-w-0">
              <span className="text-[8px] font-mono text-red-400 block truncate">{activeTooltip.obraNome}</span>
              <h4 className="text-[11px] font-bold text-white flex items-center gap-1 leading-tight">
                {activeTooltip.fase.nome}
              </h4>
            </div>
            <span className={`text-[7px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              activeTooltip.fase.status === 'concluida' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
              activeTooltip.fase.status === 'em_andamento' ? 'bg-blue-950 text-blue-300 border border-blue-700' :
              activeTooltip.fase.status === 'atrasada' ? 'bg-red-950 text-red-300 border border-red-700' :
              'bg-slate-800 text-slate-300 border border-slate-700'
            }`}>
              {activeTooltip.fase.status.replace('_', ' ')}
            </span>
          </div>

          {/* Progress Gauge */}
          <div className="space-y-1 mb-1.5">
            <div className="flex justify-between text-[8px] font-semibold">
              <span className="text-slate-400">Progresso da Fase:</span>
              <span className="text-red-400 font-mono font-bold">{activeTooltip.fase.progresso}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full"
                style={{ width: `${activeTooltip.fase.progresso}%` }}
              />
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-800/80 p-1.5 rounded border border-slate-700/60 text-[7.5px] mb-1.5">
            <div>
              <span className="text-slate-400 block">Cronograma Previsto:</span>
              <span className="text-slate-200 font-mono font-semibold">{activeTooltip.fase.inicioStr} → {activeTooltip.fase.fimStr}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Duração / Peso:</span>
              <span className="text-slate-200 font-semibold">{activeTooltip.fase.duracaoDias} dias ({activeTooltip.fase.weight}% do total)</span>
            </div>
            <div>
              <span className="text-slate-400 block">Orçamento da Fase:</span>
              <span className="text-emerald-400 font-mono font-semibold">{formatCurrency(activeTooltip.fase.budgetAllocated)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Executado:</span>
              <span className="text-slate-200 font-mono font-semibold">{formatCurrency(activeTooltip.fase.budgetSpent)}</span>
            </div>
          </div>

          {/* Sub-Milestones Checklist */}
          <div>
            <span className="text-[7.5px] uppercase font-bold text-slate-400 block mb-1">
              Marcos & Entregáveis Chave:
            </span>
            <div className="space-y-0.5">
              {activeTooltip.fase.milestones.map((m, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[8px]">
                  {m.done ? (
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Clock className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                  )}
                  <span className={m.done ? "text-slate-200 line-through opacity-80" : "text-slate-300"}>
                    {m.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tooltip Footer Info */}
          <div className="mt-2 pt-1 border-t border-slate-800 flex items-center justify-between text-[7px] text-slate-400">
            <span>Responsável: <strong className="text-slate-200">{activeTooltip.fase.responsible}</strong></span>
            <span className="text-red-400 font-bold">Clique para zoom detalhado</span>
          </div>

          {/* Arrow */}
          <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-slate-700 rotate-45" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TOOLTIP FOR CURVA S BUDGET BAR                                        */}
      {/* ========================================================================= */}
      {budgetTooltip && (
        <div 
          className="fixed z-50 pointer-events-none transition-opacity duration-150 -translate-x-1/2 -translate-y-full mb-2 w-64 bg-slate-900/95 text-white p-2 rounded-lg shadow-2xl border border-slate-700 backdrop-blur-md text-[8px]"
          style={{ 
            left: `${Math.max(130, Math.min(window.innerWidth - 130, budgetTooltip.x))}px`, 
            top: `${budgetTooltip.y - 6}px` 
          }}
        >
          <div className="font-bold text-white mb-1 pb-0.5 border-b border-slate-800 flex justify-between">
            <span>Consolidação Orçamentária</span>
            <span className="text-red-400 font-mono">{budgetUtilizationPct}%</span>
          </div>
          <div className="space-y-0.5 text-slate-300 font-mono">
            <div className="flex justify-between">
              <span>Orçamento Global Total:</span>
              <strong className="text-white">{formatCurrency(orcamentoTotal)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Valor Medido / Executado:</span>
              <strong className="text-emerald-400">{formatCurrency(orcamentoRealizadoTotal)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Saldo a Executar:</span>
              <strong className="text-amber-400">{formatCurrency(saldoOrcamentario)}</strong>
            </div>
          </div>
          <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2.5 h-2.5 bg-slate-900 border-r border-b border-slate-700 rotate-45" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TOOLTIP FOR ENGINEERING PHASES COUNTERS                               */}
      {/* ========================================================================= */}
      {phaseCountTooltip && (
        <div 
          className="fixed z-50 pointer-events-none transition-opacity duration-150 -translate-x-1/2 -translate-y-full mb-2 w-60 bg-slate-900/95 text-white p-2 rounded-lg shadow-2xl border border-slate-700 backdrop-blur-md text-[8px]"
          style={{ 
            left: `${Math.max(120, Math.min(window.innerWidth - 120, phaseCountTooltip.x))}px`, 
            top: `${phaseCountTooltip.y - 6}px` 
          }}
        >
          <div className="font-bold text-white mb-1 pb-0.5 border-b border-slate-800 flex justify-between">
            <span>{phaseCountTooltip.categoria}</span>
            <span className="text-amber-400 font-bold">{phaseCountTooltip.count} obras</span>
          </div>
          <div className="text-slate-300">
            <span className="text-slate-400 block mb-0.5 text-[7px] uppercase font-bold">Canteiros Ativos:</span>
            {phaseCountTooltip.obras.length > 0 ? (
              <ul className="list-disc list-inside space-y-0.5">
                {phaseCountTooltip.obras.map((nome, i) => (
                  <li key={i} className="truncate">{nome}</li>
                ))}
              </ul>
            ) : (
              <span className="text-slate-500 italic">Nenhum canteiro nesta fase</span>
            )}
          </div>
          <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2.5 h-2.5 bg-slate-900 border-r border-b border-slate-700 rotate-45" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. ZOOM MODAL: DRILL-DOWN PHASE INSPECTOR & FINE MILESTONE ANALYZER      */}
      {/* ========================================================================= */}
      {modalObraZoom && (
        <div 
          id="modal-phase-zoom-inspector"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200"
          onClick={() => setModalObraZoom(null)}
        >
          <div 
            className="bg-white w-full max-w-4xl max-h-[92vh] rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-slate-900 px-4 py-3 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-700 flex items-center justify-center text-white shadow-inner">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white">{modalObraZoom.nome}</h3>
                    <span className="px-1.5 py-0.5 rounded bg-red-950 border border-red-700/60 text-red-300 text-[9px] font-bold uppercase">
                      Zoom de Engenharia
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Cronograma detalhado por fases, marcos críticos, avanço físico e alocação financeira
                  </p>
                </div>
              </div>

              {/* Top Action & Close */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setModalObraZoom(null);
                    onNavigate('obras');
                  }}
                  className="px-2.5 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <span>Gantt Completo</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setModalObraZoom(null)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Zoom & Filter Controls Strip */}
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              {/* Interactive Zoom Slider */}
              <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3 text-slate-500" />
                  Escala de Zoom:
                </span>
                <button
                  onClick={() => setModalZoomScale(Math.max(100, modalZoomScale - 25))}
                  className="p-0.5 hover:bg-slate-100 rounded text-slate-600 transition-all cursor-pointer"
                  title="Diminuir Zoom"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <input 
                  type="range" 
                  min="100" 
                  max="220" 
                  step="10" 
                  value={modalZoomScale} 
                  onChange={(e) => setModalZoomScale(Number(e.target.value))}
                  className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-700"
                />
                <button
                  onClick={() => setModalZoomScale(Math.min(220, modalZoomScale + 25))}
                  className="p-0.5 hover:bg-slate-100 rounded text-slate-600 transition-all cursor-pointer"
                  title="Aumentar Zoom"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono font-bold text-red-700 min-w-9 text-right">
                  {modalZoomScale}%
                </span>
              </div>

              {/* Phase Category Filter Pills */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-500 mr-1 flex items-center gap-0.5">
                  <Filter className="w-3 h-3" />
                  Filtrar:
                </span>
                {(['all', 'fundacao', 'estrutura', 'instalacoes', 'acabamento', 'entrega'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedPhaseFilter(cat)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold capitalize transition-all cursor-pointer ${
                      selectedPhaseFilter === cat 
                        ? 'bg-slate-900 text-white shadow-2xs' 
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'Todas as Fases' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body - Scrollable Timeline & Fine Breakdown */}
            <div className="p-4 overflow-y-auto space-y-4 max-h-[70vh]">
              
              {/* CRITICAL RED ALERT BANNER IN MODAL IF INSUMOS EXCEED 90% */}
              {(() => {
                const modalInsumos = computeObraInsumosMetrics(modalObraZoom);
                if (!modalInsumos.isExcedeu90Pct) return null;
                return (
                  <div 
                    id="modal-alert-insumos-excedeu-90"
                    className="p-3 bg-red-600 text-white rounded-lg border border-red-400 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-fadeIn"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-red-950 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wide">
                            Alerta Crítico: Limite de Insumos Excedido (&ge;90%)
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-red-950 text-amber-200 text-[9px] font-mono font-bold">
                            {modalInsumos.percentualConsumoInsumos}% Consumido
                          </span>
                        </div>
                        <p className="text-[10px] text-red-100 mt-0.5">
                          O consumo acumulado de insumos atingiu <strong className="text-white font-bold">{formatCurrency(modalInsumos.consumoAcumuladoInsumos)}</strong> do teto aprovado de <strong className="text-white font-bold">{formatCurrency(modalInsumos.orcamentoInsumos)}</strong> para a categoria (Saldo: {formatCurrency(modalInsumos.saldoInsumos)}).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={onOpenNovaSolicitacao}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-red-800 rounded font-bold text-[10px] flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                      >
                        <Package className="w-3.5 h-3.5 text-red-700" />
                        <span>Solicitar Insumo</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Overall Project Summary Bar */}
              <div className="bg-slate-900 text-white p-3 rounded-lg border border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Progresso Geral Acumulado</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-black text-white">{modalObraZoom.progresso || 45}%</span>
                    <span className="text-[10px] text-slate-300">
                      {formatCurrency((modalObraZoom.orcamento_total || 0) * ((modalObraZoom.progresso || 45) / 100))} executados de {formatCurrency(modalObraZoom.orcamento_total || 0)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Início</span>
                    <strong className="text-slate-100">{modalObraZoom.data_inicio || '01/01/2024'}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Previsão Término</span>
                    <strong className="text-slate-100">{modalObraZoom.data_previsao_termino || '30/06/2025'}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Responsável</span>
                    <strong className="text-slate-100">{modalObraZoom.gestor_nome || 'Engenheiro Chefe'}</strong>
                  </div>
                </div>
              </div>

              {/* Granular Phase Cards Grid */}
              <div className="space-y-3">
                {computeObraPhases(modalObraZoom)
                  .filter(f => selectedPhaseFilter === 'all' || f.categoria === selectedPhaseFilter)
                  .map((fase) => (
                    <div 
                      key={fase.id}
                      className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-400 transition-all space-y-2.5"
                    >
                      {/* Phase Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${
                            fase.status === 'concluida' ? 'bg-emerald-500' :
                            fase.status === 'em_andamento' ? 'bg-blue-600 animate-pulse' :
                            fase.status === 'atrasada' ? 'bg-red-500' : 'bg-slate-300'
                          }`} />
                          <h4 className="text-xs font-black text-slate-900">{fase.nome}</h4>
                          <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-bold">
                            Peso: {fase.weight}% do total
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            fase.status === 'concluida' ? 'bg-emerald-100 text-emerald-800' :
                            fase.status === 'em_andamento' ? 'bg-blue-100 text-blue-800' :
                            fase.status === 'atrasada' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {fase.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-black text-slate-900 font-mono">{fase.progresso}%</span>
                        </div>
                      </div>

                      {/* Zoomable Timeline Track */}
                      <div className="space-y-1">
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                          <div 
                            className={`h-full rounded-full transition-all ${fase.barColor}`}
                            style={{ width: `${Math.min(100, (fase.progresso * modalZoomScale) / 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-mono text-slate-500">
                          <span>Início: <strong>{fase.inicioStr}</strong></span>
                          <span>Duração: <strong>{fase.duracaoDias} dias</strong></span>
                          <span>Término Previsto: <strong>{fase.fimStr}</strong></span>
                        </div>
                      </div>

                      {/* Financial Allocation & Deliverables */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                        {/* Financial Box */}
                        <div className="bg-slate-50 p-2 rounded border border-slate-100 space-y-1">
                          <span className="text-[9px] uppercase font-bold text-slate-500 block">Composição de Custos da Fase</span>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-600">Orçamento Previsto:</span>
                            <span className="font-mono font-bold text-slate-900">{formatCurrency(fase.budgetAllocated)}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-600">Medição / Executado:</span>
                            <span className="font-mono font-bold text-emerald-700">{formatCurrency(fase.budgetSpent)}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-600">Saldo Remanescente:</span>
                            <span className="font-mono font-bold text-slate-700">{formatCurrency(Math.max(0, fase.budgetAllocated - fase.budgetSpent))}</span>
                          </div>
                        </div>

                        {/* Deliverables Checklist */}
                        <div className="bg-slate-50 p-2 rounded border border-slate-100 space-y-1">
                          <span className="text-[9px] uppercase font-bold text-slate-500 block">Marcos & Lista de Verificação</span>
                          <div className="space-y-1">
                            {fase.milestones.map((m, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-[10px]">
                                {m.done ? (
                                  <CheckSquare className="w-3 h-3 text-emerald-600 shrink-0" />
                                ) : (
                                  <Square className="w-3 h-3 text-slate-400 shrink-0" />
                                )}
                                <span className={m.done ? "text-slate-500 line-through font-medium" : "text-slate-800 font-semibold"}>
                                  {m.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span className="text-[10px]">
                Dica: Altere a escala de zoom ou filtre por categoria para isolar gargalos de execução física.
              </span>
              <button
                onClick={() => setModalObraZoom(null)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-bold transition-all cursor-pointer"
              >
                Concluir Inspeção
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. FLOATING TOAST NOTIFICATION: BUDGET LIMIT MONITORING (THRESHOLD >= 90%) */}
      {criticalBudgetObras.length > 0 && !isBudgetToastDismissed && (
        <div 
          id="toast-limite-orcamento-insumos"
          className="fixed bottom-3 right-3 z-50 w-[calc(100vw-24px)] sm:w-96 bg-slate-900 text-white rounded-lg border border-red-500 shadow-2xl overflow-hidden transition-all duration-300"
          role="alert"
          aria-live="assertive"
        >
          {/* Toast Header */}
          <div className="bg-red-600 px-3 py-1.5 flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <BellRing className="w-2.5 h-2.5 text-white animate-bounce" />
              </div>
              <span className="text-[8.5px] font-black uppercase tracking-wider text-white truncate">
                Alerta de Limite Orçamentário (&ge; 90%)
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsBudgetToastExpanded(!isBudgetToastExpanded)}
                className="text-white/80 hover:text-white p-0.5 rounded hover:bg-white/10 transition-all cursor-pointer"
                title={isBudgetToastExpanded ? "Minimizar" : "Expandir"}
              >
                {isBudgetToastExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
              <button
                id="btn-close-toast-limite-orcamento"
                onClick={() => setIsBudgetToastDismissed(true)}
                className="text-white/80 hover:text-white p-0.5 rounded hover:bg-white/10 transition-all cursor-pointer"
                title="Dispensar notificação"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Toast Body */}
          {isBudgetToastExpanded && (
            <div className="p-3 space-y-2 bg-slate-900">
              <div className="text-[7.5px] text-slate-300 leading-tight">
                Foram detectados <strong className="text-white font-bold">{criticalBudgetObras.length} canteiro(s)</strong> cujo consumo de insumos atingiu a faixa crítica de 90% da verba orçamentária:
              </div>

              {/* Obras Breakdown List */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {criticalBudgetObras.map(item => (
                  <div 
                    key={item.obra.id}
                    className="p-2 bg-slate-800/90 rounded border border-red-500/40 hover:border-red-400 transition-all"
                  >
                    <div className="flex items-center justify-between text-[8px] font-bold mb-1">
                      <span className="text-white truncate max-w-[180px]">{item.obra.nome}</span>
                      <span className="text-red-400 font-mono font-black">{item.percentualConsumoInsumos}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-1">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-red-600 rounded-full transition-all"
                        style={{ width: `${Math.min(100, item.percentualConsumoInsumos)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[6.5px] font-mono text-slate-400">
                      <span>Consumido: <strong className="text-slate-200">{formatCurrency(item.consumoAcumuladoInsumos)}</strong></span>
                      <span>Teto Insumos: <strong className="text-slate-200">{formatCurrency(item.orcamentoInsumos)}</strong></span>
                      <span>Saldo: <strong className="text-red-300">{formatCurrency(item.saldoInsumos)}</strong></span>
                    </div>

                    {/* Insumos em Alerta Integrados com Estado Materiais */}
                    {item.topMateriaisEmAlerta && item.topMateriaisEmAlerta.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-slate-700/60 flex items-center gap-1 flex-wrap text-[6px] text-slate-400">
                        <span className="text-slate-500 font-semibold">Insumos em giro:</span>
                        {item.topMateriaisEmAlerta.map(m => (
                          <span 
                            key={m.id}
                            className={`px-1 py-0.2 rounded font-mono ${
                              m.isAbaixoMinimo ? 'bg-red-950/80 text-red-300 border border-red-800' : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {m.nome} ({m.quantidadeAtual} {m.unidade})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Toast Actions */}
              <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between gap-1.5 text-[7.5px]">
                <button
                  onClick={() => {
                    if (criticalBudgetObras[0]) {
                      setModalObraZoom(criticalBudgetObras[0].obra);
                    }
                  }}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <Eye className="w-2.5 h-2.5" />
                  <span>Inspecionar Obra</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={onOpenNovaSolicitacao}
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Package className="w-2.5 h-2.5" />
                    <span>Solicitar Insumo</span>
                  </button>
                  <button
                    onClick={() => setIsBudgetToastDismissed(true)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded transition-all cursor-pointer"
                  >
                    Dispensar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Minimized Toast Badge trigger when dismissed */}
      {criticalBudgetObras.length > 0 && isBudgetToastDismissed && (
        <button
          id="btn-reabrir-toast-orcamento"
          onClick={() => {
            setIsBudgetToastDismissed(false);
            setIsBudgetToastExpanded(true);
          }}
          className="fixed bottom-3 right-3 z-50 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-[8px] flex items-center gap-1.5 shadow-xl border border-red-400 transition-all cursor-pointer animate-pulse"
          title="Ver alertas de teto orçamentário"
        >
          <BellRing className="w-3 h-3 text-white" />
          <span>{criticalBudgetObras.length} Alerta(s) Orçamento (&ge;90%)</span>
        </button>
      )}

    </div>
  );
};
