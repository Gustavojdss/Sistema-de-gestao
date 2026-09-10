import { Usuario, Obra, Notificacao, LogAuditoria } from '../types/erp';

export interface EmailRecipient {
  usuario_id: number;
  nome: string;
  email: string;
  tipo: 'admin' | 'gestor';
  obra_id?: number | null;
  obra_nome?: string;
}

export interface EmailInsumoItem {
  id: number;
  nome: string;
  unidade: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
  valorUnitario: number;
  isAbaixoMinimo: boolean;
}

export interface EmailDisparoLog {
  id: string;
  obra_id: number;
  obra_nome: string;
  gestor_id?: number | null;
  gestor_nome?: string;
  assunto: string;
  gatilho_percentual: number; // e.g. 92%, 95%
  orcamento_total_obra: number;
  orcamento_insumos: number;
  consumo_insumos_acumulado: number;
  saldo_insumos: number;
  destinatarios: EmailRecipient[];
  top_insumos_pressao: EmailInsumoItem[];
  recomendacoes: string[];
  data_envio: string;
  status: 'enviado' | 'entregue' | 'aberto' | 'falha';
  modo_disparo: 'automatico' | 'manual';
  protocolo_entrega: string;
}

export interface EmailNotificationConfig {
  autoTriggerEnabled: boolean;
  thresholdPercentage: number; // default 90%
  notifyAdmins: boolean;
  notifyManagers: boolean;
}

export const DEFAULT_EMAIL_CONFIG: EmailNotificationConfig = {
  autoTriggerEnabled: true,
  thresholdPercentage: 90,
  notifyAdmins: true,
  notifyManagers: true
};

const formatCurrency = (val: number) => {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
};

/**
 * Localiza destinatários (gestor da obra + administradores de engenharia) a partir do cadastro de usuários
 */
export function findRecipientsForObra(
  obra: Obra,
  usuarios: Usuario[],
  includeAdmins: boolean = true
): EmailRecipient[] {
  const recipientsMap = new Map<number, EmailRecipient>();

  // 1. Gestores vinculados especificamente a esta obra
  usuarios
    .filter(u => u.ativo && (u.obra_id === obra.id || u.id === obra.gestor_id))
    .forEach(u => {
      recipientsMap.set(u.id, {
        usuario_id: u.id,
        nome: u.nome,
        email: u.email,
        tipo: u.tipo,
        obra_id: u.obra_id,
        obra_nome: u.obra_nome || obra.nome
      });
    });

  // 2. Se a obra tiver gestor_nome cadastrado e houver usuário com mesmo nome
  if (obra.gestor_nome) {
    const gestorByName = usuarios.find(
      u => u.ativo && (u.nome.toLowerCase().includes(obra.gestor_nome!.toLowerCase()) || obra.gestor_nome!.toLowerCase().includes(u.nome.toLowerCase()))
    );
    if (gestorByName && !recipientsMap.has(gestorByName.id)) {
      recipientsMap.set(gestorByName.id, {
        usuario_id: gestorByName.id,
        nome: gestorByName.nome,
        email: gestorByName.email,
        tipo: gestorByName.tipo,
        obra_id: obra.id,
        obra_nome: obra.nome
      });
    }
  }

  // 3. Administradores corporativos de engenharia
  if (includeAdmins) {
    usuarios
      .filter(u => u.ativo && u.tipo === 'admin')
      .forEach(u => {
        if (!recipientsMap.has(u.id)) {
          recipientsMap.set(u.id, {
            usuario_id: u.id,
            nome: u.nome,
            email: u.email,
            tipo: u.tipo,
            obra_id: null,
            obra_nome: 'Diretoria / Todas as Obras'
          });
        }
      });
  }

  return Array.from(recipientsMap.values());
}

/**
 * Cria e dispara um log de e-mail formatado para a obra que atingiu o gatilho
 */
