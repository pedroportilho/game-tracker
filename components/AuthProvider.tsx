'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { AuthModal } from '@/components/AuthModal'

export type AuthUser = {
  id: string
  email: string | null
}

type AuthContextType = {
  user: AuthUser | null
  loading: boolean
  authOpen: boolean
  setAuthOpen: (value: boolean) => void
  login: (email: string, password: string) => Promise<AuthResult>
  register: (email: string, password: string) => Promise<AuthResult>
  logout: () => Promise<void>
  requireAuth: (action: () => void) => void
}

type AuthResult = {
  success: boolean
  message?: string
  needsConfirmation?: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authOpen, setAuthOpen] = useState(false)
  const pendingAction = useRef<(() => void) | null>(null)

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/auth', { method: 'GET', credentials: 'same-origin' })
        if (!res.ok) {
          setUser(null)
          return
        }

        const data = await res.json()
        setUser(data.user ?? null)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    loadSession()
  }, [])

  async function login(email: string, password: string): Promise<AuthResult> {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, mode: 'login' }),
      })

      const data = await res.json()
      if (!res.ok) return { success: false, message: data.error ?? 'Falha ao autenticar.' }
      setUser(data.user ?? null)
      setAuthOpen(false)

      if (pendingAction.current) {
        pendingAction.current()
        pendingAction.current = null
      }

      return { success: true }
    } catch {
      return { success: false, message: 'Erro de rede. Tente novamente.' }
    }
  }

  async function register(email: string, password: string): Promise<AuthResult> {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, mode: 'register' }),
      })
      const data = await res.json()

      if (!res.ok) {
        return { success: false, message: data.error ?? 'Falha ao cadastrar.' }
      }

      if (data.user) {
        setUser(data.user)
        setAuthOpen(false)
        if (pendingAction.current) {
          pendingAction.current()
          pendingAction.current = null
        }
      }

      return {
        success: true,
        message: data.message,
        needsConfirmation: data.needsConfirmation,
      }
    } catch {
      return { success: false, message: 'Erro de rede. Tente novamente.' }
    }
  }

  async function logout() {
    await fetch('/api/auth', {
      method: 'DELETE',
      credentials: 'same-origin',
    })
    setUser(null)
  }

  function requireAuth(action: () => void) {
    if (user) {
      action()
      return
    }

    pendingAction.current = action
    setAuthOpen(true)
  }

  return (
    <AuthContext.Provider value={{ user, loading, authOpen, setAuthOpen, login, register, logout, requireAuth }}>
      {children}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} onLogin={login} onRegister={register} />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
