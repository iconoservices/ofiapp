import React, { useState, useEffect, useMemo } from 'react';
import { db } from './lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  increment
} from 'firebase/firestore';
import { Plus, Briefcase, ShieldCheck as ShieldIcon, Info, Bookmark as BookmarkIcon, AlertCircle, Settings, User, Edit } from 'lucide-react';
import { CITIES, CATEGORIES } from './constants';
import Header from './components/Header';
import Filters from './components/Filters';
import PostCard from './components/PostCard';
import PostForm from './components/PostForm';
import CommentSection from './components/CommentSection';
import AdminPanel from './components/AdminPanel';
import AdCard from './components/AdCard';
import { TYPES } from './constants';

function App() {
  const [posts, setPosts] = useState([]);
  const [ads, setAds] = useState([]);
  const [globalSettings, setGlobalSettings] = useState({ expirationDays: 30 });
  const [config, setConfig] = useState({ cities: CITIES, categories: CATEGORIES });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('TRABAJO');
  const [dbError, setDbError] = useState(false);

  const [filters, setFilters] = useState({
    query: '',
    city: '',
    category: '',
    type: TYPES.BUSCO_TRABAJADOR
  });

  const [showPostForm, setShowPostForm] = useState(false);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [editingPost, setEditingPost] = useState(null);

  useEffect(() => {
    setLoading(true);

    // Fetch Posts
    const unsubPosts = onSnapshot(query(
      collection(db, 'postings'),
      where('activo', '==', true),
      orderBy('fecha_publicacion', 'desc')
    ), (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
      setDbError(false);
    }, (error) => {
      console.error("Firestore Posts Error:", error);
      setLoading(false);
      setDbError(true);
    });

    // Fetch Ads (Publicidad)
    const unsubAds = onSnapshot(query(collection(db, 'publicidad'), where('activo', '==', true), orderBy('createdAt', 'desc')), (snapshot) => {
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Firestore Ads Error:", error);
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setGlobalSettings(docSnap.data());
      }
    });

    const unsubConfig = onSnapshot(doc(db, 'app_config', 'filters'), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data());
      }
    });

    return () => { unsubPosts(); unsubAds(); unsubSettings(); unsubConfig(); };
  }, []);

  const filteredPosts = useMemo(() => {
    const savedIds = JSON.parse(localStorage.getItem('saved_posts') || '[]');
    const myPostIds = JSON.parse(localStorage.getItem('my_posts') || '[]').map(p => p.id);

    return posts
      .filter(post => {
        const postTime = post.fecha_publicacion?.toDate().getTime() || Date.now();
        const expireDays = post.expirationDays !== undefined ? post.expirationDays : globalSettings.expirationDays;

        if (expireDays !== 'indefinido') {
          const cutoff = Date.now() - (expireDays * 24 * 60 * 60 * 1000);
          if (postTime < cutoff) return false;
        }

        if (activeTab === 'GUARDADOS') return savedIds.includes(post.id);
        if (activeTab === 'MIS_ANUNCIOS') return myPostIds.includes(post.id);
        if (activeTab === 'TRABAJO') {
          if (post.tipo !== TYPES.BUSCO_TRABAJADOR) return false;
          const matchesQuery = post.descripcion.toLowerCase().includes(filters.query.toLowerCase()) ||
            post.categoria.toLowerCase().includes(filters.query.toLowerCase()) ||
            post.nombre.toLowerCase().includes(filters.query.toLowerCase());
          const matchesCity = filters.city ? post.ciudad === filters.city : true;
          const matchesCategory = filters.category ? post.categoria === filters.category : true;
          return matchesQuery && matchesCity && matchesCategory;
        } else {
          return post.tipo === TYPES.SERVICIO_OFI;
        }
      })
      .sort((a, b) => {
        if (a.verificado && !b.verificado) return -1;
        if (!a.verificado && b.verificado) return 1;
        return (b.fecha_publicacion?.seconds || 0) - (a.fecha_publicacion?.seconds || 0);
      });
  }, [posts, filters, activeTab, globalSettings.expirationDays]);

  // Filtrar publicidad según la pestaña activa
  const currentAds = useMemo(() => {
    return ads.filter(ad => {
      const adTime = ad.createdAt?.toDate().getTime() || Date.now();
      const expireDays = ad.expirationDays !== undefined ? ad.expirationDays : globalSettings.expirationDays;

      if (expireDays !== 'indefinido') {
        const cutoff = Date.now() - (expireDays * 24 * 60 * 60 * 1000);
        if (adTime < cutoff) return false;
      }

      if (ad.ubicacion === 'GENERAL') return true;
      if (activeTab === 'TRABAJO' && ad.ubicacion === 'TRABAJO') return true;
      if (activeTab === 'SERVICIOS' && ad.ubicacion === 'SERVICIOS') return true;
      return false;
    });
  }, [ads, activeTab, globalSettings.expirationDays]);

  const handleReport = async (postId) => {
    if (window.confirm('¿Deseas reportar este anuncio?')) {
      await updateDoc(doc(db, 'postings', postId), { reportes: increment(1) });
      alert('Reporte enviado.');
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('¿Deseas eliminar este anuncio permanentemente?')) {
      try {
        await updateDoc(doc(db, 'postings', postId), { activo: false });
        alert('Anuncio eliminado.');
      } catch (err) {
        console.error("Error deleting:", err);
      }
    }
  };

  const [lastScrollY, setLastScrollY] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div className="min-h-screen bg-background pb-32 lg:max-w-6xl md:max-w-3xl sm:max-w-xl max-w-md mx-auto shadow-2xl bg-white relative font-sans">
      <div className={`sticky top-0 z-[100] bg-white transition-transform duration-500 ease-in-out ${headerVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <Header onAdminClick={() => setShowAdminLogin(true)} isAdmin={isAdmin} userProfile={userProfile} />

        {/* Tabs Row moved inside the sticky container for synchronized hide/show */}
        <div className="flex bg-white px-2 pt-4 border-b border-slate-50 overflow-x-auto hide-scrollbar">
          <button onClick={() => setActiveTab('TRABAJO')} className={`min-w-[70px] flex-1 flex flex-col items-center gap-1 py-2 border-b-4 transition-all ${activeTab === 'TRABAJO' ? 'border-primary text-primary font-black' : 'border-transparent text-slate-400 font-bold'}`}><Briefcase size={16} /><span className="text-[8px] sm:text-[9px] uppercase tracking-tighter italic whitespace-nowrap">Buscadores</span></button>
          <button onClick={() => setActiveTab('SERVICIOS')} className={`min-w-[70px] flex-1 flex flex-col items-center gap-1 py-2 border-b-4 transition-all ${activeTab === 'SERVICIOS' ? 'border-amber-400 text-amber-600 font-black' : 'border-transparent text-slate-400 font-bold'}`}><ShieldIcon size={16} /><span className="text-[8px] sm:text-[9px] uppercase tracking-tighter italic whitespace-nowrap">Servicios</span></button>
          <button onClick={() => setActiveTab('MIS_ANUNCIOS')} className={`min-w-[70px] flex-1 flex flex-col items-center gap-1 py-2 border-b-4 transition-all ${activeTab === 'MIS_ANUNCIOS' ? 'border-indigo-400 text-indigo-600 font-black' : 'border-transparent text-slate-400 font-bold'}`}><User size={16} /><span className="text-[8px] sm:text-[9px] uppercase tracking-tighter italic whitespace-nowrap">Mis Posts</span></button>
          <button onClick={() => setActiveTab('GUARDADOS')} className={`min-w-[70px] flex-1 flex flex-col items-center gap-1 py-2 border-b-4 transition-all ${activeTab === 'GUARDADOS' ? 'border-red-400 text-red-600 font-black' : 'border-transparent text-slate-400 font-bold'}`}><BookmarkIcon size={16} /><span className="text-[8px] sm:text-[9px] uppercase tracking-tighter italic whitespace-nowrap">Guardados</span></button>
          {isAdmin && (
            <button onClick={() => setActiveTab('ADMIN')} className={`min-w-[70px] flex-1 flex flex-col items-center gap-1 py-2 border-b-4 transition-all ${activeTab === 'ADMIN' ? 'border-slate-800 text-slate-800 font-black' : 'border-transparent text-slate-400 font-bold animate-pulse'}`}><Settings size={16} /><span className="text-[8px] sm:text-[9px] uppercase tracking-tighter italic whitespace-nowrap">Mando</span></button>
          )}
        </div>

        {activeTab === 'TRABAJO' && (
          <Filters
            filters={filters}
            setFilters={setFilters}
            isAdmin={isAdmin}
            config={config}
            onUpdateConfig={async (newConfig) => {
              await setDoc(doc(db, 'app_config', 'filters'), newConfig);
            }}
          />
        )}
      </div>

      {dbError && (
        <div className="mx-4 mt-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3">
          <AlertCircle className="text-amber-500 shrink-0" size={20} />
          <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest leading-tight italic">
            Sin conexión. Los anuncios se sincronizarán al volver Internet.
          </p>
        </div>
      )}

      <main className="p-4 space-y-5">
        {activeTab === 'ADMIN' ? (
          <AdminPanel
            onClose={() => setActiveTab('TRABAJO')}
            onLogin={(val, profile) => { setIsAdmin(val); setUserProfile(profile); }}
            isLoggedIn={isAdmin}
            userProfile={userProfile}
            inlineMode={true}
          />
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 font-sans">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest italic animate-pulse">Sincronizando Ofi...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-24 px-8 font-sans">
            <div className="text-6xl mb-6 grayscale opacity-20">🌴</div>
            <h3 className="text-xl font-black text-slate-700 italic tracking-tighter uppercase">Sin resultados</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Sé el primero en publicar aquí.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPosts.map((post, index) => {
              const showAd = (index + 1) % 6 === 0;
              const adIndex = Math.floor(index / 5) % currentAds.length;
              const ad = currentAds.length > 0 ? currentAds[adIndex] : null;

              return (
                <React.Fragment key={post.id}>
                  <PostCard
                    post={post}
                    onReport={handleReport}
                    onDelete={handleDeletePost}
                    onEdit={() => {
                      setEditingPost(post);
                      setShowPostForm(true);
                    }}
                    isAdmin={isAdmin}
                    isOwner={JSON.parse(localStorage.getItem('my_posts') || '[]').some(m => m.id === post.id)}
                    onComment={() => { }}
                  />
                  {showAd && ad && <AdCard ad={ad} />}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </main>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] transition-transform active:scale-95">
        <button
          onClick={() => {
            setEditingPost(null); // Ensure editingPost is null for new posts
            setShowPostForm(true);
          }}
          className="bg-secondary text-white font-black py-4 px-10 rounded-full shadow-[0_15px_30px_rgba(255,107,53,0.35)] flex items-center gap-2 whitespace-nowrap text-sm tracking-[0.2em] border-2 border-white/20 uppercase italic"
        >
          <Plus size={24} strokeWidth={4} />
          {isAdmin ? 'ADMIN POST' : 'Publicar'}
        </button>
      </div>

      {showPostForm && (
        <PostForm
          onClose={() => {
            setShowPostForm(false);
            setEditingPost(null);
          }}
          onSuccess={() => {
            setShowPostForm(false);
            setEditingPost(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          isAdmin={isAdmin}
          editData={editingPost}
          config={config}
        />
      )}
      {showAdminLogin && (
        <AdminPanel
          onClose={() => setShowAdminLogin(false)}
          onLogin={(val, profile) => {
            setIsAdmin(val);
            setUserProfile(profile);
            if (val) {
              setShowAdminLogin(false);
              setActiveTab('ADMIN');
            }
          }}
          isLoggedIn={isAdmin}
          userProfile={userProfile}
        />
      )}
    </div>
  );
}

export default App;
