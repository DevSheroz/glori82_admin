import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    authApi.me()
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('token')
        sessionStorage.removeItem('token')
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (user_name, password, remember_me) => {
    const { data } = await authApi.login(user_name, password, remember_me)
    const storage = remember_me ? localStorage : sessionStorage
    storage.setItem('token', data.access_token)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
