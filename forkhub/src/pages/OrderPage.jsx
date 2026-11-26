import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'
import DeliveryMap from '../components/DeliveryMap'
import OrderDetails from '../components/OrderDetails'
import Pagination from '../components/Pagination'
import { paginate } from '../utils/pagination'
import { getCart, getCartTotal, clearCart } from '../services/cartService'
import { saveOrder, getAllOrders, canCancel, updateOrderStatus } from '../services/orderService'
import { DELIVERY_BRANCH, ORDER_STATUS, SERVICE_TYPE } from '../constants'

export default function OrderPage() {
  const navigate = useNavigate()
  const [serviceType, setServiceType] = useState(localStorage.getItem('order_service_type') || SERVICE_TYPE.DELIVERY)
  const [address, setAddress] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || '{}').address || ''
    } catch {
      return ''
    }
  })
  const [phone, setPhone] = useState('')
  const [destination, setDestination] = useState(null)
  const [placedOrder, setPlacedOrder] = useState(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [phoneEditable, setPhoneEditable] = useState(false)

  const [cart, setCart] = useState(getCart())
  const total = getCartTotal()
  const branch = DELIVERY_BRANCH
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const [searchMessage, setSearchMessage] = useState('')
  const [orderHistory, setOrderHistory] = useState([])
  const [cancellingId, setCancellingId] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [historyPage, setHistoryPage] = useState(1)
  const [expandedOrderId, setExpandedOrderId] = useState(null)
  const historyPaging = paginate([...orderHistory].reverse(), historyPage)

  // Auto-fill phone from user data on mount
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('auth_user') || '{}')
      if (user.phone) {
        setPhone(user.phone)
      }
    } catch {
      // keep empty
    }
  }, [])

  useEffect(() => {
    getAllOrders().then(setOrderHistory).catch(() => {})
  }, [])

  useEffect(() => {
    const handleCartUpdated = () => { setCart(getCart()); getAllOrders().then(setOrderHistory).catch(() => {}) }
    window.addEventListener('cart-updated', handleCartUpdated)
    return () => window.removeEventListener('cart-updated', handleCartUpdated)
  }, [])

  const geocodeAddress = useCallback(async (query) => {
    const trimmed = String(query || '').trim()
    if (!trimmed) {
      setSearchMessage('')
      return
    }

    setIsSearchingAddress(true)
    setSearchMessage('Searching address…')

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(trimmed)}`,
      )
      if (!response.ok) {
        throw new Error('Search failed')
      }

      const results = await response.json()
      if (!Array.isArray(results) || results.length === 0) {
        setSearchMessage('Address not found.')
        return
      }

      const result = results[0]
      const nextDestination = {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        name: result.display_name,
      }
      setDestination(nextDestination)
      setSearchMessage('Location found and shown on the map.')
      setAddress(result.display_name)
    } catch {
      setSearchMessage('Unable to locate address. Please try a different query.')
    } finally {
      setIsSearchingAddress(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (address.trim()) {
        geocodeAddress(address)
      }
    }, 700)

    return () => clearTimeout(timer)
  }, [address, geocodeAddress])

  const handlePlaceOrder = async () => {
    if (!cart || cart.length === 0) return
    if (serviceType === SERVICE_TYPE.DELIVERY && !address && !destination) {
      alert('Please enter a delivery address or pin a delivery location on the map.')
      return
    }
    if (!phone.trim()) {
      alert('Please enter your phone number for tracking.')
      return
    }

    localStorage.setItem('order_service_type', serviceType)
    const isPickup = serviceType === SERVICE_TYPE.PICK_UP
    const order = await saveOrder({
      serviceType,
      branch,
      address: isPickup ? branch.name : address.trim() || 'Delivery location set on map',
      phone: phone.trim(),
      destination: isPickup ? { lat: branch.lat, lng: branch.lng, name: branch.name } : destination,
    })
    setPlacedOrder(order)
    setShowConfirmation(true)
    clearCart()
  }

  const orderSummary = placedOrder

  return (
    <div className="page">
      <TopNav />
      <main className="content-wrap">
        <div className="layout-2col order-layout">
          <section className="order-section">
            <div className="order-section-header">
              <h2 className="order-section-title">Checkout</h2>
              <div className="order-header-glow" />
            </div>

            <div className="order-section-body">
              {cart.length === 0 && !orderSummary ? (
                <div>
                  <div className="order-empty">
                    <div className="order-empty-icon"><span className="order-empty-food-icon" role="img" aria-label="Meal">🍽️</span></div>
                    <p className="order-empty-text">Your cart is empty.</p>
                    <button className="btn-red order-empty-btn" onClick={() => navigate('/menu')}>
                      Browse Menu
                    </button>
                  </div>

                  {orderHistory.length > 0 && (
                    <div className="order-history">
                      <h3 className="order-history-title">Order History</h3>
                      <div className="order-history-list">
                        {historyPaging.rows.map((o) => (
                          <div key={o.id} className="order-history-card">
                            <div className="order-history-top">
                              <div>
                                <span className="order-history-id">{o.id}</span>
                                <span className={`order-history-status ${o.status === ORDER_STATUS.CANCELLED ? 'cancelled' : ''}`}>{o.status}</span>
                              </div>
                              <span className="order-history-date">{new Date(o.placedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="order-history-items">
                              {o.items?.slice(0, 3).map((i) => (
                                <span key={i.id} className="order-history-item">{i.name} ×{i.quantity || 1}</span>
                              ))}
                              {o.items?.length > 3 && <span className="order-history-more">+{o.items.length - 3} more</span>}
                            </div>
                            <div className="order-history-bottom">
                              <span className="order-history-total">₱{(o.total || 0).toFixed(2)}</span>
                              <div className="order-history-actions">
                                {canCancel(o.status) && cancellingId !== o.id && (
                                  <button className="order-cancel-btn" onClick={() => { setCancellingId(o.id); setCancelReason('') }}>
                                    Cancel
                                  </button>
                                )}
                                {canCancel(o.status) && cancellingId === o.id && (
                                  <div className="order-cancel-reason-box">
                                    <input
                                      className="order-cancel-reason-input"
                                      placeholder="Reason for cancellation..."
                                      value={cancelReason}
                                      onChange={(e) => setCancelReason(e.target.value)}
                                      autoFocus
                                    />
                                    <button
                                      className="order-cancel-confirm-btn"
                                      onClick={async () => {
                                        try {
                                          await updateOrderStatus(o.id, ORDER_STATUS.CANCELLED, cancelReason)
                                          setOrderHistory(await getAllOrders())
                                        } catch (err) {
                                          alert(`Could not cancel: ${err.message}`)
                                        }
                                        setCancellingId(null)
                                        setCancelReason('')
                                      }}
                                    >
                                      Confirm
                                    </button>
                                    <button className="order-cancel-back-btn" onClick={() => setCancellingId(null)}>Back</button>
                                  </div>
                                )}
                                <button
                                  className="order-details-toggle"
                                  type="button"
                                  aria-expanded={expandedOrderId === o.id}
                                  onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}
                                >
                                  {expandedOrderId === o.id ? 'Hide Details' : 'Order Details'}
                                </button>
                                <button className="order-track-btn" onClick={() => navigate(`/orders/${encodeURIComponent(o.id)}`)}>Track</button>
                              </div>
                              {o.status === ORDER_STATUS.CANCELLED && o.cancelReason && (
                                <p className="order-cancel-reason-display">Reason: {o.cancelReason}</p>
                              )}
                            </div>
                            {expandedOrderId === o.id && <OrderDetails order={o} compact />}
                          </div>
                        ))}
                      </div>
                      <Pagination page={historyPaging.current} totalPages={historyPaging.totalPages} onChange={setHistoryPage} />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="order-form-grid">
                    <div className="order-form-group">
                      <h3 className="order-label">Select Service</h3>
                      <div className="order-radio-row">
                        <label className={`order-radio ${serviceType === SERVICE_TYPE.DELIVERY ? 'active' : ''}`}>
                          <input
                            type="radio"
                            name="service-type"
                            value="Delivery"
                            checked={serviceType === SERVICE_TYPE.DELIVERY}
                            onChange={() => setServiceType(SERVICE_TYPE.DELIVERY)}
                          />
                          <span className="order-radio-indicator" />
                          <span className="order-radio-text">Delivery</span>
                        </label>
                        <label className={`order-radio ${serviceType === SERVICE_TYPE.PICK_UP ? 'active' : ''}`}>
                          <input
                            type="radio"
                            name="service-type"
                            value="Pick Up"
                            checked={serviceType === SERVICE_TYPE.PICK_UP}
                            onChange={() => setServiceType(SERVICE_TYPE.PICK_UP)}
                          />
                          <span className="order-radio-indicator" />
                          <span className="order-radio-text">Pick Up</span>
                        </label>
                      </div>
                    </div>

                    <div className="order-form-group">
                      <h3 className="order-label">Branch</h3>
                      <p className="order-value">{branch.name}</p>
                    </div>
                  </div>

                  {serviceType === SERVICE_TYPE.DELIVERY ? (
                    <div className="order-delivery-section">
                      <h3 className="order-label">Delivery Address</h3>
                      <p className="order-hint">
                        Type your delivery address to locate it automatically, or click the map to pin your delivery location.
                      </p>
                      <textarea
                        className="field order-field"
                        rows={3}
                        placeholder="Enter a complete delivery address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                      <p className="order-status-text">
                        {isSearchingAddress ? 'Searching address…' : searchMessage || 'Address results and pinned location appear on the map below.'}
                      </p>
                      <DeliveryMap
                        branch={branch}
                        address={address}
                        destination={destination}
                        onDestinationChange={setDestination}
                        onAddressChange={setAddress}
                        onStatusChange={setSearchMessage}
                      />
                    </div>
                  ) : (
                    <div className="order-delivery-section">
                      <h3 className="order-label">Branch Location</h3>
                      <p className="order-hint">
                        Pickup at {branch.name}. The branch location is shown in the sidebar.
                      </p>
                    </div>
                  )}

                  <div className="order-form-group">
                    <h3 className="order-label">
                      Phone for Tracking
                      {!phoneEditable && (
                        <button
                          className="order-edit-phone-btn"
                          onClick={() => setPhoneEditable(true)}
                          style={{
                            marginLeft: 10,
                            padding: '4px 8px',
                            fontSize: 12,
                            cursor: 'pointer',
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-primary)',
                            textDecoration: 'underline',
                          }}
                        >
                          Edit
                        </button>
                      )}
                    </h3>
                    {phoneEditable ? (
                      <input
                        className="field order-field"
                        type="text"
                        placeholder="09XXXXXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <p className="order-value">{phone || 'No phone number saved'}</p>
                    )}
                  </div>

                  <div className="order-total-row">
                    <div>
                      <p className="order-total-label">Order total</p>
                      <p className="order-total-price">₱{total.toFixed(2)}</p>
                    </div>
                    <button className="order-place-btn" type="button" onClick={handlePlaceOrder}>
                      Place Order
                    </button>
                  </div>
                </>
              )}

              {orderSummary && !showConfirmation && (
                <div className="order-confirmation">
                  <div className="order-confirm-icon"><img src="/favicon.svg" alt="Confirmed" className="order-confirm-favicon" /></div>
                  <h3 className="order-confirm-title">Order Confirmation</h3>
                  <div className="order-confirm-grid">
                    <div className="order-confirm-row">
                      <span className="order-confirm-label">Order Number</span>
                      <span className="order-confirm-value">{orderSummary.id}</span>
                    </div>
                    <div className="order-confirm-row">
                      <span className="order-confirm-label">Status</span>
                      <span className="order-confirm-value">{orderSummary.status}</span>
                    </div>
                    <div className="order-confirm-row">
                      <span className="order-confirm-label">Service</span>
                      <span className="order-confirm-value">{orderSummary.serviceType}</span>
                    </div>
                    <div className="order-confirm-row">
                      <span className="order-confirm-label">Store</span>
                      <span className="order-confirm-value">{orderSummary.branch.name}</span>
                    </div>
                    {orderSummary.serviceType === SERVICE_TYPE.DELIVERY && (
                      <div className="order-confirm-row">
                        <span className="order-confirm-label">Delivery Address</span>
                        <span className="order-confirm-value">{orderSummary.address}</span>
                      </div>
                    )}
                    <div className="order-confirm-row">
                      <span className="order-confirm-label">Phone</span>
                      <span className="order-confirm-value">{orderSummary.phone}</span>
                    </div>
                  </div>
                  <div className="order-confirm-actions">
                    <button className="order-confirm-track-btn" type="button" onClick={() => navigate(`/orders/${encodeURIComponent(orderSummary.id)}`)}>
                      Track Order
                    </button>
                    <button type="button" className="order-confirm-menu-btn" onClick={() => navigate('/menu')}>
                      Back to Menu
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="order-aside">
            <div className="order-summary-card">
              <h3 className="order-summary-title">Order Summary</h3>
              <div className="order-summary-body">
                {cart.length === 0 ? (
                  <p className="order-summary-empty">No items in cart.</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="order-summary-item">
                      <span className="order-summary-item-name">{item.name} <span className="order-summary-item-qty">×{item.quantity || 1}</span></span>
                      <strong className="order-summary-item-price">₱{(item.price * (item.quantity || 1)).toFixed(2)}</strong>
                    </div>
                  ))
                )}
              </div>
              <div className="order-summary-total">
                <span>Total</span>
                <strong>₱{total.toFixed(2)}</strong>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Order Confirmation Modal */}
      {showConfirmation && orderSummary && (
        <div
          className="cat-modal-overlay"
          style={{ zIndex: 1000 }}
          onClick={() => setShowConfirmation(false)}
        >
          <div className="order-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="order-confirm-modal-icon">
              <img src="/favicon.svg" alt="Confirmed" />
            </div>
            <h3 className="order-confirm-modal-title">Order Confirmed!</h3>
            <p className="order-confirm-modal-subtitle">Your order has been successfully placed</p>
            
            <div className="order-confirm-modal-grid">
              <div className="order-confirm-modal-row">
                <span className="order-confirm-modal-label">Order Number</span>
                <span className="order-confirm-modal-value">{orderSummary.id}</span>
              </div>
              <div className="order-confirm-modal-row">
                <span className="order-confirm-modal-label">Status</span>
                <span className="order-confirm-modal-value">{orderSummary.status}</span>
              </div>
              <div className="order-confirm-modal-row">
                <span className="order-confirm-modal-label">Service</span>
                <span className="order-confirm-modal-value">{orderSummary.serviceType}</span>
              </div>
              <div className="order-confirm-modal-row">
                <span className="order-confirm-modal-label">Branch</span>
                <span className="order-confirm-modal-value">{orderSummary.branch.name}</span>
              </div>
              {orderSummary.serviceType === SERVICE_TYPE.DELIVERY && (
                <div className="order-confirm-modal-row">
                  <span className="order-confirm-modal-label">Address</span>
                  <span className="order-confirm-modal-value">{orderSummary.address}</span>
                </div>
              )}
              <div className="order-confirm-modal-row">
                <span className="order-confirm-modal-label">Phone</span>
                <span className="order-confirm-modal-value">{orderSummary.phone}</span>
              </div>
              <div className="order-confirm-modal-row">
                <span className="order-confirm-modal-label">Total</span>
                <span className="order-confirm-modal-value highlight">₱{(orderSummary.total || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="order-confirm-modal-buttons">
              <button
                className="order-confirm-modal-btn order-confirm-modal-btn-secondary"
                onClick={() => {
                  setShowConfirmation(false)
                  navigate('/menu')
                }}
              >
                Back to Menu
              </button>
              <button
                className="order-confirm-modal-btn order-confirm-modal-btn-primary"
                onClick={() => {
                  setShowConfirmation(false)
                  navigate(`/orders/${encodeURIComponent(orderSummary?.id || '')}`)
                }}
              >
                Track Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
