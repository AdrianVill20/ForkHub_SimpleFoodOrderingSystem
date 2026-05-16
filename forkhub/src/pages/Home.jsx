import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'

export default function Home() {
  const navigate = useNavigate()

  const startOrder = (serviceType) => {
    localStorage.setItem('order_service_type', serviceType)
    navigate('/menu')
  }

  const foodCategories = [
    { name: 'Pizza', image: '/images/pizza/CheeseMania.jpg' },
    { name: 'Pasta', image: '/images/pasta/ChickenAlfredo.jpg' },
    { name: 'Chicken', image: '/images/chicken/chicken.jpg' },
    { name: 'Desserts', image: '/images/desserts/brownie.jpg' },
    { name: 'Beverages', image: '/images/beverages/sprite.jpg' },
    { name: 'Sides', image: '/images/sides/fries.jpg' }
  ]

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
              <h1 className="hero-title">Hungry? Let's ForkHub!</h1>
              <p className="hero-subtitle">Your Flavor, Your Comfort, Your Choice</p>
              <p className="hero-description">
                Experience the finest selection of cuisines delivered fresh to your door. From sizzling pizzas to creamy pastas, crispy chicken to delightful desserts—ForkHub brings the best culinary experience right to you.
              </p>
              <button 
                className="btn-purple btn-hero-cta" 
                onClick={() => navigate('/menu')}
              >
                Explore Delicious Options
              </button>
            </div>
            <div className="hero-visual">
              <div className="food-plate-container">
                <div className="food-plate"></div>
                <div className="plate-shadow"></div>
                <img src="/images/pizza/CheeseMania.jpg" alt="Featured pizza" className="hero-food-img" />
              </div>
              <div className="floating-badge badge-1"><svg className="badge-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Fresh & Tasty</div>
              <div className="floating-badge badge-2"><svg className="badge-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M13 5v6h6V5h-6m0-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m-8 2h2v12H5V5m4 0h2v12H9V5m4 0h2v12h-2V5z"/></svg> 30min Delivery</div>
              <div className="floating-badge badge-3"><svg className="badge-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> Great Deals</div>
            </div>
          </div>
        </section>


        {/* Featured Categories Section - Food Style */}
        <section className="features-section featured-foods" style={{ marginBottom: 60 }}>
          <div className="features-background"></div>
          <h2>Discover Our Specialties</h2>
          <p className="section-subtitle">Handpicked flavors just for you</p>
          <div className="features-grid food-categories-grid">
            {foodCategories.map((category, index) => (
              <div 
                key={index}
                className="feature-card food-card" 
                style={{ cursor: 'pointer' }} 
                onClick={() => navigate('/menu')}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-8px) scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
              >
                <div className="food-card-image-wrapper">
                  <img src={category.image} alt={category.name} className="food-card-image" />
                  <div className="food-card-overlay"></div>
                </div>
                <div className="food-card-content">
                  <h3>{category.name}</h3>
                  <p>Explore {category.name}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section - Premium Order Section */}
        <section className="cta-section premium-order-section">
          <div className="cta-background"></div>
          <div className="cta-content">
            <div className="cta-text">
              <h2>How Do You Want Your Order?</h2>
              <p>Fresh, hot, and delivered exactly how you like it</p>
            </div>
            <div className="cta-buttons premium-buttons">
              <button 
                className="btn-large btn-delivery premium-btn" 
                onClick={() => startOrder('Delivery')}
              >
                <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M18 18.5a1.5 1.5 0 01-1.5-1.5 1.5 1.5 0 011.5-1.5 1.5 1.5 0 011.5 1.5 1.5 1.5 0 01-1.5 1.5m1.5-9l1.96 2.5H17V9.5m-11 9a1.5 1.5 0 01-1.5-1.5 1.5 1.5 0 011.5-1.5 1.5 1.5 0 011.5 1.5 1.5 1.5 0 01-1.5 1.5M5 9.5v3h5.5V9.5M1 6v9a3 3 0 003 3h2.28a3 3 0 002.64-1.56c.33-.56.77-1.04 1.32-1.44.55.4.99.88 1.32 1.44A3 3 0 0015.72 21H18a3 3 0 003-3V6H1m17 0V4h-5v2h5M3 4v2h5V4H3z"/></svg>
                <span className="btn-text-wrapper">
                  <span className="btn-label">Delivery</span>
                  <span className="btn-description">To Your Door</span>
                </span>
              </button>
              <button 
                className="btn-large btn-takeout premium-btn" 
                onClick={() => startOrder('Pick Up')}
              >
                <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 18a6 6 0 016-6 6 6 0 016 6v2H0v-2a6 6 0 016-6 6 6 0 016 6m8-9a3 3 0 110-6 3 3 0 010 6M3 5a3 3 0 110-6 3 3 0 010 6z"/></svg>
                <span className="btn-text-wrapper">
                  <span className="btn-label">Pick Up</span>
                  <span className="btn-description">At Our Store</span>
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Why Choose ForkHub Section */}
        <section className="features-section why-choose-section">
          <div className="features-background"></div>
          <h2>Why Foodies Choose ForkHub</h2>
          <div className="features-grid">
            <div className="feature-card benefit-card">
              <svg className="benefit-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2h-3V9c0-.55-.45-1-1-1h-4V5.5C13 4.12 12.88 3 12 3s-1 1.12-1 2.5V8H6c-.55 0-1 .45-1 1v5H2v2h3v5c0 .55.45 1 1 1h4v2.5c0 1.38.12 2.5 1 2.5s1-1.12 1-2.5V23h4c.55 0 1-.45 1-1v-5h3z"/></svg>
              <h3>Premium Variety</h3>
              <p>Explore 50+ cuisines and 500+ dishes from top-rated restaurants</p>
            </div>
            <div className="feature-card benefit-card">
              <svg className="benefit-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-8h-1v8H5V5h8V3zm4.12-1H16V0h-2v2h-3.12c.6.89.95 1.96.99 3.12H19c1.1 0 2 .9 2 2v11h2v-2h1v-2h-1V7c0-1.1-.9-2-2-2h-1.88C17.07 2.96 16.72 1.89 16.12 2z"/></svg>
              <h3>Lightning Fast</h3>
              <p>Average 30-minute delivery with hot, fresh meals guaranteed</p>
            </div>
            <div className="feature-card benefit-card">
              <svg className="benefit-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              <h3>Quality First</h3>
              <p>Handpicked restaurants with the best ingredients and recipes</p>
            </div>
            <div className="feature-card benefit-card">
              <svg className="benefit-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
              <h3>Live Tracking</h3>
              <p>Know exactly where your food is with real-time updates</p>
            </div>
          </div>
        </section>

        {/* About Section - Culinary Focus */}
        <section className="about-section culinary-about">
          <div className="about-background"></div>
          <div className="about-content">
            <h2>Welcome to ForkHub</h2>
            <p className="about-intro">
              Your gateway to culinary excellence. We bring the best flavors from around the world straight to your table.
            </p>
            <div className="about-highlights">
              <div className="highlight-item">
                <svg className="highlight-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12.75c1.63 0 2.97.98 2.97 2.25s-1.34 2.25-2.97 2.25c-1.63 0-2.97-.98-2.97-2.25s1.34-2.25 2.97-2.25M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11z"/></svg>
                <div className="highlight-text">
                  <h4>Expert Chefs</h4>
                  <p>Partner restaurants curated for quality and taste</p>
                </div>
              </div>
              <div className="highlight-item">
                <svg className="highlight-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M17.92 7.02C17.45 4.18 14.97 2 12 2c-2.97 0-5.45 2.18-5.92 5.02C5.97 7.53 4.25 9.5 4.25 11.8c0 3.35 2.57 6.2 6 6.2h7.5c3.43 0 6-2.85 6-6.2 0-2.3-1.72-4.27-4.08-4.78z"/></svg>
                <div className="highlight-text">
                  <h4>Fresh Ingredients</h4>
                  <p>Only the finest, freshest ingredients used daily</p>
                </div>
              </div>
              <div className="highlight-item">
                <svg className="highlight-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                <div className="highlight-text">
                  <h4>Guaranteed Satisfaction</h4>
                  <p>Your satisfaction is our ultimate goal</p>
                </div>
              </div>
            </div>
            <div className="about-stats">
              <div className="stat">
                <div className="stat-number">50+</div>
                <div className="stat-label">Cuisines</div>
              </div>
              <div className="stat">
                <div className="stat-number">500+</div>
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
        <section className="final-cta culinary-cta">
          <div className="final-cta-background"></div>
          <div className="cta-content-final">
            <div className="cta-text-final">
              <h2>Ready to Treat Your Taste Buds?</h2>
              <p>Browse our menu and discover your next favorite meal</p>
            </div>
            <button 
              className="btn-purple btn-cta btn-cta-large" 
              onClick={() => navigate('/menu')}
            >
              <svg className="btn-cta-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2h-3V9c0-.55-.45-1-1-1h-4V5.5C13 4.12 12.88 3 12 3s-1 1.12-1 2.5V8H6c-.55 0-1 .45-1 1v5H2v2h3v5c0 .55.45 1 1 1h4v2.5c0 1.38.12 2.5 1 2.5s1-1.12 1-2.5V23h4c.55 0 1-.45 1-1v-5h3z"/></svg> Start Your Culinary Journey
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}