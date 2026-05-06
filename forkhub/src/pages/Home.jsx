import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'
import heroImage from '../assets/hero.png'
import deliveryIcon from '../assets/delivery-icon.svg'
import takeoutIcon from '../assets/takeout-icon.svg'
import pizzaIcon from '../assets/pizza-icon.svg'
import fastIcon from '../assets/fast-icon.svg'
import dealsIcon from '../assets/deals-icon.svg'
import trackingIcon from '../assets/tracking-icon.svg'

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
        {/* Hero Section */}
        <section className="home-hero">
          <div className="hero-background">
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
            <div className="blob blob-3"></div>
          </div>
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">Welcome to ForkHub</h1>
              <p className="hero-subtitle">Your gateway to delicious food at your doorstep</p>
              <p className="hero-description">
                Discover amazing restaurants, order your favorite meals, and enjoy fast delivery or convenient takeout service.
              </p>
            </div>
            <div className="hero-visual">
              <div className="food-circle-large"></div>
              <img src={heroImage} alt="Hero decoration" className="hero-img-decoration" />
              <div className="floating-badge badge-1">Fresh & Tasty</div>
              <div className="floating-badge badge-2">Fast Delivery</div>
              <div className="floating-badge badge-3">Best Prices</div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-background"></div>
          <h2>Ready to Order?</h2>
          <p>Choose how you want to receive your food</p>
          <div className="cta-buttons">
            <button 
              className="btn-large btn-delivery" 
              onClick={() => startOrder('Delivery')}
            >
              <img src={deliveryIcon} alt="Delivery" className="btn-icon-img" />
              <span className="btn-text">Delivery</span>
            </button>
            <button 
              className="btn-large btn-takeout" 
              onClick={() => startOrder('Take Out')}
            >
              <img src={takeoutIcon} alt="Take Out" className="btn-icon-img" />
              <span className="btn-text">Take Out</span>
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <div className="features-background"></div>
          <h2>Why Choose ForkHub?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <img src={pizzaIcon} alt="Pizza" className="feature-icon-img" />
              <h3>Wide Selection</h3>
              <p>Browse from hundreds of restaurants and thousands of delicious dishes</p>
            </div>
            <div className="feature-card">
              <img src={fastIcon} alt="Fast" className="feature-icon-img" />
              <h3>Quick & Easy</h3>
              <p>Order in just a few taps and get your food delivered quickly</p>
            </div>
            <div className="feature-card">
              <img src={dealsIcon} alt="Deals" className="feature-icon-img" />
              <h3>Great Deals</h3>
              <p>Enjoy exclusive offers and discounts on your favorite meals</p>
            </div>
            <div className="feature-card">
              <img src={trackingIcon} alt="Tracking" className="feature-icon-img" />
              <h3>Real-time Tracking</h3>
              <p>Track your order in real-time from restaurant to your doorstep</p>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="about-section">
          <div className="about-background"></div>
          <div className="about-content">
            <h2>About ForkHub</h2>
            <p>
              ForkHub is your one-stop destination for all your food cravings. We connect you with the best 
              local restaurants and eateries, offering a seamless ordering experience with fast delivery and 
              reliable service.
            </p>
            <p>
              Whether you're looking for a quick lunch, a special dinner, or late-night snacks, ForkHub has 
              you covered with an extensive menu of cuisines and restaurants to choose from.
            </p>
            <div className="about-stats">
              <div className="stat">
                <div className="stat-number">500+</div>
                <div className="stat-label">Restaurants</div>
              </div>
              <div className="stat">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Menu Items</div>
              </div>
              <div className="stat">
                <div className="stat-number">30min</div>
                <div className="stat-label">Avg Delivery</div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="final-cta">
          <div className="final-cta-background"></div>
          <h2>Get Started Now</h2>
          <button 
            className="btn-purple btn-cta" 
            onClick={() => navigate('/login', { state: { nextPath: '/menu' } })}
          >
            Sign In To Continue
          </button>
        </section>
      </main>
    </div>
  )
}