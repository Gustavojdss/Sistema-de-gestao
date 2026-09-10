import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, ErpTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ObrasView } from './components/ObrasView';
import { AlmoxarifadoView } from './components/AlmoxarifadoView';
import { MateriaisView } from './components/MateriaisView';
import { EquipeView } from './components/EquipeView';
import { DocumentosView } from './components/DocumentosView';
import { VistoriasView } from './components/VistoriasView';
import { UsuariosView } from './components/UsuariosView';
import { AuditoriaView } from './components/AuditoriaView';
import { DocsView } from './components/DocsView';
import { ApiView } from './components/ApiView';
import { EmailNotificationModal } from './components/EmailNotificationModal';

import {
  Usuario,
  Obra,
  Colaborador,
  DocumentoColaborador,
  ItemAlmoxarifado,
  MovimentacaoAlmoxarifado,
  CategoriaMaterial,
  MaterialConsumo,
  SolicitacaoMaterial,
  MovimentacaoMaterial,
  Vistoria,
  SolicitacaoTransferencia,
  Notificacao,
  LogAuditoria,
  IncidenteSeguranca,
  ContratoSubempreiteira
} from './types/erp';

import {
  INITIAL_USUARIOS,
  INITIAL_OBRAS,
  INITIAL_COLABORADORES,
  INITIAL_ITENS_ALMOXARIFADO,
  INITIAL_MOVIMENTACOES_ALMOXARIFADO,
  INITIAL_CATEGORIAS_MATERIAIS,
  INITIAL_MATERIAIS_CONSUMO,
  INITIAL_SOLICITACOES_MATERIAIS,
  INITIAL_MOVIMENTACOES_MATERIAIS,
  INITIAL_DOCUMENTOS,
  INITIAL_VISTORIAS,
  INITIAL_TRANSFERENCIAS,
  INITIAL_NOTIFICACOES,
  INITIAL_LOGS_AUDITORIA,
  INITIAL_INCIDENTES,
  INITIAL_CONTRATOS_TERCEIROS
} from './data/initialData';

import {
  EmailDisparoLog,
  INITIAL_EMAIL_LOGS,
  createBudgetAlertEmail
} from './services/emailNotificationService';

import { 
  X, 
  Check, 
  AlertCircle, 
  Building2, 
  Boxes, 
  ClipboardList, 
  Users, 
  FileCheck2, 
  CalendarCheck, 
  ShieldAlert,
  HardHat
} from 'lucide-react';

