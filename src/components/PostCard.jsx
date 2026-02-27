import React from 'react';
import { MessageCircle, Send, AlertTriangle, Eye, CheckCircle, ShieldCheck, Bookmark } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { TYPES } from '../constants';

const PostCard = ({ post, onReport, onComment }) => {
    const {
        id,
        nombre,
        categoria,
        ciudad,
        descripcion,
        whatsapp,
        disponibilidad,
        fecha_publicacion,
        vistas = 0,
        verificado = false,
        imageUrl = null
    } = post;

    const handleWhatsApp = () => {
        const message = encodeURIComponent(`Hola, vi tu anuncio en Ofi App: ${categoria} - ${ciudad}`);
        window.open(`https://wa.me/51${whatsapp}?text=${message}`, '_blank');
    };

    const timeAgo = fecha_publicacion && typeof fecha_publicacion.toDate === 'function'
        ? formatDistanceToNow(fecha_publicacion.toDate(), { addSuffix: true, locale: es })
        : 'Recientemente';

    const [isSaved, setIsSaved] = React.useState(false);

    React.useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('saved_posts') || '[]');
        setIsSaved(saved.includes(id));
    }, [id]);

    const toggleSaved = (e) => {
        e.stopPropagation();
        const saved = JSON.parse(localStorage.getItem('saved_posts') || '[]');
        let newSaved;
        if (isSaved) {
            newSaved = saved.filter(postId => postId !== id);
        } else {
            newSaved = [...saved, id];
        }
        localStorage.setItem('saved_posts', JSON.stringify(newSaved));
        setIsSaved(!isSaved);
    };

    return (
        <div className={`card !p-0 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 border-2 transition-all relative flex h-44 sm:h-48 ${verificado ? 'border-amber-400 bg-amber-50/10 shadow-lg shadow-amber-100' : 'border-slate-100'}`}>

            {/* Media del Post - Al costadito (Left side) */}
            {imageUrl && (
                <div className="w-1/3 min-w-[120px] h-full bg-slate-100 relative group">
                    <img
                        src={imageUrl}
                        alt={categoria}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                    {verificado && (
                        <div className="absolute top-0 left-0 bg-amber-400 text-dark p-1 rounded-br-xl shadow-lg">
                            <ShieldCheck size={14} strokeWidth={3} />
                        </div>
                    )}
                </div>
            )}

            <div className={`flex-1 p-3 flex flex-col justify-between ${!imageUrl ? 'w-full' : ''}`}>
                <div className="space-y-1">
                    <div className="flex justify-between items-start">
                        <span className="text-[9px] font-black text-primary uppercase tracking-[0.15em]">{categoria}</span>
                        <button
                            onClick={() => onReport(id)}
                            className="text-slate-200 hover:text-red-400 transition-colors"
                        >
                            <AlertTriangle size={14} />
                        </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-black text-dark leading-tight italic uppercase tracking-tighter truncate">
                            {nombre || 'Anónimo'}
                        </h3>
                        {verificado && <CheckCircle className="text-primary" size={14} fill="white" />}
                    </div>

                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{ciudad} • {disponibilidad}</p>

                    <p className="text-slate-600 text-[11px] leading-tight font-medium line-clamp-2 mt-1">
                        {descripcion}
                    </p>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-slate-400">
                            <div className="flex items-center gap-1">
                                <Eye size={12} />
                                <span className="text-[9px] font-bold">{vistas}</span>
                            </div>
                            <button
                                onClick={() => onComment(id)}
                                className="flex items-center gap-1 hover:text-primary transition-colors"
                            >
                                <MessageCircle size={12} />
                                <span className="text-[9px] font-bold uppercase">Chat</span>
                            </button>
                        </div>
                        <span className="text-[8px] font-black text-slate-300 uppercase italic">
                            {timeAgo}
                        </span>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleWhatsApp}
                            className="flex-1 bg-whatsapp text-white py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-whatsapp/10 active:scale-95 transition-all"
                        >
                            <Send size={14} strokeWidth={3} />
                            WHATSAPP
                        </button>
                        <button
                            onClick={toggleSaved}
                            className={`p-2 rounded-xl transition-all active:scale-90 ${isSaved
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-slate-50 text-slate-400 border border-slate-100'
                                }`}
                        >
                            <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostCard;
