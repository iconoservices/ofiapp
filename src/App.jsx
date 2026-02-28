import React, { useState, useEffect, useMemo, useRef } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  increment,
  setDoc
} from 'firebase/firestore';
import { Plus, Briefcase, ShieldCheck as ShieldIcon, Info, Bookmark as BookmarkIcon, AlertCircle, Settings, User, Edit, Sparkles, TrendingUp } from 'lucide-react';
import { CITIES, CATEGORIES } from './constants';
import Header from './components/Header';
import Filters from './components/Filters';
import PostCard from './components/PostCard';
import PostForm from './components/PostForm';
import CommentSection from './components/CommentSection';
import AdminPanel from './components/AdminPanel';
import AdCard from './components/AdCard';
import UserAuth from './components/UserAuth';
import UserProfileModal from './components/UserProfileModal';
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
  const [adminProfile, setAdminProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [sortMode, setSortMode] = useState('LOCATION'); // 'LOCATION' or 'RECENT'
  const [showUserAuth, setShowUserAuth] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  // Detección de ciudad automática
  useEffect(() => {
    const detectCity = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.city) {
          const matchedCity = CITIES.find(c => c.toLowerCase().includes(data.city.toLowerCase()));
          if (matchedCity) {
            setFilters(prev => ({ ...prev, city: matchedCity }));
          }
        }
      } catch (error) {
        console.error("Geo detect error:", error);
      }
    };
    detectCity();
  }, []);

  // Persistencia de Admin
  useEffect(() => {
    const savedAdmin = localStorage.getItem('admin_session');
    if (savedAdmin) {
      const parsed = JSON.parse(savedAdmin);
      setIsAdmin(true);
      setAdminProfile(parsed);
    }
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubAuth();
  }, []);

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
        if (activeTab === 'MIS_ANUNCIOS') {
          return myPostIds.includes(post.id) || (user && post.userId === user.uid);
        }

        // No filtramos por ciudad físicamente aquí, sino por tipo y categoría
        if (activeTab === 'TRABAJO') {
          if (post.tipo !== TYPES.BUSCO_TRABAJADOR) return false;
          const matchesQuery = post.descripcion.toLowerCase().includes(filters.query.toLowerCase()) ||
            post.categoria.toLowerCase().includes(filters.query.toLowerCase()) ||
            post.nombre.toLowerCase().includes(filters.query.toLowerCase());
          const matchesCategory = filters.category ? post.categoria === filters.category : true;
          return matchesQuery && matchesCategory;
        } else {
          return post.tipo === TYPES.SERVICIO_OFI;
        }
      })
      .sort((a, b) => {
        // 1. Pinned posts (Prioridad máxima en cualquier modo)
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;

        // 2. Verified Priority (Excepto si estamos en modo RECENT puro quizás, pero preferible mantenerlo)
        if (a.verificado && !b.verificado) return -1;
        if (!a.verificado && b.verificado) return 1;

        // 3. Mode Selection
        if (sortMode === 'LOCATION' && filters.city) {
          const aInCity = a.ciudad === filters.city;
          const bInCity = b.ciudad === filters.city;
          if (aInCity && !bInCity) return -1;
          if (!aInCity && bInCity) return 1;
        }

        // EXPLORE y RECENT se comportan similar en fecha, pero EXPLORE podría en el futuro ser aleatorio.
        // Por ahora mantenemos la cronología como base de calidad.
        return (b.fecha_publicacion?.seconds || 0) - (a.fecha_publicacion?.seconds || 0);
      });
  }, [posts, filters, activeTab, globalSettings.expirationDays, sortMode]);

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

  const handlePin = async (postId, currentStatus) => {
    await updateDoc(doc(db, 'postings', postId), { pinned: !currentStatus });
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
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(280);

  useEffect(() => {
    if (!headerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setHeaderHeight(entry.target.offsetHeight);
      }
    });
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, [activeTab]);

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
    <div className="min-h-screen bg-slate-50 relative font-sans">
      <div ref={headerRef} className={`fixed top-0 left-0 right-0 z-[100] bg-white transform transition-transform duration-500 ease-in-out ${headerVisible ? 'translate-y-0' : '-translate-y-full shadow-lg'}`}>
        <div className="max-w-6xl mx-auto">
          <Header
            onAdminClick={() => setShowAdminLogin(true)}
            onUserClick={() => {
              if (user) setShowUserProfile(true);
              else setShowUserAuth(true);
            }}
            isAdmin={isAdmin}
            user={user}
            onLogin={(u) => setUser(u)}
          />

          {/* Tabs Row moved inside the sticky container for synchronized hide/show */}
          <div className="flex bg-white px-2 pt-2 border-b border-slate-50 overflow-x-auto hide-scrollbar">
            <button id="tab-trabajadores" onClick={() => setActiveTab('TRABAJO')} className={`min-w-[70px] flex-1 flex flex-col items-center gap-1 py-2 border-b-4 transition-all ${activeTab === 'TRABAJO' ? 'border-primary text-primary font-black' : 'border-transparent text-slate-400 font-bold'}`}><Briefcase size={16} /><span className="text-[8px] sm:text-[9px] uppercase tracking-tighter italic whitespace-nowrap">Buscadores</span></button>
            <button id="tab-certificados" onClick={() => setActiveTab('SERVICIOS')} className={`min-w-[70px] flex-1 flex flex-col items-center gap-1 py-2 border-b-4 transition-all ${activeTab === 'SERVICIOS' ? 'border-amber-400 text-amber-600 font-black' : 'border-transparent text-slate-400 font-bold'}`}><ShieldIcon size={16} /><span className="text-[8px] sm:text-[9px] uppercase tracking-tighter italic whitespace-nowrap">Certificados</span></button>
            <button id="tab-mis-anuncios" onClick={() => setActiveTab('MIS_ANUNCIOS')} className={`min-w-[70px] flex-1 flex flex-col items-center gap-1 py-2 border-b-4 transition-all ${activeTab === 'MIS_ANUNCIOS' ? 'border-indigo-400 text-indigo-600 font-black' : 'border-transparent text-slate-400 font-bold'}`}><User size={16} /><span className="text-[8px] sm:text-[9px] uppercase tracking-tighter italic whitespace-nowrap">Mis Posts</span></button>
            <button id="tab-guardados" onClick={() => setActiveTab('GUARDADOS')} className={`min-w-[70px] flex-1 flex flex-col items-center gap-1 py-2 border-b-4 transition-all ${activeTab === 'GUARDADOS' ? 'border-red-400 text-red-600 font-black' : 'border-transparent text-slate-400 font-bold'}`}><BookmarkIcon size={16} /><span className="text-[8px] sm:text-[9px] uppercase tracking-tighter italic whitespace-nowrap">Guardados</span></button>
            {isAdmin && (
              <button id="tab-mando" onClick={() => setActiveTab('ADMIN')} className={`min-w-[70px] flex-1 flex flex-col items-center gap-1 py-2 border-b-4 transition-all ${activeTab === 'ADMIN' ? 'border-slate-800 text-slate-800 font-black' : 'border-transparent text-slate-400 font-bold animate-pulse'}`}><Settings size={16} /><span className="text-[8px] sm:text-[9px] uppercase tracking-tighter italic whitespace-nowrap">Mando</span></button>
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
      </div>

      <div style={{ paddingTop: `${headerHeight + 24}px` }} className="max-w-[1440px] mx-auto pb-32 flex flex-col lg:flex-row gap-6 px-4 transition-all duration-300">
        {/* Left Sidebar for PC (New) */}
        <aside className="hidden lg:block w-[300px] shrink-0 space-y-6">
          <div style={{ top: `${headerHeight + 24}px` }} className="sticky space-y-6">
            <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-xl shadow-slate-200/50">
              <div className="flex items-center gap-2 text-indigo-500 mb-4">
                <Info size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Información</span>
              </div>
              <h4 className="text-xl font-black italic tracking-tighter leading-none mb-3">LA RED DE TRABAJO #1</h4>
              <p className="text-slate-400 text-[11px] font-medium leading-relaxed">Conectamos miles de oportunidades diariamente en toda la Amazonía.</p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp size={14} className="text-primary" /> Sugeridos
                </span>
              </div>
              {currentAds.length > 1 ? (
                <AdCard ad={currentAds[1]} />
              ) : (
                <div className="bg-slate-100/50 rounded-[32px] p-8 border border-dashed border-slate-200 text-center">
                  <Plus className="mx-auto text-slate-300 mb-2" size={24} />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tu marca aquí</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 space-y-6">
          {dbError && (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3">
              <AlertCircle className="text-amber-500 shrink-0" size={20} />
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest leading-tight italic">
                Sin conexión. Los anuncios se sincronizarán al volver Internet.
              </p>
            </div>
          )}

          {activeTab === 'ADMIN' ? (
            <AdminPanel
              onClose={() => setActiveTab('TRABAJO')}
              onLogin={(val, profile) => {
                setIsAdmin(val);
                setAdminProfile(profile);
                if (val) {
                  localStorage.setItem('admin_session', JSON.stringify(profile));
                } else {
                  localStorage.removeItem('admin_session');
                  setActiveTab('TRABAJO');
                }
              }}
              isLoggedIn={isAdmin}
              userProfile={adminProfile}
              inlineMode={true}
            />
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4 font-sans">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest italic animate-pulse">Sincronizando Ofi...</p>
            </div>
          ) : (
            <>
              {/* Sorting Bar */}
              {(activeTab === 'TRABAJO' || activeTab === 'SERVICIOS') && filteredPosts.length > 0 && (
                <div className="flex items-center gap-2 mb-4 overflow-x-auto hide-scrollbar pb-2 px-1">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mr-2 shrink-0">Vistas:</span>
                  <button
                    onClick={() => setSortMode('LOCATION')}
                    className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all whitespace-nowrap shadow-sm border ${sortMode === 'LOCATION' ? 'bg-primary text-white border-primary shadow-primary/20 scale-105' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                  >
                    📍 Cerca de mí
                  </button>
                  <button
                    onClick={() => setSortMode('RECENT')}
                    className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all whitespace-nowrap shadow-sm border ${sortMode === 'RECENT' ? 'bg-indigo-500 text-white border-indigo-500 shadow-indigo-200/50 scale-105' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                  >
                    🕒 Lo más reciente
                  </button>
                  <button
                    onClick={() => setSortMode('EXPLORE')}
                    className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all whitespace-nowrap shadow-sm border ${sortMode === 'EXPLORE' ? 'bg-emerald-500 text-white border-emerald-500 shadow-emerald-200/50 scale-105' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                  >
                    🌍 Explorar Todo
                  </button>
                </div>
              )}

              {filteredPosts.length === 0 ? (
                <div className="text-center py-24 px-8 font-sans">
                  <div className="text-6xl mb-6 grayscale opacity-20">🌴</div>
                  <h3 className="text-xl font-black text-slate-700 italic tracking-tighter uppercase">Sin resultados</h3>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Sé el primero en publicar aquí.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                  {filteredPosts.map((post, index) => {
                    const showAd = (index + 1) % 4 === 0;
                    const adIndex = Math.floor(index / 4) % (currentAds.length || 1);
                    const ad = currentAds.length > 0 ? currentAds[adIndex] : null;

                    return (
                      <React.Fragment key={post.id || index}>
                        <PostCard
                          post={post}
                          onReport={handleReport}
                          onDelete={handleDeletePost}
                          onEdit={() => {
                            setEditingPost(post);
                            setShowPostForm(true);
                          }}
                          onPin={() => handlePin(post.id, post.pinned)}
                          isAdmin={isAdmin}
                          isOwner={user?.uid === post.userId || JSON.parse(localStorage.getItem('my_posts') || '[]').some(m => m.id === post.id)}
                          onComment={() => { }}
                        />
                        {showAd && ad && <div className="sm:col-span-2 lg:col-span-2"><AdCard ad={ad} /></div>}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>

        {/* Desktop Sidebar for Paid Ads (Right) */}
        <aside className="hidden lg:block w-[300px] shrink-0 space-y-6">
          <div style={{ top: `${headerHeight + 24}px` }} className="sticky space-y-6">
            <div className="bg-slate-900 rounded-[32px] p-6 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 bg-primary/20 blur-3xl rounded-full"></div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <TrendingUp size={20} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Destacados</span>
                </div>
                <h4 className="text-xl font-black italic leading-tight uppercase tracking-tighter">Impulsa tu <br />Negocio Aquí</h4>
                <p className="text-slate-400 text-xs font-medium leading-relaxed">Publicidad premium con impacto real en toda la región.</p>
                <button className="w-full bg-white text-dark py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl active:scale-95">
                  Ver Tarifas
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-400" /> Publicidad Pagada
                </span>
              </div>
              {currentAds.length > 0 ? (
                currentAds.slice(0, 3).map(ad => (
                  <AdCard key={ad.id} ad={ad} />
                ))
              ) : (
                <AdCard /> // Shows default ad space
              )}
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] transition-transform active:scale-95">
        <button
          id="btn-publicar"
          onClick={() => {
            setEditingPost(null);
            setShowPostForm(true);
          }}
          className="bg-secondary text-white font-black py-4 px-10 rounded-full shadow-[0_15px_30px_rgba(255,107,53,0.35)] flex items-center gap-2 whitespace-nowrap text-sm tracking-[0.2em] border-2 border-white/20 uppercase italic"
        >
          <Plus size={24} strokeWidth={4} />
          {isAdmin ? 'ADMIN POST' : 'Publicar'}
        </button>
      </div>

      {
        showPostForm && (
          <PostForm
            onClose={() => {
              setShowPostForm(false);
              setEditingPost(null);
            }}
            onSuccess={(typePost) => {
              setShowPostForm(false);
              setEditingPost(null);
              // Cambiar a la pestaña correspondiente y resetear filtro de orden
              if (typePost === TYPES.SERVICIO_OFI) {
                setActiveTab('SERVICIOS');
              } else {
                setActiveTab('TRABAJO');
              }
              setSortMode('RECENT');
              setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }, 100);
            }}
            isAdmin={isAdmin}
            editData={editingPost}
            config={config}
            userId={user?.uid}
          />
        )
      }

      {
        showAdminLogin && (
          <AdminPanel
            onClose={() => setShowAdminLogin(false)}
            onLogin={(val, profile) => {
              setIsAdmin(val);
              setAdminProfile(profile);
              if (val) {
                localStorage.setItem('admin_session', JSON.stringify(profile));
                setShowAdminLogin(false);
                setActiveTab('ADMIN');
              } else {
                localStorage.removeItem('admin_session');
              }
            }}
            isLoggedIn={isAdmin}
            userProfile={adminProfile}
          />
        )
      }

      {
        showUserAuth && (
          <UserAuth
            onClose={() => setShowUserAuth(false)}
            onLogin={(u) => {
              setUser(u);
              setShowUserAuth(false);
            }}
          />
        )
      }

      {
        showUserProfile && (
          <UserProfileModal
            user={user}
            onClose={() => setShowUserProfile(false)}
            onLogout={() => {
              import('firebase/auth').then(({ signOut }) => {
                signOut(auth);
                setUser(null);
              });
            }}
          />
        )
      }
    </div >
  );
}

export default App;
