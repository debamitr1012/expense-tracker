import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import { CATEGORIES } from '../api/constants'
import StatCards from '../components/StatCards'
import ExpenseForm from '../components/ExpenseForm'
import Analytics from '../components/Analytics'
import ExpenseTable from '../components/ExpenseTable'
import ThemeToggle from '../components/ThemeToggle'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function getCurrentMonth() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function formatMonthLabel(yearMonth) {
  if (!yearMonth) return ''
  const [year, month] = yearMonth.split('-')
  const monthIdx = parseInt(month, 10) - 1
  return `${MONTH_NAMES[monthIdx]} ${year}`
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState(null)
  const [categories, setCategories] = useState(CATEGORIES)
  const [loading, setLoading] = useState(true)
  const [editingExpense, setEditingExpense] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [showAllTime, setShowAllTime] = useState(false)

  const loadAll = useCallback(async () => {
    try {
      const [exp, sum] = await Promise.all([
        api.get('/expenses'),
        api.get(`/expenses/summary?month=${selectedMonth}`)
      ])
      setExpenses(exp.data)
      setSummary(sum.data)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedMonth])

  useEffect(() => { loadAll() }, [loadAll])

  const handleSave = async (payload, expenseId) => {
    if (expenseId) {
      await api.put(`/expenses/${expenseId}`, payload)
    } else {
      await api.post('/expenses', payload)
    }
    setEditingExpense(null)
    await loadAll()
  }

  const handleDelete = async (id) => {
    await api.delete(`/expenses/${id}`)
    await loadAll()
  }

  const handleEdit = (expense) => {
    setEditingExpense(expense)
  }

  const handleCancelEdit = () => {
    setEditingExpense(null)
  }

  const handleAddCategory = (name) => {
    setCategories((prev) => (prev.includes(name) ? prev : [...prev, name]))
  }

  const changeMonth = (offset) => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const d = new Date(year, month - 1 + offset, 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    setSelectedMonth(`${y}-${m}`)
  }

  const monthOptions = useMemo(() => {
    const set = new Set([getCurrentMonth()])
    expenses.forEach((e) => {
      if (e?.date) set.add(e.date.slice(0, 7))
    })
    if (selectedMonth) set.add(selectedMonth)
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [expenses, selectedMonth])

  const filteredExpenses = useMemo(() => {
    if (showAllTime) return expenses
    return expenses.filter((e) => e?.date && e.date.startsWith(selectedMonth))
  }, [expenses, selectedMonth, showAllTime])

  const initial = user?.name?.charAt(0).toUpperCase() || '?'
  const monthLabel = formatMonthLabel(selectedMonth)

  return (
    <>
      <div className="topbar">
        <div className="brand">💰 <span>ExpenseFlow</span></div>
        <div className="userbox">
          <ThemeToggle />
          <Link className="btn btn-sm" to="/monthly">Monthly report</Link>
          <div className="avatar">{initial}</div>
          <span>{user?.name}</span>
          <button className="logout" onClick={logout}>Log out</button>
        </div>
      </div>

      <div className="container">
        {/* Month Selector Bar */}
        <div className="panel" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
              📅 {monthLabel}
            </h2>
            {selectedMonth === getCurrentMonth() && (
              <span className="cat-pill" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', fontWeight: 600 }}>
                Current Month
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-sm"
              style={{ background: 'var(--surface-hover)', color: 'var(--text)', border: '1px solid var(--border)' }}
              onClick={() => changeMonth(-1)}
            >
              ← Prev
            </button>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.88rem' }}
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)} {m === getCurrentMonth() ? ' (Current)' : ''}
                </option>
              ))}
            </select>
            <button
              className="btn btn-sm"
              style={{ background: 'var(--surface-hover)', color: 'var(--text)', border: '1px solid var(--border)' }}
              onClick={() => changeMonth(1)}
            >
              Next →
            </button>
            {selectedMonth !== getCurrentMonth() && (
              <button className="btn btn-sm" onClick={() => setSelectedMonth(getCurrentMonth())}>
                Current Month
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '3rem' }}>Loading...</p>
        ) : (
          <>
            <StatCards summary={summary} selectedMonthLabel={monthLabel} />
            <ExpenseForm
              categories={categories}
              selectedExpense={editingExpense}
              onSave={handleSave}
              onAddCategory={handleAddCategory}
              onCancel={handleCancelEdit}
            />
            <Analytics summary={summary} selectedMonthLabel={monthLabel} />
            <ExpenseTable
              expenses={filteredExpenses}
              categories={categories}
              onEdit={handleEdit}
              onDelete={handleDelete}
              selectedMonthLabel={monthLabel}
              showAllTime={showAllTime}
              onToggleAllTime={() => setShowAllTime((prev) => !prev)}
            />
          </>
        )}
      </div>
    </>
  )
}
