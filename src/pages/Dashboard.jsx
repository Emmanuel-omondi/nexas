import { useEffect, useState } from 'react'
import { TrendingUp, ShoppingCart, Users, Package, ArrowUpRight, ArrowDownRight, DollarSign, AlertTriangle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { db } from '../db/database'
import { formatCurrency, formatDateTime } from '../utils/formatters'
import { useSettingsStore } from '../store/settingsStore'
import { useAuthStore } from '../store/authStore'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'

const salesData = [
  { day: 'Mon', sales: 12400, orders: 34 },
  { day: 'Tue', sales: 18200, orders: 48 },
  { day: 'Wed', sales: 15800, orders: 42 },
  { day: 'Thu', sales: 22100, orders: 61 },
  { day: 'Fri', sales: 28500, orders: 78 },
  { day: 'Sat', sales: 35200, orders: 95 },
  { day: 'Sun', sales: 19800, orders: 54 },
]

const categoryData = [
  { name: 'Food & Bev', value: 35, color: '#f97316' },
  { name: 'Groceries',  value: 25, color: '#22c55e' },
  { name: 'Electronics',value: 20, color: '#3b82f6' },
  { name: 'Clothing',   value: 12, color: '#a855f7' },
  { name: 'Others',     value: 8,  color: '#94a3b8' },
]

export default function Dashboard() {
  const { settings } = useSettingsStore()
  const { user } = useAuthStore()
  const currency = settings.currency

  const [stats, setStats]         = useState({ todaySales: 0, todayOrders: 0, customers: 0, lowStock: 0 })
  const [recentOrders, setRecent] = useState([])
  const [lowStockItems, setLow]   = useState([])

  useEffect(() => {
    async function load() {
      const today = new Date(); today.setHours(0,0,0,0)
      const orders = await db.orders.where('createdAt').above(today.toISOString()).toArray()
      const todaySales  = orders.reduce((s, o) => s + (o.total || 0), 0)
      const customers   = await db.customers.count()
      const products    = await db.products.toArray()
      const lowStock    = products.filter(p => p.stock <= 10 && p.active).length
      const recent      = await db.orders.orderBy('createdAt').reverse().limit(5).toArray()
      const low         = products.filter(p => p.stock <= 10 && p.active).slice(0, 5)
      setStats({ todaySales, todayOrders: orders.length, customers, lowStock })
      setRecent(recent)
      setLow(low)
    }
    load()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const statCards = [
    {
      label: "Today's Sales",
      value: formatCurrency(stats.todaySales, currency),
      icon: DollarSign,
      change: '+12.5%',
      up: true,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: "Today's Orders",
      value: stats.todayOrders,
      icon: ShoppingCart,
      change: '+8.2%',
      up: true,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Total Customers',
      value: stats.customers,
      icon: Users,
      change: '+3.1%',
      up: true,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Low Stock Items',
      value: stats.lowStock,
      icon: AlertTriangle,
      change: stats.lowStock > 0 ? 'Needs attention' : 'All good',
      up: stats.lowStock === 0,
      color: stats.lowStock > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-500',
    },
  ]

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Greeting banner */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-700 rounded-2xl p-6 flex items-center justify-between overflow-hidden relative">
        <div className="absolute right-0 top-0 w-64 h-full opacity-10"
          style={{ background: 'radial-gradient(circle at 80% 50%, #60a5fa 0%, transparent 70%)' }} />
        <div>
          <p className="text-blue-300 text-sm font-medium">{greeting},</p>
          <h2 className="text-white text-2xl font-black mt-0.5">{user?.name} 👋</h2>
          <p className="text-blue-200/70 text-sm mt-1">Here's what's happening at {settings.storeName} today.</p>
        </div>
        <div className="hidden md:flex flex-col items-end gap-1">
          <span className="text-white/40 text-xs">Weekly Revenue</span>
          <span className="text-white text-2xl font-black">
            {formatCurrency(salesData.reduce((s, d) => s + d.sales, 0), currency)}
          </span>
          <span className="text-emerald-400 text-xs flex items-center gap-1">
            <ArrowUpRight size={12} /> +18.4% vs last week
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <Card key={i}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon size={20} />
              </div>
              <span className={`text-xs font-semibold flex items-center gap-0.5 ${s.up ? 'text-emerald-600' : 'text-red-500'}`}>
                {s.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {s.change}
              </span>
            </div>
            <div className="text-2xl font-black text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales chart */}
        <Card className="lg:col-span-2">
          <CardHeader title="Weekly Sales" subtitle="Revenue overview for this week" />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={salesData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1e3a8a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                formatter={(v) => [formatCurrency(v, currency), 'Sales']}
              />
              <Area type="monotone" dataKey="sales" stroke="#1e3a8a" strokeWidth={2.5} fill="url(#salesGrad)" dot={false} activeDot={{ r: 5, fill: '#1e3a8a' }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Category pie */}
        <Card>
          <CardHeader title="Sales by Category" subtitle="This week" />
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`, 'Share']} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {categoryData.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                  <span className="text-gray-600">{c.name}</span>
                </div>
                <span className="font-semibold text-gray-800">{c.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent orders */}
        <Card>
          <CardHeader title="Recent Orders" subtitle="Latest transactions" />
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No orders yet today</div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{order.orderNumber}</p>
                    <p className="text-xs text-gray-400">{formatDateTime(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(order.total, currency)}</p>
                    <Badge variant={order.paymentMethod === 'mpesa' ? 'success' : order.paymentMethod === 'cash' ? 'default' : 'primary'}>
                      {order.paymentMethod}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Low stock */}
        <Card>
          <CardHeader
            title="Low Stock Alert"
            subtitle="Items needing restock"
            action={<Badge variant="warning">{lowStockItems.length} items</Badge>}
          />
          {lowStockItems.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">All stock levels are healthy</div>
          ) : (
            <div className="space-y-3">
              {lowStockItems.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Package size={14} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.category}</p>
                    </div>
                  </div>
                  <Badge variant={p.stock === 0 ? 'danger' : 'warning'} dot>
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
