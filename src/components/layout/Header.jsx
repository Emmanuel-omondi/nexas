import { useState, useEffect } from 'react'
import {
  Bell, Search, Wifi, WifiOff, ChevronDown, RefreshCw,
  CloudLightning, CheckCircle2, Download, MonitorSmartphone
} from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore } from '../../store/settingsStore'
import { formatTime } from '../../utils/formatters'

export default function Header({ title }) {
  const { user } = useAuthStore()
  const { settings } = useSettingsStore()
  const [online, setOnline] = useState(navigator.onLine)
  const [time, setTime] = useState(new Date())
  const [syncing, setSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)

  // PWA installation state
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallBtn, setShowInstallBtn] = useState(false)

  // Watch Dexie orders for unsynced sales (synced !== 1)
  const unsyncedOrders = useLiveQuery(
    async () => {
      if (!db.orders) return []
      return await db.orders.where('synced').equals(0).toArray()
    },
    []
  ) || []

  const unsyncedCount = unsyncedOrders.length

  // Auto-sync mechanism when coming online
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true)
      triggerAutoSync()
    }
    const handleOffline = () => setOnline(false)

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    const timer = setInterval(() => setTime(new Date()), 1000)

    // PWA beforeinstallprompt handler
    const handleInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallBtn(true)
    }
    window.addEventListener('beforeinstallprompt', handleInstallPrompt)

    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      clearInterval(timer)
    }
  }, [])

  // Auto-trigger sync when unsynced items appear online
  useEffect(() => {
    if (online && unsyncedCount > 0 && !syncing) {
      triggerAutoSync()
    }
  }, [unsyncedCount, online])

  const triggerAutoSync = async () => {
    if (syncing || unsyncedCount === 0) return
    setSyncing(true)
    setSyncProgress(0)

    // Simulate batch sync upload with incremental loader
    try {
      const orderIds = unsyncedOrders.map(o => o.id)
      
      // Simulate API packaging delay
      for (let i = 0; i < orderIds.length; i++) {
        const orderId = orderIds[i]
        
        // Simulating cloud server storage upload latency
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // Update local database status to Synced!
        await db.orders.update(orderId, { synced: 1 })
        
        // Progress calculator
        setSyncProgress(Math.round(((i + 1) / orderIds.length) * 100))
      }
    } catch (err) {
      console.error('Auto sync failure:', err)
    } finally {
      setSyncing(false)
      setSyncProgress(0)
    }
  }

  // Handle PWA Standalone Install Click
  const handlePWAInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('User accepted PWA installation prompt')
    }
    setDeferredPrompt(null)
    setShowInstallBtn(false)
  }

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 flex-shrink-0 relative">
      {/* Syncing Progress Bar overlay */}
      {syncing && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
            style={{ width: `${syncProgress}%` }}
          />
        </div>
      )}

      {/* Title */}
      <div className="flex-1">
        <h1 className="text-lg font-black text-gray-900 leading-tight">{title}</h1>
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{settings.storeName}</p>
      </div>

      {/* Standalone Install Trigger Button */}
      {showInstallBtn && (
        <button
          onClick={handlePWAInstall}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-navy-800 text-white hover:bg-navy-700 transition-all shadow-sm animate-pulse"
        >
          <Download size={13} className="text-blue-300" />
          <span>Install POS App</span>
        </button>
      )}

      {/* Background Database Sync Indicator */}
      <div className="flex items-center gap-2">
        {online ? (
          unsyncedCount > 0 ? (
            <button
              onClick={triggerAutoSync}
              disabled={syncing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                syncing
                  ? 'bg-blue-50 text-blue-600 border border-blue-100 animate-pulse'
                  : 'bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100/50'
              }`}
              title="Unsynced sales cached offline. Click to upload."
            >
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
              <span>
                {syncing ? `Uploading (${syncProgress}%)` : `${unsyncedCount} Unsynced Sales`}
              </span>
            </button>
          ) : (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100"
              title="All database entries uploaded to central safe."
            >
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span className="hidden md:inline">Cloud Synced</span>
            </div>
          )
        ) : (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100"
            title="Transactions are being queued in browser offline buffer."
          >
            <CloudLightning size={13} />
            <span>Queuing Offline ({unsyncedCount})</span>
          </div>
        )}
      </div>

      {/* Online status badge */}
      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border ${
        online 
          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
          : 'bg-red-50 text-red-500 border-red-100 animate-pulse'
      }`}>
        {online
          ? <><Wifi size={13} /><span className="hidden sm:inline">Online</span></>
          : <><WifiOff size={13} /><span className="hidden sm:inline">Offline</span></>
        }
      </div>

      {/* Time display */}
      <div className="hidden lg:block text-xs font-mono font-bold text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-xl">
        {formatTime(time)}
      </div>

      {/* User profile dropdown */}
      <div className="flex items-center gap-2.5 pl-3 border-l border-gray-100">
        <div className="w-8 h-8 rounded-xl bg-navy-800 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-navy-800/10">
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-xs font-bold text-gray-800 leading-tight">{user?.name}</div>
          <div className="text-[10px] text-gray-400 font-semibold capitalize tracking-tight mt-0.5">{user?.role}</div>
        </div>
      </div>
    </header>
  )
}
