import { useState } from 'react'
import { useLocation, Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/pos':       'Point of Sale',
  '/products':  'Products',
  '/inventory': 'Inventory',
  '/orders':    'Orders & Transactions',
  '/customers': 'Customers',
  '/reports':   'Reports & Analytics',
  '/settings':  'Settings',
  '/admin':     'Admin Panel',
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'Nexus POS'

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
