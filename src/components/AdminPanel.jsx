import React, { useState, useEffect } from 'react';
import { X, Lock, Trash2, CheckCircle, ShieldCheck, BarChart3, Clock, Megaphone, LayoutGrid, Plus, MapPin, Users, Key, Eye, UserCircle2, Settings2, LogOut, ShieldAlert, ChevronRight, UserPlus, Shield } from 'lucide-react';
import { db } from '../lib/firebase';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    deleteDoc,
    updateDoc,
    addDoc,
    serverTimestamp,
    getDocs,
    where
} from 'firebase/firestore';

const AdminPanel = ({ onClose, onLogin, isLoggedIn, userProfile, inlineMode = false }) => {
    const [password, setPassword] = useState('');
    const [selectedProfileId, setSelectedProfileId] = useState('master');
    const [activeTab, setActiveAdminTab] = useState('DASHBOARD');
    const [error, setError] = useState('');

    const [posts, setPosts] = useState([]);
    const [ads, setAds] = useState([]);
    const [accessCodes, setAccessCodes] = useState([]);
    const [stats, setStats] = useState({ total: 0, views: 0 });

    const [activeModal, setActiveModal] = useState(null); // 'AD', 'STAFF', 'CONFIG'
    const [newAd, setNewAd] = useState({ title: '', description: '', mediaUrl: '', link: '', ubicacion: 'GENERAL' });
    const [newAccess, setNewAccess] = useState({
        name: '',
        code: '',
        permissions: { posts: true, ads: false, access: false, stats: true }
    });
    const [editPass, setEditPass] = useState('');

    // Cargar perfiles una sola vez
    useEffect(() => {
        const unsubCodes = onSnapshot(collection(db, 'access_codes'), (snapshot) => {
            setAccessCodes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubCodes();
    }, []);

    useEffect(() => {
        if (!isLoggedIn) return;
        const unsubPosts = onSnapshot(query(collection(db, 'postings'), orderBy('fecha_publicacion', 'desc')), (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPosts(docs);
            setStats({ total: docs.length, views: docs.reduce((acc, curr) => acc + (curr.vistas || 0), 0) });
        });
        const unsubAds = onSnapshot(query(collection(db, 'publicidad'), orderBy('createdAt', 'desc')), (snapshot) => {
            setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => { unsubPosts(); unsubAds(); };
    }, [isLoggedIn]);

    const handleLogin = async () => {
        if (!password) return setError('Ingresa la clave');
        setError('');

        if (selectedProfileId === 'master') {
            if (password === 'ofi2026') {
                onLogin(true, { id: 'master', name: 'Dueño de Ofi', role: 'SUPERADMIN', permissions: { posts: true, ads: true, access: true, stats: true } });
                setActiveModal(null);
                setPassword('');
            } else setError('Clave maestra incorrecta');
            return;
        }

        const selected = accessCodes.find(p => p.id === selectedProfileId);
        if (selected && selected.code === password) {
            if (!selected.activo) return setError('Perfil bloqueado');
            onLogin(true, { id: selected.id, name: selected.name, role: 'COLABORADOR', permissions: selected.permissions || { posts: true, stats: true } });
            setActiveModal(null);
            setPassword('');
        } else setError('Clave incorrecta');
    };

    const hasPerm = (p) => userProfile?.permissions?.[p];

    // LOGIN SCREEN (FULL MODAL)
    if (!isLoggedIn && !inlineMode) {
        return (
            <div className="fixed inset-0 z-[200] bg-dark/95 backdrop-blur-3xl flex items-center justify-center p-6 font-sans" onClick={onClose}>
                <div className="bg-white w-full max-w-sm rounded-[48px] shadow-2xl p-10 space-y-8 animate-in zoom-in" onClick={e => e.stopPropagation()}>
                    <div className="flex flex-col items-center gap-4">
                        <div className="bg-slate-50 p-6 rounded-full text-dark shadow-sm"><ShieldAlert size={40} className="text-primary" /></div>
                        <div className="text-center">
                            <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Ofi Central</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Bienvenido de nuevo</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-4">Seleccionar Perfil</label>
                            <select className="select-field h-14 bg-slate-50 border-none font-black text-xs uppercase" value={selectedProfileId} onChange={e => setSelectedProfileId(e.target.value)}>
                                <option value="master">💎 Admin Maestro</option>
                                {accessCodes.filter(p => p.activo).map(p => (
                                    <option key={p.id} value={p.id}>👤 {p.name}</option>
                                ))}
                            </select>
                        </div>
                        <input type="text" placeholder="CLAVE SECRETA" className="input-field h-[70px] text-center text-xl font-black tracking-[0.5em] bg-slate-50 border-none rounded-[28px]" value={password} onChange={e => setPassword(e.target.value)} autoFocus />
                        {error && <p className="text-red-500 text-[9px] font-black uppercase text-center animate-bounce italic">{error}</p>}
                        <button onClick={handleLogin} className="w-full btn-primary h-[70px] rounded-[28px] font-black text-lg shadow-xl shadow-primary/30 uppercase tracking-widest">Entrar Ahora</button>
                    </div>
                    <button onClick={onClose} className="w-full text-slate-300 font-black text-[10px] uppercase tracking-widest">Cerrar</button>
                </div>
            </div>
        );
    }

    return (
        <div className={`${inlineMode ? 'w-full h-full' : 'fixed inset-0 z-[200] bg-slate-50 flex flex-col'} font-sans relative`}>
            {/* Mini Profile Header */}
            <div className="bg-white p-6 border-b border-slate-100 flex justify-between items-center shrink-0 z-30 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-dark rounded-2xl flex items-center justify-center text-white shadow-lg overflow-hidden shrink-0">
                        <UserCircle2 size={24} />
                    </div>
                    <div>
                        <h2 className="text-xs font-black italic tracking-tighter uppercase leading-none">{userProfile?.name}</h2>
                        <p className="text-[8px] font-bold text-primary uppercase tracking-widest mt-1">{userProfile?.role}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setActiveModal('CONFIG')} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-dark transition-colors"><Settings2 size={20} /></button>
                    <button onClick={() => onLogin(false, null)} className="p-3 bg-red-50 text-red-500 rounded-2xl"><LogOut size={20} /></button>
                </div>
            </div>

            {/* Main Navigation Tabs */}
            <div className="flex bg-white px-2 border-b border-slate-100 shrink-0 sticky top-0 z-20">
                {[
                    { id: 'DASHBOARD', icon: <BarChart3 size={18} />, label: 'Resumen', perm: 'stats' },
                    { id: 'POSTS', icon: <LayoutGrid size={18} />, label: 'Moderar', perm: 'posts' },
                    { id: 'ADS', icon: <Megaphone size={18} />, label: 'Ads', perm: 'ads' },
                    { id: 'ACCESOS', icon: <Users size={18} />, label: 'Staff', perm: 'access' }
                ].map(tab => hasPerm(tab.perm) && (
                    <button key={tab.id} onClick={() => setActiveAdminTab(tab.id)} className={`flex-1 flex flex-col items-center gap-1 py-4 border-b-4 transition-all text-[9px] font-black uppercase ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-slate-300'}`}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Dynamic Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 pb-32">
                {activeTab === 'DASHBOARD' && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-6 rounded-[32px] border border-white shadow-xl shadow-slate-100/50">
                                <Eye className="text-primary mb-2" size={20} />
                                <h3 className="text-4xl font-black italic tracking-tighter">{stats.views}</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lecturas Totales</p>
                            </div>
                            <div className="bg-white p-6 rounded-[32px] border border-white shadow-xl shadow-slate-100/50">
                                <LayoutGrid className="text-orange-500 mb-2" size={20} />
                                <h3 className="text-4xl font-black italic tracking-tighter">{stats.total}</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Posts en Red</p>
                            </div>
                        </div>

                        {userProfile?.id === 'master' && (
                            <div className="bg-dark text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in duration-500">
                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-center gap-2 text-primary">
                                        <ShieldCheck size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Estatus: Verificado</span>
                                    </div>
                                    <h4 className="text-2xl font-black italic tracking-tighter leading-none">Tienes el control <br /> total de la Ofi App</h4>
                                </div>
                                <div className="absolute right-[-20px] bottom-[-20px] text-white/5 opacity-50 rotate-12 scale-150"><Shield size={180} /></div>
                            </div>
                        )}
                    </div>
                )}

                {/* ... (Posts, Ads, Staff views similar to before but more polished) ... */}
                {activeTab === 'POSTS' && (
                    <div className="space-y-3">
                        {posts.map(post => (
                            <div key={post.id} className="bg-white p-4 rounded-[28px] border border-white shadow-sm flex items-center justify-between animate-in fade-in">
                                <div className="flex-1 min-w-0 pr-4">
                                    <span className="text-[8px] font-black text-primary uppercase">{post.categoria}</span>
                                    <p className="font-bold text-xs text-dark italic truncate leading-tight">"{post.descripcion}"</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button onClick={async () => await updateDoc(doc(db, 'postings', post.id), { verificado: !post.verificado })} className={`p-4 rounded-2xl border transition-all ${post.verificado ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-slate-50 text-slate-200 border-slate-100'}`}><CheckCircle size={20} /></button>
                                    <button onClick={async () => { if (window.confirm('Delete?')) await deleteDoc(doc(db, 'postings', post.id)) }} className="p-4 bg-red-50 text-red-500 rounded-2xl"><Trash2 size={20} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'ADS' && (
                    <div className="space-y-4">
                        <button onClick={() => setActiveModal('AD')} className="w-full bg-indigo-600 text-white font-black py-6 rounded-[32px] shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 uppercase text-xs tracking-widest italic animate-in zoom-in"><Plus size={24} /> Nueva Campaña</button>
                        {ads.map(ad => (
                            <div key={ad.id} className="bg-white p-3 rounded-[32px] border border-white shadow-sm flex items-center gap-4">
                                <img src={ad.mediaUrl} className="w-16 h-16 rounded-2xl object-cover bg-slate-100" />
                                <div className="flex-1 min-w-0">
                                    <h5 className="font-black text-[10px] text-dark uppercase truncate">{ad.title}</h5>
                                    <span className="text-[8px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full">{ad.ubicacion}</span>
                                </div>
                                <button onClick={async () => await deleteDoc(doc(db, 'publicidad', ad.id))} className="p-4 text-red-300 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'ACCESOS' && (
                    <div className="space-y-4">
                        <button onClick={() => setActiveModal('STAFF')} className="w-full bg-red-600 text-white font-black py-6 rounded-[32px] shadow-xl shadow-red-100 flex items-center justify-center gap-3 uppercase text-xs tracking-widest italic animate-in zoom-in"><UserPlus size={24} /> Nuevo Miembro</button>
                        {accessCodes.map(acc => (
                            <div key={acc.id} className="bg-white p-5 rounded-[32px] border border-white shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-xl ${acc.activo ? 'bg-green-50 text-green-500' : 'bg-slate-100 text-slate-300'}`}><Key size={20} /></div>
                                    <div><h5 className="font-black text-[11px] text-dark uppercase">{acc.name}</h5><p className="font-mono text-[9px] text-slate-400 uppercase">{acc.code}</p></div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={async () => await updateDoc(doc(db, 'access_codes', acc.id), { activo: !acc.activo })} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase ${acc.activo ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>{acc.activo ? 'Bloquear' : 'Activar'}</button>
                                    <button onClick={async () => { if (window.confirm('¿Eliminar colaborador?')) await deleteDoc(doc(db, 'access_codes', acc.id)) }} className="p-3 bg-slate-50 text-slate-300 hover:text-red-500 rounded-2xl transition-colors"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 🚀 MODALES OPTIMIZADOS (UNIFICADOS) */}
            {activeModal && (
                <div className="fixed inset-0 z-[100] bg-dark/80 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={() => setActiveModal(null)}>
                    <div className="bg-white w-full max-w-sm rounded-t-[48px] sm:rounded-[48px] p-8 sm:p-10 space-y-8 animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>

                        {/* HEAD MODAL */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-2xl text-dark">
                                    {activeModal === 'CONFIG' && <Settings2 size={20} />}
                                    {activeModal === 'AD' && <Megaphone size={20} />}
                                    {activeModal === 'STAFF' && <UserPlus size={20} />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none">
                                        {activeModal === 'CONFIG' ? 'Configuración' : activeModal === 'AD' ? 'Publicidad' : 'Acceso Staff'}
                                    </h3>
                                </div>
                            </div>
                            <button onClick={() => setActiveModal(null)} className="p-2 bg-slate-100 rounded-full text-slate-300"><X size={20} /></button>
                        </div>

                        {/* MODAL CONFIG: Cambio de Perfil / Clave */}
                        {activeModal === 'CONFIG' && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm"><Key size={14} className="text-primary" /></div>
                                            <span className="text-[10px] font-black uppercase tracking-widest">Cambiar Usuario</span>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-300" />
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        <select className="select-field h-14 bg-slate-50 font-black text-[10px] uppercase border-none" value={selectedProfileId} onChange={e => setSelectedProfileId(e.target.value)}>
                                            <option value="master">💎 Admin Maestro</option>
                                            {accessCodes.filter(p => p.activo).map(p => <option key={p.id} value={p.id}>👤 {p.name}</option>)}
                                        </select>
                                        <input type="text" placeholder="CLAVE" className="input-field h-14 text-center font-black tracking-widest bg-slate-50 border-none" value={password} onChange={e => setPassword(e.target.value)} />
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={async () => {
                                        if (userProfile.id === 'master') return alert('Clave maestra protegida.');
                                        if (password.length < 4) return alert('Demasiado corta');
                                        await updateDoc(doc(db, 'access_codes', userProfile.id), { code: password });
                                        alert('Clave guardada.'); setPassword('');
                                    }} className="flex-1 h-14 bg-slate-100 text-slate-400 font-black text-[9px] uppercase tracking-widest rounded-2xl">Cambiar Contraseña</button>
                                    <button onClick={handleLogin} className="flex-1 h-14 bg-dark text-white font-black text-[9px] uppercase tracking-widest rounded-2xl shadow-lg">Cambiar Usuario</button>
                                </div>
                            </div>
                        )}

                        {/* MODAL AD: Publicidad */}
                        {activeModal === 'AD' && (
                            <form onSubmit={async (e) => { e.preventDefault(); await addDoc(collection(db, 'publicidad'), { ...newAd, createdAt: serverTimestamp(), activo: true }); setActiveModal(null); }} className="space-y-4">
                                <input type="text" placeholder="TÍTULO" className="input-field h-14 text-sm font-bold uppercase bg-slate-50 border-none" value={newAd.title} onChange={e => setNewAd({ ...newAd, title: e.target.value })} required />
                                <input type="text" placeholder="LINK MEDIA (VIDEO/IMG)" className="input-field h-14 text-sm bg-slate-50 border-none" value={newAd.mediaUrl} onChange={e => setNewAd({ ...newAd, mediaUrl: e.target.value })} required />
                                <select className="select-field h-14 text-xs font-black uppercase bg-slate-50 border-none" value={newAd.ubicacion} onChange={e => setNewAd({ ...newAd, ubicacion: e.target.value })}>
                                    <option value="GENERAL">TODOS LADOS</option>
                                    <option value="TRABAJO">SOLO BOLSA</option>
                                    <option value="SERVICIOS">SOLO SERVICIOS</option>
                                </select>
                                <button type="submit" className="w-full bg-indigo-600 text-white font-black h-[70px] rounded-[28px] text-sm uppercase tracking-widest shadow-xl shadow-indigo-100">Publicar Anuncio</button>
                            </form>
                        )}

                        {/* MODAL STAFF: Crear Acceso */}
                        {activeModal === 'STAFF' && (
                            <form onSubmit={async (e) => { e.preventDefault(); await addDoc(collection(db, 'access_codes'), { ...newAccess, activo: true, createdAt: serverTimestamp() }); setActiveModal(null); }} className="space-y-6">
                                <div className="space-y-3">
                                    <input type="text" placeholder="NOMBRE COLABORADOR" className="input-field h-14 text-sm font-bold uppercase bg-slate-50 border-none" value={newAccess.name} onChange={e => setNewAccess({ ...newAccess, name: e.target.value })} required />
                                    <input type="text" placeholder="CLAVE ASIGNADA" className="input-field h-14 text-sm font-black tracking-widest bg-slate-50 border-none" value={newAccess.code} onChange={e => setNewAccess({ ...newAccess, code: e.target.value })} required />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {['posts', 'ads', 'access', 'stats'].map(p => (
                                        <button type="button" key={p} onClick={() => setNewAccess(v => ({ ...v, permissions: { ...v.permissions, [p]: !v.permissions[p] } }))} className={`py-4 rounded-[20px] text-[8px] font-black uppercase border-2 transition-all ${newAccess.permissions[p] ? 'bg-red-50 border-red-500 text-red-600' : 'bg-slate-50 border-transparent text-slate-300'}`}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setActiveModal(null)} className="flex-1 bg-slate-100 text-slate-500 font-black h-[70px] rounded-[28px] text-xs uppercase tracking-widest">Cancelar</button>
                                    <button type="submit" className="flex-[2] bg-red-600 text-white font-black h-[70px] rounded-[28px] text-sm uppercase tracking-widest shadow-xl shadow-red-100">Crear Acceso</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
