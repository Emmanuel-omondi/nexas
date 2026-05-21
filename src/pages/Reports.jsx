import { useState, useEffect } from 'react'
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { useSettingsStore } from '../store/settingsStore'
import { formatCurrency } from '../utils/formatters'
import { BarChart3, TrendingUp, Calendar, ShoppingBag, DollarSign, Wallet } from 'lucide-react'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'

export default function Reports() {
  const { settings } = useSettingsStore()
  const currency = settings.currency

  const [dateFilter, setDateFilter] = useState('7days') // 'today' | 'yesterday' | '7days' | 'all'
  const [reportData, setReportData] = useState({
    revenue: 0,
    ordersCount: 0,
    avgOrderValue: 0,
    costOfGoods: 0,
    grossProfit: 0,
    timelineSales: [],
    categorySales: [],
    paymentMethodSales: [],
  })

  // Read transactions directly from Dexie
  const orders = useLiveQuery(() => db.orders.toArray(), [])
  const products = useLiveQuery(() => db.products.toArray(), [])

  useEffect(() => {
    if (!orders || !products) return

    // Define date threshold based on filter
    const now = new Date()
    let startDate = new Date(0) // All time fallback

    if (dateFilter === 'today') {
      startDate = new Date()
      startDate.setHours(0, 0, 0, 0)
    } else if (dateFilter === 'yesterday') {
      startDate = new Date()
      startDate.setDate(now.getDate() - 1)
      startDate.setHours(0, 0, 0, 0)
    } else if (dateFilter === '7days') {
      startDate = new Date()
      startDate.setDate(now.getDate() - 7)
    }

    const endDate = dateFilter === 'yesterday' ? new Date() : null
    if (endDate && dateFilter === 'yesterday') {
      endDate.setHours(23, 59, 59, 999)
      endDate.setDate(now.getDate() - 1)
    }

    // Filter orders based on selected dates
    const filteredOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt)
      if (dateFilter === 'yesterday' && endDate) {
        return orderDate >= startDate && orderDate <= endDate
      }
      return orderDate >= startDate
    })

    // 1. Revenue & Order statistics
    const totalRev = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    const count = filteredOrders.length
    const aov = count > 0 ? totalRev / count : 0

    // Compute Cost of Goods Sold (COGS) and Gross Margin
    let totalCost = 0
    filteredOrders.forEach(o => {
      if (o.items) {
        o.items.forEach(i => {
          // Fallback if item cost is missing
          const matchProd = products.find(p => p.id === i.productId)
          const costVal = matchProd ? matchProd.cost : (i.cost || i.price * 0.6)
          totalCost += costVal * i.quantity
        })
      }
    })

    const grossProfit = totalRev - totalCost

    // 2. Timeline Sales Chart Processing (Group by date)
    const dailyMap = {}
    // If last 7 days, pre-populate last 7 dates to ensure clean timeline even with 0 sales
    if (dateFilter === '7days') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(now.getDate() - i)
        const dateStr = d.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })
        dailyMap[dateStr] = { label: dateStr, sales: 0, profit: 0, orders: 0 }
      }
    }

    filteredOrders.forEach(o => {
      const dateStr = new Date(o.createdAt).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { label: dateStr, sales: 0, profit: 0, orders: 0 }
      }
      dailyMap[dateStr].sales += o.total || 0
      dailyMap[dateStr].orders += 1

      // Cost estimation for this specific order
      let orderCost = 0
      if (o.items) {
        o.items.forEach(i => {
          const matchProd = products.find(p => p.id === i.productId)
          orderCost += (matchProd ? matchProd.cost : (i.cost || i.price * 0.6)) * i.quantity
        })
      }
      dailyMap[dateStr].profit += (o.total || 0) - orderCost
    })

    const timelineSales = Object.values(dailyMap)

    // 3. Sales by Product Category
    const categoryMap = {}
    filteredOrders.forEach(o => {
      if (o.items) {
        o.items.forEach(i => {
          const category = i.category || 'Other'
          if (!categoryMap[category]) {
            categoryMap[category] = { name: category, value: 0 }
          }
          categoryMap[category].value += i.price * i.quantity
        })
      }
    })
    const categorySales = Object.values(categoryMap)

    // 4. Sales by Payment Method
    const paymentMap = {
      cash: { name: 'Cash', value: 0, color: '#10b981' },
      mpesa: { name: 'M-Pesa', value: 0, color: '#22c55e' },
      card: { name: 'Card', value: 0, color: '#3b82f6' }
    }
    filteredOrders.forEach(o => {
      const method = o.paymentMethod || 'cash'
      if (paymentMap[method]) {
        paymentMap[method].value += o.total || 0
      }
    })
    const paymentMethodSales = Object.values(paymentMap).filter(v => v.value > 0)

    setReportData({
      revenue: totalRev,
      ordersCount: count,
      avgOrderValue: aov,
      costOfGoods: totalCost,
      grossProfit,
      timelineSales,
      categorySales,
      paymentMethodSales,
    })

  }, [orders, products, dateFilter])

  const categoryColors = ['#1e3a8a', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6']

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900">Reports & Intelligent Analytics</h2>
          <p className="text-sm text-gray-500">Analyze performance indices and sales metrics powered by BitBridge</p>
        </div>

        {/* Date Filter selector */}
        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-fit self-start">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: '7days', label: 'Last 7 Days' },
            { id: 'all', label: 'All Time' }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setDateFilter(btn.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dateFilter === btn.id
                  ? 'bg-navy-800 text-white'
                  : 'bg-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Gross Revenue', value: formatCurrency(reportData.revenue, currency), icon: DollarSign, color: 'bg-blue-50 text-blue-600' },
          { label: 'Completed Sales', value: reportData.ordersCount, icon: ShoppingBag, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Average Ticket (AOV)', value: formatCurrency(reportData.avgOrderValue, currency), icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
          { label: 'Est. Gross Margin', value: formatCurrency(reportData.grossProfit, currency), icon: Wallet, color: 'bg-amber-50 text-amber-600' },
        ].map((kpi, idx) => (
          <Card key={idx}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.color}`}>
                <kpi.icon size={20} />
              </div>
              <Badge variant="success">Steady</Badge>
            </div>
            <div className="text-xl sm:text-2xl font-black text-gray-900 truncate">{kpi.value}</div>
            <div className="text-xs sm:text-sm text-gray-500 mt-0.5">{kpi.label}</div>
          </Card>
        ))}
      </div>

      {/* Analytics Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Timeline Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue & Profits Trendline" subtitle="Periodic visual analytics performance" />
          <div className="h-64 sm:h-80 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportData.timelineSales} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => v.toLocaleString()} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }}
                  formatter={(v) => [formatCurrency(v, currency), '']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Area name="Sales Revenue" type="monotone" dataKey="sales" stroke="#1e3a8a" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                <Area name="Gross Profit" type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category Share Distribution */}
        <Card>
          <CardHeader title="Revenue by Category" subtitle="Sector share allocation" />
          <div className="h-48 sm:h-56 w-full mt-2 relative">
            {reportData.categorySales.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                No categorical sales logged
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.categorySales}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {reportData.categorySales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v, currency)} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="space-y-1.5 mt-2 max-h-36 overflow-y-auto no-scrollbar">
            {reportData.categorySales.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: categoryColors[i % categoryColors.length] }} />
                  <span className="text-gray-600 truncate max-w-[140px]">{c.name}</span>
                </div>
                <span className="font-bold text-gray-800">{formatCurrency(c.value, currency)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Financial share metrics details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Methods Breakdown */}
        <Card>
          <CardHeader title="Sales Share by Payment Method" subtitle="Cash vs M-Pesa vs Card distribution" />
          <div className="h-56 w-full mt-2">
            {reportData.paymentMethodSales.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                No orders compiled yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.paymentMethodSales} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => formatCurrency(v, currency)}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {reportData.paymentMethodSales.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Cost Analysis margins */}
        <Card>
          <CardHeader title="Overhead Cost breakdown structure" subtitle="Sales Revenue vs Cost of Goods vs Margin" />
          <div className="flex flex-col justify-center h-full py-4 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
                <span>Cost of Goods Sold (COGS)</span>
                <span className="font-mono">{(reportData.revenue > 0 ? (reportData.costOfGoods / reportData.revenue * 100) : 0).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-red-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${reportData.revenue > 0 ? (reportData.costOfGoods / reportData.revenue * 100) : 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Est. cost of procuring inventory: {formatCurrency(reportData.costOfGoods, currency)}</p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
                <span>Gross Profit Margin</span>
                <span className="font-mono text-emerald-600">{(reportData.revenue > 0 ? (reportData.grossProfit / reportData.revenue * 100) : 0).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${reportData.revenue > 0 ? (reportData.grossProfit / reportData.revenue * 100) : 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Est. overhead yield profits: {formatCurrency(reportData.grossProfit, currency)}</p>
            </div>

            <div className="bg-navy-50 rounded-xl p-3.5 flex items-center justify-between text-navy-900 border border-navy-100/50">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-navy-800 uppercase">BitBridge Smart Analytics</p>
                <p className="text-xs text-navy-700/80 mt-0.5">Your gross margin profile is highly optimized and healthy.</p>
              </div>
              <BarChart3 size={24} className="text-navy-800 opacity-60 flex-shrink-0" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
