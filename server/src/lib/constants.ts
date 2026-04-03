import { Chest, ChestReward, CoinPackage } from '@/types';

// ==================== COINS & PRICING ====================
// 1 hour = 150 coins = 1.5 JOD → 1 JOD = 100 coins
export const COINS_PER_HOUR = 150;
export const COINS_PER_MINUTE = COINS_PER_HOUR / 60; // 2.5
export const JOD_TO_COINS = 100; // 1 JOD = 100 coins
export const LOW_BALANCE_WARNING = 38; // ~15 min warning
export const GRACE_PERIOD_SECONDS = 30;
export const RESERVATION_MAX_MINUTES = 30;
export const RESERVATION_COIN_RATE = COINS_PER_MINUTE;
export const MIN_DEPOSIT_JOD = 2;

export const COIN_PACKAGES: CoinPackage[] = [
  { id: 'pack_200', coins: 200, price: 2, label: '1h 20min' },
  { id: 'pack_1050', coins: 1050, price: 5, label: '7 Hours', popular: true },
  { id: 'pack_2550', coins: 2550, price: 10, label: '17 Hours' },
];

// ==================== NINJA TYPES ====================
export const NINJA_TYPES = [
  { id: 'neon', name: 'Neon Ninja', color: '#39FF14', description: 'Electric energy flows through your veins' },
  { id: 'shadow', name: 'Shadow Ninja', color: '#1a1a2e', description: 'One with the darkness' },
  { id: 'fire', name: 'Fire Ninja', color: '#FF4500', description: 'Born from the flames' },
  { id: 'ice', name: 'Ice Ninja', color: '#00BFFF', description: 'Cold as the arctic wind' },
  { id: 'cyber', name: 'Cyber Ninja', color: '#9B59B6', description: 'Enhanced with technology' },
  { id: 'golden', name: 'Golden Ninja', color: '#FFD700', description: 'Legendary warrior of light' },
  { id: 'phantom', name: 'Phantom Ninja', color: '#8B00FF', description: 'Between worlds, beyond reach' },
] as const;

// ==================== CHESTS ====================
export const CHEST_REWARDS: ChestReward[] = [
  // Tokens
  { id: 'coins_10', type: 'coins', name: '10 Tokens', description: 'A small token bonus', rarity: 'common', value: 10, icon: 'coins', dropRate: 0.20 },
  { id: 'coins_25', type: 'coins', name: '25 Tokens', description: 'A nice token bonus', rarity: 'common', value: 25, icon: 'coins', dropRate: 0.15 },
  { id: 'coins_50', type: 'coins', name: '50 Tokens', description: 'A solid token bonus', rarity: 'rare', value: 50, icon: 'coins', dropRate: 0.10 },
  { id: 'coins_150', type: 'coins', name: '150 Tokens', description: 'Big token jackpot!', rarity: 'epic', value: 150, icon: 'coins', dropRate: 0.04 },
  { id: 'coins_500', type: 'coins', name: '500 Tokens', description: 'MEGA JACKPOT!', rarity: 'legendary', value: 500, icon: 'coins', dropRate: 0.005 },

  // Vouchers
  { id: 'voucher_drink', type: 'voucher', name: 'Free Drink Voucher', description: 'One free drink on the house', rarity: 'rare', value: 30, icon: 'cup', dropRate: 0.10 },
  { id: 'voucher_snack', type: 'voucher', name: 'Free Snack Voucher', description: 'One free snack of your choice', rarity: 'rare', value: 25, icon: 'cookie', dropRate: 0.10 },
  { id: 'voucher_food', type: 'voucher', name: 'Free Food Voucher', description: 'One free meal combo', rarity: 'epic', value: 50, icon: 'utensils', dropRate: 0.05 },
  { id: 'tournament_pass', type: 'voucher', name: 'Tournament Entry Pass', description: 'Free entry to any tournament', rarity: 'legendary', value: 500, icon: 'trophy', dropRate: 0.01 },

  // Extra Time
  { id: 'extra_time_30m', type: 'voucher', name: '30 Min Free Play', description: '30 minutes of free PC time', rarity: 'rare', value: 100, icon: 'clock', dropRate: 0.10 },
  { id: 'extra_time_1h', type: 'voucher', name: '1 Hour Free Play', description: '1 full hour of free PC time', rarity: 'epic', value: 200, icon: 'clock', dropRate: 0.05 },
];

