import { useEffect, useState } from 'react'
import { getItemsByCategory } from '../services/menuService'
import CustomizeModal from './CustomizeModal'

export default function CategoryModal({ category, onClose }) {
  const [items, setItems]             = useState([])
  const [loading, setLoading]         = useState(true)
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
                      <div
                        key={item.id}
                        className="cat-item-card cat-item-card-clickable"
                        onClick={() => !item.unavailable && setCustomizeItem(item)}
                        style={{ 
                          cursor: item.unavailable ? 'not-allowed' : 'pointer',
                          opacity: item.unavailable ? 0.5 : 1,
                          position: 'relative'
                        }}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="cat-item-img"
                          style={{ filter: item.unavailable ? 'grayscale(100%)' : 'none' }}
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                        <div className="menu-thumb cat-item-fallback" style={{ display: 'none' }} />
                        {item.unavailable && (
                          <div style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: '#d32f2f',
                            color: '#fff',
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase'
                          }}>
                            Unavailable
                          </div>
                        )}
                        <p className="cat-item-name">{item.name.toUpperCase()}</p>
                        <p className="cat-item-desc muted">{item.description}</p>
                        <p className="cat-item-price muted">Starting @ ₱{item.price}.00</p>
                        {!item.unavailable ? (
                          <p className="cat-item-action" style={{ color: '#7c3aed', fontWeight: 600, marginTop: 8 }}>Click to customize →</p>
                        ) : (
                          <p className="cat-item-action" style={{ color: '#999', fontWeight: 600, marginTop: 8 }}>Out of Stock</p>
                        )}
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
