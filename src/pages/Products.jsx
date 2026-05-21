import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, Package, ToggleLeft, ToggleRight } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { formatCurrency } from '../utils/formatters'
import { useSettingsStore } from '../store/settingsStore'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'

const DEFAULT_CATEGORIES = ['Food & Beverage','Groceries','Electronics','Clothing','Hotel Services','Beverages','Bakery','Pharmacy']

function ProductForm({ product, categories, onSave, onClose }) {
  const cats = categories && categories.length > 0 ? categories.map(c => c.name) : DEFAULT_CATEGORIES
  const [form, setForm] = useState(product || {
    name: '', category: cats[0] || 'Groceries', barcode: '', price: '', cost: '', stock: '', unit: 'piece', active: true,
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const data = { ...form, price: Number(form.price), cost: Number(form.cost), stock: Number(form.stock) }
    if (product?.id) await db.products.update(product.id, data)
    else await db.products.add(data)
    onSave()
    setSaving(false)
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Product Name" value={form.name} onChange={e => set('name', e.target.value)} required containerClassName="col-span-2" />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Category</label>
          <select value={form.category} onChange={e => set('category', e.target.value)}
            className="input-field">
            {cats.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <Input label="Barcode / SKU" value={form.barcode} onChange={e => set('barcode', e.target.value)} />
        <Input label="Selling Price" type="number" value={form.price} onChange={e => set('price', e.target.value)} required />
        <Input label="Cost Price" type="number" value={form.cost} onChange={e => set('cost', e.target.value)} />
        <Input label="Stock Quantity" type="number" value={form.stock} onChange={e => set('stock', e.target.value)} required />
        <Input label="Unit" value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="piece, kg, litre..." />
      </div>
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={saving} fullWidth>{product ? 'Update Product' : 'Add Product'}</Button>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  )
}

export default function Products() {
  const { settings } = useSettingsStore()
  const [search, setSearch]   = useState('')
  const [catFilter, setCat]   = useState('All')
  const [modal, setModal]     = useState(false)
  const [editing, setEditing] = useState(null)

  const products = useLiveQuery(() => db.products.toArray(), [])
  const categories = useLiveQuery(() => db.categories.toArray(), [])

  const filtered = (products || []).filter(p => {
    const matchCat    = catFilter === 'All' || p.category === catFilter
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search)
    return matchCat && matchSearch
  })

  const handleDelete = async (id) => {
    if (window.confirm('Delete this product?')) await db.products.delete(id)
  }

  const handleToggle = async (p) => {
    await db.products.update(p.id, { active: !p.active })
  }

  const openAdd  = () => { setEditing(null); setModal(true) }
  const openEdit = (p) => { setEditing(p); setModal(true) }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900">Products</h2>
          <p className="text-sm text-gray-500">{(products || []).length} total products</p>
        </div>
        <Button icon={Plus} onClick={openAdd}>Add Product</Button>
      </div>

      {/* Filters */}
      <Card padding="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy-800"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['All', ...(categories && categories.length > 0 ? categories.map(c => c.name) : DEFAULT_CATEGORIES)].map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  catFilter === c ? 'bg-navy-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Product</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Category</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-3 py-3">Price</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-3 py-3">Cost</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-3 py-3">Stock</th>
                <th className="text-center text-xs font-semibold text-gray-500 px-3 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-navy-100 rounded-xl flex items-center justify-center">
                        <Package size={16} className="text-navy-800" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.barcode || 'No barcode'} · {p.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant="primary">{p.category}</Badge>
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-bold text-gray-900">
                    {formatCurrency(p.price, settings?.currency || 'KES')}
                  </td>
                  <td className="px-3 py-3 text-right text-sm text-gray-500">
                    {formatCurrency(p.cost, settings?.currency || 'KES')}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className={`text-sm font-semibold ${p.stock === 0 ? 'text-red-500' : p.stock <= 10 ? 'text-amber-500' : 'text-gray-800'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button onClick={() => handleToggle(p)}>
                      {p.active
                        ? <ToggleRight size={22} className="text-emerald-500" />
                        : <ToggleLeft size={22} className="text-gray-300" />
                      }
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Product' : 'Add New Product'} size="lg">
        <ProductForm product={editing} categories={categories} onSave={() => setModal(false)} onClose={() => setModal(false)} />
      </Modal>
    </div>
  )
}
