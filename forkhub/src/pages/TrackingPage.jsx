import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'
import { findOrder, getSavedOrder } from '../services/orderService'

export default function TrackingPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [order, setOrder] = useState(getSavedOrder())
  const [message, setMessage] = useState('')

  const handleSearch = () => {
    const found = findOrder(query)
    if (found) {
      setOrder(found)
      setMessage('Order found.')
    } else {
      setOrder(null)
      setMessage('No order found. Check your order number or phone.')
    }
  }

  return (
    <div className="page">
      <TopNav signedIn />
      <main className="content-wrap">
        <section className="form-panel" style={{ maxWidth: 920 }}>
          <h2 className="card-title">Track Your Order</h2>
          <div style={{ padding: 16 }}>
            <p className="muted">Enter your order number or phone number to check the latest status.</p>
            <label>Order # or Phone:</label>
            <input
              className="field"
              style={{ maxWidth: 500, marginBottom: 12 }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="FH-1234567-89 or 09171234567"
            />
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button className="btn-red" type="button" onClick={handleSearch}>
                Track Your Order
              </button>
              <button className="btn-purple" type="button" onClick={() => navigate('/orders')}>
                Place New Order
              </button>
            </div>

            {message && <p className="muted" style={{ marginBottom: 16 }}>{message}</p>}

            {order ? (
              <div style={{ background: '#f9f2ff', border: '1px solid #e2cee5', padding: 18, borderRadius: 8 }}>
                <p><strong>Order Number:</strong> {order.id}</p>
                <p><strong>Status:</strong> {order.status}</p>
                <p><strong>Service:</strong> {order.serviceType}</p>
                <p><strong>Store:</strong> {order.branch.name}</p>
                {order.serviceType === 'Delivery' && (
                  <p><strong>Delivery Address:</strong> {order.address}</p>
                )}
                <p><strong>Phone:</strong> {order.phone}</p>
                <p><strong>Order Placed:</strong> {new Date(order.placedAt).toLocaleString()}</p>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  )
}
