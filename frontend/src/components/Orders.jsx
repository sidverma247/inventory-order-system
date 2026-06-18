import { useEffect, useState } from 'react'
import { OrdersAPI, ProductsAPI, CustomersAPI } from '../api/client.js'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [lines, setLines] = useState([{ product_id: '', quantity: 1 }])
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    try {
      const [o, p, c] = await Promise.all([OrdersAPI.list(), ProductsAPI.list(), CustomersAPI.list()])
      setOrders(o)
      setProducts(p)
      setCustomers(c)
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function setLine(idx, field, value) {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, [field]: value } : l)))
  }

  function addLine() {
    setLines((ls) => [...ls, { product_id: '', quantity: 1 }])
  }

  function removeLine(idx) {
    setLines((ls) => ls.filter((_, i) => i !== idx))
  }

  function productName(id) {
    const p = products.find((p) => p.id === id)
    return p ? `${p.name} (${p.sku})` : `#${id}`
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    const items = lines
      .filter((l) => l.product_id)
      .map((l) => ({ product_id: Number(l.product_id), quantity: Number(l.quantity) }))
    if (!customerId || items.length === 0) {
      setError('Select a customer and at least one product.')
      return
    }
    setLoading(true)
    try {
      const order = await OrdersAPI.create({ customer_id: Number(customerId), items })
      setInfo(`Order #${order.id} placed — total $${Number(order.total_amount).toFixed(2)}.`)
      setCustomerId('')
      setLines([{ product_id: '', quantity: 1 }])
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function cancel(id) {
    if (!confirm(`Cancel order #${id}? Stock will be restored.`)) return
    setError('')
    setInfo('')
    try {
      await OrdersAPI.remove(id)
      setInfo(`Order #${id} cancelled — stock restored.`)
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <section>
      <h2>Orders</h2>
      {error && <div className="error">{error}</div>}
      {info && <div className="success">{info}</div>}

      <form className="card" onSubmit={submit}>
        <label className="field">
          <span>Customer</span>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
            <option value="">— select customer —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
            ))}
          </select>
        </label>

        <div className="lines">
          {lines.map((line, idx) => (
            <div className="line" key={idx}>
              <select value={line.product_id} onChange={(e) => setLine(idx, 'product_id', e.target.value)}>
                <option value="">— select product —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.stock_quantity === 0}>
                    {p.name} ({p.sku}) — {p.stock_quantity} in stock
                  </option>
                ))}
              </select>
              <input
                type="number" min="1" step="1" value={line.quantity}
                onChange={(e) => setLine(idx, 'quantity', e.target.value)}
              />
              {lines.length > 1 && (
                <button type="button" className="link danger" onClick={() => removeLine(idx)}>✕</button>
              )}
            </div>
          ))}
        </div>

        <div className="actions">
          <button type="button" className="secondary" onClick={addLine}>+ Add item</button>
          <button type="submit" disabled={loading}>Place Order</button>
        </div>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const cust = customers.find((c) => c.id === o.customer_id)
              return (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{cust ? cust.name : `#${o.customer_id}`}</td>
                  <td>{o.items.map((it) => `${productName(it.product_id)} ×${it.quantity}`).join(', ')}</td>
                  <td>${Number(o.total_amount).toFixed(2)}</td>
                  <td><span className="badge">{o.status}</span></td>
                  <td><button className="link danger" onClick={() => cancel(o.id)}>Cancel</button></td>
                </tr>
              )
            })}
            {orders.length === 0 && <tr><td colSpan="6" className="muted">No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}
