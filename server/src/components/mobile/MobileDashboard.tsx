'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, addDoc, orderBy, limit } from 'firebase/firestore';
import { COINS_PER_MINUTE } from '@/lib/constants';
import { calculateTotalXP, getLevelInfo } from '@/lib/xp';
import { Lang, t } from '@/lib/translations';
import Image from 'next/image';
import { Coins, Trophy, Package, User, ClipboardCheck, Users, LogOut, Timer, Gift, Star, Play, Send, Loader2, X, ChevronRight, Home } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────
type Tab = 'home' | 'chests' | 'friends' | 'tasks' | 'profile';

interface Props {
  player: any;
  lang: Lang;
  onLogout: () => void;
}

// ─── Ninja type metadata ─────────────────────────────────────
const NINJA_TYPES = [
  { id: 'neon',   label: 'Neon',   color: '#39FF14' },
  { id: 'fire',   label: 'Fire',   color: '#FF4500' },
  { id: 'ice',    label: 'Ice',    color: '#00BFFF' },
  { id: 'shadow', label: 'Shadow', color: '#8B00FF' },
  { id: 'cyber',  label: 'Cyber',  color: '#9B59B6' },
];

// ─── Tab transition variants ─────────────────────────────────
const pageVariants = {
  initial:  { opacity: 0, y: 24 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit:     { opacity: 0, y: -16, transition: { duration: 0.15 } },
};

// ─── Chest tier config ───────────────────────────────────────
const CHEST_META: Record<string, { img: string; label: string; glow: string }> = {
  bronze:    { img: '/img/chest-bronze.png',     label: 'Bronze Chest',    glow: 'rgba(205,127,50,0.5)' },
  silver:    { img: '/img/chest-silver.png',     label: 'Silver Chest',    glow: 'rgba(192,192,192,0.5)' },
  gold:      { img: '/img/chest-gold.png',       label: 'Gold Chest',      glow: 'rgba(255,215,0,0.5)' },
  legendary: { img: '/img/chest-legendary.png',  label: 'Legendary Chest', glow: 'rgba(155,89,182,0.5)' },
  ninja:     { img: '/img/chest-ninja.png',      label: 'Ninja Chest',     glow: 'rgba(57,255,20,0.5)' },
};

// Possible roulette rewards for chest opening animation
const ROULETTE_ITEMS = [
  { label: '10 Tokens',   icon: '🪙', color: '#FFD700' },
  { label: '25 Tokens',   icon: '🪙', color: '#FFD700' },
  { label: '50 Tokens',   icon: '🪙', color: '#FFD700' },
  { label: '150 Tokens',  icon: '💰', color: '#FF6F00' },
  { label: 'Free Drink',  icon: '🥤', color: '#1E88E5' },
  { label: 'Free Snack',  icon: '🍪', color: '#8D6E63' },
  { label: '30 Min Play',  icon: '⏱️', color: '#39FF14' },
  { label: 'Free Meal',   icon: '🍔', color: '#FF4500' },
  { label: '1h Free Play', icon: '🎮', color: '#A855F7' },
  { label: '500 Tokens',  icon: '💎', color: '#FFD700' },
];

// ═══════════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════════
export function MobileDashboard({ player, lang, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [livePlayer, setLivePlayer] = useState<any>(player);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [dailyTasks, setDailyTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Chest opening state
  const [openingChest, setOpeningChest] = useState<any>(null);
  const [rouletteRunning, setRouletteRunning] = useState(false);
  const [revealedReward, setRevealedReward] = useState<any>(null);

  // Friends tab
  const [friendSearch, setFriendSearch] = useState('');
  const [friendSearchResults, setFriendSearchResults] = useState<any[]>([]);
  const [searchingFriend, setSearchingFriend] = useState(false);
  const [sendingCoins, setSendingCoins] = useState<string | null>(null);
  const [sendAmount, setSendAmount] = useState('');

  // Profile
  const [selectedNinja, setSelectedNinja] = useState(player.ninjaType || 'neon');
  const [savingNinja, setSavingNinja] = useState(false);

  // ─── Real-time player listener ─────────────────────────────
  useEffect(() => {
    if (!player?.uid) return;
    const unsub = onSnapshot(doc(db, 'players', player.uid), (snap) => {
      if (snap.exists()) setLivePlayer({ uid: player.uid, ...snap.data() });
    });
    return () => unsub();
  }, [player?.uid]);

  // ─── Fetch top 5 leaderboard ───────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, 'players'), orderBy('totalPlaytime', 'desc'), limit(5));
        const snap = await getDocs(q);
        setTopPlayers(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
      } catch {}
    })();
  }, []);

  // ─── Fetch friends ─────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'friends') return;
    const friendIds: string[] = livePlayer.friends || [];
    if (friendIds.length === 0) { setFriends([]); return; }
    (async () => {
      const results: any[] = [];
      for (const fid of friendIds) {
        try {
          const snap = await getDocs(query(collection(db, 'players'), where('__name__', '==', fid)));
          snap.forEach((d) => results.push({ uid: d.id, ...d.data() }));
        } catch {}
      }
      setFriends(results);
    })();
  }, [activeTab, livePlayer.friends]);

  // ─── Fetch daily tasks ─────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'tasks' || !player?.uid) return;
    setLoadingTasks(true);
    const unsub = onSnapshot(doc(db, 'dailyTasks', player.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setDailyTasks(data.tasks || []);
      } else {
        setDailyTasks([]);
      }
      setLoadingTasks(false);
    });
    return () => unsub();
  }, [activeTab, player?.uid]);

  // ─── Derived data ──────────────────────────────────────────
  const totalXP   = calculateTotalXP(livePlayer);
  const levelInfo = getLevelInfo(totalXP);
  const coins     = livePlayer.coins ?? 0;
  const minutesLeft = Math.floor(coins / COINS_PER_MINUTE);
  const hoursLeft   = Math.floor(minutesLeft / 60);
  const minsLeft    = minutesLeft % 60;

  const ninjaColor = NINJA_TYPES.find((n) => n.id === (livePlayer.ninjaType || 'neon'))?.color || '#39FF14';

  // ─── Chest helpers ─────────────────────────────────────────
  const availableChests = (livePlayer.inventory || []).filter(
    (i: any) => !i.used && i.type === 'chest'
  );

  async function handleOpenChest(chest: any) {
    setOpeningChest(chest);
    setRevealedReward(null);
    setRouletteRunning(true);

    // Simulate roulette spin
    await new Promise((r) => setTimeout(r, 2800));

    // Pick random reward
    const reward = ROULETTE_ITEMS[Math.floor(Math.random() * ROULETTE_ITEMS.length)];
    setRouletteRunning(false);
    setRevealedReward(reward);

    // Mark chest as used in Firestore
    try {
      const updatedInventory = (livePlayer.inventory || []).map((item: any) =>
        item.id === chest.id ? { ...item, used: true } : item
      );
      await updateDoc(doc(db, 'players', player.uid), { inventory: updatedInventory });
    } catch {}
  }

  // ─── Friend search ─────────────────────────────────────────
  async function handleFriendSearch() {
    if (!friendSearch.trim()) return;
    setSearchingFriend(true);
    try {
      const q = query(collection(db, 'players'), where('username', '==', friendSearch.trim()));
      const snap = await getDocs(q);
      setFriendSearchResults(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
    } catch {}
    setSearchingFriend(false);
  }

  async function handleAddFriend(friendUid: string) {
    const currentFriends: string[] = livePlayer.friends || [];
    if (currentFriends.includes(friendUid)) return;
    try {
      await updateDoc(doc(db, 'players', player.uid), {
        friends: [...currentFriends, friendUid],
      });
    } catch {}
  }

  async function handleSendCoins(friendUid: string) {
    const amount = parseInt(sendAmount);
    if (!amount || amount <= 0 || amount > coins) return;
    try {
      // Deduct from player
      await updateDoc(doc(db, 'players', player.uid), { coins: coins - amount });
      // Add to friend — fetch current coins first
      const friendSnap = await getDocs(query(collection(db, 'players'), where('__name__', '==', friendUid)));
      friendSnap.forEach(async (d) => {
        const friendCoins = d.data().coins || 0;
        await updateDoc(doc(db, 'players', friendUid), { coins: friendCoins + amount });
      });
      setSendingCoins(null);
      setSendAmount('');
    } catch {}
  }

  // ─── Task claim ────────────────────────────────────────────
  async function handleClaimTask(taskIndex: number) {
    const task = dailyTasks[taskIndex];
    if (!task || task.claimed) return;
    const updatedTasks = [...dailyTasks];
    updatedTasks[taskIndex] = { ...task, claimed: true };
    try {
      await updateDoc(doc(db, 'dailyTasks', player.uid), { tasks: updatedTasks });
      // Add reward coins
      if (task.reward) {
        await updateDoc(doc(db, 'players', player.uid), { coins: coins + (task.reward || 0) });
      }
    } catch {}
  }

  // ─── Ninja type change ─────────────────────────────────────
  async function handleNinjaChange(ninjaId: string) {
    setSelectedNinja(ninjaId);
    setSavingNinja(true);
    try {
      await updateDoc(doc(db, 'players', player.uid), { ninjaType: ninjaId });
    } catch {}
    setSavingNinja(false);
  }

  // ═══════════════════════════════════════════════════════════
  //  TABS CONFIG
  // ═══════════════════════════════════════════════════════════
  const tabs: { id: Tab; icon: typeof Coins; label: string }[] = [
    { id: 'home',    icon: Home,           label: t(lang, 'home_tab') || 'Home' },
    { id: 'chests',  icon: Package,        label: t(lang, 'chests') || 'Chests' },
    { id: 'friends', icon: Users,          label: t(lang, 'friends') || 'Friends' },
    { id: 'tasks',   icon: ClipboardCheck, label: t(lang, 'daily_tasks') || 'Tasks' },
    { id: 'profile', icon: User,           label: t(lang, 'profile') || 'Profile' },
  ];

  // ═══════════════════════════════════════════════════════════
  //  RENDER — HOME TAB
  // ═══════════════════════════════════════════════════════════
  function renderHome() {
    return (
      <div className="flex flex-col items-center gap-5 px-4 pt-4 pb-8">
        {/* Avatar */}
        <div className="relative">
          <div
            className="w-28 h-28 rounded-full overflow-hidden border-[3px]"
            style={{ borderColor: ninjaColor, boxShadow: `0 0 28px ${ninjaColor}44` }}
          >
            <img
              src={livePlayer.avatar || `/img/pfp-${livePlayer.ninjaType || 'neon'}.png`}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Level badge */}
          <div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold font-ninja"
            style={{ background: levelInfo.color, color: '#000' }}
          >
            LVL {levelInfo.level}
          </div>
        </div>

        {/* Name + title */}
        <div className="text-center">
          <h2 className="font-ninja text-xl text-white">{livePlayer.username}</h2>
          <p className="text-xs font-body" style={{ color: levelInfo.color }}>{levelInfo.title}</p>
        </div>

        {/* XP Bar */}
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-[10px] text-white/50 font-body mb-1">
            <span>XP {levelInfo.currentXP.toLocaleString()}</span>
            <span>{levelInfo.xpForNext.toLocaleString()}</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${levelInfo.color}, ${ninjaColor})` }}
              initial={{ width: 0 }}
              animate={{ width: `${(levelInfo.progress * 100).toFixed(1)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Coins & Time */}
        <div className="flex gap-4 w-full max-w-xs">
          <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/5">
            <Coins className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
            <p className="text-2xl font-ninja text-yellow-400">{coins.toLocaleString()}</p>
            <p className="text-[10px] text-white/40 font-body">{t(lang, 'coins')}</p>
          </div>
          <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/5">
            <Timer className="w-5 h-5 mx-auto mb-1 text-[#39FF14]" />
            <p className="text-2xl font-ninja text-[#39FF14]">
              {hoursLeft > 0 ? `${hoursLeft}h ${minsLeft}m` : `${minsLeft}m`}
            </p>
            <p className="text-[10px] text-white/40 font-body">{t(lang, 'time_left')}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 w-full max-w-xs">
          {[
            { label: t(lang, 'open_chest') || 'Open Chest', icon: Gift,           tab: 'chests' as Tab,  color: '#A855F7' },
            { label: t(lang, 'daily_tasks') || 'Tasks',     icon: ClipboardCheck, tab: 'tasks' as Tab,   color: '#39FF14' },
            { label: t(lang, 'leaderboard') || 'Ranks',     icon: Trophy,         tab: 'home' as Tab,    color: '#FFD700' },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => setActiveTab(action.tab)}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/5 border border-white/5 active:scale-95 transition-transform"
            >
              <action.icon className="w-5 h-5" style={{ color: action.color }} />
              <span className="text-[10px] text-white/70 font-body">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Mini leaderboard */}
        <div className="w-full max-w-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-ninja text-sm text-white/80 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-yellow-400" />
              {t(lang, 'leaderboard_title') || 'LEADERBOARD'}
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            {topPlayers.map((p, i) => {
              const xp = calculateTotalXP(p);
              const info = getLevelInfo(xp);
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div
                  key={p.uid}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/5"
                >
                  <span className="text-base w-6 text-center">{medals[i] || `#${i + 1}`}</span>
                  <div className="w-8 h-8 rounded-full overflow-hidden border" style={{ borderColor: info.color }}>
                    <img
                      src={p.avatar || `/img/pfp-${p.ninjaType || 'neon'}.png`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-body truncate">{p.username}</p>
                    <p className="text-[10px] font-body" style={{ color: info.color }}>
                      Lvl {info.level} &middot; {info.title}
                    </p>
                  </div>
                  <p className="text-xs text-white/40 font-body">{(p.totalPlaytime || 0).toLocaleString()}m</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  RENDER — CHESTS TAB
  // ═══════════════════════════════════════════════════════════
  function renderChests() {
    return (
      <div className="flex flex-col gap-5 px-4 pt-4 pb-8">
        <h2 className="font-ninja text-lg text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-[#A855F7]" />
          {t(lang, 'chests') || 'Chests'}
        </h2>

        {availableChests.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <Package className="w-16 h-16 text-white/10" />
            <p className="text-white/40 font-body text-sm">No chests available</p>
            <p className="text-white/25 font-body text-xs max-w-[240px]">
              Complete daily tasks and earn achievements to unlock chests!
            </p>
            <button
              onClick={() => setActiveTab('tasks')}
              className="px-5 py-2 rounded-full bg-[#39FF14]/10 text-[#39FF14] text-xs font-ninja border border-[#39FF14]/20 active:scale-95 transition-transform"
            >
              View Tasks
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {availableChests.map((chest: any) => {
              const meta = CHEST_META[chest.tier] || CHEST_META.bronze;
              return (
                <motion.div
                  key={chest.id}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5"
                  whileTap={{ scale: 0.97 }}
                >
                  <div
                    className="w-20 h-20 flex-shrink-0 rounded-xl flex items-center justify-center"
                    style={{ boxShadow: `0 0 20px ${meta.glow}` }}
                  >
                    <img src={meta.img} alt={meta.label} className="w-16 h-16 object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-ninja text-sm text-white">{meta.label}</p>
                    <p className="text-[10px] text-white/40 font-body mt-0.5">Tap to open</p>
                  </div>
                  <button
                    onClick={() => handleOpenChest(chest)}
                    className="px-5 py-2 rounded-full font-ninja text-xs text-black bg-[#39FF14] active:scale-90 transition-transform"
                  >
                    OPEN
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Chest opening overlay */}
        <AnimatePresence>
          {openingChest && (
            <motion.div
              className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center px-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Close button */}
              {revealedReward && (
                <button
                  onClick={() => { setOpeningChest(null); setRevealedReward(null); }}
                  className="absolute top-12 right-5 p-2 text-white/50"
                >
                  <X className="w-6 h-6" />
                </button>
              )}

              {rouletteRunning ? (
                <>
                  {/* Spinning roulette */}
                  <motion.div
                    className="w-28 h-28 mb-8"
                    animate={{ rotateY: [0, 360] }}
                    transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
                  >
                    <img
                      src={CHEST_META[openingChest.tier]?.img || '/img/chest-bronze.png'}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </motion.div>
                  {/* Roulette strip */}
                  <div className="relative w-full max-w-xs h-20 overflow-hidden rounded-2xl bg-white/5 border border-white/10">
                    <motion.div
                      className="flex gap-4 absolute top-0 left-0 h-full items-center px-4"
                      animate={{ x: [0, -2400] }}
                      transition={{ duration: 2.8, ease: [0.15, 0.85, 0.35, 1] }}
                    >
                      {Array.from({ length: 30 }).map((_, i) => {
                        const item = ROULETTE_ITEMS[i % ROULETTE_ITEMS.length];
                        return (
                          <div
                            key={i}
                            className="flex-shrink-0 w-20 h-16 rounded-xl flex flex-col items-center justify-center bg-white/5"
                          >
                            <span className="text-2xl">{item.icon}</span>
                            <span className="text-[8px] text-white/60 mt-0.5">{item.label}</span>
                          </div>
                        );
                      })}
                    </motion.div>
                    {/* Center indicator */}
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-[#39FF14] z-10" />
                  </div>
                  <p className="mt-6 text-white/50 font-body text-sm animate-pulse">Opening...</p>
                </>
              ) : revealedReward ? (
                <motion.div
                  className="flex flex-col items-center gap-4"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                >
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
                    style={{ background: `${revealedReward.color}22`, boxShadow: `0 0 40px ${revealedReward.color}44` }}
                  >
                    {revealedReward.icon}
                  </div>
                  <p className="font-ninja text-lg text-white">{t(lang, 'you_got') || 'You got'}</p>
                  <p className="font-ninja text-2xl" style={{ color: revealedReward.color }}>
                    {revealedReward.label}
                  </p>
                  <button
                    onClick={() => { setOpeningChest(null); setRevealedReward(null); }}
                    className="mt-4 px-8 py-3 rounded-full bg-[#39FF14] text-black font-ninja text-sm active:scale-95 transition-transform"
                  >
                    AWESOME!
                  </button>
                </motion.div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  RENDER — FRIENDS TAB
  // ═══════════════════════════════════════════════════════════
  function renderFriends() {
    return (
      <div className="flex flex-col gap-5 px-4 pt-4 pb-8">
        <h2 className="font-ninja text-lg text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-[#39FF14]" />
          {t(lang, 'friends') || 'Friends'}
        </h2>

        {/* Search */}
        <div className="flex gap-2">
          <input
            type="text"
            value={friendSearch}
            onChange={(e) => setFriendSearch(e.target.value)}
            placeholder={lang === 'ar' ? 'ابحث باسم المستخدم...' : 'Search username...'}
            className="flex-1 h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-body placeholder:text-white/30 outline-none focus:border-[#39FF14]/40"
          />
          <button
            onClick={handleFriendSearch}
            disabled={searchingFriend}
            className="h-10 px-4 rounded-xl bg-[#39FF14]/10 text-[#39FF14] font-ninja text-xs border border-[#39FF14]/20 active:scale-95 transition-transform disabled:opacity-50"
          >
            {searchingFriend ? <Loader2 className="w-4 h-4 animate-spin" /> : t(lang, 'add_friend') || 'Add'}
          </button>
        </div>

        {/* Search results */}
        {friendSearchResults.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-white/40 font-body">Search results</p>
            {friendSearchResults.map((fr) => (
              <div key={fr.uid} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-white/10">
                  <img src={fr.avatar || `/img/pfp-${fr.ninjaType || 'neon'}.png`} alt="" className="w-full h-full object-cover" />
                </div>
                <p className="flex-1 text-sm text-white font-body">{fr.username}</p>
                <button
                  onClick={() => handleAddFriend(fr.uid)}
                  className="px-4 py-1.5 rounded-full bg-[#39FF14] text-black text-xs font-ninja active:scale-95 transition-transform"
                >
                  + {t(lang, 'add_friend') || 'Add'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Friends list */}
        <div className="flex flex-col gap-2">
          {friends.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Users className="w-12 h-12 text-white/10" />
              <p className="text-white/40 font-body text-sm">No friends yet</p>
              <p className="text-white/25 font-body text-xs">Search for a username to add friends</p>
            </div>
          ) : (
            friends.map((friend) => {
              const isOnline = friend.status === 'online' || friend.isOnline;
              return (
                <div key={friend.uid} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10">
                      <img src={friend.avatar || `/img/pfp-${friend.ninjaType || 'neon'}.png`} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a0a0a] ${
                        isOnline ? 'bg-[#39FF14]' : 'bg-white/20'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-body truncate">{friend.username}</p>
                    <p className="text-[10px] text-white/30 font-body">
                      {isOnline ? (friend.currentGame || t(lang, 'online') || 'Online') : (t(lang, 'offline') || 'Offline')}
                    </p>
                  </div>

                  {sendingCoins === friend.uid ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={sendAmount}
                        onChange={(e) => setSendAmount(e.target.value)}
                        placeholder="0"
                        className="w-16 h-8 px-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs text-center outline-none"
                      />
                      <button
                        onClick={() => handleSendCoins(friend.uid)}
                        className="h-8 px-3 rounded-lg bg-yellow-500 text-black text-xs font-ninja active:scale-95"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => { setSendingCoins(null); setSendAmount(''); }}
                        className="h-8 px-2 text-white/30"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSendingCoins(friend.uid)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px] font-ninja border border-yellow-500/20 active:scale-95 transition-transform"
                    >
                      <Coins className="w-3 h-3" />
                      {t(lang, 'send_coins') || 'Send'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  RENDER — TASKS TAB
  // ═══════════════════════════════════════════════════════════
  function renderTasks() {
    return (
      <div className="flex flex-col gap-5 px-4 pt-4 pb-8">
        <h2 className="font-ninja text-lg text-white flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-[#39FF14]" />
          {t(lang, 'daily_tasks_title') || 'DAILY TASKS'}
        </h2>

        {loadingTasks ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#39FF14] animate-spin" />
          </div>
        ) : dailyTasks.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <ClipboardCheck className="w-14 h-14 text-white/10" />
            <p className="text-white/40 font-body text-sm">No tasks available</p>
            <p className="text-white/25 font-body text-xs">Check back tomorrow for new challenges!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {dailyTasks.map((task: any, i: number) => {
              const progress = Math.min((task.progress || 0) / (task.goal || 1), 1);
              const isComplete = progress >= 1;
              return (
                <div
                  key={i}
                  className={`p-4 rounded-2xl border transition-colors ${
                    task.claimed
                      ? 'bg-white/[0.02] border-white/5 opacity-50'
                      : isComplete
                      ? 'bg-[#39FF14]/5 border-[#39FF14]/20'
                      : 'bg-white/5 border-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <p className="text-sm text-white font-body">{task.name}</p>
                      <p className="text-[10px] text-white/30 font-body mt-0.5">{task.description}</p>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-400 text-xs font-ninja">
                      <Coins className="w-3 h-3" />
                      {task.reward}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-2">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: isComplete ? '#39FF14' : 'rgba(255,255,255,0.25)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress * 100}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-white/40 font-body">
                      {task.progress || 0} / {task.goal}
                    </p>
                    {task.claimed ? (
                      <span className="text-[10px] text-white/30 font-ninja">{t(lang, 'completed') || 'Completed'}</span>
                    ) : isComplete ? (
                      <button
                        onClick={() => handleClaimTask(i)}
                        className="px-4 py-1.5 rounded-full bg-[#39FF14] text-black text-xs font-ninja active:scale-95 transition-transform"
                      >
                        {t(lang, 'claim') || 'Claim'}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  RENDER — PROFILE TAB
  // ═══════════════════════════════════════════════════════════
  function renderProfile() {
    const stats = livePlayer.stats || {};
    return (
      <div className="flex flex-col items-center gap-5 px-4 pt-4 pb-8">
        {/* Avatar + info */}
        <div className="relative">
          <div
            className="w-24 h-24 rounded-full overflow-hidden border-[3px]"
            style={{ borderColor: ninjaColor, boxShadow: `0 0 36px ${ninjaColor}55` }}
          >
            <img
              src={livePlayer.avatar || `/img/pfp-${livePlayer.ninjaType || 'neon'}.png`}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="text-center">
          <h2 className="font-ninja text-xl text-white">{livePlayer.username}</h2>
          <p className="text-xs font-body" style={{ color: levelInfo.color }}>
            {levelInfo.title} &middot; Level {levelInfo.level}
          </p>
          <p className="text-[10px] text-white/30 font-body mt-1">
            {totalXP.toLocaleString()} Total XP
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          {[
            { label: t(lang, 'playtime') || 'Playtime',       value: `${(livePlayer.totalPlaytime || 0).toLocaleString()}m`,  icon: Timer, color: '#39FF14' },
            { label: t(lang, 'coins') || 'Coins Earned',      value: (livePlayer.totalCoinsSpent || 0).toLocaleString(),       icon: Coins, color: '#FFD700' },
            { label: t(lang, 'chests_opened') || 'Chests',    value: stats.chestsOpened || 0,                                  icon: Package, color: '#A855F7' },
            { label: t(lang, 'friends') || 'Friends',          value: (livePlayer.friends || []).length,                        icon: Users, color: '#3B82F6' },
            { label: t(lang, 'wins') || 'Wins',               value: stats.totalWins || 0,                                     icon: Trophy, color: '#FF6F00' },
            { label: t(lang, 'games_played') || 'Games',      value: stats.gamesPlayed || 0,                                   icon: Play, color: '#00BFFF' },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <stat.icon className="w-4 h-4 flex-shrink-0" style={{ color: stat.color }} />
              <div>
                <p className="text-sm text-white font-ninja">{stat.value}</p>
                <p className="text-[9px] text-white/35 font-body">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Ninja type selector */}
        <div className="w-full max-w-xs">
          <p className="font-ninja text-xs text-white/50 mb-3">NINJA TYPE</p>
          <div className="flex gap-2 flex-wrap justify-center">
            {NINJA_TYPES.map((ninja) => (
              <button
                key={ninja.id}
                onClick={() => handleNinjaChange(ninja.id)}
                disabled={savingNinja}
                className={`px-4 py-2 rounded-xl text-xs font-ninja border transition-all active:scale-95 ${
                  selectedNinja === ninja.id
                    ? 'border-opacity-60 bg-opacity-20'
                    : 'border-white/5 bg-white/5 text-white/50'
                }`}
                style={
                  selectedNinja === ninja.id
                    ? { borderColor: ninja.color, background: `${ninja.color}18`, color: ninja.color }
                    : {}
                }
              >
                {ninja.label}
              </button>
            ))}
          </div>
          {savingNinja && (
            <p className="text-center mt-2 text-[10px] text-white/30 font-body">
              <Loader2 className="w-3 h-3 inline animate-spin mr-1" /> Saving...
            </p>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="mt-4 flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-ninja text-sm active:scale-95 transition-transform"
        >
          <LogOut className="w-4 h-4" />
          {t(lang, 'logout') || 'Logout'}
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  RENDER — TAB CONTENT MAP
  // ═══════════════════════════════════════════════════════════
  const tabContent: Record<Tab, () => JSX.Element> = {
    home:    renderHome,
    chests:  renderChests,
    friends: renderFriends,
    tasks:   renderTasks,
    profile: renderProfile,
  };

  // ═══════════════════════════════════════════════════════════
  //  MAIN RETURN
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a] flex flex-col relative">
      {/* ─── Top header ──────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/[0.06]"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full overflow-hidden border"
            style={{ borderColor: ninjaColor }}
          >
            <img
              src={livePlayer.avatar || `/img/pfp-${livePlayer.ninjaType || 'neon'}.png`}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-ninja text-sm text-white truncate max-w-[120px]">{livePlayer.username}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
          <Coins className="w-3.5 h-3.5 text-yellow-400" />
          <span className="font-ninja text-sm text-yellow-400">{coins.toLocaleString()}</span>
        </div>
      </header>

      {/* ─── Scrollable content area ─────────────────────── */}
      <main className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' } as any}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {tabContent[activeTab]()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ─── Bottom tab bar ──────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-[#0a0a0a]/80 backdrop-blur-2xl border-t border-white/[0.06]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', height: 'calc(60px + env(safe-area-inset-bottom, 0px))' }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors"
            >
              <Icon
                className="w-5 h-5 transition-colors"
                style={{ color: isActive ? '#39FF14' : 'rgba(255,255,255,0.35)' }}
              />
              <span
                className="text-[9px] font-body transition-colors"
                style={{ color: isActive ? '#39FF14' : 'rgba(255,255,255,0.35)' }}
              >
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute top-0 w-10 h-[2px] rounded-full bg-[#39FF14]"
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
