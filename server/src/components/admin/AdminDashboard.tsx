'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, getDocs, doc, updateDoc } from 'firebase/firestore';
import { PCManagement } from './PCManagement';
import { PlayerManagement } from './PlayerManagement';
import { MenuManagement } from './MenuManagement';
import { OrdersPanel } from './OrdersPanel';
import { RevenuePanel } from './RevenuePanel';
import { SettingsPanel } from './SettingsPanel';
import { TournamentManagement } from './TournamentManagement';
import { TopUpRequests } from './TopUpRequests';
import { NotificationsPanel } from './NotificationsPanel';
import {
  LayoutDashboard, Monitor, Users, UtensilsCrossed, ClipboardList,
  DollarSign, Settings, LogOut, Activity, ShoppingBag, Coins, UserCheck, Swords,
  UserPlus, ShieldCheck, X as XIcon, Phone, Bell
} from 'lucide-react';

type Tab = 'dashboard' | 'pcs' | 'players' | 'topups' | 'menu' | 'orders' | 'tournaments' | 'revenue' | 'notifications' | 'settings';

interface Props {
  admin: any;
}

function DashboardOverview() {
  const [stats, setStats] = useState({
    activePCs: 0,
    totalPCs: 0,
    revenueToday: 0,
    activePlayers: 0,
    pendingOrders: 0,
    totalPlayers: 0,
  });

  useEffect(() => {
    // Listen for PCs
    const unsubPCs = onSnapshot(collection(db, 'pcs'), (snap) => {
      const pcs = snap.docs.map(d => d.data());
      setStats(prev => ({
        ...prev,
        totalPCs: pcs.length,
        activePCs: pcs.filter(p => p.status === 'occupied').length,
      }));
    });

    // Listen for orders
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      const orders = snap.docs.map(d => d.data());
      const pending = orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length;
      const today = new Date().setHours(0, 0, 0, 0);
      const todayRevenue = orders
        .filter(o => o.createdAt > today && o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.totalCoins || 0), 0);
      setStats(prev => ({ ...prev, pendingOrders: pending, revenueToday: todayRevenue }));
    });

    // Load players
    const loadPlayers = async () => {
      const snap = await getDocs(collection(db, 'players'));
      const today = new Date().setHours(0, 0, 0, 0);
      const active = snap.docs.filter(d => (d.data().lastLogin || 0) > today).length;
      setStats(prev => ({ ...prev, totalPlayers: snap.size, activePlayers: active }));
    };
    loadPlayers();

    return () => { unsubPCs(); unsubOrders(); };
  }, []);

  const cards = [
    { label: 'Active PCs', value: `${stats.activePCs}/${stats.totalPCs}`, icon: <Monitor size={24} />, color: 'text-green-400', bg: 'from-green-500/10 to-green-500/5', border: 'border-green-500/20' },
    { label: 'Revenue Today', value: `${stats.revenueToday.toLocaleString()} coins`, icon: <Coins size={24} />, color: 'text-yellow-400', bg: 'from-yellow-500/10 to-yellow-500/5', border: 'border-yellow-500/20' },
    { label: 'Active Players', value: `${stats.activePlayers}`, icon: <UserCheck size={24} />, color: 'text-blue-400', bg: 'from-blue-500/10 to-blue-500/5', border: 'border-blue-500/20' },
    { label: 'Pending Orders', value: `${stats.pendingOrders}`, icon: <ShoppingBag size={24} />, color: 'text-orange-400', bg: 'from-orange-500/10 to-orange-500/5', border: 'border-orange-500/20' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-ninja text-3xl text-white mb-1">DASHBOARD</h2>
        <p className="font-body text-gray-500 text-sm">Welcome back, admin. Here&apos;s your overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-xl p-6 bg-gradient-to-br ${card.bg} border ${card.border} relative overflow-hidden`}
            style={{ backdropFilter: 'blur(10px)' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={card.color}>
                {card.icon}
              </div>
              <Activity size={14} className="text-gray-600" />
            </div>
            <p className={`font-ninja text-3xl ${card.color} mb-1`}>{card.value}</p>
            <p className="font-body text-gray-500 text-sm">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick stats row */}
      <div className="mt-8 grid grid-cols-2 gap-5">
        <div className="glass rounded-xl p-6 border border-white/5">
          <h3 className="font-ninja text-lg text-ninja-green mb-3 flex items-center gap-2">
            <Users size={18} /> PLAYER OVERVIEW
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400 font-body text-sm">Total Registered</span>
              <span className="text-white font-ninja">{stats.totalPlayers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-body text-sm">Active Today</span>
              <span className="text-ninja-green font-ninja">{stats.activePlayers}</span>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-white/5">
          <h3 className="font-ninja text-lg text-ninja-green mb-3 flex items-center gap-2">
            <Monitor size={18} /> PC STATUS
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400 font-body text-sm">Total PCs</span>
              <span className="text-white font-ninja">{stats.totalPCs}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-body text-sm">Occupied</span>
              <span className="text-red-400 font-ninja">{stats.activePCs}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-body text-sm">Available</span>
              <span className="text-green-400 font-ninja">{stats.totalPCs - stats.activePCs}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PendingRegistration {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  ninjaType: string;
  approvalCode: string;
  status: string;
  createdAt: number;
}

export function AdminDashboard({ admin }: Props) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [pendingRegs, setPendingRegs] = useState<PendingRegistration[]>([]);
  const [activeNotification, setActiveNotification] = useState<PendingRegistration | null>(null);

  // Listen for new pending registrations
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'pending-registrations'), (snap) => {
      const pending = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as PendingRegistration))
        .filter(r => r.status === 'pending')
        .sort((a, b) => b.createdAt - a.createdAt);
      setPendingRegs(pending);
      // Show the newest pending registration as notification
      if (pending.length > 0 && (!activeNotification || activeNotification.id !== pending[0].id)) {
        setActiveNotification(pending[0]);
      }
    });
    return () => unsub();
  }, []);

  const approveRegistration = async (reg: PendingRegistration) => {
    try {
      await updateDoc(doc(db, 'pending-registrations', reg.id), { status: 'approved' });
      setActiveNotification(null);
    } catch (err) {
      console.error('Failed to approve:', err);
    }
  };

  const rejectRegistration = async (reg: PendingRegistration) => {
    try {
      await updateDoc(doc(db, 'pending-registrations', reg.id), { status: 'rejected' });
      setActiveNotification(null);
    } catch (err) {
      console.error('Failed to reject:', err);
    }
  };

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'pcs', label: 'PCs', icon: <Monitor size={20} /> },
    { id: 'players', label: 'Players', icon: <Users size={20} /> },
    { id: 'topups', label: 'Top Ups', icon: <Coins size={20} /> },
    { id: 'menu', label: 'Menu', icon: <UtensilsCrossed size={20} /> },
    { id: 'orders', label: 'Orders', icon: <ClipboardList size={20} /> },
    { id: 'tournaments', label: 'Tournaments', icon: <Swords size={20} /> },
    { id: 'revenue', label: 'Revenue', icon: <DollarSign size={20} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-[240px] z-50 flex flex-col"
        style={{
          background: 'linear-gradient(180deg, rgba(10,10,10,0.95) 0%, rgba(15,15,15,0.98) 100%)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(57, 255, 20, 0.1)',
        }}
      >
        {/* Brand header */}
        <div className="p-6 border-b border-gray-800/60">
          <h1 className="font-ninja text-xl text-ninja-green text-glow">NINJA GAMES</h1>
          <p className="font-body text-[11px] text-gray-600 mt-1">Admin Panel</p>
          <p className="font-body text-[10px] text-gray-700 mt-0.5 truncate">{admin.email}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-all relative ${
                tab === item.id
                  ? 'text-ninja-green bg-ninja-green/8'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
              }`}
            >
              {tab === item.id && (
                <motion.div
                  layoutId="admin-nav-indicator"
                  className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full bg-ninja-green"
                  style={{ boxShadow: '0 0 10px rgba(57, 255, 20, 0.5)' }}
                />
              )}
              <span className={tab === item.id ? 'text-ninja-green' : ''}>{item.icon}</span>
              <span className="font-body text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-800/60">
          <button
            onClick={async () => { await signOut(auth); window.location.href = '/kiosk'; }}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-500/30 rounded-lg text-red-400 font-body text-sm hover:bg-red-500/5 transition-all"
          >
            <LogOut size={16} /> Back to Login
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-[240px] flex-1 p-8">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'dashboard' && <DashboardOverview />}
          {tab === 'pcs' && <PCManagement />}
          {tab === 'players' && <PlayerManagement />}
          {tab === 'topups' && <TopUpRequests />}
          {tab === 'menu' && <MenuManagement />}
          {tab === 'orders' && <OrdersPanel />}
          {tab === 'tournaments' && <TournamentManagement />}
          {tab === 'revenue' && <RevenuePanel />}
          {tab === 'notifications' && <NotificationsPanel />}
          {tab === 'settings' && <SettingsPanel />}
        </motion.div>
      </div>

      {/* Full-screen New User Registration Notification */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center"
            style={{ backdropFilter: 'blur(10px)' }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-[550px] max-w-[90vw] rounded-2xl border-2 border-ninja-green/30 p-10 text-center"
              style={{ background: 'rgba(11,12,16,0.98)' }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1], boxShadow: ['0 0 20px rgba(57,255,20,0.2)', '0 0 40px rgba(57,255,20,0.5)', '0 0 20px rgba(57,255,20,0.2)'] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-ninja-green/15 flex items-center justify-center border border-ninja-green/30"
              >
                <UserPlus size={36} className="text-ninja-green" />
              </motion.div>

              <h1 className="font-ninja text-3xl text-ninja-green mb-2 tracking-wider">NEW USER REGISTRATION</h1>
              <p className="font-body text-gray-400 mb-8">A new player is waiting for approval</p>

              <div className="glass rounded-xl p-6 mb-6 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="font-body text-gray-500">Name</span>
                  <span className="font-ninja text-white">{activeNotification.firstName} {activeNotification.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-body text-gray-500">Username</span>
                  <span className="font-ninja text-ninja-green">{activeNotification.username?.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-body text-gray-500">Phone</span>
                  <span className="font-body text-white flex items-center gap-1"><Phone size={12} /> {activeNotification.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-body text-gray-500">Ninja Type</span>
                  <span className="font-ninja text-white capitalize">{activeNotification.ninjaType}</span>
                </div>
              </div>

              {/* Approval Code - large display for admin to tell user */}
              <div className="mb-8">
                <p className="font-body text-gray-500 text-xs uppercase tracking-wider mb-2">APPROVAL CODE — Give this to the player</p>
                <div className="bg-black/60 border-2 border-ninja-green/40 rounded-xl py-4 px-6">
                  <p className="font-ninja text-5xl text-ninja-green tracking-[0.4em]"
                    style={{ textShadow: '0 0 20px rgba(57,255,20,0.5)' }}
                  >
                    {activeNotification.approvalCode}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => rejectRegistration(activeNotification)}
                  className="flex-1 py-4 border border-red-500/30 rounded-xl text-red-400 font-ninja text-lg hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                >
                  <XIcon size={20} /> REJECT
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => approveRegistration(activeNotification)}
                  className="flex-1 py-4 bg-ninja-green text-black rounded-xl font-ninja text-lg font-bold hover:bg-green-400 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={20} /> APPROVE
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
