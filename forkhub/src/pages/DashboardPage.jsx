import TopNav from '../components/TopNav'

export default function DashboardPage() {
  return (
    <div className="page">
      <TopNav signedIn />
      <main className="content-wrap">
        <h1 className="section-title">Your ForkHub&apos;s Profile</h1>
        <p className="muted" style={{ textAlign: 'center', marginBottom: 20 }}>
          Manage and edit your profile settings
        </p>

        <section className="form-panel" style={{ maxWidth: 900 }}>
          <h2 className="card-title">Profile Settings</h2>
          <div style={{ padding: 16 }}>
            <p className="muted">Review and manage your saved personal info, addresses, and payment preferences.</p>
            <div className="layout-2col" style={{ marginTop: 12 }}>
              <div>
                <h3 style={{ margin: '0 0 8px' }}>Your Information</h3>
                <p className="muted">John Christian Entoma</p>
                <p className="muted">john@email.com</p>
                <p className="muted">09227235525</p>
              </div>
              <div>
                <h3 style={{ margin: '0 0 8px' }}>Primary Address</h3>
                <p className="muted">No saved address yet</p>
                <p style={{ color: '#98008f', fontWeight: 700, marginTop: 8 }}>+ Add Address</p>
              </div>
            </div>
          </div>
        </section>

        <section className="form-panel" style={{ maxWidth: 900 }}>
          <h2 className="card-title">E-Coupons</h2>
          <div style={{ padding: 16, display: 'flex', gap: 14 }}>
            <div className="light-box" style={{ borderRadius: 20, padding: 16, width: 170 }}>
              <p style={{ margin: 0, color: '#98008f', fontWeight: 700 }}>Free delivery with minimum purchase</p>
              <button className="btn-red" style={{ marginTop: 10, padding: '6px 12px' }}>
                Add Coupon
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}