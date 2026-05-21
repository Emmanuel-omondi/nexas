import { neon } from '@neondatabase/serverless'
import { db } from '../db/database'

export async function runSync() {
  try {
    const connSetting = await db.settings.get('neonConnectionString')
    const connectionString = connSetting?.value

    if (!connectionString || connectionString.trim() === '') {
      return { success: false, message: 'Neon database connection string is not configured in Settings.' }
    }

    const sql = neon(connectionString)

    // 1. Create tables on Neon Postgres if they don't exist
    await sql(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'cashier',
        pin VARCHAR(100) NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await sql(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        color VARCHAR(50),
        icon VARCHAR(50)
      );
    `)

    await sql(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        category VARCHAR(100),
        barcode VARCHAR(100),
        price NUMERIC(12, 2) NOT NULL,
        cost NUMERIC(12, 2),
        stock INT NOT NULL DEFAULT 0,
        unit VARCHAR(50),
        active BOOLEAN NOT NULL DEFAULT TRUE
      );
    `)

    await sql(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(150),
        "loyaltyPoints" INT NOT NULL DEFAULT 0,
        "totalSpent" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        "createdAt" VARCHAR(100)
      );
    `)

    await sql(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        "orderNumber" VARCHAR(100) UNIQUE NOT NULL,
        status VARCHAR(50),
        "paymentMethod" VARCHAR(50),
        total NUMERIC(12, 2) NOT NULL,
        "cashierId" INT,
        "shiftId" INT,
        "createdAt" VARCHAR(100)
      );
    `)

    await sql(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        "orderId" INT NOT NULL,
        "productId" INT NOT NULL,
        name VARCHAR(150) NOT NULL,
        price NUMERIC(12, 2) NOT NULL,
        quantity INT NOT NULL,
        discount NUMERIC(12, 2)
      );
    `)

    // 2. UPLOAD PHASE (Dexie -> Postgres)
    // Upload Users
    const localUsers = await db.users.toArray()
    for (const u of localUsers) {
      await sql(`
        INSERT INTO users (id, name, email, role, pin, active)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          role = EXCLUDED.role,
          pin = EXCLUDED.pin,
          active = EXCLUDED.active
      `, [u.id, u.name, u.email, u.role, u.pin, u.active])
    }

    // Upload Categories
    const localCategories = await db.categories.toArray()
    for (const c of localCategories) {
      await sql(`
        INSERT INTO categories (id, name, color, icon)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          color = EXCLUDED.color,
          icon = EXCLUDED.icon
      `, [c.id, c.name, c.color, c.icon])
    }

    // Upload Products
    const localProducts = await db.products.toArray()
    for (const p of localProducts) {
      await sql(`
        INSERT INTO products (id, name, category, barcode, price, cost, stock, unit, active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          barcode = EXCLUDED.barcode,
          price = EXCLUDED.price,
          cost = EXCLUDED.cost,
          stock = EXCLUDED.stock,
          unit = EXCLUDED.unit,
          active = EXCLUDED.active
      `, [p.id, p.name, p.category, p.barcode, p.price, p.cost, p.stock, p.unit, p.active])
    }

    // Upload Customers
    const localCustomers = await db.customers.toArray()
    for (const c of localCustomers) {
      await sql(`
        INSERT INTO customers (id, name, phone, email, "loyaltyPoints", "totalSpent", "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          "loyaltyPoints" = EXCLUDED."loyaltyPoints",
          "totalSpent" = EXCLUDED."totalSpent",
          "createdAt" = EXCLUDED."createdAt"
      `, [c.id, c.name, c.phone, c.email, c.loyaltyPoints, c.totalSpent, c.createdAt])
    }

    // Upload Unsynced Orders
    const unsyncedOrders = await db.orders.where('synced').equals(0).toArray()
    for (const o of unsyncedOrders) {
      const existing = await sql(`SELECT id FROM orders WHERE "orderNumber" = $1`, [o.orderNumber])
      let pgOrderId = null

      if (existing.length > 0) {
        pgOrderId = existing[0].id
      } else {
        const res = await sql(`
          INSERT INTO orders (id, "orderNumber", status, "paymentMethod", total, "cashierId", "shiftId", "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `, [o.id, o.orderNumber, o.status, o.paymentMethod, o.total, o.cashierId, o.shiftId, o.createdAt])
        pgOrderId = res[0].id
      }

      // Upload items for this order
      const items = await db.orderItems.where('orderId').equals(o.id).toArray()
      for (const item of items) {
        const existingItem = await sql(`SELECT id FROM order_items WHERE "orderId" = $1 AND "productId" = $2`, [pgOrderId, item.productId])
        if (existingItem.length === 0) {
          await sql(`
            INSERT INTO order_items ("orderId", "productId", name, price, quantity, discount)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [pgOrderId, item.productId, item.name, item.price, item.quantity, item.discount])
        }
      }

      // Mark as synced locally
      await db.orders.update(o.id, { synced: 1 })
    }

    // 3. DOWNLOAD PHASE (Postgres -> Dexie)
    // Download Users
    const remoteUsers = await sql(`SELECT * FROM users`)
    for (const u of remoteUsers) {
      await db.users.put(u)
    }

    // Download Categories
    const remoteCategories = await sql(`SELECT * FROM categories`)
    for (const c of remoteCategories) {
      await db.categories.put(c)
    }

    // Download Products
    const remoteProducts = await sql(`SELECT * FROM products`)
    for (const p of remoteProducts) {
      p.price = Number(p.price)
      p.cost = p.cost !== null ? Number(p.cost) : null
      p.stock = Number(p.stock)
      await db.products.put(p)
    }

    // Download Customers
    const remoteCustomers = await sql(`SELECT * FROM customers`)
    for (const c of remoteCustomers) {
      c.loyaltyPoints = Number(c.loyaltyPoints)
      c.totalSpent = Number(c.totalSpent)
      await db.customers.put(c)
    }

    // Download Orders and Items
    const remoteOrders = await sql(`SELECT * FROM orders`)
    for (const o of remoteOrders) {
      o.total = Number(o.total)
      o.cashierId = o.cashierId !== null ? Number(o.cashierId) : null
      o.shiftId = o.shiftId !== null ? Number(o.shiftId) : null
      o.synced = 1

      const existing = await db.orders.get(o.id)
      if (!existing) {
        await db.orders.put(o)
        
        const remoteItems = await sql(`SELECT * FROM order_items WHERE "orderId" = $1`, [o.id])
        const localItems = await db.orderItems.where('orderId').equals(o.id).toArray()
        
        for (const item of remoteItems) {
          item.price = Number(item.price)
          item.quantity = Number(item.quantity)
          item.discount = item.discount !== null ? Number(item.discount) : null

          const hasItem = localItems.some(li => li.productId === item.productId)
          if (!hasItem) {
            await db.orderItems.add({
              orderId: item.orderId,
              productId: item.productId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              discount: item.discount
            })
          }
        }
      }
    }

    // 4. SEQUENCE CORRECTIONS (Avoid ID collision issues on subsequent inserts)
    await sql(`SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM users;`)
    await sql(`SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM categories;`)
    await sql(`SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM products;`)
    await sql(`SELECT setval(pg_get_serial_sequence('customers', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM customers;`)
    await sql(`SELECT setval(pg_get_serial_sequence('orders', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM orders;`)
    await sql(`SELECT setval(pg_get_serial_sequence('order_items', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM order_items;`)

    return { success: true, message: 'Database synchronization completed successfully!' }
  } catch (err) {
    console.error('Synchronization Error:', err)
    return { success: false, message: `Sync Failure: ${err.message}` }
  }
}
