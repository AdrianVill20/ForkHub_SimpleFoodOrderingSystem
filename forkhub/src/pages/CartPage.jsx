import TopNav from '../components/TopNav'

export default function CartPage() {
  return (
    <div className="page">
      <TopNav signedIn />
      <main className="content-wrap">
        <div className="layout-2col">
          <section className="light-box" style={{ padding: 10 }}>
            <h2 style={{ margin: '0 0 10px', fontSize: 44 }}>Cart</h2>
            <div style={{ borderTop: '1px solid #ddd', paddingTop: 12 }}>
              <p style={{ fontWeight: 700 }}>Review and modify your items here.</p>
              <div style={{ marginTop: 10, border: '1px solid #ddd', padding: 12, display: 'grid', gridTemplateColumns: '100px 1fr 120px' }}>
                <div className="food-circle small" />
                <div>
                  <p style={{ color: '#98008f', fontWeight: 700 }}>Family Hand Tossed Beef & Mushroom Melt</p>
                  <p className="muted">Quantity: 1</p>
                </div>
                <p style={{ textAlign: 'right', fontWeight: 700 }}>P619.00</p>
              </div>
              <p style={{ textAlign: 'right', marginTop: 24, fontSize: 24, fontWeight: 700 }}>Order Total: P619.00</p>
            </div>
          </section>

          <aside>
            <div className="light-box" style={{ marginBottom: 10 }}>
              <h3 className="card-title" style={{ fontSize: 18 }}>
                Review Order Settings
              </h3>
              <div style={{ padding: 12 }}>
                <p className="muted">Store: Taft Avenue</p>
                <p className="muted">Service: Take Out</p>
                <p className="muted">Timing: Now</p>
              </div>
            </div>
            <button className="btn-red" style={{ width: '100%' }}>
              Continue Checkout
            </button>
          </aside>
        </div>
      </main>
    </div>
  )
}