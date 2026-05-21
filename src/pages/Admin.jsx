import React, { useState, useEffect } from 'react'
import {
  ShieldAlert, ShieldCheck, DollarSign, Wallet, Users,
  TrendingDown, Plus, Trash2, Calendar, FileText,
  Download, Upload, AlertTriangle, Users2, Key, ToggleLeft, ToggleRight,
  TrendingUp, Activity, ArrowRight, RefreshCw, BarChart2, Coins
} from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { useAuthStore } from '../store/authStore'
import { useSettingsStore } from '../store/settingsStore'
import { formatCurrency, formatDate } from '../utils/formatters'
import Card, { CardHeader } from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function Admin() {
  const { user, isAdminAuthenticated, adminLogin, clearAdminAuth } = useAuthStore()
  const { settings } = useSettingsStore()
  const currency = settings.currency || 'KES'
  const drawerCashLimit = settings.drawerCashLimit || 20000

  // Admin access gate state (in case they navigated directly without sidebar flow)
  const [adminPass, setAdminPass] = useState('')
  const [adminError, setAdminError] = useState('')
  const [adminLoading, setAdminLoading] = useState(false)

  // Sub-navigation tabs
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'shifts' | 'expenses' | 'employees' | 'backup'

  // Form states
  const [expenseModal, setExpenseModal] = useState(false)
  const [expenseCategory, setExpenseCategory] = useState('Utilities')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseDesc, setExpenseDesc] = useState('')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])

  const [employeeModal, setEmployeeModal] = useState(false)
  const [empName, setEmpName] = useState('')
  const [empEmail, setEmpEmail] = useState('')
  const [empRole, setEmpRole] = useState('cashier')
  const [empPin, setEmpPin] = useState('')

  // Drawer drop state
  const [dropModal, setDropModal] = useState(false)
  const [dropAmount, setDropAmount] = useState('')

  // Live queries
  const allShifts = useLiveQuery(() => db.shifts.orderBy('id').reverse().toArray()) || []
  const allExpenses = useLiveQuery(() => db.expenses.orderBy('id').reverse().toArray()) || []
  const allUsers = useLiveQuery(() => db.users.toArray()) || []
  const allOrders = useLiveQuery(() => db.orders.toArray()) || []

  // Check current open shift cash drawer
  const activeShift = allShifts.find(s => s.status === 'open')
  let currentDrawerCash = 0
  if (activeShift) {
    currentDrawerCash = (activeShift.startingCash || 0) + (activeShift.cashSales || 0) - (activeShift.expenses || 0)
  }
  const isDrawerOverLimit = currentDrawerCash > drawerCashLimit

  // Financial statistics
  const [kpis, setKpis] = useState({
    totalRev: 0,
    totalExp: 0,
    netProfit: 0,
    varianceCount: 0,
    varianceSum: 0
  })

  const [chartData, setChartData] = useState([])

  useEffect(() => {
    if (!allOrders || !allExpenses || !allShifts) return

    const totalRev = allOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    const orderCost = allOrders.reduce((sum, o) => sum + (o.total * 0.6), 0) // simulated product cogs
    const directExpenses = allExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    const totalExp = orderCost + directExpenses
    const netProfit = totalRev - totalExp

    // Audited shift discrepancies
    const completedShifts = allShifts.filter(s => s.status === 'closed')
    let varianceCount = 0
    let varianceSum = 0
    completedShifts.forEach(s => {
      const variance = (s.actualCash || 0) - (s.expectedCash || 0)
      if (Math.abs(variance) > 1) {
        varianceCount++
        varianceSum += variance
      }
    })

    setKpis({
      totalRev,
      totalExp,
      netProfit,
      varianceCount,
      varianceSum
    })

    // Prepare chart data - group by month/day
    const grouped = {}
    allOrders.forEach(o => {
      const dateStr = new Date(o.createdAt).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })
      if (!grouped[dateStr]) grouped[dateStr] = { label: dateStr, revenue: 0, expenses: 0 }
      grouped[dateStr].revenue += o.total || 0
      grouped[dateStr].expenses += o.total * 0.6 // basic COGS
    })

    allExpenses.forEach(e => {
      const dateStr = new Date(e.date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })
      if (!grouped[dateStr]) grouped[dateStr] = { label: dateStr, revenue: 0, expenses: 0 }
      grouped[dateStr].expenses += e.amount || 0
    })

    // Take last 7 data points sorted
    const formatted = Object.values(grouped).slice(-7)
    setChartData(formatted)

  }, [allOrders, allExpenses, allShifts])

  const handleAdminGateLogin = async (e) => {
    e.preventDefault()
    setAdminLoading(true)
    setAdminError('')
    try {
      await adminLogin(adminPass)
      setAdminPass('')
    } catch (err) {
      setAdminError(err.message)
    } finally {
      setAdminLoading(false)
    }
  }

  // Handle adding overhead expense
  const handleAddExpense = async (e) => {
    e.preventDefault()
    if (!expenseAmount || Number(expenseAmount) <= 0) return

    try {
      const amt = Number(expenseAmount)
      const newExpense = {
        category: expenseCategory,
        amount: amt,
        description: expenseDesc || `${expenseCategory} overhead expense`,
        date: expenseDate,
        cashierId: user?.id || 1,
        shiftId: activeShift?.id || null
      }

      await db.expenses.add(newExpense)

      // If there is an active shift, also record the expense inside the shift
      if (activeShift) {
        const { recordShiftExpense } = useAuthStore.getState()
        await recordShiftExpense(amt)
      }

      setExpenseModal(false)
      setExpenseAmount('')
      setExpenseDesc('')
      setExpenseCategory('Utilities')
    } catch (err) {
      console.error(err)
    }
  }

  // Handle adding employee
  const handleAddEmployee = async (e) => {
    e.preventDefault()
    if (!empName || !empEmail || !empPin) return

    try {
      await db.users.add({
        name: empName,
        email: empEmail.toLowerCase(),
        role: empRole,
        pin: empPin,
        active: true
      })
      setEmployeeModal(false)
      setEmpName('')
      setEmpEmail('')
      setEmpPin('')
      setEmpRole('cashier')
    } catch (err) {
      console.error(err)
    }
  }

  // Toggle user active status
  const handleToggleUser = async (userId, currentStatus) => {
    try {
      await db.users.update(userId, { active: !currentStatus })
    } catch (err) {
      console.error(err)
    }
  }

  // Delete overhead expense
  const handleDeleteExpense = async (id) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return
    try {
      await db.expenses.delete(id)
    } catch (err) {
      console.error(err)
    }
  }

  // Safe Cash Drop Action
  const handleSafeDrop = async (e) => {
    e.preventDefault()
    if (!dropAmount || Number(dropAmount) <= 0) return
    const amount = Number(dropAmount)
    
    try {
      // Record a safe drop expense inside the shift
      const dropExpense = {
        category: 'Safe Cash Drop',
        amount: amount,
        description: `Safe Drop from Cash Drawer by Admin`,
        date: new Date().toISOString().split('T')[0],
        cashierId: user?.id || 1,
        shiftId: activeShift?.id || null
      }
      
      await db.expenses.add(dropExpense)
      
      if (activeShift) {
        const { recordShiftExpense } = useAuthStore.getState()
        await recordShiftExpense(amount)
      }
      
      setDropModal(false)
      setDropAmount('')
      alert(`Successfully dropped ${formatCurrency(amount, currency)} to central safe!`)
    } catch (err) {
      console.error(err)
    }
  }

  // JSON Database Export/Backup
  const handleExportBackup = async () => {
    try {
      const backup = {}
      const tables = ['products', 'categories', 'orders', 'orderItems', 'customers', 'users', 'settings', 'expenses', 'shifts']
      
      for (const t of tables) {
        backup[t] = await db[t].toArray()
      }

      const jsonStr = JSON.stringify(backup, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `nexuspos_backup_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(`Backup Failed: ${err.message}`)
    }
  }

  // JSON Database Restore
  const handleImportBackup = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!confirm('WARNING: Restoring database will overwrite all your current products, orders, settings, and shift logs. Do you wish to proceed?')) {
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result)
        const tables = ['products', 'categories', 'orders', 'orderItems', 'customers', 'users', 'settings', 'expenses', 'shifts']

        for (const t of tables) {
          if (data[t] && Array.isArray(data[t])) {
            await db[t].clear()
            await db[t].bulkAdd(data[t])
          }
        }

        alert('Database successfully restored! Nexus POS is restarting to reload all records.')
        window.location.reload()
      } catch (err) {
        alert(`Restore Failed. Ensure the JSON file structure is valid. Error: ${err.message}`)
      }
    }
    reader.readAsText(file)
  }

  // Gated Authentication Panel check
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-md w-full p-6 text-center space-y-6">
          <div className="w-16 h-16 bg-navy-100 text-navy-800 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert size={32} />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900">Admin Authentication Required</h2>
            <p className="text-sm text-gray-500">
              Access to this console requires elevated admin privileges. Enter the admin PIN to authorize this session.
            </p>
          </div>
          <form onSubmit={handleAdminGateLogin} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter Admin Pin"
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
              Verify Credentials
            </Button>
          </form>
          <div className="text-[10px] text-gray-400">
            Powered by BitBridge Technologies POS Suite
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in py-2">
      {/* Drawer Safe Alert drop-down banner */}
      {isDrawerOverLimit && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <AlertTriangle size={24} className="text-white" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Critical Safety Limit: Cash Drawer Safe Drop Required</h4>
              <p className="text-xs text-white/90">
                Register drawer has cash totaling <strong className="underline">{formatCurrency(currentDrawerCash, currency)}</strong>, exceeding safety threshold limit of <strong>{formatCurrency(drawerCashLimit, currency)}</strong>.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDropModal(true)}
            icon={Coins}
            className="bg-white text-orange-600 hover:bg-orange-50 self-end sm:self-center"
          >
            Perform Safe Cash Drop
          </Button>
        </div>
      )}

      {/* Admin Title Board */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-gray-900">Admin Control Center</h2>
            <Badge variant="success">Administrator Session</Badge>
          </div>
          <p className="text-sm text-gray-500">Oversee shift cash drawer allocations, employee PIN registers, database backups, and overhead logs.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAdminAuth}
            className="text-red-500 border-red-200 hover:bg-red-50"
          >
            Lock Terminal
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Direct Revenue', value: formatCurrency(kpis.totalRev, currency), icon: DollarSign, color: 'bg-blue-50 text-blue-600' },
          { label: 'Direct Expenses (Est)', value: formatCurrency(kpis.totalExp, currency), icon: TrendingDown, color: 'bg-rose-50 text-rose-500' },
          { label: 'Direct Net Yield', value: formatCurrency(kpis.netProfit, currency), icon: Wallet, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Shift Drawer Variances', value: `${kpis.varianceCount} shifts (${formatCurrency(kpis.varianceSum, currency)})`, icon: Activity, color: kpis.varianceSum < 0 ? 'bg-amber-50 text-amber-500' : 'bg-purple-50 text-purple-600' },
        ].map((kpi, idx) => (
          <Card key={idx}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-400">{kpi.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.color}`}>
                <kpi.icon size={16} />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold text-gray-900 truncate">{kpi.value}</div>
          </Card>
        ))}
      </div>

      {/* Internal Tabs Panel */}
      <div className="flex border-b border-gray-200 gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Financial Sync Overview', icon: BarChart2 },
          { id: 'shifts', label: 'Cashier Shift Audit Logs', icon: Calendar },
          { id: 'expenses', label: 'Overhead Costs Ledger', icon: TrendingDown },
          { id: 'employees', label: 'Employee PIN Registers', icon: Users2 },
          { id: 'backup', label: 'Local Backup & Restore', icon: RefreshCw }
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-semibold text-sm transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? 'border-navy-800 text-navy-800'
                  : 'border-transparent text-gray-500 hover:text-gray-950 hover:border-gray-300'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Main Tab Render Panels */}
      <div className="space-y-6">
        {/* Tab 1: Financial Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Chart Area */}
            <Card className="lg:col-span-2">
              <CardHeader title="Revenue vs Expense Matrix" subtitle="Aggregated comparison trends including standard COGS and logged overheads." />
              <div className="h-64 sm:h-80 w-full mt-4">
                {chartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-gray-400">
                    No transaction entries recorded yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={v => formatCurrency(v, currency)} contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar name="Direct Revenue" dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      <Bar name="Estimated Expenses" dataKey="expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Quick Actions Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader title="Current Cash Drawer Allocation" subtitle="Real-time shift tracker" />
                <div className="space-y-4">
                  {activeShift ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <span className="text-xs text-gray-500 font-semibold">Active Cashier:</span>
                        <span className="text-sm font-bold text-gray-800">{activeShift.openedBy}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Starting Cash drawer:</span>
                        <span className="text-xs font-mono font-bold text-gray-700">{formatCurrency(activeShift.startingCash, currency)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Shift Cash Sales:</span>
                        <span className="text-xs font-mono font-bold text-emerald-600">+{formatCurrency(activeShift.cashSales, currency)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Shift Paid-Out Expenses:</span>
                        <span className="text-xs font-mono font-bold text-rose-500">-{formatCurrency(activeShift.expenses, currency)}</span>
                      </div>
                      <div className="border-t border-dashed border-gray-200 my-2 pt-2 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-800">Theoretical Drawer Cash:</span>
                        <span className="text-sm font-mono font-bold text-navy-800">{formatCurrency(currentDrawerCash, currency)}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isDrawerOverLimit ? 'bg-rose-500' : 'bg-navy-800'
                          }`}
                          style={{ width: `${Math.min(100, (currentDrawerCash / drawerCashLimit) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                        <span>Limit: {formatCurrency(drawerCashLimit, currency)}</span>
                        <span>{Math.round((currentDrawerCash / drawerCashLimit) * 100)}% filled</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <ShieldAlert className="text-gray-400 mx-auto mb-2" size={24} />
                      <p className="text-xs text-gray-500">No shift currently active. Register is closed.</p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="bg-navy-900 text-white border-0 shadow-lg">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-blue-300">BitBridge Technologies</h3>
                    <p className="text-[11px] text-blue-100/70 mt-1 leading-relaxed">
                      This POS module runs state-of-the-art indexed transaction caches. All databases are synced instantly offline, and uploaded to the centralized backend API automatically when internet is available.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    <span>Database Engine Secured</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 2: Shift Auditing */}
        {activeTab === 'shifts' && (
          <Card className="animate-fade-in">
            <CardHeader
              title="Cashier Shift Session Audit Registers"
              subtitle="Audit cashier sessions, verified physical counts, and ledger discrepancies."
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 font-bold text-xs">
                    <th className="py-3 px-4">Shift ID</th>
                    <th className="py-3 px-4">Opened By</th>
                    <th className="py-3 px-4">Opened At</th>
                    <th className="py-3 px-4">Closed At</th>
                    <th className="py-3 px-4 text-right">Starting Drawer</th>
                    <th className="py-3 px-4 text-right">Total Sales (Cash/Mpesa/Card)</th>
                    <th className="py-3 px-4 text-right">Expected Drawer Cash</th>
                    <th className="py-3 px-4 text-right">Verified Cash Count</th>
                    <th className="py-3 px-4 text-center">Variance Summary</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allShifts.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center py-8 text-gray-400 text-xs">No cashier shift records logged in the database.</td>
                    </tr>
                  ) : (
                    allShifts.map(s => {
                      const salesSum = (s.cashSales || 0) + (s.mpesaSales || 0) + (s.cardSales || 0)
                      const variance = (s.actualCash || 0) - (s.expectedCash || 0)
                      const hasVariance = s.status === 'closed' && Math.abs(variance) > 1

                      return (
                        <tr key={s.id} className="hover:bg-gray-50/50">
                          <td className="py-3 px-4 font-bold text-gray-700">#SH-{s.id}</td>
                          <td className="py-3 px-4 font-semibold text-gray-900">{s.openedBy}</td>
                          <td className="py-3 px-4 text-xs text-gray-400">{formatDate(new Date(s.openedAt))}</td>
                          <td className="py-3 px-4 text-xs text-gray-400">{s.closedAt ? formatDate(new Date(s.closedAt)) : 'Active Session'}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-gray-700">{formatCurrency(s.startingCash, currency)}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="font-mono font-bold text-gray-900">{formatCurrency(salesSum, currency)}</div>
                            <div className="text-[10px] text-gray-400">
                              c:{formatCurrency(s.cashSales || 0, currency)} | m:{formatCurrency(s.mpesaSales || 0, currency)}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-gray-800">{formatCurrency(s.expectedCash, currency)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-gray-800">{s.status === 'closed' ? formatCurrency(s.actualCash, currency) : '--'}</td>
                          <td className="py-3 px-4 text-center">
                            {s.status === 'closed' ? (
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                hasVariance 
                                  ? variance < 0 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600' 
                                  : 'bg-emerald-50 text-emerald-600'
                              }`}>
                                {variance === 0 
                                  ? 'Balanced' 
                                  : `${variance > 0 ? '+' : ''}${formatCurrency(variance, currency)}`
                                }
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs italic">ongoing</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={s.status === 'open' ? 'success' : 'secondary'}>
                              {s.status === 'open' ? 'Active' : 'Closed'}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 3: Overhead Ledger */}
        {activeTab === 'expenses' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Expense ledger list */}
            <Card className="lg:col-span-2">
              <CardHeader
                title="Business Overhead Costs & Expenses"
                subtitle="Record business cost overheads such as utility bills, rents, payroll, and drops."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setExpenseModal(true)}
                    icon={Plus}
                  >
                    Log Overhead Cost
                  </Button>
                }
              />
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 font-bold text-xs">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allExpenses.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-6 text-gray-400 text-xs">No overhead expenses recorded yet.</td>
                      </tr>
                    ) : (
                      allExpenses.map(e => (
                        <tr key={e.id} className="hover:bg-gray-50/50">
                          <td className="py-3 px-3 text-xs text-gray-500">{e.date}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 capitalize">
                              {e.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-xs text-gray-600 max-w-[200px] truncate">{e.description}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-rose-500">{formatCurrency(e.amount, currency)}</td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => handleDeleteExpense(e.id)}
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Quick breakdowns card */}
            <Card>
              <CardHeader title="Operating Expense Shares" subtitle="Visual share breakdown" />
              <div className="space-y-4">
                {allExpenses.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400">No data to compile.</div>
                ) : (
                  (() => {
                    const catMap = {}
                    allExpenses.forEach(e => {
                      catMap[e.category] = (catMap[e.category] || 0) + e.amount
                    })
                    const total = Object.values(catMap).reduce((s, a) => s + a, 0)
                    
                    return (
                      <div className="space-y-4">
                        <div className="text-center py-3 bg-gray-50 border border-gray-100 rounded-2xl">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Logged Overheads</span>
                          <span className="text-xl font-bold text-rose-500">{formatCurrency(total, currency)}</span>
                        </div>
                        <div className="space-y-3">
                          {Object.entries(catMap).map(([cat, amt]) => {
                            const pct = total > 0 ? (amt / total) * 100 : 0
                            return (
                              <div key={cat} className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold text-gray-600">
                                  <span>{cat}</span>
                                  <span className="font-mono">{formatCurrency(amt, currency)} ({pct.toFixed(0)}%)</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-rose-500 h-full rounded-full"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })()
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Tab 4: Employee Registers */}
        {activeTab === 'employees' && (
          <Card className="animate-fade-in">
            <CardHeader
              title="Employee Pin & Credential Registers"
              subtitle="Create, configure, and override credentials/PIN codes for cashiers, managers, and system administrators."
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setEmployeeModal(true)}
                  icon={Plus}
                >
                  Register Employee
                </Button>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 font-bold text-xs">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email Account</th>
                    <th className="py-3 px-4">Role Permission</th>
                    <th className="py-3 px-4 text-center">Login PIN Override</th>
                    <th className="py-3 px-4 text-center">Access Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/50">
                      <td className="py-3.5 px-4 font-bold text-gray-800">{u.name}</td>
                      <td className="py-3.5 px-4 text-gray-500 text-xs">{u.email}</td>
                      <td className="py-3.5 px-4 capitalize">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.role === 'admin' ? 'bg-navy-800 text-white' : u.role === 'manager' ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-gray-800 tracking-wider">
                        {u.pin}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleUser(u.id, u.active)}
                          className="focus:outline-none transition-transform hover:scale-105"
                          title={u.active ? 'Block account access' : 'Authorize account access'}
                        >
                          {u.active ? (
                            <div className="flex items-center justify-center gap-1.5 text-emerald-600 font-semibold text-xs">
                              <ShieldCheck size={16} />
                              <span>Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5 text-red-500 font-semibold text-xs">
                              <ShieldAlert size={16} />
                              <span>Disabled</span>
                            </div>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 5: Backup & Restore */}
        {activeTab === 'backup' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* Export Backups */}
            <Card className="p-6 flex flex-col justify-between gap-6 border border-gray-100">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Download size={22} />
                </div>
                <h3 className="font-bold text-base text-gray-900">Database JSON Export Tool</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Generate a downloadable JSON package containing all indexed customer logs, products database, tax details, logged overhead expenses, and cashier register shifts.
                </p>
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 text-[10px] text-blue-700 leading-normal">
                  <strong>Recommended Schedule:</strong> Perform weekly backups to preserve business ledgers locally in an isolated hardware safe.
                </div>
              </div>
              <Button
                variant="primary"
                onClick={handleExportBackup}
                icon={Download}
                fullWidth
              >
                Compile and Download Backup
              </Button>
            </Card>

            {/* Restore database */}
            <Card className="p-6 flex flex-col justify-between gap-6 border border-gray-100">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-amber-50/75 text-amber-600 rounded-2xl flex items-center justify-center">
                  <Upload size={22} />
                </div>
                <h3 className="font-bold text-base text-gray-900">Database Restoration Tool</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Restore or import a prior saved `.json` database file package into this browser's IndexedDB environment.
                </p>
                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-[10px] text-amber-700 leading-normal">
                  <strong>CRITICAL WARNING:</strong> Restoring database will entirely clear and replace all active product catalogs, customer points lists, and order ledgers.
                </div>
              </div>
              
              <label className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-navy-800 bg-gray-50 hover:bg-white rounded-xl py-3 px-4 text-xs font-bold text-gray-600 cursor-pointer transition-all duration-200">
                <Upload size={16} />
                <span>Upload prior backup JSON file</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </Card>
          </div>
        )}
      </div>

      {/* Expense Modal */}
      <Modal
        isOpen={expenseModal}
        onClose={() => setExpenseModal(false)}
        title="Record Overhead Expense"
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Expense Category</label>
            <select
              value={expenseCategory}
              onChange={e => setExpenseCategory(e.target.value)}
              className="w-full py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm px-3 focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
            >
              <option value="Utilities">Utilities (Water, Power, Net)</option>
              <option value="Salaries">Employee Salaries / Payroll</option>
              <option value="Rent">Store Rental costs</option>
              <option value="Logistics">Transport & Delivery</option>
              <option value="Supplies">Operating Supplies</option>
              <option value="Safe Cash Drop">Safe Cash Drop</option>
              <option value="Other">Other Miscellaneous</option>
            </select>
          </div>

          <Input
            label={`Amount (${currency})`}
            type="number"
            min="1"
            placeholder="e.g. 5000"
            value={expenseAmount}
            onChange={e => setExpenseAmount(e.target.value)}
            required
            icon={Coins}
          />

          <Input
            label="Transaction Description"
            placeholder="e.g. Paid KPLC tokens for May 2026"
            value={expenseDesc}
            onChange={e => setExpenseDesc(e.target.value)}
            required
          />

          <Input
            label="Transaction Date"
            type="date"
            value={expenseDate}
            onChange={e => setExpenseDate(e.target.value)}
            required
          />

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setExpenseModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Log Transaction
            </Button>
          </div>
        </form>
      </Modal>

      {/* Employee Modal */}
      <Modal
        isOpen={employeeModal}
        onClose={() => setEmployeeModal(false)}
        title="Register Employee Account"
      >
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Samuel K. BitBridge"
            value={empName}
            onChange={e => setEmpName(e.target.value)}
            required
          />

          <Input
            label="Email Account"
            type="email"
            placeholder="e.g. sam@nexuspos.com"
            value={empEmail}
            onChange={e => setEmpEmail(e.target.value)}
            required
          />

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">System Access Role</label>
            <select
              value={empRole}
              onChange={e => setEmpRole(e.target.value)}
              className="w-full py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm px-3 focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
            >
              <option value="cashier">Cashier Operator</option>
              <option value="manager">Store Manager</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>

          <Input
            label="Authorized PIN"
            placeholder="e.g. 2548"
            value={empPin}
            onChange={e => setEmpPin(e.target.value)}
            required
            icon={Key}
          />

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEmployeeModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Register Employee
            </Button>
          </div>
        </form>
      </Modal>

      {/* Safe Drawer drop cash modal */}
      <Modal
        isOpen={dropModal}
        onClose={() => setDropModal(false)}
        title="Perform Cash Drop to Safe"
      >
        <form onSubmit={handleSafeDrop} className="space-y-4">
          <p className="text-xs text-gray-500 leading-normal">
            Drop excess cashier drawer physical cash to the central admin safe. This will record a paid-out cash drop transaction, reducing the active drawer balance.
          </p>

          <Input
            label={`Drop Amount (${currency})`}
            type="number"
            min="1"
            max={currentDrawerCash}
            placeholder={`e.g. ${Math.min(10000, currentDrawerCash)}`}
            value={dropAmount}
            onChange={e => setDropAmount(e.target.value)}
            required
            icon={Coins}
            hint={`Current theoretical drawer balance is ${formatCurrency(currentDrawerCash, currency)}`}
          />

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDropModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="warning"
              icon={Coins}
            >
              Confirm Drawer Drop
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
