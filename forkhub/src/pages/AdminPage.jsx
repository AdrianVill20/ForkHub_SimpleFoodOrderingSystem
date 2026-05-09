import { useState, useEffect } from 'react'
import TopNav from '../components/TopNav'
import { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem } from '../services/menuService'
import { getAllOrders, deleteOrder, updateOrderStatus } from '../services/orderService'

const CATEGORIES = ['Pizza','Pasta','Sides','Chicken','Desserts','Beverages','Extras']
const EMPTY_FORM  = { name:'', category:'Pizza', subcategory:'Classic', description:'', price:'', image:'' }

export default function AdminPage() {
  const [view, setView]               = useState('list')
  const [items, setItems]             = useState([])
  const [loading, setLoading]         = useState(false)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [editingId, setEditingId]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search, setSearch]           = useState('')
  const [filterCat, setFilterCat]     = useState('All')
  const [toast, setToast]             = useState(null)
  const [orders, setOrders]           = useState([])

  async function reload() {
    setLoading(true)
    try {
      const data = await getMenuItems()
      setItems(data)
    } catch {
      showToast('Failed to load menu items.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2800)
  }

  const filtered = items.filter((item) => {
    const matchCat    = filterCat === 'All' || item.category === filterCat
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.name || !form.price) return
    try {
      await addMenuItem({ ...form, price: Number(form.price) })
      await reload()
      showToast(`"${form.name}" added successfully!`)
      setForm(EMPTY_FORM)
      setView('list')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  function openEdit(item) {
    setForm({ ...item, price: String(item.price) })
    setEditingId(item.id)
    setView('edit')
  }

  async function handleEdit(e) {
    e.preventDefault()
    try {
      await updateMenuItem(editingId, { ...form, price: Number(form.price) })
      await reload()
      showToast(`"${form.name}" updated successfully!`)
      setView('list')
      setEditingId(null)
      setForm(EMPTY_FORM)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  function openDelete(item) {
    setDeleteTarget(item)
    setView('delete')
  }

  async function confirmDelete() {
    try {
      await deleteMenuItem(deleteTarget.id)
      await reload()
      showToast(`"${deleteTarget.name}" deleted.`, 'error')
      setDeleteTarget(null)
      setView('list')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  function FormFields() {
    return (
      <>
        <label style={lbl}>Item Name *</label>
        <input className="field" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="e.g. Pepperoni Pizza" required />

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label style={lbl}>Category *</label>
            <select className="select-field" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Subcategory</label>
            <input className="field" value={form.subcategory} onChange={(e) => setForm({...form, subcategory: e.target.value})} placeholder="e.g. Classic" />
          </div>
        </div>

        <label style={lbl}>Description</label>
        <textarea className="field" rows={3} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Ingredients / description" />

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label style={lbl}>Price (₱) *</label>
            <input className="field" type="number" min="1" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} placeholder="169" required />
          </div>
          <div>
            <label style={lbl}>Image Path</label>
            <input className="field" value={form.image} onChange={(e) => setForm({...form, image: e.target.value})} placeholder="/images/pizza/Item.jpg" />
          </div>
        </div>

        {form.image && (
          <div style={{ textAlign:'center', margin:'8px 0' }}>
            <img src={form.image} alt="preview" style={{ width:80, height:80, borderRadius:'50%', objectFit:'cover', border:'2px solid #ddd' }} onError={(e) => (e.target.style.display='none')} />
          </div>
        )}
      </>
    )
  }

  const lbl = { fontWeight:700, fontSize:13, color:'#2e2e2e', display:'block', marginBottom:2, marginTop:10 }
  const th  = { padding:'10px 12px', fontWeight:700, fontSize:12, textTransform:'uppercase' }
  const td  = { padding:'10px 12px', verticalAlign:'middle' }

  return (
    <div className="page">
      <TopNav />

      {toast && (
        <div className={`admin-toast ${toast.type === 'error' ? 'admin-toast-error' : 'admin-toast-success'}`}>
          {toast.msg}
        </div>
      )}

      <main className="content-wrap">
        <div className="admin-layout">
          <section className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">
                {view === 'list'   && 'Menu Management'}
                {view === 'add'    && 'Add Menu Item'}
                {view === 'edit'   && 'Edit Menu Item'}
                {view === 'delete' && 'Delete Menu Item'}
                {view === 'orders' && 'Orders'}
              </h2>
              <div className="admin-header-glow" />
            </div>

            <div className="admin-section-body">
              <div className="admin-tabs">
                <button className={`admin-tab ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
                  <img src="/favicon.svg" alt="" className="admin-tab-icon" /> List Items
                </button>
                <button className={`admin-tab ${view === 'add'  ? 'active' : ''}`} onClick={() => { setForm(EMPTY_FORM); setView('add') }}>
                  <span className="admin-tab-plus">+</span> Add Item
                </button>
                <button className={`admin-tab ${view === 'orders' ? 'active' : ''}`} onClick={() => { setOrders(getAllOrders()); setView('orders') }}>
                  <img src="/favicon.svg" alt="" className="admin-tab-icon" /> Orders
                </button>
              </div>

              {/* LIST */}
              {view === 'list' && (
                <div className="admin-view-body">
                  <div className="admin-search-row">
                    <input className="field admin-search-field" placeholder="Search items…" value={search} onChange={(e) => setSearch(e.target.value)} />
                    <select className="select-field admin-filter-select" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
                      <option value="All">All Categories</option>
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <p className="admin-count">{loading ? 'Loading…' : `Showing ${filtered.length} of ${items.length} items`}</p>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Image</th>
                          <th>Name</th>
                          <th>Category</th>
                          <th>Sub</th>
                          <th>Price</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length === 0 && !loading && (
                          <tr><td colSpan={6} className="admin-empty-row">No items found.</td></tr>
                        )}
                        {filtered.map((item, i) => (
                          <tr key={item.id}>
                            <td>
                              <img src={item.image} alt={item.name} className="admin-item-img" onError={(e) => { e.target.style.display='none' }} />
                            </td>
                            <td className="admin-item-name">{item.name}</td>
                            <td>{item.category}</td>
                            <td>{item.subcategory}</td>
                            <td className="admin-item-price">₱{item.price}</td>
                            <td className="admin-actions">
                              <button className="admin-edit-btn" onClick={() => openEdit(item)}>Edit</button>
                              <button className="admin-delete-btn" onClick={() => openDelete(item)}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ADD */}
              {view === 'add' && (
                <form onSubmit={handleAdd} className="admin-form">
                  <FormFields />
                  <div className="admin-form-actions">
                    <button type="submit" className="admin-submit-btn">ADD ITEM</button>
                    <button type="button" className="admin-cancel-btn" onClick={() => setView('list')}>CANCEL</button>
                  </div>
                </form>
              )}

              {/* EDIT */}
              {view === 'edit' && (
                <form onSubmit={handleEdit} className="admin-form">
                  <FormFields />
                  <div className="admin-form-actions">
                    <button type="submit" className="admin-save-btn">SAVE CHANGES</button>
                    <button type="button" className="admin-cancel-btn" onClick={() => { setView('list'); setForm(EMPTY_FORM) }}>CANCEL</button>
                  </div>
                </form>
              )}

              {/* DELETE CONFIRM */}
              {view === 'delete' && deleteTarget && (
                <div className="admin-delete-modal">
                  <div className="admin-delete-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d32f2f" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </div>
                  <h3 className="admin-delete-title">Delete "{deleteTarget.name}"?</h3>
                  <p className="admin-delete-desc">This action cannot be undone. The item will be permanently removed.</p>
                  <div className="admin-delete-actions">
                    <button className="admin-delete-confirm-btn" onClick={confirmDelete}>YES, DELETE</button>
                    <button className="admin-cancel-btn" onClick={() => { setDeleteTarget(null); setView('list') }}>CANCEL</button>
                  </div>
                </div>
              )}

              {/* ORDERS */}
              {view === 'orders' && (
                <div className="admin-view-body">
                  <p className="admin-count">{orders.length === 0 ? 'No orders placed yet.' : `${orders.length} order(s)`}</p>
                  {orders.length > 0 && (
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Order #</th>
                            <th>Status</th>
                            <th>Reason</th>
                            <th>Service</th>
                            <th>Phone</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Date</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...orders].reverse().map((order, i) => (
                            <tr key={order.id}>
                              <td className="admin-order-id">{order.id}</td>
                              <td>
                                <select
                                  className="admin-status-select"
                                  value={order.status}
                                  onChange={(e) => {
                                    const updated = updateOrderStatus(order.id, e.target.value)
                                    setOrders(updated)
                                    showToast(`Order ${order.id} status updated.`)
                                  }}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Preparing">Preparing</option>
                                  <option value="Out for delivery">Out for delivery</option>
                                  <option value="Ready for pickup">Ready for pickup</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </td>
                              <td className="admin-reason-cell">{order.status === 'Cancelled' ? (order.cancelReason || '—') : '—'}</td>
                              <td>{order.serviceType}</td>
                              <td>{order.phone}</td>
                              <td>{order.items?.length || 0} item(s)</td>
                              <td className="admin-order-total">₱{(order.total || 0).toFixed(2)}</td>
                              <td>{new Date(order.placedAt).toLocaleDateString()}</td>
                              <td>
                                <button
                                  className="admin-delete-btn"
                                  onClick={() => {
                                    if (window.confirm(`Delete order ${order.id}?`)) {
                                      const updated = deleteOrder(order.id)
                                      setOrders(updated)
                                      showToast(`Order ${order.id} deleted.`, 'error')
                                    }
                                  }}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
