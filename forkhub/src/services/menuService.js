const BASE = '/api/menu'

async function request(path = '', options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Request failed: ${res.status}`)
  }
  return res.json()
}

/* ── Read ── */
export async function getMenuItems() {
  return request()
}

export async function getItemsByCategory(category) {
  return request(`?category=${encodeURIComponent(category)}`)
}

/* ── Admin CRUD ── */
export async function addMenuItem(item) {
  return request('', {
    method: 'POST',
    body: JSON.stringify(item),
  })
}

export async function updateMenuItem(id, updates) {
  return request(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

export async function deleteMenuItem(id) {
  return request(`/${id}`, { method: 'DELETE' })
}

/* ── Legacy no-ops kept so nothing breaks if still imported ── */
export function initMenu() { return Promise.resolve() }
export function resetMenu() { return Promise.resolve() }
