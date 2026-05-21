import { clsx } from 'clsx'

const variants = {
  primary:   'bg-navy-800 hover:bg-navy-700 text-white shadow-sm',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  success:   'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm',
  danger:    'bg-red-500 hover:bg-red-600 text-white shadow-sm',
  warning:   'bg-amber-500 hover:bg-amber-600 text-white shadow-sm',
  ghost:     'hover:bg-gray-100 text-gray-600',
  outline:   'border border-gray-200 hover:bg-gray-50 text-gray-700',
  'outline-primary': 'border border-navy-800 text-navy-800 hover:bg-navy-50',
}

const sizes = {
  xs:  'px-2.5 py-1 text-xs rounded-lg',
  sm:  'px-3.5 py-1.5 text-sm rounded-xl',
  md:  'px-5 py-2.5 text-sm rounded-xl',
  lg:  'px-6 py-3 text-base rounded-xl',
  xl:  'px-8 py-4 text-base rounded-2xl',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  icon: Icon,
  iconRight: IconRight,
  fullWidth = false,
  ...props
}) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-navy-800/30',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : Icon ? (
        <Icon size={size === 'xs' ? 12 : size === 'sm' ? 14 : 16} />
      ) : null}
      {children}
      {IconRight && !loading && <IconRight size={16} />}
    </button>
  )
}
