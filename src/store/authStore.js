import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { db } from '../db/database'


export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isAdminAuthenticated: false,
      sessionStart: null,
      activeShift: null,

      login: async (email, password) => {
        const emailLower = email.toLowerCase()

        // OFFLINE-FIRST AUTH: Query local Dexie DB which is synced from remote Postgres
        const cachedUser = await db.users.where('email').equals(emailLower).first()
        if (!cachedUser) {
          throw new Error('User not found. Please contact your system administrator.')
        }
        if (cachedUser.pin !== password) {
          throw new Error('Invalid credentials')
        }
        if (!cachedUser.active) {
          throw new Error('Account has been disabled')
        }

        set({
          user: cachedUser,
          isAuthenticated: true,
          sessionStart: new Date().toISOString(),
        })
        // Try to load any existing open shifts
        await get().loadActiveShift()
        return cachedUser
      },

      adminLogin: async (password) => {
        // Look for admin locally
        const adminUser = await db.users.where('role').equals('admin').first()
        if (adminUser) {
          if (adminUser.pin !== password) {
            throw new Error('Invalid admin credentials')
          }
          set({ isAdminAuthenticated: true })
          return true
        }
        
        throw new Error('No system administrator configured yet.')
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isAdminAuthenticated: false,
          sessionStart: null,
          activeShift: null,
        })
      },

      clearAdminAuth: () => set({ isAdminAuthenticated: false }),

      // REGISTER SHIFT SESSION MANAGEMENT
      loadActiveShift: async () => {
        const openShift = await db.shifts.where('status').equals('open').first()
        if (openShift) {
          set({ activeShift: openShift })
          return openShift
        }
        set({ activeShift: null })
        return null
      },

      openShift: async (startingCash) => {
        const user = get().user
        const newShift = {
          openedAt: new Date().toISOString(),
          closedAt: null,
          openedBy: user?.name || 'Operator',
          startingCash: Number(startingCash),
          cashSales: 0,
          mpesaSales: 0,
          cardSales: 0,
          expenses: 0,
          expectedCash: Number(startingCash),
          actualCash: 0,
          notes: '',
          status: 'open'
        }
        const id = await db.shifts.add(newShift)
        const shift = { ...newShift, id }
        set({ activeShift: shift })
        return shift
      },

      closeShift: async (actualCash, notes) => {
        const shift = get().activeShift
        if (!shift) return null
        const closedShift = {
          ...shift,
          closedAt: new Date().toISOString(),
          actualCash: Number(actualCash),
          notes: notes || '',
          status: 'closed'
        }
        await db.shifts.put(closedShift)
        set({ activeShift: null })
        return closedShift
      },

      recordShiftSale: async (amount, method) => {
        const shift = get().activeShift
        if (!shift) return
        const amountNum = Number(amount)
        const updates = {}
        if (method === 'cash') {
          updates.cashSales = Number((shift.cashSales || 0) + amountNum)
          updates.expectedCash = Number((shift.expectedCash || 0) + amountNum)
        } else if (method === 'mpesa') {
          updates.mpesaSales = Number((shift.mpesaSales || 0) + amountNum)
        } else if (method === 'card') {
          updates.cardSales = Number((shift.cardSales || 0) + amountNum)
        }
        const updatedShift = { ...shift, ...updates }
        await db.shifts.put(updatedShift)
        set({ activeShift: updatedShift })
      },

      recordShiftExpense: async (amount) => {
        const shift = get().activeShift
        if (!shift) return
        const amountNum = Number(amount)
        const updatedShift = {
          ...shift,
          expenses: Number((shift.expenses || 0) + amountNum),
          expectedCash: Math.max(0, Number((shift.expectedCash || 0) - amountNum))
        }
        await db.shifts.put(updatedShift)
        set({ activeShift: updatedShift })
      }
    }),
    {
      name: 'nexus-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sessionStart: state.sessionStart,
      }),
    }
  )
)
