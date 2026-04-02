'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, User } from 'firebase/auth';
import { ParticleBackground } from '@/components/ParticleBackground';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { motion } from 'framer-motion';
import { Shield, Mail, KeyRound, Loader2 } from 'lucide-react';

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Enter email and password');
      return;
    }
    setLoginLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError('Invalid credentials');
    }
    setLoginLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ninja-dark flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-ninja-green" />
      </div>
    );
  }

  if (user) {
    return <AdminDashboard admin={user} />;
  }

  return (
    <>
      <ParticleBackground />
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-2xl p-10 w-[420px] max-w-[90vw] border border-ninja-green/20"
        >
          {/* Back to User Login button */}
          <div className="mb-6">
            <button
              onClick={() => window.location.href = '/kiosk'}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-ninja-green/30 rounded-lg text-ninja-green font-body text-sm hover:bg-ninja-green/5 transition-all"
            >
              ← Back to User Login
            </button>
          </div>
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-ninja-green/10 flex items-center justify-center border border-ninja-green/30">
              <Shield size={32} className="text-ninja-green" />
            </div>
            <h1 className="font-ninja text-3xl text-ninja-green text-glow mb-1">ADMIN PANEL</h1>
            <p className="font-body text-gray-500 text-sm">Authorized personnel only</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm font-body mb-1 block flex items-center gap-2">
                <Mail size={14} className="text-ninja-green" /> EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border-2 border-ninja-green/30 rounded-lg px-4 py-3 text-white font-body focus:border-ninja-green outline-none transition-all"
                placeholder="admin@ninjagames.com"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm font-body mb-1 block flex items-center gap-2">
                <KeyRound size={14} className="text-ninja-green" /> PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border-2 border-ninja-green/30 rounded-lg px-4 py-3 text-white font-body focus:border-ninja-green outline-none transition-all"
                placeholder="Enter password"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-center mt-4 font-body">
              {error}
            </motion.p>
          )}

          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(57, 255, 20, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            disabled={loginLoading}
            className="w-full mt-6 bg-ninja-green text-black py-4 rounded-lg font-ninja font-bold text-lg hover:bg-ninja-green/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loginLoading ? <Loader2 size={20} className="animate-spin" /> : <Shield size={20} />}
            {loginLoading ? 'AUTHENTICATING...' : 'LOGIN'}
          </motion.button>
        </motion.div>
      </div>
    </>
  );
}
