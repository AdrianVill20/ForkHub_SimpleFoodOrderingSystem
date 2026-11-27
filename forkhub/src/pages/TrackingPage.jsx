import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import TopNav from '../components/TopNav'
import OrderDetails from '../components/OrderDetails'
import { findOrder } from '../services/orderService'
import { isValidPhone, normalizePhone } from '../utils/phone'

export default function TrackingPage() {
  const navigate = useNavigate()
  const { orderId } = useParams()
  const [searchParams] = useSearchParams()
  const initialQuery = orderId || searchParams.get('q') || ''
  const isOrderDetailsRoute = Boolean(orderId)
  const [query, setQuery] = useState(initialQuery)
  const [order, setOrder] = useState(null)
  const [message, setMessage] = useState('')

  const handleSearch = async (value = query) => {
    if (!value.trim()) return
    const searchValue = isValidPhone(value) ? normalizePhone(value) : value.trim()
    setOrder(null); setMessage('')
    try {
      const found = await findOrder(searchValue)
      if (found) { setOrder(found); setMessage('Order found.') }
      else        { setMessage('No order found. Check your order number or phone.') }
    } catch { setMessage('No order found. Check your order number or phone.') }
  }

  useEffect(() => {
    setQuery(initialQuery)
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
              <h2 className="tracking-title">{isOrderDetailsRoute ? 'Order Details' : 'Track Your Order'}</h2>
              <div className="tracking-header-glow" />
            </div>
            <div className="tracking-body">
              {!isOrderDetailsRoute && (
                <>
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
                </>
              )}

              {message && <p className={`tracking-message ${order ? 'found' : 'not-found'}`}>{message}</p>}

              {order && <OrderDetails order={order} />}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
