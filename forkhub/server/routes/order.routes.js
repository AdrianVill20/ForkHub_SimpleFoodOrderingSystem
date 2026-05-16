import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { createHttpError } from '../utils/httpErrors.js'
import {
  getAllOrders, getOrderById, findOrderByQuery,
  createOrder, updateOrder, removeOrder,
} from '../services/orderStore.js'

const router = Router()

// GET /api/orders  — admin gets all, member gets own
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const all = await getAllOrders()
    res.json(req.user.role === 'admin' ? all : all.filter((o) => o.userId === req.user.id))
  } catch (e) { next(e) }
})

// GET /api/orders/track?q=  — public order tracking by ID or phone
router.get('/track', async (req, res, next) => {
  try {
    const found = await findOrderByQuery(req.query.q)
    if (!found) return res.status(404).json({ message: 'Order not found' })
    res.json(found)
  } catch (e) { next(e) }
})

// GET /api/orders/:id
router.get('/:id', async (req, res, next) => {
  try {
    const o = await getOrderById(req.params.id)
    if (!o) throw createHttpError(404, 'Order not found')
    res.json(o)
  } catch (e) { next(e) }
})

// POST /api/orders  — place a new order (requires auth)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { items, total, serviceType, address, phone, branch, destination } = req.body
    if (!items?.length)                           throw createHttpError(400, 'Cart is empty')
    if (!phone)                                   throw createHttpError(400, 'Phone is required')
    if (serviceType === 'Delivery' && !address)   throw createHttpError(400, 'Address is required')
    const now = new Date()
    const id  = `FH-${String(now.getTime()).slice(-7)}-${Math.floor(Math.random() * 90 + 10)}`
    const order = {
      id, userId: req.user.id,
      status: 'Pending', placedAt: now.toISOString(),
      items, total, serviceType,
      address: address || '', phone, branch,
      destination: destination || null,
    }
    res.status(201).json(await createOrder(order))
  } catch (e) { next(e) }
})

// PUT /api/orders/:id/status  — admin updates status
router.put('/:id/status', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') throw createHttpError(403, 'Admin only')
    const { status, cancelReason } = req.body
    const upd = { status, ...(status === 'Cancelled' ? { cancelledAt: new Date().toISOString(), cancelReason: cancelReason || '' } : {}) }
    const updated = await updateOrder(req.params.id, upd)
    if (!updated) throw createHttpError(404, 'Order not found')
    res.json(updated)
  } catch (e) { next(e) }
})

// DELETE /api/orders/:id  — admin deletes order
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') throw createHttpError(403, 'Admin only')
    await removeOrder(req.params.id)
    res.json({ message: 'Order deleted' })
  } catch (e) { next(e) }
})

export default router
