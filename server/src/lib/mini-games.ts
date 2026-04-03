import { MiniGame, MiniGameId } from '@/types/tournament';

export const MINI_GAMES: MiniGame[] = [
  {
    id: 'ninja-royale',
    name: 'Ninja Royale',
    description: 'Top-down battle royale vs 15 AI bots. Last ninja standing wins!',
    icon: 'Swords',
    color: '#FF4444',
    instructions: 'WASD to move, mouse to aim, click to attack. Shrinking zone!',
    scoreUnit: 'points',
    higherIsBetter: true,
  },
  {
    id: 'drift-kings',
    name: 'Drift Kings',
    description: 'Top-down neon drift racing. Master the drift to win!',
    icon: 'Car',
    color: '#00FFFF',
    instructions: 'Arrow keys: UP=gas, DOWN=brake, LEFT/RIGHT=steer. Drift for style!',
    scoreUnit: 'ms',
    higherIsBetter: false,
  },
  {
    id: 'slash-survival',
    name: 'Slash Survival',
    description: 'Hack & slash arena survival with combo multipliers!',
    icon: 'Sword',
    color: '#FF6B35',
    instructions: 'WASD to move, click to slash. Build combos. Survive waves!',
    scoreUnit: 'points',
    higherIsBetter: true,
  },
  {
    id: 'aim-trainer',
    name: 'Aim Trainer',
    description: 'Precision aim training — sharpen your FPS skills!',
    icon: 'Target',
    color: '#F39C12',
    instructions: 'Click targets before they shrink. Build streaks for multipliers!',
    scoreUnit: 'points',
    higherIsBetter: true,
  },
  {
    id: 'ninja-runner',
    name: 'Ninja Runner',
    description: 'Endless side-scrolling runner. How far can you go?',
    icon: 'Zap',
    color: '#39FF14',
    instructions: 'SPACE=jump, DOWN=slide, SHIFT=dash. Double jump & wall jump!',
    scoreUnit: 'meters',
    higherIsBetter: true,
  },
];

// Weekly prizes for top 3 per game
export const WEEKLY_PRIZES = {
  1: { coins: 1000, label: '1,000 coins' },
  2: { coins: 500, label: '500 coins' },
  3: { coins: 250, label: '250 coins' },
};

// Period runs Friday 12:00 PM to next Friday 12:00 PM (local time)
export function getWeekId(date: Date = new Date()): string {
  // Find the most recent Friday 12:00 PM
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 5=Fri
  const hour = d.getHours();
  
  // Calculate days since last Friday 12PM
  let daysSinceFri = (day + 2) % 7; // days since Friday
  if (daysSinceFri === 0 && hour < 12) {
    daysSinceFri = 7; // Before noon on Friday = still previous period
  }
  
  const periodStart = new Date(d);
  periodStart.setDate(d.getDate() - daysSinceFri);
  periodStart.setHours(12, 0, 0, 0);
  
  // Use the Friday start date as the week ID
  const y = periodStart.getFullYear();
  const m = String(periodStart.getMonth() + 1).padStart(2, '0');
  const dd = String(periodStart.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function getNextResetTime(): Date {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  
  let daysUntilFri = (5 - day + 7) % 7;
  if (daysUntilFri === 0 && hour >= 12) {
    daysUntilFri = 7;
  }
  
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntilFri);
  next.setHours(12, 0, 0, 0);
  return next;
}

export function getTimeUntilReset(): string {
  const now = new Date();
  const reset = getNextResetTime();
  const diff = reset.getTime() - now.getTime();
  
  if (diff <= 0) return 'Resetting...';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function getWeekDateRange(weekId: string): { start: Date; end: Date } {
  const [year, month, day] = weekId.split('-').map(Number);
  const start = new Date(year, month - 1, day, 12, 0, 0);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { start, end };
}
