import fs   from 'node:fs/promises'
import path from 'node:path'
import { rootDir } from '../config.js'

const FILE = path.join(rootDir, 'data', 'orders.json')

async function read() {
  try {
    await fs.mkdir(path.dirname(FILE), { recursive: true })
    return JSON.parse(await fs.readFile(FILE, 'utf8'))
  } catch { return [] }
}
async function write(data) {
  const tmp = `${FILE}.tmp`
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8')
  await fs.rename(tmp, FILE)
}

// PostgreSQL support — enabled automatically when DATABASE_URL is set in .env
let pool = null, useDB = false
async function db() {
  if (pool !== null) return pool
  const url = process.env.DATABASE_URL
  if (!url) { pool = false; return null }
  try {
    const { default: pg } = await import('pg')
    const p = new pg.Pool({ connectionString: url, ssl: url.includes('localhost') ? false : { rejectUnauthorized: false } })
    await p.query(`CREATE TABLE IF NOT EXISTS fh_orders (
      id TEXT PRIMARY KEY, data JSONB NOT NULL, placed_at TIMESTAMPTZ DEFAULT NOW()
    )`)
    pool = p; useDB = true
    console.log('[orderStore] PostgreSQL connected ✓')
  } catch (e) {
    console.warn('[orderStore] Using orders.json fallback:', e.message)
    pool = false
  }
  return pool || null
}

export async function getAllOrders() {
  const p = await db()
  if (useDB && p) { const { rows } = await p.query('SELECT data FROM fh_orders ORDER BY placed_at DESC'); return rows.map((r) => r.data) }
  return read()
}
export async function getOrderById(id)    { return (await getAllOrders()).find((o) => o.id === id) || null }
export async function findOrderByQuery(q) {
  const norm = String(q || '').trim().toLowerCase()
  return (await getAllOrders()).find((o) =>
    String(o.id).toLowerCase() === norm || String(o.phone || '').toLowerCase() === norm
  ) || null
}
export async function createOrder(order) {
  const p = await db()
  if (useDB && p) { await p.query('INSERT INTO fh_orders (id,data,placed_at) VALUES ($1,$2,$3)', [order.id, order, order.placedAt]); return order }
  const all = await read(); all.push(order); await write(all); return order
}
export async function updateOrder(id, updates) {
  const p = await db()
  if (useDB && p) {
    const { rows } = await p.query('SELECT data FROM fh_orders WHERE id=$1', [id])
    if (!rows.length) return null
    const updated = { ...rows[0].data, ...updates }
    await p.query('UPDATE fh_orders SET data=$1 WHERE id=$2', [updated, id]); return updated
  }
  const all = await read(), idx = all.findIndex((o) => o.id === id)
  if (idx === -1) return null
  all[idx] = { ...all[idx], ...updates }; await write(all); return all[idx]
}
export async function removeOrder(id) {
  const p = await db()
  if (useDB && p) { await p.query('DELETE FROM fh_orders WHERE id=$1', [id]); return }
  await write((await read()).filter((o) => o.id !== id))
}
