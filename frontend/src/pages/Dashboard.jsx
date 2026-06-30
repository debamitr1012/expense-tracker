import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import { CATEGORIES } from '../api/constants'
import StatCards from '../components/StatCards'
import ExpenseForm from '../components/ExpenseForm'
import Analytics from '../components/Analytics'
import ExpenseTable from '../components/ExpenseTable'
import ThemeToggle from '../components/ThemeToggle'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState(null)
  const [categories, setCategories] = useState(CATEGORIES)
  const [loading, setLoading] = useState(true)

  const loadAll = useCallback(async () => {
    const [exp, sum] = await Promise.all([
      api.get('/expenses'),
      api.get('/expenses/summary')
    ])
    setExpenses(exp.data)
    setSummary(sum.data)
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const handleAdd = async (payload) => {
    await api.post('/expenses', payload)
    await loadAll()
  }

  const handleDelete = async (id) => {
    await api.delete(`/expenses/${id}`)
    await loadAll()
  }

  const handleAddCategory = (name) => {
    setCategories((prev) => (prev.includes(name) ? prev : [...prev, name]))
  }

  const initial = user?.name?.charAt(0).toUpperCase() || '?'

  return (
    <>
      <div className="topbar">
        <div className="brand">💰 <span>ExpenseFlow</span></div>
        <div className="userbox">
          <ThemeToggle />
          <div className="avatar">{initial}</div>
          <span>{user?.name}</span>
          <button className="logout" onClick={logout}>Log out</button>
        </div>
      </div>

      <div className="container">
        {loading ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '3rem' }}>Loading...</p>
        ) : (
          <>
            <StatCards summary={summary} />
            <ExpenseForm categories={categories} onAdd={handleAdd} onAddCategory={handleAddCategory} />
            <Analytics summary={summary} />
            <ExpenseTable expenses={expenses} categories={categories} onDelete={handleDelete} />
          </>
        )}
      </div>
    </>
  )
}
