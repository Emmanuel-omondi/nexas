import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useSettingsStore } from './store/settingsStore'
import { initDatabase } from './db/database'

import SplashScreen from './pages/SplashScreen'
import SignIn from './pages/SignIn'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import POS from './pages/POS'
import Products from './pages/Products'
import Inventory from './pages/Inventory'
import Orders from './pages/Orders'
import Customers from './pages/Customers'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Admin from './pages/Admin'
import SignUp from './pages/SignUp'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/signin" replace />
  return children
}

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [dbReady, setDbReady] = useState(false)
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    initDatabase().then(async () => {
      await useSettingsStore.getState().loadSettings()
      setDbReady(true)
    })
  }, [])

  if (showSplash) {
    return <SplashScreen onDone={() => setShowSplash(false)} />
  }

  if (!dbReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 spinner mx-auto mb-3 border-blue-600 border-t-blue-600" style={{borderColor:'#e5e7eb', borderTopColor:'#2563eb'}} />
          <p className="text-sm text-gray-500">Initializing database...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/signin"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignIn />}
        />
        <Route
          path="/signup"
          element={<SignUp />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="pos" element={<POS />} />
          <Route path="products" element={<Products />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="orders" element={<Orders />} />
          <Route path="customers" element={<Customers />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="admin" element={<Admin />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
