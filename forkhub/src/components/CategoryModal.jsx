import { useEffect, useState } from 'react'
import { getItemsByCategory } from '../services/menuService'
import { addToCart } from '../services/cartService'

export default function CategoryModal({ category, onClose }) {
  const [items, setItems] = useState([])
  const [addedIds, setAddedIds] = useState({})

  useEffect(() => {
    setItems(getItemsByCategory(category))
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [category])

  function handleAddToOrder(item) {
    addToCart(item)
    setAddedIds((prev) => ({ ...prev, [item.id]: true }))
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [item.id]: false }))
    }, 1500)
  }

  // Group items by subcategory
  const grouped = items.reduce((acc, item) => {
    const sub = item.subcategory || 'Classic'
    if (!acc[sub]) acc[sub] = []
    acc[sub].push(item)
    return acc
  }, {})

  return (
    <div className="cat-modal-overlay" onClick={onClose}>
      <div
        className="cat-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="cat-modal-header">
          <h2 className="cat-modal-title">{category.toUpperCase()}</h2>
          <button className="cat-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="cat-modal-body">
          {items.length === 0 ? (
            <p style={{ color: '#666', padding: '24px', textAlign: 'center' }}>
              No items available in this category yet.
            </p>
          ) : (
            Object.entries(grouped).map(([sub, subItems]) => (
              <div key={sub}>
                {/* Subcategory label */}
                <div className="cat-subcategory-bar">{sub.toUpperCase()}</div>

                {/* Items grid */}
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
                      {/* Fallback circle if image fails */}
                      <div className="menu-thumb cat-item-fallback" style={{ display: 'none' }} />

                      <p className="cat-item-name">{item.name.toUpperCase()}</p>

                      <button
                        className={`btn-red cat-btn-add ${addedIds[item.id] ? 'cat-btn-added' : ''}`}
                        onClick={() => handleAddToOrder(item)}
                      >
                        {addedIds[item.id] ? '✓ ADDED!' : 'ADD TO ORDER'}
                      </button>

                      <button className="cat-btn-customize btn-purple">
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

        {/* Footer */}
        <div className="cat-modal-footer">
          <button className="btn-red" style={{ minWidth: 140 }} onClick={onClose}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  )
}
