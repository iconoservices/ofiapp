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
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <span className="text-xl sm:text-2xl animate-pulse">🌴</span>
                <h1 className="text-lg sm:text-xl font-black text-dark tracking-tighter leading-none italic">OFI APP</h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                {/* Regular User Profile / Login */}
                <div className="flex items-center shadow-sm rounded-full bg-slate-50 border border-slate-100 p-0.5">
                    {user ? (
                        <div className="flex items-center gap-2 pr-3 transition-all">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
                            ) : (
                                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white"><User size={16} /></div>
                            )}
                            <span className="text-[10px] font-black uppercase tracking-tighter truncate max-w-[70px] hidden sm:block">
                                {user.displayName?.split(' ')[0]}
                            </span>
                            <button onClick={handleLogout} className="text-slate-300 hover:text-red-500 transition-colors">
                                <LogOut size={12} />
                            </button>
                        </div>
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
