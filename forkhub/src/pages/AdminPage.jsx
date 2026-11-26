import { useState, useEffect, useRef, useCallback } from 'react'
import TopNav from '../components/TopNav'
import { getMenuItems, addMenuItem, updateMenuItem } from '../services/menuService'
import { getAllOrders, updateOrderStatus } from '../services/orderService'
import Pagination from '../components/Pagination'
import { PAGE_SIZE, paginate } from '../utils/pagination'
import { formatName } from '../utils/formatName'
import { useLocation, useSearchParams } from 'react-router-dom'
import { ORDER_STATUS, ORDER_STATUS_FLOW, ROLES } from '../constants'

const CATEGORIES = ['Pizza','Pasta','Sides','Chicken','Desserts','Beverages','Extras']
// Views the top bar links to with /admin?view=... ('list' is plain /admin)
const TAB_VIEWS = ['list', 'add', 'orders', 'users']

// Admin order list is sorted in status order; newest first inside each status.
function sortOrdersByStatus(list) {
  const rank = (status) => { const i = ORDER_STATUS_FLOW.indexOf(status); return i === -1 ? ORDER_STATUS_FLOW.length : i }
  return [...list].sort((a, b) => rank(a.status) - rank(b.status) || new Date(b.placedAt) - new Date(a.placedAt))
}
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
      <label style={{ fontWeight:700, fontSize:13, color:'var(--color-on-surface)', display:'block', marginBottom:2, marginTop:10 }}>
        Food Image
      </label>
      <div
        onDragOver={(e)=>{ e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); upload(e.dataTransfer.files[0]) }}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--color-tertiary)' : 'var(--color-outline-variant)'}`,
          borderRadius: 10, padding: '18px 12px', textAlign: 'center',
          cursor: 'pointer', color: 'var(--color-on-surface-variant)', backgroundColor: dragOver ? 'var(--color-surface-container-low)' : 'transparent',
          transition: 'all .2s', marginTop: 4,
        }}
      >
        {uploading ? (
          <p style={{ color:'var(--color-primary)', fontWeight:600, margin:0 }}>Uploading…</p>
        ) : value ? (
          <>
            <img
              src={value}
              alt="preview"
              onError={(e) => (e.target.style.display = 'none')}
              style={{ width:80, height:80, borderRadius:'50%', objectFit:'cover', border:'2px solid var(--color-outline-variant)', display:'block', margin:'0 auto 8px' }}
            />
            <p style={{ fontSize:12, color:'var(--color-on-surface-variant)', margin:0 }}>Drop a new image to replace, or click to browse</p>
            <p style={{ fontSize:11, color:'var(--color-outline)', margin:'4px 0 0', wordBreak:'break-all' }}>{value}</p>
          </>
        ) : (
          <>
            <p style={{ fontSize:26, margin:0 }}>🖼️</p>
            <p style={{ fontSize:13, color:'var(--color-on-surface-variant)', marginTop:6 }}>Drag &amp; drop food image here, or <u>click to browse</u></p>
            <p style={{ fontSize:11, color:'var(--color-outline)' }}>PNG · JPG · WebP · max 5 MB</p>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={(e) => upload(e.target.files?.[0])} />
      </div>
    </>
) 

}

function FormFields({ form, setForm, showAvailability = false }) {
  const lbl = { fontWeight:700, fontSize:13, color:'var(--color-on-surface)', display:'block', marginBottom:2, marginTop:10 }

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

      {showAvailability && (
        <label className="admin-availability-toggle">
          <input
            type="checkbox"
            checked={form.unavailable !== true}
            onChange={(e) => setForm({ ...form, unavailable: !e.target.checked })}
          />
          <span>Available for orders</span>
        </label>
      )}

      <ImageUpload
        category={form.category}
        value={form.image}
        onChange={(path) => setForm({...form, image: path})}
      />
    </>
  )
}

