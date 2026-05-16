import { useState, useEffect,  useRef, useCallback } from 'react'
import TopNav from '../components/TopNav'
import { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem } from '../services/menuService'
import { getAllOrders, deleteOrder, updateOrderStatus } from '../services/orderService'
import { Form } from 'react-router-dom'

const CATEGORIES = ['Pizza','Pasta','Sides','Chicken','Desserts','Beverages','Extras']
const EMPTY_FORM  = { name:'', category:'Pizza', subcategory:'Classic', description:'', price:'', image:'' }


function ImageUpload({ category, value, onChange }) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const upload = useCallback(async (file) => {
    if (!file?.type?.startsWith('image/')) { alert('Please select an image file.'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('category', category) 
      fd.append('image', file)
      const token = localStorage.getItem('auth_token') || ''
      const res = await fetch('/api/menu/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Upload failed')
      onChange(data.path)
    } catch (err) { alert(`Upload failed: ${err.message}`) }
    finally { setUploading(false) }
  }, [category, onChange])

  return (
    <>
      <label style={{ fontWeight:700, fontSize:13, color:'#2e2e2e', display:'block', marginBottom:2, marginTop:10 }}>
        Food Image
      </label>
      <div
        onDragOver={(e)=>{ e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); upload(e.dataTransfer.files[0]) }}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? '#1976d2' : '#ccc'}`,
          borderRadius: 10, padding: '18px 12px', textAlign: 'center',
          cursor: 'pointer', color: '#555', backgroundColor: dragOver ? '#e3f2fd' : 'transparent',
          transition: 'all .2s', marginTop: 4,
        }}
      >
        {uploading ? (
          <p style={{ color:'#7c3aed', fontWeight:600, margin:0 }}>Uploading…</p>
        ) : value ? (
          <>
            <img
              src={value}
              alt="preview"
              onError={(e) => (e.target.style.display = 'none')}
              style={{ width:80, height:80, borderRadius:'50%', objectFit:'cover', border:'2px solid #ddd', display:'block', margin:'0 auto 8px' }}
            />
            <p style={{ fontSize:12, color:'#666', margin:0 }}>Drop a new image to replace, or click to browse</p>
            <p style={{ fontSize:11, color:'#aaa', margin:'4px 0 0', wordBreak:'break-all' }}>{value}</p>
          </>
        ) : (
          <>
            <p style={{ fontSize:26, margin:0 }}>🖼️</p>
            <p style={{ fontSize:13, color:'#666', marginTop:6 }}>Drag &amp; drop food image here, or <u>click to browse</u></p>
            <p style={{ fontSize:11, color:'#aaa' }}>PNG · JPG · WebP · max 5 MB</p>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={(e) => upload(e.target.files?.[0])} />
      </div>
    </>
) 

}

function FormFields({ form, setForm }) {
  const lbl = { fontWeight:700, fontSize:13, color:'#2e2e2e', display:'block', marginBottom:2, marginTop:10 }

  return (
    <>
      <label style={lbl}>Item Name *</label>
      <input 
        className="field" 
        value={form.name} 
        onChange={(e) => setForm({...form, name: e.target.value})} 
        placeholder="e.g. Pepperoni Pizza" 
        required 
      />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div>
          <label style={lbl}>Category *</label>
          <select className="select-field" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Subcategory</label>
          <input 
            className="field" 
            value={form.subcategory} 
            onChange={(e) => setForm({...form, subcategory: e.target.value})} 
            placeholder="e.g. Classic" 
          />
        </div>
      </div>

      <label style={lbl}>Description</label>
      <textarea 
        className="field" 
        rows={3} 
        value={form.description} 
        onChange={(e) => setForm({...form, description: e.target.value})} 
        placeholder="Ingredients / description" 
      />

      <label style={lbl}>Price (₱) *</label>
      <input 
        className="field" 
        type="number" 
        min="1" 
        value={form.price} 
        onChange={(e) => setForm({...form, price: e.target.value})} 
        placeholder="169" 
        required 
        />

         <ImageUpload
        category={form.category}
        value={form.image}
        onChange={(path) => setForm({...form, image: path})}
      />
    </>
  )
}

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
  const [users, setUsers] = useState([])

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

  async function loadUsers() {
  const token = localStorage.getItem('auth_token') || ''
  const res   = await fetch('/api/auth/users', {
    headers: { Authorization: `Bearer ${token}` },
  })
  setUsers(await res.json())
}

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
      // Toggle unavailable status instead of deleting
      const newStatus = !deleteTarget.unavailable
      await updateMenuItem(deleteTarget.id, { unavailable: newStatus })
      await reload()
      if (newStatus) {
        showToast(`"${deleteTarget.name}" marked as unavailable.`, 'error')
      } else {
        showToast(`"${deleteTarget.name}" is now available again.`, 'success')
      }
      setDeleteTarget(null)
      setView('list')
    } catch (err) {
      showToast(err.message, 'error')
    }
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
                {view === 'users'  && 'User Accounts'}
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
                <button className={`admin-tab ${view === 'orders' ? 'active' : ''}`} onClick={async () => { try { setOrders(await getAllOrders()) } catch { setOrders([]) } setView('orders') }}>
                   <img src="/favicon.svg" alt="" className="admin-tab-icon" /> Orders
                </button>
                <button className={`admin-tab ${view === 'users' ? 'active' : ''}`} onClick={() => { loadUsers(); setView('users') }}>
                  <img src="/favicon.svg" alt="" className="admin-tab-icon" /> User Accounts
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
                          <tr key={item.id} style={{ opacity: item.unavailable ? 0.6 : 1, backgroundColor: item.unavailable ? '#fafafa' : 'transparent' }}>
                            <td>
                              <img src={item.image} alt={item.name} className="admin-item-img" onError={(e) => { e.target.style.display='none' }} style={{ filter: item.unavailable ? 'grayscale(100%)' : 'none', opacity: item.unavailable ? 0.5 : 1 }} />
                            </td>
                            <td className="admin-item-name">
                              {item.name}
                              {item.unavailable && (
                                <span style={{ marginLeft: 8, color: '#d32f2f', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                                  [UNAVAILABLE]
                                </span>
                              )}
                            </td>
                            <td>{item.category}</td>
                            <td>{item.subcategory}</td>
                            <td className="admin-item-price">₱{item.price}</td>
                            <td className="admin-actions">
                              <button className="admin-edit-btn" onClick={() => openEdit(item)}>Edit</button>
                              <button 
                                className={`admin-delete-btn ${item.unavailable ? 'admin-enable-btn' : ''}`}
                                onClick={() => openDelete(item)}
                              >
                                {item.unavailable ? 'Enable' : 'Unavailable'}
                              </button>
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
                  <FormFields form={form} setForm={setForm} />
                  <div className="admin-form-actions">
                    <button type="submit" className="admin-submit-btn">ADD ITEM</button>
                    <button type="button" className="admin-cancel-btn" onClick={() => setView('list')}>CANCEL</button>
                  </div>
                </form>
              )}

              {/* EDIT */}
              {view === 'edit' && (
                <form onSubmit={handleEdit} className="admin-form">
                  <FormFields form={form} setForm={setForm} />
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
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={deleteTarget.unavailable ? '#4caf50' : '#d32f2f'} strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </div>
                  <h3 className="admin-delete-title">
                    {deleteTarget.unavailable ? 'Re-enable' : 'Mark as Unavailable'} "{deleteTarget.name}"?
                  </h3>
                  <p className="admin-delete-desc">
                    {deleteTarget.unavailable 
                      ? 'This item will be available for customers to order again.' 
                      : 'This item will be hidden from customers but can be re-enabled later.'}
                  </p>
                  <div className="admin-delete-actions">
                    <button className="admin-delete-confirm-btn" onClick={confirmDelete}>
                      {deleteTarget.unavailable ? 'YES, ENABLE' : 'YES, MAKE UNAVAILABLE'}
                    </button>
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
                            <th>Address</th>
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
                                  onChange={async (e) => {
                                    try{
                                    await updateOrderStatus(order.id, e.target.value)
                                    setOrders(await getAllOrders())
                                    showToast(`Order ${order.id} status updated.`)
                                    } catch { showToast('Failed to update status.', 'error') }
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
                              <td style={{ fontSize: 12, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {order.address || '—'}
                              </td>
                              <td>{order.phone}</td>
                              <td>{order.items?.length || 0} item(s)</td>
                              <td className="admin-order-total">₱{(order.total || 0).toFixed(2)}</td>
                              <td>{new Date(order.placedAt).toLocaleDateString()}</td>
                              <td>
                                <button
                                  className="admin-delete-btn"
                                  onClick={async () => {
                                    if (window.confirm(`Delete order ${order.id}?`)) {
                                      try {
                                        await deleteOrder(order.id)
                                        setOrders(await getAllOrders())
                                        showToast(`Order ${order.id} deleted.`, 'error')
                                      } catch { showToast('Failed to delete order.', 'error') }
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

              {/* USERS */}
              {view === 'users' && (
                <div className="admin-view-body">
                  <p className="admin-count">
                    {users.length === 0 ? 'No accounts found' : `${users.length} account(s) - ${users.filter(u => !u.isDeleted).length} active, ${users.filter(u => u.isDeleted).length} pending deleted`}
                  </p>
                  {users.length > 0 && (
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th>Status</th>
                            <th>Deletion Date</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.id} style={{ opacity: user.isDeleted ? 0.7 : 1, background: user.isDeleted ? '#fff5f5' : 'transparent' }}>
                              <td className="admin-item-name">
                                {[user.firstName, user.lastName].filter(Boolean).join(' ') || '—'}
                              </td>
                              <td style={{ fontSize: 12 }}>{user.email}</td>
                              <td>
                                <span style={{
                                  padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                                  background: user.role === 'admin' ? '#e8eaf6' : '#f5f5f5',
                                  color:      user.role === 'admin' ? '#3949ab' : '#555',
                                }}>
                                  {user.role}
                                </span>
                              </td>
                              <td style={{ fontSize: 12 }}>
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                              </td>
                              <td>
                                <span style={{
                                  padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                                  background: user.isDeleted ? '#fdecea' : '#e8f5e9',
                                  color:      user.isDeleted ? '#c62828' : '#2e7d32',
                                }}>
                                  {user.isDeleted ? 'Pending Deletion' : 'Active'}
                                </span>
                              </td>
                              <td style={{ fontSize: 12, color: user.isDeleted ? '#c62828' : '#aaa' }}>
                                {user.scheduledDeletionAt
                                  ? new Date(user.scheduledDeletionAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                                  : '—'}
                              </td>
                              <td className="admin-actions">
                                {user.isDeleted && (
                                  <button
                                    className="admin-edit-btn"
                                    onClick={async () => {
                                      const token = localStorage.getItem('auth_token') || ''
                                      await fetch(`/api/auth/users/${user.id}/restore`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
                                      loadUsers()
                                      showToast(`"${user.email}" restored.`)
                                    }}
                                  >
                                    Restore
                                  </button>
                                )}
                                {user.role !== 'admin' && (
                                  <button
                                    className="admin-delete-btn"
                                    onClick={async () => {
                                      if (!window.confirm(`Permanently delete "${user.email}"? This cannot be undone.`)) return
                                      const token = localStorage.getItem('auth_token') || ''
                                      await fetch(`/api/auth/users/${user.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
                                      loadUsers()
                                      showToast(`"${user.email}" deleted.`, 'error')
                                    }}
                                  >
                                    Force Delete
                                  </button>
                                )}
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
