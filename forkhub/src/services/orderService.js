import { getCart, getCartTotal, clearCart } from './cartService'

const ORDER_KEY = 'fh_last_order'

function createOrderNumber() {
  const time = Date.now().toString().slice(-7)
  const random = Math.floor(Math.random() * 90 + 10)
  return `FH-${time}-${random}`
}

export function getSavedOrder() {
  try {
    return JSON.parse(localStorage.getItem(ORDER_KEY)) || null
  } catch {
    return null
  }
}

export function saveOrder(order) {
  const preparedOrder = {
    id: createOrderNumber(),
    status: order.serviceType === 'Delivery' ? 'Out for delivery' : 'Ready for pickup',
    placedAt: new Date().toISOString(),
    items: getCart(),
    total: getCartTotal(),
    ...order,
  }
  localStorage.setItem(ORDER_KEY, JSON.stringify(preparedOrder))
  clearCart()
  window.dispatchEvent(new Event('cart-updated'))
  return preparedOrder
}

export function findOrder(query) {
  const order = getSavedOrder()
  if (!order) return null
  const normalized = String(query || '').trim().toLowerCase()
  if (!normalized) return null
  if (String(order.id).toLowerCase() === normalized) return order
  if (String(order.phone || '').toLowerCase() === normalized) return order
  return null
}
