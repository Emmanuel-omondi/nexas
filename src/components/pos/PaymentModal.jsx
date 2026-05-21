import { useState } from 'react'
import { Banknote, Smartphone, CreditCard, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { formatCurrency } from '../../utils/formatters'
import { useSettingsStore } from '../../store/settingsStore'

const METHODS = [
  { id: 'cash',  label: 'Cash',   icon: Banknote,    color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { id: 'mpesa', label: 'M-Pesa', icon: Smartphone,  color: 'text-green-600',   bg: 'bg-green-50',   border: 'border-green-200' },
  { id: 'card',  label: 'Card',   icon: CreditCard,  color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200' },
]

export default function PaymentModal({ isOpen, onClose, total, onConfirm }) {
  const { settings } = useSettingsStore()
  const currency = settings?.currency || 'KES'

  const [method, setMethod]       = useState('cash')
  const [step, setStep]           = useState('method') // method | details | processing | done
  const [cashAmount, setCashAmount] = useState('')
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [mpesaRef, setMpesaRef]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const change = method === 'cash' ? Math.max(0, Number(cashAmount) - total) : 0

  const reset = () => {
    setMethod('cash'); setStep('method')
    setCashAmount(''); setMpesaPhone(''); setMpesaRef('')
    setLoading(false); setError('')
  }

  const handleClose = () => { reset(); onClose() }

  const handleProceed = () => {
    setError('')
    if (method === 'cash') {
      if (!cashAmount || Number(cashAmount) < total) {
        setError('Amount must be at least ' + formatCurrency(total, currency))
        return
      }
    }
    if (method === 'mpesa') {
      if (!mpesaPhone || mpesaPhone.length < 9) {
        setError('Enter a valid M-Pesa phone number')
        return
      }
    }
    setStep('processing')
    setLoading(true)

    // Simulate payment processing
    setTimeout(() => {
      if (method === 'mpesa') {
        setMpesaRef('QHG' + Math.floor(Math.random() * 9000000 + 1000000))
      }
      setLoading(false)
      setStep('done')
    }, method === 'mpesa' ? 2500 : 800)
  }

  const handleConfirm = () => {
    onConfirm({
      method,
      amountPaid: method === 'cash' ? Number(cashAmount) : total,
      change,
      mpesaPhone: method === 'mpesa' ? mpesaPhone : null,
      mpesaRef:   method === 'mpesa' ? mpesaRef : null,
    })
    reset()
  }

  const quickAmounts = [total, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500, Math.ceil(total / 1000) * 1000]
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 4)

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Payment" size="sm">
      {/* Total */}
      <div className="bg-navy-800 rounded-2xl p-5 text-center mb-5">
        <p className="text-blue-200 text-sm mb-1">Amount Due</p>
        <p className="text-white text-3xl font-bold">{formatCurrency(total, currency)}</p>
      </div>

      {/* Step: Method */}
      {step === 'method' && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-gray-700">Select Payment Method</p>
          <div className="grid grid-cols-3 gap-3">
            {METHODS.map(m => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                  method === m.id
                    ? `${m.bg} ${m.border} ${m.color}`
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <m.icon size={22} />
                <span className="text-xs font-semibold">{m.label}</span>
              </button>
            ))}
          </div>

          {/* Cash input */}
          {method === 'cash' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Cash Received</label>
              <input
                type="number"
                value={cashAmount}
                onChange={e => setCashAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-3 text-lg font-bold border border-gray-200 rounded-xl focus:outline-none focus:border-navy-800 text-center"
              />
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map(amt => (
                  <button
                    key={amt}
                    onClick={() => setCashAmount(String(amt))}
                    className="py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    {amt.toLocaleString()}
                  </button>
                ))}
              </div>
              {cashAmount && Number(cashAmount) >= total && (
                <div className="flex justify-between items-center bg-emerald-50 rounded-xl px-4 py-3">
                  <span className="text-sm text-emerald-700 font-medium">Change</span>
                  <span className="text-lg font-bold text-emerald-700">{formatCurrency(change, currency)}</span>
                </div>
              )}
            </div>
          )}

          {/* M-Pesa input */}
          {method === 'mpesa' && (
            <div className="space-y-3">
              <div className="bg-green-50 rounded-xl p-3 text-xs text-green-700">
                <p className="font-semibold mb-1">M-Pesa STK Push ({settings?.mpesaEnv || 'sandbox'})</p>
                <p>Type: <strong>{settings?.mpesaType || 'Paybill'}</strong> · No: <strong>{settings?.mpesaPaybill || '174379'}</strong> · Ref: <strong>{settings?.mpesaAccount || 'NEXUSPOS'}</strong></p>
              </div>
              <label className="text-sm font-medium text-gray-700">Customer Phone Number</label>
              <input
                type="tel"
                value={mpesaPhone}
                onChange={e => setMpesaPhone(e.target.value)}
                placeholder="07XX XXX XXX"
                className="w-full px-4 py-3 text-base border border-gray-200 rounded-xl focus:outline-none focus:border-green-500"
              />
            </div>
          )}

          {/* Card */}
          {method === 'card' && (
            <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700 text-center">
              <CreditCard size={24} className="mx-auto mb-2" />
              <p className="font-semibold">Card Payment</p>
              <p className="text-xs mt-1">Present card to the POS terminal</p>
            </div>
          )}

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <Button fullWidth size="lg" onClick={handleProceed}>
            {method === 'mpesa' ? 'Send STK Push' : 'Confirm Payment'}
          </Button>
        </div>
      )}

      {/* Step: Processing */}
      {step === 'processing' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 size={48} className="text-navy-800 animate-spin" />
          <p className="font-semibold text-gray-800">
            {method === 'mpesa' ? 'Sending STK Push...' : 'Processing payment...'}
          </p>
          {method === 'mpesa' && (
            <p className="text-sm text-gray-500 text-center">
              A payment prompt has been sent to <strong>{mpesaPhone}</strong>.<br />
              Ask customer to enter their M-Pesa PIN.
            </p>
          )}
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle2 size={36} className="text-emerald-500" />
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-900 text-lg">Payment Successful</p>
            <p className="text-sm text-gray-500 mt-1">
              {method === 'cash' && `Change: ${formatCurrency(change, currency)}`}
              {method === 'mpesa' && `M-Pesa Ref: ${mpesaRef}`}
              {method === 'card' && 'Card payment approved'}
            </p>
          </div>
          <div className="w-full space-y-2 pt-2">
            <Button fullWidth size="lg" variant="success" onClick={handleConfirm}>
              Complete & Print Receipt
            </Button>
            <Button fullWidth size="md" variant="ghost" onClick={() => { handleConfirm() }}>
              Complete without Receipt
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
