import { useState } from 'react'
import Dashboard from './components/Dashboard.jsx'
import Products from './components/Products.jsx'
import Customers from './components/Customers.jsx'
import Orders from './components/Orders.jsx'

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'products', label: 'Products' },
  { key: 'customers', label: 'Customers' },
  { key: 'orders', label: 'Orders' },
]

export default function App() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="app">
      <header className="header">
        <h1>Inventory &amp; Order Management</h1>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={tab === t.key ? 'tab active' : 'tab'}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="content">
        {tab === 'dashboard' && <Dashboard key={tab} />}
        {tab === 'products' && <Products />}
        {tab === 'customers' && <Customers />}
        {tab === 'orders' && <Orders />}
      </main>
    </div>
  )
}
