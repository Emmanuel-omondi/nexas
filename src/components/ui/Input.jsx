import { clsx } from 'clsx'
import { forwardRef } from 'react'

const Input = forwardRef(function Input({
  label,
  error,
  hint,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  containerClassName = '',
  ...props
}, ref) {
  return (
    <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon size={16} />
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full py-2.5 bg-gray-50 border rounded-xl text-sm transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800 focus:bg-white',
            'placeholder:text-gray-400',
            Icon ? 'pl-9 pr-4' : 'px-4',
            IconRight ? 'pr-9' : '',
            error ? 'border-red-400 bg-red-50' : 'border-gray-200',
            className
          )}
          {...props}
        />
        {IconRight && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <IconRight size={16} />
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
})

export default Input
