
import { Badge, ActionType, MapPin, User, Reward } from './types';

export const SRT_RATES: Record<string, number> = {
  [ActionType.RECYCLE]: 10,       // แยกขยะ
  [ActionType.ZERO_WASTE]: 8,     // ถุงผ้า/แก้วน้ำ
  [ActionType.ECO_PRODUCT]: 5,    // ผลิตภัณฑ์เป็นมิตร
  [ActionType.WALK]: 10,          // เดิน
  [ActionType.BICYCLE]: 8,        // ปั่นจักรยาน
  [ActionType.PUBLIC_TRANSPORT]: 5, // รถสาธารณะ
  [ActionType.TREE_PLANTING]: 10, // ปลูกต้นไม้
  [ActionType.ENERGY_SAVING]: 5,  // ปิดไฟ/พัดลม/แอร์
  [ActionType.REPORT]: 5          // รายงานจุดขยะ
};

export const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 2000, 5000, 10000];

export const BADGES: Record<string, Badge> = {
  firstAction: { id: 'firstAction', name: "Eco Initiate", trigger: "เริ่มภารกิจรักษ์โลกครั้งแรก", icon: "🌱" },
  streak7: { id: 'streak7', name: "Consistency Hero", trigger: "ทำกิจกรรมต่อเนื่อง 7 วัน", icon: "🔥" },
  greenGuardian: { id: 'greenGuardian', name: "Green Guardian", trigger: "ปลูกต้นไม้ครบ 5 ต้น", icon: "🌳" },
  masterSorter: { id: 'masterSorter', name: "Master Sorter", trigger: "แยกขยะครบ 50 ครั้ง", icon: "♻️" },
  energySaver: { id: 'energySaver', name: "Watts Down", trigger: "ประหยัดพลังงานครบ 20 ครั้ง", icon: "💡" }
};

export const INITIAL_PINS: MapPin[] = [
  { id: 'p1', lat: 13.7760, lng: 100.5550, type: 'FULL_BIN', description: 'ขยะล้นบริเวณหน้าห้องน้ำอาคาร 1', status: 'OPEN', reportedBy: '53580', timestamp: Date.now() },
  { id: 'p2', lat: 13.7765, lng: 100.5555, type: 'HAZARD', description: 'น้ำขังบริเวณสนามฟุตบอล', status: 'OPEN', reportedBy: '53624', timestamp: Date.now() }
];

export const REWARDS: Reward[] = [
  { id: 'r1', title: 'คะแนนพฤติกรรม', cost: 100, icon: '⭐', description: 'เพิ่มคะแนนพฤติกรรม 10 คะแนน' },
  { id: 'r2', title: 'ขนม/ของรางวัลเล็ก', cost: 200, icon: '🍪', description: 'แลกรับขนม ณ ห้องสวัสดิการ' },
  { id: 'r3', title: 'พวงกุญแจ/กล่องจุ่ม', cost: 300, icon: '🎁', description: 'กล่องจุ่มจิ๋วหรือพวงกุญแจรักษ์โลก' },
  { id: 'r4', title: 'เกียรติบัตรนักอนุรักษ์', cost: 500, icon: '📜', description: 'เกียรติบัตรรับรองการเป็น Eco-Guardian' },
  { id: 'r5', title: 'อุปกรณ์การเรียน', cost: 800, icon: '✏️', description: 'ชุดสมุดและปากกาคุณภาพ' },
  { id: 'r6', title: 'แก้วน้ำ/ตุ๊กตา', cost: 1000, icon: '🧸', description: 'แก้วน้ำเก็บความเย็นหรือตุ๊กตาแฮนด์เมด' },
];
