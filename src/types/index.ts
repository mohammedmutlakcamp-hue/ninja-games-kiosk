// ==================== PLAYER ====================
export interface Player {
  uid: string;
  username: string;
  phone: string;
  pin: string; // 4-digit hashed
  coins: number;
  totalCoinsSpent: number;
  totalPlaytime: number; // minutes
  character: PlayerCharacter;
  inventory: InventoryItem[];
  titles: string[];
  activeTitle: string;
  stats: PlayerStats;
  linkedAccounts?: LinkedAccounts;
  lastStatSync?: number;
  createdAt: number;
  lastLogin: number;
  banned: boolean;
}

export interface LinkedAccounts {
  steam?: { steamId: string; username: string };
  riot?: { gameName: string; tagLine: string };       // Valorant + LoL
  epic?: { username: string };                         // Fortnite
}

export interface PlayerCharacter {
  skinColor: string;
  outfitId: string;
  maskId: string;
  accessoryId: string;
  equippedSkins: string[];
}

export interface PlayerStats {
  totalKills: number;
  totalDeaths: number;
  totalHeadshots: number;
  totalWins: number;
  gamesPlayed: number;
  chestsOpened: number;
  foodOrdered: number;
  longestStreak: number;
  favoriteGame: string;
  gameStats: Record<string, GameStats>;
}

export interface GameStats {
  hoursPlayed: number;
  kills: number;
  deaths: number;
  headshots: number;
  wins: number;
  lastPlayed: number;
}

// ==================== PC / KIOSK ====================
export type PCStatus = 'free' | 'occupied' | 'reserved' | 'locked' | 'offline' | 'maintenance';

export interface PC {
  id: string;
  name: string; // "PC-01", "PC-02", etc.
  hostname: string;
  status: PCStatus;
  currentPlayer: string | null; // player uid
  currentPlayerName: string | null;
  sessionStart: number | null;
  coinsRemaining: number | null;
  minutesRemaining: number | null;
  reservedBy: string | null;
  reservedAt: number | null;
  reservationExpires: number | null;
  specs: string;
  ipAddress: string;
  lastHeartbeat: number;
  games: InstalledGame[];
  lockdownActive: boolean;
  macAddress: string;
}

export interface InstalledGame {
  id: string;
  name: string;
  exePath: string;
  coverImage: string;
  genre: string;
  players: string;
  rating: number;
  supportsStats: boolean;
  statsApi: 'steam' | 'valorant' | 'fortnite' | 'pubg' | 'apex' | 'r6' | 'manual' | 'none';
}

// ==================== GAMES CATALOG ====================
export interface GameCatalog {
  id: string;
  name: string;
  coverImage: string;
  bannerImage?: string;
  genre: string;
  players: string;
  rating: number;
  description: string;
  supportsStats: boolean;
  statsApi: string;
  defaultExePath: string;
}

// ==================== COINS ====================
export interface CoinPackage {
  id: string;
  coins: number;
  price: number; // in local currency
  label: string;
  popular?: boolean;
}

export interface CoinTransaction {
  id: string;
  playerId: string;
  type: 'purchase' | 'spend' | 'reward' | 'refund' | 'admin';
  amount: number;
  description: string;
  timestamp: number;
  adminId?: string;
}

// ==================== CHESTS ====================
export type ChestTier = 'bronze' | 'silver' | 'gold' | 'legendary';

export interface Chest {
  id: string;
  tier: ChestTier;
  name: string;
  cost: number; // coins
  color: string;
  glowColor: string;
  rewards: ChestReward[];
}

export interface ChestReward {
  id: string;
  type: 'skin' | 'coins' | 'voucher' | 'title' | 'xp_boost';
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  value?: number; // coins amount or discount %
  skinId?: string;
  icon: string;
  dropRate: number; // 0-1
}

export interface InventoryItem {
  id: string;
  type: ChestReward['type'];
  name: string;
  rarity: string;
  value?: number;
  obtainedAt: number;
  skinId?: string;
  used: boolean;
}

// ==================== FOOD & DRINKS ====================
export interface MenuItem {
  id: string;
  name: string;
  category: 'drinks' | 'snacks' | 'food';
  price: number; // coins
  image: string;
  description: string;
  available: boolean;
  preparationTime: number; // minutes
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface FoodOrder {
  id: string;
  playerId: string;
  playerName: string;
  pcId: string;
  items: OrderItem[];
  totalCoins: number;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
}

// ==================== SESSIONS ====================
export interface PlaySession {
  id: string;
  playerId: string;
  playerName: string;
  pcId: string;
  startTime: number;
  endTime: number | null;
  coinsUsed: number;
  gamesPlayed: string[];
  matchResults: MatchResult[];
}

export interface MatchResult {
  gameId: string;
  gameName: string;
  kills: number;
  deaths: number;
  headshots: number;
  won: boolean;
  timestamp: number;
}

// ==================== RESERVATION ====================
export interface Reservation {
  id: string;
  playerId: string;
  playerName: string;
  pcId: string;
  createdAt: number;
  expiresAt: number;
  status: 'active' | 'fulfilled' | 'expired' | 'cancelled';
  coinsCharged: number;
}

// ==================== LEADERBOARD ====================
export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  character: PlayerCharacter;
  title: string;
  value: number;
}

export type LeaderboardType = 'playtime' | 'headshots' | 'kills' | 'wins' | 'coins_spent' | 'chests_opened';
export type LeaderboardPeriod = 'weekly' | 'monthly' | 'alltime';

// ==================== ADMIN ====================
export interface Admin {
  uid: string;
  email: string;
  name: string;
  role: 'owner' | 'manager' | 'staff';
  createdAt: number;
}

export interface DailyRevenue {
  date: string;
  coinsSold: number;
  coinsRevenue: number;
  foodRevenue: number;
  totalRevenue: number;
  activePlayers: number;
  totalHoursPlayed: number;
}

// ==================== KIOSK COMMANDS ====================
export type KioskCommand = 'lock' | 'unlock' | 'restart' | 'shutdown' | 'message' | 'wake' | 'lockdown' | 'fullaccess' | 'send-wol';

export interface KioskCommandMsg {
  id: string;
  pcId: string;
  command: KioskCommand;
  data?: string;
  timestamp: number;
  executed: boolean;
}
