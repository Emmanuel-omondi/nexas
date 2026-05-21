import { create } from 'zustand'
import { db } from '../db/database'

export const useSettingsStore = create((set, get) => ({
  settings: {
    storeName: 'Nexus Store',
    storeAddress: '123 Main Street, Nairobi',
    storePhone: '+254 700 000 000',
    currency: 'KES',
    taxRate: 16,
    taxEnabled: true,
    receiptFooter: 'Thank you for shopping with us!',
    mpesaPaybill: '174379',
    mpesaAccount: 'NEXUSPOS',
    lowStockAlert: 10,
    theme: 'light',
    storeType: 'General Store',
  },
  loaded: false,

  loadSettings: async () => {
    const rows = await db.settings.toArray()
    const settings = {}
    rows.forEach(r => { settings[r.key] = r.value })
    set({ settings: { ...get().settings, ...settings }, loaded: true })
  },

  updateSetting: async (key, value) => {
    await db.settings.put({ key, value })
    set({ settings: { ...get().settings, [key]: value } })
  },

  updateSettings: async (updates) => {
    const puts = Object.entries(updates).map(([key, value]) => ({ key, value }))
    await db.settings.bulkPut(puts)
    set({ settings: { ...get().settings, ...updates } })
  },

  getSetting: (key) => get().settings[key],
}))
