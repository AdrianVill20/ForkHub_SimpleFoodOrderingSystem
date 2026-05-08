import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { readMenu, writeMenu } from '../services/menuStore.js'
import { createHttpError } from '../utils/httpErrors.js'

const router = Router()

/* ── GET /api/menu  */
router.get('/', async (req, res, next) => {
  try {
    const items    = await readMenu()
    const category = req.query.category
    const result   = category
      ? items.filter((i) => i.category === category)
      : items
    return res.json(result)
  } catch (error) {
    return next(error)
  }
})

/* ── GET /api/menu/:id  */
router.get('/:id', async (req, res, next) => {
  try {
    const items = await readMenu()
    const item  = items.find((i) => i.id === req.params.id)
    if (!item) throw createHttpError(404, 'Menu item not found')
    return res.json(item)
  } catch (error) {
    return next(error)
  }
})

/* ── POST /api/menu  — add new item  */
router.post('/', async (req, res, next) => {
  try {
    const { name, category, subcategory, description, price, image } = req.body

    if (!name || !category || price === undefined) {
      throw createHttpError(400, 'name, category and price are required')
    }

    const items   = await readMenu()
    const newItem = {
      id: uuidv4(),
      name:        String(name).trim(),
      category:    String(category).trim(),
      subcategory: String(subcategory || 'Classic').trim(),
      description: String(description || '').trim(),
      price:       Number(price),
      image:       String(image || '').trim(),
    }

    items.push(newItem)
    await writeMenu(items)
    return res.status(201).json(newItem)
  } catch (error) {
    return next(error)
  }
})

/* ── PUT /api/menu/:id  — edit existing item  */
router.put('/:id', async (req, res, next) => {
  try {
    const items = await readMenu()
    const idx   = items.findIndex((i) => i.id === req.params.id)
    if (idx === -1) throw createHttpError(404, 'Menu item not found')

    const { name, category, subcategory, description, price, image } = req.body

    items[idx] = {
      ...items[idx],
      ...(name        !== undefined && { name:        String(name).trim()        }),
      ...(category    !== undefined && { category:    String(category).trim()    }),
      ...(subcategory !== undefined && { subcategory: String(subcategory).trim() }),
      ...(description !== undefined && { description: String(description).trim() }),
      ...(price       !== undefined && { price:       Number(price)              }),
      ...(image       !== undefined && { image:       String(image).trim()       }),
    }

    await writeMenu(items)
    return res.json(items[idx])
  } catch (error) {
    return next(error)
  }
})

/* ── DELETE /api/menu/:id  */
router.delete('/:id', async (req, res, next) => {
  try {
    const items = await readMenu()
    const idx   = items.findIndex((i) => i.id === req.params.id)
    if (idx === -1) throw createHttpError(404, 'Menu item not found')

    const [removed] = items.splice(idx, 1)
    await writeMenu(items)
    return res.json({ message: `"${removed.name}" deleted successfully` })
  } catch (error) {
    return next(error)
  }
})

export default router
