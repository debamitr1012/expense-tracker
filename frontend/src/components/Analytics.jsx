import { Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, ArcElement, BarElement, CategoryScale,
  LinearScale, Tooltip, Legend
} from 'chart.js'
import { CAT_COLORS, fmt } from '../api/constants'
import { useTheme } from '../context/ThemeContext'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

export default function Analytics({ summary }) {
  const { theme } = useTheme()
  if (!summary) return null

  const tickColor = theme === 'dark' ? '#cbd5e1' : '#4b5563'
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'

  const cats = summary.byCategory || []
  const trend = summary.dailyTrend || []

  const doughnutData = {
    labels: cats.map((c) => c.category),
    datasets: [{
      data: cats.map((c) => c.total),
      backgroundColor: cats.map((c) => CAT_COLORS[c.category] || '#6b7280'),
      borderWidth: 0
    }]
  }

  const doughnutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { boxWidth: 12, font: { size: 12 }, color: tickColor } },
      tooltip: { callbacks: { label: (c) => `${c.label}: ${fmt(c.raw)}` } }
    }
  }

  const barData = {
    labels: trend.map((d) => d.date.slice(5)),
    datasets: [{
      label: 'Spent',
      data: trend.map((d) => d.total),
      backgroundColor: '#6366f1',
      borderRadius: 4
    }]
  }

  const barOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (c) => fmt(c.raw) } }
    },
    scales: {
      x: { ticks: { color: tickColor }, grid: { color: gridColor } },
      y: { beginAtZero: true, ticks: { color: tickColor, callback: (v) => '₹' + v }, grid: { color: gridColor } }
    }
  }

  return (
    <div className="grid2">
      <div className="panel">
        <h2>Spending by category</h2>
        <div className="chart-box">
          {cats.length ? <Doughnut data={doughnutData} options={doughnutOpts} />
            : <p className="empty">No data yet</p>}
        </div>
      </div>
      <div className="panel">
        <h2>Daily spending (last 14 days)</h2>
        <div className="chart-box"><Bar data={barData} options={barOpts} /></div>
      </div>
    </div>
  )
}