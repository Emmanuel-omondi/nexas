import { clsx } from 'clsx'
import { Plus, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import { useSettingsStore } from '../../store/settingsStore'

const fallbackCategoryColors = {
  'Food & Beverage': '#f97316',
  'Groceries':       '#22c55e',
  'Electronics':     '#3b82f6',
  'Clothing':        '#a855f7',
  'Hotel Services':  '#ec4899',
  'Beverages':       '#06b6d4',
  'Bakery':          '#f59e0b',
  'Pharmacy':        '#ef4444',
}

const getInitials = (name) => {
  if (!name) return ''
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  const word = words[0]
  if (word.length >= 2) {
    return word.slice(0, 2).toUpperCase()
  }
  return word.slice(0, 1).toUpperCase()
}

export default function ProductGrid({ products, onAdd, cartItems, categories = [] }) {
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
        const catObj = categories.find(c => c.name === product.category)
        const catColor = catObj?.color || fallbackCategoryColors[product.category] || '#6b7280'
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
            <div 
              className="h-20 flex items-center justify-center relative"
              style={{ backgroundColor: `${catColor}15` }}
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm"
                style={{ backgroundColor: catColor }}
              >
                {getInitials(product.name)}
              </div>
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
