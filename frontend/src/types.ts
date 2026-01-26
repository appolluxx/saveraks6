
export type UserRole = 'STUDENT' | 'STAFF' | 'ADMIN';

export interface Badge {
    id: string;
    name: string;
    trigger: string;
    icon: string;
}

export enum ActionType {
    RECYCLE = 'recycling',           // แยกขยะ
    ZERO_WASTE = 'zero_waste',       // ถุงผ้า/แก้วน้ำ
    ECO_PRODUCT = 'eco_product',     // ผลิตภัณฑ์เป็นมิตร
    WALK = 'walk',                   // เดิน
    BICYCLE = 'bicycle',             // ปั่นจักรยาน
    PUBLIC_TRANSPORT = 'commute',    // รถสาธารณะ
    TREE_PLANTING = 'tree_planting', // ปลูกต้นไม้
    ENERGY_SAVING = 'energy_saving', // ปิดไฟ/พัดลม/แอร์
    REPORT = 'report',               // รายงานจุดขยะ
    // Legacy/Internal
    WASTE_SORTING = 'waste_sorting',
    CLEANUP = 'cleanup',
    OTHER = 'other',

    // New Vision Modes
    GREASE_TRAP = 'grease_trap',
    HAZARD_SCAN = 'hazard_scan',
    UTILITY = 'utility_check'
}

export interface ScanResult {
    label: string;
    confidence: number;
    bin_name?: string;
    bin_color?: string;
    upcycling_tip?: string;
    items?: any[];
    summary?: string;
    summaryThai?: string;
    isFraud?: boolean;
    reason?: string;
    category?: string; // Added for EcoScanner compatibility
    points?: number;   // Added for EcoScanner compatibility
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

export interface Reward {
    id: string;
    title: string;
    cost: number;
    icon: string;
    description: string;
}

export interface SchoolStats {
    totalStudents: number;
    totalPoints: number;
    pendingReports: number;
    carbonSaved: number;
}
