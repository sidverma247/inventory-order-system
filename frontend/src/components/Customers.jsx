import { useEffect, useState } from 'react'
import { CustomersAPI } from '../api/client.js'

const EMPTY = { name: '', email: '', phone: '', address: '' }

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    try {
      setCustomers(await CustomersAPI.list())
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
      await CustomersAPI.create({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
      })
      setForm(EMPTY)
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function remove(id) {
    if (!confirm('Delete this customer?')) return
    try {
      await CustomersAPI.remove(id)
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <section>
      <h2>Customers</h2>
      {error && <div className="error">{error}</div>}

      <form className="card form-grid" onSubmit={submit}>
        <input placeholder="Name *" value={form.name} onChange={(e) => update('name', e.target.value)} required />
        <input placeholder="Email *" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
        <input placeholder="Phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
        <input placeholder="Address" value={form.address} onChange={(e) => update('address', e.target.value)} />
        <button type="submit" disabled={loading}>Add Customer</button>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th></th></tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.phone || '—'}</td>
                <td><button className="link danger" onClick={() => remove(c.id)}>Delete</button></td>
              </tr>
            ))}
            {customers.length === 0 && <tr><td colSpan="5" className="muted">No customers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}
