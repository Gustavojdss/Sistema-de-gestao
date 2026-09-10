import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  ChevronRight, 
  Filter, 
  Package, 
  FileText, 
  User, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Plus,
  Navigation,
  Compass,
  Check
} from 'lucide-react';
import { Obra, EntregaLogisticaMaterial } from '../types/erp';

interface CanteiroLogisticaTimelineWidgetProps {
  entregas?: EntregaLogisticaMaterial[];
  obras: Obra[];
  selectedObraId: string;
  onSelectObra?: (obraId: string) => void;
  onUpdateEntregaStatus?: (entregaId: number, newStatus: EntregaLogisticaMaterial['status']) => void;
  onNavigate?: (tab: any) => void;
  onNovaSolicitacao?: () => void;
}

export const CanteiroLogisticaTimelineWidget: React.FC<CanteiroLogisticaTimelineWidgetProps> = ({
  entregas = [],
  obras,
  selectedObraId,
  onSelectObra,
  onUpdateEntregaStatus,
  onNavigate,
  onNovaSolicitacao
}) => {
  const [selectedDayOffset, setSelectedDayOffset] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [expandedEntregaId, setExpandedEntregaId] = useState<number | null>(null);

  // Local state if parent doesn't provide updates
  const [localEntregas, setLocalEntregas] = useState<EntregaLogisticaMaterial[]>(entregas);

  // Keep synced if prop changes
  React.useEffect(() => {
    if (entregas && entregas.length > 0) {
      setLocalEntregas(entregas);
    }
  }, [entregas]);

  // Selected Obra instance
  const activeObra = useMemo(() => {
    if (selectedObraId === 'all') return null;
    return obras.find(o => String(o.id) === selectedObraId) || null;
  }, [obras, selectedObraId]);

  // Generate the 7-day timeline days (Day 0 / Today to Day 6 / +6 days)
  const timelineDays = useMemo(() => {
    const days = [];
    const now = new Date();
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + i);

      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      let labelDia = `${diasSemana[targetDate.getDay()]}, ${dd} ${meses[targetDate.getMonth()]}`;
      let tag = '';
      if (i === 0) tag = 'Hoje';
      else if (i === 1) tag = 'Amanhã';

      days.push({
        offset: i,
        dateStr,
        label: labelDia,
        tag,
        diaNum: dd,
        mesAbrev: meses[targetDate.getMonth()],
        diaSemana: diasSemana[targetDate.getDay()]
      });
    }
    return days;
  }, []);

  // Filter deliveries by selected obra, status, and selected day
  const filteredEntregas = useMemo(() => {
    return localEntregas.filter(item => {
      // Obra filter
      if (selectedObraId !== 'all') {
        if (String(item.obra_id) !== selectedObraId && item.obra_nome !== activeObra?.nome) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'todos') {
        if (item.status !== statusFilter) return false;
      }

      // Day filter
      if (selectedDayOffset !== 'all') {
        const targetDay = timelineDays.find(d => d.offset === selectedDayOffset);
        if (targetDay && item.data_previsao !== targetDay.dateStr) {
          return false;
        }
      }

      return true;
    });
  }, [localEntregas, selectedObraId, activeObra, statusFilter, selectedDayOffset, timelineDays]);

  // Delivery Counts per Day for badge counts
  const deliveryCountsByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    timelineDays.forEach(d => {
      counts[d.dateStr] = localEntregas.filter(item => {
        if (selectedObraId !== 'all' && String(item.obra_id) !== selectedObraId) return false;
        return item.data_previsao === d.dateStr;
      }).length;
    });
    return counts;
  }, [localEntregas, timelineDays, selectedObraId]);

  // Status mapping
  const getStatusBadge = (status: EntregaLogisticaMaterial['status']) => {
    switch (status) {
      case 'descarregando':
        return {
          label: 'No Canteiro (Descarregando)',
          bg: 'bg-purple-100 text-purple-900 border-purple-200',
          dot: 'bg-purple-600 animate-pulse'
        };
      case 'saiu_para_entrega':
        return {
          label: 'Rota Final de Entrega',
          bg: 'bg-blue-100 text-blue-900 border-blue-200',
          dot: 'bg-blue-600'
        };
      case 'em_transito':
        return {
          label: 'Em Trânsito Rodoviário',
          bg: 'bg-sky-100 text-sky-900 border-sky-200',
          dot: 'bg-sky-500'
        };
      case 'agendado':
        return {
          label: 'Agendado na Usina/Fornecedor',
          bg: 'bg-amber-100 text-amber-900 border-amber-200',
          dot: 'bg-amber-500'
        };
      case 'entregue':
        return {
          label: 'Entregue & Conferido',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
          dot: 'bg-emerald-600'
        };
      case 'atrasado':
        return {
          label: 'Atrasado',
          bg: 'bg-rose-100 text-rose-900 border-rose-200',
          dot: 'bg-rose-600 animate-ping'
        };
      default:
        return {
          label: status,
          bg: 'bg-slate-100 text-slate-800 border-slate-200',
          dot: 'bg-slate-500'
        };
    }
  };

  const handleAdvanceStatus = (entregaId: number, currentStatus: EntregaLogisticaMaterial['status']) => {
    const nextStatusMap: Record<string, EntregaLogisticaMaterial['status']> = {
      agendado: 'em_transito',
      em_transito: 'saiu_para_entrega',
      saiu_para_entrega: 'descarregando',
      descarregando: 'entregue',
      atrasado: 'em_transito'
    };
    const nextStatus = nextStatusMap[currentStatus] || 'entregue';

    setLocalEntregas(prev => prev.map(e => e.id === entregaId ? { ...e, status: nextStatus } : e));
    if (onUpdateEntregaStatus) {
      onUpdateEntregaStatus(entregaId, nextStatus);
    }
  };

  return (
    <div 
      id="canteiro-logistica-timeline-widget" 
      className="bg-white p-3 rounded-md border border-slate-200 shadow-2xs transition-all hover:border-slate-300 mb-3"
    >
      {/* 1. Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-2 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
            <Truck className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-black text-slate-900 text-xs tracking-tight uppercase">
                Logística de Canteiro & Entregas (Próximos 7 Dias)
              </h3>
              <span className="text-[7px] font-bold text-amber-800 bg-amber-100/90 border border-amber-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                <Clock className="w-2 h-2" />
                <span>Janela D+0 a D+7</span>
              </span>
              <span className="text-[7px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                Rastreamento de Transporte e Carga
              </span>
            </div>
            <span className="text-[8px] text-slate-400 block mt-0.5">
              Programação de recebimento de insumos pesados, caminhões betoneiras, aço e materiais críticos
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {onSelectObra && (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
              <Filter className="w-2.5 h-2.5 text-slate-500" />
              <select
                id="logistica-obra-filter"
                value={selectedObraId}
                onChange={(e) => onSelectObra(e.target.value)}
                className="text-[8px] font-bold bg-transparent text-slate-800 focus:outline-none cursor-pointer"
                title="Filtrar por canteiro de destino"
              >
                <option value="all">Todos os Canteiros</option>
                {obras.map(o => (
                  <option key={o.id} value={String(o.id)}>
                    {o.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-[8px] font-bold bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 cursor-pointer"
          >
            <option value="todos">Todos os Status</option>
            <option value="descarregando">Descarregando</option>
            <option value="saiu_para_entrega">Saiu para Entrega</option>
            <option value="em_transito">Em Trânsito</option>
            <option value="agendado">Agendados</option>
            <option value="entregue">Entregues</option>
          </select>

          {onNovaSolicitacao && (
            <button
              onClick={onNovaSolicitacao}
              className="px-2 py-1 bg-red-800 hover:bg-red-700 text-white rounded text-[8px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
              title="Solicitar Material"
            >
              <Plus className="w-2.5 h-2.5" />
              <span>Solicitar Carga</span>
            </button>
          )}

          {onNavigate && (
            <button
              onClick={() => onNavigate('materiais')}
              className="text-[7.5px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded px-2 py-1 flex items-center gap-0.5 transition-colors cursor-pointer"
            >
              <span>Estoque & Materiais</span>
              <ChevronRight className="w-2 h-2" />
            </button>
          )}
        </div>
      </div>

      {/* 2. 7-Day Interactive Timeline Ribbon */}
      <div className="mb-2.5">
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
          {/* Button: All Days */}
          <button
            onClick={() => setSelectedDayOffset('all')}
            className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-between ${
              selectedDayOffset === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <span className="text-[7px] uppercase font-bold tracking-wider opacity-80">Período</span>
            <span className="text-[11px] font-black font-mono my-0.5">7 Dias</span>
            <span className={`text-[6.5px] font-bold px-1 rounded-full ${
              selectedDayOffset === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
            }`}>
              {filteredEntregas.length} cargas
            </span>
          </button>

          {/* 7 individual days */}
          {timelineDays.map(day => {
            const count = deliveryCountsByDay[day.dateStr] || 0;
            const isSelected = selectedDayOffset === day.offset;
            const isToday = day.offset === 0;

            return (
              <button
                key={day.dateStr}
                onClick={() => setSelectedDayOffset(isSelected ? 'all' : day.offset)}
                className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-between relative ${
                  isSelected
                    ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                    : isToday
                    ? 'bg-amber-50 hover:bg-amber-100/80 text-amber-950 border-amber-300'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {day.tag && (
                  <span className={`absolute -top-1 px-1 rounded text-[5.5px] font-black uppercase ${
                    isSelected 
                      ? 'bg-white text-amber-800' 
                      : 'bg-amber-600 text-white'
                  }`}>
                    {day.tag}
                  </span>
                )}
                <span className="text-[7px] uppercase font-bold tracking-wider opacity-80">
                  {day.diaSemana}
                </span>
                <span className="text-xs font-black font-mono my-0.5">
                  {day.diaNum}/{day.mesAbrev}
                </span>
                <span className={`text-[6.5px] font-bold px-1 rounded-full ${
                  isSelected 
                    ? 'bg-amber-700 text-amber-100' 
                    : count > 0 
                    ? 'bg-amber-200/90 text-amber-900 font-bold' 
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {count} {count === 1 ? 'item' : 'itens'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Deliveries List Cards */}
      <div className="space-y-1.5">
        {filteredEntregas.length === 0 ? (
          <div className="p-4 text-center bg-slate-50 rounded-lg border border-slate-200 text-slate-500 text-[8.5px]">
            <Package className="w-5 h-5 mx-auto text-slate-400 mb-1" />
            <p className="font-semibold text-slate-700">Nenhuma entrega agendada com os filtros selecionados.</p>
            <p className="text-[7px] text-slate-400 mt-0.5">Selecione outro dia na linha do tempo ou limpe o filtro de status.</p>
          </div>
        ) : (
          filteredEntregas.map(entrega => {
            const isExpanded = expandedEntregaId === entrega.id;
            const badge = getStatusBadge(entrega.status);

            return (
              <div 
                key={entrega.id}
                className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg p-2 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  {/* Left: Material Name, Quantity, and Obra */}
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                      <Package className="w-4 h-4 text-slate-700" />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-[9px]">
                          {entrega.material_nome}
                        </span>
                        <span className="font-mono font-black text-slate-800 text-[8.5px] bg-white border border-slate-200 px-1.5 py-0.2 rounded">
                          {entrega.quantidade} {entrega.unidade}
                        </span>
                        <span className="text-[7px] font-semibold text-slate-500 flex items-center gap-0.5">
                          <Building2 className="w-2.5 h-2.5 text-slate-400" />
                          {entrega.obra_nome}
                        </span>
                      </div>

                      {/* Route & Supplier meta */}
                      <div className="flex items-center gap-2 text-[7.5px] text-slate-500 mt-0.5 flex-wrap">
                        <span>Fornecedor: <strong className="text-slate-700">{entrega.fornecedor}</strong></span>
                        {entrega.transportadora && (
                          <span>· Transportadora: <strong className="text-slate-700">{entrega.transportadora}</strong></span>
                        )}
                        {entrega.placa_veiculo && (
                          <span className="font-mono font-semibold bg-slate-200/80 px-1 rounded text-slate-700">
                            Placa: {entrega.placa_veiculo}
                          </span>
                        )}
                        {entrega.nota_fiscal && (
                          <span className="text-slate-500 font-mono">
                            {entrega.nota_fiscal}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Date, Status Badge, and Action Buttons */}
                  <div className="flex items-center gap-2 justify-between sm:justify-end shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-[7.5px] font-mono text-slate-700 font-bold">
                        <Calendar className="w-2.5 h-2.5 text-slate-400" />
                        <span>{entrega.data_previsao}</span>
                        {entrega.horario_previsto && (
                          <span className="text-amber-800 bg-amber-100 px-1 rounded">
                            {entrega.horario_previsto}
                          </span>
                        )}
                      </div>
                      <div className={`mt-0.5 px-1.5 py-0.5 rounded text-[7px] font-bold border flex items-center gap-1 inline-flex ${badge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        <span>{badge.label}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {entrega.status !== 'entregue' && (
                        <button
                          onClick={() => handleAdvanceStatus(entrega.id, entrega.status)}
                          className="px-1.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded text-[7px] font-bold flex items-center gap-0.5 transition-colors cursor-pointer shadow-2xs"
                          title="Avançar etapa de transporte"
                        >
                          <Check className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Avançar</span>
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedEntregaId(isExpanded ? null : entrega.id)}
                        className="px-1.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded text-[7px] font-bold transition-colors cursor-pointer"
                        title="Ver detalhes de descarga e motorista"
                      >
                        {isExpanded ? 'Menos' : 'Detalhes'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[7.5px] bg-white p-2 rounded border border-slate-100">
                    <div>
                      <span className="text-slate-400 block uppercase font-bold text-[6.5px]">Motorista & Contato</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                        <User className="w-2.5 h-2.5 text-slate-500" />
                        {entrega.motorista || 'A designar pela transportadora'}
                      </span>
                      {entrega.placa_veiculo && (
                        <span className="text-slate-500 text-[7px] block">Veículo cadastrado: {entrega.placa_veiculo}</span>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-400 block uppercase font-bold text-[6.5px]">Frente de Serviço & Descarga</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-red-600" />
                        {entrega.local_descarga || 'Almoxarifado Central'}
                      </span>
                      <span className="text-slate-500 text-[7px] block">
                        Frente: {entrega.frente_servico || 'Geral do Canteiro'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block uppercase font-bold text-[6.5px]">Orientações & Procedimento</span>
                      <p className="text-slate-600 text-[7px] italic mt-0.5 leading-snug">
                        {entrega.observacoes || 'Conferência física obrigatória de lote e nota fiscal na balança/portaria.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 4. Footer summary */}
      <div className="mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[7px] text-slate-400">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
          Descargas coordenadas com o SESMT e controle de tráfego de guindastes/gruas na via pública.
        </span>
        <span className="font-mono">
          Total rastreado: {localEntregas.length} remessas ativas
        </span>
      </div>
    </div>
  );
};
