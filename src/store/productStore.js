import { create } from 'zustand'
import db from '../db/database'

export const useProductStore = create((set, get) => ({
  products: [],
  categories: [],
  loading: false,
  searchQuery: '',
  selectedCategory: 'All',

  fetchProducts: async () => {
    set({ loading: true })
    try {
      const products = await db.products.toArray()
      const categories = ['All', ...new Set(products.map((p) => p.category))]
      set({ products, categories, loading: false })
    } catch (error) {
      console.error('Error fetching products:', error)
      set({ loading: false })
    }
  },

  addProduct: async (product) => {
    const id = await db.products.add(product)
    await get().fetchProducts()
    return id
  },

  updateProduct: async (id, updates) => {
    await db.products.update(id, updates)
    await get().fetchProducts()
  },

  deleteProduct: async (id) => {
    await db.products.delete(id)
    await get().fetchProducts()
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),

  getFilteredProducts: () => {
    const { products, searchQuery, selectedCategory } = get()
    return products.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode?.includes(searchQuery) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory =
        selectedCategory === 'All' || p.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  },
}))
