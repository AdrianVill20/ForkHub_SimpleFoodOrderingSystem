import TopNav from '../components/TopNav'

export default function TrackingPage() {
  return (
    <div className="page">
      <TopNav signedIn />
      <main className="content-wrap">
        <section className="form-panel" style={{ maxWidth: 920 }}>
          <h2 className="card-title">Track Your Order</h2>
          <div style={{ padding: 16 }}>
            <p className="muted">Search for your order with your phone number.</p>
            <label>Phone #:</label>
            <input className="field" style={{ maxWidth: 500 }} />
            <div style={{ textAlign: 'right' }}>
              <button className="btn-red">Track Your Order</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}