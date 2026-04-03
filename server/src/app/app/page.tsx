'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { LogIn, UserPlus, KeyRound, Loader2, Coins, Globe } from 'lucide-react';
import { Lang, t } from '@/lib/translations';
import { initOneSignal } from '@/lib/onesignal';
import Image from 'next/image';
import { MobileDashboard } from '@/components/mobile/MobileDashboard';
import { MobileRegister } from '@/components/mobile/MobileRegister';

type Screen = 'login' | 'register' | 'welcome' | 'dashboard';

export default function MobileApp() {
  const [screen, setScreen] = useState<Screen>('login');
  const [lang, setLang] = useState<Lang>(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('app-lang') as Lang) || 'en' : 'en'
  );
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load OneSignal SDK
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  // Welcome auto-transition
  useEffect(() => {
    if (screen !== 'welcome') return;
    const timer = setTimeout(() => setScreen('dashboard'), 2500);
    return () => clearTimeout(timer);
  }, [screen]);

  const handleLogin = async () => {
    if (!username || !pin) { setError(t(lang, 'enter_credentials')); return; }
    setLoading(true);
    setError('');
    try {
      const q = query(
        collection(db, 'players'),
        where('username', '==', username.toLowerCase()),
        where('pin', '==', pin)
      );
      const snap = await getDocs(q);
      if (snap.empty) { setError(t(lang, 'invalid_credentials')); setLoading(false); return; }

      const playerDoc = snap.docs[0];
      const playerData = { uid: playerDoc.id, ...playerDoc.data() };

      if ((playerData as any).banned) { setError(t(lang, 'account_banned')); setLoading(false); return; }

      setPlayer(playerData);
      updateDoc(doc(db, 'players', playerDoc.id), { lastLogin: Date.now() }).catch(() => {});

      // Register with OneSignal
      initOneSignal(playerDoc.id, (playerData as any).username).catch(() => {});

      setScreen('welcome');
    } catch {
      setError(t(lang, 'connection_error'));
    }
    setLoading(false);
  };

  if (screen === 'dashboard' && player) {
    return <MobileDashboard player={player} lang={lang} onLogout={() => {
      setScreen('login'); setPlayer(null); setUsername(''); setPin('');
    }} />;
  }

  if (screen === 'register') {
    return <MobileRegister lang={lang} onBack={() => setScreen('login')} onRegistered={(p) => {
      setPlayer(p);
      initOneSignal(p.uid, p.username).catch(() => {});
      setScreen('dashboard');
    }} />;
  }

  // Welcome screen
  if (screen === 'welcome' && player) {
    const ninjaType = player.ninjaType || 'neon';
    return (
      <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center px-6" onClick={() => setScreen('dashboard')}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 150 }}>
          <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-ninja-green/30 mx-auto"
            style={{ boxShadow: '0 0 40px rgba(57,255,20,0.3)' }}>
            <Image src={`/img/pfp-${ninjaType}.png`} alt="Avatar" width={112} height={112} className="object-contain" />
          </div>
        </motion.div>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="font-ninja text-ninja-green text-lg mt-4 tracking-widest"
          style={{ textShadow: '0 0 20px rgba(57,255,20,0.5)' }}>
          {t(lang, 'welcome_back')}
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="font-ninja text-3xl text-white mt-2">{player.username?.toUpperCase()}</motion.h1>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="flex items-center gap-2 mt-4 px-5 py-2 rounded-full border border-ninja-green/20"
          style={{ background: 'rgba(57,255,20,0.05)' }}>
          <Coins size={16} className="text-yellow-400" />
          <span className="font-ninja text-lg text-yellow-400">{Math.floor(player.coins || 0)}</span>
        </motion.div>
      </div>
    );
  }

  // Login screen
  return (
    <div className="min-h-[100dvh] relative overflow-hidden flex flex-col">
      {/* Video Background */}
      <video ref={videoRef} autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ filter: 'brightness(0.3)' }}>
        <source src="/img/login-bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 z-[1]" />

      {/* Language Switcher */}
      <div className="relative z-10 flex justify-end gap-2 p-4 pt-[env(safe-area-inset-top,16px)]">
        {(['en', 'ar'] as Lang[]).map(l => (
          <button key={l} onClick={() => { setLang(l); localStorage.setItem('app-lang', l); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-body transition-all ${lang === l ? 'bg-white/15 text-white border border-white/20' : 'text-gray-500'}`}>
            {l === 'en' ? '🇺🇸 EN' : '🇸🇦 AR'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-6 pb-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-8">
          <Image src="/img/logo-ninja.png" alt="Ninja Games" width={180} height={180} />
        </motion.div>

        {/* Login Form */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl p-6 space-y-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(57,255,20,0.1)' }}>

          <div>
            <label className="text-gray-400 text-xs font-body mb-1 flex items-center gap-2">
              <LogIn size={12} className="text-ninja-green" /> {t(lang, 'username')}
            </label>
            <input type="text" value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_\u0600-\u06FF\u0750-\u077F]/g, ''))}
              className="w-full bg-black/50 border border-ninja-green/30 rounded-xl px-4 py-3.5 text-white font-body focus:border-ninja-green outline-none transition-all"
              placeholder={t(lang, 'username_placeholder')}
              autoComplete="username"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
          </div>

          <div>
            <label className="text-gray-400 text-xs font-body mb-1 flex items-center gap-2">
              <KeyRound size={12} className="text-ninja-green" /> {t(lang, 'pin')}
            </label>
            <input type="password" value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full bg-black/50 border border-ninja-green/30 rounded-xl px-4 py-3.5 text-white font-body text-xl tracking-[0.5em] text-center focus:border-ninja-green outline-none transition-all"
              placeholder="• • • •" maxLength={4} inputMode="numeric"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-center text-sm font-body">
              {error}
            </motion.p>
          )}

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleLogin} disabled={loading}
            className="w-full bg-ninja-green text-black py-4 rounded-xl font-ninja font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ boxShadow: '0 0 25px rgba(57,255,20,0.3)' }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
            {loading ? t(lang, 'connecting') : t(lang, 'login')}
          </motion.button>

          <button onClick={() => setScreen('register')}
            className="w-full py-3 border border-gray-700 rounded-xl text-gray-400 font-body text-sm flex items-center justify-center gap-2">
            <UserPlus size={14} /> {t(lang, 'register')}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
