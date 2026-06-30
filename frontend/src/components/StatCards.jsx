import { fmt } from '../api/constants'

export default function StatCards({ summary }) {
  const s = summary || { total: 0, monthTotal: 0, count: 0, avgPerDay: 0 }
  return (
    <div className="cards">
      <div className="stat">
        <div className="label">Total spent</div>
        <div className="value danger">{fmt(s.total)}</div>
      </div>
      <div className="stat">
        <div className="label">This month</div>
        <div className="value indigo">{fmt(s.monthTotal)}</div>
      </div>
      <div className="stat">
        <div className="label">Transactions</div>
        <div className="value">{s.count}</div>
      </div>
      <div className="stat">
        <div className="label">Avg / day (this month)</div>
        <div className="value green">{fmt(s.avgPerDay)}</div>
      </div>
    </div>
  )
}