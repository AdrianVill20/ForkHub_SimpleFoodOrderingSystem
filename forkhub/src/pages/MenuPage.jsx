import TopNav from '../components/TopNav'

export default function MenuPage() {
  const serviceType = localStorage.getItem('order_service_type') || 'Delivery'
  let userAddress = 'No saved address yet'

  try {
    const user = JSON.parse(localStorage.getItem('auth_user') || '{}')
    userAddress = user.address || userAddress
  } catch {
    userAddress = 'No saved address yet'
  }

  const categories = [
    { title: 'Pizzas' },
    { title: 'Pasta' },
    { title: 'Sides' },
    { title: 'Chicken' },
    { title: 'Desserts' },
    { title: 'Beverages' },
    { title: 'Extras' },
  ]

  return (
    <div className="page">
      <TopNav signedIn />
      <main className="content-wrap">
        <div className="layout-2col">
          <section className="light-box" style={{ padding: 10 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 44 }}>Menu</h2>
            <div className="menu-grid">
              {categories.map((item) => (
                <article key={item.title} className="menu-item">
                  <div className="menu-thumb" />
                  <h3>{item.title}</h3>
                </article>
              ))}
            </div>
          </section>

          <aside>
            <button className="btn-red" style={{ width: '100%', marginBottom: 10 }}>
              Checkout
            </button>
            <div className="light-box">
              <h3 className="card-title" style={{ fontSize: 18 }}>
                Order Settings
              </h3>
              <div style={{ padding: 12 }}>
                <p>
                  <strong>My Location</strong>
                </p>
                <p className="muted">{userAddress}</p>
                <p style={{ marginTop: 10 }}>
                  <strong>Service</strong>
                </p>
                <p className="muted">{serviceType}</p>
                <p style={{ marginTop: 10 }}>
                  <strong>My Store</strong>
                </p>
                <p className="muted">Espana Boulevard, Sampaloc, PH</p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}