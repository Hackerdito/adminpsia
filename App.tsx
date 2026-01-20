
import React, { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signOut, User, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { collection, getDocs, onSnapshot, orderBy, query, setDoc, doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
// Fixed modular imports for secondary app management
import { initializeApp, deleteApp } from 'firebase/app';
import { auth, db, ADMIN_EMAILS, firebaseConfig, googleProvider } from './services/firebase';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { StatCard } from './components/StatCard';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ReportsView } from './components/ReportsView';
import { UserData, WidgetUsage } from './types';
import { Users, Layout, Clock, Activity, Plus, Trash2, Edit2, Save, X, Eye, EyeOff, Search, ShieldCheck, Lock, ArrowLeft, Copy, Check } from 'lucide-react';


const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Super Admin Mode State
  const [superAdminMode, setSuperAdminMode] = useState(false);
  const [verifyingSuperAdmin, setVerifyingSuperAdmin] = useState(false);
  const SUPER_ADMIN_EMAIL = 'gerardo.rodriguez@kuepa.com';

  // Data State
  const [usersData, setUsersData] = useState<UserData[]>([]);
  const [widgetUsage, setWidgetUsage] = useState<WidgetUsage[]>([]);

  // Realtime subscription (Activity / widgetUsage)
  const widgetsUnsubRef = useRef<null | (() => void)>(null);


  // Form State
  const [newUser, setNewUser] = useState({ nombre: '', email: '', password: '', duracion: 3, role: 'user' });
  const [newAdmin, setNewAdmin] = useState({ nombre: '', email: '', password: '', role: 'admin' }); // Separate state for admin creation
  
  // UI States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDuration, setEditDuration] = useState(3);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [showNewAdminPassword, setShowNewAdminPassword] = useState(false); // Toggle for new admin form
  const [copiedId, setCopiedId] = useState<string | null>(null); // Feedback for copy action
  
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Users Search
  const [userSearch, setUserSearch] = useState('');
  const normalizedUserSearch = userSearch.trim().toLowerCase();

  // Filters
  const regularUsers = usersData.filter(u => u.role !== 'admin' && u.role !== 'superadmin');
  const adminUsers = usersData.filter(u => u.role === 'admin' || u.role === 'superadmin');

  const filteredUsers = normalizedUserSearch
    ? regularUsers.filter(u => (
      (u.nombre || '').toLowerCase().includes(normalizedUserSearch) ||
      (u.email || '').toLowerCase().includes(normalizedUserSearch)
    ))
    : regularUsers;

  const filteredAdmins = normalizedUserSearch
    ? adminUsers.filter(u => (
      (u.nombre || '').toLowerCase().includes(normalizedUserSearch) ||
      (u.email || '').toLowerCase().includes(normalizedUserSearch)
    ))
    : adminUsers;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        let hasAccess = false;

        // 1. Check if in hardcoded list
        if (ADMIN_EMAILS.includes(currentUser.email || '')) {
          hasAccess = true;
        } else {
          // 2. Check if has admin role in DB
          try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              if (userData.role === 'admin' || userData.role === 'superadmin') {
                hasAccess = true;
              }
            }
          } catch (e) {
            console.error("Error verifying user role", e);
          }
        }

        if (hasAccess) {
          setUser(currentUser);
          fetchData();
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => {
      try { unsubscribe(); } catch {}
      if (widgetsUnsubRef.current) {
        try { widgetsUnsubRef.current(); } catch {}
        widgetsUnsubRef.current = null;
      }
    };
  }, []);

  const fetchData = async () => {
    try {
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const userSnap = await getDocs(usersQuery);

      const loadedUsers: UserData[] = userSnap.docs.map(doc => {
        const data = doc.data() as any;
        return {
          ...data,
          uid: doc.id,
          id: doc.id
        } as UserData;
      });
      setUsersData(loadedUsers);
      
      const widgetsQuery = query(collection(db, 'widgetUsage'), orderBy('startedAt', 'desc'));

      if (widgetsUnsubRef.current) {
        try { widgetsUnsubRef.current(); } catch {}
        widgetsUnsubRef.current = null;
      }

      widgetsUnsubRef.current = onSnapshot(widgetsQuery, (snapshot: any) => {
        const liveWidgets: WidgetUsage[] = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as WidgetUsage));
        setWidgetUsage(liveWidgets);
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  // --- SUPER ADMIN LOGIC ---
  const handleOpenSuperAdmin = () => {
    setVerifyingSuperAdmin(true);
  };

  const handleVerifySuperAdmin = async () => {
    try {
      // Force re-authentication or check with popup
      const provider = new GoogleAuthProvider();
      // Use prompt select_account to ensure they pick the right one
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      
      if (result.user.email === SUPER_ADMIN_EMAIL) {
        setSuperAdminMode(true);
        setVerifyingSuperAdmin(false);
        setActiveTab('users'); // Go to users view in admin mode
      } else {
        alert("Acceso denegado. Este correo no tiene permisos de Super Admin.");
        // We do NOT sign them out of the main app, just deny the special mode
      }
    } catch (e) {
      console.error("Super admin verification failed", e);
    }
  };

  const handleExitSuperAdmin = () => {
    setSuperAdminMode(false);
    // Return to dashboard
    setActiveTab('dashboard');
  };
  
  const handleCopyPassword = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  // -------------------------

  const calculateExpiry = (months: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleAddUserGeneric = async (userData: typeof newUser, isSuperAdminAction: boolean) => {
    if (!userData.email || !userData.password || !userData.nombre) return alert("Completa todos los campos");
    if (userData.password.length < 6) return alert("Contraseña mínima de 6 caracteres");

    setIsCreatingUser(true);
    let secondaryApp: any = null;
    let createdAuthUser: User | null = null;
    const creatorEmail = auth.currentUser?.email || 'admin@system';

    // If super admin creating an admin, duration is usually unlimited or fixed, logic below handles numbers
    // Admins usually don't expire, but we need a date. Let's give admins 10 years by default if not specified
    const durationToUse = isSuperAdminAction ? 120 : userData.duracion; 
    
    const fechaInicio = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const fechaVencimiento = calculateExpiry(durationToUse);

    try {
      const appName = `SecondaryApp_${Date.now()}`;
      secondaryApp = initializeApp(firebaseConfig, appName);
      const secondaryAuth = getAuth(secondaryApp);

      const userCred = await createUserWithEmailAndPassword(secondaryAuth, userData.email, userData.password);
      createdAuthUser = userCred.user;
      const newUid = userCred.user.uid;

      const firestoreData = {
        uid: newUid,
        nombre: userData.nombre,
        email: userData.email,
        password: userData.password,
        duracion: Number(durationToUse),
        fechaInicio: fechaInicio,
        fechaVencimiento: fechaVencimiento,
        role: userData.role, // 'user' or 'admin'
        createdAt: new Date(),
        createdBy: creatorEmail
      };

      await setDoc(doc(db, 'users', newUid), firestoreData);

      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);

      // Reset forms
      if (isSuperAdminAction) {
         setNewAdmin({ nombre: '', email: '', password: '', role: 'admin' });
      } else {
         setNewUser({ nombre: '', email: '', password: '', duracion: 3, role: 'user' });
      }
      
      await fetchData();
      alert(isSuperAdminAction ? "Administrador creado exitosamente." : "Usuario creado exitosamente.");

    } catch (e: any) {
      console.error("Error creating user:", e);
      if (createdAuthUser && e.code !== 'auth/email-already-in-use') {
        try { await deleteUser(createdAuthUser); } catch {}
      }
      if (e.code === 'auth/email-already-in-use') {
        alert("El correo ya existe en el sistema.");
      } else {
        alert("Error: " + (e.message || "Desconocido"));
      }
      if (secondaryApp) { try { await deleteApp(secondaryApp); } catch { } }
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (docId: string) => {
    const userToDelete = usersData.find(u => u.id === docId);
    if (!userToDelete) return;
    if (!window.confirm(`¿Confirmar eliminación de ${userToDelete.nombre}?`)) return;

    setIsDeletingUser(true);
    let secondaryApp: any = null;

    if ((userToDelete as any).password) {
      try {
        const appName = `DeleteApp_${Date.now()}`;
        secondaryApp = initializeApp(firebaseConfig, appName);
        const secondaryAuth = getAuth(secondaryApp);
        const userCredential = await signInWithEmailAndPassword(secondaryAuth, userToDelete.email, (userToDelete as any).password);
        await deleteUser(userCredential.user);
      } catch (authErr: any) {
        console.warn("Auth Delete Warning:", authErr.code);
      } finally {
        if (secondaryApp) { try { await deleteApp(secondaryApp); } catch {} }
      }
    }

    try {
      await deleteDoc(doc(db, 'users', docId));
      setUsersData(prev => prev.filter(u => u.id !== docId));
      setTimeout(() => { alert("Eliminado correctamente."); fetchData(); }, 100);
    } catch (dbErr: any) {
      alert(`ERROR DB: ${dbErr.message}`);
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleUpdateDuration = async (id: string) => {
    try {
      await updateDoc(doc(db, 'users', id), {
        duracion: editDuration,
        fechaVencimiento: calculateExpiry(editDuration)
      });
      setEditingId(null);
      fetchData();
      alert("Duración actualizada.");
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const togglePassword = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!user) return <Login />;

  // --- RENDER: SUPER ADMIN VERIFICATION MODAL ---
  if (verifyingSuperAdmin) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-orange-500"></div>
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Zona Restringida</h2>
          <p className="text-slate-500 mb-8">
            Esta sección es exclusiva para la gestión de administradores. 
            Por favor, verifica tu identidad con una cuenta autorizada.
          </p>
          
          <button 
            onClick={handleVerifySuperAdmin}
            className="w-full bg-white border border-slate-200 text-slate-700 font-semibold py-4 px-4 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm mb-3"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Verificar con Google
          </button>
          
          <button 
            onClick={() => setVerifyingSuperAdmin(false)}
            className="w-full text-slate-400 font-medium py-2 hover:text-slate-600 text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: SUPER ADMIN INTERFACE ---
  if (superAdminMode) {
    return (
      <div className="min-h-screen bg-slate-900 text-white font-sans">
        <div className="max-w-7xl mx-auto p-4 lg:p-8">
           <header className="flex justify-between items-center mb-10 border-b border-slate-700 pb-6">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-red-500/20 rounded-2xl border border-red-500/50">
                 <ShieldCheck size={32} className="text-red-500" />
               </div>
               <div>
                 <h1 className="text-3xl font-bold tracking-tight text-white">Gestión de Administradores</h1>
                 <p className="text-slate-400">Modo Seguro - {SUPER_ADMIN_EMAIL}</p>
               </div>
             </div>
             <button 
               onClick={handleExitSuperAdmin}
               className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 border border-white/10"
             >
               <ArrowLeft size={18} />
               Salir del Modo Admin
             </button>
           </header>

           <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* CREATE ADMIN FORM */}
              <div className="xl:col-span-1">
                <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Plus size={20} className="text-red-400" />
                    Nuevo Administrador
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Nombre</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                        value={newAdmin.nombre} onChange={e => setNewAdmin({ ...newAdmin, nombre: e.target.value })}
                        placeholder="Nombre del Admin"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Correo Electrónico</label>
                      <input
                        type="email"
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                        value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                        placeholder="admin@kuepa.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Contraseña</label>
                      <div className="relative">
                        <input
                          type={showNewAdminPassword ? "text" : "password"}
                          className="w-full bg-slate-900 border border-slate-600 rounded-xl pl-4 pr-10 py-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                          value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewAdminPassword(!showNewAdminPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        >
                          {showNewAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddUserGeneric({...newAdmin, duracion: 120} as any, true)}
                      disabled={isCreatingUser}
                      className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-900/20 transition-all mt-4 flex justify-center"
                    >
                       {isCreatingUser ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Crear Administrador'}
                    </button>
                  </div>
                </div>
              </div>

              {/* ADMIN LIST */}
              <div className="xl:col-span-2 space-y-4">
                 <div className="bg-slate-800/50 p-4 rounded-2xl flex items-center gap-3 border border-slate-700">
                    <Search className="text-slate-400" size={20} />
                    <input 
                      type="text" 
                      placeholder="Buscar admin..." 
                      className="bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-500 flex-1 outline-none"
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                    />
                 </div>

                 {filteredAdmins.map(admin => (
                   <div key={admin.id} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-xl font-bold text-slate-300">
                          {admin.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-lg">{admin.nombre}</h4>
                          <p className="text-slate-400 text-sm">{admin.email}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-900/30 text-red-400 border border-red-500/20">
                            ADMINISTRADOR
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                         <div className="bg-slate-900 px-3 py-2 rounded-lg border border-slate-700 flex items-center gap-3">
                           <span className="text-slate-400 text-sm font-mono min-w-[60px]">
                             {visiblePasswords[admin.id] ? (admin as any).password || 'N/A' : '••••••'}
                           </span>
                           
                           <div className="flex items-center gap-2 border-l border-slate-700 pl-2">
                             <button 
                                onClick={() => handleCopyPassword((admin as any).password || '', admin.id)}
                                className="text-slate-500 hover:text-white transition-colors"
                                title="Copiar contraseña"
                              >
                                {copiedId === admin.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                             </button>
                             <button 
                                onClick={() => togglePassword(admin.id)} 
                                className="text-slate-500 hover:text-white transition-colors"
                                title="Ver contraseña"
                             >
                               {visiblePasswords[admin.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                             </button>
                           </div>
                         </div>
                         <button
                            onClick={() => handleDeleteUser(admin.id)}
                            className="p-3 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors border border-red-500/20"
                            title="Eliminar Admin"
                          >
                            <Trash2 size={18} />
                          </button>
                      </div>
                   </div>
                 ))}
                 
                 {filteredAdmins.length === 0 && (
                   <div className="text-center py-12 text-slate-500">
                     No se encontraron administradores.
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    );
  }

  // --- RENDER: STANDARD DASHBOARD ---
  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
        onOpenSuperAdmin={handleOpenSuperAdmin} 
      />

      <main className="flex-1 ml-20 lg:ml-64 p-4 lg:p-8 transition-all duration-300">

        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              {activeTab === 'dashboard' && 'Dashboard General'}
              {activeTab === 'analytics' && 'Analytics'}
              {activeTab === 'users' && 'Gestión de Usuarios'}
              {activeTab === 'reports' && 'Reportes & Exportación'}
            </h1>
            <p className="text-slate-500 mt-1">Bienvenido, {user.displayName || 'Admin'}</p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-sm font-medium text-slate-600">Sistema Operativo</span>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Usuarios" value={usersData.length} icon={<Users size={24} />} color="blue" trend="+12%" />
              <StatCard title="Widgets Usados" value={widgetUsage.length} icon={<Layout size={24} />} color="purple" trend="+5%" />
              <StatCard title="Tiempo Promedio" value="12m" icon={<Clock size={24} />} color="orange" />
              <StatCard title="Activos Hoy" value={Math.floor(usersData.length * 0.4)} icon={<Activity size={24} />} color="green" />
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Última Actividad</h3>
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="p-4 text-sm font-semibold text-slate-500">Usuario</th>
                        <th className="p-4 text-sm font-semibold text-slate-500">Acción</th>
                        <th className="p-4 text-sm font-semibold text-slate-500">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {widgetUsage.slice(0, 5).map((w, i) => (
                        <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-medium text-slate-700">{w.email}</td>
                          <td className="p-4 text-slate-600">Usó <span className="font-semibold text-blue-600">{w.widgetTitle || w.widgetId}</span></td>
                          <td className="p-4 text-slate-400 text-sm">
                            {w.startedAt?.toDate ? w.startedAt.toDate().toLocaleDateString() : 'Reciente'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard users={usersData} widgetUsage={widgetUsage} />
        )}

        {activeTab === 'reports' && (
          <ReportsView users={usersData} widgetUsage={widgetUsage} />
        )}

        {activeTab === 'users' && (
          <div className="space-y-8 animate-fade-in">
            {/* Add STANDARD User Form */}
            <div className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Plus size={20} /></div>
                Nuevo Usuario Estándar
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input
                  type="text" placeholder="Nombre completo"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={newUser.nombre} onChange={e => setNewUser({ ...newUser, nombre: e.target.value })}
                />
                <input
                  type="email" placeholder="Correo electrónico"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                />
                <input
                  type="password" placeholder="Contraseña temp."
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                />
                <div className="flex gap-2">
                  <select
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all flex-1"
                    value={newUser.duracion} onChange={e => setNewUser({ ...newUser, duracion: parseInt(e.target.value) })}
                  >
                    <option value={1}>1 Mes</option>
                    <option value={3}>3 Meses</option>
                    <option value={6}>6 Meses</option>
                    <option value={12}>1 Año</option>
                  </select>
                  {/* Removed Role Selector - Defaults to 'user' */}
                  <button
                    onClick={() => handleAddUserGeneric(newUser, false)}
                    disabled={isCreatingUser}
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 flex justify-center items-center min-w-[100px]"
                  >
                    {isCreatingUser ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Agregar'}
                  </button>
                </div>
              </div>
            </div>

            {/* Standard User List */}
            <div className="bg-white p-5 lg:p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Usuarios Activos</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Mostrando <span className="font-semibold text-slate-700">{filteredUsers.length}</span> usuarios
                  </p>
                </div>

                <div className="relative w-full md:max-w-md">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar usuario..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredUsers.map((u) => (
                <div key={u.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xl font-bold text-slate-600">
                      {u.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${u.duracion >= 12 ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                        {u.duracion} {u.duracion === 1 ? 'Mes' : 'Meses'}
                      </span>
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-800 text-lg mb-1">{u.nombre}</h4>
                  <p className="text-slate-500 text-sm mb-4 flex items-center gap-1">
                    <span className="truncate">{u.email}</span>
                  </p>

                  <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Inicio:</span>
                      <span className="font-medium text-slate-700">{u.fechaInicio}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Vence:</span>
                      <span className="font-medium text-slate-700">{u.fechaVencimiento}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-500 pt-1 border-t border-slate-200 mt-1">
                      <span>Pass:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                          {visiblePasswords[u.id] ? (u as any).password : '••••••'}
                        </span>
                        <button onClick={() => togglePassword(u.id)} className="text-slate-400 hover:text-blue-500">
                          {visiblePasswords[u.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {editingId === u.id ? (
                    <div className="bg-blue-50/50 p-3 rounded-xl animate-fade-in border border-blue-100">
                      <label className="text-xs font-bold text-blue-600 block mb-1">Nueva Duración:</label>
                      <div className="flex gap-2">
                        <select
                          className="bg-white border-none text-sm rounded-lg flex-1 py-1 pl-2 shadow-sm"
                          value={editDuration}
                          onChange={(e) => setEditDuration(parseInt(e.target.value))}
                        >
                          <option value={1}>1 Mes</option>
                          <option value={3}>3 Meses</option>
                          <option value={6}>6 Meses</option>
                          <option value={12}>12 Meses</option>
                        </select>
                        <button onClick={() => handleUpdateDuration(u.id)} className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600"><Save size={16} /></button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"><X size={16} /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => { setEditingId(u.id); setEditDuration(u.duracion); }}
                        className="flex-1 bg-white border border-slate-200 text-slate-600 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit2 size={16} /> Editar
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        disabled={isDeletingUser}
                        className="bg-white border border-red-100 text-red-500 py-2 px-3 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {isDeletingUser ? <div className="w-4 h-4 border-2 border-red-200 border-t-red-500 rounded-full animate-spin"></div> : <Trash2 size={16} />}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
