
export type UserRole = 'STUDENT' | 'STAFF' | 'ADMIN';

export interface Badge {
  id: string;
  name: string;
  trigger: string;
  icon: string;
}

export enum ActionType {
  RECYCLE = 'recycling',
  WASTE_SORTING = 'waste_sorting',
  TREE_PLANTING = 'tree_planting',
  ENERGY_SAVING = 'energy_saving',
  WATER_CONSERVATION = 'water_conservation',
  CLEANUP = 'cleanup',
  OTHER = 'other',
  // Keep legacy for compatibility if needed, but point to valid backend types
  GREASE_TRAP = 'waste_sorting',
  HAZARD_SCAN = 'cleanup',
  UTILITY = 'energy_saving',
  NODE_CREATE = 'other',
  NODE_RESOLVE = 'other',
  COMMUTE = 'other',
  GREEN_POINT = 'other',
  REPORT = 'other'
}

export interface Action {
  id: string;
  userId: string;
  userName: string;
  type: ActionType;
  srtEarned: number;
  imageUrl?: string;
  description: string;
  timestamp: number;
  status: 'approved' | 'rejected' | 'pending';
  aiAnalysis?: string;
  imageHash?: string;
  fraudScore?: number;
  isFraud?: boolean;
  rejectReason?: string;
}

export interface User {
  id: string;
  name: string;
  schoolId: string;
  role: UserRole;
  totalSRT: number;
  currentMonthSRT: number;
  badges: string[];
  history: Action[];
  consentGiven: boolean;
  lastActionTime?: number;
  classRoom?: string;
  isBanned?: boolean;
  // Compatibility fields
  points: number;
  xp: number;
  level: number;
}

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  type: 'FULL_BIN' | 'HAZARD' | 'MAINTENANCE';
  description: string;
  status: 'OPEN' | 'RESOLVED';
  reportedBy: string;
  timestamp: number;
}

export interface ScanResult {
  category: string;
  label: string;
  points: number;
  analysis?: string;
  bin_color?: string;
  upcycling_tip?: string;
  maintenance_status?: string;
  risk_level?: string;
  units?: number;
  month?: string;
  isValid: boolean;
  isFraud: boolean;
  confidence: number;
  reason: string;
}

export interface SchoolStats {
  totalStudents: number;
  totalPoints: number;
  pendingReports: number;
  carbonSaved: number;
}

export interface Reward {
  id: string;
  title: string;
  cost: number;
  icon: string;
  description: string;
}
