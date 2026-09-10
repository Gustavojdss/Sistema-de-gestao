import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  HardHat, 
  KeyRound, 
  HelpCircle, 
  X,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { Usuario } from '../types/erp';

interface LoginScreenProps {
  usuarios: Usuario[];
  onLoginSuccess: (usuario: Usuario, rememberMe: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ usuarios, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successUser, setSuccessUser] = useState<Usuario | null>(null);
  const [modalForgot, setModalForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotFeedback, setForgotFeedback] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const cleanEmail = email.trim().toLowerCase();
      const user = usuarios.find(u => u.email.toLowerCase() === cleanEmail);

      if (!user) {
        setIsLoading(false);
        setErrorMessage('E-mail corporativo não cadastrado no sistema.');
        return;
      }

      if (!user.ativo) {
        setIsLoading(false);
        setErrorMessage('Esta conta de usuário foi inativada pelo Administrador.');
        return;
      }

      // Check password: if user has a password, verify it; otherwise fallback or accept standard
      const validPassword = user.senha || '123456';
      // In development/demo, also accept 'admin' for admin, or '123' / '123456'
      const isPasswordValid = senha === validPassword || (user.tipo === 'admin' && senha === 'admin') || senha === '123456' || senha === '123';

      if (!isPasswordValid) {
        setIsLoading(false);
        setErrorMessage('Senha incorreta. Tente novamente ou use os atalhos de demonstração.');
        return;
      }

      // Successful login
      setSuccessUser(user);
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(user, rememberMe);
      }, 500);
    }, 600);
  };

  const handleQuickLogin = (user: Usuario, passwordOverride?: string) => {
    setEmail(user.email);
    setSenha(passwordOverride || user.senha || '123');
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      setSuccessUser(user);
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(user, true);
      }, 400);
    }, 500);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotFeedback(`Um link seguro de redefinição de credenciais foi enviado para ${forgotEmail || 'seu e-mail'}. Verifique sua caixa corporativa.`);
    setTimeout(() => {
      setForgotFeedback(null);
      setModalForgot(false);
      setForgotEmail('');
    }, 3500);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-red-700 selection:text-white relative overflow-hidden">
      
      {/* Background Decorative Architecture Grid & Light Effects */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#991b1b_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-slate-800/40 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="relative z-10 w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-700 to-red-950 border border-red-500/40 flex items-center justify-center shadow-lg shadow-red-950/50">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-wider text-base text-white">BRASAL</span>
              <span className="font-light tracking-widest text-xs text-red-400">ENGENHARIA</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">ERP Construção Civil & Arquitetura</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] text-slate-300">Ambiente Protegido TLS 1.3</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] text-slate-400">Servidores Operacionais</span>
          </div>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-200">
          
          {/* Card Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-900/40 border border-red-600/40 text-red-400 mb-3 shadow-inner">
              <HardHat className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">Portal de Acesso Operacional</h1>
            <p className="text-xs text-slate-400 mt-1">
              Informe suas credenciais corporativas Brasal para acessar canteiros e módulos executivos.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/80 flex items-start gap-2.5 text-xs text-red-200 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Success Banner */}
          {successUser && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 flex items-center gap-2.5 text-xs text-emerald-200 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>Sessão autorizada! Carregando painel de {successUser.nome}...</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                E-mail Corporativo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: admin@brasal.com.br"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Senha de Acesso
                </label>
                <button
                  type="button"
                  onClick={() => setModalForgot(true)}
                  className="text-[11px] text-red-400 hover:text-red-300 transition-colors font-medium"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-red-600 focus:ring-red-600 focus:ring-offset-slate-900 rounded-sm"
                />
                <span className="text-xs text-slate-300">Lembrar-me neste navegador</span>
              </label>

              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                <Cpu className="w-3 h-3 text-slate-500" />
                v2.5.0
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-red-800 to-red-700 hover:from-red-700 hover:to-red-600 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-950/50 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Autenticando credenciais...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema ERP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <span className="relative px-3 bg-slate-900 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Atalhos Rápidos de Acesso (RBAC)
            </span>
          </div>

          {/* Quick Demo Accounts */}
          <div className="space-y-1.5">
            <div className="text-[11px] text-slate-400 mb-1.5 text-center">
              Clique em um perfil abaixo para login instantâneo com permissões pré-configuradas:
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {usuarios.slice(0, 3).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u)}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 hover:border-red-700/50 transition-all text-left text-xs cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-6 h-6 rounded-lg bg-red-900/40 text-red-300 border border-red-800/40 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {u.nome.charAt(0)}
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-slate-200 group-hover:text-white truncate">
                        {u.nome}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {u.email}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase shrink-0 ${
                    u.tipo === 'admin'
                      ? 'bg-red-950 text-red-300 border border-red-800/50'
                      : 'bg-blue-950 text-blue-300 border border-blue-800/50'
                  }`}>
                    {u.tipo === 'admin' ? 'Acesso Global' : 'Residente'}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 py-4 px-6 border-t border-slate-900 bg-slate-950/90 text-center text-xs text-slate-500">
        <div className="flex flex-col sm:flex-row items-center justify-between max-w-4xl mx-auto gap-2">
          <div>
            © {new Date().getFullYear()} Brasal Engenharia • Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Segurança da Informação</span>
            <span>•</span>
            <span>Suporte TI: ramal 4420</span>
            <span>•</span>
            <span className="font-mono text-emerald-400">JWT Token Active</span>
          </div>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {modalForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-white text-base">Recuperação de Credenciais</h3>
              </div>
              <button 
                onClick={() => setModalForgot(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotFeedback ? (
              <div className="my-4 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-200 leading-relaxed">
                {forgotFeedback}
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4 my-4 text-xs">
                <p className="text-slate-300 leading-relaxed">
                  Digite seu e-mail corporativo cadastrado na Brasal Engenharia. Um token de validação será gerado para reset de senha.
                </p>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">E-mail Cadastrado</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="seu.nome@brasal.com.br"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-600"
                  />
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div className="font-bold text-slate-300 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-red-400" />
                    Central de Atendimento Técnico
                  </div>
                  <p>Para desbloqueio imediato de perfil ou liberação de segundo fator (2FA), contate o Administrador Geral ou o setor de TI da Matriz.</p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalForgot(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-md cursor-pointer"
                  >
                    Enviar Instruções
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
