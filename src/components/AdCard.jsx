import React, { useRef } from 'react';
import { ExternalLink, Sparkles, Play, MessageCircle } from 'lucide-react';

const AdCard = ({ ad }) => {
    const getYouTubeID = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const defaultAd = {
        title: "¿Quieres anunciar aquí?",
        description: "Espacio premium para marcas locales en la selva. Packs desde S/10.",
        mediaUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800",
        link: "https://wa.me/51999123456?text=Quiero+informacion+publicidad",
        type: 'image'
    };

    const data = ad || defaultAd;
    const ytId = getYouTubeID(data.mediaUrl);
    const isVideoFile = data.mediaUrl?.toLowerCase().endsWith('.mp4');

    // Validamos si el link de WhatsApp o Web existe. Si no, usamos el link de media como fallback o nada.
    const hasAction = !!data.link;

    return (
        <div className="bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl border border-white/5 animate-in fade-in zoom-in duration-500 my-4">

            <div className="relative aspect-video bg-black">
                {ytId ? (
                    <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${ytId}?autoplay=0&controls=1&rel=0`}
                        title={data.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                ) : isVideoFile ? (
                    <video
                        src={data.mediaUrl}
                        className="w-full h-full object-cover"
                        controls
                        playsInline
                    />
                ) : (
                    <div className="relative w-full h-full group">
                        <img
                            src={data.mediaUrl}
                            alt={data.title}
                            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                        />
                        {!hasAction && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-primary/90 p-4 rounded-full text-white shadow-xl shadow-primary/40 group-hover:scale-110 transition-transform">
                                    <Play size={24} fill="white" />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 z-10 shadow-lg">
                    <Sparkles size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-[9px] font-black text-white uppercase tracking-[0.1em]">Anuncio Ofi</span>
                </div>
            </div>

            <div className="p-5 flex flex-col gap-3">
                <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1">
                        <h3 className="text-white font-black text-sm uppercase tracking-tight italic leading-tight line-clamp-2">
                            {data.title}
                        </h3>
                        <p className="text-slate-400 text-[11px] font-medium leading-relaxed line-clamp-2">
                            {data.description}
                        </p>
                    </div>

                    {hasAction ? (
                        <a
                            href={data.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white text-slate-900 font-bold px-5 py-3 rounded-2xl text-[10px] uppercase tracking-widest flex items-center gap-2 shrink-0 hover:bg-primary hover:text-white transition-all active:scale-95 shadow-lg shadow-white/5"
                        >
                            {data.link.includes('wa.me') ? <MessageCircle size={14} /> : 'Ver'}
                            Saber más
                        </a>
                    ) : (
                        <div className="bg-slate-800 text-slate-500 px-5 py-3 rounded-2xl text-[9px] uppercase font-black italic tracking-widest">
                            Promo
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdCard;