export default function App() {
  // State
  const [currentMode, setCurrentMode] = useState<'erp' | 'docs' | 'api'>('erp');
  const [activeTab, setActiveTab] = useState<ErpTab>('dashboard');
  const [selectedObraId, setSelectedObraId] = useState<number | 'all'>('all');

  const [usuarios, setUsuarios] = useState<Usuario[]>(INITIAL_USUARIOS);
  const [currentUser, setCurrentUser] = useState<Usuario>(INITIAL_USUARIOS[0]);
  const [obras, setObras] = useState<Obra[]>(INITIAL_OBRAS);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>(INITIAL_COLABORADORES);
  const [itensAlmoxarifado, setItensAlmoxarifado] = useState<ItemAlmoxarifado[]>(INITIAL_ITENS_ALMOXARIFADO);
  const [movimentacoesAlmox, setMovimentacoesAlmox] = useState<MovimentacaoAlmoxarifado[]>(INITIAL_MOVIMENTACOES_ALMOXARIFADO);
  const [categorias, setCategorias] = useState<CategoriaMaterial[]>(INITIAL_CATEGORIAS_MATERIAIS);
  const [materiais, setMateriais] = useState<MaterialConsumo[]>(INITIAL_MATERIAIS_CONSUMO);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoMaterial[]>(INITIAL_SOLICITACOES_MATERIAIS);
  const [movimentacoesMat, setMovimentacoesMat] = useState<MovimentacaoMaterial[]>(INITIAL_MOVIMENTACOES_MATERIAIS);
  const [documentos, setDocumentos] = useState<DocumentoColaborador[]>(INITIAL_DOCUMENTOS);
  const [vistorias, setVistorias] = useState<Vistoria[]>(INITIAL_VISTORIAS);
  const [incidentes, setIncidentes] = useState<IncidenteSeguranca[]>(INITIAL_INCIDENTES);
  const [contratos, setContratos] = useState<ContratoSubempreiteira[]>(INITIAL_CONTRATOS_TERCEIROS);
  const [transferencias, setTransferencias] = useState<SolicitacaoTransferencia[]>(INITIAL_TRANSFERENCIAS);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>(INITIAL_NOTIFICACOES);
  const [auditLogs, setAuditLogs] = useState<LogAuditoria[]>(INITIAL_LOGS_AUDITORIA);
  const [emailLogs, setEmailLogs] = useState<EmailDisparoLog[]>(INITIAL_EMAIL_LOGS);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const addAuditLog = (modulo: string, acao: string, detalhes: string) => {
    const newLog: LogAuditoria = {
      id: Date.now(),
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      usuario_id: currentUser.id,
      usuario_nome: currentUser.nome,
      modulo,
      acao,
      detalhes,
      ip_origem: '187.54.120.33'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Modals state
  const [modalNovaObra, setModalNovaObra] = useState(false);
  const [modalNovoItem, setModalNovoItem] = useState(false);
  const [modalSaida, setModalSaida] = useState<{ open: boolean; itemId?: number }>({ open: false });
  const [modalDevolucao, setModalDevolucao] = useState<{ open: boolean; itemId?: number }>({ open: false });
  const [modalNovoMaterial, setModalNovoMaterial] = useState(false);
  const [modalSolicitar, setModalSolicitar] = useState(false);
  const [modalMovimentacaoMat, setModalMovimentacaoMat] = useState<{ open: boolean; materialId?: number }>({ open: false });
  const [modalNovoColaborador, setModalNovoColaborador] = useState(false);
  const [modalUploadDoc, setModalUploadDoc] = useState<{ open: boolean; colaboradorId?: number }>({ open: false });
  const [modalNovaVistoria, setModalNovaVistoria] = useState(false);
  const [modalNovoUsuario, setModalNovoUsuario] = useState(false);
  const [modalEmailNotification, setModalEmailNotification] = useState<{ open: boolean; obra?: Obra | null }>({ open: false });

  // Form states for modals
  const [formObra, setFormObra] = useState({
    nome: '',
    endereco: '',
    data_inicio: new Date().toISOString().split('T')[0],
    data_previsao_termino: '',
    orcamento_total: 5000000,
    observacoes: ''
  });

  const [formItem, setFormItem] = useState({
    obra_id: 1,
    nome: '',
    numero_serie: '',
    categoria: 'Equipamentos' as ItemAlmoxarifado['categoria'],
    valor_aquisicao: 1500,
    quantidade_atual: 1,
    quantidade_minima: 1,
    localizacao: 'Almoxarifado Central'
  });

  const [formSaida, setFormSaida] = useState({
    item_id: 1,
    colaborador_id: 1,
    data_previsao_devolucao: '',
    observacao: ''
  });

  const [formMaterial, setFormMaterial] = useState({
    obra_id: 1,
    codigo: 'MAT-',
    nome: '',
    categoria_id: 1,
    unidade_medida: 'unidade',
    quantidade_atual: 10,
    quantidade_minima: 20,
    valor_unitario: 50.0,
    fornecedor_padrao: ''
  });

  const [formSolicitacao, setFormSolicitacao] = useState({
    obra_id: 1,
    material_id: 1,
    nome_material: '',
    quantidade_solicitada: 100,
    unidade_medida: 'saco',
    especificacoes: ''
  });

  const [formColaborador, setFormColaborador] = useState({
    nome: '',
    matricula: `MAT-00${colaboradores.length + 1}`,
    cpf: '',
    cargo: 'Pedreiro',
    funcao: 'Alvenaria Estrutural',
    tipo: 'proprio' as 'proprio' | 'terceiro',
    empresa_terceiro: '',
    telefone: '(61) 98888-0000',
    email: '',
    obra_id: 1
  });

  const [formVistoria, setFormVistoria] = useState({
    obra_id: 1,
    titulo: '',
    tipo: 'Estrutural & Alvenaria',
    descricao: '',
    data_agendada: ''
  });

  const [formDoc, setFormDoc] = useState({
    colaborador_id: 1,
    tipo_documento: 'nr35' as DocumentoColaborador['tipo_documento'],
    nome_documento: '',
    data_emissao: '',
    data_validade: ''
  });

  const [formUsuario, setFormUsuario] = useState({
    nome: '',
    email: '',
    tipo: 'gestor' as 'admin' | 'gestor',
    obra_id: 1
  });

  // Calculate sidebar stats
  const docsPendentesCount = documentos.filter(d => d.status === 'pendente').length;
  const solicitacoesPendentesCount = solicitacoes.filter(s => s.status === 'pendente').length;
  const hoje = new Date();
  const itensAtrasadosCount = itensAlmoxarifado.filter(item => {
    if (item.status !== 'uso' || !item.data_previsao_devolucao) return false;
    return new Date(item.data_previsao_devolucao) < hoje;
  }).length;
  const vistoriasPendentesCount = vistorias.filter(v => v.status === 'pendente').length;

  // Handlers
  const handleMarkNotificacaoLida = (id: number) => {
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  };

  const handleSendNotification = (notif: { titulo: string; mensagem: string; obra_id?: number; obra_nome?: string }) => {
    const newNotif: Notificacao = {
      id: Date.now(),
      usuario_id: currentUser?.id || 1,
      obra_id: notif.obra_id || 1,
      obra_nome: notif.obra_nome || 'Todas as Obras',
      titulo: notif.titulo,
      mensagem: notif.mensagem,
      tipo: 'documento',
      lida: false,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    setNotificacoes(prev => [newNotif, ...prev]);
    showToast(notif.titulo);
  };

  const handleQuickReplenish = (material: MaterialConsumo, suggestedQty?: number) => {
    const obra = obras.find(o => o.id === material.obra_id);
    const qtyToRequest = suggestedQty && suggestedQty > 0 
      ? suggestedQty 
      : Math.max(material.quantidade_minima, (material.quantidade_minima * 2) - material.quantidade_atual);
    
    const newSol: SolicitacaoMaterial = {
      id: Date.now(),
      obra_id: material.obra_id,
      obra_nome: obra?.nome || material.obra_nome || 'Canteiro Principal',
      material_id: material.id,
      nome_material: material.nome,
      especificacoes: `Reposição rápida de estoque crítico (Saldo: ${material.quantidade_atual} ${material.unidade_medida} / Mínimo de Segurança: ${material.quantidade_minima} ${material.unidade_medida})`,
      quantidade_solicitada: qtyToRequest,
      unidade_medida: material.unidade_medida,
      valor_unitario_estimado: material.valor_unitario,
      valor_total_estimado: material.valor_unitario * qtyToRequest,
      status: 'pendente',
      solicitado_por: currentUser.id,
      solicitante_nome: currentUser.nome,
      data_solicitacao: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    setSolicitacoes(prev => [newSol, ...prev]);
    addAuditLog('Materiais', 'SOLICITAÇÃO RÁPIDA 1-CLIQUE', `Solicitou reposição de ${newSol.quantidade_solicitada} ${newSol.unidade_medida} de ${newSol.nome_material}`);
    
    const newNotif: Notificacao = {
      id: Date.now() + 1,
      usuario_id: currentUser.id,
      obra_id: material.obra_id,
      obra_nome: newSol.obra_nome,
      titulo: `Reposição Solicitada: ${material.nome}`,
      mensagem: `Pedido de reposição de ${qtyToRequest} ${material.unidade_medida} enviado ao setor de compras.`,
      tipo: 'estoque',
      lida: false,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    setNotificacoes(prev => [newNotif, ...prev]);
    showToast(`⚡ Solicitação de reposição de "${material.nome}" (${qtyToRequest} ${material.unidade_medida}) enviada!`);
  };

  const handleCreateObra = (e: React.FormEvent) => {
    e.preventDefault();
    const newObra: Obra = {
      id: Date.now(),
      nome: formObra.nome,
      endereco: formObra.endereco,
      status: 'planejamento',
      data_inicio: formObra.data_inicio,
      data_previsao_termino: formObra.data_previsao_termino || '2025-12-31',
      orcamento_total: Number(formObra.orcamento_total),
      orcamento_materiais: Number(formObra.orcamento_total) * 0.5,
      orcamento_almoxarifado: Number(formObra.orcamento_total) * 0.1,
      observacoes: formObra.observacoes,
      progresso: 5,
      fase_atual: 'fundacao'
    };
    setObras(prev => [newObra, ...prev]);
    addAuditLog('Obras', 'CADASTRO DE OBRA', `Cadastrou nova obra: ${newObra.nome}`);
    setModalNovaObra(false);
    showToast(`Obra "${newObra.nome}" cadastrada com sucesso!`);
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    const obra = obras.find(o => o.id === Number(formItem.obra_id));
    const newItem: ItemAlmoxarifado = {
      id: Date.now(),
      obra_id: Number(formItem.obra_id),
      obra_nome: obra?.nome || 'Obra',
      nome: formItem.nome,
      numero_serie: formItem.numero_serie,
      categoria: formItem.categoria,
      valor_aquisicao: Number(formItem.valor_aquisicao),
      quantidade_atual: Number(formItem.quantidade_atual),
      unidade_medida: 'unidade',
      quantidade_minima: Number(formItem.quantidade_minima),
      condicao: 'nova',
      localizacao: formItem.localizacao,
      status: 'estoque',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setItensAlmoxarifado(prev => [newItem, ...prev]);
    addAuditLog('Almoxarifado', 'NOVO ITEM', `Cadastrou ${newItem.nome} (${newItem.numero_serie})`);
    setModalNovoItem(false);
    showToast(`Item "${newItem.nome}" adicionado ao almoxarifado!`);
  };

  const handleRealizarSaida = (e: React.FormEvent) => {
    e.preventDefault();
    const targetItemId = modalSaida.itemId || Number(formSaida.item_id);
    const item = itensAlmoxarifado.find(i => i.id === targetItemId);
    const colab = colaboradores.find(c => c.id === Number(formSaida.colaborador_id));

    if (!item || !colab) return;

    setItensAlmoxarifado(prev => prev.map(i => {
      if (i.id === targetItemId) {
        return {
          ...i,
          status: 'uso',
          colaborador_retirada_id: colab.id,
          colaborador_nome: colab.nome,
          data_retirada: new Date().toISOString().replace('T', ' ').substring(0, 19),
          data_previsao_devolucao: formSaida.data_previsao_devolucao || '2024-09-10'
        };
      }
      return i;
    }));

    const newMov: MovimentacaoAlmoxarifado = {
      id: Date.now(),
      item_id: item.id,
      item_nome: item.nome,
      obra_id: item.obra_id,
      tipo: 'saida',
      quantidade: 1,
      colaborador_id: colab.id,
      colaborador_nome: colab.nome,
      responsavel_id: currentUser.id,
      responsavel_nome: currentUser.nome,
      observacao: formSaida.observacao || 'Empréstimo em campo',
      data_movimentacao: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setMovimentacoesAlmox(prev => [newMov, ...prev]);
    addAuditLog('Almoxarifado', 'EMPRÉSTIMO', `Liberou ${item.nome} para ${colab.nome}`);
    setModalSaida({ open: false });
    showToast(`Empréstimo de ${item.nome} registrado para ${colab.nome}!`);
  };

  const handleDevolucao = (itemId?: number) => {
    const targetId = itemId || modalDevolucao.itemId;
    const item = itensAlmoxarifado.find(i => i.id === targetId);
    if (!item) return;

    setItensAlmoxarifado(prev => prev.map(i => {
      if (i.id === targetId) {
        return {
          ...i,
          status: 'estoque',
          colaborador_retirada_id: null,
          colaborador_nome: undefined,
          data_retirada: null,
          data_previsao_devolucao: null
        };
      }
      return i;
    }));

    const newMov: MovimentacaoAlmoxarifado = {
      id: Date.now(),
      item_id: item.id,
      item_nome: item.nome,
      obra_id: item.obra_id,
      tipo: 'devolucao',
      quantidade: 1,
      responsavel_id: currentUser.id,
      responsavel_nome: currentUser.nome,
      observacao: 'Devolução registrada no almoxarifado',
      data_movimentacao: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setMovimentacoesAlmox(prev => [newMov, ...prev]);
    addAuditLog('Almoxarifado', 'DEVOLUÇÃO', `Recebeu devolução de ${item.nome}`);
    setModalDevolucao({ open: false });
    showToast(`Devolução de "${item.nome}" confirmada!`);
  };

  const handleManutencao = (itemId: number) => {
    const item = itensAlmoxarifado.find(i => i.id === itemId);
    if (!item) return;

    const newStatus = item.status === 'manutencao' ? 'estoque' : 'manutencao';
    setItensAlmoxarifado(prev => prev.map(i => i.id === itemId ? { ...i, status: newStatus } : i));
    addAuditLog('Almoxarifado', 'MANUTENÇÃO', `Alterou status de ${item.nome} para ${newStatus}`);
    showToast(`Status de "${item.nome}" alterado para ${newStatus}.`);
  };

  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    const obra = obras.find(o => o.id === Number(formMaterial.obra_id));
    const cat = categorias.find(c => c.id === Number(formMaterial.categoria_id));
    const newMat: MaterialConsumo = {
      id: Date.now(),
      obra_id: Number(formMaterial.obra_id),
      obra_nome: obra?.nome || 'Obra',
      codigo: formMaterial.codigo || `MAT-${Date.now().toString().slice(-4)}`,
      nome: formMaterial.nome,
      categoria_id: Number(formMaterial.categoria_id),
      categoria_nome: cat?.nome || 'Geral',
      unidade_medida: formMaterial.unidade_medida,
      quantidade_atual: Number(formMaterial.quantidade_atual),
      quantidade_minima: Number(formMaterial.quantidade_minima),
      valor_unitario: Number(formMaterial.valor_unitario),
      valor_total: Number(formMaterial.quantidade_atual) * Number(formMaterial.valor_unitario),
      status: 'ativo',
      fornecedor_padrao: formMaterial.fornecedor_padrao
    };
    setMateriais(prev => [newMat, ...prev]);
    addAuditLog('Materiais', 'CADASTRO DE MATERIAL', `Cadastrou material: ${newMat.nome}`);
    setModalNovoMaterial(false);
    showToast(`Material "${newMat.nome}" cadastrado com sucesso!`);
  };

  const handleCreateSolicitacao = (e: React.FormEvent) => {
    e.preventDefault();
    const mat = materiais.find(m => m.id === Number(formSolicitacao.material_id));
    const obra = obras.find(o => o.id === Number(formSolicitacao.obra_id));
    const newSol: SolicitacaoMaterial = {
      id: Date.now(),
      obra_id: Number(formSolicitacao.obra_id),
      obra_nome: obra?.nome || 'Obra',
      material_id: mat?.id,
      nome_material: mat?.nome || formSolicitacao.nome_material,
      especificacoes: formSolicitacao.especificacoes || 'Lote para avanço da alvenaria',
      quantidade_solicitada: Number(formSolicitacao.quantidade_solicitada),
      unidade_medida: formSolicitacao.unidade_medida,
      valor_unitario_estimado: mat?.valor_unitario || 50,
      valor_total_estimado: (mat?.valor_unitario || 50) * Number(formSolicitacao.quantidade_solicitada),
      status: 'pendente',
      solicitado_por: currentUser.id,
      solicitante_nome: currentUser.nome,
      data_solicitacao: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setSolicitacoes(prev => [newSol, ...prev]);
    addAuditLog('Materiais', 'SOLICITAÇÃO DE COMPRA', `Solicitou compra de ${newSol.quantidade_solicitada} ${newSol.unidade_medida} de ${newSol.nome_material}`);
    setModalSolicitar(false);
    showToast(`Solicitação de compra enviada para aprovação!`);
  };

  const handleAprovarSolicitacao = (sol: SolicitacaoMaterial) => {
    setSolicitacoes(prev => prev.map(s => s.id === sol.id ? {
      ...s,
      status: 'aprovado',
      aprovado_por: currentUser.id,
      aprovador_nome: currentUser.nome,
      data_aprovacao: new Date().toISOString().replace('T', ' ').substring(0, 19)
    } : s));
    addAuditLog('Materiais', 'APROVAÇÃO DE PEDIDO', `Aprovou solicitação #${sol.id} (${sol.nome_material})`);
    showToast(`Solicitação #${sol.id} aprovada!`);
  };

  const handleRejeitarSolicitacao = (sol: SolicitacaoMaterial) => {
    setSolicitacoes(prev => prev.map(s => s.id === sol.id ? { ...s, status: 'rejeitado' } : s));
    addAuditLog('Materiais', 'REJEIÇÃO DE PEDIDO', `Rejeitou solicitação #${sol.id} (${sol.nome_material})`);
    showToast(`Solicitação #${sol.id} rejeitada.`);
  };

  const handleEntregarSolicitacao = (sol: SolicitacaoMaterial) => {
    setSolicitacoes(prev => prev.map(s => s.id === sol.id ? {
      ...s,
      status: 'entregue',
      data_entrega: new Date().toISOString().split('T')[0]
    } : s));
    if (sol.material_id) {
      setMateriais(prev => prev.map(m => {
        if (m.id === sol.material_id) {
          const newQty = m.quantidade_atual + sol.quantidade_solicitada;
          return { ...m, quantidade_atual: newQty, valor_total: newQty * m.valor_unitario };
        }
        return m;
      }));
    }
    addAuditLog('Materiais', 'ENTREGA DE MATERIAL', `Confirmou entrega no canteiro da solicitação #${sol.id}`);
    showToast(`Entrega registrada e estoque incrementado!`);
  };

  const handleCreateColaborador = (e: React.FormEvent) => {
    e.preventDefault();
    const obra = obras.find(o => o.id === Number(formColaborador.obra_id));
    const newColab: Colaborador = {
      id: Date.now(),
      nome: formColaborador.nome,
      matricula: formColaborador.matricula,
      cpf: formColaborador.cpf || '000.000.000-00',
      cargo: formColaborador.cargo,
      funcao: formColaborador.funcao,
      tipo: formColaborador.tipo,
      empresa_terceira: formColaborador.tipo === 'terceiro' ? formColaborador.empresa_terceiro : undefined,
      telefone: formColaborador.telefone,
      email: formColaborador.email,
      obra_id: Number(formColaborador.obra_id),
      obra_nome: obra?.nome || 'Obra',
      data_admissao: new Date().toISOString().split('T')[0],
      status: 'ativo',
      foto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
    };
    setColaboradores(prev => [newColab, ...prev]);
    addAuditLog('Equipe', 'CADASTRO DE OPERÁRIO', `Cadastrou colaborador: ${newColab.nome} (${newColab.cargo})`);
    setModalNovoColaborador(false);
    showToast(`Colaborador "${newColab.nome}" cadastrado com sucesso!`);
  };

  const handleUploadDocumento = (e: React.FormEvent) => {
    e.preventDefault();
    const targetColabId = modalUploadDoc.colaboradorId || Number(formDoc.colaborador_id);
    const colab = colaboradores.find(c => c.id === targetColabId);
    if (!colab) return;

    const newDoc: DocumentoColaborador = {
      id: Date.now(),
      colaborador_id: colab.id,
      colaborador_nome: colab.nome,
      colaborador_matricula: colab.matricula,
      obra_nome: colab.obra_nome,
      tipo_documento: formDoc.tipo_documento,
      nome_documento: formDoc.nome_documento || `Certificado ${formDoc.tipo_documento.toUpperCase()}`,
      arquivo_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      data_emissao: formDoc.data_emissao || new Date().toISOString().split('T')[0],
      data_validade: formDoc.data_validade || '2026-01-01',
      status: 'pendente',
      uploaded_by: currentUser.id,
      uploaded_by_nome: currentUser.nome,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setDocumentos(prev => [newDoc, ...prev]);
    addAuditLog('Documentos', 'UPLOAD DE LAUDO/NR', `Anexou ${newDoc.nome_documento} para ${colab.nome}`);
    setModalUploadDoc({ open: false });
    showToast(`Documento enviado para análise da Engenharia de Segurança!`);
  };

  const handleAprovarDocumento = (doc: DocumentoColaborador, validade: string) => {
    setDocumentos(prev => prev.map(d => d.id === doc.id ? {
      ...d,
      status: 'aprovado',
      data_validade: validade || d.data_validade
    } : d));
    addAuditLog('Documentos', 'APROVAÇÃO DOCUMENTAL', `Validou ${doc.nome_documento} de ${doc.colaborador_nome}`);
    showToast(`Documento aprovado e em conformidade!`);
  };

  const handleRejeitarDocumento = (doc: DocumentoColaborador, motivo: string) => {
    setDocumentos(prev => prev.map(d => d.id === doc.id ? {
      ...d,
      status: 'reprovado',
      motivo_reprovacao: motivo
    } : d));
    addAuditLog('Documentos', 'REPROVAÇÃO DOCUMENTAL', `Reprovou ${doc.nome_documento}: ${motivo}`);
    showToast(`Documento reprovado.`);
  };

  const handleCreateVistoria = (e: React.FormEvent) => {
    e.preventDefault();
    const obra = obras.find(o => o.id === Number(formVistoria.obra_id));
    const newVist: Vistoria = {
      id: Date.now(),
      obra_id: Number(formVistoria.obra_id),
      obra_nome: obra?.nome || 'Obra',
      titulo: formVistoria.titulo,
      tipo: formVistoria.tipo,
      descricao: formVistoria.descricao,
      data_agendada: formVistoria.data_agendada || new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'pendente',
      created_by: currentUser.id,
      created_by_nome: currentUser.nome,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setVistorias(prev => [newVist, ...prev]);
    addAuditLog('Vistorias', 'AGENDAMENTO', `Agendou vistoria: ${newVist.titulo}`);
    setModalNovaVistoria(false);
    showToast(`Vistoria técnica agendada com sucesso!`);
  };

  const handleConcluirVistoria = (vistoria: Vistoria, dadosExecucao?: Partial<Vistoria>) => {
    setVistorias(prev => prev.map(v => v.id === vistoria.id ? {
      ...v,
      status: 'realizada',
      realizada_em: dadosExecucao?.realizada_em || new Date().toISOString().replace('T', ' ').substring(0, 19),
      itens_conformes: dadosExecucao?.itens_conformes ?? (v.itens_conformes || 15),
      total_itens: dadosExecucao?.total_itens ?? (v.total_itens || 15),
      observacoes: dadosExecucao?.observacoes || v.observacoes || 'Vistoria executada sem inconformidades críticas identificadas.',
      nao_conformidades: dadosExecucao?.nao_conformidades || v.nao_conformidades
    } : v));
    addAuditLog('Vistorias', 'CONCLUSÃO', `Concluiu vistoria #${vistoria.id}: ${vistoria.titulo}`);
    showToast(`Vistoria concluída com checklist aprovado!`);
  };

  const handleCreateUsuario = (e: React.FormEvent) => {
    e.preventDefault();
    const obra = obras.find(o => o.id === Number(formUsuario.obra_id));
    const newUser: Usuario = {
      id: Date.now(),
      nome: formUsuario.nome,
      email: formUsuario.email,
      tipo: formUsuario.tipo,
      obra_id: formUsuario.tipo === 'gestor' ? Number(formUsuario.obra_id) : null,
      obra_nome: formUsuario.tipo === 'gestor' ? obra?.nome : undefined,
      ativo: true,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setUsuarios(prev => [...prev, newUser]);
    addAuditLog('Usuários', 'CADASTRO DE USUÁRIO', `Criou conta ${newUser.email} com perfil ${newUser.tipo}`);
    setModalNovoUsuario(false);
    showToast(`Usuário "${newUser.nome}" criado com sucesso!`);
  };

  const handleDeleteUsuario = (id: number) => {
    setUsuarios(prev => prev.filter(u => u.id !== id));
    addAuditLog('Usuários', 'EXCLUSÃO', `Desativou conta de usuário ID #${id}`);
    showToast(`Usuário removido.`);
  };

  const handleSendEmailAlert = (obra: Obra, modo: 'automatico' | 'manual' = 'manual') => {
    const orcamentoTotalObra = obra.orcamento_total || 10000000;
    const orcamentoInsumos = Math.round(orcamentoTotalObra * 0.45);
    const progressRatio = (obra.progresso !== undefined ? obra.progresso : 50) / 100;
    let consumptionIntensity = 1.0;
    if (obra.id === 2 || (obra.nome || '').toLowerCase().includes('lago norte')) {
      consumptionIntensity = 1.15;
    } else if (obra.id === 3 || (obra.nome || '').toLowerCase().includes('infra')) {
      consumptionIntensity = 1.06;
    } else if (obra.id === 1) {
      consumptionIntensity = 1.13;
    }
    const consumoAcumuladoInsumos = Math.min(
      Math.round(orcamentoInsumos * 1.3),
      Math.round(orcamentoInsumos * progressRatio * consumptionIntensity)
    );
    const percentualConsumoInsumos = Math.round((consumoAcumuladoInsumos / orcamentoInsumos) * 100);
    const saldoInsumos = Math.max(0, orcamentoInsumos - consumoAcumuladoInsumos);

    const newLog = createBudgetAlertEmail(
      obra,
      {
        orcamentoInsumos,
        orcamentoTotalObra,
        consumoAcumuladoInsumos,
        percentualConsumoInsumos,
        saldoInsumos
      },
      usuarios,
      modo
    );

    setEmailLogs(prev => [newLog, ...prev]);

    // Create in-app system notifications for recipients
    newLog.destinatarios.forEach(dest => {
      const newNotif: Notificacao = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        usuario_id: dest.usuario_id,
        obra_id: obra.id,
        obra_nome: obra.nome,
        titulo: `⚠️ Alerta de Insumos (${percentualConsumoInsumos}%) - ${obra.nome}`,
        mensagem: `Notificação de contingenciamento orçamentário enviada para ${dest.email}. Protocolo: ${newLog.protocolo_entrega}`,
        tipo: 'estoque',
        lida: false,
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      setNotificacoes(prev => [newNotif, ...prev]);
    });

    addAuditLog(
      'Notificações / E-mail',
      'DISPARO_ALERTA_90',
      `Alerta de 90% disparado para ${newLog.destinatarios.map(d => d.email).join(', ')} (${obra.nome}) - Protocolo: ${newLog.protocolo_entrega}`
    );

    showToast(`E-mail de alerta disparado com sucesso para ${newLog.destinatarios.length} gestores!`);
  };

  const handleExportExcel = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      ["ID,Nome da Obra,Endereco,Status,Orcamento Total,Inicio,Previsao"]
      .concat(obras.map(o => `${o.id},"${o.nome}","${o.endereco}",${o.status},${o.orcamento_total},${o.data_inicio},${o.data_previsao_termino}`))
      .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_obras_brasal_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Relatório de Obras exportado em CSV/Excel!");
  };

  const handleExportAlmoxPDF = () => {
    window.print();
  };

  return (
    <div className="h-screen bg-slate-100 flex flex-col text-slate-800 font-sans antialiased selection:bg-red-800 selection:text-white overflow-hidden">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fade-in text-xs font-semibold">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <Navbar
        currentMode={currentMode}
        setCurrentMode={setCurrentMode}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        usuariosList={usuarios}
        obrasList={obras}
        selectedObraId={selectedObraId}
        setSelectedObraId={setSelectedObraId}
        notificacoes={notificacoes}
        onMarkNotificacaoLida={handleMarkNotificacaoLida}
      />

      {/* Main Body */}
      {currentMode === 'erp' ? (
        <div className="flex flex-1 overflow-hidden min-h-0">
          
          {/* Left Sidebar */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentUser={currentUser}
            stats={{
              documentosPendentes: docsPendentesCount,
              solicitacoesPendentes: solicitacoesPendentesCount,
              itensAtrasados: itensAtrasadosCount,
              vistoriasPendentes: vistoriasPendentesCount
            }}
          />

          {/* ERP View Content */}
          <main className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-4 lg:p-5">
            <div className="max-w-[1600px] mx-auto">
              
              {activeTab === 'dashboard' && (
                <DashboardView
                  obras={obras}
                  colaboradores={colaboradores}
                  itensAlmoxarifado={itensAlmoxarifado}
                  materiais={materiais}
                  documentos={documentos}
                  vistorias={vistorias}
                  movimentacoesAlmox={movimentacoesAlmox}
                  movimentacoesMat={movimentacoesMat}
                  onNavigate={(tab) => setActiveTab(tab)}
                  onOpenNovaObra={() => setModalNovaObra(true)}
                  onOpenNovoEmprestimo={() => setModalSaida({ open: true })}
                  onOpenNovaSolicitacao={() => setModalSolicitar(true)}
                  onOpenNovaVistoria={() => setModalNovaVistoria(true)}
                  onConcluirVistoria={handleConcluirVistoria}
                  onOpenEmailModal={(obra) => setModalEmailNotification({ open: true, obra: obra || null })}
                  onSendNotification={handleSendNotification}
                  onQuickReplenish={handleQuickReplenish}
                  onUploadEpiDoc={(newDoc) => {
                    const docToAdd: DocumentoColaborador = {
                      id: Date.now(),
                      colaborador_id: newDoc.colaborador_id || 1,
                      colaborador_nome: newDoc.colaborador_nome || '',
                      colaborador_matricula: newDoc.colaborador_matricula || '',
                      obra_nome: newDoc.obra_nome || '',
                      tipo_documento: 'epi',
                      nome_documento: newDoc.nome_documento || 'Ficha de Entrega de EPI (NR-06)',
                      arquivo_url: newDoc.arquivo_url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                      data_emissao: newDoc.data_emissao || new Date().toISOString().split('T')[0],
                      data_validade: newDoc.data_validade || '',
                      status: 'aprovado',
                      observacao: newDoc.observacao || 'Ficha de EPI cadastrada via alerta da Dashboard.',
                      uploaded_by: currentUser.id,
                      uploaded_by_nome: currentUser.nome,
                      created_at: new Date().toISOString()
                    };
                    setDocumentos(prev => [docToAdd, ...prev]);
                    handleSendNotification({
                      titulo: `Ficha de EPI Registrada: ${docToAdd.colaborador_nome}`,
                      mensagem: `Comprovante de entrega de EPI regularizado com sucesso para o canteiro ${docToAdd.obra_nome}.`
                    });
                  }}
                  incidentes={incidentes}
                  onAddIncidente={(novoInc) => {
                    setIncidentes(prev => [novoInc, ...prev]);
                    addAuditLog('Segurança SST', 'NOVO INCIDENTE', `Registrou incidente/quase-acidente: ${novoInc.titulo} (${novoInc.obra_nome})`);
                  }}
                  contratos={contratos}
                  onUpdateContrato={(updated) => {
                    setContratos(prev => prev.map(c => c.id === updated.id ? updated : c));
                    addAuditLog('Subempreiteiras', 'ATUALIZAÇÃO CONTRATO', `Atualizou contrato ${updated.codigo_contrato} - ${updated.empresa_nome_fantasia}`);
                  }}
                  onRenovarDocumento={(docId, dadosRenovacao) => {
                    setDocumentos(prev => prev.map(d => {
                      if (d.id === docId) {
                        return {
                          ...d,
                          data_emissao: dadosRenovacao.data_emissao,
                          data_validade: dadosRenovacao.data_validade,
                          status: dadosRenovacao.status || 'aprovado',
                          observacao: dadosRenovacao.observacao || d.observacao,
                          arquivo_url: dadosRenovacao.arquivo_url || d.arquivo_url
                        };
                      }
                      return d;
                    }));
                    const doc = documentos.find(d => d.id === docId);
                    if (doc) {
                      addAuditLog('Segurança SST', 'RENOVAÇÃO DOCUMENTAL', `Renovou documento ${doc.nome_documento} (${doc.colaborador_nome}) até ${dadosRenovacao.data_validade}`);
                      showToast(`Documento de ${doc.colaborador_nome} renovado até ${dadosRenovacao.data_validade}!`);
                    }
                  }}
                  emailLogs={emailLogs}
                />
              )}

              {activeTab === 'obras' && (
                <ObrasView
                  obras={obras}
                  currentUser={currentUser}
                  onOpenNovaObra={() => setModalNovaObra(true)}
                  onOpenEditarObra={(o) => {
                    setFormObra({
                      nome: o.nome,
                      endereco: o.endereco,
                      data_inicio: o.data_inicio,
                      data_previsao_termino: o.data_previsao_termino,
                      orcamento_total: o.orcamento_total,
                      observacoes: o.observacoes || ''
                    });
                    setModalNovaObra(true);
                  }}
                  onDeleteObra={(id) => {
                    setObras(prev => prev.filter(o => o.id !== id));
                    addAuditLog('Obras', 'EXCLUSÃO', `Excluiu obra ID #${id}`);
                    showToast('Obra excluída.');
                  }}
                  onNavigateToAlmoxarifado={(obraId) => {
                    setSelectedObraId(obraId);
                    setActiveTab('almoxarifado');
                  }}
                  onNavigateToMateriais={(obraId) => {
                    setSelectedObraId(obraId);
                    setActiveTab('materiais');
                  }}
                  onExportExcel={handleExportExcel}
                />
              )}

              {activeTab === 'almoxarifado' && (
                <AlmoxarifadoView
                  itens={itensAlmoxarifado}
                  movimentacoes={movimentacoesAlmox}
                  obras={obras}
                  selectedObraId={selectedObraId}
                  currentUser={currentUser}
                  onOpenNovoItem={() => setModalNovoItem(true)}
                  onOpenSaida={(itemId) => setModalSaida({ open: true, itemId })}
                  onOpenDevolucao={(itemId) => handleDevolucao(itemId)}
                  onOpenManutencao={(itemId) => handleManutencao(itemId)}
                  onExportPDF={handleExportAlmoxPDF}
                />
              )}

              {activeTab === 'materiais' && (
                <MateriaisView
                  materiais={materiais}
                  solicitacoes={solicitacoes}
                  movimentacoes={movimentacoesMat}
                  categorias={categorias}
                  obras={obras}
                  selectedObraId={selectedObraId}
                  currentUser={currentUser}
                  onOpenNovoMaterial={() => setModalNovoMaterial(true)}
                  onOpenMovimentacao={(materialId) => setModalMovimentacaoMat({ open: true, materialId })}
                  onOpenSolicitar={() => setModalSolicitar(true)}
                  onAprovarSolicitacao={handleAprovarSolicitacao}
                  onRejeitarSolicitacao={handleRejeitarSolicitacao}
                  onEntregarSolicitacao={handleEntregarSolicitacao}
                />
              )}

              {activeTab === 'equipe' && (
                <EquipeView
                  colaboradores={colaboradores}
                  documentos={documentos}
                  obras={obras}
                  selectedObraId={selectedObraId}
                  currentUser={currentUser}
                  onOpenNovoColaborador={() => setModalNovoColaborador(true)}
                  onOpenUploadDocumento={(colabId) => setModalUploadDoc({ open: true, colaboradorId: colabId })}
                />
              )}

              {activeTab === 'documentos' && (
                <DocumentosView
                  documentos={documentos}
                  currentUser={currentUser}
                  onAprovarDocumento={handleAprovarDocumento}
                  onRejeitarDocumento={handleRejeitarDocumento}
                />
              )}

              {activeTab === 'vistorias' && (
                <VistoriasView
                  vistorias={vistorias}
                  obras={obras}
                  selectedObraId={selectedObraId}
                  currentUser={currentUser}
                  onOpenNovaVistoria={() => setModalNovaVistoria(true)}
                  onConcluirVistoria={handleConcluirVistoria}
                />
              )}

              {activeTab === 'usuarios' && (
                <UsuariosView
                  usuarios={usuarios}
                  obras={obras}
                  currentUser={currentUser}
                  onOpenNovoUsuario={() => setModalNovoUsuario(true)}
                  onDeleteUsuario={handleDeleteUsuario}
                />
              )}

              {activeTab === 'auditoria' && (
                <AuditoriaView logs={auditLogs} />
              )}

            </div>
          </main>

        </div>
      ) : currentMode === 'docs' ? (
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <DocsView />
        </main>
      ) : (
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <ApiView
            obras={obras}
            itensAlmoxarifado={itensAlmoxarifado}
            materiais={materiais}
            colaboradores={colaboradores}
          />
        </main>
      )}

      {/* Modal Nova Obra */}
      {modalNovaObra && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-red-700" />
                <h2 className="font-bold text-sm text-slate-900">Cadastrar Nova Obra</h2>
              </div>
              <button onClick={() => setModalNovaObra(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateObra} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome do Empreendimento</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Residencial Brasal Jardins"
                  value={formObra.nome}
                  onChange={(e) => setFormObra({ ...formObra, nome: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-700"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Endereço Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: SQNW 106, Bloco C, Setor Noroeste"
                  value={formObra.endereco}
                  onChange={(e) => setFormObra({ ...formObra, endereco: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Data Início</label>
                  <input
                    type="date"
                    required
                    value={formObra.data_inicio}
                    onChange={(e) => setFormObra({ ...formObra, data_inicio: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Previsão Término</label>
                  <input
                    type="date"
                    required
                    value={formObra.data_previsao_termino}
                    onChange={(e) => setFormObra({ ...formObra, data_previsao_termino: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Orçamento Global Previsto (R$)</label>
                <input
                  type="number"
                  required
                  value={formObra.orcamento_total}
                  onChange={(e) => setFormObra({ ...formObra, orcamento_total: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNovaObra(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-xl font-bold shadow-md"
                >
                  Salvar Obra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Item Almoxarifado */}
      {modalNovoItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-red-700" />
                <h2 className="font-bold text-sm text-slate-900">Novo Item de Almoxarifado</h2>
              </div>
              <button onClick={() => setModalNovoItem(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateItem} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Canteiro de Destino</label>
                <select
                  value={formItem.obra_id}
                  onChange={(e) => setFormItem({ ...formItem, obra_id: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  {obras.map(o => (
                    <option key={o.id} value={o.id}>{o.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome do Equipamento / Ferramenta</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nível a Laser Giratório 360°"
                  value={formItem.nome}
                  onChange={(e) => setFormItem({ ...formItem, nome: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Número de Série / Patrimônio</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: PAT-2024-099"
                    value={formItem.numero_serie}
                    onChange={(e) => setFormItem({ ...formItem, numero_serie: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Categoria</label>
                  <select
                    value={formItem.categoria}
                    onChange={(e) => setFormItem({ ...formItem, categoria: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="Equipamentos">Equipamentos</option>
                    <option value="Ferramentas">Ferramentas</option>
                    <option value="EPI">EPI</option>
                    <option value="Medição">Medição</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Valor de Aquisição (R$)</label>
                  <input
                    type="number"
                    required
                    value={formItem.valor_aquisicao}
                    onChange={(e) => setFormItem({ ...formItem, valor_aquisicao: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Localização Física</label>
                  <input
                    type="text"
                    placeholder="Ex: Armário A - Prateleira 2"
                    value={formItem.localizacao}
                    onChange={(e) => setFormItem({ ...formItem, localizacao: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNovoItem(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-xl font-bold shadow-md"
                >
                  Cadastrar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Saída / Empréstimo */}
      {modalSaida.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-amber-600" />
                <h2 className="font-bold text-sm text-slate-900">Registrar Saída / Empréstimo Nominal</h2>
              </div>
              <button onClick={() => setModalSaida({ open: false })} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRealizarSaida} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Item a ser Retirado</label>
                <select
                  value={modalSaida.itemId || formSaida.item_id}
                  onChange={(e) => setFormSaida({ ...formSaida, item_id: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                >
                  {itensAlmoxarifado.filter(i => i.status === 'estoque').map(item => (
                    <option key={item.id} value={item.id}>
                      {item.nome} ({item.numero_serie}) - {item.obra_nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Colaborador Responsável pela Retirada</label>
                <select
                  value={formSaida.colaborador_id}
                  onChange={(e) => setFormSaida({ ...formSaida, colaborador_id: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  {colaboradores.filter(c => c.status === 'ativo').map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.matricula} - {c.cargo})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Data Prevista para Devolução</label>
                <input
                  type="date"
                  required
                  value={formSaida.data_previsao_devolucao}
                  onChange={(e) => setFormSaida({ ...formSaida, data_previsao_devolucao: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Observações / Frente de Serviço</label>
                <input
                  type="text"
                  placeholder="Ex: Concretagem das vigas do 3º pavimento"
                  value={formSaida.observacao}
                  onChange={(e) => setFormSaida({ ...formSaida, observacao: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalSaida({ open: false })}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-md"
                >
                  Confirmar Empréstimo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Solicitar Material */}
      {modalSolicitar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-red-700" />
                <h2 className="font-bold text-sm text-slate-900">Solicitação de Compra de Material</h2>
              </div>
              <button onClick={() => setModalSolicitar(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSolicitacao} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Canteiro de Destino</label>
                <select
                  value={formSolicitacao.obra_id}
                  onChange={(e) => setFormSolicitacao({ ...formSolicitacao, obra_id: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  {obras.map(o => (
                    <option key={o.id} value={o.id}>{o.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Material do Catálogo</label>
                <select
                  value={formSolicitacao.material_id}
                  onChange={(e) => {
                    const mat = materiais.find(m => m.id === Number(e.target.value));
                    setFormSolicitacao({
                      ...formSolicitacao,
                      material_id: Number(e.target.value),
                      unidade_medida: mat?.unidade_medida || 'unidade'
                    });
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                >
                  {materiais.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nome} (Atual: {m.quantidade_atual} {m.unidade_medida})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quantidade Necessária</label>
                  <input
                    type="number"
                    required
                    value={formSolicitacao.quantidade_solicitada}
                    onChange={(e) => setFormSolicitacao({ ...formSolicitacao, quantidade_solicitada: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unidade de Medida</label>
                  <input
                    type="text"
                    disabled
                    value={formSolicitacao.unidade_medida}
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Especificações Técnicas / Justificativa</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Cimento CP II para concretagem da rampa de acesso e laje de transição."
                  value={formSolicitacao.especificacoes}
                  onChange={(e) => setFormSolicitacao({ ...formSolicitacao, especificacoes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalSolicitar(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-xl font-bold shadow-md"
                >
                  Enviar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Colaborador */}
      {modalNovoColaborador && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-red-700" />
                <h2 className="font-bold text-sm text-slate-900">Cadastrar Colaborador de Canteiro</h2>
              </div>
              <button onClick={() => setModalNovoColaborador(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateColaborador} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo de Oliveira"
                  value={formColaborador.nome}
                  onChange={(e) => setFormColaborador({ ...formColaborador, nome: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Matrícula</label>
                  <input
                    type="text"
                    required
                    value={formColaborador.matricula}
                    onChange={(e) => setFormColaborador({ ...formColaborador, matricula: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">CPF</label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={formColaborador.cpf}
                    onChange={(e) => setFormColaborador({ ...formColaborador, cpf: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cargo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Armador Chefe"
                    value={formColaborador.cargo}
                    onChange={(e) => setFormColaborador({ ...formColaborador, cargo: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vínculo</label>
                  <select
                    value={formColaborador.tipo}
                    onChange={(e) => setFormColaborador({ ...formColaborador, tipo: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold"
                  >
                    <option value="proprio">Próprio (CLT Brasal)</option>
                    <option value="terceiro">Terceirizado (Subempreiteira)</option>
                  </select>
                </div>
              </div>
              {formColaborador.tipo === 'terceiro' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Razão Social da Empresa Terceirizada</label>
                  <input
                    type="text"
                    placeholder="Ex: Estruturas & Formas DF LTDA"
                    value={formColaborador.empresa_terceiro}
                    onChange={(e) => setFormColaborador({ ...formColaborador, empresa_terceiro: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              )}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Obra de Lotação</label>
                <select
                  value={formColaborador.obra_id}
                  onChange={(e) => setFormColaborador({ ...formColaborador, obra_id: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  {obras.map(o => (
                    <option key={o.id} value={o.id}>{o.nome}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNovoColaborador(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-xl font-bold shadow-md"
                >
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Upload Documento SST */}
      {modalUploadDoc.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-red-700" />
                <h2 className="font-bold text-sm text-slate-900">Upload de Documento SST & Normas</h2>
              </div>
              <button onClick={() => setModalUploadDoc({ open: false })} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUploadDocumento} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Colaborador</label>
                <select
                  value={modalUploadDoc.colaboradorId || formDoc.colaborador_id}
                  onChange={(e) => setFormDoc({ ...formDoc, colaborador_id: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                >
                  {colaboradores.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.matricula} - {c.cargo})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tipo de Documento / Norma Regulamentadora</label>
                <select
                  value={formDoc.tipo_documento}
                  onChange={(e) => setFormDoc({ ...formDoc, tipo_documento: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold"
                >
                  <option value="nr35">NR-35 (Trabalho em Altura)</option>
                  <option value="nr10">NR-10 (Segurança em Instalações Elétricas)</option>
                  <option value="nr12">NR-12 (Segurança em Máquinas e Equipamentos)</option>
                  <option value="nr18">NR-18 (Condições de Segurança na Indústria da Construção)</option>
                  <option value="aso">ASO (Atestado de Saúde Ocupacional)</option>
                  <option value="epi">Ficha de Entrega de EPI</option>
                  <option value="carteira_trabalho">CTPS / Contrato de Trabalho</option>
                  <option value="outro">Outro Laudo / Certificado</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Data de Emissão</label>
                  <input
                    type="date"
                    required
                    value={formDoc.data_emissao}
                    onChange={(e) => setFormDoc({ ...formDoc, data_emissao: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Data de Validade Legal</label>
                  <input
                    type="date"
                    required
                    value={formDoc.data_validade}
                    onChange={(e) => setFormDoc({ ...formDoc, data_validade: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>
              <div className="border-2 border-dashed border-slate-200 p-4 rounded-xl text-center bg-slate-50">
                <HardHat className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                <span className="font-bold text-slate-700">Arquivo PDF ou Laudo Digital</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Clique ou arraste o certificado digitalizado (máx. 15MB)</p>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalUploadDoc({ open: false })}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-xl font-bold shadow-md"
                >
                  Salvar e Enviar para Aprovação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Vistoria */}
      {modalNovaVistoria && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-red-700" />
                <h2 className="font-bold text-sm text-slate-900">Agendar Vistoria Técnica / Auditoria</h2>
              </div>
              <button onClick={() => setModalNovaVistoria(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateVistoria} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Canteiro de Obras</label>
                <select
                  value={formVistoria.obra_id}
                  onChange={(e) => setFormVistoria({ ...formVistoria, obra_id: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  {obras.map(o => (
                    <option key={o.id} value={o.id}>{o.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Título da Inspeção</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Auditoria de Linhas de Vida e Guarda-corpos"
                  value={formVistoria.titulo}
                  onChange={(e) => setFormVistoria({ ...formVistoria, titulo: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tipo de Vistoria</label>
                  <select
                    value={formVistoria.tipo}
                    onChange={(e) => setFormVistoria({ ...formVistoria, tipo: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="Estrutural & Alvenaria">Estrutural & Alvenaria</option>
                    <option value="Segurança SST (NR-18)">Segurança SST (NR-18)</option>
                    <option value="Instalações Elétricas">Instalações Elétricas</option>
                    <option value="Instalações Hidrossanitárias">Instalações Hidrossanitárias</option>
                    <option value="Qualidade & Acabamento">Qualidade & Acabamento</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Data e Hora Agendada</label>
                  <input
                    type="datetime-local"
                    required
                    value={formVistoria.data_agendada}
                    onChange={(e) => setFormVistoria({ ...formVistoria, data_agendada: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Instruções / Escopo do Checklist</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Inspeção de prumo de pilares, ferragens negativas e recobrimento de concreto."
                  value={formVistoria.descricao}
                  onChange={(e) => setFormVistoria({ ...formVistoria, descricao: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNovaVistoria(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-xl font-bold shadow-md"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Usuário */}
      {modalNovoUsuario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-700" />
                <h2 className="font-bold text-sm text-slate-900">Novo Usuário do Sistema (RBAC)</h2>
              </div>
              <button onClick={() => setModalNovoUsuario(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUsuario} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Engenheiro Mateus Rocha"
                  value={formUsuario.nome}
                  onChange={(e) => setFormUsuario({ ...formUsuario, nome: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-700"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">E-mail Corporativo</label>
                <input
                  type="email"
                  required
                  placeholder="mateus@brasal.com.br"
                  value={formUsuario.email}
                  onChange={(e) => setFormUsuario({ ...formUsuario, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Perfil / Papel de Acesso</label>
                  <select
                    value={formUsuario.tipo}
                    onChange={(e) => setFormUsuario({ ...formUsuario, tipo: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold"
                  >
                    <option value="gestor">Gestor de Obra (Residente)</option>
                    <option value="admin">Administrador (Acesso Total)</option>
                  </select>
                </div>
                {formUsuario.tipo === 'gestor' && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Obra Atribuída</label>
                    <select
                      value={formUsuario.obra_id}
                      onChange={(e) => setFormUsuario({ ...formUsuario, obra_id: Number(e.target.value) })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    >
                      {obras.map(o => (
                        <option key={o.id} value={o.id}>{o.nome}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNovoUsuario(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-xl font-bold shadow-md"
                >
                  Criar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Notificação por E-mail (Gatilho 90% Insumos) */}
      <EmailNotificationModal
        isOpen={modalEmailNotification.open}
        onClose={() => setModalEmailNotification({ open: false, obra: null })}
        obras={obras}
        usuarios={usuarios}
        initialSelectedObraId={modalEmailNotification.obra?.id}
        emailLogs={emailLogs}
        onSendEmail={handleSendEmailAlert}
      />

    </div>
  );
}
