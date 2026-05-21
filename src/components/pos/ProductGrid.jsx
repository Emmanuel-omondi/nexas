import { clsx } from 'clsx'
import { Plus, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import { useSettingsStore } from '../../store/settingsStore'

const categoryColors = {
  'Food & Beverage': 'from-orange-400 to-orange-500',
  'Groceries':       'from-green-400 to-green-500',
  'Electronics':     'from-blue-400 to-blue-500',
  'Clothing':        'from-purple-400 to-purple-500',
  'Hotel Services':  'from-pink-400 to-pink-500',
  'Beverages':       'from-cyan-400 to-cyan-500',
  'Bakery':          'from-amber-400 to-amber-500',
  'Pharmacy':        'from-red-400 to-red-500',
}

const categoryEmoji = {
  'Food & Beverage': '🍽️',
  'Groceries':       '🛒',
  'Electronics':     '📱',
  'Clothing':        '👕',
  'Hotel Services':  '🏨',
  'Beverages':       '☕',
  'Bakery':          '🥐',
  'Pharmacy':        '💊',
}

export default function ProductGrid({ products, onAdd, cartItems }) {
  const { settings } = useSettingsStore()

  const getCartQty = (id) => {
    const item = cartItems.find(i => i.id === id)
    return item ? item.quantity : 0
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400">
        <AlertTriangle size={32} className="mb-2 opacity-50" />
        <p className="text-sm">No products found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {products.map(product => {
        const qty = getCartQty(product.id)
        const gradient = categoryColors[product.category] || 'from-gray-400 to-gray-500'
        const emoji = categoryEmoji[product.category] || '📦'
        const lowStock = product.stock <= 10 && product.stock > 0
        const outOfStock = product.stock === 0

        return (
          <button
            key={product.id}
            onClick={() => !outOfStock && onAdd(product)}
            disabled={outOfStock}
            className={clsx(
              'relative bg-white rounded-2xl shadow-card text-left transition-all duration-200 overflow-hidden group',
              outOfStock
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:shadow-card-hover hover:-translate-y-0.5 active:scale-95 cursor-pointer'
            )}
          >
            {/* Color header */}
            <div className={clsx(
              'h-20 bg-gradient-to-br flex items-center justify-center text-3xl',
              gradient
            )}>
              {emoji}
              {qty > 0 && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-navy-800 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {qty}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-3">
              <p className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2 mb-1">
                {product.name}
              </p>
              <p className="text-xs text-gray-400 mb-2">{product.unit}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-navy-800">
                  {formatCurrency(product.price, settings.currency)}
                </span>
                {lowStock && (
                  <span className="text-[10px] text-amber-500 font-semibold">Low stock</span>
                )}
                {outOfStock && (
                  <span className="text-[10px] text-red-500 font-semibold">Out of stock</span>
                )}
              </div>
            </div>

            {/* Add overlay */}
            {!outOfStock && (
              <div className="absolute inset-0 bg-navy-800/0 group-hover:bg-navy-800/5 transition-colors duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-navy-800 text-white rounded-full p-1.5 shadow-lg">
                  <Plus size={14} />
                </div>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
