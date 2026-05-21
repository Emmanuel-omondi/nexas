import React, { useState, useEffect } from 'react'
import {
  Store, Receipt, Sliders, Smartphone, Percent,
  Save, Sparkles, CheckCircle2, RefreshCw, SmartphoneCharging,
  Coins, HelpCircle, BellRing
} from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'
import Card, { CardHeader } from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function Settings() {
  const { settings, updateSettings, loadSettings } = useSettingsStore()
  const [activeTab, setActiveTab] = useState('general')
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Initialize form data when settings load
  useEffect(() => {
    setFormData({
      storeName: settings.storeName || '',
      storeAddress: settings.storeAddress || '',
      storePhone: settings.storePhone || '',
      currency: settings.currency || 'KES',
      taxRate: settings.taxRate || 16,
      taxEnabled: settings.taxEnabled !== undefined ? settings.taxEnabled : true,
      receiptFooter: settings.receiptFooter || '',
      mpesaPaybill: settings.mpesaPaybill || '',
      mpesaAccount: settings.mpesaAccount || '',
      lowStockAlert: settings.lowStockAlert || 10,
      storeType: settings.storeType || 'General Store',
      drawerCashLimit: settings.drawerCashLimit || 20000,
      receiptHeader: settings.receiptHeader || 'WELCOME TO OUR STORE',
    })
  }, [settings])

  const handleInputChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    try {
      // Coerce numeric types
      const updates = {
        ...formData,
        taxRate: Number(formData.taxRate),
        lowStockAlert: Number(formData.lowStockAlert),
        drawerCashLimit: Number(formData.drawerCashLimit),
      }
      await updateSettings(updates)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'General Info', icon: Store },
    { id: 'mode', label: 'Store Mode', icon: Sliders },
    { id: 'taxes', label: 'Taxes & Fees', icon: Percent },
    { id: 'mpesa', label: 'M-Pesa & Cash', icon: Smartphone },
    { id: 'receipt', label: 'Receipt Template', icon: Receipt },
  ]

  const storeTypes = [
    { name: 'General Store / Retail', value: 'General Store', description: 'Optimized for standard barcodes, high-volume grocery transactions, and general inventories.' },
    { name: 'Restaurant / Food Store', value: 'Food Store', description: 'Enables table-based tracking, quick item modifiers, and hospitality ordering patterns.' },
    { name: 'Hotel / Hospitality', value: 'Hotel', description: 'Enables room assignment trackers, custom room services billing, and hospitality checkout operations.' },
    { name: 'Supermarket / Wholesale', value: 'Supermarket', description: 'High-speed keyboard barcode gun scanner workflows with batch stock tracking.' },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto py-2">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-navy-900">System Configurations</h2>
            <div className="bg-navy-800 text-white text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 uppercase">
              <Sparkles size={10} className="text-blue-300" />
              Active
            </div>
          </div>
          <p className="text-xs text-gray-500 max-w-xl">
            Configure default taxes, checkout integrations, standard thermal printer receipts, and hardware mode selectors.
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block">Powered by</span>
          <span className="text-sm font-bold text-navy-800 tracking-tight">BitBridge Technologies</span>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl animate-fade-in">
          <CheckCircle2 className="text-emerald-500" size={20} />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">Settings Saved Successfully</h4>
            <p className="text-xs text-emerald-600/90">Local configuration stores and IndexedDB records have been successfully synchronized.</p>
          </div>
        </div>
      )}

      {/* Main Form Split */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Tabs Column */}
        <div className="flex flex-col gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-navy-800 text-white shadow-md shadow-navy-800/10 translate-x-1'
                    : 'bg-white hover:bg-gray-50 border border-gray-100 text-gray-600'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-blue-300' : 'text-gray-400'} />
                <span>{tab.label}</span>
              </button>
            )
          })}

          <div className="mt-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
            <div className="flex gap-2 items-center text-xs text-navy-800 font-bold mb-1">
              <HelpCircle size={14} className="text-blue-500" />
              <span>Offline Cache Status</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-normal">
              All settings are synced locally. Changes made here operate offline instantly.
            </p>
          </div>
        </div>

        {/* Right Form Content */}
        <form onSubmit={handleSubmit} className="md:col-span-3 flex flex-col gap-6">
          <Card className="flex flex-col gap-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <CardHeader
                  title="General Store Information"
                  subtitle="Configure your physical store properties displayed on dashboards and receipts."
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Store Name"
                    placeholder="e.g. BitBridge Supermarket"
                    value={formData.storeName || ''}
                    onChange={e => handleInputChange('storeName', e.target.value)}
                    required
                  />
                  <Input
                    label="Phone Number"
                    placeholder="e.g. +254 700 000 000"
                    value={formData.storePhone || ''}
                    onChange={e => handleInputChange('storePhone', e.target.value)}
                  />
                </div>

                <Input
                  label="Physical Address"
                  placeholder="e.g. Suite 4, BitBridge Plaza, Nairobi"
                  value={formData.storeAddress || ''}
                  onChange={e => handleInputChange('storeAddress', e.target.value)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Currency Code</label>
                    <select
                      value={formData.currency || 'KES'}
                      onChange={e => handleInputChange('currency', e.target.value)}
                      className="w-full py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm px-3 focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
                    >
                      <option value="KES">Kenyan Shilling (KES)</option>
                      <option value="USD">US Dollar ($)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="GBP">British Pound (£)</option>
                    </select>
                  </div>
                  <Input
                    label="Low Stock Warning Limit"
                    type="number"
                    min="1"
                    placeholder="10"
                    value={formData.lowStockAlert || 10}
                    onChange={e => handleInputChange('lowStockAlert', e.target.value)}
                  />
                </div>
              </div>
            )}

            {activeTab === 'mode' && (
              <div className="space-y-6">
                <CardHeader
                  title="Operating Store Mode"
                  subtitle="Switch POS functionalities. Changing this mode dynamically toggles Table layouts, Room billing or Wholesale high-speed scanning."
                />

                <div className="space-y-3">
                  {storeTypes.map(mode => {
                    const isSelected = formData.storeType === mode.value
                    return (
                      <div
                        key={mode.value}
                        onClick={() => handleInputChange('storeType', mode.value)}
                        className={`flex gap-4 p-4 border rounded-2xl cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'bg-blue-50/50 border-blue-500 ring-1 ring-blue-500'
                            : 'bg-white hover:bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <input
                            type="radio"
                            checked={isSelected}
                            onChange={() => {}}
                            className="text-navy-800 focus:ring-navy-800"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-sm font-bold text-gray-900">{mode.name}</span>
                          <p className="text-xs text-gray-500 leading-normal">{mode.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {activeTab === 'taxes' && (
              <div className="space-y-6">
                <CardHeader
                  title="Register Taxes & Standard Levies"
                  subtitle="Manage default tax compliance rates applied automatically during sales checkouts."
                />

                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold text-gray-900">Enable Tax Calculations</span>
                    <p className="text-xs text-gray-400">If enabled, VAT/Taxes will be added during cart billing summaries.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.taxEnabled}
                      onChange={e => handleInputChange('taxEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy-800" />
                  </label>
                </div>

                {formData.taxEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                    <Input
                      label="Default Tax Rate (%)"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="16"
                      value={formData.taxRate || 16}
                      onChange={e => handleInputChange('taxRate', e.target.value)}
                      icon={Percent}
                    />
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col justify-center">
                      <span className="text-xs font-bold text-navy-800 mb-0.5">Note on Kenyan VAT</span>
                      <p className="text-[11px] text-gray-500 leading-normal">
                        Standard VAT is set at 16%. Invoices rendered will break down Subtotal, VAT amount, and Total.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'mpesa' && (
              <div className="space-y-6">
                <CardHeader
                  title="M-Pesa Integration & Cash Limits"
                  subtitle="Manage your cellular payment APIs and trigger limits for safe drawer cash drops."
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="M-Pesa Paybill / Till No"
                    placeholder="e.g. 174379 (Lipa Na M-Pesa)"
                    value={formData.mpesaPaybill || ''}
                    onChange={e => handleInputChange('mpesaPaybill', e.target.value)}
                    icon={SmartphoneCharging}
                  />
                  <Input
                    label="Default Account Name"
                    placeholder="e.g. NEXUSPOS"
                    value={formData.mpesaAccount || ''}
                    onChange={e => handleInputChange('mpesaAccount', e.target.value)}
                    icon={Coins}
                  />
                </div>

                <div className="border-t border-gray-100 pt-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Drawer Safe Drop Limit"
                      type="number"
                      min="100"
                      placeholder="20000"
                      value={formData.drawerCashLimit || 20000}
                      onChange={e => handleInputChange('drawerCashLimit', e.target.value)}
                      icon={Coins}
                      hint="Warn cashier when physical cash exceeds this threshold for cash drops."
                    />
                    <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex gap-3 items-start">
                      <BellRing className="text-amber-500 flex-shrink-0 mt-0.5" size={16} />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-amber-800">Safe Drops Alert</span>
                        <p className="text-[11px] text-amber-600 leading-normal">
                          When cashier cash in drawer reaches this limit, a banner warns them to drop excess cash to the admin safe.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'receipt' && (
              <div className="space-y-6">
                <CardHeader
                  title="Thermal Receipt Customize"
                  subtitle="Tailor monochrome thermal output printed on standard 80mm rollers."
                />

                <div className="grid grid-cols-1 gap-4">
                  <Input
                    label="Receipt Header Logo Text"
                    placeholder="e.g. *** WELCOME TO NEXUS STORE ***"
                    value={formData.receiptHeader || ''}
                    onChange={e => handleInputChange('receiptHeader', e.target.value)}
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Receipt Footer Promo Message</label>
                    <textarea
                      value={formData.receiptFooter || ''}
                      onChange={e => handleInputChange('receiptFooter', e.target.value)}
                      placeholder="e.g. Goods once sold cannot be refunded. Thank you for shopping with us!"
                      className="w-full min-h-[80px] p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
                    />
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-gray-700 block">Thermal Format Preview</span>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 font-mono text-xs text-gray-600 space-y-1 shadow-inner max-w-xs mx-auto">
                    <div className="text-center font-bold">{formData.storeName || 'NEXUS STORE'}</div>
                    <div className="text-center text-[10px]">{formData.storeAddress || '123 MAIN ST, NAIROBI'}</div>
                    <div className="text-center text-[10px]">TEL: {formData.storePhone || '0700000000'}</div>
                    <div className="border-b border-dashed border-gray-300 my-2"></div>
                    <div className="text-center font-bold text-[10px] my-1">{formData.receiptHeader || 'WELCOME'}</div>
                    <div className="border-b border-dashed border-gray-300 my-2"></div>
                    <div className="flex justify-between">
                      <span>Item Description</span>
                      <span>Qty x Price</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total ({formData.currency || 'KES'})</span>
                      <span>0.00</span>
                    </div>
                    <div className="border-b border-dashed border-gray-300 my-2"></div>
                    <div className="text-center text-[10px] italic whitespace-pre-line">{formData.receiptFooter || 'Thank you!'}</div>
                    <div className="text-center text-[9px] text-gray-400 mt-2">POWERED BY BITBRIDGE TECH</div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Action Row */}
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              type="button"
              disabled={loading}
              onClick={() => loadSettings()}
            >
              Reset Changes
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={loading}
              icon={Save}
            >
              Save System Settings
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
