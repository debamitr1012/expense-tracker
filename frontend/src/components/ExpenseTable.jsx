import { useState } from 'react'
import * as XLSX from 'xlsx'
import { CAT_COLORS, fmt } from '../api/constants'

export default function ExpenseTable({ expenses, categories, onDelete }) {
  const [filterCat, setFilterCat] = useState('')
  const [search, setSearch] = useState('')

  let list = expenses
  if (filterCat) list = list.filter((e) => e.category === filterCat)
  if (search) list = list.filter((e) => e.description.toLowerCase().includes(search.toLowerCase()))

  const handleExport = () => {
    const rows = list.map((e) => ({
      Date: e.date,
      Description: e.description,
      Category: e.category,
      Amount: e.amount,
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses')

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `expenses-${new Date().toISOString().slice(0, 10)}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="panel">
      <div className="table-toolbar">
        <h2>Transactions</h2>
        <button className="btn btn-sm export-btn" onClick={handleExport} disabled={list.length === 0}>
          Export excel
        </button>
      </div>
      <div className="filters">
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="">All categories</option>
          {categories?.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input placeholder="Search description..." value={search}
          onChange={(e) => setSearch(e.target.value)} />
      </div>

      <table>
        <thead>
          <tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th></th></tr>
        </thead>
        <tbody>
          {list.map((e) => {
            const c = CAT_COLORS[e.category] || '#6b7280'
            return (
              <tr key={e.id}>
                <td>{e.date}</td>
                <td>{e.description}</td>
                <td><span className="cat-pill" style={{ background: c + '22', color: c }}>{e.category}</span></td>
                <td className="amt">{fmt(e.amount)}</td>
                <td><button className="del" onClick={() => onDelete(e.id)}>Delete</button></td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {list.length === 0 && (
        <div className="empty">No expenses found. Add your first one above!</div>
      )}
    </div>
  )
}