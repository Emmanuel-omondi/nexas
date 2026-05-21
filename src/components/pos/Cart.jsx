import { Trash2, Plus, Minus, ShoppingCart, Tag, User } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import { useCartStore } from '../../store/cartStore'
import { useSettingsStore } from '../../store/settingsStore'
import { formatCurrency } from '../../utils/formatters'
import Button from '../ui/Button'

export default function Cart({ onCheckout }) {
  const cart = useCartStore()
  const { settings } = useSettingsStore()
  const currency = settings?.currency || 'KES'
  const customers = useLiveQuery(() => db.customers.toArray(), []) || []

  const subtotal  = cart.getSubtotal()
  const discount  = cart.getDiscountAmount()
  const tax       = cart.getTaxAmount()
  const total     = cart.getTotal()
  const itemCount = cart.getItemCount()

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <ShoppingCart size={18} className="text-navy-800" />
          <span className="font-bold text-gray-900">Current Order</span>
          {itemCount > 0 && (
            <span className="bg-navy-800 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {itemCount}
            </span>
          )}
        </div>
        {cart.items.length > 0 && (
          <button
            onClick={cart.clearCart}
            className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {cart.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 py-12">
            <ShoppingCart size={40} className="mb-3 opacity-50" />
            <p className="text-sm font-medium">Cart is empty</p>
            <p className="text-xs mt-1">Tap a product to add it</p>
          </div>
        ) : (
          cart.items.map(item => (
            <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              {/* Color dot */}
              <div className="w-8 h-8 rounded-lg bg-navy-100 flex items-center justify-center flex-shrink-0 text-sm">
                {item.name.charAt(0)}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                <p className="text-xs text-gray-400">{formatCurrency(item.price, currency)} / {item.unit}</p>
              </div>
              {/* Qty controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => cart.updateQuantity(item.id, item.quantity - 1)}
                  className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <Minus size={12} />
                </button>
                <span className="w-6 text-center text-sm font-bold text-gray-800">{item.quantity}</span>
                <button
                  onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}
                  className="w-6 h-6 rounded-lg bg-navy-100 hover:bg-navy-200 flex items-center justify-center transition-colors"
                >
                  <Plus size={12} className="text-navy-800" />
                </button>
              </div>
              {/* Total */}
              <div className="text-right min-w-[60px]">
                <p className="text-sm font-bold text-gray-900">
                  {formatCurrency(item.price * item.quantity, currency)}
                </p>
              </div>
              {/* Remove */}
              <button
                onClick={() => cart.removeItem(item.id)}
                className="p-1 text-gray-300 hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Discount row */}
      {cart.items.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Tag size={14} className="text-gray-400" />
            <span className="text-xs text-gray-500 flex-1">Discount (%)</span>
            <input
              type="number"
              min="0"
              max="100"
              value={cart.discount}
              onChange={e => cart.setDiscount(Number(e.target.value))}
              className="w-16 text-right text-sm font-semibold border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-navy-800"
            />
          </div>
        </div>
      )}

      {/* Customer CRM Selection */}
      {cart.items.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <User size={14} className="text-gray-400" />
            <span className="text-xs text-gray-500 flex-1">Customer CRM</span>
            <select
              value={cart.customerId || ''}
              onChange={e => cart.setCustomer(e.target.value ? Number(e.target.value) : null)}
              className="text-xs font-semibold border border-gray-200 bg-white rounded-lg px-2 py-1 focus:outline-none focus:border-navy-800 max-w-[180px] truncate"
            >
              <option value="">Walk-in Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone || 'No phone'})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Store Type Custom Adaptations */}
      {cart.items.length > 0 && settings?.storeType === 'Food Store' && (
        <div className="px-4 py-2 border-t border-gray-100 bg-orange-50/30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-orange-700 flex-1">Table Number</span>
            <select
              value={cart.tableNumber || ''}
              onChange={e => cart.setTableNumber(e.target.value)}
              className="text-xs font-semibold border border-orange-200 bg-white rounded-lg px-2 py-1 focus:outline-none focus:border-orange-500"
            >
              <option value="">Select Table</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'Takeaway', 'Delivery'].map(t => (
                <option key={t} value={t === 'Takeaway' || t === 'Delivery' ? t : `Table ${t}`}>
                  {t === 'Takeaway' || t === 'Delivery' ? t : `Table ${t}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {cart.items.length > 0 && settings?.storeType === 'Hotel' && (
        <div className="px-4 py-2 border-t border-gray-100 bg-pink-50/30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-pink-700 flex-1">Room Assignment</span>
            <input
              type="text"
              placeholder="e.g. Room 104"
              value={cart.roomNumber || ''}
              onChange={e => cart.setRoomNumber(e.target.value)}
              className="w-28 text-right text-xs font-semibold border border-pink-200 rounded-lg px-2 py-1 focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>
      )}

      {/* Totals */}
      {cart.items.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 space-y-1.5">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal, currency)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-emerald-600">
              <span>Discount</span>
              <span>-{formatCurrency(discount, currency)}</span>
            </div>
          )}
          {settings?.taxEnabled && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>Tax ({settings?.taxRate}%)</span>
              <span>{formatCurrency(tax, currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base text-gray-900 pt-1.5 border-t border-gray-200">
            <span>Total</span>
            <span className="text-navy-800">{formatCurrency(total, currency)}</span>
          </div>
        </div>
      )}

      {/* Checkout */}
      <div className="p-4 border-t border-gray-100">
        <Button
          fullWidth
          size="lg"
          onClick={onCheckout}
          disabled={cart.items.length === 0}
          className="text-base"
        >
          Charge {cart.items.length > 0 ? formatCurrency(total, currency) : ''}
        </Button>
      </div>
    </div>
  )
}
