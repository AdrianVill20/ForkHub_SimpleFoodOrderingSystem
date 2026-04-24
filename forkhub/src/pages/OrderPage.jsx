import TopNav from '../components/TopNav'

export default function OrderPage() {
  return (
    <div className="page">
      <TopNav signedIn />
      <main className="content-wrap">
        <section className="light-box" style={{ padding: 12 }}>
          <h2 style={{ margin: '0 0 10px', fontSize: 42 }}>Pizza</h2>
          <div className="pizza-grid">
            {['Beef & Mushroom Melt', 'Cheese Mania', 'Ham & Cheese', 'Hawaiian Classic', 'Pepperoni', 'Bacon & Mushroom'].map((name) => (
              <article key={name} className="pizza-card">
                <div className="food-circle" style={{ margin: '0 auto 8px' }} />
                <p style={{ color: '#98008f', fontWeight: 700, minHeight: 36 }}>{name}</p>
                <button className="btn-red" style={{ width: '100%', padding: '8px 10px', marginTop: 6 }}>
                  Add To Order
                </button>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}