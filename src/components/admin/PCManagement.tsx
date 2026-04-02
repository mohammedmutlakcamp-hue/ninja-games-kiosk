'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { PC, PCStatus, KioskCommand } from '@/types';
import {
  Monitor, Lock, Unlock, RotateCcw, Power, X, User, Coins, Clock,
  Wifi, WifiOff, CircleDot, Filter, AlertTriangle, Shield, ShieldOff,
  ShieldCheck, ShieldAlert
} from 'lucide-react';

type FilterType = 'all' | 'online' | 'occupied' | 'free' | 'offline';

export function PCManagement() {
  const [pcs, setPcs] = useState<PC[]>([]);
  const [selectedPC, setSelectedPC] = useState<PC | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [confirmAction, setConfirmAction] = useState<{ pc: PC; action: string } | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'pcs'), (snap) => {
      setPcs(snap.docs.map(d => ({ id: d.id, ...d.data() } as PC)).sort((a, b) => a.name.localeCompare(b.name)));
    });
    return () => unsub();
  }, []);

  const sendCommand = async (pcId: string, command: KioskCommand, data?: string) => {
    await updateDoc(doc(db, 'pcs', pcId), {
      pendingCommand: { command, data: data || null, timestamp: Date.now(), executed: false },
    });
  };

  const toggleLock = async (pc: PC) => {
    const newStatus: PCStatus = pc.status === 'locked' ? 'free' : 'locked';
    await updateDoc(doc(db, 'pcs', pc.id), { status: newStatus });
    sendCommand(pc.id, newStatus === 'locked' ? 'lock' : 'unlock');
  };

  const toggleLockdown = async (pc: PC) => {
    const isRestricted = pc.lockdownActive;
    const newCommand: KioskCommand = isRestricted ? 'fullaccess' : 'lockdown';
    await sendCommand(pc.id, newCommand);
    await updateDoc(doc(db, 'pcs', pc.id), { lockdownActive: !isRestricted });
  };

  const deletePC = async (pc: PC) => {
    if (!confirm(`DELETE ${pc.name}?\n\nThis removes the PC from the admin panel. It will re-appear if the kiosk software is still running on that machine.`)) return;
    await deleteDoc(doc(db, 'pcs', pc.id));
    setSelectedPC(null);
  };

  const handlePowerAction = (pc: PC, action: string) => {
    setConfirmAction({ pc, action });
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    const { pc, action } = confirmAction;
    if (action === 'shutdown') {
      sendCommand(pc.id, 'shutdown');
      await updateDoc(doc(db, 'pcs', pc.id), { status: 'offline' as PCStatus });
    } else if (action === 'restart') {
      sendCommand(pc.id, 'restart');
    } else if (action === 'poweron') {
      // Wake-on-LAN: find an online PC to send the magic packet
      const mac = pc.macAddress;
      if (!mac || mac === '00:00:00:00:00:00') {
        alert(`Cannot wake ${pc.name} — no MAC address recorded. The PC must connect at least once first.`);
        setConfirmAction(null);
        return;
      }
      // Find any online PC (not the target) to relay the WoL packet
      const onlinePC = pcs.find(p => p.id !== pc.id && isOnline(p.id));
      if (!onlinePC) {
        alert('No online PCs available to send Wake-on-LAN. At least one other PC must be on.');
        setConfirmAction(null);
        return;
      }
      // Send the WoL command to the online PC with the target's MAC
      await sendCommand(onlinePC.id, 'send-wol', mac);
      // Also mark target as waking
      await updateDoc(doc(db, 'pcs', pc.id), { status: 'free' as PCStatus });
    }
    setConfirmAction(null);
  };

  const getTimeSinceHeartbeat = (pcId: string) => {
    const pc = pcs.find(p => p.id === pcId);
    const lastHb = pc?.lastHeartbeat || 0;
    if (!lastHb) return null;
    const seconds = Math.floor((Date.now() - lastHb) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const isOnline = (pcId: string) => {
    const pc = pcs.find(p => p.id === pcId);
    const lastHb = pc?.lastHeartbeat || 0;
    return lastHb > 0 && Date.now() - lastHb < 60000; // 60 seconds
  };

  const filteredPCs = pcs.filter(pc => {
    if (filter === 'all') return true;
    if (filter === 'online') return isOnline(pc.id);
    if (filter === 'offline') return !isOnline(pc.id) || pc.status === 'offline';
    if (filter === 'occupied') return pc.status === 'occupied';
    if (filter === 'free') return pc.status === 'free';
    return true;
  });

  const stats = {
    total: pcs.length,
    occupied: pcs.filter(p => p.status === 'occupied').length,
    free: pcs.filter(p => p.status === 'free').length,
    offline: pcs.filter(p => !isOnline(p.id) || p.status === 'offline').length,
  };

  const getBorderColor = (pc: PC) => {
    if (pc.status === 'occupied') return 'border-red-500/50';
    if (pc.status === 'reserved') return 'border-yellow-500/50';
    if (!isOnline(pc.id) || pc.status === 'offline') return 'border-gray-700';
    if (pc.status === 'free') return 'border-green-500/50';
    return 'border-gray-700';
  };

  const getScreenGlow = (pc: PC) => {
    if (pc.status === 'occupied') return '#ff4444';
    if (!isOnline(pc.id) || pc.status === 'offline') return '#333';
    return '#39FF14';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-ninja text-2xl text-white">PC MANAGEMENT</h2>
          <p className="font-body text-gray-500">
            {stats.occupied} occupied · {stats.free} free · {stats.offline} offline · {stats.total} total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'online', 'occupied', 'free', 'offline'] as FilterType[]).map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-body text-sm transition-all flex items-center gap-1.5 ${
              filter === f
                ? 'bg-ninja-green/20 text-ninja-green border border-ninja-green/30'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            <Filter size={12} />
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'all' && <span className="text-[10px] ml-1">({stats.total})</span>}
            {f === 'occupied' && <span className="text-[10px] ml-1">({stats.occupied})</span>}
            {f === 'free' && <span className="text-[10px] ml-1">({stats.free})</span>}
            {f === 'offline' && <span className="text-[10px] ml-1">({stats.offline})</span>}
          </button>
        ))}
      </div>

      {/* PC Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredPCs.map((pc, i) => {
          const online = isOnline(pc.id);
          const isOffline = !online || pc.status === 'offline';
          const screenColor = getScreenGlow(pc);

          return (
            <motion.div
              key={pc.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedPC(pc)}
              className={`glass rounded-xl p-4 cursor-pointer border-2 transition-all hover:border-ninja-green/30 ${getBorderColor(pc)} ${isOffline ? 'opacity-60' : ''}`}
            >
              {/* Monitor SVG Icon */}
              <div className="flex justify-center mb-3">
                <svg width="48" height="40" viewBox="0 0 48 40">
                  <rect x="4" y="2" width="40" height="28" rx="3" fill="#111" stroke={screenColor} strokeWidth="2" />
                  <rect x="7" y="5" width="34" height="22" rx="1" fill={`${screenColor}20`}>
                    {!isOffline && (
                      <animate attributeName="fill" values={`${screenColor}10;${screenColor}30;${screenColor}10`} dur="3s" repeatCount="indefinite" />
                    )}
                  </rect>
                  <rect x="18" y="30" width="12" height="4" fill="#333" />
                  <rect x="14" y="34" width="20" height="3" rx="1" fill="#444" />
                </svg>
              </div>

              <div className="flex items-center justify-between mb-2">
                <h3 className="font-ninja text-sm text-white">{pc.name}</h3>
                {/* Heartbeat dot */}
                <div className="flex items-center gap-1">
                  {online ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" style={{ animation: 'pulse 2s infinite' }}>
                      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
                    </div>
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-600" />
                  )}
                </div>
              </div>

              {/* Heartbeat time */}
              <p className="font-body text-[10px] text-gray-600 mb-2">
                {getTimeSinceHeartbeat(pc.id) ? `Last seen: ${getTimeSinceHeartbeat(pc.id)}` : 'Never connected'}
              </p>

              {/* Occupied info */}
              {pc.status === 'occupied' && pc.currentPlayerName && (
                <div className="bg-red-500/10 rounded-lg p-2 border border-red-500/20">
                  <p className="font-ninja text-sm text-white flex items-center gap-1.5">
                    <User size={12} className="text-red-400" /> {pc.currentPlayerName}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="font-body text-xs text-yellow-400 flex items-center gap-1">
                      <Coins size={10} /> {Math.floor(pc.coinsRemaining || 0)}
                    </p>
                    <p className="font-body text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={10} /> {pc.minutesRemaining || 0}m
                    </p>
                  </div>
                </div>
              )}

              {pc.status === 'reserved' && (
                <div className="bg-yellow-500/10 rounded-lg p-2 border border-yellow-500/20">
                  <p className="font-body text-xs text-yellow-400 flex items-center gap-1.5">
                    <Clock size={12} /> Reserved
                  </p>
                </div>
              )}

              {/* Lockdown Status */}
              <div className={`flex items-center gap-1.5 mt-2 px-2 py-1 rounded text-[10px] font-body ${
                pc.lockdownActive
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}>
                {pc.lockdownActive ? <ShieldCheck size={10} /> : <ShieldOff size={10} />}
                {pc.lockdownActive ? 'RESTRICTED' : 'FULL ACCESS'}
              </div>

              {/* Actions */}
              <div className="flex gap-1 mt-2">
                {/* Lockdown toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); !isOffline && toggleLockdown(pc); }}
                  disabled={isOffline}
                  className={`flex-1 py-1.5 rounded flex items-center justify-center transition-all text-[10px] font-ninja gap-1 ${
                    isOffline ? 'bg-gray-800/40 text-gray-700 cursor-not-allowed' :
                    pc.lockdownActive
                      ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                      : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                  }`}
                  title={pc.lockdownActive ? 'Give Full Access' : 'Restrict PC'}
                >
                  {pc.lockdownActive ? <><ShieldOff size={11} /> FREE</> : <><Shield size={11} /> LOCK</>}
                </button>
                {/* Lock/Unlock kiosk toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); !isOffline && toggleLock(pc); }}
                  disabled={isOffline}
                  className={`flex-1 py-1.5 rounded flex items-center justify-center transition-all ${
                    isOffline ? 'bg-gray-800/40 text-gray-700 cursor-not-allowed' :
                    pc.status === 'locked' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' :
                    'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  }`}
                  title={pc.status === 'locked' ? 'Unlock Kiosk' : 'Lock Kiosk'}
                >
                  {pc.status === 'locked' ? <Unlock size={12} /> : <Lock size={12} />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); !isOffline && sendCommand(pc.id, 'restart'); }}
                  disabled={isOffline}
                  className={`flex-1 py-1.5 rounded flex items-center justify-center transition-all ${
                    isOffline ? 'bg-gray-800/40 text-gray-700 cursor-not-allowed' :
                    'bg-gray-800/80 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                  title="Restart"
                >
                  <RotateCcw size={12} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handlePowerAction(pc, isOffline ? 'poweron' : 'shutdown'); }}
                  className={`flex-1 py-1.5 rounded flex items-center justify-center transition-all ${
                    isOffline ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' :
                    'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  }`}
                  title={isOffline ? 'Power On' : 'Shutdown'}
                >
                  <Power size={12} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredPCs.length === 0 && (
        <div className="text-center py-16">
          <Monitor size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="font-ninja text-lg text-gray-600">NO PCs FOUND</p>
          <p className="font-body text-gray-700 mt-2">PCs will auto-register when the kiosk software is installed</p>
        </div>
      )}

      {/* Confirm Power Action Modal */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
            onClick={() => setConfirmAction(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="glass-strong rounded-xl p-6 w-[400px] border border-red-500/20"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <AlertTriangle size={32} className="text-yellow-400 mx-auto mb-2" />
                <h3 className="font-ninja text-lg text-white">
                  {confirmAction.action === 'shutdown' ? 'SHUTDOWN' : confirmAction.action === 'restart' ? 'RESTART' : 'POWER ON'} {confirmAction.pc.name}?
                </h3>
                {confirmAction.action === 'shutdown' && confirmAction.pc.status === 'occupied' && (
                  <p className="text-red-400 font-body text-sm mt-2">
                    Warning: This PC is currently occupied by {confirmAction.pc.currentPlayerName}!
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmAction(null)}
                  className="flex-1 py-2 border border-gray-600 rounded-lg text-gray-400 font-body">Cancel</button>
                <button onClick={executeAction}
                  className={`flex-1 py-2 rounded-lg font-ninja ${
                    confirmAction.action === 'shutdown' ? 'bg-red-500/80 text-white' : 'bg-ninja-green text-black'
                  }`}>CONFIRM</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PC Detail Modal */}
      <AnimatePresence>
        {selectedPC && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
            onClick={() => setSelectedPC(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="glass-strong rounded-2xl p-8 w-[500px] border border-ninja-green/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-ninja text-2xl text-ninja-green">{selectedPC.name}</h3>
                <button onClick={() => setSelectedPC(null)} className="text-gray-500 hover:text-white"><X size={20} /></button>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between"><span className="text-gray-400 font-body">Status</span><span className="text-white font-body capitalize">{selectedPC.status}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 font-body">Hostname</span><span className="text-white font-body">{selectedPC.hostname || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 font-body">IP</span><span className="text-white font-body">{selectedPC.ipAddress || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 font-body">Specs</span><span className="text-white font-body text-xs">{selectedPC.specs || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 font-body">Player</span><span className="text-ninja-green font-body">{selectedPC.currentPlayerName || 'None'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 font-body">Coins Left</span><span className="text-white font-body">{selectedPC.coinsRemaining ? Math.floor(selectedPC.coinsRemaining) : 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 font-body">Heartbeat</span><span className="text-white font-body">{getTimeSinceHeartbeat(selectedPC.id) || 'Never'}</span></div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-body">Security</span>
                  <span className={`font-ninja text-sm flex items-center gap-1 ${selectedPC.lockdownActive ? 'text-orange-400' : 'text-blue-400'}`}>
                    {selectedPC.lockdownActive ? <><ShieldCheck size={14} /> RESTRICTED</> : <><ShieldOff size={14} /> FULL ACCESS</>}
                  </span>
                </div>
              </div>

              {/* Enterprise Security Control */}
              <div className="mb-4">
                <button
                  onClick={() => { toggleLockdown(selectedPC); }}
                  className={`w-full py-3 rounded-lg font-ninja flex items-center justify-center gap-2 transition-all ${
                    selectedPC.lockdownActive
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'
                      : 'bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30'
                  }`}
                >
                  {selectedPC.lockdownActive ? (
                    <><ShieldOff size={18} /> GIVE FULL ACCESS</>
                  ) : (
                    <><Shield size={18} /> RESTRICT PC (Lockdown)</>
                  )}
                </button>
                <p className="text-gray-600 font-body text-[10px] text-center mt-1">
                  {selectedPC.lockdownActive
                    ? 'Task Manager, Start Menu, CMD all disabled'
                    : 'All Windows features are accessible'
                  }
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { toggleLock(selectedPC); setSelectedPC(null); }}
                  className="py-3 bg-gray-800 rounded-lg text-white font-ninja hover:bg-gray-700 flex items-center justify-center gap-2">
                  {selectedPC.status === 'locked' ? <><Unlock size={16} /> Unlock Kiosk</> : <><Lock size={16} /> Lock Kiosk</>}
                </button>
                <button onClick={() => { sendCommand(selectedPC.id, 'restart'); setSelectedPC(null); }}
                  className="py-3 bg-blue-900/50 rounded-lg text-blue-400 font-ninja hover:bg-blue-900/70 flex items-center justify-center gap-2">
                  <RotateCcw size={16} /> Restart
                </button>
                <button onClick={() => { sendCommand(selectedPC.id, 'shutdown'); setSelectedPC(null); }}
                  className="py-3 bg-red-900/50 rounded-lg text-red-400 font-ninja hover:bg-red-900/70 flex items-center justify-center gap-2">
                  <Power size={16} /> Shutdown
                </button>
                <button onClick={() => { sendCommand(selectedPC.id, 'wake'); setSelectedPC(null); }}
                  className="py-3 bg-ninja-green/20 rounded-lg text-ninja-green font-ninja hover:bg-ninja-green/30 flex items-center justify-center gap-2">
                  <Power size={16} /> Wake On LAN
                </button>
              </div>

              {/* Delete PC */}
              <button
                onClick={() => deletePC(selectedPC)}
                className="w-full mt-4 py-2 border border-red-500/20 rounded-lg text-red-400/60 font-body text-xs hover:bg-red-500/10 hover:text-red-400 transition-all"
              >
                Remove PC from panel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
