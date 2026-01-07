const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';


export const api = {
  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async get(endpoint: string) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: this.getAuthHeader()
    });
    return response.json();
  },

  getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('accessToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
};

export const verifyStudentId = async (studentId: string): Promise<{ success: boolean, student?: any }> => {
  const fullUrl = `${API_BASE}/api/auth/verify-student`;
  console.log("VERIFY URL:", fullUrl);
  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId }),
    signal: AbortSignal.timeout(10000)
  });
  const result = await response.json();
  return {
    success: result.success,
    student: result.student
  };
};

export const registerStudent = async (data: { studentId: string, phone: string, password: string }): Promise<any> => {
  const response = await fetch(`${API_BASE}/api/auth/register/student`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(10000)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Student registration failed');
  return result.user;
};

export const loginUser = async (identifier: string, password: string): Promise<any> => {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
    signal: AbortSignal.timeout(10000)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Login failed');

  // Store token in localStorage for future requests
  if (result.token) {
    localStorage.setItem('accessToken', result.token);
  }

  return result.user;
};
