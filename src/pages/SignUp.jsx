import React, { useState } from 'react'
import {
  Users2, UserPlus, Key, Mail, ShieldCheck, UserX,
  ToggleLeft, ToggleRight, Edit2, Trash2, ArrowRight,
  Search, Sparkles, LogIn, Lock, CheckCircle2, UserCheck
} from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { useNavigate } from 'react-router-dom'
import Card, { CardHeader } from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'

export default function SignUp() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  // Registration form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('cashier')
  const [pin, setPin] = useState('')

  // Edit Modal States
  const [editModal, setEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState('cashier')
  const [editPin, setEditPin] = useState('')

  // Live Query users
  const users = useLiveQuery(() => db.users.toArray()) || []

  // Filter users based on search
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  )

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!name || !email || !pin) return

    try {
      const emailLower = email.toLowerCase().trim()
      
      // Check if user email already exists
      const existing = await db.users.where('email').equals(emailLower).first()
      if (existing) {
        alert('This email account is already registered!')
        return
      }

      await db.users.add({
        name: name.trim(),
        email: emailLower,
        role,
        pin: pin.trim(),
        active: true
      })

      setName('')
      setEmail('')
      setPin('')
      setRole('cashier')
      
      showNotification('Employee account created successfully!')
    } catch (err) {
      console.error(err)
    }
  }

  const showNotification = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  const handleToggleSuspend = async (userItem) => {
    try {
      await db.users.update(userItem.id, { active: !userItem.active })
      showNotification(`Account for ${userItem.name} has been ${userItem.active ? 'suspended' : 'activated'}!`)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteUser = async (userItem) => {
    if (userItem.role === 'admin') {
      alert('Cannot delete the primary System Administrator account!')
      return
    }
    if (!confirm(`Are you absolutely sure you want to delete ${userItem.name}? All their terminal logs remain, but they won't be able to log in.`)) return

    try {
      await db.users.delete(userItem.id)
      showNotification('Staff profile deleted successfully.')
    } catch (err) {
      console.error(err)
    }
  }

  const openEditModal = (userItem) => {
    setEditingUser(userItem)
    setEditName(userItem.name)
    setEditEmail(userItem.email)
    setEditRole(userItem.role)
    setEditPin(userItem.pin)
    setEditModal(true)
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      await db.users.update(editingUser.id, {
        name: editName.trim(),
        email: editEmail.toLowerCase().trim(),
        role: editRole,
        pin: editPin.trim()
      })
      setEditModal(false)
      setEditingUser(null)
      showNotification('Staff credentials updated successfully!')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Brand Navbar */}
      <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-navy-800 rounded-xl flex items-center justify-center shadow-md shadow-navy-800/10">
            <Users2 size={18} className="text-white" />
          </div>
          <div>
            <span className="font-black text-gray-900 tracking-tight text-base">BitBridge Provisioning Panel</span>
            <span className="hidden sm:inline-block ml-2 text-[10px] text-gray-400 font-bold bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full uppercase">PWA Portal</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/signin')}
          className="flex items-center gap-1.5 text-xs font-bold text-navy-800 hover:text-navy-700 bg-navy-50 hover:bg-navy-100/80 px-3.5 py-2 rounded-xl transition-all"
        >
          <span>Go to Terminal</span>
          <LogIn size={13} />
        </button>
      </header>

      {/* Main Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Banner Alert Notification */}
        {successMsg && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl shadow-sm animate-fade-in">
            <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={20} />
            <div className="flex-1">
              <p className="text-xs font-bold">{successMsg}</p>
            </div>
          </div>
        )}

        {/* Brand Hero Panel */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }} />
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Staff Account Provisioning Portal</h1>
              <Badge variant="warning" className="bg-amber-400 text-navy-950 font-bold uppercase tracking-wider text-[9px]">Owner Console</Badge>
            </div>
            <p className="text-xs text-blue-100 max-w-xl">
              Create secure cashier & manager credentials. Registered user metrics sync directly into local database stores, working completely offline.
            </p>
          </div>
          <div className="text-left md:text-right relative z-10 flex-shrink-0">
            <span className="text-[10px] text-blue-200/80 font-bold uppercase tracking-widest block">Authorized Engine</span>
            <span className="text-sm font-bold tracking-tight text-white">Powered by BitBridge Tech</span>
          </div>
        </div>

        {/* Dashboard Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Column 1: Onboarding Registration Form */}
          <Card className="lg:col-span-1 border border-gray-100">
            <CardHeader 
              title="Register Staff Profile" 
              subtitle="Provision fresh credentials for cashiers or managers." 
            />
            <form onSubmit={handleRegister} className="space-y-4 mt-2">
              <Input
                label="Full Name"
                placeholder="e.g. Dennis Omwenga"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />

              <Input
                label="Email Account Address"
                type="email"
                placeholder="e.g. dennis@nexuspos.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                icon={Mail}
              />

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Authorized Role Permission</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm px-3 focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800 transition-all font-semibold"
                >
                  <option value="cashier">Cashier Operator</option>
                  <option value="manager">Store Manager</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              <Input
                label="Authorized Security PIN"
                placeholder="e.g. pos1234 (Numeric / Alphanumeric)"
                value={pin}
                onChange={e => setPin(e.target.value)}
                required
                icon={Lock}
                hint="PIN required by cashier to access shifts and checkouts."
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                icon={UserPlus}
                className="mt-2"
              >
                Provision Staff Credentials
              </Button>
            </form>
          </Card>

          {/* Column 2 & 3: Staff Profile Registry */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Search and Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
              <div className="relative w-full sm:max-w-xs">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff Name or role..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800 placeholder:text-gray-400"
                />
              </div>
              <div className="text-xs text-gray-400 font-bold self-end sm:self-center">
                Displaying {filteredUsers.length} staff profile(s)
              </div>
            </div>

            {/* Profile Grid Cards */}
            {filteredUsers.length === 0 ? (
              <Card className="text-center py-12 border border-gray-100">
                <Users2 className="text-gray-300 mx-auto mb-3" size={32} />
                <p className="text-sm font-semibold text-gray-500">No staff registry matches found</p>
                <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1">Try refining your search keyword or use the registration form to add a user.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredUsers.map(u => {
                  const isSuspended = !u.active
                  return (
                    <div
                      key={u.id}
                      className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 ${
                        isSuspended ? 'border-red-100 bg-red-50/10' : 'border-gray-100'
                      }`}
                    >
                      {/* Card Header details */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm truncate">{u.name}</h3>
                            <p className="text-xs text-gray-400 truncate mt-0.5">{u.email}</p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase flex-shrink-0 ${
                            u.role === 'admin' 
                              ? 'bg-navy-900 text-white' 
                              : u.role === 'manager' 
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                                : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}>
                            {u.role}
                          </span>
                        </div>

                        {/* PIN parameters */}
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 p-2.5 rounded-xl text-xs">
                          <Key size={13} className="text-gray-400 flex-shrink-0" />
                          <span className="text-gray-500 font-medium">Terminal PIN:</span>
                          <span className="font-mono font-bold text-gray-800 tracking-widest">{u.pin}</span>
                        </div>
                      </div>

                      {/* Card Actions Footer */}
                      <div className="border-t border-gray-50 pt-4 flex items-center justify-between">
                        
                        {/* Toggle Suspend */}
                        <button
                          onClick={() => handleToggleSuspend(u)}
                          className={`flex items-center gap-1.5 text-xs font-bold transition-colors focus:outline-none ${
                            isSuspended ? 'text-red-500 hover:text-red-600' : 'text-emerald-600 hover:text-emerald-700'
                          }`}
                        >
                          {isSuspended ? (
                            <>
                              <ToggleLeft size={18} />
                              <span>Suspended</span>
                            </>
                          ) : (
                            <>
                              <ToggleRight size={18} />
                              <span>Authorized</span>
                            </>
                          )}
                        </button>

                        {/* Edit & Delete Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-2 hover:bg-gray-50 text-gray-500 hover:text-gray-800 rounded-xl transition-colors border border-transparent hover:border-gray-100"
                            title="Edit Credentials"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition-colors border border-transparent hover:border-red-100"
                            title="Delete Employee"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit User Modal */}
      <Modal
        isOpen={editModal}
        onClose={() => { setEditModal(false); setEditingUser(null) }}
        title="Update Staff Credentials"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. John Doe"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            required
          />

          <Input
            label="Email Account Address"
            type="email"
            placeholder="e.g. john@nexuspos.com"
            value={editEmail}
            onChange={e => setEditEmail(e.target.value)}
            required
            icon={Mail}
          />

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">System Access Role</label>
            <select
              value={editRole}
              onChange={e => setEditRole(e.target.value)}
              className="w-full py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm px-3 focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
            >
              <option value="cashier">Cashier Operator</option>
              <option value="manager">Store Manager</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>

          <Input
            label="Authorized Security PIN"
            placeholder="e.g. pos1234"
            value={editPin}
            onChange={e => setEditPin(e.target.value)}
            required
            icon={Lock}
          />

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setEditModal(false); setEditingUser(null) }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Save Credentials
            </Button>
          </div>
        </form>
      </Modal>

      {/* Page Footer credits */}
      <footer className="py-6 border-t border-gray-100 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-auto">
        Powered by BitBridge Technologies POS Suite
      </footer>
    </div>
  )
}
