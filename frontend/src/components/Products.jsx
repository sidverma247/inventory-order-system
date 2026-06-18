import { useEffect, useState } from 'react'
import { ProductsAPI } from '../api/client.js'

const EMPTY = { sku: '', name: '', description: '', price: '', stock_quantity: '' }

export default function Products() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null) // {id, name, price, stock_quantity}
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    try {
      setProducts(await ProductsAPI.list())
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await ProductsAPI.create({
        sku: form.sku.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity),
      })
      setForm(EMPTY)
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function saveEdit() {
    setError('')
    try {
      await ProductsAPI.update(editing.id, {
        name: editing.name.trim(),
        price: Number(editing.price),
        stock_quantity: Number(editing.stock_quantity),
      })
      setEditing(null)
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function remove(id) {
    if (!confirm('Delete this product?')) return
    try {
      await ProductsAPI.remove(id)
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <section>
      <h2>Products</h2>
      {error && <div className="error">{error}</div>}

      <form className="card form-grid" onSubmit={submit}>
        <input placeholder="SKU *" value={form.sku} onChange={(e) => update('sku', e.target.value)} required />
        <input placeholder="Name *" value={form.name} onChange={(e) => update('name', e.target.value)} required />
        <input placeholder="Description" value={form.description} onChange={(e) => update('description', e.target.value)} />
        <input placeholder="Price *" type="number" min="0" step="0.01" value={form.price} onChange={(e) => update('price', e.target.value)} required />
        <input placeholder="Stock *" type="number" min="0" step="1" value={form.stock_quantity} onChange={(e) => update('stock_quantity', e.target.value)} required />
        <button type="submit" disabled={loading}>Add Product</button>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>ID</th><th>SKU</th><th>Name</th><th>Price</th><th>Stock</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {products.map((p) =>
              editing && editing.id === p.id ? (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.sku}</td>
                  <td><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></td>
                  <td><input type="number" min="0" step="0.01" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} /></td>
                  <td><input type="number" min="0" step="1" value={editing.stock_quantity} onChange={(e) => setEditing({ ...editing, stock_quantity: e.target.value })} /></td>
                  <td className="row-actions">
                    <button className="link" onClick={saveEdit}>Save</button>
                    <button className="link" onClick={() => setEditing(null)}>Cancel</button>
                  </td>
                </tr>
              ) : (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.sku}</td>
                  <td>{p.name}</td>
                  <td>${Number(p.price).toFixed(2)}</td>
                  <td className={p.stock_quantity === 0 ? 'out' : ''}>{p.stock_quantity}</td>
                  <td className="row-actions">
                    <button className="link" onClick={() => setEditing({ id: p.id, name: p.name, price: p.price, stock_quantity: p.stock_quantity })}>Edit</button>
                    <button className="link danger" onClick={() => remove(p.id)}>Delete</button>
                  </td>
                </tr>
              )
            )}
            {products.length === 0 && <tr><td colSpan="6" className="muted">No products yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}
