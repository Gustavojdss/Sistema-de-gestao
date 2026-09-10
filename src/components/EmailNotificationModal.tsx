import React, { useState } from 'react';
import { 
  Mail, 
  X, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Users, 
  History, 
  Settings, 
  Copy, 
  FileText, 
  ShieldAlert, 
  Check, 
  Clock, 
  Shield, 
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Usuario, Obra } from '../types/erp';
import { 
  EmailDisparoLog, 
  EmailRecipient, 
  generateEmailHtml, 
  findRecipientsForObra,
  createBudgetAlertEmail,
  DEFAULT_EMAIL_CONFIG,
  EmailNotificationConfig
} from '../services/emailNotificationService';

interface EmailNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  obras: Obra[];
  usuarios: Usuario[];
  emailLogs: EmailDisparoLog[];
  onSendEmailAlert: (obra: Obra, modo: 'manual' | 'automatico') => void;
  selectedObraInitial?: Obra | null;
}

export const EmailNotificationModal: React.FC<EmailNotificationModalProps> = ({
  isOpen,
  onClose,
  obras,
  usuarios,
  emailLogs,
  onSendEmailAlert,
  selectedObraInitial
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'recipients' | 'history' | 'config'>('preview');
  const [selectedObraId, setSelectedObraId] = useState<number>(
    selectedObraInitial?.id || (obras.find(o => o.id === 2)?.id || obras[0]?.id || 1)
  );
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(null);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [activeLogZoom, setActiveLogZoom] = useState<EmailDisparoLog | null>(null);
  const [config, setConfig] = useState<EmailNotificationConfig>(DEFAULT_EMAIL_CONFIG);

  if (!isOpen) return null;

  const currentObra = obras.find(o => o.id === selectedObraId) || obras[0];
  
  // Calculate standard metrics for preview
  const orcamentoTotal = currentObra?.orcamento_total || 10000000;
  const orcamentoInsumos = Math.round(orcamentoTotal * 0.45);
  const progressRatio = (currentObra?.progresso !== undefined ? currentObra.progresso : 50) / 100;
  
  let consumptionIntensity = 1.0;
  if (currentObra?.id === 2 || (currentObra?.nome || '').toLowerCase().includes('lago norte')) {
    consumptionIntensity = 1.15;
  } else if (currentObra?.id === 3 || (currentObra?.nome || '').toLowerCase().includes('infra')) {
    consumptionIntensity = 1.06;
  } else if (currentObra?.id === 1) {
    consumptionIntensity = 1.13;
  }

  const consumoInsumos = Math.min(
    Math.round(orcamentoInsumos * 1.3),
    Math.round(orcamentoInsumos * progressRatio * consumptionIntensity)
  );
  const percentualConsumo = Math.round((consumoInsumos / orcamentoInsumos) * 100);
  const saldoInsumos = Math.max(0, orcamentoInsumos - consumoInsumos);

  // Generate live preview log if not viewing a past log zoom
  const currentPreviewLog: EmailDisparoLog = activeLogZoom || createBudgetAlertEmail(
    currentObra,
    {
      orcamentoInsumos,
      orcamentoTotalObra: orcamentoTotal,
      consumoAcumuladoInsumos: consumoInsumos,
      percentualConsumoInsumos: percentualConsumo,
      saldoInsumos
    },
    usuarios,
    'manual'
  );

  const recipients = findRecipientsForObra(currentObra, usuarios, config.notifyAdmins);

  const handleTriggerSend = () => {
    setIsSending(true);
    setTimeout(() => {
      onSendEmailAlert(currentObra, 'manual');
      setIsSending(false);
      setSendSuccessMsg(`E-mail de alerta de insumos enviado com sucesso para ${recipients.length} destinatários!`);
      setTimeout(() => setSendSuccessMsg(null), 4000);
    }, 800);
  };

  const handleCopyHtml = () => {
    const html = generateEmailHtml(currentPreviewLog);
    navigator.clipboard.writeText(html);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2500);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-800 text-white flex items-center justify-center shadow-md shadow-red-950/60 border border-red-600/40">
              <Mail className="w-5 h-5 text-red-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white leading-tight">
                  Serviço de Notificação por E-mail (Gatilho 90% Insumos)
                </h2>
                <span className="bg-red-700/80 text-red-100 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-red-500/40">
                  SMTP Corporativo Ativo
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Disparo de alertas e relatórios executivos para os gestores vinculados e diretoria técnica.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action & Feedback Banner */}
        {sendSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-emerald-900 text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{sendSuccessMsg}</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-mono">Status: 250 OK - Dispatched</span>
          </div>
        )}

        {/* Sub-Header Controls & Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
          
          {/* Obra Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 uppercase">Canteiro Selecionado:</span>
            <select
              value={selectedObraId}
              onChange={(e) => {
                setSelectedObraId(Number(e.target.value));
                setActiveLogZoom(null);
              }}
              className="bg-white border border-slate-300 text-slate-900 text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-red-600 cursor-pointer shadow-2xs"
            >
              {obras.map(o => (
                <option key={o.id} value={o.id}>
                  {o.nome} ({o.status === 'em_andamento' ? 'Em Andamento' : o.status})
                </option>
              ))}
            </select>
          </div>

          {/* Nav Tabs */}
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-lg">
            <button
              onClick={() => { setActiveTab('preview'); setActiveLogZoom(null); }}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'preview' 
                  ? 'bg-white text-red-800 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Visualizar E-mail</span>
            </button>

            <button
              onClick={() => setActiveTab('recipients')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'recipients' 
                  ? 'bg-white text-red-800 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Destinatários ({recipients.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'history' 
                  ? 'bg-white text-red-800 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Histórico de Envios ({emailLogs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('config')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'config' 
                  ? 'bg-white text-red-800 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Regras de Gatilho</span>
            </button>
          </div>

          {/* Quick Action Send Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyHtml}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
              title="Copiar código HTML do e-mail"
            >
              {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedHtml ? 'Copiado!' : 'Copiar HTML'}</span>
            </button>

            <button
              onClick={handleTriggerSend}
              disabled={isSending}
              className="px-3.5 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{isSending ? 'Disparando...' : 'Disparar Alerta por E-mail'}</span>
            </button>
          </div>
        </div>

        {/* Modal Body with Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100/70">
          
          {/* ========================================================================= */}
          {/* TAB 1: PREVIEW DO E-MAIL (RENDERIZADO)                                   */}
          {/* ========================================================================= */}
          {activeTab === 'preview' && (
            <div className="max-w-3xl mx-auto space-y-3">
              
              {/* Context Summary Bar */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                    currentPreviewLog.gatilho_percentual >= 90
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    Consumo: {currentPreviewLog.gatilho_percentual}% da Verba de Insumos
                  </span>
                  <span className="text-slate-500 font-medium">
                    Obra: <strong className="text-slate-900">{currentPreviewLog.obra_nome}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Protocolo: <strong className="font-mono text-slate-700">{currentPreviewLog.protocolo_entrega}</strong></span>
                </div>
              </div>

              {/* Email Envelope Container */}
              <div className="bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden">
                
                {/* Email Header Bar */}
                <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-950 text-white p-5 sm:p-6 border-b border-red-950">
                  <div className="inline-flex items-center gap-1.5 bg-red-100 text-red-900 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 border border-red-200 shadow-2xs">
                    <AlertTriangle className="w-3 h-3 text-red-700" />
                    <span>⚠️ Alerta Automático de Suprimentos (Gatilho 90%)</span>
                  </div>
                  <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
                    BRASAL ENGENHARIA · NOTIFICAÇÃO DE GESTÃO
                  </h1>
                  <p className="text-xs text-red-200 mt-1">
                    Protocolo: <span className="font-mono font-bold text-white">{currentPreviewLog.protocolo_entrega}</span> · Obra: <span className="font-bold text-white">{currentPreviewLog.obra_nome}</span>
                  </p>
                </div>

                {/* Email Message Content */}
                <div className="p-5 sm:p-6 space-y-4 text-slate-800 text-xs">
                  
                  {/* Warning Callout Box */}
                  <div className="bg-rose-50 border-l-4 border-rose-600 p-3.5 rounded-r-lg">
                    <strong className="text-rose-900 text-sm block font-bold mb-0.5">
                      Atenção Gestor e Diretoria de Suprimentos:
                    </strong>
                    <p className="text-rose-800 leading-relaxed">
                      A obra <strong>{currentPreviewLog.obra_nome}</strong> atingiu <strong>{currentPreviewLog.gatilho_percentual}%</strong> de consumo da verba orçamentária aprovada para materiais e insumos de construção civil.
                    </p>
                  </div>

                  {/* Financial Metrics Quad */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Verba Insumos Aprovada</span>
                      <span className="text-sm font-black text-slate-900 block mt-0.5">
                        {formatCurrency(currentPreviewLog.orcamento_insumos)}
                      </span>
                      <span className="text-[9px] text-slate-400">45% do CAPEX Global</span>
                    </div>

                    <div className="p-3 bg-rose-50/70 rounded-lg border border-rose-200">
                      <span className="text-[9px] uppercase font-bold text-rose-700 block">Consumo Acumulado</span>
                      <span className="text-sm font-black text-rose-900 block mt-0.5">
                        {formatCurrency(currentPreviewLog.consumo_insumos_acumulado)}
                      </span>
                      <span className="text-[9px] font-bold text-rose-700">{currentPreviewLog.gatilho_percentual}% da verba consumida</span>
                    </div>

                    <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200">
                      <span className="text-[9px] uppercase font-bold text-emerald-700 block">Saldo Remanescente</span>
                      <span className="text-sm font-black text-emerald-900 block mt-0.5">
                        {formatCurrency(currentPreviewLog.saldo_insumos)}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-700">{100 - currentPreviewLog.gatilho_percentual}% disponível</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Gestor Responsável</span>
                      <span className="text-xs font-black text-slate-900 block mt-0.5 truncate">
                        {currentPreviewLog.gestor_nome}
                      </span>
                      <span className="text-[9px] text-slate-400">Cadastro de Usuários</span>
                    </div>
                  </div>

                  {/* Progress Bar Ribbon */}
                  <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-700">Consumo da Verba de Insumos: {currentPreviewLog.gatilho_percentual}%</span>
                      <span className="text-red-700">Gatilho de Bloqueio/Alerta: 90%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          currentPreviewLog.gatilho_percentual >= 90 ? 'bg-red-600' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(100, currentPreviewLog.gatilho_percentual)}%` }}
                      />
                    </div>
                  </div>

                  {/* Critical Insumos Table */}
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5 border-b border-slate-200 pb-1 flex items-center justify-between">
                      <span>Insumos com Maior Pressão de Consumo & Estoque Mínimo</span>
                      <span className="text-[10px] text-slate-400 font-normal">Base: Módulo Materiais</span>
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase border-b border-slate-200">
                            <th className="p-2">Material / Insumo</th>
                            <th className="p-2">Estoque Atual</th>
                            <th className="p-2">Mínimo Exigido</th>
                            <th className="p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentPreviewLog.top_insumos_pressao.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="p-2 font-bold text-slate-900">{item.nome}</td>
                              <td className="p-2 font-mono">{item.quantidadeAtual} {item.unidade}</td>
                              <td className="p-2 font-mono text-slate-500">{item.quantidadeMinima} {item.unidade}</td>
                              <td className="p-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  item.isAbaixoMinimo ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {item.isAbaixoMinimo ? '⚠️ Abaixo do Mínimo' : '✓ Regular'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5 border-b border-slate-200 pb-1">
                      Ações e Recomendações Técnicas de Contingenciamento
                    </h3>
                    <ul className="space-y-1 text-slate-600 list-disc list-inside">
                      {currentPreviewLog.recomendacoes.map((rec, idx) => (
                        <li key={idx} className="leading-relaxed">{rec}</li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* Email Footer Bar */}
                <div className="bg-slate-900 text-slate-300 p-5 border-t border-slate-800 text-xs">
                  <strong className="text-white block mb-1">Destinatários Notificados (Cadastro de Usuários Brasal):</strong>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {currentPreviewLog.destinatarios.map(d => (
                      <span key={d.usuario_id} className="bg-slate-800 text-slate-200 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                        {d.nome} &lt;{d.email}&gt; ({d.tipo === 'admin' ? 'Admin' : 'Gestor'})
                      </span>
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono border-t border-slate-800 pt-2 flex items-center justify-between">
                    <span>Enviado via ERP Brasal Engenharia · Serviço Automático de Notificações</span>
                    <span>Data/Hora: {currentPreviewLog.data_envio}</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: DESTINATÁRIOS & CONTATOS VINCULADOS                                */}
          {/* ========================================================================= */}
          {activeTab === 'recipients' && (
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-red-700" />
                  <h3 className="text-sm font-black text-slate-900">
                    Destinatários Vinculados à Obra ({currentObra.nome})
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Os alertas são endereçados automaticamente utilizando as informações de contato cadastradas no módulo de Usuários (perfil Gestor de Obra vinculado e Administradores Corporativos).
                </p>

                <div className="space-y-2">
                  {recipients.map(rec => (
                    <div 
                      key={rec.usuario_id}
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200 flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                          rec.tipo === 'admin' ? 'bg-red-800 text-white shadow-xs' : 'bg-blue-700 text-white shadow-xs'
                        }`}>
                          {rec.nome.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">{rec.nome}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                              rec.tipo === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {rec.tipo === 'admin' ? 'Administrador' : 'Gestor de Obra'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 font-mono block mt-0.5">{rec.email}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">Vinculação</span>
                        <span className="text-xs font-bold text-slate-700 block">
                          {rec.obra_nome || 'Todas as Obras'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: HISTÓRICO DE DISPAROS                                             */}
          {/* ========================================================================= */}
          {activeTab === 'history' && (
            <div className="max-w-4xl mx-auto space-y-3">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-red-700" />
                    <h3 className="text-sm font-black text-slate-900">
                      Histórico de E-mails Disparados pelo Sistema
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    Total de registros: {emailLogs.length}
                  </span>
                </div>

                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                  {emailLogs.map(log => (
                    <div 
                      key={log.id}
                      className="p-3.5 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors bg-white"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            log.gatilho_percentual >= 90 ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-amber-100 text-amber-800'
                          }`}>
                            Gatilho: {log.gatilho_percentual}%
                          </span>
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {log.obra_nome}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            [{log.protocolo_entrega}]
                          </span>
                        </div>
                        
                        <p className="text-xs text-slate-600 font-medium truncate">
                          {log.assunto}
                        </p>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>Para: {log.destinatarios.map(d => d.nome).join(', ')}</span>
                          <span>·</span>
                          <span>Disparo: {log.modo_disparo === 'automatico' ? 'Automático' : 'Manual'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-slate-700 block">
                            {log.data_envio}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>{log.status.toUpperCase()}</span>
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            setActiveLogZoom(log);
                            setActiveTab('preview');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 rounded-lg text-xs font-bold border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>Ver</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: REGRAS E CONFIGURAÇÃO DE GATILHO                                   */}
          {/* ========================================================================= */}
          {activeTab === 'config' && (
            <div className="max-w-2xl mx-auto space-y-3">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Settings className="w-5 h-5 text-red-700" />
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Parâmetros do Motor de Notificações Automáticas
                    </h3>
                    <p className="text-xs text-slate-500">
                      Configure as regras de disparo de e-mail ao monitorar o consumo das obras.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <strong className="text-slate-900 block">Disparo Automático em Segundo Plano</strong>
                      <span className="text-slate-500 text-[11px]">
                        Disparar alertas aos gestores assim que o consumo de insumos atingir o gatilho crítico.
                      </span>
                    </div>
                    <input 
                      type="checkbox"
                      checked={config.autoTriggerEnabled}
                      onChange={(e) => setConfig({ ...config, autoTriggerEnabled: e.target.checked })}
                      className="w-4 h-4 text-red-700 rounded cursor-pointer"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900">Percentual de Gatilho de Alerta</strong>
                      <span className="text-xs font-mono font-black text-red-700 bg-red-100 px-2 py-0.5 rounded">
                        {config.thresholdPercentage}%
                      </span>
                    </div>
                    <input 
                      type="range"
                      min="70"
                      max="100"
                      step="5"
                      value={config.thresholdPercentage}
                      onChange={(e) => setConfig({ ...config, thresholdPercentage: Number(e.target.value) })}
                      className="w-full cursor-pointer accent-red-700"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>70% (Alerta Prévio)</span>
                      <span>90% (Padrão Engenharia)</span>
                      <span>100% (Estouro)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <strong className="text-slate-900 block">Incluir Administradores de Engenharia</strong>
                      <span className="text-slate-500 text-[11px]">
                        Enviar cópia automática para a conta corporativa de administradores (`admin@brasal.com.br`).
                      </span>
                    </div>
                    <input 
                      type="checkbox"
                      checked={config.notifyAdmins}
                      onChange={(e) => setConfig({ ...config, notifyAdmins: e.target.checked })}
                      className="w-4 h-4 text-red-700 rounded cursor-pointer"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <strong className="text-slate-900 block">Incluir Gestores de Canteiro</strong>
                      <span className="text-slate-500 text-[11px]">
                        Localiza dinamicamente o e-mail do engenheiro responsável pelo canteiro no cadastro de usuários.
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 mt-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Ativo por padrão</span>
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    Todas as notificações disparadas são arquivadas na <strong>Trilha de Auditoria (Logs)</strong> para fins de conformidade e ISO 9001.
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 p-3 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Serviço Integrado ao Cadastro de Usuários e Suprimentos Brasal</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
