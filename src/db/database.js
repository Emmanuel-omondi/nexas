import Dexie from 'dexie'

export const db = new Dexie('NexusPOS')

db.version(1).stores({
  products:     '++id, name, category, barcode, price, cost, stock, unit, active',
  categories:   '++id, name, color, icon',
  orders:       '++id, orderNumber, status, paymentMethod, total, cashierId, shiftId, createdAt, synced',
  orderItems:   '++id, orderId, productId, name, price, quantity, discount',
  customers:    '++id, name, phone, email, loyaltyPoints, totalSpent, createdAt',
  users:        '++id, name, email, role, pin, active',
  settings:     'key',
  syncQueue:    '++id, type, data, createdAt',
  expenses:     '++id, category, amount, description, date, cashierId, shiftId',
  stockMovements: '++id, productId, type, quantity, reason, date, userId',
  shifts:       '++id, openedAt, closedAt, openedBy, startingCash, cashSales, mpesaSales, cardSales, expenses, expectedCash, actualCash, notes, status',
})

// Seed initial data
export async function seedDatabase() {
  const settingsCount = await db.settings.count()
  if (settingsCount > 0) return

  // Default settings
  await db.settings.bulkPut([
    { key: 'storeName',      value: 'Nexus Store' },
    { key: 'storeAddress',   value: '123 Main Street, Nairobi' },
    { key: 'storePhone',     value: '+254 700 000 000' },
    { key: 'currency',       value: 'KES' },
    { key: 'taxRate',        value: 16 },
    { key: 'taxEnabled',     value: true },
    { key: 'receiptFooter',  value: 'Thank you for shopping with us!' },
    { key: 'mpesaPaybill',   value: '174379' },
    { key: 'mpesaAccount',   value: 'NEXUSPOS' },
    { key: 'mpesaConsumerKey', value: '' },
    { key: 'mpesaConsumerSecret', value: '' },
    { key: 'mpesaPasskey',   value: '' },
    { key: 'mpesaEnv',       value: 'sandbox' },
    { key: 'mpesaCallbackUrl', value: 'https://api.bitbridge.co.ke/mpesa/callback' },
    { key: 'mpesaType',      value: 'Paybill' },
    { key: 'lowStockAlert',  value: 10 },
    { key: 'theme',          value: 'light' },
    { key: 'storeType',      value: 'General Store' },
    { key: 'drawerCashLimit', value: 20000 },
    { key: 'neonConnectionString', value: '' },
  ])

  console.log('✅ Default settings seeded successfully')
}

export async function initDatabase() {
  await db.open()
  await seedDatabase()
}
