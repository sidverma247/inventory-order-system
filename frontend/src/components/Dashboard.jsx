import { useEffect, useState } from 'react'
import { StatsAPI } from '../api/client.js'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    StatsAPI.get().then(setStats).catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="error">{error}</div>
  if (!stats) return <p className="muted">Loading dashboard…</p>

  const cards = [
    { label: 'Total Products', value: stats.total_products },
    { label: 'Total Customers', value: stats.total_customers },
    { label: 'Total Orders', value: stats.total_orders },
    { label: 'Low Stock Items', value: stats.low_stock_products.length, alert: stats.low_stock_products.length > 0 },
  ]

  return (
    <section>
      <h2>Dashboard</h2>
      <div className="cards">
        {cards.map((c) => (
          <div className={c.alert ? 'stat-card alert' : 'stat-card'} key={c.label}>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <h3>Low stock (≤ {stats.low_stock_threshold} in stock)</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>SKU</th><th>Name</th><th>Price</th><th>Stock</th></tr>
          </thead>
          <tbody>
            {stats.low_stock_products.map((p) => (
              <tr key={p.id}>
                <td>{p.sku}</td>
                <td>{p.name}</td>
                <td>${Number(p.price).toFixed(2)}</td>
                <td className={p.stock_quantity === 0 ? 'out' : ''}>{p.stock_quantity}</td>
              </tr>
            ))}
            {stats.low_stock_products.length === 0 && (
              <tr><td colSpan="4" className="muted">All products are well stocked. 🎉</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
