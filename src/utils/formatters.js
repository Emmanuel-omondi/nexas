export function formatCurrency(amount, currency = 'KES') {
  if (isNaN(amount)) return `${currency} 0.00`
  return `${currency} ${Number(amount).toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function formatDateTime(date) {
  if (!date) return ''
  return new Date(date).toLocaleString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatTime(date) {
  if (!date) return ''
  return new Date(date).toLocaleTimeString('en-KE', {
    hour: '2-digit', minute: '2-digit',
  })
}

export function generateOrderNumber() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `ORD-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${Math.floor(Math.random()*9000)+1000}`
}

export function formatPhone(phone) {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+254${cleaned.slice(1)}`
  }
  if (cleaned.startsWith('254') && cleaned.length === 12) {
    return `+${cleaned}`
  }
  return phone
}

export function truncate(str, len = 30) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '…' : str
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}
