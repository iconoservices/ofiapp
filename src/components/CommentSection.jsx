import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Send, Trash2, ShieldCheck } from 'lucide-react';
import { db } from '../lib/firebase';
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    deleteDoc,
    doc
} from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const CommentSection = ({ postId, isAdmin, onClose }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [nickName, setNickName] = useState('');

    useEffect(() => {
        const q = query(
            collection(db, 'comentarios'),
            where('postId', '==', postId),
            where('activo', '==', true)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Ordenar manualmente si no hay índice
            const sortedDocs = docs.sort((a, b) => (b.fecha?.seconds || 0) - (a.fecha?.seconds || 0));
            setComments(sortedDocs);
            setLoading(false);
        }, (err) => {
            console.error("Error cargando comentarios:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [postId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        try {
            await addDoc(collection(db, 'comentarios'), {
                postId,
                nombre: nickName || 'Anónimo',
                comentario: commentText.slice(0, 500),
                fecha: serverTimestamp(),
                activo: true
            });
            setCommentText('');
        } catch (err) {
            console.error(err);
            alert('Error al comentar');
        }
    };

    const deleteComment = async (id) => {
        if (!isAdmin) return;
        try {
            await deleteDoc(doc(db, 'comentarios', id));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-dark/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[90vh] sm:h-[600px] overflow-hidden animate-in slide-in-from-bottom duration-300">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-2">
                        <MessageSquare size={20} className="text-primary" />
                        <h2 className="font-bold text-dark">Comentarios</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <p className="text-sm">No hay comentarios aún.</p>
                            <p className="text-xs">¡Sé el primero en preguntar!</p>
                        </div>
                    ) : (
                        comments.map(comment => (
                            <div key={comment.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 relative group">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="font-bold text-xs text-slate-700">{comment.nombre}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-400">
                                            {comment.fecha ? formatDistanceToNow(comment.fecha.toDate(), { locale: es }) : 'recién'}
                                        </span>
                                        {isAdmin && (
                                            <button
                                                onClick={() => deleteComment(comment.id)}
                                                className="text-red-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                    {comment.comentario}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <input
                            type="text"
                            placeholder="Tu nombre (opcional)"
                            className="w-full text-xs p-2 bg-slate-100 border-none rounded-lg focus:ring-1 focus:ring-primary/30"
                            value={nickName}
                            onChange={(e) => setNickName(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Escribe un comentario..."
                                className="flex-1 text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                maxLength={500}
                            />
                            <button
                                type="submit"
                                className="bg-primary text-white p-3 rounded-xl active:scale-95 transition-all shadow-lg shadow-primary/20"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CommentSection;
