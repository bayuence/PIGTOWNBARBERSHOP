/**
 * ========================================
 * CUSTOM HOOK: useAuth
 * ========================================
 * Manages authentication state and operations
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { type User, type LoginCredentials } from '@/lib/auth'
import { loginWithEmailAction, loginWithPinAction } from '@/lib/actions/auth'

interface UseAuthReturn {
  user: User | null
  loading: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<boolean>
  loginPin: (pin: string, branchId?: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Load user from localStorage on mount
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (err) {
        console.error('Failed to parse user data:', err)
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  // Login with email/password
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const { user: userData, error: loginError } = await loginWithEmailAction(credentials)

      if (loginError || !userData) {
        setError(loginError || 'Login failed')
        return false
      }

      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Login with PIN
  const loginPin = useCallback(async (pin: string, branchId?: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const { user: userData, error: loginError } = await loginWithPinAction(pin, branchId)

      if (loginError || !userData) {
        setError(loginError || 'Login failed')
        return false
      }

      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem('user')
    setUser(null)
    setError(null)
    router.push('/login')
  }, [router])

  return {
    user,
    loading,
    error,
    login,
    loginPin,
    logout,
    isAuthenticated: !!user,
  }
}
