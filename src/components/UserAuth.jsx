import React, { useState } from 'react';
import { auth, db } from '../lib/firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    signInWithPopup,
    GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { X, User, Phone, Lock, LogIn, UserPlus, Mail, CheckCircle2 } from 'lucide-react';

const UserAuth = ({ onClose, onLogin }) => {
    const [mode, setMode] = useState('LOGIN'); // LOGIN or REGISTER
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        fullname: '',
        username: '',
        cellphone: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            // Optionally save to Firestore if new
            const userRef = doc(db, 'users', result.user.uid);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    fullname: result.user.displayName,
                    username: result.user.email.split('@')[0],
                    cellphone: '',
                    photoURL: result.user.photoURL,
                    createdAt: new Date()
                });
            }
            onLogin(result.user);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailPassAuth = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Normalize cellphone to email for Firebase Auth
        const email = `${formData.cellphone}@ofi.app`;

        try {
            if (mode === 'REGISTER') {
                if (formData.password !== formData.confirmPassword) {
                    throw new Error('Las contraseñas no coinciden');
                }
                if (formData.cellphone.length < 9) {
                    throw new Error('Número de celular inválido');
                }

                const result = await createUserWithEmailAndPassword(auth, email, formData.password);

                // Update profile display name
                await updateProfile(result.user, { displayName: formData.fullname });

                // Save extra info to Firestore
                await setDoc(doc(db, 'users', result.user.uid), {
                    fullname: formData.fullname,
                    username: formData.username,
                    cellphone: formData.cellphone,
                    createdAt: new Date()
                });

                onLogin(result.user);
            } else {
                const result = await signInWithEmailAndPassword(auth, email, formData.password);
                onLogin(result.user);
            }
            onClose();
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/user-not-found') setError('No existe cuenta con este celular');
            else if (err.code === 'auth/wrong-password') setError('Contraseña incorrecta');
            else if (err.code === 'auth/email-already-in-use') setError('El celular ya está registrado');
            else setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden relative animate-in zoom-in duration-300">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-dark transition-colors z-20">
                    <X size={24} />
                </button>

                <div className="p-8 pt-12 space-y-6">
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto text-primary">
                            {mode === 'LOGIN' ? <LogIn size={32} /> : <UserPlus size={32} />}
                        </div>
                        <h2 className="text-2xl font-black italic tracking-tighter uppercase text-slate-800">
                            {mode === 'LOGIN' ? 'Bienvenido' : 'Crear Cuenta'}
                        </h2>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">
                            {mode === 'LOGIN' ? 'Ingresa tus datos de acceso' : 'Únete a la red de la selva'}
                        </p>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleEmailPassAuth} className="space-y-3">
                        {mode === 'REGISTER' && (
                            <>
                                <div className="relative group">
                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                                    <input
                                        type="text"
                                        name="fullname"
                                        placeholder="NOMBRE COMPLETO"
                                        className="w-full bg-slate-50 border-none h-14 pl-14 pr-6 rounded-2xl text-xs font-bold uppercase placeholder:text-slate-300 focus:ring-2 focus:ring-primary/20 transition-all"
                                        value={formData.fullname}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="relative group">
                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                                    <input
                                        type="text"
                                        name="username"
                                        placeholder="NOMBRE DE USUARIO"
                                        className="w-full bg-slate-50 border-none h-14 pl-14 pr-6 rounded-2xl text-xs font-bold uppercase placeholder:text-slate-300 focus:ring-2 focus:ring-primary/20 transition-all"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <div className="relative group">
                            <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="tel"
                                name="cellphone"
                                placeholder="CELULAR (SIN +51)"
                                className="w-full bg-slate-50 border-none h-14 pl-14 pr-6 rounded-2xl text-xs font-black placeholder:text-slate-300 focus:ring-2 focus:ring-primary/20 transition-all"
                                value={formData.cellphone}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="password"
                                name="password"
                                placeholder="CONTRASEÑA"
                                className="w-full bg-slate-50 border-none h-14 pl-14 pr-6 rounded-2xl text-xs font-black placeholder:text-slate-300 focus:ring-2 focus:ring-primary/20 transition-all"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {mode === 'REGISTER' && (
                            <div className="relative group">
                                <CheckCircle2 className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="CONFIRMAR CONTRASEÑA"
                                    className="w-full bg-slate-50 border-none h-14 pl-14 pr-6 rounded-2xl text-xs font-black placeholder:text-slate-300 focus:ring-2 focus:ring-primary/20 transition-all"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 text-white font-black h-16 rounded-[28px] text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-dark transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Procesando...' : mode === 'LOGIN' ? 'Entrar' : 'Registrarme'}
                        </button>
                    </form>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                        <div className="relative flex justify-center text-[8px] uppercase font-black text-slate-300 tracking-widest"><span className="bg-white px-4">O continúa con</span></div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full bg-white border-2 border-slate-100 text-slate-600 font-bold h-14 rounded-2xl text-[9px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                        Google
                    </button>

                    <div className="text-center pt-2">
                        <button
                            onClick={() => setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
                            className="text-[9px] font-black uppercase text-primary tracking-widest hover:underline"
                        >
                            {mode === 'LOGIN' ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserAuth;
