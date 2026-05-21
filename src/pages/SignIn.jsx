import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, Mail, Lock, Eye, EyeOff, ArrowRight, Wifi, WifiOff } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useEffect } from 'react'

export default function SignIn() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [email, setEmail]       = useState('cashier@nexuspos.com')
  const [password, setPassword] = useState('pos1234')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [online, setOnline]     = useState(navigator.onLine)

  useEffect(() => {
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorations */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-sm">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl">
            <Store size={38} className="text-white" />
          </div>
          <div>
            <h1 className="text-5xl font-black text-white tracking-tight">NEXUS</h1>
            <p className="text-blue-300 text-sm font-semibold tracking-[0.3em] mt-1">POINT OF SALE</p>
          </div>
          <p className="text-blue-200/70 text-base leading-relaxed">
            The all-in-one POS solution for every business. Works online and offline, on any device.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {['Offline Ready', 'M-Pesa', 'Multi-Store', 'Real-time Reports', 'PWA + Mobile'].map(f => (
              <span key={f} className="px-3 py-1 bg-white/10 text-blue-200 text-xs font-medium rounded-full">
                {f}
              </span>
            ))}
          </div>
          <div className="absolute bottom-6 text-[10px] text-white/30 uppercase tracking-widest font-semibold">
            POWERED BY BITBRIDGE TECHNOLOGIES
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-navy-800 rounded-xl flex items-center justify-center">
            <Store size={20} className="text-white" />
          </div>
          <div>
            <div className="font-black text-navy-900 text-xl">NEXUS POS</div>
          </div>
        </div>

        <div className="w-full max-w-sm">
          {/* Online status */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-6 ${
            online ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
          }`}>
            {online ? <Wifi size={12} /> : <WifiOff size={12} />}
            {online ? 'Online Mode' : 'Offline Mode — Local data only'}
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-8">Sign in to your POS account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy-800 hover:bg-navy-700 text-white font-bold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 mb-2">Demo Credentials</p>
            <div className="space-y-1 text-xs text-blue-600">
              <p>Cashier: <span className="font-mono">cashier@nexuspos.com</span> / <span className="font-mono">pos1234</span></p>
              <p>Admin: <span className="font-mono">admin@nexuspos.com</span> / <span className="font-mono">admin123</span></p>
            </div>
          </div>
          <div className="text-center mt-8 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
            Powered by BitBridge Technologies
          </div>
        </div>
      </div>
    </div>
  )
}
