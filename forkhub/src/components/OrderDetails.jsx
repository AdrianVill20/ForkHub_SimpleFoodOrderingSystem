import { ORDER_STATUS } from '../constants'

function money(value) {
  return `₱${Number(value || 0).toFixed(2)}`
}

export default function OrderDetails({ order, compact = false }) {
  const items = Array.isArray(order.items) ? order.items : []
  const statusClass = order.status === ORDER_STATUS.CANCELLED ? ' order-details-status--cancelled' : ''

  return (
    <section className={`order-details${compact ? ' order-details--compact' : ''}`} aria-label={`Details for order ${order.id}`}>
      <header className="order-details-header">
        <strong className="order-details-id">{order.id}</strong>
        <time dateTime={order.placedAt || undefined}>
          {order.placedAt ? new Date(order.placedAt).toLocaleString() : '—'}
        </time>
      </header>

      <div className="order-details-grid">
        <section className="order-details-items-section" aria-label="Order items">
          <h3 className="order-details-section-title">Items ({items.length})</h3>
          <div className={`order-details-item-list${items.length > 5 ? ' order-details-item-list--scrollable' : ''}`}>
            {items.length === 0 ? (
              <p className="order-details-empty">No item details available.</p>
            ) : items.map((item, index) => {
              const quantity = Number(item.quantity) || 1
              return (
                <div className="order-details-item" key={item.id || `${order.id}-${index}`}>
                  <div className="order-details-item-info">
                    <strong>{item.name}</strong>
                    {item.note && <span>{item.note}</span>}
                  </div>
                  <span className="order-details-item-quantity">×{quantity}</span>
                  <span className="order-details-item-price">{money(Number(item.price || 0) * quantity)}</span>
                </div>
              )
            })}
          </div>
        </section>

        <aside className="order-details-summary">
          <div className="order-details-status-row">
            <span>Status</span>
            <strong className={`order-details-status${statusClass}`}>{order.status || '—'}</strong>
          </div>
          <dl className="order-details-meta">
            <div>
              <dt>Service</dt>
              <dd>{order.serviceType || '—'}</dd>
            </div>
            <div>
              <dt>Store</dt>
              <dd>{order.branch?.name || order.branchName || '—'}</dd>
            </div>
            {order.address && (
              <div>
                <dt>Address</dt>
                <dd>{order.address}</dd>
              </div>
            )}
            {order.phone && (
              <div>
                <dt>Phone</dt>
                <dd>{order.phone}</dd>
              </div>
            )}
          </dl>
          <div className="order-details-total">
            <span>Total</span>
            <strong>{money(order.total)}</strong>
          </div>
        </aside>
      </div>
    </section>
  )
}
