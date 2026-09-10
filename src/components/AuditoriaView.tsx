import React, { useState } from 'react';
import { 
  History, 
  Search, 
  SlidersHorizontal, 
  ShieldAlert, 
  Terminal, 
  FileText, 
  User, 
  Calendar,
  Lock
} from 'lucide-react';
import { LogAuditoria } from '../types/erp';

interface AuditoriaViewProps {
  logs: LogAuditoria[];
}

export const AuditoriaView: React.FC<AuditoriaViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [moduloFilter, setModuloFilter] = useState<string>('all');

  const filteredLogs = logs.filter(l => {
    const matchSearch = l.acao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        l.detalhes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        l.usuario_nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchModulo = moduloFilter === 'all' || l.modulo === moduloFilter;
    return matchSearch && matchModulo;
  });

  return (
    <div className="space-y-3.5">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 sm:w-5 sm:h-5 text-red-700" />
            <h1 className="text-base sm:text-lg font-black text-slate-900">Trilha de Auditoria & Logs de Governança (LGPD)</h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Registro imutável de todas as ações executadas no ERP: movimentações de estoque, aprovações financeiras, logins e exclusões.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Logs Criptografados</span>
          </span>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por ação, usuário, detalhes ou endereço IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-red-700"
          />
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <select
            aria-label="Filtrar por Módulo do Sistema"
            value={moduloFilter}
            onChange={(e) => setModuloFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">Todos os Módulos</option>
            <option value="Autenticação">Autenticação</option>
            <option value="Almoxarifado">Almoxarifado</option>
            <option value="Materiais">Materiais</option>
            <option value="Documentos">Documentos</option>
            <option value="Obras">Obras</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[800px] lg:min-w-full">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-36">Data e Hora</th>
                <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-40">Usuário</th>
                <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-32">Módulo</th>
                <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-44">Ação Executada</th>
                <th className="px-2.5 py-1.5 sm:px-3 sm:py-2">Detalhes do Evento</th>
                <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-28 font-mono">IP Origem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="odd:bg-white even:bg-slate-50/70 hover:bg-red-50/40 transition-colors font-mono">
                  <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-slate-600 text-[10px] whitespace-nowrap">{log.created_at}</td>
                  <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 font-sans font-bold text-slate-900 truncate">{log.usuario_nome}</td>
                  <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 font-sans">
                    <span className="bg-slate-100 text-slate-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                      {log.modulo}
                    </span>
                  </td>
                  <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 font-sans font-semibold text-red-900 truncate">{log.acao}</td>
                  <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 font-sans text-slate-600 truncate max-w-md">{log.detalhes}</td>
                  <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-slate-500 text-[10px]">{log.ip_origem || '127.0.0.1'}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-500 font-sans">
                    Nenhum registro de auditoria encontrado com os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
