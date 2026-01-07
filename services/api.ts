import { User, Action, ActionType, MapPin, SchoolStats } from '../types';
import { SRT_RATES, LEVEL_THRESHOLDS, INITIAL_PINS } from '../constants';

const BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:3000';
const API_BASE_URL = BASE.endsWith('/api') ? BASE : `${BASE}/api`;


const STORAGE_KEY_TOKEN = 'saveraks_auth_token';
const STORAGE_KEY_USER = 'saveraks_unit_v2';

const getHeaders = () => {
  const token = localStorage.getItem(STORAGE_KEY_TOKEN) || localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  async get(endpoint: string) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, { headers: getHeaders() });
    return res.json();
  },
  async post(endpoint: string, data: any) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  }
};

export const loginUser = async (identifier: string, password: string): Promise<User | null> => {
  try {
    // Frontend validation: ensure password is provided before sending to backend
    if (!password) {
      throw new Error("Password is required.");
    }

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
      signal: AbortSignal.timeout(10000)
    });

    const data = await response.json();
    if (!response.ok) {
      // If the server responded with an error (401, 403, 400), don't engage Demo Protocol
      throw new Error(data.error || 'Login failed');
    }

    localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
    return data.user;
  } catch (e: any) {
    // Only engage Demo Protocol if it's a network error or timeout
    const isNetworkError = e.name === 'AbortError' ||
      e.message.toLowerCase().includes('fetch') ||
      e.message.toLowerCase().includes('network') ||
      e.message.toLowerCase().includes('failed to connect');

    if (isNetworkError) {
      console.warn("Backend unreachable, engaging Demo Protocol:", e);
      // Fallback logic for demo/offline usage
      const isAdmin = identifier.startsWith('ADMIN-');
      const user: User = {
        id: crypto.randomUUID(),
        name: isAdmin ? 'Admin : โรงเรียนสุรศักดิ์มนตรี' : `นิสิตหน่วย ${identifier}`,
        schoolId: identifier,
        role: isAdmin ? 'ADMIN' : 'STUDENT',
        totalSRT: 150,
        currentMonthSRT: 50,
        badges: ['firstAction'],
        history: [],
        consentGiven: true,
        classRoom: 'M.4/1',
        points: 150,
        xp: 150,
        level: 1,
        isBanned: false
      };
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      return user;
    }

    // Otherwise, rethrow the error (it's a real Auth error)
    throw e;
  }
};

export const registerStudent = async (data: { studentId: string, phone: string, password: string }): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register/student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(10000)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Student registration failed');

    return result.user;
  } catch (e: any) {
    console.warn("Registration API unreachable, creating Local Identity.");
    const user: User = {
      id: crypto.randomUUID(),
      name: `Student ${data.studentId}`,
      schoolId: data.studentId,
      role: 'STUDENT',
      totalSRT: 0,
      currentMonthSRT: 0,
      badges: [],
      history: [],
      consentGiven: true,
      classRoom: 'M.4/1',
      points: 0,
      xp: 0,
      level: 1,
      isBanned: false
    };
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    return user;
  }
};

export const registerStaff = async (data: any): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/auth/register/staff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(5000)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Staff registration failed');
};

export const verifyStudentId = async (studentId: string): Promise<{ success: boolean, student?: any }> => {
  const response = await fetch(`${API_BASE_URL}/auth/verify-student`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId }),
    signal: AbortSignal.timeout(3000)
  });
  const result = await response.json();
  return {
    success: result.success,
    student: result.student
  };
};

export const loginGuest = (): User => {
  const guest: User = {
    id: 'guest-' + crypto.randomUUID(),
    name: 'Guest Unit',
    schoolId: 'GUEST-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
    role: 'STUDENT',
    totalSRT: 0,
    currentMonthSRT: 0,
    badges: [],
    history: [],
    consentGiven: true,
    classRoom: 'VISITOR',
    points: 0,
    xp: 0,
    level: 1,
    isBanned: false
  };
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(guest));
  return guest;
};

export const updateConsent = async (schoolId: string): Promise<boolean> => {
  const data = localStorage.getItem(STORAGE_KEY_USER);
  if (data) {
    const user = JSON.parse(data);
    if (user.schoolId === schoolId) {
      user.consentGiven = true;
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      return true;
    }
  }
  return false;
};

export const getProfile = (): User | null => {
  const userData = localStorage.getItem(STORAGE_KEY_USER);
  if (!userData) return null;
  try {
    const user = JSON.parse(userData);
    // Ensure history is always an array
    if (!user.history) {
      user.history = [];
    }
    return user;
  } catch {
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_USER);
};

export const getFeed = async (): Promise<Action[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/actions`, {
      headers: getHeaders(),
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    return []; // Return empty array to fix "Failed to fetch" UI crash
  }
};

export const submitAction = async (data: any): Promise<Action> => {
  try {
    const res = await fetch(`${API_BASE_URL}/actions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Action rejected');
    }
    return await res.json();
  } catch (e) {
    // Local Simulation
    const mockAction: Action = {
      id: crypto.randomUUID(),
      userId: 'local',
      userName: 'Local Unit',
      type: data.type,
      srtEarned: data.srtOverride || 50,
      description: data.description,
      timestamp: Date.now(),
      status: 'approved'
    };
    return mockAction;
  }
};

export const initializeDemoData = () => {
  console.log("Saveรักษ์ : Smart Sustainable Mindset (SSM) v2.0 Online.");
  console.log("ยินดีต้อนรับสู่ระบบบริหารจัดการสิ่งแวดล้อม โรงเรียนสุรศักดิ์มนตรี");
};

export const calculateRank = (totalSRT: number): number => {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalSRT >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
};

export const getProgressToNextRank = (totalSRT: number) => {
  const currentLevel = calculateRank(totalSRT);
  const currentLevelXP = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  const nextLevelXP = LEVEL_THRESHOLDS[currentLevel] || (currentLevel * 10000);
  const progress = ((totalSRT - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  return {
    currentRank: currentLevel,
    nextRank: currentLevel + 1,
    srtInCurrentRank: totalSRT - currentLevelXP,
    srtNeededForNext: nextLevelXP - totalSRT,
    progressPercent: Math.min(100, Math.max(0, progress))
  };
};

export const getPins = async (): Promise<MapPin[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/pins`, {
      headers: getHeaders(),
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    return INITIAL_PINS; // Use initial pins as fallback
  }
};

export const deployNode = async (pinData: Partial<MapPin>) => {
  try {
    const res = await fetch(`${API_BASE_URL}/pins`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(pinData)
    });
    return await res.json();
  } catch (e) {
    return { success: true };
  }
};

export const getLeaderboard = async (): Promise<User[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/leaderboard`, { headers: getHeaders() });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    return [];
  }
};

export const getSchoolStats = async (): Promise<SchoolStats> => {
  try {
    const res = await fetch(`${API_BASE_URL}/stats`, { headers: getHeaders() });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    return {
      totalStudents: 1240,
      totalPoints: 85400,
      pendingReports: 3,
      carbonSaved: 42.5
    };
  }
};

export const logActivity = async (type: ActionType, details: any) => {
  return await submitAction({
    type,
    imageBase64: details.fileBase64,
    description: details.label || 'Activity recorded',
    srtOverride: details.points,
    imageHash: details.imageHash,
    isFraud: details.isFraud,
    fraudScore: details.confidence,
    rejectReason: details.reason
  });
};

export const testLinePush = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/test-line`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.ok;
  } catch (e) {
    return false;
  }
};