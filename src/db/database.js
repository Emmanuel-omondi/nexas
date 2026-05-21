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
  const count = await db.products.count()
  if (count > 0) return

  // Categories
  await db.categories.bulkAdd([
    { name: 'Food & Beverage', color: '#f97316', icon: 'UtensilsCrossed' },
    { name: 'Groceries',       color: '#22c55e', icon: 'ShoppingBasket' },
    { name: 'Electronics',     color: '#3b82f6', icon: 'Cpu' },
    { name: 'Clothing',        color: '#a855f7', icon: 'Shirt' },
    { name: 'Hotel Services',  color: '#ec4899', icon: 'Hotel' },
    { name: 'Beverages',       color: '#06b6d4', icon: 'Coffee' },
    { name: 'Bakery',          color: '#f59e0b', icon: 'Croissant' },
    { name: 'Pharmacy',        color: '#ef4444', icon: 'Pill' },
  ])

  // Products
  await db.products.bulkAdd([
    // Food & Beverage
    { name: 'Grilled Chicken',      category: 'Food & Beverage', barcode: '1001', price: 450,  cost: 200, stock: 50,  unit: 'plate',  active: true, image: null },
    { name: 'Beef Burger',          category: 'Food & Beverage', barcode: '1002', price: 380,  cost: 150, stock: 40,  unit: 'piece',  active: true, image: null },
    { name: 'Veggie Pizza',         category: 'Food & Beverage', barcode: '1003', price: 650,  cost: 280, stock: 20,  unit: 'piece',  active: true, image: null },
    { name: 'Fish & Chips',         category: 'Food & Beverage', barcode: '1004', price: 520,  cost: 220, stock: 30,  unit: 'plate',  active: true, image: null },
    { name: 'Caesar Salad',         category: 'Food & Beverage', barcode: '1005', price: 280,  cost: 100, stock: 25,  unit: 'bowl',   active: true, image: null },
    // Groceries
    { name: 'Unga Pembe 2kg',       category: 'Groceries',       barcode: '2001', price: 180,  cost: 140, stock: 100, unit: 'pack',   active: true, image: null },
    { name: 'Cooking Oil 1L',       category: 'Groceries',       barcode: '2002', price: 220,  cost: 170, stock: 80,  unit: 'bottle', active: true, image: null },
    { name: 'Sugar 1kg',            category: 'Groceries',       barcode: '2003', price: 130,  cost: 100, stock: 120, unit: 'pack',   active: true, image: null },
    { name: 'Rice 2kg',             category: 'Groceries',       barcode: '2004', price: 240,  cost: 190, stock: 90,  unit: 'pack',   active: true, image: null },
    { name: 'Tomatoes 1kg',         category: 'Groceries',       barcode: '2005', price: 80,   cost: 50,  stock: 60,  unit: 'kg',     active: true, image: null },
    { name: 'Onions 1kg',           category: 'Groceries',       barcode: '2006', price: 60,   cost: 40,  stock: 70,  unit: 'kg',     active: true, image: null },
    { name: 'Potatoes 1kg',         category: 'Groceries',       barcode: '2007', price: 70,   cost: 45,  stock: 80,  unit: 'kg',     active: true, image: null },
    // Electronics
    { name: 'USB-C Cable 1m',       category: 'Electronics',     barcode: '3001', price: 350,  cost: 150, stock: 45,  unit: 'piece',  active: true, image: null },
    { name: 'Phone Charger 20W',    category: 'Electronics',     barcode: '3002', price: 850,  cost: 400, stock: 30,  unit: 'piece',  active: true, image: null },
    { name: 'Earphones',            category: 'Electronics',     barcode: '3003', price: 650,  cost: 300, stock: 25,  unit: 'piece',  active: true, image: null },
    { name: 'Power Bank 10000mAh',  category: 'Electronics',     barcode: '3004', price: 2200, cost: 1200,stock: 15,  unit: 'piece',  active: true, image: null },
    { name: 'Screen Protector',     category: 'Electronics',     barcode: '3005', price: 200,  cost: 80,  stock: 60,  unit: 'piece',  active: true, image: null },
    // Clothing
    { name: 'T-Shirt (M)',          category: 'Clothing',        barcode: '4001', price: 550,  cost: 250, stock: 35,  unit: 'piece',  active: true, image: null },
    { name: 'Jeans (32)',           category: 'Clothing',        barcode: '4002', price: 1800, cost: 900, stock: 20,  unit: 'piece',  active: true, image: null },
    { name: 'Sneakers (42)',        category: 'Clothing',        barcode: '4003', price: 3500, cost: 1800,stock: 12,  unit: 'pair',   active: true, image: null },
    { name: 'Cap',                  category: 'Clothing',        barcode: '4004', price: 450,  cost: 180, stock: 40,  unit: 'piece',  active: true, image: null },
    // Hotel Services
    { name: 'Room Service',         category: 'Hotel Services',  barcode: '5001', price: 500,  cost: 200, stock: 999, unit: 'service',active: true, image: null },
    { name: 'Laundry Service',      category: 'Hotel Services',  barcode: '5002', price: 300,  cost: 100, stock: 999, unit: 'service',active: true, image: null },
    { name: 'Airport Transfer',     category: 'Hotel Services',  barcode: '5003', price: 2500, cost: 1000,stock: 999, unit: 'trip',   active: true, image: null },
    { name: 'Spa Treatment',        category: 'Hotel Services',  barcode: '5004', price: 3500, cost: 1500,stock: 999, unit: 'session',active: true, image: null },
    // Beverages
    { name: 'Coca-Cola 500ml',      category: 'Beverages',       barcode: '6001', price: 80,   cost: 50,  stock: 200, unit: 'bottle', active: true, image: null },
    { name: 'Water 500ml',          category: 'Beverages',       barcode: '6002', price: 50,   cost: 25,  stock: 300, unit: 'bottle', active: true, image: null },
    { name: 'Fresh Juice 300ml',    category: 'Beverages',       barcode: '6003', price: 150,  cost: 70,  stock: 80,  unit: 'glass',  active: true, image: null },
    { name: 'Coffee (Hot)',         category: 'Beverages',       barcode: '6004', price: 120,  cost: 40,  stock: 100, unit: 'cup',    active: true, image: null },
    { name: 'Tea (Hot)',            category: 'Beverages',       barcode: '6005', price: 80,   cost: 25,  stock: 100, unit: 'cup',    active: true, image: null },
    // Bakery
    { name: 'Croissant',            category: 'Bakery',          barcode: '7001', price: 120,  cost: 60,  stock: 50,  unit: 'piece',  active: true, image: null },
    { name: 'Bread Loaf',           category: 'Bakery',          barcode: '7002', price: 65,   cost: 40,  stock: 40,  unit: 'loaf',   active: true, image: null },
    { name: 'Chocolate Cake Slice', category: 'Bakery',          barcode: '7003', price: 180,  cost: 80,  stock: 30,  unit: 'slice',  active: true, image: null },
    // Pharmacy
    { name: 'Paracetamol 500mg',    category: 'Pharmacy',        barcode: '8001', price: 50,   cost: 25,  stock: 200, unit: 'strip',  active: true, image: null },
    { name: 'Vitamin C 1000mg',     category: 'Pharmacy',        barcode: '8002', price: 350,  cost: 180, stock: 80,  unit: 'pack',   active: true, image: null },
    { name: 'Hand Sanitizer 100ml', category: 'Pharmacy',        barcode: '8003', price: 150,  cost: 70,  stock: 120, unit: 'bottle', active: true, image: null },
  ])

  // Default users
  await db.users.bulkAdd([
    { name: 'Admin User',    email: 'admin@nexuspos.com',   role: 'admin',   pin: 'admin123', active: true },
    { name: 'John Cashier',  email: 'cashier@nexuspos.com', role: 'cashier', pin: 'pos1234',  active: true },
    { name: 'Jane Manager',  email: 'manager@nexuspos.com', role: 'manager', pin: 'mgr456',   active: true },
  ])

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
    { key: 'lowStockAlert',  value: 10 },
    { key: 'theme',          value: 'light' },
    { key: 'storeType',      value: 'General Store' },
  ])

  console.log('✅ Database seeded successfully')
}

export async function initDatabase() {
  await db.open()
  await seedDatabase()
}
