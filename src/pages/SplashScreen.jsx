import { useEffect, useState } from 'react'
import { Store } from 'lucide-react'

export default function SplashScreen({ onDone }) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus]     = useState('Initializing...')

  useEffect(() => {
    const steps = [
      { pct: 20,  msg: 'Loading database...',    delay: 400 },
      { pct: 45,  msg: 'Syncing products...',    delay: 800 },
      { pct: 70,  msg: 'Preparing workspace...', delay: 1300 },
      { pct: 90,  msg: 'Almost ready...',        delay: 1800 },
      { pct: 100, msg: 'Welcome to Nexus POS',   delay: 2200 },
    ]
    steps.forEach(({ pct, msg, delay }) => {
      setTimeout(() => {
        setProgress(pct)
        setStatus(msg)
      }, delay)
    })
    setTimeout(onDone, 2800)
  }, [onDone])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 flex flex-col items-center justify-center">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-navy-800/30 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Content */}
      <div className="relative flex flex-col items-center gap-8 px-8 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl">
              <Store size={44} className="text-white" />
            </div>
            <div className="absolute -inset-2 bg-blue-500/20 rounded-3xl blur-xl animate-pulse-slow" />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-black text-white tracking-tight">NEXUS</h1>
            <div className="flex items-center gap-2 justify-center mt-1">
              <div className="h-px w-8 bg-blue-400/50" />
              <span className="text-blue-300 text-sm font-semibold tracking-[0.3em]">POINT OF SALE</span>
              <div className="h-px w-8 bg-blue-400/50" />
            </div>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-blue-300/70 text-sm text-center leading-relaxed">
          Multi-platform POS for every business — shops, supermarkets, hotels & more
        </p>

        {/* Progress */}
        <div className="w-full space-y-3">
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-300 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-blue-300/60 text-xs">{status}</p>
            <p className="text-blue-300/60 text-xs font-mono">{progress}%</p>
          </div>
        </div>

        {/* Version */}
        <div className="flex flex-col items-center gap-1.5 mt-2">
          <p className="text-white/20 text-xs">v1.0.0 · Production Ready</p>
          <div className="text-[10px] tracking-wider text-blue-400/50 font-semibold uppercase">
            Powered by BitBridge Technologies
          </div>
        </div>
      </div>
    </div>
  )
}
