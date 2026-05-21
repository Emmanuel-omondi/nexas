import { clsx } from 'clsx'
import {
  UtensilsCrossed, ShoppingBasket, Cpu, Shirt,
  Hotel, Coffee, Croissant, Pill, LayoutGrid,
} from 'lucide-react'

const iconMap = {
  UtensilsCrossed, ShoppingBasket, Cpu, Shirt,
  Hotel, Coffee, Croissant, Pill,
}

const colorMap = {
  '#f97316': { bg: 'bg-orange-100', text: 'text-orange-600', active: 'bg-orange-500' },
  '#22c55e': { bg: 'bg-green-100',  text: 'text-green-600',  active: 'bg-green-500' },
  '#3b82f6': { bg: 'bg-blue-100',   text: 'text-blue-600',   active: 'bg-blue-500' },
  '#a855f7': { bg: 'bg-purple-100', text: 'text-purple-600', active: 'bg-purple-500' },
  '#ec4899': { bg: 'bg-pink-100',   text: 'text-pink-600',   active: 'bg-pink-500' },
  '#06b6d4': { bg: 'bg-cyan-100',   text: 'text-cyan-600',   active: 'bg-cyan-500' },
  '#f59e0b': { bg: 'bg-amber-100',  text: 'text-amber-600',  active: 'bg-amber-500' },
  '#ef4444': { bg: 'bg-red-100',    text: 'text-red-600',    active: 'bg-red-500' },
}

export default function CategoryFilter({ categories, selected, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {/* All */}
      <button
        onClick={() => onSelect(null)}
        className={clsx(
          'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0',
          selected === null
            ? 'bg-navy-800 text-white shadow-sm'
            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
        )}
      >
        <LayoutGrid size={15} />
        All Items
      </button>

      {categories.map(cat => {
        const Icon = iconMap[cat.icon] || ShoppingBasket
        const colors = colorMap[cat.color] || colorMap['#3b82f6']
        const isActive = selected === cat.name
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.name)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0',
              isActive
                ? `${colors.active} text-white shadow-sm`
                : `bg-white ${colors.text} hover:bg-gray-50 border border-gray-200`
            )}
          >
            <Icon size={15} />
            {cat.name}
          </button>
        )
      })}
    </div>
  )
}
