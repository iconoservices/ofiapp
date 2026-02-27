import React from 'react';
import { Settings, LogIn, User, LogOut } from 'lucide-react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const Header = ({ onAdminClick, isAdmin, user, onLogin }) => {
    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            onLogin(result.user);
        } catch (error) {
            console.error("Login Error:", error);
            if (error.code === 'auth/configuration-not-found') {
                alert("Servicio de Google no habilitado en Firebase. Contacta al soporte.");
            } else {
                alert("Error al iniciar sesión: " + error.message);
            }
        }
    };

    const handleLogout = () => {
        signOut(auth);
        onLogin(null);
    };

    return (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 px-3 sm:px-4 py-2 sm:py-3 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <span className="text-xl sm:text-2xl animate-pulse">🌴</span>
                <h1 className="text-lg sm:text-xl font-black text-dark tracking-tighter leading-none italic">OFI APP</h1>
            </div>

            <div className="flex items-center gap-3">
                {/* Regular User Profile / Login */}
                {user ? (
                    <div className="flex items-center gap-2 bg-slate-50 p-1 pr-3 rounded-full border border-slate-100 group transition-all">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full shadow-sm" />
                        ) : (
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white"><User size={16} /></div>
                        )}
                        <span className="text-[10px] font-black uppercase tracking-tighter truncate max-w-[80px]">
                            {user.displayName?.split(' ')[0]}
                        </span>
                        <button onClick={handleLogout} className="text-slate-300 hover:text-red-500 transition-colors ml-1">
                            <LogOut size={12} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleGoogleLogin}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-all group"
                    >
                        <LogIn size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Entrar</span>
                    </button>
                )}

                {/* Admin Gear - Smaller and less prominent as requested */}
                <button
                    onClick={onAdminClick}
                    className={`p-2 rounded-xl transition-all ${isAdmin ? 'bg-primary/10 text-primary border-primary/20 border' : 'text-slate-300 hover:text-primary'}`}
                    aria-label="Admin Panel"
                >
                    <Settings size={18} strokeWidth={isAdmin ? 3 : 2} />
                </button>
            </div>
        </header>
    );
};

export default Header;
