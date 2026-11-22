import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { request } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('clair_token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(token))

  useEffect(() => {
    if (!token) { setLoading(false); return }
    let alive = true
    request('/auth/me', { token })
      .then((profile) => { if (alive) setUser(profile) })
      .catch(() => { if (alive) { localStorage.removeItem('clair_token'); setToken(null); setUser(null) } })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [token])

  const login = useCallback((accessToken, profile) => {
    localStorage.setItem('clair_token', accessToken)
    setToken(accessToken)
    setUser(profile)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('clair_token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, isAuthenticated: Boolean(token && user) }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

