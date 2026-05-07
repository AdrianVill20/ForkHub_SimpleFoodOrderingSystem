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
      <TopNav signedIn />
      <main className="content-wrap">
        <div className="layout-2col">

          {/* ── Category grid ── */}
          <section className="light-box" style={{ padding: 10 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 44 }}>Menu</h2>

            {!ready ? (
              <p className="muted" style={{ padding: 24, textAlign: 'center' }}>Loading menu…</p>
            ) : (
              <div className="menu-grid">
                {CATEGORIES.map((cat) => (
                  <article
                    key={cat.title}
                    className="menu-item menu-item-clickable"
                    onClick={() => setSelectedCategory(cat.title)}
                  >
                    <img
                      src={cat.image}
                      alt={cat.title}
                      className="menu-thumb"
                      style={{ borderRadius: '50%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'block'
                      }}
                    />
                    <div className="menu-thumb" style={{ display: 'none' }} />
                    <h3>{cat.title}</h3>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* ── Sidebar ── */}
          <aside>
            <button
              className="btn-red"
              style={{ width: '100%', marginBottom: 10, position: 'relative' }}
              onClick={() => navigate('/cart')}
            >
              CHECKOUT
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
            <div className="light-box">
              <h3 className="card-title" style={{ fontSize: 18 }}>Order Settings</h3>
              <div style={{ padding: 12 }}>
                <p><strong>My Location</strong></p>
                <p className="muted">{userAddress}</p>
                <p style={{ marginTop: 10 }}><strong>Service</strong></p>
                <p className="muted">{serviceType}</p>
                <p style={{ marginTop: 10 }}><strong>My Store</strong></p>
                <p className="muted">Puso Village, Cebu City, PH</p>
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
