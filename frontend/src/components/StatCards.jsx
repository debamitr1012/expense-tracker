import { fmt } from '../api/constants'

export default function StatCards({ summary, selectedMonthLabel }) {
  const s = summary || { total: 0, monthTotal: 0, prevMonthTotal: 0, count: 0, avgPerDay: 0 }
  return (
    <div className="cards">
      <div className="stat">
        <div className="label">{selectedMonthLabel || 'Selected month'} spent</div>
        <div className="value danger">{fmt(s.monthTotal)}</div>
      </div>
      <div className="stat">
        <div className="label">Previous month</div>
        <div className="value indigo">{s.prevMonthTotal !== undefined ? fmt(s.prevMonthTotal) : '—'}</div>
      </div>
      <div className="stat">
        <div className="label">Month transactions</div>
        <div className="value">{s.count}</div>
      </div>
      <div className="stat">
        <div className="label">Avg / day ({selectedMonthLabel || 'this month'})</div>
        <div className="value green">{fmt(s.avgPerDay)}</div>
      </div>
    </div>
  )
}