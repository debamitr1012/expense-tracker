import { createContext, useContext, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })

  const persist = (data) => {
    localStorage.setItem('token', data.token)
    const u = { name: data.name, username: data.username }
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
  }

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password })
    persist(data)
  }

  const register = async (name, username, password) => {
    const { data } = await api.post('/auth/register', { name, username, password })
    persist(data)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
