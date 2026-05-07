const CART_KEY = 'fh_cart_items'

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || []
  } catch {
    return []
  }
}

export function addToCart(item) {
  const cart = getCart()
  const existing = cart.find((c) => c.id === item.id)
  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1
  } else {
    cart.push({ ...item, quantity: 1 })
  }
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  window.dispatchEvent(new Event('cart-updated'))
}

export function removeFromCart(id) {
  const cart = getCart().filter((c) => c.id !== id)
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  window.dispatchEvent(new Event('cart-updated'))
}

export function updateCartQty(id, qty) {
  const cart = getCart()
  const item = cart.find((c) => c.id === id)
  if (item) {
    if (qty <= 0) {
      return removeFromCart(id)
    }
    item.quantity = qty
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
    window.dispatchEvent(new Event('cart-updated'))
  }
}

export function clearCart() {
  localStorage.removeItem(CART_KEY)
  window.dispatchEvent(new Event('cart-updated'))
}

export function getCartCount() {
  return getCart().reduce((sum, item) => sum + (item.quantity || 1), 0)
}

export function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * (item.quantity || 1), 0)
}
