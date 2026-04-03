'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Bell, Send, Users, User, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export function NotificationsPanel() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [targetUsername, setTargetUsername] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [history, setHistory] = useState<{ title: string; message: string; target: string; time: number }[]>([]);

  // Load players for autocomplete
  useEffect(() => {
    getDocs(collection(db, 'players')).then(snap => {
      setPlayers(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    });
    // Load notification history from localStorage
    const saved = localStorage.getItem('admin-notif-history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleSend = async () => {
    if (!title || !message) { setResult({ success: false, message: 'Title and message required' }); return; }

    setSending(true);
    setResult(null);

    try {
      let targetUids: string[] | undefined;

      if (targetType === 'specific') {
        const player = players.find(p => p.username?.toLowerCase() === targetUsername.toLowerCase());
        if (!player) { setResult({ success: false, message: 'Player not found' }); setSending(false); return; }
        targetUids = [player.uid];
      }

      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, targetUids }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ success: true, message: `Notification sent to ${targetType === 'all' ? 'all players' : targetUsername}` });
        const newHistory = [{ title, message, target: targetType === 'all' ? 'All Players' : targetUsername, time: Date.now() }, ...history.slice(0, 19)];
        setHistory(newHistory);
        localStorage.setItem('admin-notif-history', JSON.stringify(newHistory));
        setTitle('');
        setMessage('');
        setTargetUsername('');
      } else {
        setResult({ success: false, message: data.error || 'Failed to send' });
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message });
    }
    setSending(false);
  };

  const filteredPlayers = targetUsername
    ? players.filter(p => p.username?.toLowerCase().includes(targetUsername.toLowerCase())).slice(0, 5)
    : [];

  return (
    <div>
      <h1 className="font-ninja text-2xl text-white mb-6 flex items-center gap-3">
        <Bell size={24} className="text-ninja-green" /> Push Notifications
      </h1>

      <div className="grid grid-cols-2 gap-6">
        {/* Send Form */}
        <div className="rounded-xl p-6" style={{ background: 'rgba(15,15,20,0.8)', border: '1px solid rgba(57,255,20,0.1)' }}>
          <h2 className="font-ninja text-lg text-white mb-4">Send Notification</h2>

          {/* Target */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => setTargetType('all')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-body text-sm transition-all ${targetType === 'all' ? 'bg-ninja-green/15 border border-ninja-green/30 text-ninja-green' : 'border border-gray-700 text-gray-500 hover:text-gray-300'}`}>
              <Users size={16} /> All Players
            </button>
            <button onClick={() => setTargetType('specific')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-body text-sm transition-all ${targetType === 'specific' ? 'bg-ninja-green/15 border border-ninja-green/30 text-ninja-green' : 'border border-gray-700 text-gray-500 hover:text-gray-300'}`}>
              <User size={16} /> Specific Player
            </button>
          </div>

          {/* Player search */}
          {targetType === 'specific' && (
            <div className="mb-4 relative">
              <input type="text" value={targetUsername} onChange={(e) => setTargetUsername(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white font-body text-sm focus:border-ninja-green outline-none"
                placeholder="Search player username..." />
              {filteredPlayers.length > 0 && targetUsername && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-gray-700 overflow-hidden z-10"
                  style={{ background: 'rgba(15,15,20,0.98)' }}>
                  {filteredPlayers.map(p => (
                    <button key={p.uid} onClick={() => setTargetUsername(p.username)}
                      className="w-full px-4 py-2 text-left text-sm font-body text-gray-300 hover:bg-ninja-green/10 hover:text-ninja-green transition-all">
                      {p.username}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white font-body text-sm mb-3 focus:border-ninja-green outline-none"
            placeholder="Notification title..." />

          {/* Message */}
          <textarea value={message} onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white font-body text-sm mb-4 focus:border-ninja-green outline-none resize-none"
            placeholder="Notification message..." rows={3} />

          {/* Result */}
          {result && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-2 mb-4 px-4 py-2 rounded-lg text-sm font-body ${result.success ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {result.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {result.message}
            </motion.div>
          )}

          {/* Send */}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleSend} disabled={sending}
            className="w-full py-3 bg-ninja-green text-black rounded-lg font-ninja text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-green-400 transition-all">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {sending ? 'Sending...' : 'Send Notification'}
          </motion.button>

          {/* Quick Templates */}
          <div className="mt-4 pt-4 border-t border-gray-800/40">
            <p className="font-body text-xs text-gray-500 mb-2">Quick Templates:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { t: 'Tournament Starting!', m: 'A new tournament is starting soon. Join now!' },
                { t: 'Happy Hour!', m: 'Double XP for the next hour! Come play now!' },
                { t: 'New Games Added!', m: 'Check out the new games available at Ninja Games!' },
                { t: 'Weekend Special', m: 'Special weekend offer - Top up and get bonus coins!' },
              ].map((tmpl, i) => (
                <button key={i} onClick={() => { setTitle(tmpl.t); setMessage(tmpl.m); }}
                  className="px-3 py-1.5 rounded-lg border border-gray-700 text-gray-500 font-body text-[11px] hover:text-ninja-green hover:border-ninja-green/30 transition-all">
                  {tmpl.t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* History */}
        <div className="rounded-xl p-6" style={{ background: 'rgba(15,15,20,0.8)', border: '1px solid rgba(57,255,20,0.1)' }}>
          <h2 className="font-ninja text-lg text-white mb-4">Recent Notifications</h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-gray-600 font-body text-sm text-center py-8">No notifications sent yet</p>
            ) : history.map((h, i) => (
              <div key={i} className="p-3 rounded-lg border border-gray-800/40" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-ninja text-xs text-ninja-green">{h.title}</span>
                  <span className="font-body text-[10px] text-gray-600">
                    {new Date(h.time).toLocaleString()}
                  </span>
                </div>
                <p className="font-body text-xs text-gray-400">{h.message}</p>
                <p className="font-body text-[10px] text-gray-600 mt-1">To: {h.target}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
