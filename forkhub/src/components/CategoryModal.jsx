import { useEffect, useState } from 'react'
import { getItemsByCategory } from '../services/menuService'
import { addToCart } from '../services/cartService'
import CustomizeModal from './CustomizeModal'

export default function CategoryModal({ category, onClose }) {
  const [items, setItems]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [addedIds, setAddedIds]       = useState({})
  const [quantities, setQuantities]   = useState({})
  const [customizeItem, setCustomizeItem] = useState(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    setLoading(true)
    getItemsByCategory(category)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
    return () => { document.body.style.overflow = '' }
  }, [category])

  function handleQty(itemId, delta) {
    setQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(1, (prev[itemId] || 1) + delta),
    }))
  }

  function handleAddToOrder(item) {
    const qty = quantities[item.id] || 1
    addToCart(item, qty)
    setAddedIds((prev) => ({ ...prev, [item.id]: true }))
    setQuantities((prev) => ({ ...prev, [item.id]: 1 }))
    setTimeout(() => setAddedIds((prev) => ({ ...prev, [item.id]: false })), 1500)
  }

  const grouped = items.reduce((acc, item) => {
    const sub = item.subcategory || 'Classic'
    if (!acc[sub]) acc[sub] = []
    acc[sub].push(item)
    return acc
  }, {})

  return (
    <>
      <div className="cat-modal-overlay" onClick={onClose}>
        <div className="cat-modal-box" onClick={(e) => e.stopPropagation()}>

          <div className="cat-modal-header">
            <h2 className="cat-modal-title">{category.toUpperCase()}</h2>
            <button className="cat-modal-close" onClick={onClose}>✕</button>
          </div>

          <div className="cat-modal-body">
            {loading ? (
              <p style={{ textAlign: 'center', padding: 32, color: '#999' }}>Loading…</p>
            ) : items.length === 0 ? (
              <p style={{ textAlign: 'center', padding: 32, color: '#666' }}>
                No items available in this category yet.
              </p>
            ) : (
              Object.entries(grouped).map(([sub, subItems]) => (
                <div key={sub}>
                  <div className="cat-subcategory-bar">{sub.toUpperCase()}</div>
                  <div className="cat-items-grid">
                    {subItems.map((item) => (
                      <div key={item.id} className="cat-item-card">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="cat-item-img"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                        <div className="menu-thumb cat-item-fallback" style={{ display: 'none' }} />
                        <p className="cat-item-name">{item.name.toUpperCase()}</p>
                        <div className="cat-qty-row">
                          <button className="cat-qty-btn" onClick={() => handleQty(item.id, -1)}>−</button>
                          <span className="cat-qty-value">{quantities[item.id] || 1}</span>
                          <button className="cat-qty-btn" onClick={() => handleQty(item.id, 1)}>+</button>
                        </div>
                        <button
                          className={`btn-red cat-btn-add ${addedIds[item.id] ? 'cat-btn-added' : ''}`}
                          onClick={() => handleAddToOrder(item)}
                        >
                          {addedIds[item.id] ? '✓ ADDED!' : 'ADD TO ORDER'}
                        </button>
                        <button
                          className="cat-btn-customize btn-purple"
                          onClick={() => setCustomizeItem(item)}
                        >
                          CUSTOMIZE
                        </button>
                        <p className="cat-item-desc muted">{item.description}</p>
                        <p className="cat-item-price muted">Starting @ ₱{item.price}.00</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>

      {customizeItem && (
        <CustomizeModal
          item={customizeItem}
          onClose={() => setCustomizeItem(null)}
          onAdded={() => setCustomizeItem(null)}
        />
      )}
    </>
  )
}
