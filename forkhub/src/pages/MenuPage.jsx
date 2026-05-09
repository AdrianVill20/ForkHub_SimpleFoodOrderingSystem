import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'
import CategoryModal from '../components/CategoryModal'
import { initMenu } from '../services/menuService'
import { getCartCount } from '../services/cartService'

const CATEGORIES = [
  { title: 'Pizza',    image: '/images/categories/pizza.jpg'     },
  { title: 'Pasta',     image: '/images/categories/pasta.jpg'     },
  { title: 'Sides',     image: '/images/categories/sides.jpg'     },
  { title: 'Chicken',   image: '/images/categories/chicken.jpg'   },
  { title: 'Desserts',  image: '/images/categories/desserts.jpg'  },
  { title: 'Beverages', image: '/images/categories/beverages.jpg' },
  { title: 'Extras',    image: '/images/categories/extras.jpg'    },
]

export default function MenuPage() {
  const navigate = useNavigate()
  const [ready, setReady]                   = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [cartCount, setCartCount]           = useState(getCartCount())

  const serviceType = localStorage.getItem('order_service_type') || 'Delivery'
  let userAddress = 'No saved address yet'
  try {
    const user = JSON.parse(localStorage.getItem('auth_user') || '{}')
    userAddress = user.address || userAddress
  } catch { /* keep default */ }

  // Fetch menu.json on first load, then show the grid
  useEffect(() => {
    initMenu().then(() => setReady(true))
  }, [])

  // Keep cart badge in sync
  useEffect(() => {
    const onUpdate = () => setCartCount(getCartCount())
    window.addEventListener('cart-updated', onUpdate)
    return () => window.removeEventListener('cart-updated', onUpdate)
  }, [])

  return (
    <div className="page">
      <TopNav />
      <main className="content-wrap">
        <div className="layout-2col menu-layout">

          {/* ── Category grid ── */}
          <section className="menu-section">
            <div className="menu-section-header">
              <h2 className="menu-section-title">Menu</h2>
              <div className="menu-header-glow" />
            </div>
            <div className="menu-section-body">
              {!ready ? (
                <div className="menu-loading">
                  <div className="menu-loading-spinner" />
                  <p>Loading menu…</p>
                </div>
              ) : (
                <div className="menu-grid-new">
                  {CATEGORIES.map((cat, i) => (
                    <article
                      key={cat.title}
                      className="menu-card menu-card-clickable"
                      onClick={() => setSelectedCategory(cat.title)}
                      style={{ animationDelay: `${i * 0.06}s` }}
                    >
                      <div className="menu-card-img-wrap">
                        <img
                          src={cat.image}
                          alt={cat.title}
                          className="menu-card-img"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'block'
                          }}
                        />
                        <div className="menu-card-img-fallback" style={{ display: 'none' }} />
                      </div>
                      <h3 className="menu-card-title">{cat.title}</h3>
                      <div className="menu-card-shimmer" />
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ── Sidebar ── */}
          <aside className="menu-aside">
            <button
              className="menu-checkout-btn"
              onClick={() => navigate('/cart')}
            >
              CHECKOUT
              {cartCount > 0 && <span className="cart-badge menu-cart-badge">{cartCount}</span>}
            </button>
            <div className="menu-settings-card">
              <h3 className="menu-settings-title">Order Settings</h3>
              <div className="menu-settings-body">
                <div className="menu-settings-row">
                  <span className="menu-settings-label">My Location</span>
                  <span className="menu-settings-value">{userAddress}</span>
                </div>
                <div className="menu-settings-row">
                  <span className="menu-settings-label">Service</span>
                  <span className="menu-settings-value">{serviceType}</span>
                </div>
                <div className="menu-settings-row">
                  <span className="menu-settings-label">My Store</span>
                  <span className="menu-settings-value">Puso Village, Cebu City, PH</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {selectedCategory && (
        <CategoryModal
          category={selectedCategory}
          onClose={() => setSelectedCategory(null)}
        />
      )}
    </div>
  )
}
