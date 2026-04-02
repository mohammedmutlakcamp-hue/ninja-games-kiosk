// ==================== TOURNAMENTS ====================
export type TournamentStatus = 'upcoming' | 'registration' | 'active' | 'completed' | 'cancelled';
export type TournamentFormat = '1v1' | '2v2' | 'ffa' | 'bracket';

export interface Tournament {
  id: string;
  name: string;
  game: string;
  description: string;
  format: TournamentFormat;
  
  entryFee: number;
  maxPlayers: number;
  minPlayers: number;
  
  prizePool: number;
  prizeDistribution: PrizeSlot[];
  adminProfit: number;
  
  registrationStart: number;
  registrationEnd: number;
  startTime: number;
  endTime: number | null;
  
  status: TournamentStatus;
  participants: TournamentParticipant[];
  brackets: TournamentBracket[];
  results: TournamentResult[];
  
  rules: string;
  termsAndConditions: string;
  
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface PrizeSlot {
  position: number;
  percentage: number;
  coins: number;
}

export interface TournamentParticipant {
  playerId: string;
  playerName: string;
  registeredAt: number;
  paid: boolean;
  seed: number | null;
  eliminated: boolean;
}

export interface TournamentBracket {
  round: number;
  matchIndex: number;
  player1: string | null;
  player2: string | null;
  winner: string | null;
  score1: number;
  score2: number;
  status: 'pending' | 'active' | 'completed';
}

export interface TournamentResult {
  playerId: string;
  playerName: string;
  position: number;
  prizeClaimed: number;
}

// ==================== MINI-GAMES ====================
export type MiniGameId = 
  | 'ninja-royale'
  | 'drift-kings'
  | 'slash-survival'
  | 'aim-trainer'
  | 'ninja-runner';

export interface MiniGame {
  id: MiniGameId;
  name: string;
  description: string;
  icon: string;
  color: string;
  instructions: string;
  scoreUnit: string;
  higherIsBetter: boolean;
}

export interface MiniGameScore {
  id: string;
  gameId: MiniGameId;
  playerId: string;
  playerName: string;
  score: number;
  timestamp: number;
  weekId: string;
}

export interface WeeklyChallenge {
  id: string;
  weekId: string;
  gameId: MiniGameId;
  startDate: number;
  endDate: number;
  entryFee: number;
  prizePool: number;
  prizeDistribution: PrizeSlot[];
  participants: string[];
  status: 'active' | 'completed';
  winners: { playerId: string; playerName: string; position: number; prize: number }[];
}
