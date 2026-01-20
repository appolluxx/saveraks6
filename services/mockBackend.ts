
import { ActionType, User, UserRole, MapPin, SchoolStats } from "../types";
import { MOCK_LEADERBOARD, INITIAL_PINS, LEVEL_THRESHOLDS } from "../constants";

const API_URL: string = "https://script.google.com/macros/s/AKfycbxQ3_TNCBnLhSmsBfuiL86yPfxRC6LeWlcLQKOADYhmP72x4bTMQjTD2Mtr5jOzZkN3uw/exec"; 

const apiCall = async (payload: any) => {
  if (!API_URL || API_URL === "") return null;
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    
    // Handle cases where the response is empty, "undefined", or not JSON
    if (!text || text === "undefined" || text.trim() === "") {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      console.warn("API returned invalid JSON:", text);
      return null;
    }
  } catch (error) {
    console.error("API Call Error:", error);
    return null;
  }
};

export const loginUser = async (schoolId: string): Promise<User> => {
  const stored = localStorage.getItem('saveraks_user');
  if (stored && stored !== "undefined") {
    try {
      const user = JSON.parse(stored);
      if (user && user.schoolId === schoolId) return user;
    } catch (e) {
      localStorage.removeItem('saveraks_user');
    }
  }

  const isAdmin = schoolId.toUpperCase().startsWith('ADMIN-');
  let result = await apiCall({ action: 'LOGIN', schoolId });

  if (!result || !result.user) {
    // Fix: Removed hasConsented property as it does not exist on User type
    const mockUser: User = { 
      id: isAdmin ? 'admin-id' : 'mock-id', 
      name: isAdmin ? 'School Administrator' : 'Demo Student', 
      points: isAdmin ? 99999 : 100,
      totalSRT: isAdmin ? 99999 : 100,
      currentMonthSRT: 0,
      schoolId,
      role: isAdmin ? 'ADMIN' : 'STUDENT',
      level: isAdmin ? 8 : 1,
      xp: isAdmin ? 99999 : 100,
      classRoom: 'M.4/1',
      badges: [],
      consentGiven: true,
      history: []
    };
    localStorage.setItem('saveraks_user', JSON.stringify(mockUser));
    return mockUser;
  }
  localStorage.setItem('saveraks_user', JSON.stringify(result.user));
  return result.user;
};

export const registerUser = async (name: string, schoolId: string): Promise<User> => {
  const isAdmin = schoolId.toUpperCase().startsWith('ADMIN-');
  let result = await apiCall({ action: 'REGISTER', name, schoolId, role: isAdmin ? 'ADMIN' : 'STUDENT' });
  if (!result || !result.user) {
    // Fix: Removed hasConsented property as it does not exist on User type
    const mockUser: User = { 
      id: Math.random().toString(36).substr(2, 9), 
      name, 
      points: 0,
      totalSRT: 0,
      currentMonthSRT: 0,
      schoolId,
      role: isAdmin ? 'ADMIN' : 'STUDENT',
      level: 1,
      xp: 0,
      classRoom: 'M.4/1',
      badges: [],
      consentGiven: true,
      history: []
    };
    localStorage.setItem('saveraks_user', JSON.stringify(mockUser));
    return mockUser;
  }
  localStorage.setItem('saveraks_user', JSON.stringify(result.user));
  return result.user;
};

export const logoutUser = () => localStorage.removeItem('saveraks_user');

export const getUserProfile = async (): Promise<User | null> => {
  const data = localStorage.getItem('saveraks_user');
  if (!data || data === "undefined") return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
};

export const getLeaderboard = async () => (await apiCall({ action: 'GET_LEADERBOARD' })) || MOCK_LEADERBOARD;

export const getSchoolStats = async (): Promise<SchoolStats> => ({
  totalStudents: 1240,
  totalPoints: 85400,
  pendingReports: INITIAL_PINS.filter(p => p.status === 'OPEN').length,
  carbonSaved: 42.5
});

/**
 * Updates both points and XP, and re-calculates level based on thresholds.
 */
export const updateUserPoints = async (amount: number) => {
  const user = await getUserProfile();
  if (user) {
    user.points = (user.points ?? 0) + amount;
    user.totalSRT = (user.totalSRT ?? 0) + amount;
    user.xp = (user.xp ?? 0) + amount;
    
    // Calculate new level based on LEVEL_THRESHOLDS
    let newLevel = 1;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
      if ((user.xp || 0) >= LEVEL_THRESHOLDS[i]) {
        newLevel = i + 1;
      } else {
        break;
      }
    }
    user.level = newLevel;
    
    localStorage.setItem('saveraks_user', JSON.stringify(user));
  }
};

export const logActivity = async (action: ActionType, details: any) => {
  const user = await getUserProfile();
  if (!user) return;

  const payload = {
    action: 'LOG_ACTIVITY',
    timestamp: new Date().toISOString(),
    userId: user.schoolId,
    category: details.category || action,
    label: details.label || 'Activity',
    upcycling_tip: details.upcycling_tip || '',
    risk_level: details.risk_level || '',
    status: details.status || '',
    points: details.points || 10,
    carbon_saved: details.carbon_saved || 0
  };

  await apiCall(payload);
};
