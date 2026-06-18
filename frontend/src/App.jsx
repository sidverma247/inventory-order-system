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

const USER_EMAIL = import.meta.env.VITE_USER_EMAIL || 'admin@inventory.app'

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [navOpen, setNavOpen] = useState(false)

  const active = TABS.find((t) => t.key === tab)

  function go(key) {
    setTab(key)
    setNavOpen(false)
  }

  return (
    <div className={navOpen ? 'layout nav-open' : 'layout'}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">📦</span>
          <span className="brand-text">Inventory<span className="brand-sub">&nbsp;Manager</span></span>
        </div>

        <nav className="sidebar-nav" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={tab === t.key ? 'nav-item active' : 'nav-item'}
              onClick={() => go(t.key)}
            >
              <span className="nav-icon" aria-hidden="true">{t.icon}</span>
              <span className="nav-label">{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">v1.0 · FastAPI + React</div>
      </aside>

      {/* Mobile overlay */}
      <div className="nav-scrim" onClick={() => setNavOpen(false)} />

      {/* Main column */}
      <div className="main">
        <header className="topbar">
          <button className="hamburger" aria-label="Toggle navigation" onClick={() => setNavOpen((v) => !v)}>
            ☰
          </button>
          <h1 className="page-title">
            <span className="page-icon" aria-hidden="true">{active?.icon}</span>
            {active?.label}
          </h1>
          <div className="topbar-right">
            <span className="user-email">{USER_EMAIL}</span>
            <span className="avatar" aria-hidden="true">{USER_EMAIL[0].toUpperCase()}</span>
          </div>
        </header>

        <main className="content">
          {tab === 'dashboard' && <Dashboard key={tab} />}
          {tab === 'products' && <Products />}
          {tab === 'customers' && <Customers />}
          {tab === 'orders' && <Orders />}
        </main>
      </div>
    </div>
  )
}
