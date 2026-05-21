import { useState, useEffect, useMemo, useRef } from 'react'
import { Search, Barcode, RefreshCw, Smartphone, Play, Plus, AlertTriangle, ShieldCheck } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { useSettingsStore } from '../store/settingsStore'
import { generateOrderNumber } from '../utils/formatters'
import { printReceipt } from '../utils/receipt'
import CategoryFilter from '../components/pos/CategoryFilter'
import ProductGrid from '../components/pos/ProductGrid'
import Cart from '../components/pos/Cart'
import PaymentModal from '../components/pos/PaymentModal'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function POS() {
  const cart = useCartStore()
  const { user, activeShift, openShift, recordShiftSale } = useAuthStore()
  const { settings } = useSettingsStore()

  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState(null)
  const [paymentOpen, setPayment]   = useState(false)
  const [lastOrder, setLastOrder]   = useState(null)

  // Shift initialization states
  const [shiftOpenModal, setShiftOpenModal] = useState(false)
  const [startingCash, setStartingCash]     = useState('5000')
  const [shiftError, setShiftError]         = useState('')

  // Camera Barcode Scanning States
  const [cameraOpen, setCameraOpen] = useState(false)
  const [scanToast, setScanToast]   = useState(null)

  // Live queries from IndexedDB
  const products   = useLiveQuery(() => db.products.toArray(), []) || []
  const categories = useLiveQuery(() => db.categories.toArray(), []) || []

  // Sync tax rate from settings
  useEffect(() => {
    if (settings?.taxEnabled) cart.setTaxRate(settings?.taxRate)
    else cart.setTaxRate(0)
  }, [settings?.taxRate, settings?.taxEnabled])

  // Shift gate check on component mount
  useEffect(() => {
    if (!activeShift) {
      setShiftOpenModal(true)
    }
  }, [activeShift])

  // Play scanning beep using web audio synthesizer
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(880, ctx.currentTime) // High pitch chirp
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      osc.start()
      osc.stop(ctx.currentTime + 0.08)
    } catch (e) {
      console.log('Audio Context beep failed', e)
    }
  }

  // DESKTOP PHYSICAL KEYBOARD BARCODE GUN SIMULATION
  useEffect(() => {
    let codeBuffer = ''
    let lastKeyTime = 0

    const handleKeyPress = async (e) => {
      // Ignore keys inside inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        return
      }

      const now = Date.now()
      // High-speed typing threshold (barcode guns input letters at intervals less than 40ms)
      if (now - lastKeyTime > 80) {
        codeBuffer = ''
      }
      lastKeyTime = now

      if (e.key === 'Enter') {
        if (codeBuffer.length >= 3) {
          e.preventDefault()
          const matched = await db.products.where('barcode').equals(codeBuffer.trim()).first()
          if (matched && matched.active) {
            cart.addItem(matched)
            playBeep()
            triggerScanToast(`Scanned: ${matched.name}`)
          } else {
            triggerScanToast(`Unknown SKU: ${codeBuffer}`, true)
          }
          codeBuffer = ''
        }
      } else if (e.key.length === 1) {
        codeBuffer += e.key
      }
    }

    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [products])

  const triggerScanToast = (msg, isError = false) => {
    setScanToast({ msg, isError })
    setTimeout(() => setScanToast(null), 2500)
  }

  // Filter products by category and search query
  const filtered = useMemo(() => {
    if (!products) return []
    const activeProds = products.filter(p => p.active !== false)
    return activeProds.filter(p => {
      const matchCat    = !category || p.category === category
      const matchSearch = !search   || (p.name ? String(p.name).toLowerCase() : '').includes(search.toLowerCase()) || p.barcode?.includes(search)
      return matchCat && matchSearch
    })
  }, [products, category, search])

  // Handle open shift submission
  const handleStartShift = async (e) => {
    e.preventDefault()
    setShiftError('')
    if (!startingCash || Number(startingCash) < 0) {
      setShiftError('Starting cash drawer must be 0 or more')
      return
    }
    try {
      await openShift(Number(startingCash))
      setShiftOpenModal(false)
    } catch (err) {
      setShiftError(err.message)
    }
  }

  // Handle payment confirmations
  const handlePaymentConfirm = async (paymentData) => {
    if (!activeShift) {
      alert('Cannot process sale: Register shift session is closed!')
      return
    }

    const orderNumber = generateOrderNumber()
    const subtotal    = cart.getSubtotal()
    const discount    = cart.getDiscountAmount()
    const tax         = cart.getTaxAmount()
    const total       = cart.getTotal()

    const order = {
      orderNumber,
      status:        'completed',
      paymentMethod: paymentData.method,
      subtotal,
      discount,
      tax,
      total,
      amountPaid:    paymentData.amountPaid,
      change:        paymentData.change || 0,
      mpesaPhone:    paymentData.mpesaPhone,
      mpesaRef:      paymentData.mpesaRef,
      cashierId:     user?.id,
      cashierName:   user?.name,
      customerId:    cart.customerId,
      tableNumber:   settings?.storeType === 'Food Store' ? cart.tableNumber : null,
      roomNumber:    settings?.storeType === 'Hotel' ? cart.roomNumber : null,
      note:          cart.note,
      shiftId:       activeShift.id,
      createdAt:     new Date().toISOString(),
      synced:        navigator.onLine ? 1 : 0,
      items:         cart.items,
    }

    // Add to Dexie DB
    const orderId = await db.orders.add(order)

    // Save order items
    await db.orderItems.bulkAdd(
      cart.items.map(item => ({
        orderId,
        productId: item.id,
        name:      item.name,
        price:     item.price,
        quantity:  item.quantity,
        discount:  item.discount,
      }))
    )

    // Update Customer loyalty and spent metrics
    if (cart.customerId) {
      try {
        const customer = await db.customers.get(cart.customerId)
        if (customer) {
          const addedPoints = Math.floor(total * 0.01) // 1% points
          await db.customers.update(cart.customerId, {
            totalSpent: (customer.totalSpent || 0) + total,
            loyaltyPoints: (customer.loyaltyPoints || 0) + addedPoints
          })
        }
      } catch (err) {
        console.error('Failed to update customer loyalty metrics:', err)
      }
    }

    // Update stock levels in local DB
    for (const item of cart.items) {
      const product = await db.products.get(item.id)
      if (product && product.stock !== 999) {
        await db.products.update(item.id, { stock: Math.max(0, product.stock - item.quantity) })
      }
    }

    // Record total under the active cashier shift
    await recordShiftSale(total, paymentData.method)

    setLastOrder({ ...order, id: orderId })
    setPayment(false)
    cart.clearCart()

    // Print Receipt
    printReceipt({ ...order, id: orderId }, settings)
  }

  // Trigger simulated camera scanning beep
  const handleSimulatedScan = async (barcodeVal) => {
    const matched = await db.products.where('barcode').equals(barcodeVal).first()
    if (matched && matched.active) {
      cart.addItem(matched)
      playBeep()
      triggerScanToast(`Simulated Scan: ${matched.name}`)
    } else {
      triggerScanToast(`No product matching barcode: ${barcodeVal}`, true)
    }
  }

  return (
    <div className="flex h-full gap-0 overflow-hidden relative">
      {/* Search scan floating toast indicator */}
      {scanToast && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-modal text-white text-sm font-bold flex items-center gap-2 animate-fade-in ${
          scanToast.isError ? 'bg-red-500' : 'bg-navy-800'
        }`}>
          <Barcode size={18} />
          {scanToast.msg}
        </div>
      )}

      {/* Left: Products */}
      <div className="flex-1 flex flex-col min-w-0 p-4 gap-4 overflow-hidden">
        {/* Search + scanner panel */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products, click list or scan barcode gun..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800 shadow-sm"
            />
          </div>
          
          {/* Mobile Camera Barcode Scan Trigger */}
          <button
            onClick={() => setCameraOpen(true)}
            className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm flex items-center gap-1.5 font-bold text-xs"
            title="Scan with Device Camera"
          >
            <Smartphone size={16} />
            <span className="hidden sm:inline">Camera Scan</span>
          </button>

          <button
            onClick={() => { setSearch(''); setCategory(null) }}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
            title="Reset filters"
          >
            <RefreshCw size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Categories */}
        {categories && (
          <CategoryFilter
            categories={categories}
            selected={category}
            onSelect={setCategory}
          />
        )}

        {/* Product count & Shift Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-800">{filtered.length}</span> items
              {category && <span> in <span className="font-semibold text-navy-800">{category}</span></span>}
            </p>
            {activeShift ? (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200">
                Shift Open (Expected: {settings?.currency || 'KES'} {activeShift.expectedCash})
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-red-50 text-red-500 rounded-full border border-red-200 animate-pulse">
                Shift Closed
              </span>
            )}
          </div>
          {lastOrder && (
            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-3 py-1 rounded-full">
              Receipt printed: {lastOrder.orderNumber}
            </span>
          )}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
          <ProductGrid
            products={filtered}
            onAdd={(prod) => {
              if (!activeShift) {
                setShiftOpenModal(true)
                return
              }
              cart.addItem(prod)
            }}
            cartItems={cart.items}
          />
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-80 xl:w-96 flex-shrink-0 p-4 pl-0">
        <Cart onCheckout={() => {
          if (!activeShift) {
            setShiftOpenModal(true)
            return
          }
          setPayment(true)
        }} />
      </div>

      {/* Payment modal */}
      <PaymentModal
        isOpen={paymentOpen}
        onClose={() => setPayment(false)}
        total={cart.getTotal()}
        onConfirm={handlePaymentConfirm}
      />

      {/* Cash Drawer Shift Open Gate Modal */}
      <Modal
        isOpen={shiftOpenModal}
        onClose={() => {
          if (activeShift) setShiftOpenModal(false)
        }}
        title="Open Register Shift"
        size="sm"
        showClose={!!activeShift}
      >
        <form onSubmit={handleStartShift} className="space-y-4">
          <div className="w-12 h-12 bg-navy-100 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldCheck size={26} className="text-navy-800" />
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-900 text-lg">Shift Session Closed</p>
            <p className="text-sm text-gray-500 mt-1">
              Input the opening cash drawer balance to activate the cash register and process POS sales.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">Opening Starting Cash ({settings?.currency || 'KES'})</label>
            <Input
              type="number"
              value={startingCash}
              onChange={e => setStartingCash(e.target.value)}
              placeholder="e.g. 5000"
              required
              className="text-center text-lg font-bold"
            />
          </div>

          {shiftError && <p className="text-sm text-red-500 text-center">{shiftError}</p>}

          <Button type="submit" fullWidth icon={Play}>
            Activate POS shift
          </Button>
        </form>
      </Modal>

      {/* Simulated Mobile Camera Barcode Scan Modal */}
      <Modal
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        title="Simulated Camera Scanner"
        size="md"
      >
        <div className="space-y-5 py-2">
          {/* Simulated viewscreen with scan target overlay */}
          <div className="relative h-60 bg-gray-950 rounded-2xl overflow-hidden flex flex-col items-center justify-center border-4 border-gray-800">
            {/* Animated Laser beam */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse-slow w-full" style={{ transform: 'translateY(-50%)' }} />
            
            {/* Corner brackets simulating targeting finder */}
            <div className="absolute w-40 h-40 border-2 border-white/20 rounded-xl flex items-center justify-center">
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500" />
              
              <Barcode size={48} className="text-white/30 animate-pulse" />
            </div>
            
            <p className="absolute bottom-4 text-xs text-white/60 font-semibold tracking-wide">
              [Mobile Device Viewfinder Simulated]
            </p>
          </div>

          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-800 flex items-start gap-2 border border-blue-100">
            <Smartphone size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p>
              On tablets/mobile devices, this utilizes native camera APIs. In this web environment, tap any product barcode below to simulate scanning!
            </p>
          </div>

          {/* Preset scan targets to test */}
          <div>
            <p className="text-xs font-bold text-gray-700 mb-2">Simulate Barcode Hits</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Grilled Chicken', code: '1001' },
                { name: 'Unga Pembe 2kg', code: '2001' },
                { name: 'Sugar 1kg', code: '2003' },
                { name: 'USB-C Cable', code: '3001' },
                { name: 'Phone Charger', code: '3002' },
                { name: 'Coca-Cola 500ml', code: '6001' },
                { name: 'Paracetamol', code: '8001' },
              ].map(item => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSimulatedScan(item.code)}
                  className="px-3 py-2 text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all flex justify-between items-center group text-xs"
                >
                  <div>
                    <p className="font-semibold text-gray-800 group-hover:text-blue-700">{item.name}</p>
                    <p className="font-mono text-gray-400 text-[10px]">{item.code}</p>
                  </div>
                  <span className="h-5 px-1.5 bg-white border border-gray-200 text-gray-500 text-[10px] rounded flex items-center justify-center font-bold font-mono">
                    SCAN
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button fullWidth onClick={() => setCameraOpen(false)} variant="secondary">
              Close Camera View
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
