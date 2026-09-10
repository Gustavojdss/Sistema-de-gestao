import React, { useState } from 'react';
import { 
  BookOpen, 
  Database, 
  Server, 
  ShieldCheck, 
  Layers, 
  Terminal, 
  Code2, 
  Copy, 
  Check, 
  FileText, 
  HardHat, 
  Cpu, 
  GitBranch, 
  Boxes, 
  Workflow, 
  Lock, 
  CheckCircle2, 
  AlertTriangle,
  Monitor,
  Download,
  HelpCircle,
  CheckSquare,
  Play,
  Calculator,
  ListOrdered,
  FileCode,
  Layout,
  ExternalLink,
  ChevronRight,
  Shield,
  Clock,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { calcularCurvaABC, verificarEstoqueCritico, calcularValorTotalEstoque, MaterialCurvaABC } from '../services/estoqueService';
import { MaterialConsumo } from '../types/erp';

export type DocsSectionId = 
  | 'visao' 
  | 'arquitetura' 
  | 'dados' 
  | 'modulos' 
  | 'telas' 
  | 'regras' 
  | 'seguranca' 
  | 'evolucao' 
  | 'servicos' 
  | 'perguntas' 
  | 'passos';

export const DocsView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<DocsSectionId>('visao');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Demo state for Section 9 (Estoque Service Simulator)
  const [sampleMaterials, setSampleMaterials] = useState<MaterialConsumo[]>([
    { id: 1, obra_id: 1, codigo: 'CEM001', nome: 'Cimento Portland CP II-32 (Sacos 50kg)', unidade_medida: 'saco', quantidade_atual: 120, quantidade_minima: 80, valor_unitario: 34.50, valor_total: 4140, status: 'ativo' },
    { id: 2, obra_id: 1, codigo: 'ACO010', nome: 'Aço CA-50 Barra 10.0mm 3/8"', unidade_medida: 'barra', quantidade_atual: 250, quantidade_minima: 100, valor_unitario: 58.90, valor_total: 14725, status: 'ativo' },
    { id: 3, obra_id: 1, codigo: 'ARE001', nome: 'Areia Média Lavada', unidade_medida: 'm³', quantidade_atual: 45, quantidade_minima: 30, valor_unitario: 95.00, valor_total: 4275, status: 'ativo' },
    { id: 4, obra_id: 1, codigo: 'BRI001', nome: 'Brita 1 Granítica', unidade_medida: 'm³', quantidade_atual: 38, quantidade_minima: 25, valor_unitario: 88.00, valor_total: 3344, status: 'ativo' },
    { id: 5, obra_id: 1, codigo: 'PRE017', nome: 'Prego com Cabeça 17x27', unidade_medida: 'kg', quantidade_atual: 60, quantidade_minima: 50, valor_unitario: 14.20, valor_total: 852, status: 'ativo' },
    { id: 6, obra_id: 1, codigo: 'ARA018', nome: 'Arame Recozido Nº 18', unidade_medida: 'kg', quantidade_atual: 75, quantidade_minima: 40, valor_unitario: 18.50, valor_total: 1387.50, status: 'ativo' },
    { id: 7, obra_id: 1, codigo: 'TAB030', nome: 'Tábua de Pinus 30cm 3m', unidade_medida: 'peça', quantidade_atual: 110, quantidade_minima: 60, valor_unitario: 22.00, valor_total: 2420, status: 'ativo' },
    { id: 8, obra_id: 1, codigo: 'CON025', nome: 'Concreto Usinado FCK 30 MPa', unidade_medida: 'm³', quantidade_atual: 30, quantidade_minima: 10, valor_unitario: 420.00, valor_total: 12600, status: 'ativo' }
  ]);

  // Section 10 Questions check state
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
    7: true
  });

  const toggleQuestion = (id: number) => {
    setAnsweredQuestions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const calculatedABC = calcularCurvaABC(sampleMaterials);
  const totalEstoqueValor = calcularValorTotalEstoque(sampleMaterials);

  // Download entire technical specification as Markdown
  const handleDownloadMarkdown = () => {
    const markdownContent = `# ESPECIFICAÇÃO TÉCNICA - SISTEMA BRASAL ENGENHARIA (VERSÃO REACT + TYPESCRIPT)

## 1. VISÃO GERAL DO SISTEMA
Sistema ERP completo para gestão de obras da construção civil, desenvolvido sob medida para controle de canteiros, almoxarifado de ativos com QR Code, materiais com Curva ABC, equipe e conformidade SST (NRs, ASO), vistorias e auditoria LGPD.

## 2. ARQUITETURA DO SISTEMA
- Framework Frontend: React 19 + TypeScript + Vite 6
- Estilização: Tailwind CSS 4 (@tailwindcss/vite)
- UI & Ícones: Lucide React + Motion
- Estado: React State + Memory Storage
- Backend Target: Node.js 20 LTS + Express 4 + MySQL 8 (Pool mysql2)

## 3. MODELAGEM DE DADOS
Contém schemas tipados para Usuarios, Obras, Almoxarifado, Movimentações, Materiais, Solicitações, Colaboradores, Documentos SST, Vistorias e Logs de Auditoria.

## 4. REGRAS DE NEGÓCIO
- RN-ALM-001 a 006: Gestão de patrimônio, QR Code, empréstimo nominal e manutenção.
- RN-MAT-001 a 006: Ponto de pedido, saídas bloqueadas e Curva ABC 80/15/5.
- RN-DOC-001 a 004: Validação de NRs e ASO por administradores e bloqueio por vencimento.
- RN-VIS-001 a 003: Vistorias técnicas com checklist de conformidade.

## 5. PLANO DE EVOLUÇÃO
- Fase 1: API REST Express + MySQL (2 semanas)
- Fase 2: Módulos Financeiros & Boletos (2 semanas)
- Fase 3: Integrações SEFAZ & AWS S3 (2 semanas)
- Fase 4: PWA Mobile Offline-First (1 semana)

Gerado pelo ERP Brasal Engenharia em ${new Date().toLocaleDateString('pt-BR')}.`;

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `especificacao_tecnica_brasal_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const navItems = [
    { id: 'visao', label: '1. Visão Geral', icon: Layers },
    { id: 'arquitetura', label: '2. Arquitetura & Stack', icon: Server },
    { id: 'dados', label: '3. Modelagem de Dados', icon: Database },
    { id: 'modulos', label: '4. Módulos Funcionais', icon: Boxes },
    { id: 'telas', label: '5. Telas & Wireframes', icon: Layout },
    { id: 'regras', label: '6. Regras de Negócio', icon: ShieldCheck },
    { id: 'seguranca', label: '7. Segurança & RBAC', icon: Lock },
    { id: 'evolucao', label: '8. Plano de Evolução', icon: GitBranch },
    { id: 'servicos', label: '9. Serviço Curva ABC', icon: FileCode },
    { id: 'perguntas', label: '10. Perguntas Dev', icon: HelpCircle },
    { id: 'passos', label: '11. Próximos Passos', icon: CheckSquare },
  ] as const;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-700 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/60 border border-red-700/50 text-red-300 text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Especificação Técnica Completa · Sistema Brasal Engenharia</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Documentação Técnica & Arquitetura de Software ERP
          </h1>
          <p className="text-slate-300 text-xs mt-1 max-w-3xl leading-relaxed">
            Especificação formal da versão React + TypeScript + Tailwind CSS: arquitetura de componentes, modelagem relacional, 11 módulos funcionais, regras de negócio e plano de evolução para backend Node.js + MySQL.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadMarkdown}
            className="px-3.5 py-2 bg-red-800 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-950/30 flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar .MD</span>
          </button>
          <span className="px-3 py-2 bg-slate-800/90 rounded-xl border border-slate-700 text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>v2.5.0 APROVADA</span>
          </span>
        </div>
      </div>

      {/* Navigation Menu Grid */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left truncate cursor-pointer ${
                  isActive
                    ? 'bg-red-800 text-white shadow-md shadow-red-950/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: VISÃO GERAL DO SISTEMA */}
      {activeSection === 'visao' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-red-700" />
                <span>1. Visão Geral do Sistema Brasal Engenharia</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-400">SEÇÃO 1/11</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              O <strong>Sistema Brasal Engenharia</strong> é um ERP corporativo concebido especificamente para as particularidades e desafios diários de canteiros de obras da construção civil pesada e residencial. A solução combina agilidade de uso no canteiro (com leitura de QR Code em ferramentas, acompanhamento de avanço físico de fases e apontamento de materiais) com controles rigorosos de governança corporativa, compliance de SST (Normas Regulamentadoras NR-10, NR-12, NR-18, NR-35 e ASO) e rastreabilidade patrimonial.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 text-xs mb-1 flex items-center gap-1.5">
                  <HardHat className="w-4 h-4 text-red-700" />
                  <span>Canteiro & Obras</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Gestão multi-obra com centros de custo segregados, acompanhamento de fases (Fundação, Estrutura, Acabamento) e visualização integrada em Gráfico de Gantt.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 text-xs mb-1 flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-amber-600" />
                  <span>Almoxarifado & QR Code</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Identificação patrimonial com QR Code digital, histórico de transferências, empréstimo nominal com prazos e encaminhamento de itens para manutenção.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 text-xs mb-1 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Insumos & Curva ABC</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Controle contínuo de saldo de estoque, ponto de pedido crítico (estoque mínimo), esteira de aprovação de compras e classificação financeira por Curva ABC.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 text-xs mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>SST & Auditoria LGPD</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Dossiê completo de colaboradores (próprios e terceiros), validação formal de laudos por técnicos de segurança e trilha imutável de auditoria com IP.
                </p>
              </div>
            </div>
          </div>

          {/* Matriz de Perfis */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Perfis de Acesso & Matriz de Responsabilidades (RBAC)</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="p-2.5">Perfil</th>
                    <th className="p-2.5">Escopo</th>
                    <th className="p-2.5">Principais Atribuições</th>
                    <th className="p-2.5">Restrições Críticas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="odd:bg-white even:bg-slate-50/70">
                    <td className="p-2.5 font-bold text-red-900">Administrador (Diretoria / TI)</td>
                    <td className="p-2.5">Global (Todas as Obras)</td>
                    <td className="p-2.5 text-slate-700">Aprovar solicitações de compra, validar/reprovar documentos SST, cadastrar obras e gerenciar contas de usuários e trilhas de auditoria.</td>
                    <td className="p-2.5 text-slate-500 font-mono">Sem restrições no sistema.</td>
                  </tr>
                  <tr className="odd:bg-white even:bg-slate-50/70">
                    <td className="p-2.5 font-bold text-blue-900">Gestor (Engenheiro Residente)</td>
                    <td className="p-2.5">Obra Atribuída</td>
                    <td className="p-2.5 text-slate-700">Acompanhar avanço de cronograma, solicitar materiais, emprestar/devolver ferramentas, agendar vistorias técnicas e cadastrar operários.</td>
                    <td className="p-2.5 text-amber-700 font-medium">Não pode validar documentos SST da própria equipe nem alterar dados de outras obras.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: ARQUITETURA DO SISTEMA */}
      {activeSection === 'arquitetura' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Server className="w-5 h-5 text-red-700" />
                <span>2. Arquitetura do Sistema & Stack Tecnológica Atual</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-400">SEÇÃO 2/11</span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="p-2.5 w-1/3">Camada</th>
                    <th className="p-2.5 w-2/3">Tecnologia & Biblioteca Adotada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="odd:bg-white even:bg-slate-50/70">
                    <td className="p-2.5 font-bold text-slate-900">Framework Frontend</td>
                    <td className="p-2.5 font-mono text-blue-800">React 19 com TypeScript (Strict Mode)</td>
                  </tr>
                  <tr className="odd:bg-white even:bg-slate-50/70">
                    <td className="p-2.5 font-bold text-slate-900">Build Tool & Bundler</td>
                    <td className="p-2.5 font-mono text-slate-700">Vite 6 com suporte a HMR e otimização ESM</td>
                  </tr>
                  <tr className="odd:bg-white even:bg-slate-50/70">
                    <td className="p-2.5 font-bold text-slate-900">Estilização & Design System</td>
                    <td className="p-2.5 font-mono text-emerald-800">Tailwind CSS 4 (@tailwindcss/vite)</td>
                  </tr>
                  <tr className="odd:bg-white even:bg-slate-50/70">
                    <td className="p-2.5 font-bold text-slate-900">Iconografia & Animações</td>
                    <td className="p-2.5 font-mono text-slate-700">Lucide React + Motion (micro-interações)</td>
                  </tr>
                  <tr className="odd:bg-white even:bg-slate-50/70">
                    <td className="p-2.5 font-bold text-slate-900">Geração de QR Code</td>
                    <td className="p-2.5 font-mono text-slate-700">QRCode (renderização SVG/Canvas client-side)</td>
                  </tr>
                  <tr className="odd:bg-white even:bg-slate-50/70">
                    <td className="p-2.5 font-bold text-slate-900">Geração de Relatórios</td>
                    <td className="p-2.5 font-mono text-slate-700">ExcelJS (exportação tabular) + PDFKit / Browser Print</td>
                  </tr>
                  <tr className="odd:bg-white even:bg-slate-50/70">
                    <td className="p-2.5 font-bold text-slate-900">Gerenciamento de Estado</td>
                    <td className="p-2.5 font-mono text-slate-700">React Hooks (useState, useMemo) + Reatividade local</td>
                  </tr>
                  <tr className="odd:bg-white even:bg-slate-50/70">
                    <td className="p-2.5 font-bold text-slate-900">Fonte de Dados Atual</td>
                    <td className="p-2.5 font-mono text-slate-700">Dados mockados em memória (/src/data/initialData.ts)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tree Structure */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-slate-700" />
                  <span>2.2 Estrutura Canônica de Diretórios do Projeto</span>
                </span>
                <button
                  onClick={() => copyToClipboard(`brasal_sistema_react/
├── src/
│   ├── components/
│   │   ├── AlmoxarifadoView.tsx      # Gestão de equipamentos/ferramentas
│   │   ├── ApiView.tsx               # API Explorer e SQL Studio
│   │   ├── AuditoriaView.tsx         # Trilha de auditoria (LGPD)
│   │   ├── DashboardView.tsx         # Cockpit com KPIs e gráficos
│   │   ├── DocsView.tsx              # Documentação técnica do sistema
│   │   ├── DocumentosView.tsx        # Validação de documentos SST
│   │   ├── EquipeView.tsx            # Gestão de colaboradores
│   │   ├── EquipmentQrCode.tsx       # Componente de QR Code patrimonial
│   │   ├── GanttCronogramaView.tsx   # Gráfico de Gantt com fases
│   │   ├── MateriaisView.tsx         # Materiais de consumo + Curva ABC
│   │   ├── Navbar.tsx                # Barra de navegação superior
│   │   ├── ObrasView.tsx             # Gestão de obras + cards
│   │   ├── Sidebar.tsx               # Menu lateral com badges
│   │   ├── UsuariosView.tsx          # RBAC e gestão de usuários
│   │   └── VistoriasView.tsx         # Vistorias técnicas
│   ├── data/
│   │   └── initialData.ts            # Dados mockados para todas as entidades
│   ├── services/
│   │   └── estoqueService.ts         # Curva ABC e verificações de estoque
│   ├── types/
│   │   └── erp.ts                    # Tipos TypeScript de todas as entidades
│   ├── App.tsx                       # Componente principal com modais
│   ├── main.tsx                      # Ponto de entrada React
│   └── index.css                     # Tailwind CSS
├── index.html                        # Template HTML
├── package.json                      # Dependências
├── vite.config.ts                    # Configuração do Vite
├── tsconfig.json                     # Configuração TypeScript
└── metadata.json                     # Configuração Gemini AI Studio`, 'tree_structure')}
                  className="text-xs text-red-700 hover:text-red-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'tree_structure' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'tree_structure' ? 'Copiado!' : 'Copiar Árvore'}</span>
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl text-[11px] font-mono leading-relaxed overflow-x-auto">
{`brasal_sistema_react/
├── src/
│   ├── components/
│   │   ├── AlmoxarifadoView.tsx      # Gestão de equipamentos/ferramentas com QR Code
│   │   ├── ApiView.tsx               # API Explorer e SQL Studio interativo
│   │   ├── AuditoriaView.tsx         # Trilha de auditoria LGPD imutável
│   │   ├── DashboardView.tsx         # Cockpit executivo compacto (8 KPIs + Bento Grid)
│   │   ├── DocsView.tsx              # Central de documentação e especificação técnica
│   │   ├── DocumentosView.tsx        # Esteira de validação de laudos e NRs
│   │   ├── EquipeView.tsx            # Dossiê e alocação de colaboradores de campo
│   │   ├── EquipmentQrCode.tsx       # Componente de QR Code patrimonial do item
│   │   ├── GanttCronogramaView.tsx   # Cronograma de Gantt executivo com fases
│   │   ├── MateriaisView.tsx         # Insumos de consumo, pedidos e Curva ABC
│   │   ├── Navbar.tsx                # Cabeçalho com seletor de modo e notificações
│   │   ├── ObrasView.tsx             # Portfólio de empreendimentos e mini-gantts
│   │   ├── Sidebar.tsx               # Menu lateral com contadores reativos
│   │   ├── UsuariosView.tsx          # Gestão de usuários e permissões RBAC
│   │   └── VistoriasView.tsx         # Vistorias técnicas com checklist de conformidade
│   ├── data/
│   │   └── initialData.ts            # Repositório de dados mockados em memória
│   ├── services/
│   │   └── estoqueService.ts         # Cálculo de Curva ABC e Estoque Crítico
│   ├── types/
│   │   └── erp.ts                    # Declarações TypeScript de todas as entidades
│   ├── App.tsx                       # Shell da aplicação, modais e transações
│   ├── main.tsx                      # Bootstrap ReactDOM
│   └── index.css                     # Importações globais do Tailwind CSS
├── index.html                        # Entrada HTML sincronizada
├── package.json                      # Dependências npm
├── vite.config.ts                    # Configuração Vite 6
├── tsconfig.json                     # Tipagem TypeScript estrita
└── metadata.json                     # Metadados e permissões da plataforma`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: MODELAGEM DE DADOS */}
      {activeSection === 'dados' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-red-700" />
                <span>3. Modelagem de Dados & Tipos TypeScript</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-400">SEÇÃO 3/11</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              O sistema possui modelagem rigorosa de 7 grupos de entidades em TypeScript (localizadas em <code>/src/types/erp.ts</code>), perfeitamente mapeadas para as tabelas relacionais em MySQL 8.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-blue-600" />
                    <span>Entidades TypeScript (/src/types/erp.ts)</span>
                  </span>
                </div>
                <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc list-inside">
                  <li><strong>Usuario & LogAuditoria:</strong> Credenciais, perfil RBAC, trilha de auditoria LGPD com IP.</li>
                  <li><strong>Obra:</strong> Nome, endereço, status, orçamento total, materiais e almoxarifado, progresso e fase atual.</li>
                  <li><strong>ItemAlmoxarifado & MovimentacaoAlmoxarifado:</strong> Patrimônio único, QR Code, condição e histórico.</li>
                  <li><strong>MaterialConsumo & SolicitacaoMaterial:</strong> Código de insumo, estoque mínimo, valor unitário e total.</li>
                  <li><strong>Colaborador & DocumentoColaborador:</strong> Próprio/terceirizado, matrículas e certificações NR-10/12/18/35/ASO.</li>
                  <li><strong>Vistoria:</strong> Agendamento, checklist de itens conformes e não-conformidades.</li>
                  <li><strong>Notificacao & SolicitacaoTransferencia:</strong> Avisos reativos entre obras e canteiros.</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span>Correspondência de Persistência (MySQL 8)</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(`-- TABELAS PRINCIPAIS DO ERP BRASAL
CREATE TABLE usuarios (id INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(150), email VARCHAR(100) UNIQUE, tipo ENUM('admin','gestor'), ativo BOOLEAN DEFAULT TRUE);
CREATE TABLE obras (id INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(150), status ENUM('planejamento','em_andamento','pausada','concluida'), orcamento_total DECIMAL(12,2));
CREATE TABLE itens_almoxarifado (id INT AUTO_INCREMENT PRIMARY KEY, obra_id INT, nome VARCHAR(150), numero_serie VARCHAR(100) UNIQUE, status ENUM('estoque','uso','manutencao'));
CREATE TABLE materiais_consumo (id INT AUTO_INCREMENT PRIMARY KEY, obra_id INT, codigo VARCHAR(50), nome VARCHAR(150), quantidade_atual DECIMAL(10,2), quantidade_minima DECIMAL(10,2));
CREATE TABLE colaboradores (id INT AUTO_INCREMENT PRIMARY KEY, obra_id INT, nome VARCHAR(150), matricula VARCHAR(50) UNIQUE, tipo ENUM('proprio','terceiro'));
CREATE TABLE documentos_colaborador (id INT AUTO_INCREMENT PRIMARY KEY, colaborador_id INT, tipo_documento VARCHAR(50), data_validade DATE, status ENUM('pendente','aprovado','reprovado','vencido'));
CREATE TABLE vistorias (id INT AUTO_INCREMENT PRIMARY KEY, obra_id INT, titulo VARCHAR(150), data_agendada DATE, status ENUM('pendente','realizada','cancelada'));
CREATE TABLE audit_logs (id INT AUTO_INCREMENT PRIMARY KEY, usuario_id INT, modulo VARCHAR(50), acao VARCHAR(100), ip_origem VARCHAR(45), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`, 'sql_tables')}
                    className="text-xs text-red-700 hover:text-red-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'sql_tables' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'sql_tables' ? 'Copiado!' : 'Copiar DDL'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Todas as tabelas foram concebidas na 3ª Forma Normal (3NF), com integridade referencial via Foreign Keys (<code>CASCADE</code> em documentos e movimentações, <code>RESTRICT</code> em usuários responsáveis e obras ativas).
                </p>
                <div className="font-mono text-[10px] bg-slate-900 text-emerald-400 p-2 rounded-lg overflow-x-auto">
                  obras (1) ─── (N) itens_almoxarifado<br/>
                  obras (1) ─── (N) materiais_consumo<br/>
                  obras (1) ─── (N) colaboradores (1) ─── (N) documentos_colaborador
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: MÓDULOS FUNCIONAIS */}
      {activeSection === 'modulos' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Boxes className="w-5 h-5 text-red-700" />
                <span>4. Módulos Funcionais do Sistema (11 Componentes)</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-400">SEÇÃO 4/11</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {[
                {
                  id: '4.1',
                  nome: 'Dashboard (Cockpit Geral)',
                  desc: 'Visão executiva em 8 KPIs compactos e Bento Grid de 3 seções (Avanço Físico & Curva S, Portfólio & Maquinários, SST & Feed Operacional). Ações rápidas de canteiro.',
                  comp: '<DashboardView />'
                },
                {
                  id: '4.2',
                  nome: 'Gestão de Obras & Empreendimentos',
                  desc: 'CRUD completo de canteiros, fotos, orçamentos segregados, progresso percentual, mini-Gantt trifásico e exportação direta para Excel/CSV.',
                  comp: '<ObrasView />'
                },
                {
                  id: '4.3',
                  nome: 'Almoxarifado & Equipamentos',
                  desc: 'Controle individual por patrimônio e número de série, etiquetas com QR Code, status de estoque/uso/manutenção, empréstimo nominal e termos de devolução.',
                  comp: '<AlmoxarifadoView />'
                },
                {
                  id: '4.4',
                  nome: 'Materiais de Consumo & Suprimentos',
                  desc: 'Cadastro com código único, alertas de estoque crítico, fluxo de solicitação e aprovação de compras, histórico de entradas/saídas e Curva ABC.',
                  comp: '<MateriaisView />'
                },
                {
                  id: '4.5',
                  nome: 'Equipe de Canteiro & Dossiê',
                  desc: 'Gestão de mão de obra própria e terceirizada, upload de laudos SST, dossiê individual do trabalhador e controle de matrículas.',
                  comp: '<EquipeView />'
                },
                {
                  id: '4.6',
                  nome: 'Validação de Documentos SST',
                  desc: 'Esteira de validação restrita a administradores. Aprovação com preenchimento de validade e reprovação com justificativa formal obrigatória.',
                  comp: '<DocumentosView />'
                },
                {
                  id: '4.7',
                  nome: 'Vistorias Técnicas & Qualidade',
                  desc: 'Agendamento de inspeções de segurança e engenharia, checklist de conformidades e registro de não-conformidades com prazos.',
                  comp: '<VistoriasView />'
                },
                {
                  id: '4.8',
                  nome: 'Cronograma de Fases (Gantt)',
                  desc: 'Visualização temporal com linha "Hoje", progresso das fases (Fundação, Estrutura, Acabamento) e cálculo automatizado com base no cronograma da obra.',
                  comp: '<GanttCronogramaView />'
                },
                {
                  id: '4.9',
                  nome: 'Auditoria & Compliance LGPD',
                  desc: 'Trilha cronológica imutável registrando todas as ações (cadastros, exclusões, aprovações, empréstimos), usuário responsável e IP de origem.',
                  comp: '<AuditoriaView />'
                },
                {
                  id: '4.10',
                  nome: 'API Explorer & SQL Studio',
                  desc: 'Console interativo para desenvolvedores com documentação OpenAPI/RESTful dos endpoints e simulador de consultas SQL em tabelas mockadas.',
                  comp: '<ApiView />'
                },
                {
                  id: '4.11',
                  nome: 'Central de Documentação Técnica',
                  desc: 'Especificação técnica detalhada, arquitetura, modelagem de dados, regras de negócio e planos de evolução.',
                  comp: '<DocsView />'
                }
              ].map(mod => (
                <div key={mod.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-red-100 text-red-800 rounded font-bold">{mod.id}</span>
                      <code className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">{mod.comp}</code>
                    </div>
                    <h3 className="font-bold text-slate-900 text-xs mb-1">{mod.nome}</h3>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{mod.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: TELAS E INTERFACES */}
      {activeSection === 'telas' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Layout className="w-5 h-5 text-red-700" />
                <span>5. Telas & Wireframes Estruturais (Layouts ASCII)</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-400">SEÇÃO 5/11</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              O design da aplicação foi construído em arquitetura fluida e ultra-densa (Above-The-Fold), garantindo que engenheiros e gestores visualizem os principais indicadores sem necessidade de scroll desnecessário.
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 mb-1.5">5.1 Wireframe: Layout Principal & Navegação</h3>
                <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-[10px] font-mono leading-tight overflow-x-auto">
{`+------------------------------------------------------------------+
|  [Logo] BRASAL ENGENHARIA  | [Modo] ERP | Docs | API  | [User]   |
+------------------------------------------------------------------+
|  [Sidebar]                 |                                      |
|  📊 Dashboard              |    ÁREA DE CONTEÚDO PRINCIPAL       |
|  🏗️ Obras                 |                                      |
|  📦 Almoxarifado           |    (Componente ativo)               |
|  📋 Materiais              |                                      |
|  👥 Equipe                 |                                      |
|  📄 Documentos             |                                      |
|  🔍 Vistorias              |                                      |
|  👤 Usuários (admin)       |                                      |
|  📜 Auditoria              |                                      |
+------------------------------------------------------------------+`}
                </pre>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-900 mb-1.5">5.2 Wireframe: Cockpit do Dashboard Executivo</h3>
                <pre className="bg-slate-900 text-amber-300 p-4 rounded-xl text-[10px] font-mono leading-tight overflow-x-auto">
{`+------------------------------------------------------------------+
|  Cockpit Geral de Obras - Engenharia Brasal                      |
|  [Nova Obra] [Emprestar] [Solicitar Insumo]                     |
+------------------------------------------------------------------+
|  Obras  | Efetivo | Almox. | Manut. | Curva S | Crítico | SST  |
|  Ativas | Campo   |        |        |         |         |      |
|  3      | 12      | 45     | 2      | 67%     | 5       | 92%  |
+------------------------------------------------------------------+
|  Avanço Físico & Curva S      | Status & Fases  | SST & Moviment. |
|  [Barra de Progresso]         | [Grid 2x2]      | [Conformidade]  |
|  [Lista de Obras]             | [Maquinários]   | [Feed]          |
+------------------------------------------------------------------+`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: REGRAS DE NEGÓCIO */}
      {activeSection === 'regras' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-red-700" />
                <span>6. Regras de Negócio Oficiais do Sistema</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-400">SEÇÃO 6/11</span>
            </div>

            <div className="space-y-5">
              {/* Almoxarifado */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-amber-600" />
                  <span>6.1 Almoxarifado (Equipamentos e Ativos)</span>
                </h3>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/90 text-slate-700 text-[11px] font-bold uppercase border-b border-slate-200">
                        <th className="p-2 w-28">Código</th>
                        <th className="p-2">Regra de Negócio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      <tr><td className="p-2 font-mono font-bold text-red-800">RN-ALM-001</td><td className="p-2">Número de série deve ser único globalmente para cada patrimônio no sistema.</td></tr>
                      <tr><td className="p-2 font-mono font-bold text-red-800">RN-ALM-002</td><td className="p-2">Um item que já se encontra em status "uso" não pode sofrer nova retirada sem devolução prévia.</td></tr>
                      <tr><td className="p-2 font-mono font-bold text-red-800">RN-ALM-003</td><td className="p-2">Itens em "manutenção" ficam bloqueados para empréstimo até emissão do laudo de liberação.</td></tr>
                      <tr><td className="p-2 font-mono font-bold text-red-800">RN-ALM-004</td><td className="p-2">A devolução exige registro de data/hora, condição do item e usuário responsável no sistema.</td></tr>
                      <tr><td className="p-2 font-mono font-bold text-red-800">RN-ALM-005</td><td className="p-2">No ato da devolução com defeito, o fluxo permite encaminhamento direto para a oficina de manutenção.</td></tr>
                      <tr><td className="p-2 font-mono font-bold text-red-800">RN-ALM-006</td><td className="p-2">O QR Code patrimonial armazena payload JSON padronizado com ID, número de série e obra proprietária.</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Materiais */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-blue-600" />
                  <span>6.2 Materiais de Consumo & Curva ABC</span>
                </h3>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/90 text-slate-700 text-[11px] font-bold uppercase border-b border-slate-200">
                        <th className="p-2 w-28">Código</th>
                        <th className="p-2">Regra de Negócio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      <tr><td className="p-2 font-mono font-bold text-blue-800">RN-MAT-001</td><td className="p-2">O código de catálogo do material deve ser único por canteiro de obra.</td></tr>
                      <tr><td className="p-2 font-mono font-bold text-blue-800">RN-MAT-002</td><td className="p-2">Bloqueio estrito de saída de insumos em quantidade superior ao saldo físico atual em estoque.</td></tr>
                      <tr><td className="p-2 font-mono font-bold text-blue-800">RN-MAT-003</td><td className="p-2">Quando a quantidade_atual atinge a quantidade_minima, o insumo entra em estado "crítico" automaticamente.</td></tr>
                      <tr><td className="p-2 font-mono font-bold text-blue-800">RN-MAT-004</td><td className="p-2">Toda solicitação de compra de materiais exige aprovação formal de perfil Administrador.</td></tr>
                      <tr><td className="p-2 font-mono font-bold text-blue-800">RN-MAT-005</td><td className="p-2">A confirmação de entrega física da solicitação incrementa o estoque e gera movimentação de entrada.</td></tr>
                      <tr><td className="p-2 font-mono font-bold text-blue-800">RN-MAT-006</td><td className="p-2">Curva ABC automatizada: Classe A (até 80% do valor), Classe B (de 80% a 95%) e Classe C (restante 5%).</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Documentos & Vistorias */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>6.3 Documentos SST</span>
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <tbody className="divide-y divide-slate-100">
                        <tr><td className="p-2 font-mono font-bold text-emerald-800 w-24">RN-DOC-001</td><td className="p-2">Uploads recebem status "pendente" até homologação.</td></tr>
                        <tr><td className="p-2 font-mono font-bold text-emerald-800">RN-DOC-002</td><td className="p-2">Apenas Administradores possuem alçada para validar laudos.</td></tr>
                        <tr><td className="p-2 font-mono font-bold text-emerald-800">RN-DOC-003</td><td className="p-2">A reprovação documental exige justificativa obrigatória.</td></tr>
                        <tr><td className="p-2 font-mono font-bold text-emerald-800">RN-DOC-004</td><td className="p-2">Laudos com data_validade expirada assumem status "vencido".</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    <span>6.4 Vistorias Técnicas</span>
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <tbody className="divide-y divide-slate-100">
                        <tr><td className="p-2 font-mono font-bold text-purple-800 w-24">RN-VIS-001</td><td className="p-2">Vistorias agendadas iniciam em estado "pendente".</td></tr>
                        <tr><td className="p-2 font-mono font-bold text-purple-800">RN-VIS-002</td><td className="p-2">A conclusão exige checklist de conformidades e apontamentos.</td></tr>
                        <tr><td className="p-2 font-mono font-bold text-purple-800">RN-VIS-003</td><td className="p-2">Cancelamento só é admitido antes da data agendada.</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SECTION 7: SEGURANÇA E AUDITORIA */}
      {activeSection === 'seguranca' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-700" />
                <span>7. Segurança, RBAC & Trilha de Auditoria (LGPD)</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-400">SEÇÃO 7/11</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Trilha de Auditoria Imutável (LGPD Compliance)</span>
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Para atendimento aos preceitos da Lei Geral de Proteção de Dados (Lei 13.709/2018), toda mutação de estado no sistema (inclusão, alteração, exclusão de colaborador, aprovação ou descarte de laudo) é registrada com:
                </p>
                <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                  <li>Identificador do Usuário (ID e Nome completo)</li>
                  <li>Timestamp ISO 8601 de alta precisão</li>
                  <li>Módulo funcional afetado e Ação executada</li>
                  <li>Payload descritivo dos dados alterados</li>
                  <li>Endereço IP de origem e User-Agent da requisição</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-600" />
                  <span>Recomendações de Hardening para Backend Real</span>
                </h3>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-start gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Autenticação JWT Stateless:</strong> Chaves assimétricas com expiração em 8h e refresh tokens seguros via cookie HttpOnly.</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>2FA (Dois Fatores):</strong> Suporte a TOTP (Google Authenticator) para perfis administrativos.</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Criptografia Forte:</strong> Hashing de senhas via Argon2id ou Bcrypt (salt rounds 12).</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Rate Limiting:</strong> Proteção contra força bruta em rotas de autenticação (5 req/min).</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 8: PLANO DE EVOLUÇÃO PARA BACKEND REAL */}
      {activeSection === 'evolucao' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-red-700" />
                <span>8. Plano de Evolução para Backend Real (Cronograma de 7 Semanas)</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-400">SEÇÃO 8/11</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">FASE 1 · 2 Semanas</span>
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs mb-1.5">Substituição de Mock por API RESTful</h3>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                    <li>Backend Node.js + Express 4</li>
                    <li>Migração de initialData.ts para MySQL 8</li>
                    <li>Autenticação JWT stateless com RBAC</li>
                    <li>Substituição por chamadas fetch() / Axios</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">FASE 2 · 2 Semanas</span>
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs mb-1.5">Módulos Financeiros & Orçamento</h3>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                    <li>Controle de faturas e boletos de fornecedores</li>
                    <li>Conciliação bancária por centro de custo</li>
                    <li>Comparativo Orçado vs. Realizado</li>
                    <li>Gráficos analíticos de Curva S real</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded">FASE 3 · 2 Semanas</span>
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs mb-1.5">Integrações SEFAZ & Cloud Storage</h3>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                    <li>Leitura de XML de NF-e via SEFAZ</li>
                    <li>Upload de PDFs/Laudos em bucket AWS S3</li>
                    <li>Disparo transacional de e-mails (SendGrid)</li>
                    <li>Webhooks de integração contábil</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">FASE 4 · 1 Semana</span>
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs mb-1.5">Mobile PWA & Sincronização Offline</h3>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                    <li>Progressive Web App com Service Worker</li>
                    <li>IndexedDB para leitura offline de estoque</li>
                    <li>Leitor de QR Code via câmera do smartphone</li>
                    <li>Sincronização em segundo plano (Background Sync)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 9: SERVIÇO DE ESTOQUE COM CURVA ABC (INTERATIVO) */}
      {activeSection === 'servicos' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-red-700" />
                <span>9. Exemplo de Código: Serviço de Estoque & Curva ABC (Interativo)</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-400">SEÇÃO 9/11</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              O módulo <code>src/services/estoqueService.ts</code> encapsula o algoritmo matemático da <strong>Curva ABC</strong> e as regras de verificação de estoque crítico. A tabela abaixo executa o algoritmo real em memória:
            </p>

            {/* Live Interactive Table */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-red-700" />
                    <span>Demonstração ao Vivo do Algoritmo (/src/services/estoqueService.ts)</span>
                  </span>
                  <p className="text-[11px] text-slate-500">Valor Total Calculado: <strong>{totalEstoqueValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-red-100 text-red-900 rounded text-[10px] font-bold">Classe A: {calculatedABC.filter(i => i.classe === 'A').length}</span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[10px] font-bold">Classe B: {calculatedABC.filter(i => i.classe === 'B').length}</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded text-[10px] font-bold">Classe C: {calculatedABC.filter(i => i.classe === 'C').length}</span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-[11px] font-bold border-b border-slate-200">
                      <th className="p-2 w-16">Classe</th>
                      <th className="p-2 w-20">Código</th>
                      <th className="p-2">Descrição do Insumo</th>
                      <th className="p-2 text-right">Saldo / Mín</th>
                      <th className="p-2 text-right">Valor Total</th>
                      <th className="p-2 text-right">% Acumulada</th>
                      <th className="p-2 text-center w-24">Status Crítico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calculatedABC.map((item) => {
                      const isCritical = verificarEstoqueCritico(item);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80">
                          <td className="p-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${
                              item.classe === 'A' ? 'bg-red-800 text-white' :
                              item.classe === 'B' ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
                            }`}>
                              {item.classe}
                            </span>
                          </td>
                          <td className="p-2 font-mono font-bold text-slate-800">{item.codigo}</td>
                          <td className="p-2 font-medium text-slate-900">{item.nome}</td>
                          <td className="p-2 text-right text-slate-700 font-mono">{item.quantidade_atual} / {item.quantidade_minima}</td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">
                            {item.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="p-2 text-right font-mono text-slate-700 font-semibold">{item.pctAcumulado.toFixed(1)}%</td>
                          <td className="p-2 text-center">
                            {isCritical ? (
                              <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded font-bold text-[9px] uppercase">Crítico</span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[9px]">Normal</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Code Snippet */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Código Fonte TypeScript: services/estoqueService.ts</span>
                <button
                  onClick={() => copyToClipboard(`// services/estoqueService.ts
import { MaterialConsumo } from '../types/erp';

export const calcularCurvaABC = (materiais: MaterialConsumo[]) => {
  const total = materiais.reduce((acc, m) => acc + m.valor_total, 0);
  const sorted = [...materiais].sort((a, b) => b.valor_total - a.valor_total);
  let running = 0;
  
  return sorted.map(item => {
    running += item.valor_total;
    const pct = total > 0 ? (running / total) * 100 : 0;
    let classe: 'A' | 'B' | 'C' = 'C';
    if (pct <= 80) classe = 'A';
    else if (pct <= 95) classe = 'B';
    return { ...item, pctAcumulado: pct, classe };
  });
};

export const verificarEstoqueCritico = (material: MaterialConsumo) => {
  return material.quantidade_atual <= material.quantidade_minima;
};

export const calcularValorTotalEstoque = (materiais: MaterialConsumo[]) => {
  return materiais.reduce((acc, m) => acc + m.valor_total, 0);
};`, 'estoque_service_code')}
                  className="text-xs text-red-700 hover:text-red-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'estoque_service_code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'estoque_service_code' ? 'Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl text-[11px] font-mono leading-relaxed overflow-x-auto">
{`// services/estoqueService.ts
import { MaterialConsumo } from '../types/erp';

export const calcularCurvaABC = (materiais: MaterialConsumo[]) => {
  const total = materiais.reduce((acc, m) => acc + (m.valor_total || 0), 0);
  const sorted = [...materiais].sort((a, b) => (b.valor_total || 0) - (a.valor_total || 0));
  let running = 0;
  
  return sorted.map(item => {
    running += (item.valor_total || 0);
    const pct = total > 0 ? (running / total) * 100 : 0;
    let classe: 'A' | 'B' | 'C' = 'C';
    if (pct <= 80) classe = 'A';
    else if (pct <= 95) classe = 'B';
    return { ...item, pctAcumulado: pct, classe };
  });
};

export const verificarEstoqueCritico = (material: MaterialConsumo) => {
  return material.quantidade_atual <= material.quantidade_minima;
};

export const calcularValorTotalEstoque = (materiais: MaterialConsumo[]) => {
  return materiais.reduce((acc, m) => acc + (m.valor_total || 0), 0);
};`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 10: PERGUNTAS PARA O DESENVOLVEDOR */}
      {activeSection === 'perguntas' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-red-700" />
                <span>10. Perguntas Estratégicas para o Desenvolvedor & Stakeholders</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-400">SEÇÃO 10/11</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Checklist de alinhamento técnico e de negócios para guiar a reunião entre a liderança de engenharia de software e os gestores de obras:
            </p>

            <div className="space-y-3 pt-2">
              {[
                {
                  id: 1,
                  pergunta: 'O sistema atual (React + dados mockados) atende todas as necessidades da empresa?',
                  analise: 'O frontend atual entrega 100% das telas, regras visuais e navegação necessárias para canteiro e diretoria. A migração para backend real garantirá persistência perene e auditoria transacional.',
                  prioridade: 'Alta'
                },
                {
                  id: 2,
                  pergunta: 'Quais funcionalidades são prioritárias para implementação no backend?',
                  analise: 'A tríade inicial prioritária é: (1) Autenticação JWT com alçada RBAC, (2) Almoxarifado com baixa de itens e (3) Aprovação de pedidos de suprimentos por engenheiros residentes.',
                  prioridade: 'Crítica'
                },
                {
                  id: 3,
                  pergunta: 'Há necessidade de integração com sistemas existentes (contábil, RH, SEFAZ)?',
                  analise: 'Recomenda-se a importação automática de XML de NF-e na Fase 3 para alimentar o estoque sem digitação manual, além de exportação diária para o software contábil da construtora.',
                  prioridade: 'Média'
                },
                {
                  id: 4,
                  pergunta: 'Qual é a escala esperada (número de obras, usuários, colaboradores)?',
                  analise: 'A modelagem relacional suporta de 1 a 50+ obras simultâneas, até 5.000 operários ativos e dezenas de milhares de movimentações de almoxarifado por meio de índices otimizados no MySQL.',
                  prioridade: 'Alta'
                },
                {
                  id: 5,
                  pergunta: 'O sistema precisa ser multi-empresa (matriz/filiais ou SPEs por obra)?',
                  analise: 'A modelagem já possui segregação por `obra_id` (centro de custo). Para SPEs independentes, basta vincular um campo `cnpj_spe` na tabela de obras.',
                  prioridade: 'Média'
                },
                {
                  id: 6,
                  pergunta: 'Há necessidade de versão mobile nativa ou PWA?',
                  analise: 'O PWA (Progressive Web App) offline-first com Service Worker é a melhor opção em custo/benefício, dispensando publicação em App Store e permitindo leitura de QR Code via navegador.',
                  prioridade: 'Alta'
                },
                {
                  id: 7,
                  pergunta: 'Qual o prazo esperado para migração para produção?',
                  analise: 'O cronograma estruturado em 4 fases tem previsão de 7 semanas para o rollout completo do backend e sincronização em tempo real dos canteiros.',
                  prioridade: 'Estratégica'
                }
              ].map(q => (
                <div 
                  key={q.id}
                  onClick={() => toggleQuestion(q.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    answeredQuestions[q.id] ? 'bg-slate-50/90 border-slate-200' : 'bg-white border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border ${
                        answeredQuestions[q.id] ? 'bg-red-800 border-red-800 text-white' : 'border-slate-300'
                      }`}>
                        {answeredQuestions[q.id] && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-bold text-slate-500">QUESTÃO #{q.id}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-800">{q.prioridade}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs mb-1.5">{q.pergunta}</h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-slate-200/60">
                          <strong>Recomendação Técnica:</strong> {q.analise}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 11: PRÓXIMOS PASSOS */}
      {activeSection === 'passos' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-red-700" />
                <span>11. Próximos Passos para o Desenvolvimento & Produção</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-400">SEÇÃO 11/11</span>
            </div>

            <div className="space-y-3 pt-1">
              {[
                { step: '1', titulo: 'Revisão do Prompt & Especificação com a Equipe', status: 'Concluído', desc: 'Validação da arquitetura React 19 + TypeScript e modelagem relacional MySQL com líderes de engenharia.' },
                { step: '2', titulo: 'Validação Funcional com Engenheiros Residentes', status: 'Em Andamento', desc: 'Demonstração dos módulos de Almoxarifado, QR Code e Curva ABC para os gestores de canteiro.' },
                { step: '3', titulo: 'Definição de Backlog & Sprints (Jira / Azure DevOps)', status: 'Planejado', desc: 'Quebra das 4 fases em user stories detalhadas para a equipe de desenvolvimento.' },
                { step: '4', titulo: 'Provisionamento de Ambiente Cloud & Docker', status: 'Planejado', desc: 'Setup do container Docker Compose, banco MySQL gerenciado e repositório Git com CI/CD.' },
                { step: '5', titulo: 'Construção da API Node.js + Express', status: 'Próxima Sprint', desc: 'Implementação dos controllers RESTful, pool de conexões MySQL2 e middlewares de segurança.' },
                { step: '6', titulo: 'Deploy Homologado & Treinamento dos Canteiros', status: 'Fase Final', desc: 'Instalação das etiquetas de QR Code e capacitação dos almoxarifes para operação diária.' }
              ].map(item => (
                <div key={item.step} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-800 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="font-bold text-slate-900 text-xs">{item.titulo}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.status === 'Concluído' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'Em Andamento' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 p-4 bg-gradient-to-r from-red-950 via-slate-900 to-red-950 rounded-xl text-white flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-xs text-red-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Pronto para Evoluir o Sistema Brasal Engenharia!</span>
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Esta central serve de especificação oficial, guia de onboarding de desenvolvedores e referência para produção.
                </p>
              </div>
              <button
                onClick={handleDownloadMarkdown}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all shrink-0 flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Documento .MD</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
