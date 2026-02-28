import React, { useState, useRef } from 'react';
import { X, Send, AlertCircle, Camera, Loader2, ShieldCheck as ShieldIcon, Briefcase, WifiOff, CheckCircle2, Tag } from 'lucide-react';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { CITIES, CATEGORIES, TYPES } from '../constants';
import imageCompression from 'browser-image-compression';

const PostForm = ({ onClose, onSuccess, isAdmin, editData = null, config = { cities: CITIES, categories: CATEGORIES }, userId = null }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showOfflineSuccess, setShowOfflineSuccess] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const [formData, setFormData] = useState(editData ? {
        tipo: editData.tipo,
        nombre: editData.nombre,
        ciudad: editData.ciudad,
        categoria: editData.categoria,
        descripcion: editData.descripcion,
        whatsapp: editData.whatsapp,
        disponibilidad: editData.disponibilidad || 'Inmediata'
    } : {
        tipo: isAdmin ? TYPES.SERVICIO_OFI : TYPES.BUSCO_TRABAJADOR,
        nombre: '',
        ciudad: config.cities[0],
        categoria: config.categories[0],
        descripcion: '',
        whatsapp: '',
        disponibilidad: 'Inmediata'
    });

    const [imagePreview, setImagePreview] = useState(editData?.imageUrl || null);
    const [imageFile, setImageFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);

    const isCertifyMode = formData.tipo === TYPES.SERVICIO_OFI;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);

        try {
            const compressedFile = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1200 });
            setImageFile(compressedFile);
        } catch { setImageFile(file); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!formData.descripcion || !formData.whatsapp) {
            setError('Por favor completa los campos obligatorios.');
            setLoading(false);
            return;
        }

        const postData = {
            ...formData,
            userId: userId || editData?.userId || null,
            nombre: formData.nombre || 'Anónimo',
            fecha_publicacion: editData?.id ? editData.fecha_publicacion : serverTimestamp(),
            activo: true,
            vistas: 0,
            reportes: 0,
            verificado: isAdmin && isCertifyMode
        };

        const isConfigured = import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== 'dummy-key';

        if (!isConfigured) {
            setError('Error: No se ha configurado el archivo .env con las llaves de Firebase.');
            setLoading(false);
            return;
        }

        try {
            let imageUrl = null;
            if (imageFile && navigator.onLine) {
                try {
                    const storageRef = ref(storage, `posts/${Date.now()}_${formData.whatsapp}`);
                    const uploadTask = uploadBytesResumable(storageRef, imageFile);

                    await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => reject(new Error('Timeout subiendo imagen')), 8000);
                        uploadTask.on('state_changed',
                            (snap) => setUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100),
                            (err) => { clearTimeout(timeout); reject(err); },
                            async () => {
                                clearTimeout(timeout);
                                imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
                                resolve();
                            }
                        );
                    });
                } catch (sErr) {
                    console.warn("Fallo subida de imagen:", sErr);
                }
            }

            // GUARDADO CON TIMEOUT FORZADO
            if (editData?.id) {
                await Promise.race([
                    updateDoc(doc(db, 'postings', editData.id), { ...postData, imageUrl: imageUrl || editData.imageUrl }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('DB_TIMEOUT')), 5000))
                ]);
            } else {
                const docRef = await Promise.race([
                    addDoc(collection(db, 'postings'), { ...postData, imageUrl }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('DB_TIMEOUT')), 5000))
                ]);

                if (docRef && docRef.id) {
                    const mine = JSON.parse(localStorage.getItem('my_posts') || '[]');
                    localStorage.setItem('my_posts', JSON.stringify([...mine, { id: docRef.id, createdAt: Date.now() }]));
                }
            }

            setShowSuccess(true);
            setTimeout(() => onSuccess(), 400);

        } catch (err) {
            console.error("Error en Submit:", err);

            // Si hay timeout o error, guardamos en LocalStorage y cerramos
            setShowOfflineSuccess(true);
            const pending = JSON.parse(localStorage.getItem('pending_posts') || '[]');
            localStorage.setItem('pending_posts', JSON.stringify([...pending, { ...postData, local: true }]));

            setTimeout(() => onSuccess(), 1200);
        } finally {
            setLoading(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="fixed inset-0 z-[110] bg-dark/20 backdrop-blur-sm flex items-center justify-center p-6 text-center font-sans">
                <div className="bg-white rounded-[32px] p-8 space-y-4 max-w-[280px] animate-in zoom-in duration-200 shadow-2xl border-2 border-green-100">
                    <div className="bg-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-white shadow-lg shadow-green-200">
                        <CheckCircle2 size={32} strokeWidth={3} />
                    </div>
                    <h2 className="text-xl font-black italic tracking-tighter uppercase leading-none text-green-600">¡LISTO!</h2>
                </div>
            </div>
        );
    }

    if (showOfflineSuccess) {
        return (
            <div className="fixed inset-0 z-[110] bg-dark/20 backdrop-blur-sm flex items-center justify-center p-6 text-center font-sans">
                <div className="bg-white rounded-[32px] p-8 space-y-4 max-w-[280px] animate-in zoom-in duration-200 shadow-2xl border-2 border-amber-100">
                    <div className="bg-amber-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-white">
                        <WifiOff size={32} />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-lg font-black italic tracking-tighter uppercase leading-none">Guardado</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Se publicará al volver la señal.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-[100] bg-dark/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans text-left overflow-hidden"
            onClick={onClose} // Cerrar al tocar el fondo
        >
            <div
                className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 max-h-[95vh] flex flex-col"
                onClick={(e) => e.stopPropagation()} // Evitar que se cierre al tocar dentro del formulario
            >
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                    <div>
                        <h2 className="text-2xl font-black text-dark italic tracking-tighter uppercase leading-none">
                            {isAdmin && formData.tipo === TYPES.SERVICIO_OFI ? 'Certificar Servicio' : 'Nuevo Anuncio'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto overflow-x-hidden pb-12 w-full">
                    {/* Botones de Modo */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, tipo: TYPES.BUSCO_TRABAJADOR }))}
                            className={`flex-1 py-4 rounded-2xl text-[10px] font-black tracking-widest uppercase border-2 transition-all ${!isCertifyMode ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-slate-50 border-transparent text-slate-400'}`}
                        >
                            <Briefcase className="mx-auto mb-1" size={20} />
                            Busco Personal
                        </button>
                        {isAdmin && (
                            <button
                                type="button"
                                onClick={() => setFormData(p => ({ ...p, tipo: TYPES.SERVICIO_OFI }))}
                                className={`flex-1 py-4 rounded-2xl text-[10px] font-black tracking-widest uppercase border-2 transition-all ${isCertifyMode ? 'bg-amber-100 border-amber-400 text-amber-600 shadow-lg shadow-amber-100' : 'bg-slate-50 border-transparent text-slate-400'}`}
                            >
                                <ShieldIcon className="mx-auto mb-1" size={20} />
                                Certificar Ofi
                            </button>
                        )}
                    </div>

                    <div onClick={() => fileInputRef.current?.click()} className="group relative w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center overflow-hidden transition-all hover:border-primary cursor-pointer">
                        {imagePreview ? (
                            <img src={imagePreview} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <div className="bg-white p-3 rounded-full shadow-sm text-primary group-hover:scale-110 transition-transform"><Camera size={24} /></div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Añadir foto del {isCertifyMode ? 'servicio' : 'local'}</span>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">¿En qué ciudad?</label>
                            <select name="ciudad" className="select-field h-12 text-xs font-black uppercase" value={formData.ciudad} onChange={handleChange} required>
                                <option value="" disabled>Selecciona ciudad</option>
                                {config.cities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Categoría del oficio</label>
                            <div className="relative">
                                <Tag className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                <select name="categoria" className="select-field h-14 pl-14 text-sm font-bold uppercase tracking-tight" value={formData.categoria} onChange={handleChange} required>
                                    <option value="" disabled>Selecciona categoría</option>
                                    {config.categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Tu Nombre o Negocio</label>
                        <input type="text" name="nombre" placeholder="Ej: Juan Pérez o Carpintería Ofi" className="input-field h-14 text-sm font-bold uppercase tracking-tight" value={formData.nombre} onChange={handleChange} />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">WhatsApp de contacto</label>
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">+51</span>
                            <input type="tel" name="whatsapp" placeholder="999000111" className="input-field h-14 pl-14 text-lg font-black tracking-tight" value={formData.whatsapp} onChange={handleChange} maxLength={9} required />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">
                            {isCertifyMode ? 'Descripción del servicio ofrecido' : '¿A quién necesitas contratar?'}
                        </label>
                        <textarea
                            name="descripcion"
                            rows="3"
                            placeholder={isCertifyMode ? "Ej: Ofrecemos servicio de gasfitería profesional con garantía..." : "Ej: Necesito mozo con experiencia para hoy..."}
                            className="input-field py-4 text-sm font-medium resize-none leading-relaxed"
                            value={formData.descripcion}
                            onChange={handleChange}
                            required
                        ></textarea>
                    </div>

                    {/* Seccion de botones finales */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                onClose();
                            }}
                            className="flex-1 bg-slate-100 h-16 rounded-[24px] text-slate-500 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] bg-secondary h-16 rounded-[24px] text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-secondary/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <><Send size={20} /> GUARDAR</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PostForm;
