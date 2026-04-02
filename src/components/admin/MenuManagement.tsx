'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { MenuItem } from '@/types';
import {
  Plus, CupSoda, Cookie, Pizza, UtensilsCrossed, Pencil,
  Trash2, ToggleLeft, ToggleRight, Coins, X
} from 'lucide-react';

export function MenuManagement() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [category, setCategory] = useState<'all' | 'drinks' | 'snacks' | 'food'>('all');

  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'drinks' | 'snacks' | 'food'>('drinks');
  const [formPrice, setFormPrice] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formPrepTime, setFormPrepTime] = useState('5');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'menu'), (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem)));
    });
    return () => unsub();
  }, []);

  const filtered = items.filter(i => category === 'all' || i.category === category);

  const resetForm = () => {
    setFormName(''); setFormCategory('drinks'); setFormPrice('');
    setFormDescription(''); setFormImage(''); setFormPrepTime('5');
  };

  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    setFormName(item.name); setFormCategory(item.category);
    setFormPrice(item.price.toString()); setFormDescription(item.description);
    setFormImage(item.image); setFormPrepTime(item.preparationTime.toString());
    setShowAdd(true);
  };

  const handleSave = async () => {
    if (!formName || !formPrice) return;
    const data = {
      name: formName, category: formCategory, price: parseInt(formPrice) || 0,
      description: formDescription, image: formImage, available: true,
      preparationTime: parseInt(formPrepTime) || 5,
    };
    if (editItem) {
      await updateDoc(doc(db, 'menu', editItem.id), data);
    } else {
      await addDoc(collection(db, 'menu'), data);
    }
    resetForm(); setEditItem(null); setShowAdd(false);
  };

  const toggleAvailable = async (item: MenuItem) => {
    await updateDoc(doc(db, 'menu', item.id), { available: !item.available });
  };

  const deleteItem = async (item: MenuItem) => {
    if (confirm(`Delete "${item.name}"?`)) {
      await deleteDoc(doc(db, 'menu', item.id));
    }
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    drinks: <CupSoda size={22} />,
    snacks: <Cookie size={22} />,
    food: <Pizza size={22} />,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-ninja text-2xl text-white">MENU MANAGEMENT</h2>
          <p className="font-body text-gray-500">{items.length} items · {items.filter(i => i.available).length} available</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { resetForm(); setEditItem(null); setShowAdd(true); }}
          className="px-6 py-2 bg-ninja-green text-black font-ninja rounded-lg flex items-center gap-2"
        >
          <Plus size={16} /> ADD ITEM
        </motion.button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6">
        {(['all', 'drinks', 'snacks', 'food'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-lg font-body text-sm transition-all flex items-center gap-2 ${
              category === cat ? 'bg-ninja-green text-black font-semibold' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
            }`}
          >
            {cat === 'all' ? <UtensilsCrossed size={16} /> : categoryIcons[cat]}
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className={`glass rounded-xl p-4 border transition-all ${item.available ? 'border-white/5' : 'border-red-500/30 opacity-60'}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400">{categoryIcons[item.category]}</span>
              <button
                onClick={() => toggleAvailable(item)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-body ${
                  item.available ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {item.available ? <ToggleRight size={16} className="text-green-400" /> : <ToggleLeft size={16} className="text-red-400" />}
                {item.available ? 'ON' : 'OFF'}
              </button>
            </div>

            <h3 className="font-ninja text-sm text-white mb-1">{item.name}</h3>
            <p className="font-body text-xs text-gray-500 mb-2 line-clamp-2">{item.description}</p>
            <p className="font-ninja text-lg text-ninja-green mb-3 flex items-center gap-1">
              <Coins size={14} /> {item.price}
            </p>

            <div className="flex gap-2">
              <button onClick={() => openEdit(item)}
                className="flex-1 py-1.5 bg-gray-800 rounded text-gray-400 text-xs font-body hover:bg-gray-700 flex items-center justify-center gap-1">
                <Pencil size={11} /> Edit
              </button>
              <button onClick={() => deleteItem(item)}
                className="flex-1 py-1.5 bg-red-900/30 rounded text-red-400 text-xs font-body hover:bg-red-900/50 flex items-center justify-center gap-1">
                <Trash2 size={11} /> Delete
              </button>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-20 glass rounded-2xl">
            <UtensilsCrossed size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="font-ninja text-xl text-gray-500">No items yet</p>
            <p className="font-body text-gray-600 text-sm mt-2">Click &quot;+ ADD ITEM&quot; to add drinks, snacks, and food</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => { setShowAdd(false); setEditItem(null); }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-strong rounded-2xl p-8 w-[500px] border border-ninja-green/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-ninja text-xl text-ninja-green">
                  {editItem ? 'EDIT ITEM' : 'ADD MENU ITEM'}
                </h3>
                <button onClick={() => { setShowAdd(false); setEditItem(null); }} className="text-gray-500 hover:text-white"><X size={20} /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm font-body mb-1 block">NAME</label>
                  <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g., Espresso Coffee"
                    className="w-full bg-black/50 border-2 border-ninja-green/30 rounded-lg px-4 py-3 text-white font-body focus:border-ninja-green outline-none" autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm font-body mb-1 block">CATEGORY</label>
                    <select value={formCategory} onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full bg-black/50 border-2 border-ninja-green/30 rounded-lg px-4 py-3 text-white font-body focus:border-ninja-green outline-none">
                      <option value="drinks">Drinks</option>
                      <option value="snacks">Snacks</option>
                      <option value="food">Food</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm font-body mb-1 block">PRICE (coins)</label>
                    <input type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="e.g., 30"
                      className="w-full bg-black/50 border-2 border-ninja-green/30 rounded-lg px-4 py-3 text-white font-body focus:border-ninja-green outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-sm font-body mb-1 block">DESCRIPTION</label>
                  <input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Short description"
                    className="w-full bg-black/50 border-2 border-ninja-green/30 rounded-lg px-4 py-3 text-white font-body focus:border-ninja-green outline-none" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm font-body mb-1 block">PREP TIME (minutes)</label>
                  <input type="number" value={formPrepTime} onChange={(e) => setFormPrepTime(e.target.value)}
                    className="w-full bg-black/50 border-2 border-ninja-green/30 rounded-lg px-4 py-3 text-white font-body focus:border-ninja-green outline-none" />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowAdd(false); setEditItem(null); }}
                  className="flex-1 py-3 border border-gray-600 rounded-lg text-gray-400 font-ninja">CANCEL</button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave}
                  className="flex-1 bg-ninja-green text-black py-3 rounded-lg font-ninja font-bold">
                  {editItem ? 'SAVE' : 'ADD ITEM'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
