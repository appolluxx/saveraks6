
import { Badge, ActionType, MapPin, User } from './types';

export const SRT_RATES: Record<string, number> = {
  [ActionType.RECYCLE]: 50,
  [ActionType.GREASE_TRAP]: 100,
  [ActionType.HAZARD_SCAN]: 150,
  [ActionType.UTILITY]: 75,
  [ActionType.NODE_CREATE]: 25,
  [ActionType.NODE_RESOLVE]: 50,
  [ActionType.COMMUTE]: 15,
  // Fix: Removed non-existent ActionType.ENERGY_POINT
  [ActionType.GREEN_POINT]: 50,
  [ActionType.REPORT]: 30
};

// Added Level Thresholds for XP calculation
export const LEVEL_THRESHOLDS = [0, 500, 1500, 3500, 7000, 12000, 20000, 35000, 60000];

export const BADGES: Record<string, Badge> = {
  firstAction: { id: 'firstAction', name: "Initiate", trigger: "Complete 1st action", icon: "🚀" },
  streak7: { id: 'streak7', name: "Consistent", trigger: "7-day streak", icon: "🔥" },
  greenSorter: { id: 'greenSorter', name: "Green Sorter", trigger: "50 recycle actions", icon: "♻️" },
  guardian: { id: 'guardian', name: "Guardian", trigger: "Reach Rank 5", icon: "🛡️" },
  mvp: { id: 'mvp', name: "MVP", trigger: "Top 3 monthly SRT", icon: "🏆" }
};

// Fix: Updated MapPin property names from x/y to lat/lng and added required timestamp
export const INITIAL_PINS: MapPin[] = [
  { id: 'p1', lat: 25, lng: 35, type: 'FULL_BIN', description: 'Overflowing bin near Cafeteria.', status: 'OPEN', reportedBy: '1001', timestamp: Date.now() },
  { id: 'p2', lat: 65, lng: 75, type: 'HAZARD', description: 'Leaking water pipe near Building 3.', status: 'OPEN', reportedBy: '1002', timestamp: Date.now() },
  { id: 'p3', lat: 45, lng: 15, type: 'MAINTENANCE', description: 'Broken solar panel on the roof.', status: 'RESOLVED', reportedBy: '1003', timestamp: Date.now() }
];

// Mock Leaderboard for display purposes
export const MOCK_LEADERBOARD: User[] = [];

export const REWARDS = [
  { id: 'r1', title: 'Operational Pass', cost: 500, icon: '🎫', description: 'System-wide late arrival clearance (15m).' },
  { id: 'r2', title: 'Bio-Resource', cost: 150, icon: '🍎', description: 'Raw organic sustenance unit from campus.' },
  { id: 'r3', title: 'Virtual Sensor', cost: 300, icon: '🥽', description: 'Extended VR Node access for 30m.' },
  { id: 'r4', title: 'Elite Status', cost: 1000, icon: '🎖️', description: 'Permanent identity upgrade + NFT certificate.' },
];
