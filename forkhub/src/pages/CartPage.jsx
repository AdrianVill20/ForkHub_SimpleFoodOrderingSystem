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
      <TopNav signedIn />
      <main className="content-wrap">
        <div className="layout-2col">
          <section className="light-box" style={{ padding: 10 }}>
            <h2 style={{ margin: '0 0 10px', fontSize: 44 }}>Cart</h2>
            <div style={{ borderTop: '1px solid #ddd', paddingTop: 12 }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p style={{ fontSize: 18, color: '#999' }}>Your cart is empty.</p>
                  <button className="btn-red" style={{ marginTop: 16 }} onClick={() => navigate('/menu')}>
                    BROWSE MENU
                  </button>
                </div>
              ) : (
                <>
                  <p style={{ fontWeight: 700 }}>Review and modify your items here.</p>
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      style={{ marginTop: 10, border: '1px solid #ddd', padding: 12, display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: 12, alignItems: 'center' }}
                    >
                      {/* Thumbnail */}
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid #f4f4f4' }}
                        onError={(e) => { e.target.style.display = 'none' }}
                      />

                      {/* Info */}
                      <div>
                        <p style={{ color: '#98008f', fontWeight: 700, margin: '0 0 4px' }}>{item.name}</p>
                        <p className="muted" style={{ margin: '0 0 8px' }}>₱{item.price}.00 each</p>
                        {/* Qty controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            onClick={() => updateCartQty(item.id, (item.quantity || 1) - 1)}
                            style={{ width: 28, height: 28, border: '1px solid #ddd', background: '#f5f5f5', cursor: 'pointer', fontWeight: 700, fontSize: 16 }}
                          >−</button>
                          <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity || 1}</span>
                          <button
                            onClick={() => updateCartQty(item.id, (item.quantity || 1) + 1)}
                            style={{ width: 28, height: 28, border: '1px solid #ddd', background: '#f5f5f5', cursor: 'pointer', fontWeight: 700, fontSize: 16 }}
                          >+</button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            style={{ marginLeft: 8, background: 'none', border: 'none', color: '#f01527', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}
                          >REMOVE</button>
                        </div>
                      </div>

                      {/* Subtotal */}
                      <p style={{ textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        ₱{(item.price * (item.quantity || 1)).toFixed(2)}
                      </p>
                    </div>
                  ))}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
                    <button
                      onClick={clearCart}
                      style={{ background: 'none', border: '1px solid #ddd', padding: '8px 16px', cursor: 'pointer', color: '#666', fontWeight: 700, fontSize: 12 }}
                    >
                      CLEAR CART
                    </button>
                    <p style={{ fontSize: 22, fontWeight: 700 }}>Order Total: ₱{total.toFixed(2)}</p>
                  </div>
                </>
              )}
            </div>
          </section>

          <aside>
            <div className="light-box" style={{ marginBottom: 10 }}>
              <h3 className="card-title" style={{ fontSize: 18 }}>Review Order Settings</h3>
              <div style={{ padding: 12 }}>
                <p className="muted">Location: {userAddress}</p>
                <p className="muted">Store: Espana Boulevard, Sampaloc, PH</p>
                <p className="muted">Service: {serviceType}</p>
                <p className="muted">Timing: Now</p>
              </div>
            </div>
            <button
              className="btn-red"
              style={{ width: '100%' }}
              disabled={cart.length === 0}
              onClick={() => navigate('/orders')}
            >
              CONTINUE CHECKOUT
            </button>
            <button
              style={{ width: '100%', marginTop: 8, background: 'none', border: '1px solid #ddd', padding: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#98008f' }}
              onClick={() => navigate('/menu')}
            >
              ← BACK TO MENU
            </button>
          </aside>
        </div>
      </main>
    </div>
  )
}
