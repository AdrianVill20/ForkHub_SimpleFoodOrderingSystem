import TopNav from '../components/TopNav'

export default function AdminPage() {
  return (
    <div className="page">
      <TopNav signedIn />
      <main className="content-wrap">
        <section className="form-panel" style={{ maxWidth: 920 }}>
          <h2 className="card-title">Admin Actions</h2>
          <div style={{ padding: 16, display: 'grid', gap: 10 }}>
            <button className="btn-red">List Menu & Orders</button>
            <button className="btn-red">Add Menu Item</button>
            <button className="btn-red">Edit Menu / Order</button>
            <button className="btn-red">Delete Menu / Order</button>
          </div>
        </section>
      </main>
    </div>
  )
}