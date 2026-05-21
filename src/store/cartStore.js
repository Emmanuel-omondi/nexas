import { create } from 'zustand'

export const useCartStore = create((set, get) => ({
  items: [],
  discount: 0,
  discountType: 'percent', // 'percent' | 'fixed'
  customerId: null,
  note: '',
  taxRate: 16,
  tableNumber: '',
  roomNumber: '',

  addItem: (product) => {
    const { items } = get()
    const existing = items.find(i => i.id === product.id)
    if (existing) {
      set({
        items: items.map(i =>
          i.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      })
    } else {
      set({
        items: [...items, {
          id: product.id,
          name: product.name,
          price: product.price,
          cost: product.cost,
          unit: product.unit,
          category: product.category,
          quantity: 1,
          discount: 0,
        }]
      })
    }
  },

  removeItem: (id) => {
    set({ items: get().items.filter(i => i.id !== id) })
  },

  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id)
      return
    }
    set({
      items: get().items.map(i =>
        i.id === id ? { ...i, quantity } : i
      )
    })
  },

  updateItemDiscount: (id, discount) => {
    set({
      items: get().items.map(i =>
        i.id === id ? { ...i, discount: Math.min(100, Math.max(0, discount)) } : i
      )
    })
  },

  setDiscount: (discount, type = 'percent') => {
    set({ discount, discountType: type })
  },

  setCustomer: (customerId) => set({ customerId }),
  setNote: (note) => set({ note }),
  setTaxRate: (taxRate) => set({ taxRate }),
  setTableNumber: (tableNumber) => set({ tableNumber }),
  setRoomNumber: (roomNumber) => set({ roomNumber }),

  clearCart: () => set({
    items: [],
    discount: 0,
    discountType: 'percent',
    customerId: null,
    note: '',
    tableNumber: '',
    roomNumber: '',
  }),

  // Computed values
  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity
      const itemDiscount = itemTotal * (item.discount / 100)
      return sum + itemTotal - itemDiscount
    }, 0)
  },

  getDiscountAmount: () => {
    const { discount, discountType } = get()
    const subtotal = get().getSubtotal()
    if (discountType === 'percent') return subtotal * (discount / 100)
    return Math.min(discount, subtotal)
  },

  getTaxAmount: () => {
    const { taxRate } = get()
    const afterDiscount = get().getSubtotal() - get().getDiscountAmount()
    return afterDiscount * (taxRate / 100)
  },

  getTotal: () => {
    return get().getSubtotal() - get().getDiscountAmount() + get().getTaxAmount()
  },

  getItemCount: () => {
    return get().items.reduce((sum, i) => sum + i.quantity, 0)
  },
}))
