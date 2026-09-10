import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  Layers, 
  BarChart3, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  Filter, 
  Eye, 
  Sparkles, 
  SlidersHorizontal,
  Info,
  Maximize2,
  ExternalLink
} from 'lucide-react';
import { Obra, ItemAlmoxarifado, MaterialConsumo } from '../types/erp';

interface ProjectFinancialHealthD3ChartProps {
  obras: Obra[];
  itensAlmoxarifado?: ItemAlmoxarifado[];
  materiais?: MaterialConsumo[];
  onNavigate?: (tab: string) => void;
  onSelectObra?: (obra: Obra) => void;
}

interface FinancialDataPoint {
  obraId: number;
  obraNome: string;
  status: string;
  progresso: number;
  orcamentoTotal: number;
  orcamentoMateriais: number;
  custoAlmoxarifado: number;
  orcamentoAlmoxarifadoPrevisto: number;
  custoTotalMateriaisAlmox: number;
  percentualMateriais: number;
  percentualAlmox: number;
  percentualComprometidoTotal: number;
  saudeFinanceira: 'excelente' | 'adequada' | 'alerta' | 'critica';
  rawObra: Obra;
}

export const ProjectFinancialHealthD3Chart: React.FC<ProjectFinancialHealthD3ChartProps> = ({
  obras,
  itensAlmoxarifado = [],
  materiais = [],
  onNavigate,
  onSelectObra
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Filter & Layout States
  const [statusFilter, setStatusFilter] = useState<'todos' | 'em_andamento' | 'planejamento' | 'concluida'>('todos');
  const [sortBy, setSortBy] = useState<'orcamento_total' | 'custo_almox' | 'materiais' | 'saude' | 'nome'>('orcamento_total');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [chartMode, setChartMode] = useState<'grouped' | 'stacked' | 'proportional'>('grouped');
  const [almoxCostMode, setAlmoxCostMode] = useState<'real' | 'previsto'>('real');
  const [selectedBarObra, setSelectedBarObra] = useState<FinancialDataPoint | null>(null);

  // Format currency helpers
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatShortBRL = (val: number) => {
    if (val >= 1_000_000) {
      return `R$ ${(val / 1_000_000).toFixed(1)}M`;
    }
    if (val >= 1_000) {
      return `R$ ${(val / 1_000).toFixed(0)}k`;
    }
    return `R$ ${val.toFixed(0)}`;
  };

  // Process & Compute Financial Metrics per Obra
  const processedData = useMemo<FinancialDataPoint[]>(() => {
    return obras.map((obra) => {
      const orcTotal = obra.orcamento_total || 2500000;
      
      // Calculate orcamento materiais (from obra record, or calculated from material catalog, or fallback realistic 42% allocation)
      let orcMat = obra.orcamento_materiais;
      if (!orcMat || orcMat <= 0) {
        const matsObra = materiais.filter(m => m.obra_id === obra.id);
        const matsSum = matsObra.reduce((acc, m) => acc + (m.valor_total || (m.quantidade_atual * m.valor_unitario) || 0), 0);
        orcMat = matsSum > 0 ? matsSum * 2.5 : Math.round(orcTotal * 0.42);
      }

      // Calculate Almoxarifado real inventory valuation for this obra
      const itemsObra = itensAlmoxarifado.filter(i => i.obra_id === obra.id);
      const custoAlmoxReal = itemsObra.reduce((acc, item) => {
        return acc + ((item.valor_aquisicao || 0) * (item.quantidade_atual || 1));
      }, 0);

      const orcAlmoxPrevisto = obra.orcamento_almoxarifado || Math.round(orcTotal * 0.12);
      const finalCustoAlmox = almoxCostMode === 'real' ? (custoAlmoxReal > 0 ? custoAlmoxReal : Math.round(orcTotal * 0.09)) : orcAlmoxPrevisto;

      const custoTotalCombinado = orcMat + finalCustoAlmox;
      const pctMat = Math.round((orcMat / orcTotal) * 100);
      const pctAlmox = Math.round((finalCustoAlmox / orcTotal) * 100);
      const pctComprometido = Math.round((custoTotalCombinado / orcTotal) * 100);

      // Evaluate Financial Health
      let saude: 'excelente' | 'adequada' | 'alerta' | 'critica' = 'excelente';
      if (pctComprometido > 75 || pctAlmox > 25) {
        saude = 'critica';
      } else if (pctComprometido > 60 || pctAlmox > 18) {
        saude = 'alerta';
      } else if (pctComprometido > 45) {
        saude = 'adequada';
      } else {
        saude = 'excelente';
      }

      return {
        obraId: obra.id,
        obraNome: obra.nome,
        status: obra.status || 'em_andamento',
        progresso: typeof obra.progresso === 'number' ? obra.progresso : (obra.status === 'concluida' ? 100 : 45),
        orcamentoTotal: orcTotal,
        orcamentoMateriais: orcMat,
        custoAlmoxarifado: finalCustoAlmox,
        orcamentoAlmoxarifadoPrevisto: orcAlmoxPrevisto,
        custoTotalMateriaisAlmox: custoTotalCombinado,
        percentualMateriais: pctMat,
        percentualAlmox: pctAlmox,
        percentualComprometidoTotal: pctComprometido,
        saudeFinanceira: saude,
        rawObra: obra
      };
    });
  }, [obras, itensAlmoxarifado, materiais, almoxCostMode]);

  // Filtered and Sorted Data
  const filteredData = useMemo(() => {
    let result = [...processedData];

    if (statusFilter !== 'todos') {
      result = result.filter(d => d.status === statusFilter);
    }

    result.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortBy === 'orcamento_total') {
        valA = a.orcamentoTotal;
        valB = b.orcamentoTotal;
      } else if (sortBy === 'custo_almox') {
        valA = a.custoAlmoxarifado;
        valB = b.custoAlmoxarifado;
      } else if (sortBy === 'materiais') {
        valA = a.orcamentoMateriais;
        valB = b.orcamentoMateriais;
      } else if (sortBy === 'saude') {
        const orderMap = { critica: 4, alerta: 3, adequada: 2, excelente: 1 };
        valA = orderMap[a.saudeFinanceira];
        valB = orderMap[b.saudeFinanceira];
      } else if (sortBy === 'nome') {
        return sortOrder === 'asc' ? a.obraNome.localeCompare(b.obraNome) : b.obraNome.localeCompare(a.obraNome);
      }

      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });

    return result;
  }, [processedData, statusFilter, sortBy, sortOrder]);

  // Global Portfolio Stats
  const globalStats = useMemo(() => {
    const totalOrc = processedData.reduce((acc, d) => acc + d.orcamentoTotal, 0);
    const totalMat = processedData.reduce((acc, d) => acc + d.orcamentoMateriais, 0);
    const totalAlmox = processedData.reduce((acc, d) => acc + d.custoAlmoxarifado, 0);
    const totalComprometido = totalMat + totalAlmox;
    const pctGeralMat = totalOrc > 0 ? Math.round((totalMat / totalOrc) * 100) : 0;
    const pctGeralAlmox = totalOrc > 0 ? Math.round((totalAlmox / totalOrc) * 100) : 0;
    const pctGeralComprometido = totalOrc > 0 ? Math.round((totalComprometido / totalOrc) * 100) : 0;

    const criticasCount = processedData.filter(d => d.saudeFinanceira === 'critica').length;
    const alertasCount = processedData.filter(d => d.saudeFinanceira === 'alerta').length;

    return {
      totalOrc,
      totalMat,
      totalAlmox,
      totalComprometido,
      pctGeralMat,
      pctGeralAlmox,
      pctGeralComprometido,
      criticasCount,
      alertasCount,
      totalObras: processedData.length
    };
  }, [processedData]);

  // Render D3 Chart with ResizeObserver and Transitions
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || filteredData.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = Math.max(340, Math.min(420, filteredData.length * 36 + 100));

    const margin = { top: 35, right: 30, bottom: 50, left: 140 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    svg.attr('width', width).attr('height', height);

    // Definitions for gradients & drop shadows
    const defs = svg.append('defs');

    // Gradient: Orçamento Total (Dark Slate to Navy)
    const gradTotal = defs.append('linearGradient')
      .attr('id', 'd3-grad-total')
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%');
    gradTotal.append('stop').attr('offset', '0%').attr('stop-color', '#1e293b');
    gradTotal.append('stop').attr('offset', '100%').attr('stop-color', '#334155');

    // Gradient: Orçamento Materiais (Amber to Orange)
    const gradMat = defs.append('linearGradient')
      .attr('id', 'd3-grad-materiais')
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%');
    gradMat.append('stop').attr('offset', '0%').attr('stop-color', '#f59e0b');
    gradMat.append('stop').attr('offset', '100%').attr('stop-color', '#d97706');

    // Gradient: Custo Almoxarifado (Emerald to Teal)
    const gradAlmox = defs.append('linearGradient')
      .attr('id', 'd3-grad-almox')
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%');
    gradAlmox.append('stop').attr('offset', '0%').attr('stop-color', '#10b981');
    gradAlmox.append('stop').attr('offset', '100%').attr('stop-color', '#059669');

    // Main Chart Group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Y Scale: Band scale for Obras (Horizontal grouped bars for superior readability of names)
    const yScale = d3.scaleBand()
      .domain(filteredData.map(d => String(d.obraId)))
      .range([0, innerHeight])
      .paddingInner(0.24);

    // Sub-keys for grouped bars
    const keys: Array<{ key: 'orcamentoTotal' | 'orcamentoMateriais' | 'custoAlmoxarifado'; label: string; color: string; gradId: string }> = [
      { key: 'orcamentoTotal', label: 'Orçamento Total', color: '#1e293b', gradId: 'url(#d3-grad-total)' },
      { key: 'orcamentoMateriais', label: 'Orçamento Materiais', color: '#f59e0b', gradId: 'url(#d3-grad-materiais)' },
      { key: 'custoAlmoxarifado', label: 'Custo Almoxarifado', color: '#10b981', gradId: 'url(#d3-grad-almox)' }
    ];

    const ySubScale = d3.scaleBand()
      .domain(keys.map(k => k.key))
      .range([0, yScale.bandwidth()])
      .padding(0.12);

    // X Scale: Linear scale for Financial values (or 0-100% in proportional mode)
    let maxVal = d3.max(filteredData, (d: FinancialDataPoint) => Math.max(d.orcamentoTotal, d.orcamentoMateriais, d.custoAlmoxarifado)) || 1000000;
    maxVal = maxVal * 1.15; // padding for labels

    const xScale = d3.scaleLinear()
      .domain([0, chartMode === 'proportional' ? 100 : maxVal])
      .range([0, innerWidth]);

    // Background Grid lines (Vertical)
    const gridTicks = xScale.ticks(6);
    g.append('g')
      .attr('class', 'grid-lines')
      .selectAll('line')
      .data(gridTicks)
      .enter()
      .append('line')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#e2e8f0')
      .attr('stroke-dasharray', '2,3')
      .attr('stroke-width', 1);

    // X Axis (Bottom)
    const xAxis = d3.axisBottom(xScale)
      .ticks(6)
      .tickFormat(d => chartMode === 'proportional' ? `${d}%` : formatShortBRL(Number(d)));

    const xAxisG = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr('color', '#64748b');

    xAxisG.selectAll('text')
      .attr('font-size', '8px')
      .attr('font-family', 'monospace')
      .attr('font-weight', '600')
      .attr('fill', '#475569');

    // Tooltip Node handler
    const tooltip = d3.select(tooltipRef.current);

    // Render Bars per Obra Group
    const obraGroups = g.selectAll<SVGGElement, FinancialDataPoint>('.obra-group')
      .data(filteredData)
      .enter()
      .append('g')
      .attr('class', 'obra-group')
      .attr('transform', (d: FinancialDataPoint) => `translate(0, ${yScale(String(d.obraId)) || 0})`)
      .style('cursor', 'pointer')
      .on('click', (_, d: FinancialDataPoint) => {
        setSelectedBarObra(d);
        if (onSelectObra) onSelectObra(d.rawObra);
      });

    // Y Axis labels (Obra Name + Status Dot + Progress Tag)
    obraGroups.each(function(this: SVGGElement, d: FinancialDataPoint) {
      const group = d3.select(this);
      
      // Status Indicator Dot
      group.append('circle')
        .attr('cx', -128)
        .attr('cy', (yScale.bandwidth() / 2))
        .attr('r', 3)
        .attr('fill', d.saudeFinanceira === 'critica' ? '#ef4444' : d.saudeFinanceira === 'alerta' ? '#f59e0b' : '#10b981');

      // Obra Title Text
      const text = group.append('text')
        .attr('x', -120)
        .attr('y', (yScale.bandwidth() / 2) - 2)
        .attr('text-anchor', 'start')
        .attr('font-size', '8.5px')
        .attr('font-weight', '700')
        .attr('fill', '#0f172a');
      
      const truncatedName = d.obraNome.length > 17 ? `${d.obraNome.slice(0, 15)}...` : d.obraNome;
      text.text(truncatedName);

      // Sub-label: Progress % & Status
      group.append('text')
        .attr('x', -120)
        .attr('y', (yScale.bandwidth() / 2) + 8)
        .attr('text-anchor', 'start')
        .attr('font-size', '7px')
        .attr('font-family', 'monospace')
        .attr('fill', '#64748b')
        .text(`${d.progresso}% conc. · ${d.percentualComprometidoTotal}% comp.`);
    });

    if (chartMode === 'grouped') {
      // GROUPED BARS RENDERING
      keys.forEach(k => {
        obraGroups.selectAll<SVGRectElement, any>(`.bar-${k.key}`)
          .data((d: FinancialDataPoint) => [{ ...d, currentKey: k.key, currentLabel: k.label, gradId: k.gradId, color: k.color }])
          .enter()
          .append('rect')
          .attr('class', `bar-${k.key}`)
          .attr('x', 0)
          .attr('y', () => ySubScale(k.key) || 0)
          .attr('height', ySubScale.bandwidth())
          .attr('rx', 2.5)
          .attr('ry', 2.5)
          .attr('fill', k.gradId)
          .attr('width', 0) // Start at 0 for entrance animation
          .transition()
          .duration(750)
          .ease(d3.easeCubicOut)
          .attr('width', (d: any) => Math.max(2, xScale(d[k.key])));

        // Value text labels next to the bar
        obraGroups.selectAll<SVGTextElement, any>(`.label-${k.key}`)
          .data((d: FinancialDataPoint) => [{ ...d, currentKey: k.key }])
          .enter()
          .append('text')
          .attr('class', `label-${k.key}`)
          .attr('x', (d: any) => xScale(d[k.key]) + 4)
          .attr('y', () => (ySubScale(k.key) || 0) + ySubScale.bandwidth() / 2 + 3)
          .attr('font-size', '6.5px')
          .attr('font-family', 'monospace')
          .attr('font-weight', '700')
          .attr('fill', k.color === '#1e293b' ? '#334155' : k.color)
          .attr('opacity', 0)
          .text((d: any) => formatShortBRL(d[k.key]))
          .transition()
          .delay(450)
          .duration(300)
          .attr('opacity', 1);
      });
    } else if (chartMode === 'stacked') {
      // STACKED BARS RENDERING (Materiais + Almoxarifado vs Limite Orçamentário)
      obraGroups.each(function(this: SVGGElement, d: FinancialDataPoint) {
        const group = d3.select(this);
        const barHeight = yScale.bandwidth() * 0.75;
        const yPos = (yScale.bandwidth() - barHeight) / 2;

        // Background Track: Orçamento Total
        group.append('rect')
          .attr('x', 0)
          .attr('y', yPos)
          .attr('height', barHeight)
          .attr('width', xScale(d.orcamentoTotal))
          .attr('rx', 3)
          .attr('fill', '#f1f5f9')
          .attr('stroke', '#cbd5e1')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '3,3');

        // Segment 1: Materiais
        const matWidth = xScale(d.orcamentoMateriais);
        group.append('rect')
          .attr('x', 0)
          .attr('y', yPos)
          .attr('height', barHeight)
          .attr('rx', 2.5)
          .attr('fill', 'url(#d3-grad-materiais)')
          .attr('width', 0)
          .transition()
          .duration(650)
          .attr('width', Math.max(2, matWidth));

        // Segment 2: Almoxarifado (Stacked after Materiais)
        const almoxWidth = xScale(d.custoAlmoxarifado);
        group.append('rect')
          .attr('x', matWidth)
          .attr('y', yPos)
          .attr('height', barHeight)
          .attr('rx', 2.5)
          .attr('fill', 'url(#d3-grad-almox)')
          .attr('width', 0)
          .transition()
          .duration(650)
          .delay(200)
          .attr('width', Math.max(2, almoxWidth));

        // Total Limit Pin Marker
        group.append('line')
          .attr('x1', xScale(d.orcamentoTotal))
          .attr('x2', xScale(d.orcamentoTotal))
          .attr('y1', yPos - 3)
          .attr('y2', yPos + barHeight + 3)
          .attr('stroke', '#0f172a')
          .attr('stroke-width', 2);

        // Text summary
        group.append('text')
          .attr('x', Math.max(matWidth + almoxWidth, xScale(d.orcamentoTotal)) + 6)
          .attr('y', yPos + barHeight / 2 + 3)
          .attr('font-size', '7px')
          .attr('font-family', 'monospace')
          .attr('font-weight', 'bold')
          .attr('fill', d.percentualComprometidoTotal > 80 ? '#b91c1c' : '#334155')
          .text(`${d.percentualComprometidoTotal}% comprometido`);
      });
    } else {
      // PROPORTIONAL MODE (100% Normalized Bars)
      obraGroups.each(function(this: SVGGElement, d: FinancialDataPoint) {
        const group = d3.select(this);
        const barHeight = yScale.bandwidth() * 0.7;
        const yPos = (yScale.bandwidth() - barHeight) / 2;

        const pMat = d.percentualMateriais;
        const pAlmox = d.percentualAlmox;
        const pSaldo = Math.max(0, 100 - pMat - pAlmox);

        const wMat = (pMat / 100) * innerWidth;
        const wAlmox = (pAlmox / 100) * innerWidth;
        const wSaldo = (pSaldo / 100) * innerWidth;

        // Materiais %
        group.append('rect')
          .attr('x', 0)
          .attr('y', yPos)
          .attr('height', barHeight)
          .attr('fill', 'url(#d3-grad-materiais)')
          .attr('width', Math.max(1, wMat));

        // Almoxarifado %
        group.append('rect')
          .attr('x', wMat)
          .attr('y', yPos)
          .attr('height', barHeight)
          .attr('fill', 'url(#d3-grad-almox)')
          .attr('width', Math.max(1, wAlmox));

        // Saldo / Outros %
        group.append('rect')
          .attr('x', wMat + wAlmox)
          .attr('y', yPos)
          .attr('height', barHeight)
          .attr('fill', '#e2e8f0')
          .attr('width', Math.max(1, wSaldo));

        // Text %
        group.append('text')
          .attr('x', innerWidth + 5)
          .attr('y', yPos + barHeight / 2 + 3)
          .attr('font-size', '7px')
          .attr('font-family', 'monospace')
          .attr('font-weight', 'bold')
          .attr('fill', '#0f172a')
          .text(`${pMat}% Mat | ${pAlmox}% Almox`);
      });
    }

    // Hover Tooltip Interaction on Obra Groups
    obraGroups
      .on('mouseenter', function(this: SVGGElement, event: MouseEvent, d: FinancialDataPoint) {
        d3.select(this).style('opacity', 0.85);

        const [mouseX, mouseY] = d3.pointer(event, container);

        tooltip
          .style('opacity', '1')
          .style('display', 'block')
          .style('left', `${Math.min(width - 250, mouseX + margin.left - 60)}px`)
          .style('top', `${Math.max(10, mouseY + 20)}px`)
          .html(`
            <div class="bg-slate-900/95 text-white p-2.5 rounded-lg shadow-xl border border-slate-700 text-[8px] font-sans">
              <div class="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-800 gap-2">
                <span class="font-bold text-white text-[9px] truncate">${d.obraNome}</span>
                <span class="px-1.5 py-0.2 rounded text-[6.5px] font-bold uppercase ${
                  d.saudeFinanceira === 'critica' ? 'bg-red-950 text-red-400 border border-red-700' :
                  d.saudeFinanceira === 'alerta' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                  'bg-emerald-950 text-emerald-300 border border-emerald-700'
                }">
                  Saúde: ${d.saudeFinanceira}
                </span>
              </div>
              <div class="space-y-1 font-mono">
                <div class="flex justify-between text-slate-300">
                  <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-xs bg-slate-400"></span>Orçamento Total:</span>
                  <strong class="text-white">${formatBRL(d.orcamentoTotal)}</strong>
                </div>
                <div class="flex justify-between text-amber-300">
                  <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-xs bg-amber-500"></span>Orç. Materiais:</span>
                  <strong>${formatBRL(d.orcamentoMateriais)} (${d.percentualMateriais}%)</strong>
                </div>
                <div class="flex justify-between text-emerald-300">
                  <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-xs bg-emerald-500"></span>Custo Almoxarifado:</span>
                  <strong>${formatBRL(d.custoAlmoxarifado)} (${d.percentualAlmox}%)</strong>
                </div>
                <div class="pt-1 border-t border-slate-800 flex justify-between text-slate-300 font-bold">
                  <span>Comprometimento:</span>
                  <span class="${d.percentualComprometidoTotal > 70 ? 'text-red-400' : 'text-emerald-400'}">
                    ${formatBRL(d.custoTotalMateriaisAlmox)} (${d.percentualComprometidoTotal}%)
                  </span>
                </div>
              </div>
              <div class="mt-1.5 pt-1 border-t border-slate-800/80 text-[6.5px] text-slate-400 flex items-center justify-between">
                <span>Progresso Físico: <strong>${d.progresso}%</strong></span>
                <span class="text-blue-400 font-bold">Clique para detalhes</span>
              </div>
            </div>
          `);
      })
      .on('mousemove', function(event: MouseEvent) {
        const [mouseX, mouseY] = d3.pointer(event, container);
        tooltip
          .style('left', `${Math.min(width - 250, mouseX + margin.left - 60)}px`)
          .style('top', `${Math.max(10, mouseY + 20)}px`);
      })
      .on('mouseleave', function(this: SVGGElement) {
        d3.select(this).style('opacity', 1);
        tooltip.style('opacity', '0').style('display', 'none');
      });

  }, [filteredData, chartMode, almoxCostMode]);

  return (
    <div 
      id="section-saude-financeira-d3"
      ref={containerRef}
      className="bg-white rounded-lg border border-slate-200 shadow-2xs p-3 transition-all relative overflow-hidden"
    >
      {/* Header with Title & Legend Badges */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center justify-center shrink-0 shadow-2xs font-bold">
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight">
                Saúde Financeira dos Projetos (D3.js)
              </h3>
              <span className="text-[7.5px] font-black px-1.5 py-0.2 rounded bg-slate-900 text-amber-300 font-mono uppercase tracking-wider">
                Orçamento Total vs Materiais vs Almoxarifado
              </span>
            </div>
            <p className="text-[8px] text-slate-500 mt-0.5">
              Visualização analítica vetorial ponderando teto orçamentário, alocação de suprimentos e custo de ativos em canteiro
            </p>
          </div>
        </div>

        {/* Legend Indicators & Direct Action */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded border border-slate-200 text-[7.5px] font-bold">
            <div className="flex items-center gap-1 text-slate-800">
              <span className="w-2.5 h-2 rounded bg-slate-800 shrink-0" />
              <span>Orçamento Total</span>
            </div>
            <div className="flex items-center gap-1 text-amber-700">
              <span className="w-2.5 h-2 rounded bg-amber-500 shrink-0" />
              <span>Orç. Materiais</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-700">
              <span className="w-2.5 h-2 rounded bg-emerald-600 shrink-0" />
              <span>Custo Almoxarifado</span>
            </div>
          </div>

          <button
            id="btn-navigate-financeiro-obras"
            onClick={() => onNavigate && onNavigate('obras')}
            className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-red-700 text-white rounded text-[8px] font-bold transition-all cursor-pointer shadow-2xs"
            title="Acessar Gestão Financeira Completa de Obras"
          >
            <span>Ver Obras</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Global Portfolio KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2.5">
        <div className="bg-slate-50 p-2 rounded border border-slate-200 flex flex-col justify-between">
          <span className="text-[7px] font-bold uppercase text-slate-500">Teto Orçamentário Global</span>
          <div className="mt-0.5">
            <span className="text-xs sm:text-sm font-black text-slate-900 font-mono block leading-none">
              {formatBRL(globalStats.totalOrc)}
            </span>
            <span className="text-[7px] text-slate-400 mt-0.5 block font-mono">{globalStats.totalObras} obras monitoradas</span>
          </div>
        </div>

        <div className="bg-amber-50/70 p-2 rounded border border-amber-200 flex flex-col justify-between">
          <span className="text-[7px] font-bold uppercase text-amber-900">Alocação Materiais</span>
          <div className="mt-0.5">
            <span className="text-xs sm:text-sm font-black text-amber-800 font-mono block leading-none">
              {formatBRL(globalStats.totalMat)}
            </span>
            <span className="text-[7px] text-amber-700 mt-0.5 block font-mono font-bold">
              {globalStats.pctGeralMat}% do orçamento global
            </span>
          </div>
        </div>

        <div className="bg-emerald-50/70 p-2 rounded border border-emerald-200 flex flex-col justify-between">
          <span className="text-[7px] font-bold uppercase text-emerald-900">Custo Total Almoxarifado</span>
          <div className="mt-0.5">
            <span className="text-xs sm:text-sm font-black text-emerald-800 font-mono block leading-none">
              {formatBRL(globalStats.totalAlmox)}
            </span>
            <span className="text-[7px] text-emerald-700 mt-0.5 block font-mono font-bold">
              {globalStats.pctGeralAlmox}% em máquinas/ativos
            </span>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-2 rounded border border-slate-800 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-bold uppercase text-slate-300">Comprometimento</span>
            {globalStats.criticasCount > 0 ? (
              <span className="px-1 py-0.2 rounded bg-red-600 text-white text-[6.5px] font-bold">
                {globalStats.criticasCount} Críticas
              </span>
            ) : (
              <span className="px-1 py-0.2 rounded bg-emerald-600 text-white text-[6.5px] font-bold">
                Saudável
              </span>
            )}
          </div>
          <div className="mt-0.5">
            <span className="text-xs sm:text-sm font-black text-amber-300 font-mono block leading-none">
              {globalStats.pctGeralComprometido}%
            </span>
            <span className="text-[6.5px] text-slate-300 mt-0.5 block font-mono">
              Saldo livre: {formatBRL(Math.max(0, globalStats.totalOrc - globalStats.totalComprometido))}
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Mode Toggle (Grouped vs Stacked vs 100%), Sorting & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 bg-slate-50 rounded-md border border-slate-200 mb-2 text-[7.5px]">
        {/* Left: View Mode Toggles */}
        <div className="flex items-center gap-1">
          <span className="font-extrabold text-slate-600 uppercase">Modo Gráfico:</span>
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded border border-slate-200">
            <button
              id="btn-d3-mode-grouped"
              onClick={() => setChartMode('grouped')}
              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer flex items-center gap-1 ${
                chartMode === 'grouped' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Exibir barras agrupadas lado a lado"
            >
              <BarChart3 className="w-2.5 h-2.5" />
              <span>Barras Agrupadas</span>
            </button>

            <button
              id="btn-d3-mode-stacked"
              onClick={() => setChartMode('stacked')}
              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer flex items-center gap-1 ${
                chartMode === 'stacked' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Exibir barras empilhadas contra o teto orçamentário"
            >
              <Layers className="w-2.5 h-2.5" />
              <span>Empilhadas vs Teto</span>
            </button>

            <button
              id="btn-d3-mode-proportional"
              onClick={() => setChartMode('proportional')}
              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer flex items-center gap-1 ${
                chartMode === 'proportional' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Exibir distribuição percentual 100%"
            >
              <SlidersHorizontal className="w-2.5 h-2.5" />
              <span>Proporcional 100%</span>
            </button>
          </div>
        </div>

        {/* Right: Filters & Sorting */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-500">Status:</span>
            <select
              id="select-filter-status-d3"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white border border-slate-200 text-slate-900 rounded px-1.5 py-0.5 font-bold focus:ring-1 focus:ring-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="todos">Todos os Status ({processedData.length})</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="planejamento">Planejamento</option>
              <option value="concluida">Concluídas</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-500">Ordenar por:</span>
            <select
              id="select-sort-d3"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-slate-200 text-slate-900 rounded px-1.5 py-0.5 font-bold focus:ring-1 focus:ring-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="orcamento_total">Maior Orçamento Total</option>
              <option value="custo_almox">Maior Custo Almoxarifado</option>
              <option value="materiais">Maior Orçamento Materiais</option>
              <option value="saude">Nível de Risco Financeiro</option>
              <option value="nome">Nome da Obra</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
              title="Inverter Ordem"
            >
              {sortOrder === 'desc' ? '↓ Decrescente' : '↑ Crescente'}
            </button>
          </div>

          {/* Almoxarifado Valuation Toggle */}
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-500">Custo Almox:</span>
            <button
              onClick={() => setAlmoxCostMode(almoxCostMode === 'real' ? 'previsto' : 'real')}
              className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-bold text-emerald-800 hover:bg-emerald-50 cursor-pointer"
              title="Alternar entre Estoque Físico Real em Canteiro e Alocação Orçamentária Prevista"
            >
              {almoxCostMode === 'real' ? 'Estoque Real' : 'Alocação Prevista'}
            </button>
          </div>
        </div>
      </div>

      {/* D3 SVG Canvas Container */}
      <div className="w-full overflow-x-auto relative">
        <svg ref={svgRef} className="w-full block select-none" />
        
        {/* Floating Dynamic Tooltip element managed by D3 */}
        <div 
          ref={tooltipRef}
          className="absolute pointer-events-none z-30 transition-opacity duration-150"
          style={{ display: 'none', opacity: 0 }}
        />
      </div>

      {/* Selected Obra Drilldown Card (if clicked) */}
      {selectedBarObra && (
        <div 
          id="card-detalhes-obra-selecionada-d3"
          className="mt-2.5 p-2 bg-slate-900 text-white rounded-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-fadeIn text-[8px]"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-6 h-6 rounded flex items-center justify-center font-bold shrink-0 ${
              selectedBarObra.saudeFinanceira === 'critica' ? 'bg-red-600 text-white' :
              selectedBarObra.saudeFinanceira === 'alerta' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-600 text-white'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-white text-[10px]">{selectedBarObra.obraNome}</span>
                <span className="px-1 py-0.2 rounded bg-slate-800 text-amber-300 font-mono text-[7px]">
                  {selectedBarObra.progresso}% executado
                </span>
              </div>
              <p className="text-[7px] text-slate-400 mt-0.2">
                Orçamento: <strong>{formatBRL(selectedBarObra.orcamentoTotal)}</strong> | Materiais: <strong className="text-amber-300">{formatBRL(selectedBarObra.orcamentoMateriais)}</strong> | Almoxarifado: <strong className="text-emerald-300">{formatBRL(selectedBarObra.custoAlmoxarifado)}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => onSelectObra && onSelectObra(selectedBarObra.rawObra)}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Inspecionar Obra</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={() => setSelectedBarObra(null)}
              className="px-1.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Footer Info & Explanation */}
      <div className="mt-2 pt-1.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[7px] text-slate-500 gap-1">
        <div className="flex items-center gap-1">
          <Info className="w-2.5 h-2.5 text-slate-400" />
          <span>
            Gráfico renderizado com <strong>D3.js</strong> com escala proporcional e cálculo em tempo real de ativos de almoxarifado por centro de custo.
          </span>
        </div>
        <span className="font-mono text-slate-400">
          Atualizado com {obras.length} obras cadastradas
        </span>
      </div>
    </div>
  );
};
