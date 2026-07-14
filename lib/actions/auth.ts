"use server";

import bcrypt from 'bcryptjs';
import { getUserByEmail, supabase } from '../supabase';
import { LoginCredentials, User } from '../auth';

export async function loginWithEmailAction(credentials: LoginCredentials): Promise<{ user: User | null; error: string | null }> {
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
    let isPasswordValid = false;
    if (data.password && (data.password.startsWith('$2a$') || data.password.startsWith('$2b$'))) {
      isPasswordValid = await bcrypt.compare(credentials.password, data.password);
    } else {
      isPasswordValid = credentials.password === data.password;
    }

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

export async function loginWithPinAction(pin: string, branchId?: string): Promise<{ user: User | null; error: string | null }> {
  try {
    // Query user from database using Supabase
    let query = supabase
      .from('users')
      .select('*')
      .eq('pin', pin)
      .eq('status', 'active');

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query.single();

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
