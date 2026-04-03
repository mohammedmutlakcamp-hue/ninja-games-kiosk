'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, limit } from 'firebase/firestore';
import { FoodOrder, OrderStatus } from '@/types';
import {
  Clock, ChefHat, CheckCircle2, Package, XCircle, User,
  Coins, ClipboardList, ArrowRight, Ban
} from 'lucide-react';

export function OrdersPanel() {
  const [orders, setOrders] = useState<FoodOrder[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as FoodOrder)));
    });
    return () => unsub();
  }, []);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: Date.now() });
  };

  const activeOrders = orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status));
  const completedOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  const statusConfig: Record<string, { color: string; icon: React.ReactNode; next?: OrderStatus; nextLabel?: string; nextIcon?: React.ReactNode }> = {
    pending: { color: 'text-yellow-400', icon: <Clock size={20} className="text-yellow-400" />, next: 'preparing', nextLabel: 'Start Preparing', nextIcon: <ChefHat size={16} /> },
    preparing: { color: 'text-orange-400', icon: <ChefHat size={20} className="text-orange-400" />, next: 'ready', nextLabel: 'Mark Ready', nextIcon: <CheckCircle2 size={16} /> },
    ready: { color: 'text-ninja-green', icon: <CheckCircle2 size={20} className="text-ninja-green" />, next: 'delivered', nextLabel: 'Mark Delivered', nextIcon: <Package size={16} /> },
    delivered: { color: 'text-gray-500', icon: <Package size={18} className="text-gray-500" /> },
    cancelled: { color: 'text-red-400', icon: <XCircle size={18} className="text-red-400" /> },
  };

  return (
    <div>
      <h2 className="font-ninja text-2xl text-white mb-2">ORDERS</h2>
      <p className="font-body text-gray-500 mb-6">{activeOrders.length} active orders</p>

      {/* Active Orders */}
      {activeOrders.length > 0 ? (
        <div className="space-y-3 mb-8">
          {activeOrders.map((order, i) => {
            const config = statusConfig[order.status];
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-xl p-5 border border-ninja-green/10"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {config.icon}
                    <div>
                      <p className="font-ninja text-white flex items-center gap-1.5">
                        <User size={14} className="text-ninja-green" /> {order.playerName?.toUpperCase()}
                      </p>
                      <p className="font-body text-xs text-gray-500">
                        PC: {order.pcId} · {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-ninja ${config.color}`}>{order.status.toUpperCase()}</p>
                    <p className="font-body text-sm text-ninja-green flex items-center gap-1 justify-end">
                      <Coins size={12} /> {order.totalCoins}
                    </p>
                  </div>
                </div>

                <div className="bg-black/30 rounded-lg p-3 mb-3">
                  {order.items.map((item, j) => (
                    <p key={j} className="font-body text-sm text-gray-300">
                      {item.name} × {item.quantity} <span className="text-gray-500 flex items-center gap-0.5 inline-flex">(<Coins size={10} /> {item.price * item.quantity})</span>
                    </p>
                  ))}
                </div>

                <div className="flex gap-2">
                  {config.next && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateStatus(order.id, config.next!)}
                      className="flex-1 py-2 bg-ninja-green text-black rounded-lg font-ninja text-sm flex items-center justify-center gap-2"
                    >
                      {config.nextIcon} {config.nextLabel}
                    </motion.button>
                  )}
                  {order.status !== 'cancelled' && (
                    <button
                      onClick={() => updateStatus(order.id, 'cancelled')}
                      className="px-4 py-2 bg-red-900/30 text-red-400 rounded-lg font-body text-sm hover:bg-red-900/50 flex items-center gap-1"
                    >
                      <Ban size={14} /> Cancel
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 glass rounded-2xl mb-8">
          <ClipboardList size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="font-ninja text-lg text-gray-500">No active orders</p>
        </div>
      )}

      {/* Completed Orders */}
      {completedOrders.length > 0 && (
        <div>
          <h3 className="font-ninja text-lg text-gray-400 mb-3">COMPLETED</h3>
          <div className="space-y-2">
            {completedOrders.slice(0, 20).map((order) => {
              const config = statusConfig[order.status];
              return (
                <div key={order.id} className="glass rounded-lg p-3 flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-2">
                    {config.icon}
                    <div>
                      <p className="font-body text-sm text-white">
                        {order.playerName} — {order.items.map(i => i.name).join(', ')}
                      </p>
                      <p className="font-body text-xs text-gray-600">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <p className={`font-body text-sm ${config.color}`}>{order.status}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
