import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'
import DeliveryMap from '../components/DeliveryMap'
import { getCart, getCartTotal, clearCart } from '../services/cartService'
import { getSavedOrder, saveOrder } from '../services/orderService'

const BRANCHES = [
  { id: 'puso-village', name: 'Puso Village, Cebu City, PH', lat: 10.2913456, lng: 123.9016386 },
]

export default function OrderPage() {
  const navigate = useNavigate()
  const [serviceType, setServiceType] = useState(localStorage.getItem('order_service_type') || 'Delivery')
  const [branchId, setBranchId] = useState(BRANCHES[0].id)
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [destination, setDestination] = useState(null)
  const [savedOrder, setSavedOrder] = useState(null)
  const [placedOrder, setPlacedOrder] = useState(null)

  const [cart, setCart] = useState(getCart())
  const total = getCartTotal()
  const branch = BRANCHES.find((item) => item.id === branchId) || BRANCHES[0]
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const [searchMessage, setSearchMessage] = useState('')

  useEffect(() => {
    const latest = getSavedOrder()
    if (latest) {
      setSavedOrder(latest)
      setPlacedOrder(latest)
    }

    const handleCartUpdated = () => setCart(getCart())
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
    } catch (error) {
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

  const handlePlaceOrder = () => {
    if (!cart || cart.length === 0) return
    if (serviceType === 'Delivery' && !address && !destination) {
      alert('Please enter a delivery address or pin a delivery location on the map.')
      return
    }
    if (!phone.trim()) {
      alert('Please enter your phone number for tracking.')
      return
    }

    localStorage.setItem('order_service_type', serviceType)
    const order = saveOrder({
      serviceType,
      branch,
      address: address.trim() || 'Delivery location set on map',
      phone: phone.trim(),
      destination,
    })
    setPlacedOrder(order)
    setSavedOrder(order)
    clearCart()
  }

  const orderSummary = placedOrder || savedOrder

  return (
    <div className="page">
      <TopNav signedIn />
      <main className="content-wrap">
        <div className="layout-2col">
          <section className="light-box" style={{ padding: 16 }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 42 }}>Checkout</h2>

            {cart.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <p className="muted">Your cart is empty. Add some items first.</p>
                <button className="btn-red" onClick={() => navigate('/menu')} style={{ marginTop: 16 }}>
                  Go to Menu
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18 }}>
                  <div>
                    <h3 style={{ marginBottom: 10 }}>Select Service</h3>
                    <label className="field-label">
                      <input
                        type="radio"
                        name="service-type"
                        value="Delivery"
                        checked={serviceType === 'Delivery'}
                        onChange={() => {
                          setServiceType('Delivery')
                        }}
                      />
                      Delivery
                    </label>
                    <label className="field-label">
                      <input
                        type="radio"
                        name="service-type"
                        value="Pick Up"
                        checked={serviceType === 'Pick Up'}
                        onChange={() => {
                          setServiceType('Pick Up')
                          setAddress(branch.name)
                          setDestination({ lat: branch.lat, lng: branch.lng, name: branch.name })
                        }}
                      />
                      Pick Up
                    </label>
                  </div>

                  <div>
                    <h3 style={{ marginBottom: 10 }}>Branch</h3>
                    <p className="muted">{branch.name}</p>
                  </div>
                </div>

                {serviceType === 'Delivery' ? (
                  <div style={{ marginTop: 24 }}>
                    <h3 style={{ marginBottom: 12 }}>Delivery Address</h3>
                    <p className="muted" style={{ marginBottom: 8 }}>
                      Type your delivery address to locate it automatically, or click the map to pin your delivery location.
                    </p>
                    <textarea
                      className="field"
                      rows={3}
                      placeholder="Enter a complete delivery address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      style={{ width: '100%', marginBottom: 12 }}
                    />
                    <p className="muted" style={{ margin: '4px 0 12px' }}>
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
                  <div style={{ marginTop: 24 }}>
                    <h3 style={{ marginBottom: 12 }}>Branch Location</h3>
                    <p className="muted" style={{ marginBottom: 8 }}>
                      Pickup at {branch.name}. The branch location is shown in the sidebar.
                    </p>
                  </div>
                )}

                <div style={{ marginTop: 24 }}>
                  <h3 style={{ marginBottom: 12 }}>Phone for Tracking</h3>
                  <input
                    className="field"
                    type="text"
                    placeholder="09XXXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ width: '100%', maxWidth: 320 }}
                  />
                </div>

                <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                  <div>
                    <p className="muted" style={{ margin: 0 }}>Order total</p>
                    <p style={{ fontSize: 28, fontWeight: 700, margin: '6px 0 0' }}>₱{total.toFixed(2)}</p>
                  </div>
                  <button className="btn-red" type="button" onClick={handlePlaceOrder}>
                    Place Order
                  </button>
                </div>
              </>
            )}

            {orderSummary && (
              <div style={{ marginTop: 32, padding: 18, background: '#f9f2ff', border: '1px solid #e2cee5', borderRadius: 8 }}>
                <h3 style={{ marginTop: 0 }}>Order Confirmation</h3>
                <p style={{ margin: '8px 0' }}><strong>Order Number:</strong> {orderSummary.id}</p>
                <p style={{ margin: '8px 0' }}><strong>Status:</strong> {orderSummary.status}</p>
                <p style={{ margin: '8px 0' }}><strong>Service:</strong> {orderSummary.serviceType}</p>
                <p style={{ margin: '8px 0' }}><strong>Store:</strong> {orderSummary.branch.name}</p>
                {orderSummary.serviceType === 'Delivery' && (
                  <p style={{ margin: '8px 0' }}><strong>Delivery Address:</strong> {orderSummary.address}</p>
                )}
                <p style={{ margin: '8px 0' }}><strong>Phone:</strong> {orderSummary.phone}</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
                  <button className="btn-purple" type="button" onClick={() => navigate('/tracking')}>
                    Track Order
                  </button>
                  <button type="button" className="btn-red" onClick={() => navigate('/menu')}>
                    Back to Menu
                  </button>
                </div>
              </div>
            )}
          </section>

          <aside>
            <div className="light-box" style={{ padding: 16, marginBottom: 16 }}>
              <h3 className="card-title">Order Summary</h3>
              <div style={{ marginTop: 12 }}>
                {cart.length === 0 ? (
                  <p className="muted">No items in cart.</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span>{item.name} × {item.quantity || 1}</span>
                      <strong>₱{(item.price * (item.quantity || 1)).toFixed(2)}</strong>
                    </div>
                  ))
                )}
              </div>
              <div style={{ borderTop: '1px solid #ddd', paddingTop: 12, marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span>Total</span>
                <strong>₱{total.toFixed(2)}</strong>
              </div>
            </div>

          </aside>
        </div>
      </main>

    </div>
  )
}
