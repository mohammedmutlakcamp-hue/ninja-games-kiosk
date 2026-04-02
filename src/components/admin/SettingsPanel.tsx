'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { COIN_PACKAGES } from '@/lib/constants';
import { Save, CheckCircle2, Settings, Clock, Coins, Sliders, LayoutDashboard, Eye, EyeOff } from 'lucide-react';

export function SettingsPanel() {
  const [settings, setSettings] = useState({
    cafeName: 'Ninja Games',
    currency: 'JOD',
    coinRate: 1,
    openHour: 10,
    closeHour: 24,
    autoShutdown: true,
    maxReservationMinutes: 30,
    lowBalanceWarning: 50,
    gracePeriodSeconds: 60,
  });
  const [saved, setSaved] = useState(false);
  const [sidebarTabs, setSidebarTabs] = useState<Record<string, boolean>>({
    games: true, minigames: true, tournaments: true, food: true,
    dailytasks: true, profile: true, friends: true, chests: true,
    inventory: true, leaderboard: true, matchreport: true,
  });
  const [sidebarSaved, setSidebarSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, 'config', 'settings'));
      if (snap.exists()) setSettings({ ...settings, ...snap.data() });
      const sidebarSnap = await getDoc(doc(db, 'config', 'sidebar'));
      if (sidebarSnap.exists()) setSidebarTabs(prev => ({ ...prev, ...sidebarSnap.data() }));
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSidebar = async () => {
    await setDoc(doc(db, 'config', 'sidebar'), sidebarTabs);
    setSidebarSaved(true);
    setTimeout(() => setSidebarSaved(false), 2000);
  };

  const save = async () => {
    await setDoc(doc(db, 'config', 'settings'), settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl">
      <h2 className="font-ninja text-2xl text-white mb-6 flex items-center gap-3">
        <Settings size={24} className="text-ninja-green" /> SETTINGS
      </h2>

      <div className="space-y-6">
        {/* General */}
        <div className="glass rounded-xl p-6 border border-white/5">
          <h3 className="font-ninja text-lg text-ninja-green mb-4 flex items-center gap-2">
            <Sliders size={16} /> GENERAL
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm font-body mb-1 block">CAFE NAME</label>
              <input
                value={settings.cafeName}
                onChange={(e) => setSettings({ ...settings, cafeName: e.target.value })}
                className="w-full bg-black/50 border border-ninja-green/30 rounded-lg px-4 py-2 text-white font-body focus:border-ninja-green outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm font-body mb-1 block">CURRENCY</label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full bg-black/50 border border-ninja-green/30 rounded-lg px-4 py-2 text-white font-body focus:border-ninja-green outline-none"
                >
                  <option value="JOD">JOD (Jordanian Dinar)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="SAR">SAR (Saudi Riyal)</option>
                  <option value="AED">AED (UAE Dirham)</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm font-body mb-1 block">COIN RATE (1 {settings.currency} = ? coins)</label>
                <input
                  type="number"
                  value={settings.coinRate}
                  onChange={(e) => setSettings({ ...settings, coinRate: parseFloat(e.target.value) || 1 })}
                  className="w-full bg-black/50 border border-ninja-green/30 rounded-lg px-4 py-2 text-white font-body focus:border-ninja-green outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hours */}
        <div className="glass rounded-xl p-6 border border-white/5">
          <h3 className="font-ninja text-lg text-ninja-green mb-4 flex items-center gap-2">
            <Clock size={16} /> OPERATING HOURS
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm font-body mb-1 block">OPEN</label>
              <input type="number" value={settings.openHour}
                onChange={(e) => setSettings({ ...settings, openHour: parseInt(e.target.value) })}
                min={0} max={23}
                className="w-full bg-black/50 border border-ninja-green/30 rounded-lg px-4 py-2 text-white font-body focus:border-ninja-green outline-none" />
            </div>
            <div>
              <label className="text-gray-400 text-sm font-body mb-1 block">CLOSE</label>
              <input type="number" value={settings.closeHour}
                onChange={(e) => setSettings({ ...settings, closeHour: parseInt(e.target.value) })}
                min={0} max={24}
                className="w-full bg-black/50 border border-ninja-green/30 rounded-lg px-4 py-2 text-white font-body focus:border-ninja-green outline-none" />
            </div>
          </div>
          <label className="flex items-center gap-3 mt-4 cursor-pointer">
            <input type="checkbox" checked={settings.autoShutdown}
              onChange={(e) => setSettings({ ...settings, autoShutdown: e.target.checked })}
              className="w-5 h-5 accent-green-500" />
            <span className="font-body text-gray-300">Auto-shutdown PCs at closing time</span>
          </label>
        </div>

        {/* Session */}
        <div className="glass rounded-xl p-6 border border-white/5">
          <h3 className="font-ninja text-lg text-ninja-green mb-4 flex items-center gap-2">
            <Sliders size={16} /> SESSION
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-gray-400 text-sm font-body mb-1 block">MAX RESERVATION (min)</label>
              <input type="number" value={settings.maxReservationMinutes}
                onChange={(e) => setSettings({ ...settings, maxReservationMinutes: parseInt(e.target.value) })}
                className="w-full bg-black/50 border border-ninja-green/30 rounded-lg px-4 py-2 text-white font-body focus:border-ninja-green outline-none" />
            </div>
            <div>
              <label className="text-gray-400 text-sm font-body mb-1 block">LOW BALANCE (coins)</label>
              <input type="number" value={settings.lowBalanceWarning}
                onChange={(e) => setSettings({ ...settings, lowBalanceWarning: parseInt(e.target.value) })}
                className="w-full bg-black/50 border border-ninja-green/30 rounded-lg px-4 py-2 text-white font-body focus:border-ninja-green outline-none" />
            </div>
            <div>
              <label className="text-gray-400 text-sm font-body mb-1 block">GRACE PERIOD (sec)</label>
              <input type="number" value={settings.gracePeriodSeconds}
                onChange={(e) => setSettings({ ...settings, gracePeriodSeconds: parseInt(e.target.value) })}
                className="w-full bg-black/50 border border-ninja-green/30 rounded-lg px-4 py-2 text-white font-body focus:border-ninja-green outline-none" />
            </div>
          </div>
        </div>

        {/* Coin Packages */}
        <div className="glass rounded-xl p-6 border border-white/5">
          <h3 className="font-ninja text-lg text-ninja-green mb-4 flex items-center gap-2">
            <Coins size={16} /> COIN PACKAGES
          </h3>
          <div className="space-y-2">
            {COIN_PACKAGES.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <span className="font-body text-white flex items-center gap-1.5">
                  <Coins size={14} className="text-ninja-green" /> {p.coins} ({p.label})
                </span>
                <span className="font-body text-ninja-green">{settings.currency} {(p.price * settings.coinRate).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Visibility */}
        <div className="glass rounded-xl p-6 border border-white/5">
          <h3 className="font-ninja text-lg text-ninja-green mb-4 flex items-center gap-2">
            <LayoutDashboard size={16} /> KIOSK SIDEBAR — Show / Hide Tabs
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'games', label: 'Games' },
              { id: 'minigames', label: 'Mini Games' },
              { id: 'tournaments', label: 'Tournaments' },
              { id: 'food', label: 'Food & Drinks' },
              { id: 'dailytasks', label: 'Daily Tasks' },
              { id: 'profile', label: 'Profile' },
              { id: 'friends', label: 'Friends' },
              { id: 'chests', label: 'Chests' },
              { id: 'inventory', label: 'Inventory' },
              { id: 'leaderboard', label: 'Leaderboard' },
              { id: 'matchreport', label: 'Match Report' },
            ].map(tab => (
              <label key={tab.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all border ${
                  sidebarTabs[tab.id] !== false
                    ? 'bg-ninja-green/10 border-ninja-green/30 text-white'
                    : 'bg-black/30 border-white/5 text-gray-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={sidebarTabs[tab.id] !== false}
                  onChange={(e) => setSidebarTabs({ ...sidebarTabs, [tab.id]: e.target.checked })}
                  className="w-5 h-5 accent-green-500"
                />
                <span className="font-body text-sm flex-1">{tab.label}</span>
                {sidebarTabs[tab.id] !== false
                  ? <Eye size={14} className="text-ninja-green" />
                  : <EyeOff size={14} className="text-gray-600" />
                }
              </label>
            ))}
          </div>
          <button
            onClick={saveSidebar}
            className={`w-full mt-4 py-2.5 rounded-lg font-ninja text-sm transition-all flex items-center justify-center gap-2 ${
              sidebarSaved ? 'bg-green-600 text-white' : 'bg-ninja-green/20 text-ninja-green border border-ninja-green/30 hover:bg-ninja-green/30'
            }`}
          >
            {sidebarSaved ? <><CheckCircle2 size={16} /> SIDEBAR SAVED!</> : <><Save size={16} /> SAVE SIDEBAR</>}
          </button>
        </div>

        {/* Save */}
        <button
          onClick={save}
          className={`w-full py-3 rounded-lg font-ninja font-bold transition-all flex items-center justify-center gap-2 ${
            saved ? 'bg-green-600 text-white' : 'bg-ninja-green text-black hover:bg-ninja-green/90'
          }`}
        >
          {saved ? <><CheckCircle2 size={18} /> SAVED!</> : <><Save size={18} /> SAVE SETTINGS</>}
        </button>
      </div>
    </div>
  );
}
