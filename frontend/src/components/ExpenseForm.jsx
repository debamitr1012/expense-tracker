import { useState } from 'react'

export default function ExpenseForm({ categories, onAdd, onAddCategory }) {
  const d = new Date()
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [date, setDate] = useState(today)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    const amt = parseFloat(amount)
    if (!desc.trim() || !amt || amt <= 0 || !date || !category) {
      alert('Please enter a description, valid amount, category, and date.')
      return
    }
    setSaving(true)
    try {
      await onAdd({ description: desc.trim(), amount: amt, category, date })
      setDesc('')
      setAmount('')
    } finally {
      setSaving(false)
    }
  }

  const addCategory = () => {
    const value = newCategory.trim()
    if (!value) return
    onAddCategory?.(value)
    setCategory(value)
    setNewCategory('')
  }

  return (
    <div className="panel" style={{ marginBottom: '1.5rem' }}>
      <h2>Add an expense</h2>
      <div className="add-form">
        <div className="field">
          <label>Description</label>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Coffee, groceries..." />
        </div>
        <div className="field">
          <label>Amount</label>
          <input type="number" min="0" step="0.01" value={amount}
            onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div className="field">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories?.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label>New category</label>
          <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Add a new category" />
        </div>
        <div className="field">
          <button className="btn btn-sm" onClick={addCategory} type="button">+ Add category</button>
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <button className="btn btn-sm" onClick={submit} disabled={saving}>+ Add expense</button>
        </div>
      </div>
    </div>
  )
}