export const CHESTS: Chest[] = [
  {
    id: 'bronze',
    tier: 'bronze',
    name: 'Bronze Chest',
    cost: 30,
    color: '#CD7F32',
    glowColor: 'rgba(205, 127, 50, 0.5)',
    rewards: CHEST_REWARDS.filter(r => r.rarity === 'common' || (r.rarity === 'rare' && r.dropRate >= 0.10)),
  },
  {
    id: 'silver',
    tier: 'silver',
    name: 'Silver Chest',
    cost: 75,
    color: '#C0C0C0',
    glowColor: 'rgba(192, 192, 192, 0.5)',
    rewards: CHEST_REWARDS.filter(r => r.rarity !== 'legendary'),
  },
  {
    id: 'gold',
    tier: 'gold',
    name: 'Gold Chest',
    cost: 150,
    color: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.5)',
    rewards: CHEST_REWARDS.filter(r => r.rarity !== 'common' || r.type === 'coins'),
  },
  {
    id: 'legendary',
    tier: 'legendary',
    name: 'Legendary Chest',
    cost: 300,
    color: '#9B59B6',
    glowColor: 'rgba(155, 89, 182, 0.5)',
    rewards: CHEST_REWARDS,
  },
];

// ==================== CHARACTER ====================
export const DEFAULT_CHARACTER = {
  skinColor: '#8D6E63',
  outfitId: 'outfit_default',
  maskId: 'mask_default',
  accessoryId: 'none',
  equippedSkins: [],
  ninjaType: 'neon',
};

export const SKIN_COLORS = [
  '#FDBCB4', '#F1C27D', '#E0AC69', '#C68642', '#8D6E63', '#5D4037', '#3E2723',
];

export const OUTFIT_OPTIONS = [
  { id: 'outfit_default', name: 'Default Ninja', rarity: 'common', color: '#333' },
  { id: 'outfit_black', name: 'Shadow Black', rarity: 'common', color: '#1a1a1a' },
  { id: 'outfit_grey', name: 'Storm Grey', rarity: 'common', color: '#666' },
  { id: 'outfit_green', name: 'Forest Green', rarity: 'common', color: '#2d5016' },
  { id: 'outfit_neon', name: 'Neon Strike', rarity: 'rare', color: '#39FF14' },
  { id: 'outfit_fire', name: 'Inferno', rarity: 'rare', color: '#FF4500' },
  { id: 'outfit_cyber', name: 'Cyber Ninja', rarity: 'epic', color: '#00BFFF' },
  { id: 'outfit_samurai', name: 'Golden Samurai', rarity: 'epic', color: '#FFD700' },
  { id: 'outfit_phantom', name: 'Phantom Lord', rarity: 'legendary', color: '#8B00FF' },
  { id: 'outfit_shogun', name: 'Shogun Emperor', rarity: 'legendary', color: '#FF1493' },
];

export const MASK_OPTIONS = [
  { id: 'mask_default', name: 'Standard Mask', rarity: 'common' },
  { id: 'mask_oni', name: 'Oni Demon', rarity: 'rare' },
  { id: 'mask_dragon', name: 'Dragon', rarity: 'epic' },
];

// ==================== RARITY COLORS ====================
export const RARITY_COLORS = {
  common: { bg: '#4a4a4a', text: '#fff', glow: 'rgba(255,255,255,0.2)' },
  rare: { bg: '#1E88E5', text: '#fff', glow: 'rgba(30,136,229,0.4)' },
  epic: { bg: '#8E24AA', text: '#fff', glow: 'rgba(142,36,170,0.4)' },
  legendary: { bg: '#FF6F00', text: '#fff', glow: 'rgba(255,111,0,0.5)' },
};

// ==================== KILL SWITCH ====================
export const KILL_SWITCH_PHRASE = 'ghanemexit';
