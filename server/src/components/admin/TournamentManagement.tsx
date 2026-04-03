'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, increment } from 'firebase/firestore';
import { Tournament, TournamentFormat, PrizeSlot, TournamentBracket } from '@/types/tournament';
import {
  Trophy, Plus, Coins, Users, Calendar, Swords, X, Edit, Trash2,
  Play, Ban, Award, DollarSign, ChevronDown, Check, AlertTriangle
} from 'lucide-react';

export function TournamentManagement() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Create form state
  const [name, setName] = useState('');
  const [game, setGame] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState<TournamentFormat>('bracket');
  const [entryFee, setEntryFee] = useState(100);
  const [maxPlayers, setMaxPlayers] = useState(16);
  const [minPlayers, setMinPlayers] = useState(4);
  const [startTime, setStartTime] = useState('');
  const [rules, setRules] = useState('');
  const [prizes, setPrizes] = useState<PrizeSlot[]>([
    { position: 1, percentage: 50, coins: 0 },
    { position: 2, percentage: 30, coins: 0 },
    { position: 3, percentage: 20, coins: 0 },
  ]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'tournaments'), (snap) => {
      setTournaments(
        snap.docs.map(d => ({ id: d.id, ...d.data() } as Tournament))
          .sort((a, b) => b.createdAt - a.createdAt)
      );
    });
    return () => unsub();
  }, []);

  const totalPrizePool = maxPlayers * entryFee * (prizes.reduce((s, p) => s + p.percentage, 0) / 100);
  const adminProfit = maxPlayers * entryFee - totalPrizePool;

  const createTournament = async () => {
    if (!name || !game || !startTime) return;

    const prizePool = maxPlayers * entryFee * (prizes.reduce((s, p) => s + p.percentage, 0) / 100);
    const calculatedPrizes = prizes.map(p => ({
      ...p,
      coins: Math.floor(maxPlayers * entryFee * p.percentage / 100),
    }));

    await addDoc(collection(db, 'tournaments'), {
      name, game, description, format,
      entryFee, maxPlayers, minPlayers,
      prizePool,
      prizeDistribution: calculatedPrizes,
      adminProfit: maxPlayers * entryFee - prizePool,
      registrationStart: Date.now(),
      registrationEnd: new Date(startTime).getTime(),
      startTime: new Date(startTime).getTime(),
      endTime: null,
      status: 'registration',
      participants: [], brackets: [], results: [],
      rules, termsAndConditions: '',
      createdBy: 'admin',
      createdAt: Date.now(), updatedAt: Date.now(),
    });

    setShowCreate(false);
    resetForm();
  };

  const resetForm = () => {
    setName(''); setGame(''); setDescription(''); setFormat('bracket');
    setEntryFee(100); setMaxPlayers(16); setMinPlayers(4);
    setStartTime(''); setRules('');
    setPrizes([
      { position: 1, percentage: 50, coins: 0 },
      { position: 2, percentage: 30, coins: 0 },
      { position: 3, percentage: 20, coins: 0 },
    ]);
  };

  const updateStatus = async (t: Tournament, status: string) => {
    await updateDoc(doc(db, 'tournaments', t.id), { status, updatedAt: Date.now() });
  };

  const generateBrackets = async (t: Tournament) => {
    const participants = [...(t.participants || [])];
    // Shuffle
    for (let i = participants.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [participants[i], participants[j]] = [participants[j], participants[i]];
    }

    const brackets: TournamentBracket[] = [];
    for (let i = 0; i < participants.length; i += 2) {
      brackets.push({
        round: 1,
        matchIndex: Math.floor(i / 2),
        player1: participants[i]?.playerName || null,
        player2: participants[i + 1]?.playerName || null,
        winner: null, score1: 0, score2: 0, status: 'pending',
      });
    }

    await updateDoc(doc(db, 'tournaments', t.id), {
      brackets, status: 'active', updatedAt: Date.now(),
    });
  };

  const declareWinner = async (t: Tournament, bracketIdx: number, winner: string) => {
    const brackets = [...(t.brackets || [])];
    brackets[bracketIdx] = { ...brackets[bracketIdx], winner, status: 'completed' };
    await updateDoc(doc(db, 'tournaments', t.id), { brackets, updatedAt: Date.now() });
  };

  const completeTournament = async (t: Tournament) => {
    // Distribute prizes to winners
    const results = (t.prizeDistribution || []).map((p, i) => ({
      playerId: '', playerName: `Winner #${p.position}`, position: p.position, prizeClaimed: p.coins,
    }));
    await updateDoc(doc(db, 'tournaments', t.id), {
      status: 'completed', endTime: Date.now(), results, updatedAt: Date.now(),
    });
  };

  const cancelTournament = async (t: Tournament) => {
    // Refund participants
    for (const p of (t.participants || [])) {
      try {
        await updateDoc(doc(db, 'players', p.playerId), { coins: increment(t.entryFee) });
      } catch { /* skip */ }
    }
    await updateDoc(doc(db, 'tournaments', t.id), {
      status: 'cancelled', updatedAt: Date.now(),
    });
  };

  const deleteTournament = async (id: string) => {
    await deleteDoc(doc(db, 'tournaments', id));
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      registration: 'bg-green-500/20 text-green-400 border-green-500/30',
      upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      active: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[status] || colors.upcoming;
  };

  // Revenue stats
  const totalRevenue = tournaments
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + (t.adminProfit || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-ninja text-2xl text-white">TOURNAMENT MANAGEMENT</h2>
          <p className="font-body text-gray-500">
            {tournaments.filter(t => t.status === 'active').length} active · {tournaments.filter(t => t.status === 'registration').length} registration · Total revenue: {totalRevenue} coins
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreate(true)}
          className="px-6 py-2 bg-ninja-green text-black font-ninja rounded-lg flex items-center gap-2"
        >
          <Plus size={16} /> CREATE TOURNAMENT
        </motion.button>
      </div>

      {/* Tournament List */}
      <div className="space-y-3">
        {tournaments.map((t) => (
          <div key={t.id} className="glass rounded-xl border border-white/5 overflow-hidden">
            <div
              className="p-5 cursor-pointer hover:bg-white/[0.02] transition-all"
              onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Trophy size={20} className="text-ninja-green" />
                  <div>
                    <h3 className="font-ninja text-lg text-white">{t.name}</h3>
                    <p className="font-body text-gray-500 text-sm">{t.game} · {t.format.toUpperCase()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-body border ${getStatusBadge(t.status)}`}>
                    {t.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-gray-400 font-body text-sm">
                  <span className="flex items-center gap-1"><Users size={14} /> {t.participants?.length || 0}/{t.maxPlayers}</span>
                  <span className="flex items-center gap-1"><Coins size={14} className="text-yellow-400" /> {t.entryFee}</span>
                  <span className="flex items-center gap-1"><DollarSign size={14} className="text-green-400" /> +{t.adminProfit || 0}</span>
                  <ChevronDown size={16} className={`transition-transform ${expandedId === t.id ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {expandedId === t.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/5"
                >
                  <div className="p-5 space-y-4">
                    {/* Details */}
                    <div className="grid grid-cols-4 gap-3">
                      <div className="glass rounded-lg p-3">
                        <p className="text-gray-500 text-xs font-body">Prize Pool</p>
                        <p className="text-ninja-green font-ninja text-lg">{t.prizePool} coins</p>
                      </div>
                      <div className="glass rounded-lg p-3">
                        <p className="text-gray-500 text-xs font-body">Admin Profit</p>
                        <p className="text-green-400 font-ninja text-lg">{t.adminProfit} coins</p>
                      </div>
                      <div className="glass rounded-lg p-3">
                        <p className="text-gray-500 text-xs font-body">Start Time</p>
                        <p className="text-white font-body text-sm">{new Date(t.startTime).toLocaleString()}</p>
                      </div>
                      <div className="glass rounded-lg p-3">
                        <p className="text-gray-500 text-xs font-body">Players</p>
                        <p className="text-white font-ninja text-lg">{t.participants?.length || 0}/{t.maxPlayers}</p>
                      </div>
                    </div>

                    {/* Participants */}
                    {t.participants?.length > 0 && (
                      <div className="glass rounded-lg p-4">
                        <p className="text-gray-400 text-xs font-body mb-2">PARTICIPANTS</p>
                        <div className="flex flex-wrap gap-2">
                          {t.participants.map((p, i) => (
                            <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-300 font-body">
                              {p.playerName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Brackets */}
                    {t.brackets?.length > 0 && (
                      <div className="glass rounded-lg p-4">
                        <p className="text-gray-400 text-xs font-body mb-2">BRACKETS</p>
                        <div className="space-y-2">
                          {t.brackets.map((b, i) => (
                            <div key={i} className="flex items-center gap-3 bg-black/20 p-2 rounded">
                              <span className="text-gray-500 text-xs w-16">R{b.round} M{b.matchIndex + 1}</span>
                              <button
                                onClick={() => b.player1 && declareWinner(t, i, b.player1)}
                                className={`flex-1 py-1 px-2 rounded text-sm font-body text-left ${
                                  b.winner === b.player1 ? 'bg-ninja-green/20 text-ninja-green' : 'text-gray-300 hover:bg-white/5'
                                }`}
                              >
                                {b.player1 || 'TBD'}
                              </button>
                              <span className="text-gray-600 text-xs">vs</span>
                              <button
                                onClick={() => b.player2 && declareWinner(t, i, b.player2)}
                                className={`flex-1 py-1 px-2 rounded text-sm font-body text-left ${
                                  b.winner === b.player2 ? 'bg-ninja-green/20 text-ninja-green' : 'text-gray-300 hover:bg-white/5'
                                }`}
                              >
                                {b.player2 || 'TBD'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {t.status === 'registration' && (
                        <>
                          <button onClick={() => generateBrackets(t)}
                            className="px-4 py-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg font-body text-sm flex items-center gap-1">
                            <Play size={14} /> Start (Generate Brackets)
                          </button>
                          <button onClick={() => cancelTournament(t)}
                            className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-body text-sm flex items-center gap-1">
                            <Ban size={14} /> Cancel & Refund
                          </button>
                        </>
                      )}
                      {t.status === 'active' && (
                        <>
                          <button onClick={() => completeTournament(t)}
                            className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg font-body text-sm flex items-center gap-1">
                            <Check size={14} /> Complete Tournament
                          </button>
                          <button onClick={() => cancelTournament(t)}
                            className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-body text-sm flex items-center gap-1">
                            <Ban size={14} /> Cancel & Refund
                          </button>
                        </>
                      )}
                      {(t.status === 'completed' || t.status === 'cancelled') && (
                        <button onClick={() => deleteTournament(t.id)}
                          className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg font-body text-sm flex items-center gap-1">
                          <Trash2 size={14} /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {tournaments.length === 0 && (
        <div className="text-center py-20">
          <Trophy size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="font-ninja text-xl text-gray-600">NO TOURNAMENTS</p>
          <p className="font-body text-gray-700 mt-2">Create your first tournament!</p>
        </div>
      )}

      {/* Create Tournament Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-strong rounded-2xl p-8 w-[700px] max-h-[85vh] overflow-y-auto border border-ninja-green/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-ninja text-2xl text-ninja-green flex items-center gap-2">
                  <Trophy size={24} /> CREATE TOURNAMENT
                </h3>
                <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm font-body mb-1 block">Name</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Tournament name"
                      className="w-full bg-black/50 border-2 border-ninja-green/30 rounded-lg px-4 py-2.5 text-white font-body focus:border-ninja-green outline-none" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm font-body mb-1 block">Game</label>
                    <input value={game} onChange={e => setGame(e.target.value)} placeholder="e.g., Fortnite, Valorant"
                      className="w-full bg-black/50 border-2 border-ninja-green/30 rounded-lg px-4 py-2.5 text-white font-body focus:border-ninja-green outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-sm font-body mb-1 block">Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tournament description"
                    className="w-full bg-black/50 border-2 border-ninja-green/30 rounded-lg px-4 py-2.5 text-white font-body focus:border-ninja-green outline-none h-20" />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm font-body mb-1 block">Format</label>
                    <select value={format} onChange={e => setFormat(e.target.value as TournamentFormat)}
                      className="w-full bg-black/50 border-2 border-ninja-green/30 rounded-lg px-4 py-2.5 text-white font-body focus:border-ninja-green outline-none">
                      <option value="bracket">Bracket</option>
                      <option value="1v1">1v1</option>
                      <option value="ffa">FFA</option>
                      <option value="2v2">2v2</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm font-body mb-1 block">Entry Fee</label>
                    <input type="number" value={entryFee} onChange={e => setEntryFee(Number(e.target.value))}
                      className="w-full bg-black/50 border-2 border-ninja-green/30 rounded-lg px-4 py-2.5 text-white font-body focus:border-ninja-green outline-none" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm font-body mb-1 block">Max Players</label>
                    <input type="number" value={maxPlayers} onChange={e => setMaxPlayers(Number(e.target.value))}
                      className="w-full bg-black/50 border-2 border-ninja-green/30 rounded-lg px-4 py-2.5 text-white font-body focus:border-ninja-green outline-none" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm font-body mb-1 block">Start Time</label>
                    <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)}
                      className="w-full bg-black/50 border-2 border-ninja-green/30 rounded-lg px-4 py-2.5 text-white font-body focus:border-ninja-green outline-none" />
                  </div>
                </div>

                {/* Prize Distribution */}
                <div>
                  <label className="text-gray-400 text-sm font-body mb-2 block">Prize Distribution</label>
                  <div className="space-y-2">
                    {prizes.map((p, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-gray-400 font-body text-sm w-16">{p.position === 1 ? '1st' : p.position === 2 ? '2nd' : `${p.position}th`}</span>
                        <input type="number" value={p.percentage} onChange={e => {
                          const np = [...prizes]; np[i] = { ...np[i], percentage: Number(e.target.value) }; setPrizes(np);
                        }} className="w-20 bg-black/50 border border-ninja-green/20 rounded px-2 py-1 text-white font-body text-sm outline-none" />
                        <span className="text-gray-500 text-sm font-body">% = {Math.floor(maxPlayers * entryFee * p.percentage / 100)} coins</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-sm font-body mb-1 block">Rules</label>
                  <textarea value={rules} onChange={e => setRules(e.target.value)} placeholder="Tournament rules..."
                    className="w-full bg-black/50 border-2 border-ninja-green/30 rounded-lg px-4 py-2.5 text-white font-body focus:border-ninja-green outline-none h-20" />
                </div>

                {/* Profit Preview */}
                <div className="glass rounded-lg p-4 border border-green-500/20">
                  <h4 className="font-ninja text-green-400 mb-2 flex items-center gap-2">
                    <DollarSign size={16} /> PROFIT PREVIEW
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-sm font-body">
                    <div>
                      <p className="text-gray-500">Total Entry Fees</p>
                      <p className="text-white font-ninja">{maxPlayers * entryFee} coins</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Prize Pool</p>
                      <p className="text-yellow-400 font-ninja">{Math.floor(totalPrizePool)} coins</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Admin Profit</p>
                      <p className="text-green-400 font-ninja text-lg">{Math.floor(adminProfit)} coins</p>
                    </div>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={createTournament}
                className="w-full mt-6 py-3 bg-ninja-green text-black font-ninja text-lg rounded-lg flex items-center justify-center gap-2"
              >
                <Trophy size={20} /> CREATE TOURNAMENT
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
