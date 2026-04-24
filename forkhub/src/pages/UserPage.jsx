import TopNav from '../components/TopNav'

export default function UserPage() {
  return (
    <div className="page">
      <TopNav signedIn />
      <main className="content-wrap">
        <h1 className="section-title">Profile Settings</h1>
        <p className="muted" style={{ textAlign: 'center' }}>
          Easily manage your profile settings right from this page
        </p>

        <section className="form-panel" style={{ maxWidth: 900 }}>
          <h2 className="card-title">Personal Information</h2>
          <div style={{ padding: 14 }}>
            <p className="muted">First Name: John Christian</p>
            <p className="muted">Last Name: Entoma</p>
            <p className="muted">Email: john@email.com</p>
            <p className="muted">Phone: 09227235525</p>
          </div>
        </section>

        <section className="form-panel" style={{ maxWidth: 900 }}>
          <h2 className="card-title">Address Information</h2>
          <div style={{ padding: 14 }}>
            <p className="muted">Quezon Boulevard, 1001, Quiapo, Manila</p>
            <p style={{ color: '#98008f', fontWeight: 700, marginTop: 14 }}>+ Add Address</p>
          </div>
        </section>
      </main>
    </div>
  )
}