'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
  Users, UserCheck, Coins, BarChart3, Clock,
  ClipboardList, UtensilsCrossed, RefreshCw, Lightbulb
} from 'lucide-react';

export function RevenuePanel() {
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalCoinsInCirculation: 0,
    totalCoinsSpent: 0,
    totalPlaytimeHours: 0,
    totalOrders: 0,
    totalFoodRevenue: 0,
    todayActivePlayers: 0,
  });

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const playersSnap = await getDocs(collection(db, 'players'));
      const ordersSnap = await getDocs(collection(db, 'orders'));
      let totalCoins = 0, totalSpent = 0, totalPlaytime = 0, todayActive = 0;
      const today = new Date().setHours(0, 0, 0, 0);

      playersSnap.docs.forEach(d => {
        const p = d.data();
        totalCoins += p.coins || 0;
        totalSpent += p.totalCoinsSpent || 0;
        totalPlaytime += p.totalPlaytime || 0;
        if (p.lastLogin > today) todayActive++;
      });

      let foodRevenue = 0;
      ordersSnap.docs.forEach(d => {
        const o = d.data();
        if (o.status !== 'cancelled') foodRevenue += o.totalCoins || 0;
      });

      setStats({
        totalPlayers: playersSnap.size,
        totalCoinsInCirculation: Math.floor(totalCoins),
        totalCoinsSpent: Math.floor(totalSpent),
        totalPlaytimeHours: Math.floor(totalPlaytime / 60),
        totalOrders: ordersSnap.size,
        totalFoodRevenue: foodRevenue,
        todayActivePlayers: todayActive,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const cards = [
    { label: 'Total Players', value: stats.totalPlayers, icon: <Users size={24} />, color: 'text-ninja-green' },
    { label: 'Active Today', value: stats.todayActivePlayers, icon: <UserCheck size={24} />, color: 'text-ninja-green' },
    { label: 'Coins in Circulation', value: stats.totalCoinsInCirculation.toLocaleString(), icon: <Coins size={24} />, color: 'text-yellow-400' },
    { label: 'Coins Spent (All Time)', value: stats.totalCoinsSpent.toLocaleString(), icon: <BarChart3 size={24} />, color: 'text-blue-400' },
    { label: 'Total Playtime', value: `${stats.totalPlaytimeHours.toLocaleString()}h`, icon: <Clock size={24} />, color: 'text-purple-400' },
    { label: 'Total Orders', value: stats.totalOrders, icon: <ClipboardList size={24} />, color: 'text-orange-400' },
    { label: 'Food Revenue', value: `${stats.totalFoodRevenue.toLocaleString()} coins`, icon: <UtensilsCrossed size={24} />, color: 'text-red-400' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-ninja text-2xl text-white">REVENUE & STATS</h2>
          <p className="font-body text-gray-500">Business overview</p>
        </div>
        <button
          onClick={loadStats}
          className="px-4 py-2 border border-ninja-green/30 rounded-lg text-ninja-green font-body text-sm hover:bg-ninja-green/10 flex items-center gap-2"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-xl p-6 text-center border border-white/5"
          >
            <div className={`flex justify-center mb-3 ${card.color}`}>{card.icon}</div>
            <p className={`font-ninja text-2xl ${card.color}`}>{card.value}</p>
            <p className="font-body text-xs text-gray-500 mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Note */}
      <div className="mt-8 glass rounded-xl p-6 text-center border border-white/5">
        <p className="font-body text-gray-400 flex items-center justify-center gap-2">
          <Lightbulb size={16} className="text-yellow-400" />
          Revenue tracking is based on coins. Set your coin-to-currency ratio in Settings to see actual money values.
        </p>
      </div>
    </div>
  );
}
