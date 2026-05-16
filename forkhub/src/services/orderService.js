import { getCart, getCartTotal, clearCart } from './cartService'

const BASE = '/api/orders'
const token = () => localStorage.getItem('auth_token') || ''

async function req(path = '', opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...opts.headers },
    ...opts,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Request failed: ${res.status}`)
  }
  return res.json()
}

export function getSavedOrder() {
  try {
    return JSON.parse(localStorage.getItem('fh_last_order')) || null
  } catch {
    return null
  }
}

export async function getAllOrders() {
  return req()
}

export async function findOrder(q) {
   return req(`/track?q=${encodeURIComponent(String(q || '').trim())}`)
}


export async function saveOrder(order) {
  const payload = { ...order, items: getCart(), total: getCartTotal() }
  const saved   = await req('', { method: 'POST', body: JSON.stringify(payload) })
  localStorage.setItem('fh_last_order', JSON.stringify(saved))
  clearCart()
  window.dispatchEvent(new Event('cart-updated'))
  return saved
}

export async function deleteOrder(orderId) {
  await req(`/${orderId}`, { method: 'DELETE' })
}


export async function updateOrderStatus(orderId, newStatus, reason) {
  return req(`/${orderId}/status`, { 
    method: 'PUT', 
    body: JSON.stringify({ status: newStatus, reason }) 
  })
}

const CANCELLABLE = ['Pending', 'Preparing', 'Out for delivery', 'Ready for pickup']

export function canCancel(status) {
  return CANCELLABLE.includes(status)
}