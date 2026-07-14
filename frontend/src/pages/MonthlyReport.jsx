import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { fmt } from '../api/constants'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function formatMonthLabel(yearMonth, showYear = false) {
  const [year, month] = yearMonth.split('-')
  return showYear ? `${MONTH_NAMES[Number(month) - 1]} ${year}` : MONTH_NAMES[Number(month) - 1]
}

export default function MonthlyReport() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/expenses')
        setExpenses(response.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load expenses')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const monthlyTotals = useMemo(() => {
    const totals = {}
    const counts = {}

    for (const expense of expenses) {
      if (!expense?.date) continue
      const key = expense.date.slice(0, 7)
      totals[key] = (totals[key] || 0) + Number(expense.amount)
      counts[key] = (counts[key] || 0) + 1
    }

    return Object.entries(totals)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([yearMonth, total]) => ({
        yearMonth,
        total,
        count: counts[yearMonth] ?? 0,
      }))
  }, [expenses])

  const yearOptions = useMemo(() => {
    const years = Array.from(new Set(monthlyTotals.map((m) => m.yearMonth.slice(0, 4))))
    return years.sort((a, b) => b.localeCompare(a))
  }, [monthlyTotals])

  const monthOptions = useMemo(() => {
    return monthlyTotals.filter((m) => m.yearMonth.startsWith(selectedYear))
  }, [monthlyTotals, selectedYear])

  useEffect(() => {
    if (!selectedYear && yearOptions.length) {
      setSelectedYear(yearOptions[0])
    }
  }, [selectedYear, yearOptions])

  useEffect(() => {
    if (selectedYear && monthOptions.length) {
      if (!monthOptions.find((m) => m.yearMonth === selectedMonth)) {
        setSelectedMonth(monthOptions[0].yearMonth)
      }
    }
  }, [selectedYear, monthOptions, selectedMonth])

  const selectedEntry = monthlyTotals.find((m) => m.yearMonth === selectedMonth)
  const selectedIndex = monthlyTotals.findIndex((m) => m.yearMonth === selectedMonth)
  const previousEntry = selectedIndex >= 0 ? monthlyTotals[selectedIndex + 1] : null
  const changeValue = selectedEntry ? selectedEntry.total - (previousEntry?.total || 0) : 0
  const changePercent = previousEntry?.total ? (changeValue / previousEntry.total) * 100 : null

  const selectedYearRows = monthlyTotals.filter((m) => m.yearMonth.startsWith(selectedYear))

  return (
    <>
      <div className="topbar">
        <div className="brand">💰 <span>ExpenseFlow</span></div>
        <div className="userbox">
          <Link className="btn btn-sm" to="/">Dashboard</Link>
        </div>
      </div>

      <div className="container">
        <div className="panel">
          <div className="table-toolbar">
            <h2>Monthly report</h2>
          </div>
          <div className="filters">
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {yearOptions.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              disabled={!monthOptions.length}
            >
              {monthOptions.map((month) => (
                <option key={month.yearMonth} value={month.yearMonth}>
                  {formatMonthLabel(month.yearMonth)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '3rem' }}>Loading...</p>
        )}

        {error && (
          <p className="err" style={{ textAlign: 'center', padding: '2rem' }}>{error}</p>
        )}

        {!loading && !error && !monthlyTotals.length && (
          <div className="panel">
            <p className="empty">No expenses found yet. Add expenses on the dashboard first.</p>
          </div>
        )}

        {!loading && !error && monthlyTotals.length > 0 && selectedEntry && (
          <>
            <div className="grid2">
              <div className="panel">
                <h2>{formatMonthLabel(selectedEntry.yearMonth)}</h2>
                <div className="summary-card">
                  <div className="summary-row">
                    <span>Total spent</span>
                    <strong>{fmt(selectedEntry.total)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Previous month</span>
                    <strong>{previousEntry ? fmt(previousEntry.total) : '—'}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Change</span>
                    <strong>
                      {previousEntry ? `${changeValue >= 0 ? '+' : ''}${fmt(changeValue)}` : '—'}
                      {changePercent != null ? ` (${changePercent.toFixed(1)}%)` : ''}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="panel">
                <h2>{selectedYear} month comparison</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Total</th>
                      <th>Previous</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedYearRows.map((row, index) => {
                      const prior = monthlyTotals.find((m) => m.yearMonth === row.yearMonth)?.yearMonth
                      const priorIndex = monthlyTotals.findIndex((m) => m.yearMonth === row.yearMonth)
                      const priorRow = priorIndex >= 0 ? monthlyTotals[priorIndex + 1] : null
                      const delta = row.total - (priorRow?.total || 0)
                      return (
                        <tr key={row.yearMonth} className={row.yearMonth === selectedEntry.yearMonth ? 'selected-row' : ''}>
                          <td>{formatMonthLabel(row.yearMonth)}</td>
                          <td>{fmt(row.total)}</td>
                          <td>{priorRow ? `${delta >= 0 ? '+' : ''}${fmt(delta)}` : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="panel">
              <h2>All months</h2>
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyTotals.map((row) => (
                    <tr key={row.yearMonth} className={row.yearMonth === selectedEntry.yearMonth ? 'selected-row' : ''}>
                      <td>{formatMonthLabel(row.yearMonth)}</td>
                      <td>{fmt(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  )
}
