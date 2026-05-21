import { clsx } from 'clsx'

export default function Card({ children, className = '', hover = false, onClick, padding = 'p-5' }) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-2xl shadow-card',
        padding,
        hover && 'hover:shadow-card-hover transition-shadow duration-200 cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={clsx('flex items-center justify-between mb-4', className)}>
      <div>
        <h3 className="font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
