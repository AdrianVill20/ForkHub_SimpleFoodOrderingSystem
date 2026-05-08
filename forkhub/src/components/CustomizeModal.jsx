import { useState } from 'react'
import { addToCart } from '../services/cartService'

/* Config per category — drives what the modal shows */
const CONFIG = {
  Pizzas: {
    sectionLabel: 'Choose Size',
    options: [
      { label: 'Personal', detail: '6" · 1–2 people',  modifier: 0   },
      { label: 'Regular',  detail: '10" · 2–3 people', modifier: 50  },
      { label: 'Family',   detail: '13" · 4–6 people', modifier: 100 },
    ],
    defaultOption: 'Regular',
    showNote: true,
    noteLabel: 'Special Instructions',
    notePlaceholder: 'e.g. Extra cheese, well done crust, no onions…',
  },
  Pasta: {
    sectionLabel: 'Choose Serving',
    options: [
      { label: 'Solo',    detail: '1 serving',     modifier: 0  },
      { label: 'For 2',   detail: '2 servings',    modifier: 40 },
      { label: 'Family',  detail: '3–4 servings',  modifier: 80 },
    ],
    defaultOption: 'Solo',
    showNote: true,
    noteLabel: 'Special Instructions',
    notePlaceholder: 'e.g. Al dente, extra sauce, less salt…',
  },
  Chicken: {
    sectionLabel: 'Choose Portion',
    options: [
      { label: '1 Piece',   detail: 'Single',      modifier: 0   },
      { label: '2 Pieces',  detail: 'Good for 2',  modifier: 80  },
      { label: '6 Pieces',  detail: 'Party pack',  modifier: 200 },
    ],
    defaultOption: '1 Piece',
    showNote: true,
    noteLabel: 'Special Instructions',
    notePlaceholder: 'e.g. Extra crispy, no skin…',
  },
  Sides: {
    sectionLabel: 'Choose Size',
    options: [
      { label: 'Regular', detail: 'Standard portion', modifier: 0  },
      { label: 'Large',   detail: 'Extra portion',    modifier: 30 },
    ],
    defaultOption: 'Regular',
    showNote: true,
    noteLabel: 'Special Instructions',
    notePlaceholder: 'e.g. Extra seasoning, sauce on the side…',
  },
  Desserts: {
    sectionLabel: 'Choose Portion',
    options: [
      { label: 'Single', detail: '1 serving',  modifier: 0  },
      { label: 'Double', detail: '2 servings', modifier: 40 },
    ],
    defaultOption: 'Single',
    showNote: true,
    noteLabel: 'Special Instructions',
    notePlaceholder: 'e.g. Warmed up, ice cream on the side…',
  },
  Beverages: {
    sectionLabel: 'Choose Size',
    options: [
      { label: 'Small',  detail: '12 oz', modifier: 0  },
      { label: 'Medium', detail: '16 oz', modifier: 15 },
      { label: 'Large',  detail: '22 oz', modifier: 25 },
    ],
    defaultOption: 'Medium',
    showNote: false,      
    showIce: true,        
  },
  Extras: {
    sectionLabel: null,   
    options: [],
    defaultOption: null,
    showNote: true,
    noteLabel: 'Any request?',
    notePlaceholder: 'e.g. Extra portion, on the side…',
    noteOnly: true,
  },
}

const ICE_OPTIONS = ['Extra Ice', 'Regular Ice', 'No Ice']

/* Component */
export default function CustomizeModal({ item, onClose, onAdded }) {
  const cfg = CONFIG[item.category] || CONFIG.Extras

  const [selectedOption, setSelectedOption] = useState(cfg.defaultOption)
  const [ice, setIce]                       = useState('Regular Ice')
  const [note, setNote]                     = useState('')
  const [added, setAdded]                   = useState(false)

  const chosen      = cfg.options.find((o) => o.label === selectedOption)
  const priceAdd    = chosen?.modifier ?? 0
  const finalPrice  = item.price + priceAdd

  function handleAdd() {
    const sizePart  = selectedOption ? `${selectedOption} ` : ''
    const icePart   = cfg.showIce    ? ` — ${ice}`          : ''
    const notePart  = note.trim()

    addToCart({
      ...item,
      id:    `${item.id}_${selectedOption || 'default'}`,
      name:  `${sizePart}${item.name}`,
      price: finalPrice,
      note:  [icePart ? ice : null, notePart || null].filter(Boolean).join(', ') || null,
    })
    setAdded(true)
    setTimeout(() => { onAdded?.(); onClose() }, 900)
  }

  return (
    <div className="cust-overlay" onClick={onClose}>
      <div className="cust-box" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="cust-header">
          <img
            src={item.image}
            alt={item.name}
            className="cust-img"
            onError={(e) => (e.target.style.display = 'none')}
          />
          <div className="cust-header-text">
            <p className="cust-item-label">CUSTOMIZE YOUR ORDER</p>
            <h3 className="cust-item-name">{item.name}</h3>
            <p className="cust-item-base muted">Base price: ₱{item.price}.00</p>
          </div>
          <button className="cat-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* ── Body ── */}
        <div className="cust-body">

          {/* Size / Serving / Portion picker */}
          {cfg.sectionLabel && cfg.options.length > 0 && (
            <>
              <p className="cust-section-label">{cfg.sectionLabel}</p>
              <div className={`cust-sizes cust-cols-${cfg.options.length}`}>
                {cfg.options.map((opt) => (
                  <button
                    key={opt.label}
                    className={`cust-size-card ${selectedOption === opt.label ? 'cust-size-active' : ''}`}
                    onClick={() => setSelectedOption(opt.label)}
                  >
                    <span className="cust-size-name">{opt.label}</span>
                    <span className="cust-size-desc">{opt.detail}</span>
                    <span className="cust-size-price">
                      ₱{item.price + opt.modifier}.00
                      {opt.modifier > 0 && (
                        <span className="cust-size-add"> (+{opt.modifier})</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Ice preference — Beverages only */}
          {cfg.showIce && (
            <div style={{ marginTop: 20 }}>
              <p className="cust-section-label">Ice Preference</p>
              <div className="cust-ice-row">
                {ICE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    className={`cust-ice-btn ${ice === opt ? 'cust-ice-active' : ''}`}
                    onClick={() => setIce(opt)}
                  >
                    {opt === 'Extra Ice' && '🧊 '}
                    {opt === 'Regular Ice' && '🥤 '}
                    {opt === 'No Ice' && '🚫 '}
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Special note */}
          {cfg.showNote && (
            <div style={{ marginTop: cfg.noteOnly ? 0 : 20 }}>
              <p className="cust-section-label">
                {cfg.noteLabel}
                <span className="muted" style={{ fontSize: 11, fontWeight: 400, marginLeft: 6 }}>
                  (optional)
                </span>
              </p>
              <textarea
                className="field"
                rows={3}
                placeholder={cfg.notePlaceholder}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ margin: 0, resize: 'vertical' }}
              />
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="cust-footer">
          <div className="cust-total">
            <span className="muted" style={{ fontSize: 13 }}>Total</span>
            <span className="cust-total-price">₱{finalPrice}.00</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="admin-nav-btn" onClick={onClose}>CANCEL</button>
            <button
              className={`btn-red cust-add-btn ${added ? 'cat-btn-added' : ''}`}
              onClick={handleAdd}
              disabled={added}
            >
              {added ? '✓ ADDED TO CART!' : 'ADD TO CART'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
