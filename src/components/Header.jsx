import React from 'react';
import { Settings } from 'lucide-react';

const Header = ({ onAdminClick, isAdmin, userProfile }) => {
    return (
        <header className="sticky top-0 z-50 bg-white border-b border-slate-100 px-4 py-3 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2">
                <span className="text-2xl">🛠️</span>
                <h1 className="text-xl font-black text-dark tracking-tight leading-none">OFI APP</h1>
            </div>
            <button
                onClick={onAdminClick}
                className={`flex items-center gap-2 p-1.5 rounded-2xl transition-all ${isAdmin ? 'bg-primary/10 text-primary border-primary/20 border' : 'text-slate-400 hover:text-primary hover:bg-slate-50'}`}
                aria-label="Admin Panel"
            >
                {isAdmin && userProfile && (
                    <span className="text-[9px] font-black uppercase tracking-tighter pl-2 italic truncate max-w-[60px]">
                        {userProfile.name.split(' ')[0]}
                    </span>
                )}
                <div className={`p-1.5 rounded-xl ${isAdmin ? 'bg-primary text-white shadow-lg shadow-primary/20' : ''}`}>
                    <Settings size={18} strokeWidth={isAdmin ? 3 : 2} />
                </div>
            </button>
        </header>
    );
};

export default Header;
