import React, { useState, useMemo } from 'react';
import { 
  AlertCircle, 
  ShoppingCart, 
  Zap, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  Package, 
  ArrowRight,
  Sparkles,
  TrendingDown,
  Building2
} from 'lucide-react';
import { MaterialConsumo, Obra, SolicitacaoMaterial } from '../types/erp';

interface StockPontoDePedidoAlertProps {
  materiais: MaterialConsumo[];
  obras: Obra[];
  selectedObraId: string;
  onSolicitacaoExpressa?: (material: MaterialConsumo, qtdSugerida: number) => void;
  onNavigate?: (tab: any) => void;
  onSendNotification?: (notificacao: any) => void;
}

export const StockPontoDePedidoAlert: React.FC<StockPontoDePedidoAlertProps> = ({
  materiais,
  obras,
  selectedObraId,
  onSolicitacaoExpressa,
  onNavigate,
  onSendNotification
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [successMaterialId, setSuccessMaterialId] = useState<number | null>(null);

  // Selected Obra instance
  const activeObra = useMemo(() => {
    if (selectedObraId === 'all') return null;
    return obras.find(o => String(o.id) === selectedObraId) || null;
  }, [obras, selectedObraId]);

  // Filter items below Ponto de Pedido (quantidade_atual <= quantidade_minima)
  const itensAbaixoPontoPedido = useMemo(() => {
    return materiais.filter(m => {
      // Obra filter
      if (selectedObraId !== 'all') {
        if (String(m.obra_id) !== selectedObraId && m.obra_nome !== activeObra?.nome) {
          return false;
        }
      }
      return m.quantidade_atual <= m.quantidade_minima;
    });
  }, [materiais, selectedObraId, activeObra]);

  if (dismissed || itensAbaixoPontoPedido.length === 0) {
    return null;
  }

  const handleExpressRequest = (item: MaterialConsumo) => {
    // Economic suggested order quantity: refill to 2x minimum stock
    const qtdSugerida = Math.max(item.quantidade_minima * 2 - item.quantidade_atual, item.quantidade_minima);

    if (onSolicitacaoExpressa) {
      onSolicitacaoExpressa(item, qtdSugerida);
    }

    if (onSendNotification) {
      onSendNotification({
        id: Date.now(),
        titulo: `Solicitação Expressa Gerada: ${item.nome}`,
        mensagem: `Pedido expresso de ${qtdSugerida} ${item.unidade_medida} emitido com prioridade alta para ${item.obra_nome || 'Canteiro'}.`,
        tipo: 'alerta',
        lida: false,
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      });
    }

    setSuccessMaterialId(item.id);
    setTimeout(() => {
      setSuccessMaterialId(null);
    }, 3000);
  };

  const handleAllExpress = () => {
    itensAbaixoPontoPedido.forEach(item => {
      const qtdSugerida = Math.max(item.quantidade_minima * 2 - item.quantidade_atual, item.quantidade_minima);
      if (onSolicitacaoExpressa) {
        onSolicitacaoExpressa(item, qtdSugerida);
      }
    });

    if (onSendNotification) {
      onSendNotification({
        id: Date.now(),
        titulo: `Lote de Solicitações Expressas Emitido (${itensAbaixoPontoPedido.length} itens)`,
        mensagem: `Reposição emergencial do ponto de pedido disparada para todas as matérias-primas críticas.`,
        tipo: 'sucesso',
        lida: false,
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      });
    }

    setIsOpen(false);
  };

  return (
    <>
      {/* 1. Floating Action Badge / Alert Bar (Sticky at bottom or floating pill) */}
      <div 
        id="stock-ponto-pedido-floating-alert"
        className="fixed bottom-4 right-4 z-40 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
      >
        <div className="bg-slate-900 text-white rounded-xl shadow-2xl border border-red-500/40 p-2.5 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-red-600/30 border border-red-500 flex items-center justify-center text-red-400 shrink-0">
                  <AlertCircle className="w-4 h-4 text-red-400 animate-pulse" />
                </div>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-slate-900">
                  {itensAbaixoPontoPedido.length}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-black uppercase tracking-wider text-red-400">
                    Estoque Crítico
                  </span>
                  <span className="text-[7px] text-slate-400">· Ponto de Pedido</span>
                </div>
                <h4 className="font-bold text-white text-[9px] leading-tight">
                  {itensAbaixoPontoPedido.length === 1
                    ? `1 insumo abaixo do estoque de segurança`
                    : `${itensAbaixoPontoPedido.length} insumos abaixo do estoque de segurança`}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded-md text-[8px] font-black flex items-center gap-1 shadow-md transition-all cursor-pointer hover:scale-102"
                title="Abrir painel de solicitação expressa"
              >
                <Zap className="w-2.5 h-2.5 fill-white" />
                <span>Solicitação Expressa</span>
              </button>

              <button
                onClick={() => setDismissed(true)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                title="Fechar alerta"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Quick preview of top critical item */}
          {!isOpen && (
            <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[7.5px] text-slate-300">
              <div className="flex items-center gap-1 truncate max-w-[220px]">
                <Package className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                <span className="truncate font-semibold">{itensAbaixoPontoPedido[0].nome}</span>
                <span className="text-red-400 font-mono font-bold shrink-0">
                  ({itensAbaixoPontoPedido[0].quantidade_atual}/{itensAbaixoPontoPedido[0].quantidade_minima} {itensAbaixoPontoPedido[0].unidade_medida})
                </span>
              </div>

              <button
                onClick={() => handleExpressRequest(itensAbaixoPontoPedido[0])}
                className="text-red-300 hover:text-white font-bold flex items-center gap-0.5 underline cursor-pointer"
              >
                <span>Pedir 1-Clique</span>
                <ArrowRight className="w-2 h-2" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Expanded Express Order Modal / Flyout */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 text-slate-800">
            {/* Header */}
            <div className="bg-slate-900 text-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-red-600 flex items-center justify-center text-white">
                  <Zap className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h3 className="font-black text-xs uppercase tracking-wide">
                    Solicitação Expressa de Materiais
                  </h3>
                  <p className="text-[8px] text-slate-300">
                    Reposição em 1 clique para itens abaixo do Ponto de Pedido (Estoque de Segurança)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content List */}
            <div className="p-3 max-h-[60vh] overflow-y-auto space-y-2">
              <div className="flex items-center justify-between text-[8px] text-slate-500 pb-1 border-b border-slate-100">
                <span>{itensAbaixoPontoPedido.length} insumos com saldo crítico</span>
                <span className="font-semibold text-red-600">Lote econômico calculado automaticamente</span>
              </div>

              {itensAbaixoPontoPedido.map(item => {
                const qtdSugerida = Math.max(item.quantidade_minima * 2 - item.quantidade_atual, item.quantidade_minima);
                const isSuccess = successMaterialId === item.id;

                return (
                  <div 
                    key={item.id}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded bg-red-100 text-red-800 border border-red-200 flex items-center justify-center shrink-0 mt-0.5">
                        <TrendingDown className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 text-[9px]">
                            {item.nome}
                          </span>
                          <span className="text-[7px] text-slate-500 bg-white border border-slate-200 px-1 rounded">
                            {item.codigo}
                          </span>
                          <span className="text-[7px] text-slate-500 flex items-center gap-0.5">
                            <Building2 className="w-2.5 h-2.5" />
                            {item.obra_nome || 'Canteiro'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[7.5px]">
                          <span className="text-red-700 font-bold bg-red-50 px-1 py-0.2 rounded border border-red-200">
                            Saldo Atual: {item.quantidade_atual} {item.unidade_medida}
                          </span>
                          <span className="text-slate-500">
                            Ponto de Pedido: <strong>{item.quantidade_minima} {item.unidade_medida}</strong>
                          </span>
                          <span className="text-slate-500">
                            Fornecedor: <strong>{item.fornecedor_padrao || 'Homologado'}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                      <div className="text-right">
                        <span className="text-[6.5px] uppercase font-bold text-slate-400 block">Sugerido</span>
                        <span className="font-mono font-black text-slate-900 text-[9.5px]">
                          +{qtdSugerida} {item.unidade_medida}
                        </span>
                      </div>

                      {isSuccess ? (
                        <div className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[7.5px] font-bold flex items-center gap-1 shadow-2xs">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Solicitado!</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleExpressRequest(item)}
                          className="px-2.5 py-1 bg-red-800 hover:bg-red-700 text-white rounded text-[7.5px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                        >
                          <Zap className="w-2.5 h-2.5 fill-white" />
                          <span>Pedir Agora</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-2.5 border-t border-slate-200 flex items-center justify-between text-[8px]">
              <span className="text-slate-500">
                Dispara cotação e aprovação automática para o departamento de suprimentos.
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAllExpress}
                  className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-md font-black flex items-center gap-1 shadow-md transition-all cursor-pointer"
                >
                  <Zap className="w-3 h-3 fill-white" />
                  <span>Repor Todos os Itens ({itensAbaixoPontoPedido.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
