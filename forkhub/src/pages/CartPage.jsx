import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'
import { getCart, removeFromCart, updateCartQty, getCartTotal, clearCart } from '../services/cartService'

export default function CartPage() {
  const navigate = useNavigate()
  const [cart, setCart] = useState(getCart())
  const serviceType = localStorage.getItem('order_service_type') || 'Delivery'
  let userAddress = 'No saved address yet'
  try {
    const user = JSON.parse(localStorage.getItem('auth_user') || '{}')
    userAddress = user.address || userAddress
  } catch {
    userAddress = 'No saved address yet'
  }

  useEffect(() => {
    function onCartUpdate() { setCart(getCart()) }
    window.addEventListener('cart-updated', onCartUpdate)
    return () => window.removeEventListener('cart-updated', onCartUpdate)
  }, [])

  const total = getCartTotal()

  return (
    <div className="page">
      <TopNav />
      <main className="content-wrap">
        <div className="layout-2col cart-layout">
          <section className="cart-section">
            <div className="cart-header">
              <h2 className="cart-title">Cart</h2>
              <div className="cart-header-glow" />
            </div>
            <div className="cart-items-wrap">
              {cart.length === 0 ? (
                <div className="cart-empty">
                  <div className="cart-empty-icon"><img src="/favicon.svg" alt="ForkHub" className="cart-favicon" /></div>
                  <p className="cart-empty-text">Your cart is empty.</p>
                  <button className="btn-red cart-empty-btn" onClick={() => navigate('/menu')}>
                    BROWSE MENU
                  </button>
                </div>
              ) : (
                <>
                  <p className="cart-review-hint">Review and modify your items here.</p>
                  {cart.map((item) => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-img-wrap">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="cart-item-img"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      </div>
                      <div className="cart-item-info">
                        <p className="cart-item-name">{item.name}</p>
                        <p className="cart-item-price">₱{item.price}.00 each</p>
                        <div className="cart-qty-row">
                          <button className="cart-qty-btn" onClick={() => updateCartQty(item.id, (item.quantity || 1) - 1)}>−</button>
                          <span className="cart-qty-value">{item.quantity || 1}</span>
                          <button className="cart-qty-btn" onClick={() => updateCartQty(item.id, (item.quantity || 1) + 1)}>+</button>
                          <button className="cart-remove-btn" onClick={() => removeFromCart(item.id)}>REMOVE</button>
                        </div>
                      </div>
                      <div className="cart-item-subtotal">
                        ₱{(item.price * (item.quantity || 1)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                  <div className="cart-footer">
                    <button className="cart-clear-btn" onClick={clearCart}>CLEAR CART</button>
                    <p className="cart-total">Order Total: <span>₱{total.toFixed(2)}</span></p>
                  </div>
                </>
              )}
            </div>
          </section>
          <aside className="cart-aside">
            <div className="cart-sidebar-card">
              <h3 className="cart-sidebar-title">Review Order Settings</h3>
              <div className="cart-sidebar-body">
                <div className="cart-sidebar-row">
                  <span className="cart-sidebar-label">Location</span>
                  <span className="cart-sidebar-value">{userAddress}</span>
                </div>
                <div className="cart-sidebar-row">
                  <span className="cart-sidebar-label">Store</span>
                  <span className="cart-sidebar-value">Puso Village, Cebu City, PH</span>
                </div>
                <div className="cart-sidebar-row">
                  <span className="cart-sidebar-label">Service</span>
                  <span className="cart-sidebar-value">{serviceType}</span>
                </div>
                <div className="cart-sidebar-row">
                  <span className="cart-sidebar-label">Timing</span>
                  <span className="cart-sidebar-value">Now</span>
                </div>
              </div>
            </div>
            <button className="cart-checkout-btn" disabled={cart.length === 0} onClick={() => navigate('/orders')}>
              CONTINUE CHECKOUT
            </button>
            <button className="cart-back-btn" onClick={() => navigate('/menu')}>
              ← BACK TO MENU
            </button>
          </aside>
        </div>
      </main>
    </div>
  )
}