export default function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const tab = TAB_VIEWS.includes(searchParams.get('view')) ? searchParams.get('view') : 'list'
  const [view, setView]               = useState(tab)
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
  const [itemPage, setItemPage]       = useState(1)
  const [orderPage, setOrderPage]     = useState(1)
  const [userPage, setUserPage]       = useState(1)
  const [orderStatusFilter, setOrderStatusFilter] = useState('All')

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2800)
  }, [])

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getMenuItems()
      setItems(data)
    } catch {
      showToast('Failed to load menu items.', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { void reload() }, [reload])

  const loadUsers = useCallback(async () => {
    const token = localStorage.getItem('auth_token') || ''
    const res = await fetch('/api/auth/users', {
      headers: { Authorization: `Bearer ${token}` },
    })
    setUsers(await res.json())
  }, [])

  // A top-bar link was clicked (or the page was opened/refreshed): show that tab and load its data.
  // location.key changes on every click, so clicking "Menu" while editing still returns to the list.
  useEffect(() => {
    setView(tab)
    if (tab === 'add') setForm(EMPTY_FORM)
    if (tab === 'orders') getAllOrders().then((list) => setOrders(sortOrdersByStatus(list))).catch(() => setOrders([]))
    if (tab === 'users') void loadUsers()
  }, [tab, location.key, loadUsers])

  // Switch to a top-bar tab from inside the page, keeping the address in sync
  function goTo(next) {
    setView(next)
    setSearchParams(next === 'list' ? {} : { view: next })
  }

  const filtered = items.filter((item) => {
    const matchCat    = filterCat === 'All' || item.category === filterCat
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })
  const itemPaging  = paginate(filtered, itemPage)
  const itemRangeStart = filtered.length ? (itemPaging.current - 1) * PAGE_SIZE + 1 : 0
  const itemRangeEnd = Math.min(itemPaging.current * PAGE_SIZE, filtered.length)
  const filteredOrders = orders.filter((order) => orderStatusFilter === 'All' || order.status === orderStatusFilter)
  const orderPaging = paginate(filteredOrders, orderPage)
  const userPaging  = paginate(users, userPage)
  // The Action column only holds "Restore", so show it only when some account is pending deletion
  const hasPendingDeletion = users.some((user) => user.isDeleted)

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.name || !form.price) return
    try {
      await addMenuItem({ ...form, price: Number(form.price) })
      await reload()
      showToast(`"${form.name}" added successfully!`)
      setForm(EMPTY_FORM)
      goTo('list')
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
      goTo('list')
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
      goTo('list')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div className="page">
      <TopNav />

      {toast && (
        <div className={`admin-toast ${toast.type === 'error' ? 'admin-toast-error' : 'admin-toast-success'}`}>
          {toast.msg}
        </div>
      )}

      <main className="content-wrap admin-content-wrap">
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
              {/* LIST */}
              {view === 'list' && (
                <div className="admin-view-body">
                  <div className="admin-search-row">
                    <input className="field admin-search-field" placeholder="Search items…" value={search} onChange={(e) => { setSearch(e.target.value); setItemPage(1) }} />
                    <select className="select-field admin-filter-select" value={filterCat} onChange={(e) => { setFilterCat(e.target.value); setItemPage(1) }}>
                      <option value="All">All Categories</option>
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <p className="admin-count">
                    {loading
                      ? 'Loading…'
                      : `Showing ${itemRangeStart}${itemRangeEnd !== itemRangeStart ? `-${itemRangeEnd}` : ''} of ${filtered.length} items${filtered.length !== items.length ? ` (filtered from ${items.length})` : ''}`}
                  </p>
                  <div className="admin-table-wrap">
                    <table className="admin-table admin-table--menu">
                      <thead>
                        <tr>
                          <th>Image</th>
                          <th>Name</th>
                          <th>Category</th>
                          <th>Sub</th>
                          <th>Price</th>
                          <th className="admin-actions-heading">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length === 0 && !loading && (
                          <tr><td colSpan={6} className="admin-empty-row">No items found.</td></tr>
                        )}
                        {itemPaging.rows.map((item) => (
                          <tr key={item.id} style={{ backgroundColor: item.unavailable ? 'var(--color-surface-container-low)' : 'transparent' }}>
                            <td>
                              <img src={item.image} alt={item.name} className="admin-item-img" onError={(e) => { e.target.style.display='none' }} style={{ filter: item.unavailable ? 'grayscale(100%)' : 'none', opacity: item.unavailable ? 0.5 : 1 }} />
                            </td>
                            <td className="admin-item-name">
                              {item.name}
                              {item.unavailable && (
                                <span style={{ marginLeft: 8, color: 'var(--color-primary-container)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                                  [UNAVAILABLE]
                                </span>
                              )}
                            </td>
                            <td>{item.category}</td>
                            <td>{item.subcategory}</td>
                            <td className="admin-item-price">₱{item.price}</td>
                            <td className="admin-actions-cell">
                              <div className="admin-actions-group">
                                <button className="admin-edit-btn" onClick={() => openEdit(item)}>Edit</button>
                                <button
                                  className={`admin-action-btn ${item.unavailable ? 'admin-action-btn--available' : 'admin-action-btn--unavailable'}`}
                                  onClick={() => openDelete(item)}
                                >
                                  {item.unavailable ? 'Mark Available' : 'Mark Unavailable'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination page={itemPaging.current} totalPages={itemPaging.totalPages} onChange={setItemPage} />
                </div>
              )}

              {/* ADD */}
              {view === 'add' && (
                <form onSubmit={handleAdd} className="admin-form">
                  <FormFields form={form} setForm={setForm} />
                  <div className="admin-form-actions">
                    <button type="submit" className="admin-submit-btn">ADD ITEM</button>
                    <button type="button" className="admin-cancel-btn" onClick={() => goTo('list')}>CANCEL</button>
                  </div>
                </form>
              )}

              {/* EDIT */}
              {view === 'edit' && (
                <form onSubmit={handleEdit} className="admin-form">
                  <FormFields form={form} setForm={setForm} showAvailability />
                  <div className="admin-form-actions">
                    <button type="submit" className="admin-save-btn">SAVE CHANGES</button>
                    <button type="button" className="admin-cancel-btn" onClick={() => { goTo('list'); setForm(EMPTY_FORM) }}>CANCEL</button>
                  </div>
                </form>
              )}

              {/* DELETE CONFIRM */}
              {view === 'delete' && deleteTarget && (
                <div className="admin-delete-modal">
                  <div className="admin-delete-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={deleteTarget.unavailable ? 'var(--color-secondary-container)' : 'var(--color-primary-container)'} strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
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
                    <button className="admin-cancel-btn" onClick={() => { setDeleteTarget(null); goTo('list') }}>CANCEL</button>
                  </div>
                </div>
              )}

              {/* ORDERS */}
              {view === 'orders' && (
                <div className="admin-view-body">
                  <div className="admin-orders-toolbar">
                    <p className="admin-count">{orders.length === 0 ? 'No orders placed yet.' : `${filteredOrders.length} of ${orders.length} order(s)`}</p>
                    <label className="admin-orders-status-filter">
                      <span>Filter status</span>
                      <select
                        className="select-field admin-filter-select"
                        value={orderStatusFilter}
                        onChange={(e) => { setOrderStatusFilter(e.target.value); setOrderPage(1) }}
                      >
                        <option value="All">All statuses</option>
                        {ORDER_STATUS_FLOW.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </label>
                  </div>
                  {orders.length > 0 && filteredOrders.length > 0 && (
                    <div className="admin-table-wrap">
                      <table className="admin-table admin-table--orders">
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
                          </tr>
                        </thead>
                        <tbody>
                          {orderPaging.rows.map((order) => (
                            <tr key={order.id}>
                              <td className="admin-order-id">{order.id}</td>
                              <td>
                                <select
                                  className="admin-status-select"
                                  value={order.status}
                                  onChange={async (e) => {
                                    try{
                                    await updateOrderStatus(order.id, e.target.value)
                                    // Keep rows where they are; re-sorting by status would move this one to another page
                                    const fresh = await getAllOrders()
                                    setOrders((prev) => {
                                      const pos = new Map(prev.map((o, i) => [o.id, i]))
                                      return [...fresh].sort((a, b) => (pos.get(a.id) ?? -1) - (pos.get(b.id) ?? -1))
                                    })
                                    showToast(`Order ${order.id} status updated.`)
                                    } catch { showToast('Failed to update status.', 'error') }
                                  }}
                                >
                                  {ORDER_STATUS_FLOW.map((status) => (
                                    <option key={status} value={status}>{status}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="admin-reason-cell">{order.status === ORDER_STATUS.CANCELLED ? (order.cancelReason || '—') : '—'}</td>
                              <td>{order.serviceType}</td>
                              <td className="admin-address-cell">
                                {order.address || '—'}
                              </td>
                              <td>{order.phone}</td>
                              <td>
                                {order.items?.length || 0} item(s)
                                {order.items?.filter((item) => item.note).map((item, n) => (
                                  <div key={n} style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                                    Note ({item.name}): {item.note}
                                  </div>
                                ))}
                              </td>
                              <td className="admin-order-total">₱{(order.total || 0).toFixed(2)}</td>
                              <td>{new Date(order.placedAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {orders.length > 0 && filteredOrders.length === 0 && (
                    <p className="admin-empty-row">No orders match this status.</p>
                  )}
                  <Pagination page={orderPaging.current} totalPages={orderPaging.totalPages} onChange={setOrderPage} />
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
                      <table className="admin-table admin-table--users">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th>Status</th>
                            <th>Deletion Date</th>
                            {hasPendingDeletion && <th className="admin-actions-heading">Action</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {userPaging.rows.map((user) => (
                            <tr key={user.id} style={{ opacity: user.isDeleted ? 0.7 : 1, background: user.isDeleted ? 'var(--color-error-container)' : 'transparent' }}>
                              <td className="admin-item-name">
                                {formatName(user.firstName, user.lastName) || '—'}
                              </td>
                              <td style={{ fontSize: 12 }}>{user.email}</td>
                              <td>
                                <span style={{
                                  padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                                  background: 'var(--color-surface-container-low)',
                                  color:      user.role === ROLES.ADMIN ? 'var(--color-tertiary)' : 'var(--color-on-surface-variant)',
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
                                  background: user.isDeleted ? 'var(--color-error-container)' : 'var(--color-secondary-fixed)',
                                  color:      user.isDeleted ? 'var(--color-error)' : 'var(--color-secondary)',
                                }}>
                                  {user.isDeleted ? 'Pending Deletion' : 'Active'}
                                </span>
                              </td>
                              <td style={{ fontSize: 12, color: user.isDeleted ? 'var(--color-error)' : 'var(--color-outline)' }}>
                                {user.scheduledDeletionAt
                                  ? new Date(user.scheduledDeletionAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                                  : '—'}
                              </td>
                              {hasPendingDeletion && (
                                <td className="admin-actions-cell">
                                  <div className="admin-actions-group">
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
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <Pagination page={userPaging.current} totalPages={userPaging.totalPages} onChange={setUserPage} />
                </div>
              )}

            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
