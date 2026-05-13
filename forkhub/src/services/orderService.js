import { getCart, getCartTotal, clearCart } from './cartService'

const ORDER_KEY = 'fh_last_order'
const ALL_ORDERS_KEY = 'fh_orders'

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

export function getAllOrders() {
  try {
    return JSON.parse(localStorage.getItem(ALL_ORDERS_KEY)) || []
  } catch {
    return []
  }
}

export function saveOrder(order) {
  const preparedOrder = {
    id: createOrderNumber(),
    status: 'Pending',
    placedAt: new Date().toISOString(),
    items: getCart(),
    total: getCartTotal(),
    ...order,
  }
  // Save as last order (for tracking page)
  localStorage.setItem(ORDER_KEY, JSON.stringify(preparedOrder))
  // Save to all orders list (for admin)
  const allOrders = getAllOrders()
  allOrders.push(preparedOrder)
  localStorage.setItem(ALL_ORDERS_KEY, JSON.stringify(allOrders))
  clearCart()
  window.dispatchEvent(new Event('cart-updated'))
  return preparedOrder
}

export function deleteOrder(orderId) {
  const allOrders = getAllOrders()
  const filtered = allOrders.filter((o) => o.id !== orderId)
  localStorage.setItem(ALL_ORDERS_KEY, JSON.stringify(filtered))
  return filtered
}

const CANCELLABLE = ['Pending', 'Preparing', 'Out for delivery', 'Ready for pickup']

export function canCancel(status) {
  return CANCELLABLE.includes(status)
}

export function updateOrderStatus(orderId, newStatus, reason) {
  const allOrders = getAllOrders()
  const order = allOrders.find((o) => o.id === orderId)
  if (order) {
    order.status = newStatus
    if (newStatus === 'Cancelled') {
      order.cancelledAt = new Date().toISOString()
      order.cancelReason = reason || ''
    }
    localStorage.setItem(ALL_ORDERS_KEY, JSON.stringify(allOrders))
    // Also update last order if it matches
    const last = getSavedOrder()
    if (last && last.id === orderId) {
      last.status = newStatus
      if (newStatus === 'Cancelled') {
        last.cancelledAt = order.cancelledAt
        last.cancelReason = order.cancelReason
      }
      localStorage.setItem(ORDER_KEY, JSON.stringify(last))
    }
    window.dispatchEvent(new Event('cart-updated'))
  }
  return allOrders
}

export function findOrder(query) {
  const allOrders = getAllOrders()
  if (!allOrders.length) return null
  const normalized = String(query || '').trim().toLowerCase()
  if (!normalized) return null
  return allOrders.find((o) =>
    String(o.id).toLowerCase() === normalized ||
    String(o.phone || '').toLowerCase() === normalized
  ) || null
}
