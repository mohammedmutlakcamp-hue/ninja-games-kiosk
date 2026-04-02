'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, increment } from 'firebase/firestore';
import { Coins, Check, X, Clock, User, AlertTriangle, Loader2, Package } from 'lucide-react';
import { COIN_PACKAGES } from '@/lib/constants';

interface TopUpRequest {
  id: string;
  playerId: string;
  playerName: string;
  packageId: string;
  coins: number;
  priceJOD: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export function TopUpRequests() {
  const [requests, setRequests] = useState<TopUpRequest[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'topup-requests'), (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as TopUpRequest))
        .sort((a, b) => b.createdAt - a.createdAt);
      setRequests(data);
    });
    return () => unsub();
  }, []);

  const approve = async (req: TopUpRequest) => {
    setProcessing(req.id);
    try {
      // First get current coins to be safe
      const { getDoc } = await import('firebase/firestore');
      const playerSnap = await getDoc(doc(db, 'players', req.playerId));
      if (playerSnap.exists()) {
        const currentCoins = playerSnap.data().coins || 0;
        await updateDoc(doc(db, 'players', req.playerId), {
          coins: currentCoins + req.coins,
        });
      } else {
        // Fallback: try increment
        await updateDoc(doc(db, 'players', req.playerId), {
          coins: increment(req.coins),
        });
      }
      // Mark request as approved
      await updateDoc(doc(db, 'topup-requests', req.id), {
        status: 'approved',
        approvedAt: Date.now(),
      });
    } catch (err) {
      console.error('Failed to approve:', err);
      alert('Failed to add coins: ' + (err as any)?.message);
    }
    setProcessing(null);
  };

  const reject = async (req: TopUpRequest) => {
    setProcessing(req.id);
    await updateDoc(doc(db, 'topup-requests', req.id), {
      status: 'rejected',
      rejectedAt: Date.now(),
    });
    setProcessing(null);
  };

  const remove = async (id: string) => {
    await deleteDoc(doc(db, 'topup-requests', id));
  };

  const pending = requests.filter(r => r.status === 'pending');
  const handled = requests.filter(r => r.status !== 'pending');

  const timeSince = (ts: number) => {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-ninja text-2xl text-white">TOP UP REQUESTS</h2>
          <p className="font-body text-gray-500">
            {pending.length} pending · {handled.length} handled
          </p>
        </div>
      </div>

      {/* Packages Overview */}
      <div className="mb-8">
        <h3 className="font-ninja text-sm text-gray-400 mb-3 flex items-center gap-2">
          <Package size={14} /> AVAILABLE PACKAGES
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {COIN_PACKAGES.map((pkg) => {
            const hours = Math.floor(pkg.coins / 150);
            const mins = Math.round((pkg.coins % 150) / 2.5);
            return (
              <div key={pkg.id} className={`glass rounded-xl p-4 border ${pkg.popular ? 'border-ninja-green/30' : 'border-white/5'} relative`}>
                {pkg.popular && (
                  <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-ninja-green/20 text-ninja-green font-ninja text-[9px] border border-ninja-green/30">BEST</span>
                )}
                <p className="font-ninja text-xl text-white">{pkg.coins.toLocaleString()} <span className="text-gray-500 text-sm">coins</span></p>
                <p className="font-ninja text-lg text-ninja-green">{pkg.price} JOD</p>
                <p className="font-body text-xs text-gray-500 mt-1">{hours}h{mins > 0 ? ` ${mins}m` : ''} play time</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Requests */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h3 className="font-ninja text-sm text-yellow-400 mb-3 flex items-center gap-2">
            <Clock size={14} /> PENDING — Waiting for payment
          </h3>
          <div className="space-y-3">
            {pending.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-5 border-2 border-yellow-500/30 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                    <Coins size={24} className="text-yellow-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-gray-400" />
                      <span className="font-ninja text-white text-base">{req.playerName?.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-ninja text-ninja-green text-lg">{req.coins.toLocaleString()} coins</span>
                      <span className="font-body text-gray-500 text-sm">·</span>
                      <span className="font-ninja text-white text-lg">{req.priceJOD} JOD</span>
                    </div>
                    <span className="font-body text-gray-600 text-xs">{timeSince(req.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {processing === req.id ? (
                    <Loader2 size={20} className="animate-spin text-gray-400" />
                  ) : (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => approve(req)}
                        className="px-5 py-2.5 bg-ninja-green text-black rounded-xl font-ninja font-bold flex items-center gap-2 hover:bg-ninja-green/90 transition-all"
                      >
                        <Check size={16} /> APPROVE & ADD COINS
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => reject(req)}
                        className="px-4 py-2.5 border border-red-500/30 text-red-400 rounded-xl font-body text-sm hover:bg-red-500/10 transition-all"
                      >
                        <X size={16} />
                      </motion.button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && (
        <div className="text-center py-12 mb-8">
          <Coins size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="font-ninja text-lg text-gray-600">NO PENDING REQUESTS</p>
          <p className="font-body text-gray-700 mt-2">Players can request top-ups from the kiosk sidebar</p>
        </div>
      )}

      {/* History */}
      {handled.length > 0 && (
        <div>
          <h3 className="font-ninja text-sm text-gray-500 mb-3">HISTORY</h3>
          <div className="space-y-2">
            {handled.slice(0, 20).map((req) => (
              <div key={req.id}
                className="glass rounded-lg px-4 py-3 flex items-center justify-between border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${req.status === 'approved' ? 'bg-ninja-green' : 'bg-red-400'}`} />
                  <span className="font-ninja text-sm text-white">{req.playerName?.toUpperCase()}</span>
                  <span className="font-body text-gray-500 text-xs">{req.coins} coins · {req.priceJOD} JOD</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-ninja text-xs ${req.status === 'approved' ? 'text-ninja-green' : 'text-red-400'}`}>
                    {req.status === 'approved' ? 'APPROVED' : 'REJECTED'}
                  </span>
                  <span className="font-body text-gray-600 text-[10px]">{timeSince(req.createdAt)}</span>
                  <button onClick={() => remove(req.id)} className="text-gray-700 hover:text-gray-400 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
