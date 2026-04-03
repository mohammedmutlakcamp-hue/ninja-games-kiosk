'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { NinjaAvatar } from '@/components/NinjaAvatar';
import {
  Search, Coins, Clock, Crosshair, X, UserCheck, Ban, ShieldCheck, User, UserPlus, History
} from 'lucide-react';

export function PlayerManagement() {
  const [players, setPlayers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [playerHistory, setPlayerHistory] = useState<any[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newCoins, setNewCoins] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [addCoinsAmount, setAddCoinsAmount] = useState('');
  const [addCoinsLoading, setAddCoinsLoading] = useState(false);
  const [addCoinsMsg, setAddCoinsMsg] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'players'), (snap) => {
      setPlayers(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const filtered = players.filter(p =>
    p.username?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  );

  const loadPlayerHistory = async (playerId: string) => {
    try {
      const q2 = query(collection(db, 'topup-requests'), where('playerId', '==', playerId), orderBy('createdAt', 'desc'), limit(20));
      const snap = await getDocs(q2);
      setPlayerHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch { setPlayerHistory([]); }
  };

  const toggleBan = async (playerId: string, banned: boolean) => {
    await updateDoc(doc(db, 'players', playerId), { banned: !banned });
  };

  const [addCoinsConfirm, setAddCoinsConfirm] = useState(false);

  const addCoinsToPlayer = async () => {
    if (!selected) return;
    const amount = parseInt(addCoinsAmount);
    if (!amount || amount <= 0) { setAddCoinsMsg('Enter a valid amount'); return; }

    if (!addCoinsConfirm) {
      setAddCoinsConfirm(true);
      setAddCoinsMsg(`Confirm: Add ${amount} coins to ${selected.username}?`);
      return;
    }

    setAddCoinsLoading(true);
    setAddCoinsMsg('');
    setAddCoinsConfirm(false);
    try {
      const currentCoins = selected.coins || 0;
      await updateDoc(doc(db, 'players', selected.uid), { coins: currentCoins + amount });
      setSelected({ ...selected, coins: currentCoins + amount });
      setAddCoinsMsg(`+${amount} coins added!`);
      setAddCoinsAmount('');
    } catch (err: any) {
      setAddCoinsMsg('Failed: ' + (err.message || 'Unknown error'));
    }
    setAddCoinsLoading(false);
  };

  const createPlayer = async () => {
    const username = newUsername.toLowerCase().trim();
    if (!username) { setCreateError('Enter a username'); return; }
    if (username.length < 3) { setCreateError('Username too short (min 3)'); return; }
    if (!/^[a-z0-9_]+$/.test(username)) { setCreateError('Only letters, numbers, underscore'); return; }
    if (players.some(p => p.username === username)) { setCreateError('Username already taken'); return; }

    const coins = parseInt(newCoins) || 0;
    setCreating(true);
    setCreateError('');

    try {
      const id = `player_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await setDoc(doc(db, 'players', id), {
        username,
        pin: '', // empty = first login will set PIN
        coins,
        totalCoinsSpent: 0,
        totalPlaytime: 0,
        character: { skinColor: '#39FF14', outfitId: 'default', maskId: '', accessoryId: '', equippedSkins: [] },
        inventory: [],
        titles: [],
        activeTitle: 'Newcomer',
        stats: { totalKills: 0, totalDeaths: 0, totalHeadshots: 0, totalWins: 0, gamesPlayed: 0, chestsOpened: 0, foodOrdered: 0, longestStreak: 0, favoriteGame: '' },
        friends: [],
        ninjaType: 'neon',
        createdAt: Date.now(),
        lastLogin: 0,
        banned: false,
      });
      setNewUsername('');
      setNewCoins('');
      setShowCreate(false);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create');
    }
    setCreating(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-ninja text-2xl text-white">PLAYERS</h2>
          <p className="font-body text-gray-500">{players.length} registered players</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-ninja-green text-black rounded-lg font-ninja text-sm hover:bg-green-400 transition-all"
          >
            <UserPlus size={16} /> NEW PLAYER
          </button>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search players..."
              className="bg-black/50 border border-ninja-green/20 rounded-lg pl-10 pr-4 py-2 text-white font-body w-64 focus:border-ninja-green outline-none"
            />
          </div>
        </div>
      </div>

      {/* Player List */}
      <div className="space-y-2">
        {filtered.map((player, i) => (
          <motion.div
            key={player.uid}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => setSelected(player)}
            className="glass rounded-lg p-4 flex items-center justify-between cursor-pointer hover:border-ninja-green/20 border border-white/5 transition-all"
          >
            <div className="flex items-center gap-4">
              <NinjaAvatar
                skinColor={player.character?.skinColor || '#8D6E63'}
                outfitColor="#333"
                size={40}
                animated={false}
              />
              <div>
                <p className="font-ninja text-white">{player.username?.toUpperCase()}</p>
                <p className="font-body text-xs text-gray-500">{player.phone} · {player.activeTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="font-ninja text-ninja-green flex items-center gap-1 justify-end">
                  <Coins size={14} /> {Math.floor(player.coins || 0)}
                </p>
                <p className="font-body text-xs text-gray-500 flex items-center gap-1 justify-end">
                  <Clock size={10} /> {Math.floor((player.totalPlaytime || 0) / 60)}h played
                </p>
              </div>
              {player.banned && (
                <span className="px-2 py-1 bg-red-900/50 text-red-400 text-xs rounded font-body">BANNED</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Player Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-strong rounded-2xl p-8 w-[420px] border border-ninja-green/10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-ninja-green/10 flex items-center justify-center border border-ninja-green/20">
                  <UserPlus size={20} className="text-ninja-green" />
                </div>
                <div>
                  <h3 className="font-ninja text-lg text-white">NEW PLAYER</h3>
                  <p className="font-body text-xs text-gray-500">Player sets PIN on first login</p>
                </div>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs font-body mb-1 block uppercase tracking-wider">Username</label>
                <input
                  value={newUsername}
                  onChange={(e) => { setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '')); setCreateError(''); }}
                  placeholder="e.g. ninja_king"
                  className="w-full bg-black/50 border border-ninja-green/20 rounded-lg px-4 py-3 text-white font-body focus:border-ninja-green outline-none"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-body mb-1 block uppercase tracking-wider">Starting Coins</label>
                <input
                  type="number"
                  value={newCoins}
                  onChange={(e) => setNewCoins(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full bg-black/50 border border-ninja-green/20 rounded-lg px-4 py-3 text-white font-body focus:border-ninja-green outline-none"
                />
                <div className="flex gap-2 mt-2">
                  {[200, 500, 1000, 2000].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setNewCoins(String(amount))}
                      className={`flex-1 py-1.5 rounded text-xs font-body transition-all ${
                        newCoins === String(amount)
                          ? 'bg-ninja-green text-black font-bold'
                          : 'bg-ninja-green/10 border border-ninja-green/20 text-ninja-green hover:bg-ninja-green/20'
                      }`}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {createError && (
              <p className="text-red-400 text-sm font-body mt-3">{createError}</p>
            )}

            <button
              onClick={createPlayer}
              disabled={creating}
              className="w-full mt-6 py-3 bg-ninja-green text-black rounded-lg font-ninja text-sm hover:bg-green-400 transition-all disabled:opacity-50"
            >
              {creating ? 'CREATING...' : 'CREATE PLAYER'}
            </button>
          </motion.div>
        </div>
      )}

      {/* Player Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => { setSelected(null); setPlayerHistory([]); }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-strong rounded-2xl p-8 w-[500px] max-h-[90vh] overflow-y-auto border border-ninja-green/10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div />
              <button onClick={() => { setSelected(null); setPlayerHistory([]); }} className="text-gray-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="text-center mb-6">
              <NinjaAvatar
                skinColor={selected.character?.skinColor || '#8D6E63'}
                outfitColor="#333"
                size={64}
                animated={false}
                className="mx-auto mb-3"
              />
              <h3 className="font-ninja text-2xl text-ninja-green mt-2">{selected.username?.toUpperCase()}</h3>
              <p className="font-body text-gray-500">{selected.phone}</p>
              {selected.firstName && <p className="font-body text-gray-600 text-xs mt-1">{selected.firstName} {selected.lastName}</p>}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="glass rounded-lg p-3 text-center">
                <p className="font-ninja text-lg text-ninja-green flex items-center justify-center gap-1">
                  <Coins size={14} /> {Math.floor(selected.coins || 0)}
                </p>
                <p className="text-xs text-gray-500 font-body">Coins</p>
              </div>
              <div className="glass rounded-lg p-3 text-center">
                <p className="font-ninja text-lg text-white flex items-center justify-center gap-1">
                  <Clock size={14} /> {Math.floor((selected.totalPlaytime || 0) / 60)}h
                </p>
                <p className="text-xs text-gray-500 font-body">Playtime</p>
              </div>
              <div className="glass rounded-lg p-3 text-center">
                <p className="font-ninja text-lg text-white flex items-center justify-center gap-1">
                  <Crosshair size={14} /> {selected.stats?.totalHeadshots || 0}
                </p>
                <p className="text-xs text-gray-500 font-body">Headshots</p>
              </div>
            </div>

            {/* Player Info */}
            <div className="mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-body text-gray-500">Joined</span>
                <span className="font-body text-gray-300">{selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-body text-gray-500">Last Login</span>
                <span className="font-body text-gray-300">{selected.lastLogin ? new Date(selected.lastLogin).toLocaleString() : 'Never'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-body text-gray-500">Games Played</span>
                <span className="font-body text-gray-300">{selected.stats?.gamesPlayed || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-body text-gray-500">Total Coins Spent</span>
                <span className="font-body text-gray-300">{selected.totalCoinsSpent || 0}</span>
              </div>
            </div>

            {/* History */}
            <div className="mb-6">
              <button
                onClick={() => loadPlayerHistory(selected.uid)}
                className="w-full flex items-center justify-center gap-2 py-2 border border-white/10 rounded-lg text-gray-400 font-body text-sm hover:bg-white/5 transition-all mb-3"
              >
                <History size={14} /> Load Top-Up History
              </button>
              {playerHistory.length > 0 && (
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {playerHistory.map((h: any) => (
                    <div key={h.id} className="flex items-center justify-between px-3 py-2 glass rounded-lg text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${h.status === 'approved' ? 'bg-ninja-green' : h.status === 'rejected' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                        <span className="font-body text-gray-300">{h.coins} coins · {h.priceJOD} JOD</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-ninja ${h.status === 'approved' ? 'text-ninja-green' : h.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}`}>
                          {h.status?.toUpperCase()}
                        </span>
                        <span className="text-gray-600 font-body">{h.createdAt ? new Date(h.createdAt).toLocaleDateString() : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Coins */}
            <div className="mb-6 p-4 glass rounded-xl border border-ninja-green/10">
              <h4 className="font-ninja text-sm text-ninja-green mb-3 flex items-center gap-2"><Coins size={14} /> ADD COINS</h4>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={addCoinsAmount}
                  onChange={(e) => setAddCoinsAmount(e.target.value)}
                  placeholder="Amount..."
                  className="flex-1 bg-black/50 border border-ninja-green/20 rounded-lg px-3 py-2 text-white font-body text-sm focus:border-ninja-green outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && addCoinsToPlayer()}
                />
                <button
                  onClick={addCoinsToPlayer}
                  disabled={addCoinsLoading}
                  className={`px-4 py-2 rounded-lg font-ninja text-sm transition-all disabled:opacity-50 ${
                    addCoinsConfirm ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-ninja-green text-black hover:bg-green-400'
                  }`}
                >
                  {addCoinsLoading ? '...' : addCoinsConfirm ? 'CONFIRM' : 'ADD'}
                </button>
                {addCoinsConfirm && (
                  <button onClick={() => { setAddCoinsConfirm(false); setAddCoinsMsg(''); }}
                    className="px-3 py-2 border border-gray-600 rounded-lg text-gray-400 text-sm hover:bg-white/5">
                    Cancel
                  </button>
                )}
              </div>
              {/* Quick amounts */}
              <div className="flex gap-1.5 mt-2">
                {[50, 100, 200, 500, 1000].map(amt => (
                  <button key={amt} onClick={() => setAddCoinsAmount(String(amt))}
                    className="flex-1 py-1 rounded bg-white/5 text-gray-400 font-body text-[10px] hover:bg-white/10 hover:text-white transition-all">
                    +{amt}
                  </button>
                ))}
              </div>
              {addCoinsMsg && (
                <p className={`font-body text-xs mt-2 ${addCoinsMsg.startsWith('+') ? 'text-ninja-green' : 'text-red-400'}`}>{addCoinsMsg}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { toggleBan(selected.uid, selected.banned); setSelected({ ...selected, banned: !selected.banned }); }}
                className={`flex-1 py-3 rounded-lg font-ninja flex items-center justify-center gap-2 ${
                  selected.banned
                    ? 'bg-ninja-green/20 text-ninja-green hover:bg-ninja-green/30'
                    : 'bg-red-900/50 text-red-400 hover:bg-red-900/70'
                }`}
              >
                {selected.banned ? <><ShieldCheck size={16} /> Unban</> : <><Ban size={16} /> Ban</>}
              </button>
              <button
                onClick={() => { setSelected(null); setPlayerHistory([]); }}
                className="flex-1 py-3 border border-gray-600 rounded-lg text-gray-400 font-ninja"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
