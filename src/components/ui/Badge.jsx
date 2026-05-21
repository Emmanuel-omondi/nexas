import { clsx } from 'clsx'

const variants = {
  default:  'bg-gray-100 text-gray-700',
  primary:  'bg-blue-100 text-blue-700',
  success:  'bg-emerald-100 text-emerald-700',
  warning:  'bg-amber-100 text-amber-700',
  danger:   'bg-red-100 text-red-700',
  info:     'bg-cyan-100 text-cyan-700',
  purple:   'bg-purple-100 text-purple-700',
  navy:     'bg-navy-100 text-navy-800',
}

export default function Badge({ children, variant = 'default', className = '', dot = false }) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
      variants[variant],
      className
    )}>
      {dot && (
        <span className={clsx('w-1.5 h-1.5 rounded-full', {
          'bg-gray-500': variant === 'default',
          'bg-blue-500': variant === 'primary',
          'bg-emerald-500': variant === 'success',
          'bg-amber-500': variant === 'warning',
          'bg-red-500': variant === 'danger',
          'bg-cyan-500': variant === 'info',
        })} />
      )}
      {children}
    </span>
  )
}
