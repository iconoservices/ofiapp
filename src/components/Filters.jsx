import React from 'react';
import { Search, MapPin, Tag } from 'lucide-react';
import { CITIES, CATEGORIES, TYPES } from '../constants';

const Filters = ({ filters, setFilters }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="bg-white/95 backdrop-blur-md p-4 space-y-4 sticky top-[125px] z-40 border-b border-slate-100 shadow-sm animate-in fade-in duration-300">
            <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                <input
                    type="text"
                    name="query"
                    placeholder="Busca por oficio o lugar..."
                    className="input-field pl-11 h-[52px] font-bold text-sm bg-slate-50 border-none shadow-inner"
                    value={filters.query}
                    onChange={handleChange}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    <select
                        name="city"
                        className="select-field pl-9 text-xs font-bold h-[48px] bg-slate-50 border-none uppercase tracking-tighter"
                        value={filters.city}
                        onChange={handleChange}
                    >
                        <option value="">Todas las ciudades</option>
                        {CITIES.map(city => (
                            <option key={city} value={city}>{city}</option>
                        ))}
                    </select>
                </div>
                <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    <select
                        name="category"
                        className="select-field pl-9 text-xs font-bold h-[48px] bg-slate-50 border-none uppercase tracking-tighter"
                        value={filters.category}
                        onChange={handleChange}
                    >
                        <option value="">Categorías</option>
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                Mostrando todas las ofertas de empleo
            </div>
        </div>
    );
};

export default Filters;
