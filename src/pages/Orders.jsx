import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { formatCurrency, formatDateTime } from '../utils/formatters'
import { useSettingsStore } from '../store/settingsStore'
import { Search, Eye, Printer, Banknote, Smartphone, CreditCard, Filter } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { printReceipt } from '../utils/receipt'

const methodIcon = { cash: Banknote, mpesa: Smartphone, card: CreditCard }
const methodColor = { cash: 'default', mpesa: 'success', card: 'primary' }

function OrderDetail({ order, settings }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-gray-500 text-xs mb-1">Order Number</p>
          <p className="font-bold text-gray-900">{order.orderNumber}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-gray-500 text-xs mb-1">Date & Time</p>
          <p className="font-semibold text-gray-800">{formatDateTime(order.createdAt)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-gray-500 text-xs mb-1">Payment Method</p>
          <p className="font-semibold text-gray-800 capitalize">{order.paymentMethod}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-gray-500 text-xs mb-1">Cashier</p>
          <p className="font-semibold text-gray-800">{order.cashierName || 'N/A'}</p>
        </div>
      </div>

      {/* Items */}
      <div>
        <p className="text-sm font-bold text-gray-700 mb-2">Items</p>
        <div className="space-y-2">
          {(order.items || []).map((item, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                <p className="text-xs text-gray-400">{formatCurrency(item.price, settings.currency)} × {item.quantity}</p>
              </div>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(item.price * item.quantity, settings.currency)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="bg-navy-50 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span><span>{formatCurrency(order.subtotal, settings.currency)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-sm text-emerald-600">
            <span>Discount</span><span>-{formatCurrency(order.discount, settings.currency)}</span>
          </div>
        )}
        {order.tax > 0 && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tax</span><span>{formatCurrency(order.tax, settings.currency)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base text-navy-800 pt-2 border-t border-navy-200">
          <span>Total</span><span>{formatCurrency(order.total, settings.currency)}</span>
        </div>
        {order.change > 0 && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Change</span><span>{formatCurrency(order.change, settings.currency)}</span>
          </div>
        )}
        {order.mpesaRef && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>M-Pesa Ref</span><span className="font-mono">{order.mpesaRef}</span>
          </div>
        )}
      </div>

      <Button fullWidth variant="secondary" icon={Printer} onClick={() => printReceipt(order, settings)}>
        Reprint Receipt
      </Button>
    </div>
  )
}

export default function Orders() {
  const { settings } = useSettingsStore()
  const [search, setSearch]   = useState('')
  const [method, setMethod]   = useState('all')
  const [viewing, setViewing] = useState(null)

  const orders = useLiveQuery(() => db.orders.orderBy('createdAt').reverse().toArray(), [])

  const filtered = (orders || []).filter(o => {
    const matchMethod = method === 'all' || o.paymentMethod === method
    const matchSearch = !search || o.orderNumber?.toLowerCase().includes(search.toLowerCase())
    return matchMethod && matchSearch
  })

  const totalRevenue = filtered.reduce((s, o) => s + (o.total || 0), 0)

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900">Orders & Transactions</h2>
          <p className="text-sm text-gray-500">{filtered.length} orders · {formatCurrency(totalRevenue, settings.currency)} total</p>
        </div>
      </div>

      {/* Filters */}
      <Card padding="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order number..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy-800" />
          </div>
          {[['all','All'],['cash','Cash'],['mpesa','M-Pesa'],['card','Card']].map(([v, l]) => (
            <button key={v} onClick={() => setMethod(v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${method === v ? 'bg-navy-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
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
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Order #</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Date & Time</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Payment</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-3 py-3">Total</th>
                <th className="text-center text-xs font-semibold text-gray-500 px-3 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const Icon = methodIcon[o.paymentMethod] || Banknote
                return (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-bold text-gray-900 font-mono">{o.orderNumber}</p>
                      <p className="text-xs text-gray-400">{o.cashierName}</p>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">{formatDateTime(o.createdAt)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <Icon size={14} className="text-gray-500" />
                        <Badge variant={methodColor[o.paymentMethod] || 'default'}>{o.paymentMethod}</Badge>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-bold text-gray-900">
                      {formatCurrency(o.total, settings.currency)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Badge variant="success" dot>Completed</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setViewing(o)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => printReceipt(o, settings)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                          <Printer size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={!!viewing} onClose={() => setViewing(null)} title="Order Details" size="md">
        {viewing && <OrderDetail order={viewing} settings={settings} />}
      </Modal>
    </div>
  )
}
