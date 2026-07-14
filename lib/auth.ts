// Authentication helpers using Supabase



export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  branchId: string | null;
  phone: string | null;
  address: string | null;
  position: string | null;
  pin: string | null;
}

// Login functions have been moved to @/lib/actions/auth.ts to run on the server


export function saveUserSession(user: User) {
  const sessionData = {
    ...user,
    loginTime: new Date().toISOString(),
  };
  
  localStorage.setItem('user', JSON.stringify(sessionData));
}

export function getUserSession(): User | null {
  if (typeof window === 'undefined') return null;
  
  const sessionData = localStorage.getItem('user');
  if (!sessionData) return null;
  
  try {
    return JSON.parse(sessionData);
  } catch {
    return null;
  }
}

export function clearUserSession() {
  localStorage.removeItem('user');
}

export function isAuthenticated(): boolean {
  return getUserSession() !== null;
}
