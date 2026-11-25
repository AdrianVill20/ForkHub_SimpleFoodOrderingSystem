import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import TopNav from '../components/TopNav'
import { findOrder } from '../services/orderService'
import { SERVICE_TYPE } from '../constants'

export default function TrackingPage() {
  const navigate = useNavigate()
  // Track buttons open /tracking?q=<order number>; fill it in and search right away.
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [order, setOrder] = useState(null)
  const [message, setMessage] = useState('')

  const handleSearch = async (value = query) => {
    if (!value.trim()) return
    setOrder(null); setMessage('')
    try {
      const found = await findOrder(value)
      if (found) { setOrder(found); setMessage('Order found.') }
      else        { setMessage('No order found. Check your order number or phone.') }
    } catch { setMessage('No order found. Check your order number or phone.') }
  }

  useEffect(() => {
    if (initialQuery) handleSearch(initialQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery])

  return (
    <div className="page">
      <TopNav />
      <main className="content-wrap">
        <div className="tracking-layout">
          <section className="tracking-section">
            <div className="tracking-header">
              <h2 className="tracking-title">Track Your Order</h2>
              <div className="tracking-header-glow" />
            </div>
            <div className="tracking-body">
              <p className="tracking-description">Enter your order number or phone number to check the latest status.</p>

              <div className="tracking-search-row">
                <input
                  className="field tracking-field"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="FH-1234567-89 or 09171234567"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button className="tracking-search-btn" type="button" onClick={() => handleSearch()}>
                  Track
                </button>
                <button className="tracking-new-btn" type="button" onClick={() => navigate('/orders')}>
                  Place New Order
                </button>
              </div>

              {message && <p className={`tracking-message ${order ? 'found' : 'not-found'}`}>{message}</p>}

              {order && (
                <div className="tracking-result">
                  <div className="tracking-result-icon"><img src="/favicon.svg" alt="Order" className="tracking-favicon" /></div>
                  <h3 className="tracking-result-title">Order Details</h3>
                  <div className="tracking-result-grid">
                    <div className="tracking-result-row">
                      <span className="tracking-result-label">Order Number</span>
                      <span className="tracking-result-value">{order.id}</span>
                    </div>
                    <div className="tracking-result-row">
                      <span className="tracking-result-label">Status</span>
                      <span className="tracking-result-value">{order.status}</span>
                    </div>
                    <div className="tracking-result-row">
                      <span className="tracking-result-label">Service</span>
                      <span className="tracking-result-value">{order.serviceType}</span>
                    </div>
                    <div className="tracking-result-row">
                      <span className="tracking-result-label">Store</span>
                      <span className="tracking-result-value">{order.branch.name}</span>
                    </div>
                    {order.serviceType === SERVICE_TYPE.DELIVERY && (
                      <div className="tracking-result-row">
                        <span className="tracking-result-label">Delivery Address</span>
                        <span className="tracking-result-value">{order.address}</span>
                      </div>
                    )}
                    <div className="tracking-result-row">
                      <span className="tracking-result-label">Phone</span>
                      <span className="tracking-result-value">{order.phone}</span>
                    </div>
                    <div className="tracking-result-row">
                      <span className="tracking-result-label">Order Placed</span>
                      <span className="tracking-result-value">{new Date(order.placedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
