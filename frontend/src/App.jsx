import { useState } from 'react'
import Dashboard from './components/Dashboard.jsx'
import Products from './components/Products.jsx'
import Customers from './components/Customers.jsx'
import Orders from './components/Orders.jsx'

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'products', label: 'Products', icon: '📦' },
  { key: 'customers', label: 'Customers', icon: '👥' },
  { key: 'orders', label: 'Orders', icon: '🧾' },
]

export default function App() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="brand-mark">📦</span>
          <h1>Inventory &amp; Order Management</h1>
        </div>
        <nav className="tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={tab === t.key ? 'tab active' : 'tab'}
              onClick={() => setTab(t.key)}
            >
              <span className="tab-icon" aria-hidden="true">{t.icon}</span>
              <span className="tab-label">{t.label}</span>
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
