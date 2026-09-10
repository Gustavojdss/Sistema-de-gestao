import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Plus, 
  Search, 
  UserCheck, 
  KeyRound, 
  Building, 
  Mail, 
  Shield, 
  Trash2,
  Lock
} from 'lucide-react';
import { Usuario, Obra } from '../types/erp';

interface UsuariosViewProps {
  usuarios: Usuario[];
  obras: Obra[];
  currentUser: Usuario;
  onOpenNovoUsuario: () => void;
  onDeleteUsuario: (id: number) => void;
}

export const UsuariosView: React.FC<UsuariosViewProps> = ({
  usuarios,
  obras,
  currentUser,
  onOpenNovoUsuario,
  onDeleteUsuario
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = usuarios.filter(u => 
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.obra_nome && u.obra_nome.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-3.5">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-red-700" />
            <h1 className="text-base sm:text-lg font-black text-slate-900">Controle de Usuários & Matriz de Permissões (RBAC)</h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Gerenciamento de contas de acesso, autenticação JWT, papéis de sistema (Admin vs Gestor de Obra).
          </p>
        </div>

        <button
          onClick={onOpenNovoUsuario}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Cadastrar Novo Usuário</span>
        </button>
      </div>

      {/* RBAC Matrix Explanatory Card */}
      <div className="bg-slate-900 rounded-xl p-3.5 border border-slate-800 text-white shadow-xs">
        <div className="flex items-center gap-2 mb-1.5">
          <Lock className="w-3.5 h-3.5 text-red-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-red-300">Regras de Acesso Baseadas em Funções (RBAC)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-slate-300">
          <div className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/60">
            <strong className="text-white flex items-center gap-1 mb-0.5 text-xs">
              <Shield className="w-3 h-3 text-red-400" />
              <span>Perfil Administrador (`admin`):</span>
            </strong>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Acesso irrestrito a todas as obras da Brasal, aprovação de compras e validação legal de ASOs/SST, cadastro de novos usuários e alteração de orçamentos globais.
            </p>
          </div>
          <div className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/60">
            <strong className="text-white flex items-center gap-1 mb-0.5 text-xs">
              <Building className="w-3 h-3 text-blue-400" />
              <span>Perfil Gestor de Obra (`gestor`):</span>
            </strong>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Acesso estritamente restrito à sua obra atribuída (`obra_id`). Pode movimentar almoxarifado local, registrar colaboradores de campo, solicitar compras e executar vistorias.
            </p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px] lg:min-w-full">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-48">Usuário</th>
                <th className="px-2.5 py-1.5 sm:px-3 sm:py-2">E-mail Corporativo</th>
                <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-32">Perfil de Acesso</th>
                <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-44">Obra Designada</th>
                <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-28">Cadastro</th>
                <th className="px-2.5 py-1.5 sm:px-3 sm:py-2 w-16 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="odd:bg-white even:bg-slate-50/70 hover:bg-red-50/40 transition-colors">
                  <td className="px-2.5 py-1.5 sm:px-3 sm:py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-red-100 text-red-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                        {user.nome.charAt(0)}
                      </div>
                      <div className="truncate">
                        <strong className="text-slate-900 block truncate">{user.nome}</strong>
                        <span className="text-[9px] text-slate-400 font-mono">ID: #{user.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-slate-700 font-medium truncate">
                    <div>{user.email}</div>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                      <KeyRound className="w-2.5 h-2.5 text-slate-400" />
                      <span>Senha: {user.senha || '123456'}</span>
                    </div>
                  </td>
                  <td className="px-2.5 py-1.5 sm:px-3 sm:py-2">
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      user.tipo === 'admin' 
                        ? 'bg-red-100 text-red-800 border border-red-300' 
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}>
                      {user.tipo === 'admin' ? 'Administrador' : 'Gestor'}
                    </span>
                  </td>
                  <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-slate-600 font-medium truncate">
                    {user.tipo === 'admin' ? 'Acesso Global' : (user.obra_nome || 'Não vinculado')}
                  </td>
                  <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 font-mono text-slate-500">{user.created_at || '2025-01-01'}</td>
                  <td className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-right">
                    {user.id !== currentUser.id && (
                      <button
                        onClick={() => onDeleteUsuario(user.id)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remover acesso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                    Nenhum usuário encontrado.
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
