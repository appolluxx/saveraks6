
import { User, Action, ActionType, MapPin, SchoolStats } from '../types';
import { SRT_RATES, LEVEL_THRESHOLDS, INITIAL_PINS } from '../constants';

// Get base URL (always ensure no trailing slash or /api)
const BASE_DOMAIN = (import.meta.env?.VITE_API_URL || 'http://localhost:3000').replace(/\/api\/?$/, '').replace(/\/$/, '');

// Helper to construct clean /api paths
const getFullUrl = (endpoint: string) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // If endpoint already starts with /api, use it as is, otherwise prefix with /api
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
    if (!password) throw new Error("Password is required.");

    const response = await fetch(getFullUrl('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
      signal: AbortSignal.timeout(10000)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');

    localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
    return data.user;
  } catch (e: any) {
    const isNetworkError = e.name === 'AbortError' ||
      e.message.toLowerCase().includes('fetch') ||
      e.message.toLowerCase().includes('network') ||
      e.message.toLowerCase().includes('failed to connect');

    if (isNetworkError) {
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
    throw e;
  }
};

export const registerStudent = async (data: { studentId: string, phone: string, password: string }): Promise<User> => {
  try {
    const response = await fetch(getFullUrl('/auth/register/student'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(10000)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Student registration failed');
    return result.user;
  } catch (e: any) {
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
  const response = await fetch(getFullUrl('/auth/register/staff'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(10000)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Staff registration failed');
};

export const verifyStudentId = async (studentId: string): Promise<{ success: boolean, student?: any }> => {
  const response = await fetch(getFullUrl('/auth/verify-student'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId }),
    signal: AbortSignal.timeout(10000)
  });
  const result = await response.json();
  return { success: result.success, student: result.student };
};

export const getFeed = async (): Promise<Action[]> => {
  try {
    const res = await fetch(getFullUrl('/actions'), {
      headers: getHeaders(),
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    return [];
  }
};

export const submitAction = async (data: any): Promise<Action> => {
  try {
    const res = await fetch(getFullUrl('/actions'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    return {
      id: crypto.randomUUID(),
      userId: 'local',
      userName: 'Local User',
      type: data.type || ActionType.OTHER,
      srtEarned: data.srtOverride || 10,
      description: data.description || '',
      timestamp: Date.now(),
      status: 'approved'
    };
  }
};

export const getPins = async (): Promise<MapPin[]> => {
  try {
    const res = await fetch(getFullUrl('/pins'), {
      headers: getHeaders(),
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    return INITIAL_PINS;
  }
};

export const getLeaderboard = async (): Promise<User[]> => {
  try {
    const res = await fetch(getFullUrl('/leaderboard'), { headers: getHeaders() });
    return await res.json();
  } catch (e) {
    return [];
  }
};

export const getSchoolStats = async (): Promise<SchoolStats> => {
  try {
    const res = await fetch(getFullUrl('/stats'), { headers: getHeaders() });
    return await res.json();
  } catch (e) {
    return { totalStudents: 1240, totalPoints: 85400, pendingReports: 3, carbonSaved: 42.5 };
  }
};

export const logActivity = async (type: ActionType, details: any) => {
  return await submitAction({
    type,
    imageBase64: details.fileBase64,
    description: details.label || 'Activity recorded',
    srtOverride: details.points
  });
};

export const logout = () => {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_USER);
};

export const getProfile = (): User | null => {
  const userData = localStorage.getItem(STORAGE_KEY_USER);
  if (!userData) return null;
  try {
    const user = JSON.parse(userData);
    if (!user.history) user.history = [];
    return user;
  } catch {
    return null;
  }
};

export const calculateRank = (totalSRT: number): number => {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalSRT >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
};