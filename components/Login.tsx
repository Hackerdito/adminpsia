
import React, { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, ADMIN_EMAILS } from '../services/firebase';
import { ShieldCheck, AlertCircle, Mail, Lock, ChevronRight, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Helper to check permissions
  const checkPermissions = async (user: any) => {
    // 1. Check Hardcoded List
    if (user.email && ADMIN_EMAILS.includes(user.email)) {
      return true;
    }
    
    // 2. Check Database Role
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'admin' || userData.role === 'superadmin') {
          return true;
        }
      }
    } catch (e) {
      console.error("Error checking permissions", e);
    }
    return false;
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      const hasPermission = await checkPermissions(result.user);
      
      if (!hasPermission) {
        await auth.signOut();
        setError("Acceso denegado. No tienes permisos de administrador.");
      }
      // If success, App.tsx will handle the state change via onAuthStateChanged
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain') {
        setError(`Dominio no autorizado (${window.location.hostname}). Agrega este dominio en Firebase Console > Authentication > Settings > Authorized Domains.`);
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError("Inicio de sesión cancelado.");
      } else {
        setError("Error al iniciar sesión con Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      const hasPermission = await checkPermissions(result.user);

      if (!hasPermission) {
        await auth.signOut();
        setError("Acceso denegado. No tienes permisos de administrador.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Credenciales inválidas o error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-200/40 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white z-10 transition-all duration-300">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Administración PSIA</h2>
          <p className="text-slate-500 mt-2">Panel de Control & Analytics</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-fade-in">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-red-600 font-medium break-words">{error}</p>
          </div>
        )}

        {!isEmailMode ? (
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-4 px-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
              ) : (
                <>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  <span className="group-hover:text-slate-900">Iniciar sesión con Google</span>
                </>
              )}
            </button>

            <button 
              onClick={() => setIsEmailMode(true)}
              className="w-full py-3 text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors flex items-center justify-center gap-1"
            >
              Usar correo y contraseña <ChevronRight size={14} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmailLogin} className="space-y-4 animate-fade-in">
             <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    placeholder="correo@ejemplo.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Contraseña" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
             </div>

             <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 text-white font-semibold py-3 px-4 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Iniciar Sesión"}
                </button>
             </div>

             <button 
                type="button"
                onClick={() => setIsEmailMode(false)}
                className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Volver a Google
              </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            Acceso restringido únicamente a personal autorizado.<br/>
            Contacta a soporte si necesitas acceso.
          </p>
        </div>
      </div>
    </div>
  );
};
