import { useState, useCallback } from 'react'

const STORAGE_KEY = 'app_auth'
const CORRECT_PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD ?? ''

export function useAuth() {
  const [authOpen, setAuthOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const isAuthenticated = (): boolean => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) === CORRECT_PASSWORD
  }

  const requireAuth = useCallback((action: () => void) => {
    if (isAuthenticated()) {
      action()
    } else {
      setPendingAction(() => action)
      setAuthOpen(true)
    }
  }, [])

  const submitPassword = (password: string): boolean => {
    if (password === CORRECT_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, password)
      setAuthOpen(false)
      pendingAction?.()
      setPendingAction(null)
      return true
    }
    return false
  }

  const logout = (): void => localStorage.removeItem(STORAGE_KEY)

  return { authOpen, setAuthOpen, requireAuth, submitPassword, logout }
}