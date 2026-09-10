import React from 'react';
import { 
  LayoutDashboard, 
  Building, 
  Boxes, 
  ClipboardList, 
  Users, 
  FileCheck2, 
  CalendarCheck, 
  ShieldAlert, 
  History
} from 'lucide-react';
import { Usuario } from '../types/erp';

export type ErpTab = 
  | 'dashboard'
  | 'obras'
  | 'almoxarifado'
  | 'materiais'
  | 'equipe'
  | 'documentos'
  | 'vistorias'
  | 'usuarios'
  | 'auditoria';

interface SidebarProps {
  activeTab: ErpTab;
  setActiveTab: (tab: ErpTab) => void;
  currentUser: Usuario;
  stats: {
    documentosPendentes: number;
    solicitacoesPendentes: number;
    itensAtrasados: number;
    vistoriasPendentes: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  stats
}) => {
  const menuItems: { id: ErpTab; label: string; icon: React.FC<{ className?: string }>; badge?: number; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'obras', label: 'Gestão de Obras', icon: Building },
    { id: 'almoxarifado', label: 'Almoxarifado (Ferramentas)', icon: Boxes, badge: stats.itensAtrasados },
    { id: 'materiais', label: 'Materiais de Consumo', icon: ClipboardList, badge: stats.solicitacoesPendentes },
    { id: 'equipe', label: 'Equipe de Obra', icon: Users },
    { id: 'documentos', label: 'Validação Documentos', icon: FileCheck2, badge: stats.documentosPendentes, adminOnly: true },
    { id: 'vistorias', label: 'Vistorias & Auditorias', icon: CalendarCheck, badge: stats.vistoriasPendentes },
    { id: 'usuarios', label: 'Gestão de Usuários', icon: ShieldAlert, adminOnly: true },
    { id: 'auditoria', label: 'Trilha de Auditoria', icon: History }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 h-[calc(100vh-3.5rem)] sticky top-14 select-none overflow-hidden">
      
      {/* Scope Badge */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
        <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400 mb-1">Escopo de Trabalho</div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-semibold text-white truncate">
            {currentUser.tipo === 'admin' ? 'Painel Corporativo Geral' : (currentUser.obra_nome || 'Obra Atribuída')}
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav 
        id="sidebar-navigation-menu"
        className="p-3 space-y-1.5 flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-smooth sidebar-scroll focus:outline-none"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
      >
        {menuItems.map((item) => {
          if (item.adminOnly && currentUser.tipo !== 'admin') {
            return null;
          }
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-red-800 to-red-900 text-white font-semibold shadow-lg shadow-red-950/50 border border-red-700/50'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-red-200' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-white text-red-900' : 'bg-red-900/80 text-red-300 border border-red-700/40'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

    </aside>
  );
};
