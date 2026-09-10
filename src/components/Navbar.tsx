import React, { useState } from 'react';
import { 
  Building2, 
  Bell, 
  UserCheck, 
  Shield, 
  HardHat, 
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Truck,
  LogOut
} from 'lucide-react';
import { Usuario, Obra, Notificacao } from '../types/erp';

interface NavbarProps {
  currentMode: 'erp' | 'docs' | 'api';
  setCurrentMode: (mode: 'erp' | 'docs' | 'api') => void;
  currentUser: Usuario;
  setCurrentUser: (user: Usuario) => void;
  usuariosList: Usuario[];
  obrasList: Obra[];
  selectedObraId: number | 'all';
  setSelectedObraId: (id: number | 'all') => void;
  notificacoes: Notificacao[];
  onMarkNotificacaoLida: (id: number) => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  setCurrentMode,
  currentUser,
  setCurrentUser,
  usuariosList,
  obrasList,
  selectedObraId,
  setSelectedObraId,
  notificacoes,
  onMarkNotificacaoLida,
  onLogout
}) => {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadNotifs = notificacoes.filter(n => !n.lida);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-[1700px] mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 gap-3">
          
          {/* Logo Brasal */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center shadow-md shadow-red-900/40 border border-red-500/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-base tracking-tight text-white">BRASAL</span>
                <span className="font-light text-base tracking-wider text-red-400">ENGENHARIA</span>
              </div>
              <p className="text-[9px] text-slate-400 tracking-wider uppercase font-medium">ERP Construção Civil & Arquitetura</p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="hidden md:flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/60 shadow-inner">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-800 text-white shadow-md shadow-red-950/50">
              <HardHat className="w-4 h-4" />
              <span>Sistema ERP</span>
            </div>
          </div>

          {/* Right Tools: Site Selector & User Role */}
          <div className="flex items-center gap-3">
            {/* Site selector when in ERP mode */}
            {currentMode === 'erp' && (
              <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">Obra:</span>
                <select
                  aria-label="Selecionar Obra"
                  value={selectedObraId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedObraId(val === 'all' ? 'all' : Number(val));
                  }}
                  className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="bg-slate-800 text-white">Todas as Obras ({obrasList.length})</option>
                  {obrasList.map(o => (
                    <option key={o.id} value={o.id} className="bg-slate-800 text-white">
                      {o.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Notificações do Sistema"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden text-slate-200">
                  <div className="p-3 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-bold text-white">Notificações da Central</span>
                    </div>
                    <span className="text-[11px] bg-red-950 text-red-400 border border-red-800/50 px-2 py-0.5 rounded-full font-semibold">
                      {unreadNotifs.length} novas
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800">
                    {notificacoes.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">Nenhuma notificação registrada.</div>
                    ) : (
                      notificacoes.map((n) => (
                        <div 
                          key={n.id} 
                          className={`p-3 text-xs transition-colors flex items-start gap-2.5 ${n.lida ? 'opacity-60 bg-slate-900' : 'bg-slate-800/40 hover:bg-slate-800'}`}
                        >
                          <div className="mt-0.5">
                            {n.tipo === 'estoque' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                            {n.tipo === 'documento' && <FileText className="w-4 h-4 text-blue-400" />}
                            {n.tipo === 'transferencia' && <Truck className="w-4 h-4 text-emerald-400" />}
                            {n.tipo === 'vistoria' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                            {n.tipo === 'sistema' && <Building2 className="w-4 h-4 text-slate-400" />}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-white flex items-center justify-between">
                              <span>{n.titulo}</span>
                              <span className="text-[10px] text-slate-400 font-normal">{n.created_at.split(' ')[1] || ''}</span>
                            </div>
                            <p className="text-slate-300 mt-1 leading-relaxed text-[11px]">{n.mensagem}</p>
                            {!n.lida && (
                              <button
                                onClick={() => onMarkNotificacaoLida(n.id)}
                                className="mt-1.5 text-[10px] font-semibold text-red-400 hover:text-red-300 underline"
                              >
                                Marcar como lida
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 bg-slate-800/90 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-left transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-red-900/60 border border-red-600/40 flex items-center justify-center font-bold text-red-300 text-xs">
                  {currentUser.nome.charAt(0)}
                </div>
                <div className="hidden lg:block">
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    {currentUser.nome.split(' ')[0]}
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      currentUser.tipo === 'admin' ? 'bg-red-900/80 text-red-200 border border-red-600/40' : 'bg-blue-900/80 text-blue-200 border border-blue-600/40'
                    }`}>
                      {currentUser.tipo}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    {currentUser.obra_nome || 'Acesso Total'}
                  </div>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-2 text-slate-200">
                  <div className="p-2.5 border-b border-slate-800">
                    <p className="text-xs font-bold text-white">{currentUser.nome}</p>
                    <p className="text-[11px] text-slate-400">{currentUser.email}</p>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-red-400 font-medium">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Perfil Ativo: {currentUser.tipo === 'admin' ? 'Administrador (Total)' : 'Gestor de Obra'}</span>
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Simular Outro Usuário (RBAC):</p>
                    <div className="space-y-1 mt-1">
                      {usuariosList.map(u => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setCurrentUser(u);
                            setShowUserMenu(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            u.id === currentUser.id ? 'bg-red-900/40 text-red-300 border border-red-700/40' : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <div>
                            <p className="font-semibold text-white">{u.nome}</p>
                            <p className="text-[10px] text-slate-400">{u.tipo === 'admin' ? 'Acesso Global' : u.obra_nome}</p>
                          </div>
                          {u.id === currentUser.id && <UserCheck className="w-4 h-4 text-red-400" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {onLogout && (
                    <div className="p-2 border-t border-slate-800">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs font-bold text-red-400 hover:text-white bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Encerrar Sessão</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Sair do Sistema (Logout)"
                className="hidden sm:flex items-center gap-1.5 p-2 bg-slate-800/80 hover:bg-red-950/60 text-slate-400 hover:text-red-300 border border-slate-700/80 hover:border-red-800/60 rounded-xl transition-all text-xs font-semibold cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden xl:inline text-[11px]">Sair</span>
              </button>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};