export function createBudgetAlertEmail(
  obra: Obra,
  insumosMetrics: {
    orcamentoInsumos: number;
    orcamentoTotalObra: number;
    consumoAcumuladoInsumos: number;
    percentualConsumoInsumos: number;
    saldoInsumos: number;
    topMateriaisEmAlerta?: EmailInsumoItem[];
  },
  usuarios: Usuario[],
  modo: 'automatico' | 'manual' = 'automatico'
): EmailDisparoLog {
  const destinatarios = findRecipientsForObra(obra, usuarios, true);
  const now = new Date();
  const timestampStr = now.toISOString().replace('T', ' ').substring(0, 19);
  const protocolNumber = `BRASAL-ALERT-${obra.id}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const topInsumos: EmailInsumoItem[] = insumosMetrics.topMateriaisEmAlerta || [
    { id: 1, nome: 'Aço CA-50 10mm (Estrutural)', unidade: 'kg', quantidadeAtual: 4200, quantidadeMinima: 8000, valorUnitario: 8.5, isAbaixoMinimo: true },
    { id: 2, nome: 'Concreto Usinado FCK 30 MPa', unidade: 'm³', quantidadeAtual: 85, quantidadeMinima: 150, valorUnitario: 420, isAbaixoMinimo: true },
    { id: 3, nome: 'Cimento CP-II F 32kg', unidade: 'sc', quantidadeAtual: 340, quantidadeMinima: 600, valorUnitario: 34.9, isAbaixoMinimo: true }
  ];

  const recomendacoes = [
    `Conter imediatamente requisições extraordinárias de compras até alinhamento de cronograma.`,
    `Realizar inventário físico de insumos no canteiro para auditar eventuais índices de perdas ou desvios.`,
    `Submeter pedido de aditivo / suplementação orçamentária para a Diretoria de Engenharia caso a fase demande avanço acelerado.`,
    `Rever cronograma de entregas com fornecedores padrão para parcelamento de faturamento.`
  ];

  const assunto = `[ALERTA CRÍTICO 90%] Limite Orçamentário de Insumos Atingido (${insumosMetrics.percentualConsumoInsumos}%) - ${obra.nome}`;

  return {
    id: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    obra_id: obra.id,
    obra_nome: obra.nome,
    gestor_id: obra.gestor_id,
    gestor_nome: obra.gestor_nome || 'Gestor Responsável',
    assunto,
    gatilho_percentual: insumosMetrics.percentualConsumoInsumos,
    orcamento_total_obra: insumosMetrics.orcamentoTotalObra,
    orcamento_insumos: insumosMetrics.orcamentoInsumos,
    consumo_insumos_acumulado: insumosMetrics.consumoAcumuladoInsumos,
    saldo_insumos: insumosMetrics.saldoInsumos,
    destinatarios,
    top_insumos_pressao: topInsumos,
    recomendacoes,
    data_envio: timestampStr,
    status: 'entregue',
    modo_disparo: modo,
    protocolo_entrega: protocolNumber
  };
}

/**
 * Gera o corpo HTML profissional e responsivo do e-mail corporativo da Brasal Engenharia
 */
export function generateEmailHtml(log: EmailDisparoLog): string {
  const destNomes = log.destinatarios.map(d => `${d.nome} &lt;${d.email}&gt;`).join(', ');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${log.assunto}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; line-height: 1.5; }
    .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%); color: #ffffff; padding: 24px 28px; text-align: left; }
    .badge-alert { background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 20px; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; margin-bottom: 8px; border: 1px solid #fecaca; }
    .header h1 { margin: 4px 0 0 0; font-size: 18px; font-weight: 900; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 12px; color: #fecaca; }
    .content { padding: 24px 28px; }
    .info-box { background: #fff1f2; border-left: 4px solid #e11d48; padding: 14px 18px; border-radius: 6px; margin-bottom: 20px; }
    .info-box strong { color: #9f1239; font-size: 13px; display: block; margin-bottom: 4px; }
    .info-box p { margin: 0; font-size: 12px; color: #881337; }
    .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 14px; border-radius: 8px; }
    .metric-label { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; }
    .metric-value { font-size: 16px; font-weight: 900; color: #0f172a; margin-top: 2px; }
    .progress-bar-wrap { margin: 16px 0; background: #e2e8f0; height: 10px; border-radius: 5px; overflow: hidden; }
    .progress-bar-fill { background: #e11d48; height: 100%; width: ${Math.min(100, log.gatilho_percentual)}%; }
    .section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; color: #334155; margin: 20px 0 10px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .rec-list { margin: 0; padding-left: 18px; font-size: 12px; color: #334155; }
    .rec-list li { margin-bottom: 6px; }
    .table-insumos { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
    .table-insumos th { background: #f1f5f9; text-align: left; padding: 8px; font-weight: 700; color: #475569; border-bottom: 1px solid #cbd5e1; }
    .table-insumos td { padding: 8px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    .footer { background: #0f172a; color: #94a3b8; padding: 18px 28px; font-size: 11px; text-align: left; border-top: 1px solid #1e293b; }
    .footer strong { color: #f8fafc; }
    .meta-tag { font-family: monospace; color: #64748b; font-size: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge-alert">⚠️ Alerta Automático de Suprimentos (Gatilho 90%)</span>
      <h1>BRASAL ENGENHARIA · NOTIFICAÇÃO DE GESTÃO</h1>
      <p>Protocolo: ${log.protocolo_entrega} · Obra: ${log.obra_nome}</p>
    </div>

    <div class="content">
      <div class="info-box">
        <strong>Atenção Gestor e Diretoria de Suprimentos:</strong>
        <p>A obra <strong>${log.obra_nome}</strong> atingiu <strong>${log.gatilho_percentual}%</strong> de consumo da verba orçamentária aprovada para materiais e insumos de construção.</p>
      </div>

      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-label">Orçamento Total de Insumos</div>
          <div class="metric-value">${formatCurrency(log.orcamento_insumos)}</div>
          <span style="font-size: 10px; color: #64748b;">(45% do CAPEX Global da Obra)</span>
        </div>
        <div class="metric-card">
          <div class="metric-label">Consumo Acumulado Atual</div>
          <div class="metric-value" style="color: #be123c;">${formatCurrency(log.consumo_insumos_acumulado)}</div>
          <span style="font-size: 10px; color: #be123c; font-weight: 700;">${log.gatilho_percentual}% da verba consumida</span>
        </div>
        <div class="metric-card">
          <div class="metric-label">Saldo Orçamentário Remanescente</div>
          <div class="metric-value" style="color: #047857;">${formatCurrency(log.saldo_insumos)}</div>
          <span style="font-size: 10px; color: #047857;">${100 - log.gatilho_percentual}% disponível</span>
        </div>
        <div class="metric-card">
          <div class="metric-label">Gestor Responsável</div>
          <div class="metric-value" style="font-size: 13px;">${log.gestor_nome}</div>
          <span style="font-size: 10px; color: #64748b;">Cadastro de Usuários Brasal</span>
        </div>
      </div>

      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: #475569;">
          <span>Consumo de Insumos: ${log.gatilho_percentual}%</span>
          <span>Teto Crítico: 90%</span>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill"></div>
        </div>
      </div>

      <div class="section-title">Insumos com Maior Pressão de Consumo & Estoque Mínimo</div>
      <table class="table-insumos">
        <thead>
          <tr>
            <th>Material / Insumo</th>
            <th>Estoque Atual</th>
            <th>Mínimo Exigido</th>
            <th>Condição</th>
          </tr>
        </thead>
        <tbody>
          ${log.top_insumos_pressao.map(item => `
            <tr>
              <td><strong>${item.nome}</strong></td>
              <td>${item.quantidadeAtual} ${item.unidade}</td>
              <td>${item.quantidadeMinima} ${item.unidade}</td>
              <td>
                <span style="color: ${item.isAbaixoMinimo ? '#be123c' : '#047857'}; font-weight: bold;">
                  ${item.isAbaixoMinimo ? '⚠️ Abaixo do Mínimo' : '✓ Regular'}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="section-title">Ações e Recomendações Técnicas de Contingenciamento</div>
      <ul class="rec-list">
        ${log.recomendacoes.map(rec => `<li>${rec}</li>`).join('')}
      </ul>
    </div>

    <div class="footer">
      <div><strong>Destinatários Notificados (via Cadastro de Usuários):</strong></div>
      <div style="margin-top: 4px; color: #cbd5e1;">${destNomes}</div>
      <div style="margin-top: 12px;" class="meta-tag">
        Enviado via ERP Brasal Engenharia · Serviço Automático de Notificações de Suprimentos · ${log.data_envio}
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Logs iniciais de histórico para obras ativas que já atingiram o patamar de alerta
 */
export const INITIAL_EMAIL_LOGS: EmailDisparoLog[] = [
  {
    id: 'email-init-001',
    obra_id: 2,
    obra_nome: 'Comercial Lago Norte Corporate',
    gestor_id: 3,
    gestor_nome: 'Mariana Santos (Engenheira de Produção)',
    assunto: '[ALERTA CRÍTICO 90%] Limite Orçamentário de Insumos Atingido (92%) - Comercial Lago Norte Corporate',
    gatilho_percentual: 92,
    orcamento_total_obra: 18400000,
    orcamento_insumos: 8280000,
    consumo_insumos_acumulado: 7617600,
    saldo_insumos: 662400,
    destinatarios: [
      { usuario_id: 3, nome: 'Mariana Santos (Engenheira de Produção)', email: 'mariana@brasal.com.br', tipo: 'gestor', obra_id: 2, obra_nome: 'Comercial Lago Norte Corporate' },
      { usuario_id: 1, nome: 'Administrador Engenharia', email: 'admin@brasal.com.br', tipo: 'admin', obra_id: null, obra_nome: 'Diretoria / Todas as Obras' }
    ],
    top_insumos_pressao: [
      { id: 1, nome: 'Aço CA-50 10mm (Estrutural)', unidade: 'kg', quantidadeAtual: 4200, quantidadeMinima: 8000, valorUnitario: 8.5, isAbaixoMinimo: true },
      { id: 2, nome: 'Concreto Usinado FCK 30 MPa', unidade: 'm³', quantidadeAtual: 85, quantidadeMinima: 150, valorUnitario: 420, isAbaixoMinimo: true },
      { id: 3, nome: 'Cimento CP-II F 32kg', unidade: 'sc', quantidadeAtual: 340, quantidadeMinima: 600, valorUnitario: 34.9, isAbaixoMinimo: true }
    ],
    recomendacoes: [
      'Conter requisições extras e auditar perdas na fase de acabamento.',
      'Revisar cronograma de compras com fornecedores de vidro e revestimentos.',
      'Submeter pedido de suplementação orçamentária se necessário.'
    ],
    data_envio: '2026-08-30 08:30:15',
    status: 'entregue',
    modo_disparo: 'automatico',
    protocolo_entrega: 'BRASAL-ALERT-2-20260830-8472'
  },
  {
    id: 'email-init-002',
    obra_id: 3,
    obra_nome: 'Infraestrutura Parque Burle Marx',
    gestor_id: 4,
    gestor_nome: 'Rodrigo Alcantara (Almoxarife Central)',
    assunto: '[ALERTA CRÍTICO 90%] Limite Orçamentário de Insumos Atingido (95%) - Infraestrutura Parque Burle Marx',
    gatilho_percentual: 95,
    orcamento_total_obra: 8200000,
    orcamento_insumos: 3690000,
    consumo_insumos_acumulado: 3505500,
    saldo_insumos: 184500,
    destinatarios: [
      { usuario_id: 4, nome: 'Rodrigo Alcantara (Almoxarife Central)', email: 'rodrigo.almox@brasal.com.br', tipo: 'gestor', obra_id: 3, obra_nome: 'Infraestrutura Parque Burle Marx' },
      { usuario_id: 1, nome: 'Administrador Engenharia', email: 'admin@brasal.com.br', tipo: 'admin', obra_id: null, obra_nome: 'Diretoria / Todas as Obras' }
    ],
    top_insumos_pressao: [
      { id: 4, nome: 'Tubo PVC Esgoto 100mm (Vara 6m)', unidade: 'un', quantidadeAtual: 60, quantidadeMinima: 120, valorUnitario: 68.0, isAbaixoMinimo: true },
      { id: 5, nome: 'Areia Média Lavada', unidade: 'm³', quantidadeAtual: 40, quantidadeMinima: 80, valorUnitario: 110.0, isAbaixoMinimo: true }
    ],
    recomendacoes: [
      'Bloquear compras extraordinárias até aprovação de aditivo de drenagem.',
      'Auditar medições de pavimentação com a empreiteira executora.'
    ],
    data_envio: '2026-08-31 09:15:22',
    status: 'aberto',
    modo_disparo: 'automatico',
    protocolo_entrega: 'BRASAL-ALERT-3-20260831-5190'
  }
];
