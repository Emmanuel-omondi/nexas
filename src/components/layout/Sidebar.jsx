import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard, ShoppingCart, Package, BarChart3,
  Users, Settings, LogOut, ShieldCheck, Boxes,
  ClipboardList, ChevronLeft, ChevronRight, Store,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pos',       icon: ShoppingCart,    label: 'Point of Sale' },
  { to: '/products',  icon: Package,         label: 'Products' },
  { to: '/inventory', icon: Boxes,           label: 'Inventory' },
  { to: '/orders',    icon: ClipboardList,   label: 'Orders' },
  { to: '/customers', icon: Users,           label: 'Customers' },
  { to: '/reports',   icon: BarChart3,       label: 'Reports' },
  { to: '/settings',  icon: Settings,        label: 'Settings' },
]

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { user, logout, adminLogin, isAdminAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [adminModal, setAdminModal] = useState(false)
  const [adminPass, setAdminPass] = useState('')
  const [adminError, setAdminError] = useState('')
  const [adminLoading, setAdminLoading] = useState(false)

  const handleAdminAccess = () => {
    if (isAdminAuthenticated) {
      navigate('/admin')
    } else {
      setAdminModal(true)
    }
  }

  const handleAdminLogin = async (e) => {
    e.preventDefault()
    setAdminLoading(true)
    setAdminError('')
    try {
      await adminLogin(adminPass)
      setAdminModal(false)
      setAdminPass('')
      navigate('/admin')
    } catch (err) {
      setAdminError(err.message)
    } finally {
      setAdminLoading(false)
    }
  }

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 z-40 transition-opacity duration-300"
          onClick={onMobileClose}
        />
      )}

      <aside className={clsx(
        'flex flex-col h-full bg-gradient-to-b from-navy-900 to-navy-800 transition-all duration-300 ease-in-out z-50',
        // Desktop behavior
        'lg:relative lg:translate-x-0',
        collapsed ? 'lg:w-16' : 'lg:w-60',
        // Mobile behavior
        'fixed inset-y-0 left-0 w-60 shadow-2xl lg:shadow-none',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className={clsx(
          'flex items-center h-16 px-4 border-b border-white/10',
          collapsed ? 'justify-center' : 'gap-3'
        )}>
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Store size={18} className="text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <div className="text-white font-bold text-base leading-tight">NEXUS</div>
              <div className="text-blue-300 text-xs font-medium tracking-widest">POS</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto no-scrollbar">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                collapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="animate-fade-in">{label}</span>}
            </NavLink>
          ))}

          {/* Admin */}
          <button
            onClick={handleAdminAccess}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              collapsed ? 'justify-center' : '',
              'text-blue-200 hover:bg-white/10 hover:text-white'
            )}
            title={collapsed ? 'Admin Panel' : undefined}
          >
            <ShieldCheck size={18} className="flex-shrink-0" />
            {!collapsed && <span className="animate-fade-in">Admin Panel</span>}
          </button>
        </nav>

        {/* User + Collapse */}
        <div className="border-t border-white/10 p-2 space-y-1">
          {!collapsed && (
            <div className="flex items-center gap-3 px-3 py-2 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-semibold truncate">{user?.name}</div>
                <div className="text-blue-300 text-xs capitalize">{user?.role}</div>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-200 hover:bg-white/10 hover:text-white transition-all duration-200',
              collapsed ? 'justify-center' : ''
            )}
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut size={18} />
            {!collapsed && <span>Sign Out</span>}
          </button>
          <button
            onClick={onToggle}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-blue-300 hover:text-white transition-all duration-200',
              collapsed ? 'justify-center' : 'justify-end'
            )}
          >
            {collapsed ? <ChevronRight size={16} /> : <><span>Collapse</span><ChevronLeft size={16} /></>}
          </button>
        </div>
      </aside>

      {/* Admin Auth Modal */}
      <Modal
        isOpen={adminModal}
        onClose={() => { setAdminModal(false); setAdminPass(''); setAdminError('') }}
        title="Admin Access Required"
        size="sm"
      >
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="w-14 h-14 bg-navy-100 rounded-2xl flex items-center justify-center">
            <ShieldCheck size={28} className="text-navy-800" />
          </div>
          <p className="text-sm text-gray-500 text-center">
            Enter the admin password to access the admin panel.
          </p>
          <form onSubmit={handleAdminLogin} className="w-full space-y-3">
            <Input
              type="password"
              placeholder="Admin password"
              value={adminPass}
              onChange={e => setAdminPass(e.target.value)}
              error={adminError}
              autoFocus
            />
            <Button
              type="submit"
              fullWidth
              loading={adminLoading}
              icon={ShieldCheck}
            >
              Access Admin Panel
            </Button>
          </form>
        </div>
      </Modal>
    </>
  )
}
