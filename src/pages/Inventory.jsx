import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { formatCurrency } from '../utils/formatters'
import { useSettingsStore } from '../store/settingsStore'
import { useAuthStore } from '../store/authStore'
import { AlertTriangle, TrendingDown, Package, Plus, Minus, Search, History } from 'lucide-react'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'

function AdjustModal({ product, onClose }) {
  const [qty, setQty]     = useState('')
  const [type, setType]   = useState('add')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const { user } = useAuthStore()

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const delta = type === 'add' ? Number(qty) : -Number(qty)
    const newStock = Math.max(0, product.stock + delta)
    await db.products.update(product.id, { stock: newStock })
    await db.stockMovements.add({
      productId: product.id,
      productName: product.name,
      type,
      quantity: Number(qty),
      reason,
      date: new Date().toISOString(),
      userId: user?.id || null,
      userName: user?.name || 'Unknown Operator',
    })
    onClose()
    setSaving(false)
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="font-semibold text-gray-800">{product.name}</p>
        <p className="text-sm text-gray-500">Current stock: <strong>{product.stock} {product.unit}</strong></p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => setType('add')}
          className={`py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${type === 'add' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <Plus size={16} /> Add Stock
        </button>
        <button type="button" onClick={() => setType('remove')}
          className={`py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${type === 'remove' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <Minus size={16} /> Remove Stock
        </button>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">Quantity</label>
        <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} required
          className="input-field text-center text-xl font-bold" placeholder="0" />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">Reason</label>
        <input value={reason} onChange={e => setReason(e.target.value)}
          className="input-field" placeholder="Restock, damage, return..." />
      </div>
      <Button type="submit" fullWidth loading={saving}>Save Adjustment</Button>
    </form>
  )
}

export default function Inventory() {
  const { settings } = useSettingsStore()
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('all')
  const [adjusting, setAdj]   = useState(null)

  const products = useLiveQuery(() => db.products.toArray(), [])
  const movements = useLiveQuery(() => db.stockMovements.reverse().limit(25).toArray(), []) || []

  const filtered = (products || []).filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    if (filter === 'low')  return matchSearch && p.stock > 0 && p.stock <= 10
    if (filter === 'out')  return matchSearch && p.stock === 0
    if (filter === 'ok')   return matchSearch && p.stock > 10
    return matchSearch
  })

  const stats = {
    total:    (products || []).length,
    low:      (products || []).filter(p => p.stock > 0 && p.stock <= 10).length,
    out:      (products || []).filter(p => p.stock === 0).length,
    value:    (products || []).reduce((s, p) => s + p.cost * p.stock, 0),
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-black text-gray-900">Inventory</h2>
        <p className="text-sm text-gray-500">Track and manage your stock levels</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: stats.total, icon: Package, color: 'bg-blue-50 text-blue-600' },
          { label: 'Low Stock',      value: stats.low,   icon: AlertTriangle, color: 'bg-amber-50 text-amber-600' },
          { label: 'Out of Stock',   value: stats.out,   icon: TrendingDown,  color: 'bg-red-50 text-red-600' },
          { label: 'Stock Value',    value: formatCurrency(stats.value, settings.currency), icon: Package, color: 'bg-emerald-50 text-emerald-600' },
        ].map((s, i) => (
          <Card key={i}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div className="text-xl font-black text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card padding="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy-800" />
          </div>
          {[['all','All'],['ok','In Stock'],['low','Low Stock'],['out','Out of Stock']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filter === v ? 'bg-navy-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {l}
            </button>
          ))}
        </div>
      </Card>

      {/* Table */}
      <Card padding="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Product</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Category</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-3 py-3">Stock</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-3 py-3">Cost Price</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-3 py-3">Stock Value</th>
                <th className="text-center text-xs font-semibold text-gray-500 px-3 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Adjust</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-navy-100 rounded-lg flex items-center justify-center">
                        <Package size={14} className="text-navy-800" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-600">{p.category}</td>
                  <td className="px-3 py-3 text-right">
                    <span className={`text-sm font-bold ${p.stock === 0 ? 'text-red-500' : p.stock <= 10 ? 'text-amber-500' : 'text-gray-800'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-sm text-gray-600">{formatCurrency(p.cost, settings.currency)}</td>
                  <td className="px-3 py-3 text-right text-sm font-semibold text-gray-800">
                    {formatCurrency(p.cost * p.stock, settings.currency)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Badge variant={p.stock === 0 ? 'danger' : p.stock <= 10 ? 'warning' : 'success'} dot>
                      {p.stock === 0 ? 'Out of stock' : p.stock <= 10 ? 'Low stock' : 'In stock'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button size="xs" variant="outline" onClick={() => setAdj(p)}>Adjust</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Stock Movement History */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <History size={18} className="text-navy-800" />
          <h3 className="text-lg font-bold text-gray-900">Stock Movement History</h3>
        </div>
        <Card padding="p-0">
          <div className="overflow-x-auto">
            {movements.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">
                No stock adjustments logged yet. Adjust items above to see history.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Date</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Product</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Type</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-3 py-3">Qty</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Reason</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Adjusted By</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map(m => (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors text-sm">
                      <td className="px-5 py-3 text-gray-500 font-mono text-xs">
                        {new Date(m.date).toLocaleString()}
                      </td>
                      <td className="px-3 py-3 font-semibold text-gray-800">
                        {m.productName || `Product ID: ${m.productId}`}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={m.type === 'add' ? 'success' : 'danger'}>
                          {m.type === 'add' ? 'Added' : 'Removed'}
                        </Badge>
                      </td>
                      <td className={`px-3 py-3 text-right font-bold ${m.type === 'add' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {m.type === 'add' ? '+' : '-'}{m.quantity}
                      </td>
                      <td className="px-3 py-3 text-gray-600 italic">
                        {m.reason || 'None specified'}
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-700">
                        {m.userName || 'Unknown'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      <Modal isOpen={!!adjusting} onClose={() => setAdj(null)} title="Adjust Stock" size="sm">
        {adjusting && <AdjustModal product={adjusting} onClose={() => setAdj(null)} />}
      </Modal>
    </div>
  )
}
