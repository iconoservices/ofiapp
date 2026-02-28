import React from 'react';
import { Settings, LogIn, User, LogOut } from 'lucide-react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const Header = ({ onAdminClick, onUserClick, isAdmin, user, onLogin }) => {
    const handleLogout = () => {
        signOut(auth);
        onLogin(null);
    };

    return (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 px-3 sm:px-4 py-2 sm:py-3 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 cursor-pointer group select-none">
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-[14px] sm:rounded-2xl flex items-center justify-center shadow-md shadow-slate-200/60 border border-slate-100 group-hover:shadow-xl group-hover:shadow-primary/10 group-hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <span className="text-2xl sm:text-3xl relative z-10 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 drop-shadow-sm">🌴</span>
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-primary/10 rounded-full blur-md group-hover:bg-primary/20 transition-colors"></div>
                </div>
                <div className="flex flex-col justify-center">
                    <h1 className="text-xl sm:text-[22px] font-black tracking-tighter leading-none italic flex items-center">
                        <span className="text-slate-800">OFI</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-green-600 ml-[1px]">APP</span>
                    </h1>
                    <span className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-[0.25em] text-slate-400 mt-0.5 group-hover:text-emerald-500 transition-colors">
                        Bolsa Selva
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                {/* Regular User Profile / Login */}
                <div className="flex items-center shadow-sm rounded-full bg-slate-50 border border-slate-100 p-0.5">
                    {user ? (
                        <button onClick={onUserClick} className="flex items-center gap-2 p-1 pr-3 hover:bg-slate-100 rounded-full transition-all group">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border-2 border-slate-200 shadow-sm object-cover" />
                            ) : (
                                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white"><User size={16} /></div>
                            )}
                            <span className="text-[10px] font-black uppercase tracking-tighter truncate max-w-[70px] hidden sm:block group-hover:text-primary transition-colors">
                                {user.displayName?.split(' ')[0] || 'PERFIL'}
                            </span>
                        </button>
                    ) : (
                        <button
                            onClick={onUserClick}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 text-slate-500 rounded-full transition-all group"
                        >
                            <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 group-hover:text-primary transition-colors">
                                <User size={14} />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest">Mi Perfil</span>
                        </button>
                    )}
                </div>

                {/* Admin Gear - Small & Discrete */}
                <button
                    onClick={onAdminClick}
                    className={`p-2 rounded-xl transition-all ${isAdmin ? 'bg-primary/10 text-primary border-primary/20 border' : 'text-slate-200 hover:text-slate-400'}`}
                    aria-label="Admin Panel"
                >
                    <Settings size={18} strokeWidth={2} />
                </button>
            </div>
        </header>
    );
};

export default Header;
