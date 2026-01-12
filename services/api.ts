
import type { User, Action, MapPin, SchoolStats } from '../types';
import { ActionType } from '../types';
import { SRT_RATES, LEVEL_THRESHOLDS, INITIAL_PINS } from '../constants';

// Get base URL (always ensure no trailing slash or /api)
const BASE_DOMAIN = (import.meta.env?.VITE_API_URL || 'http://localhost:3000').replace(/\/api\/?$/, '').replace(/\/$/, '');

// Helper to construct clean /api paths
const getFullUrl = (endpoint: string) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const finalPath = cleanEndpoint.startsWith('/api/') || cleanEndpoint === '/api'
    ? cleanEndpoint
    : `/api${cleanEndpoint}`;
  return `${BASE_DOMAIN}${finalPath}`;
};

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
    const res = await fetch(getFullUrl(endpoint), { headers: getHeaders() });
    return res.json();
  },
  async post(endpoint: string, data: any) {
    const res = await fetch(getFullUrl(endpoint), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  }
};

export const loginUser = async (identifier: string, password: string): Promise<User | null> => {
  try {
    const response = await fetch(getFullUrl('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
      signal: AbortSignal.timeout(10000)
    });

    const data = await response.json();
    if (!response.ok) {
      let errorMsg = data.error || 'Login failed';
      if (errorMsg === 'Account not registered. Please register first.') errorMsg = 'รหัสนักเรียนนี้ยังไม่ได้ลงทะเบียน กรุณาลงทะเบียนก่อนใช้งาน';
      if (errorMsg === 'Invalid credentials.') errorMsg = 'รหัสผ่านหรือข้อมูลไม่ถูกต้อง กรุณาลองใหม่';
      throw new Error(errorMsg);
    }

    localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
    return data.user;
  } catch (e: any) {
    const isNetworkError = e.name === 'AbortError' ||
      e.message.toLowerCase().includes('fetch') ||
      e.message.toLowerCase().includes('network') ||
      e.message.toLowerCase().includes('failed to connect') ||
      e.message.toLowerCase().includes('load resource');

    if (isNetworkError) {
      const isAdmin = identifier.startsWith('ADMIN-');
      const user: User = {
        id: crypto.randomUUID(),
        name: isAdmin ? 'Admin : โรงเรียนสุรศักดิ์มนตรี' : `นักเรียน ${identifier}`,
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
    throw e;
  }
};

export const registerStudent = async (data: any): Promise<User> => {
  const response = await fetch(getFullUrl('/auth/register/student'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(10000)
  });
  const result = await response.json();
  if (!response.ok) {
    let errorMsg = result.error || 'Registration failed';
    if (errorMsg === 'Identity Conflict: This ID is already registered.') errorMsg = 'รหัสนักเรียนนี้ได้ลงทะเบียนไปแล้ว';
    if (errorMsg === 'Phone number or Student ID already in use.') errorMsg = 'เบอร์โทรศัพท์หรือรหัสนักเรียนนี้ถูกใช้งานแล้ว';
    throw new Error(errorMsg);
  }
  return result.user;
};

export const registerStaff = async (data: any): Promise<void> => {
  const response = await fetch(getFullUrl('/auth/register/staff'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(10000)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Registration failed');
};

export const verifyStudentId = async (studentId: string) => {
  const response = await fetch(getFullUrl('/auth/verify-student'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId }),
    signal: AbortSignal.timeout(10000)
  });
  return await response.json();
};

export const getFeed = async (): Promise<Action[]> => {
  try {
    const res = await fetch(getFullUrl('/actions'), { headers: getHeaders() });
    return await res.json();
  } catch { return []; }
};

export const submitAction = async (data: any): Promise<Action> => {
  const res = await fetch(getFullUrl('/actions'), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return await res.json();
};

export const getPins = async (): Promise<MapPin[]> => {
  try {
    const res = await fetch(getFullUrl('/pins'), { headers: getHeaders() });
    return await res.json();
  } catch { return INITIAL_PINS; }
};

export const deployNode = async (pinData: any) => {
  const res = await fetch(getFullUrl('/pins'), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(pinData)
  });
  return await res.json();
};

export const getProfile = (): User | null => {
  const data = localStorage.getItem(STORAGE_KEY_USER);
  if (!data) return null;
  try {
    const user = JSON.parse(data);
    if (!user.history) user.history = [];
    if (!user.badges) user.badges = [];
    if (user.totalSRT === undefined) user.totalSRT = user.points || 0;
    return user;
  } catch {
    return null;
  }
};

export const getProfileFromServer = async (): Promise<User | null> => {
  try {
    const res = await fetch(getFullUrl('/auth/me'), { headers: getHeaders() });
    if (!res.ok) return null;
    const user = await res.json();
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    return user;
  } catch {
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_USER);
};

export const initializeDemoData = () => {
  console.log("Saveรักษ์ : Smart Sustainable Mindset (SSM) v2.0 Online.");
  console.log("ยินดีต้อนรับสู่ระบบบริหารจัดการสิ่งแวดล้อม โรงเรียนสุรศักดิ์มนตรี");
};

export const analyzeImage = async (imageBase64: string): Promise<any> => {
  const res = await fetch(getFullUrl('/actions/analyze'), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ image: imageBase64 })
  });
  if (!res.ok) throw new Error('Analysis failed');
  return await res.json();
};

export const logActivity = async (type: ActionType, details: any) => {
  return await submitAction({
    type,
    imageBase64: details.fileBase64,
    description: details.label || 'Activity recorded',
    srtOverride: details.points
  });
};

export const getSchoolStats = async (): Promise<SchoolStats> => {
  try {
    const res = await fetch(getFullUrl('/stats'), { headers: getHeaders() });
    return await res.json();
  } catch {
    return { totalStudents: 1240, totalPoints: 85400, pendingReports: 3, carbonSaved: 42.5 };
  }
};

export const getLeaderboard = async (): Promise<User[]> => {
  try {
    const res = await fetch(getFullUrl('/leaderboard'), { headers: getHeaders() });
    return await res.json();
  } catch { return []; }
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

export const calculateRank = (totalSRT: number): number => {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalSRT >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
};

export const testLinePush = async (): Promise<boolean> => {
  try {
    const res = await fetch(getFullUrl('/admin/test-line'), {
      method: 'POST',
      headers: getHeaders()
    });
    return res.ok;
  } catch {
    return false;
  }
};