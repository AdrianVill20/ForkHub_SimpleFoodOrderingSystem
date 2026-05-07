import { useState, useEffect } from 'react'
import TopNav from '../components/TopNav'
import { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem } from '../services/menuService'

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
      <TopNav signedIn />

      {toast && (
        <div className={`admin-toast ${toast.type === 'error' ? 'admin-toast-error' : 'admin-toast-success'}`}>
          {toast.msg}
        </div>
      )}

      <main className="content-wrap">
        <section className="form-panel" style={{ maxWidth:960 }}>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
            <h2 className="card-title" style={{ flex:1, margin:0 }}>
              {view === 'list'   && 'Menu Management'}
              {view === 'add'    && 'Add Menu Item'}
              {view === 'edit'   && 'Edit Menu Item'}
              {view === 'delete' && 'Delete Menu Item'}
            </h2>
          </div>

          <div style={{ display:'flex', gap:8, padding:'12px 0', flexWrap:'wrap' }}>
            <button className={view === 'list' ? 'btn-purple' : 'admin-nav-btn'} onClick={() => setView('list')}>📋 List Items</button>
            <button className={view === 'add'  ? 'btn-purple' : 'admin-nav-btn'} onClick={() => { setForm(EMPTY_FORM); setView('add') }}>＋ Add Item</button>
          </div>

          {/* LIST */}
          {view === 'list' && (
            <div style={{ padding:'0 0 16px' }}>
              <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
                <input className="field" style={{ flex:1, minWidth:180, margin:0 }} placeholder="Search items…" value={search} onChange={(e) => setSearch(e.target.value)} />
                <select className="select-field" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
                  <option value="All">All Categories</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>

              <p className="muted" style={{ marginBottom:10 }}>
                {loading ? 'Loading…' : `Showing ${filtered.length} of ${items.length} items`}
              </p>

              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#98008f', color:'#fff', textAlign:'left' }}>
                      <th style={th}>Image</th>
                      <th style={th}>Name</th>
                      <th style={th}>Category</th>
                      <th style={th}>Sub</th>
                      <th style={th}>Price</th>
                      <th style={th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && !loading && (
                      <tr><td colSpan={6} style={{ textAlign:'center', padding:24, color:'#999' }}>No items found.</td></tr>
                    )}
                    {filtered.map((item, i) => (
                      <tr key={item.id} style={{ background: i%2===0 ? '#fff' : '#fafafa', borderBottom:'1px solid #eee' }}>
                        <td style={td}>
                          <img src={item.image} alt={item.name} style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover' }} onError={(e) => { e.target.style.display='none' }} />
                        </td>
                        <td style={{ ...td, fontWeight:700, color:'#98008f' }}>{item.name}</td>
                        <td style={td}>{item.category}</td>
                        <td style={td}>{item.subcategory}</td>
                        <td style={{ ...td, fontWeight:700 }}>₱{item.price}</td>
                        <td style={td}>
                          <button className="btn-purple" style={{ padding:'5px 12px', fontSize:11, marginRight:6 }} onClick={() => openEdit(item)}>Edit</button>
                          <button className="btn-red"    style={{ padding:'5px 12px', fontSize:11 }}               onClick={() => openDelete(item)}>Delete</button>
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
            <form onSubmit={handleAdd} style={{ padding:'0 0 16px' }}>
              <FormFields />
              <div style={{ display:'flex', gap:10, marginTop:20 }}>
                <button type="submit" className="btn-red" style={{ flex:1 }}>ADD ITEM</button>
                <button type="button" className="admin-nav-btn" onClick={() => setView('list')}>CANCEL</button>
              </div>
            </form>
          )}

          {/* EDIT */}
          {view === 'edit' && (
            <form onSubmit={handleEdit} style={{ padding:'0 0 16px' }}>
              <FormFields />
              <div style={{ display:'flex', gap:10, marginTop:20 }}>
                <button type="submit" className="btn-purple" style={{ flex:1 }}>SAVE CHANGES</button>
                <button type="button" className="admin-nav-btn" onClick={() => { setView('list'); setForm(EMPTY_FORM) }}>CANCEL</button>
              </div>
            </form>
          )}

          {/* DELETE CONFIRM */}
          {view === 'delete' && deleteTarget && (
            <div style={{ padding:'24px 0', textAlign:'center' }}>
              <div style={{ width:80, height:80, margin:'0 auto 16px', borderRadius:'50%', background:'#ffebee', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36 }}>🗑️</div>
              <h3 style={{ color:'#d32f2f', margin:'0 0 8px' }}>Delete "{deleteTarget.name}"?</h3>
              <p className="muted" style={{ marginBottom:24 }}>This action cannot be undone. The item will be permanently removed.</p>
              <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
                <button className="btn-red"       style={{ minWidth:140 }} onClick={confirmDelete}>YES, DELETE</button>
                <button className="admin-nav-btn" style={{ minWidth:140 }} onClick={() => { setDeleteTarget(null); setView('list') }}>CANCEL</button>
              </div>
            </div>
          )}

        </section>
      </main>
    </div>
  )
}
