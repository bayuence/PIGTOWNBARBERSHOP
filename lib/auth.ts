// Authentication helpers using Supabase
import bcrypt from 'bcryptjs';
import { getUserByEmail, supabase } from './supabase';

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

export async function loginWithEmail(credentials: LoginCredentials): Promise<{ user: User | null; error: string | null }> {
  try {
    // Query user from database using Supabase
    const { data, error } = await getUserByEmail(credentials.email);

    if (error || !data) {
      return {
        user: null,
        error: 'Email atau password salah'
      };
    }

    // Check if user is active
    if (data.status !== 'active') {
      return {
        user: null,
        error: 'Akun Anda tidak aktif. Hubungi administrator.'
      };
    }

    // Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(credentials.password, data.password || '');

    if (!isPasswordValid) {
      return {
        user: null,
        error: 'Email atau password salah'
      };
    }

    // Return user data (without password)
    const user: User = {
      id: data.id,
      email: data.email || '',
      name: data.name,
      role: data.role || '',
      status: data.status || 'active',
      branchId: data.branch_id || null,
      phone: data.phone || null,
      address: data.address || null,
      position: data.position || null,
      pin: data.pin || null,
    };

    return {
      user,
      error: null
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      user: null,
      error: 'Terjadi kesalahan saat login. Silakan coba lagi.'
    };
  }
}

export async function loginWithPin(pin: string, branchId?: string): Promise<{ user: User | null; error: string | null }> {
  try {
    // Query user from database using Supabase
    let query = supabase
      .from('users')
      .select('*')
      .eq('pin', pin)
      .eq('status', 'active')

    if (branchId) {
      query = query.eq('branch_id', branchId)
    }

    const { data, error } = await query.single()

    if (error || !data) {
      return {
        user: null,
        error: 'PIN tidak valid'
      };
    }

    const user: User = {
      id: data.id,
      email: data.email || '',
      name: data.name,
      role: data.role || '',
      status: data.status || 'active',
      branchId: data.branch_id || null,
      phone: data.phone || null,
      address: data.address || null,
      position: data.position || null,
      pin: data.pin || null,
    };

    return {
      user,
      error: null
    };
  } catch (error) {
    console.error('PIN login error:', error);
    return {
      user: null,
      error: 'Terjadi kesalahan saat login. Silakan coba lagi.'
    };
  }
}

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
