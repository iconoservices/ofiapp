import React from 'react';
import { X, User, Phone, CheckCircle2 } from 'lucide-react';

const UserProfileModal = ({ user, onClose, onLogout }) => {
    if (!user) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden relative animate-in zoom-in duration-300">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-dark transition-colors z-20">
                    <X size={24} />
                </button>

                <div className="p-8 pt-12 space-y-6">
                    <div className="text-center space-y-2">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName} className="w-20 h-20 rounded-full mx-auto shadow-md border-4 border-white object-cover" />
                        ) : (
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                                <User size={40} />
                            </div>
                        )}
                        <h2 className="text-2xl font-black italic tracking-tighter uppercase text-slate-800 mt-2">
                            Mi Perfil
                        </h2>
                    </div>

                    <div className="space-y-4 bg-slate-50 p-6 rounded-[28px]">
                        <div>
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Nombre Completo</span>
                            <div className="font-bold text-slate-800 text-sm uppercase">{user.displayName || 'Usuario de Ofi'}</div>
                        </div>
                        {user.email && (
                            <div>
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Contacto</span>
                                <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                    {user.email.includes('@ofi.app') ? (
                                        <><Phone size={14} className="text-primary" /> {user.email.replace('@ofi.app', '')}</>
                                    ) : (
                                        <>{user.email}</>
                                    )}
                                </div>
                            </div>
                        )}
                        <div>
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1 mt-2">
                                <CheckCircle2 size={12} className="text-green-500" /> Cuenta Verificada
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            onLogout();
                            onClose();
                        }}
                        className="w-full bg-red-50 text-red-600 border-2 border-red-100 font-black h-16 rounded-[28px] text-[10px] uppercase tracking-[0.2em] shadow-sm hover:bg-red-600 hover:text-white transition-all active:scale-95"
                    >
                        Cerrar Sesión
                    </button>

                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;
