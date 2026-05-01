import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'

export default function Home() {
  const navigate = useNavigate()
  const startOrder = (serviceType) => {
    localStorage.setItem('order_service_type', serviceType)
    navigate('/login', { state: { nextPath: '/menu' } })
  }

  return (
    <div className="page">
      <TopNav />
      <main className="content-wrap">
        <div className="order-strip">
          <span>Start your order</span>
          <button className="btn-red" onClick={() => startOrder('Delivery')}>
            Delivery
          </button>
          <span>or</span>
          <button className="btn-red" onClick={() => startOrder('Take Out')}>
            Take Out
          </button>
        </div>

        <section className="hero-banner">
          <div className="hero-main hero-promo">
            <span className="hero-chip" style={{ right: 18, top: 116 }}>
              FREE
            </span>
            <span className="hero-chip" style={{ left: 20, bottom: 24 }}>
              565
            </span>
          </div>
          <div className="hero-side">
            <div className="hero-promo" />
            <div className="hero-promo" style={{ background: 'linear-gradient(160deg, #ffe3cf 0%, #ffd2c0 100%)' }} />
          </div>
        </section>

        <div style={{ marginTop: 20 }}>
          <button className="btn-purple" onClick={() => navigate('/login', { state: { nextPath: '/menu' } })}>
            Sign In To Continue
          </button>
        </div>
      </main>
    </div>
  )
}