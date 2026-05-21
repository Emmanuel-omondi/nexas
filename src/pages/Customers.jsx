import { useState } from 'react'
import { Plus, Search, UserPlus, Phone, Mail, Award, DollarSign } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { useSettingsStore } from '../store/settingsStore'
import { formatCurrency, formatDate } from '../utils/formatters'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'

function CustomerForm({ customer, onSave, onClose }) {
  const [form, setForm] = useState(customer || { name: '', phone: '', email: '', loyaltyPoints: 0, totalSpent: 0 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    // Validate phone number
    if (!form.phone || form.phone.length < 9) {
      setError('Please input a valid phone number')
      setSaving(false)
      return
    }

    try {
      const data = {
        ...form,
        loyaltyPoints: Number(form.loyaltyPoints),
        totalSpent: Number(form.totalSpent),
        createdAt: customer?.createdAt || new Date().toISOString()
      }

      if (customer?.id) {
        await db.customers.update(customer.id, data)
      } else {
        await db.customers.add(data)
      }
      onSave()
    } catch (err) {
      setError(`Database Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Customer Full Name"
        value={form.name}
        onChange={e => set('name', e.target.value)}
        required
        placeholder="e.g. Samuel Kinyua"
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Phone Number"
          type="tel"
          value={form.phone}
          onChange={e => set('phone', e.target.value)}
          required
          placeholder="e.g. 0712345678"
        />
        <Input
          label="Email Address"
          type="email"
          value={form.email}
          onChange={e => set('email', e.target.value)}
          placeholder="e.g. customer@example.com"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Loyalty Points"
          type="number"
          value={form.loyaltyPoints}
          onChange={e => set('loyaltyPoints', e.target.value)}
          placeholder="0"
        />
        <Input
          label="Manual Cumulative Spent"
          type="number"
          value={form.totalSpent}
          onChange={e => set('totalSpent', e.target.value)}
          placeholder="0.00"
        />
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={saving} fullWidth>
          {customer ? 'Update Customer Record' : 'Save Customer Profile'}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default function Customers() {
  const { settings } = useSettingsStore()
  const [search, setSearch]   = useState('')
  const [modal, setModal]     = useState(false)
  const [editing, setEditing] = useState(null)

  const customers = useLiveQuery(() => db.customers.toArray(), [])

  // Filter customers list
  const filtered = (customers || []).filter(c => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
    return matchSearch
  })

  // Calculate aggregated stats
  const stats = {
    total: (customers || []).length,
    cumulativeSpent: (customers || []).reduce((sum, c) => sum + (c.totalSpent || 0), 0),
    totalLoyaltyPoints: (customers || []).reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0),
  }

  const openAdd  = () => { setEditing(null); setModal(true) }
  const openEdit = (c) => { setEditing(c); setModal(true) }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900">Customer Relationship Manager</h2>
          <p className="text-sm text-gray-500">Cultivate customer relations and manage reward point systems</p>
        </div>
        <Button icon={UserPlus} onClick={openAdd}>
          Register Customer
        </Button>
      </div>

      {/* CRM metrics panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Registered Profiles', value: stats.total, icon: UserPlus, color: 'bg-blue-50 text-blue-600' },
          { label: 'Loyalty Points Granted', value: stats.totalLoyaltyPoints, icon: Award, color: 'bg-amber-50 text-amber-600' },
          { label: 'Cumulative CRM Spent', value: formatCurrency(stats.cumulativeSpent, settings.currency), icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
        ].map((s, i) => (
          <Card key={i}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div className="text-xl font-black text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Lookup Bar */}
      <Card padding="p-4">
        <div className="relative w-full md:w-96">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customers by name, phone or email..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy-800"
          />
        </div>
      </Card>

      {/* CRM Database Table */}
      <Card padding="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Customer Profile</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Contact Methods</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-3 py-3">Loyalty Reward</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-3 py-3">Total Purchases</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Created Date</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Modify</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 font-semibold text-gray-800 text-sm">
                    {c.name}
                  </td>
                  <td className="px-3 py-3 text-xs space-y-0.5 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Phone size={12} className="text-gray-400" />
                      <span>{c.phone}</span>
                    </div>
                    {c.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail size={12} className="text-gray-400" />
                        <span>{c.email}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 text-sm font-bold text-amber-600">
                      <Award size={14} />
                      <span>{c.loyaltyPoints} pts</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-black text-gray-900">
                    {formatCurrency(c.totalSpent, settings.currency)}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-400">
                    {formatDate(c.createdAt)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button size="xs" variant="outline" onClick={() => openEdit(c)}>
                      Edit Info
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                    No matching customer records found in memory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CRM Entry Trigger Modal */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Modify Customer Record' : 'Register New Customer Profile'}
        size="md"
      >
        <CustomerForm customer={editing} onSave={() => setModal(false)} onClose={() => setModal(false)} />
      </Modal>
    </div>
  )
}
