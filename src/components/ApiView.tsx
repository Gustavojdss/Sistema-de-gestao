import React, { useState } from 'react';
import { 
  Terminal, 
  Database, 
  Send, 
  Code2, 
  Check, 
  Copy, 
  Play, 
  Layers, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  FileCode
} from 'lucide-react';
import { Obra, ItemAlmoxarifado, MaterialConsumo, Colaborador } from '../types/erp';

interface ApiViewProps {
  obras: Obra[];
  itensAlmoxarifado: ItemAlmoxarifado[];
  materiais: MaterialConsumo[];
  colaboradores: Colaborador[];
}

export const ApiView: React.FC<ApiViewProps> = ({
  obras,
  itensAlmoxarifado,
  materiais,
  colaboradores
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('GET /api/v1/obras');
  const [activeTab, setActiveTab] = useState<'rest' | 'sql'>('rest');
  const [sqlQuery, setSqlQuery] = useState<string>(
    'SELECT nome, status, orcamento_total, progresso FROM obras ORDER BY orcamento_total DESC;'
  );
  const [sqlResult, setSqlResult] = useState<any[] | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const endpoints = [
    {
      id: 'GET /api/v1/obras',
      method: 'GET',
      path: '/api/v1/obras',
      desc: 'Lista todas as obras com estatísticas de progresso e orçamento.',
      auth: 'Bearer JWT (Admin ou Gestor)',
      response: {
        success: true,
        count: obras.length,
        data: obras
      }
    },
    {
      id: 'GET /api/v1/almoxarifado/itens',
      method: 'GET',
      path: '/api/v1/almoxarifado/itens',
      desc: 'Consulta o inventário de ferramentas, máquinas e EPIs.',
      auth: 'Bearer JWT',
      response: {
        success: true,
        count: itensAlmoxarifado.length,
        data: itensAlmoxarifado
      }
    },
    {
      id: 'POST /api/v1/almoxarifado/emprestimo',
      method: 'POST',
      path: '/api/v1/almoxarifado/emprestimo',
      desc: 'Registra saída de ferramenta nominal a colaborador.',
      auth: 'Bearer JWT (Gestor de Obra)',
      payload: {
        item_id: 2,
        colaborador_id: 1,
        data_previsao_devolucao: '2024-08-30',
        observacao: 'Concretagem do 4º pavimento'
      },
      response: {
        success: true,
        message: 'Empréstimo registrado com sucesso e termo assinado digitalmente.',
        status: 'uso'
      }
    },
    {
      id: 'GET /api/v1/materiais/curva-abc',
      method: 'GET',
      path: '/api/v1/materiais/curva-abc',
      desc: 'Retorna a classificação de materiais de consumo por valor financeiro acumulado (80/15/5).',
      auth: 'Bearer JWT',
      response: {
        success: true,
        classe_A_count: 2,
        classe_B_count: 3,
        classe_C_count: 1,
        total_valor: materiais.reduce((s, m) => s + (m.valor_total || 0), 0)
      }
    },
    {
      id: 'POST /api/v1/documentos/upload',
      method: 'POST',
      path: '/api/v1/documentos/upload',
      desc: 'Upload multipart/form-data de certificado de norma (NR-35, ASO).',
      auth: 'Bearer JWT',
      payload: {
        colaborador_id: 1,
        tipo_documento: 'nr35',
        data_validade: '2026-01-10',
        arquivo: '[Binary PDF MultiPart]'
      },
      response: {
        success: true,
        documento_id: 104,
        status: 'pendente',
        message: 'Documento submetido para validação do Administrador.'
      }
    }
  ];

  const currentEp = endpoints.find(e => e.id === selectedEndpoint) || endpoints[0];

  const runSampleSql = (query: string) => {
    setSqlQuery(query);
    executeSql(query);
  };

  const executeSql = (queryToRun?: string) => {
    const q = (queryToRun || sqlQuery).trim();
    setSqlError(null);

    try {
      if (q.toLowerCase().includes('from obras')) {
        setSqlResult(obras.map(o => ({
          id: o.id,
          nome: o.nome,
          status: o.status,
          orcamento_total: o.orcamento_total,
          progresso: o.progresso + '%'
        })));
      } else if (q.toLowerCase().includes('from itens_almoxarifado') || q.toLowerCase().includes('almoxarifado')) {
        setSqlResult(itensAlmoxarifado.map(i => ({
          id: i.id,
          nome: i.nome,
          numero_serie: i.numero_serie,
          categoria: i.categoria,
          status: i.status,
          colaborador: i.colaborador_nome || 'Nenhum'
        })));
      } else if (q.toLowerCase().includes('from materiais') || q.toLowerCase().includes('materiais_consumo')) {
        setSqlResult(materiais.map(m => ({
          id: m.id,
          codigo: m.codigo,
          nome: m.nome,
          qtd_atual: m.quantidade_atual,
          qtd_minima: m.quantidade_minima,
          valor_total: 'R$ ' + m.valor_total?.toFixed(2)
        })));
      } else if (q.toLowerCase().includes('from colaboradores') || q.toLowerCase().includes('colaborador')) {
        setSqlResult(colaboradores.map(c => ({
          id: c.id,
          nome: c.nome,
          matricula: c.matricula,
          cargo: c.cargo,
          tipo: c.tipo,
          obra: c.obra_nome
        })));
      } else {
        setSqlResult([
          { status: 'QUERY EXECUTED', rows_affected: 1, message: 'Consulta SQL processada com sucesso no pool MySQL.' }
        ]);
      }
    } catch (err: any) {
      setSqlError(err.message || 'Erro de sintaxe SQL.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/60 border border-red-700/50 text-red-300 text-xs font-semibold mb-2">
            <Terminal className="w-3.5 h-3.5" />
            <span>Developer Studio & Console API</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">API REST & SQL Query Studio</h1>
          <p className="text-slate-300 text-xs mt-1 max-w-3xl leading-relaxed">
            Ambiente interativo de homologação para desenvolvedores e integração de sistemas: consulte endpoints RESTful autenticados via JWT e execute consultas SQL simuladas no esquema relacional.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('rest')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'rest' ? 'bg-red-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            REST API Explorer
          </button>
          <button
            onClick={() => {
              setActiveTab('sql');
              if (!sqlResult) executeSql();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'sql' ? 'bg-red-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            SQL Query Runner
          </button>
        </div>
      </div>

      {activeTab === 'rest' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Endpoints Sidebar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2">Rotas Disponíveis</span>
            <div className="space-y-1 mt-2">
              {endpoints.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => setSelectedEndpoint(ep.id)}
                  className={`w-full text-left p-3 rounded-xl text-xs transition-all flex items-center justify-between ${
                    selectedEndpoint === ep.id
                      ? 'bg-slate-900 text-white font-semibold shadow-md'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                      ep.method === 'GET' ? 'bg-emerald-800 text-white' : 'bg-blue-800 text-white'
                    }`}>
                      {ep.method}
                    </span>
                    <span className="truncate">{ep.path}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Endpoint Details & Response */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded font-mono ${
                    currentEp.method === 'GET' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {currentEp.method}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-900">{currentEp.path}</span>
                </div>
                <span className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-semibold">
                  {currentEp.auth}
                </span>
              </div>
              <p className="text-xs text-slate-600">{currentEp.desc}</p>
            </div>

            {currentEp.payload && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-900">Request Body (JSON Payload):</span>
                <pre className="bg-slate-900 text-amber-300 p-4 rounded-xl text-xs font-mono overflow-x-auto">
                  {JSON.stringify(currentEp.payload, null, 2)}
                </pre>
              </div>
            )}

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold text-slate-900">Live Response (Status 200 OK):</span>
                </div>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(currentEp.response, null, 2), 'res')}
                  className="text-xs text-red-700 hover:text-red-800 font-semibold flex items-center gap-1"
                >
                  {copiedKey === 'res' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'res' ? 'Copiado!' : 'Copiar JSON'}</span>
                </button>
              </div>

              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-80">
                {JSON.stringify(currentEp.response, null, 2)}
              </pre>
            </div>
          </div>

        </div>
      ) : (
        <div className="space-y-6">
          
          {/* SQL Editor */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-red-700" />
                <span className="font-bold text-xs text-slate-900">Console SQL Interativo (MySQL Pool)</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => runSampleSql('SELECT nome, status, orcamento_total, progresso FROM obras ORDER BY orcamento_total DESC;')}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                >
                  Query Obras
                </button>
                <button
                  onClick={() => runSampleSql('SELECT nome, numero_serie, categoria, status FROM itens_almoxarifado WHERE status = "uso";')}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                >
                  Query Empréstimos
                </button>
                <button
                  onClick={() => runSampleSql('SELECT nome, matricula, cargo, tipo FROM colaboradores WHERE status = "ativo";')}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                >
                  Query Equipe
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                rows={4}
                className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-xl focus:outline-none border border-slate-700"
                placeholder="Digite sua query SQL aqui..."
              />
              <button
                onClick={() => executeSql()}
                className="absolute right-3 bottom-4 flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Executar Query</span>
              </button>
            </div>
          </div>

          {/* Query Results */}
          {sqlResult && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Resultado da Execução ({sqlResult.length} registros retornados)</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">Tempo: 4.2ms · Pool: 10/10 OK</span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs text-left border-collapse min-w-[600px] lg:min-w-full">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 font-mono">
                      {Object.keys(sqlResult[0] || {}).map((key) => (
                        <th key={key} className="px-2.5 py-1.5 sm:px-3 sm:py-2">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-xs">
                    {sqlResult.map((row, idx) => (
                      <tr key={idx} className="odd:bg-white even:bg-slate-50/70 hover:bg-red-50/40 transition-colors">
                        {Object.values(row).map((val: any, cIdx) => (
                          <td key={cIdx} className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-slate-800">{val?.toString()}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {sqlError && (
            <div className="p-4 bg-red-50 text-red-800 rounded-2xl border border-red-200 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{sqlError}</span>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
