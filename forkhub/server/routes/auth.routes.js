import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { jwtExpiresIn, jwtSecret } from '../config.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { readUsers, writeUsers } from '../services/userStore.js'
import { createHttpError } from '../utils/httpErrors.js'
import { minimumPasswordLength, normalizeEmail, validateEmail, validatePassword } from '../utils/validators.js'

const router = Router()
const saltRounds = 10

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123'

const DELETION_GRACE_DAYS = 5

function withoutPassword(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
    address: user.address || '',
    role: user.role || 'customer',
    createdAt: user.createdAt,
    isDeleted: user.isDeleted || false,
    scheduledDeletionDate: user.scheduledDeletionDate || null,
  }
}

function withoutPasswordAdmin(user){
  return {
    ...withoutPassword(user),
    deletedAt: user.deletedAt || null,
  }
}

function issueToken(user) {
  return jwt.sign({ email: user.email, role: user.role || 'customer' }, jwtSecret, {
    subject: user.id,
    expiresIn: jwtExpiresIn,
  })
}

async function purgeExpiredAccounts(){
  try{
    const users = await readUsers()
    const now = new Date()
    const kept = users.filter((u) => {
      if(u.isDeleted || !u.scheduledDeletionDate) return true
      return new Date(u.scheduledDeletionDate) > now
  })
  if (kept.length !== users.length) {
    await writeUsers(kept)
    console.log(`[auth] Purged ${users.length - kept.length} expired account(s)`)
  }
 }catch{}
}
purgeExpiredAccounts()
setInterval(purgeExpiredAccounts, 24 * 60 * 60 * 1000) // Run once a day


router.post('/register', async (req, res, next) => {
  try {
    const emailInput = req.body?.email
    const password = req.body?.password
    const firstName = req.body?.firstName?.trim() || ''
    const lastName = req.body?.lastName?.trim() || ''
    const phone = req.body?.phone?.trim() || ''
    const address = req.body?.address?.trim() || ''

    if (!emailInput || !password) {
      throw createHttpError(400, 'Email and password are required')
    }

    const email = normalizeEmail(emailInput)

    if (!validateEmail(email)) {
      throw createHttpError(400, 'Invalid email format')
    }

    if (!validatePassword(password)) {
      throw createHttpError(400, `Password must be at least ${minimumPasswordLength} characters long`)
    }

    const users = await readUsers()
    const duplicateUser = users.find((user) => user.email === email)

    if (duplicateUser) {
      throw createHttpError(409, 'A user with this email already exists')
    }

    const passwordHash = await bcrypt.hash(password, saltRounds)
    const adminCode = req.body?.adminCode?.trim() || ''
    const role = adminCode === ADMIN_SECRET ? 'admin' : 'customer'
    const user = {
      id: uuidv4(),
      email,
      password: passwordHash,
      firstName,
      lastName,
      phone,
      address,
      role,
      createdAt: new Date().toISOString(),
    }

    users.push(user)
    await writeUsers(users)

    return res.status(201).json({
      user: withoutPassword(user),
    })
  } catch (error) {
    return next(error)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    if (!jwtSecret) {
      throw createHttpError(500, 'JWT secret is not configured')
    }

    const emailInput = req.body?.email
    const password = req.body?.password

    if (!emailInput || !password) {
      throw createHttpError(400, 'Email and password are required')
    }

    const email = normalizeEmail(emailInput)
    const users = await readUsers()
    const user = users.find((item) => item.email === email)

    
    if (!user) {
      throw createHttpError(401, 'Invalid email or password')
    }

    if (user.isDeleted && user.sceduleDeletionAt && new Date(user.scheduledDeletionAt) <= new Date()) {
      await writeUsers(users.filter((u) => u.id !== user.id))
      throw createHttpError(401, 'This account has been permanently deleted')
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      throw createHttpError(401, 'Invalid email or password')
    }

    return res.json({
      token: issueToken(user),
      user: withoutPassword(user),
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const users = await readUsers()
    const user = users.find((item) => item.id === req.user.id)

    if (!user) {
      throw createHttpError(404, 'User not found')
    }

    return res.json({ user: withoutPassword(user) })
  } catch (error) {
    return next(error)
  }
})

router.put('/profile', requireAuth, async (req, res, next) => {
  try {
    const firstName = req.body?.firstName?.trim() || ''
    const lastName = req.body?.lastName?.trim() || ''
    const phone = req.body?.phone?.trim() || ''
    const address = req.body?.address?.trim() || ''

    const users = await readUsers()
    const userIndex = users.findIndex((item) => item.id === req.user.id)

    if (userIndex === -1) {
      throw createHttpError(404, 'User not found')
    }

    const nextUser = {
      ...users[userIndex],
      firstName,
      lastName,
      phone,
      address,
    }

    users[userIndex] = nextUser
    await writeUsers(users)

    return res.json({ user: withoutPassword(nextUser) })
  } catch (error) {
    return next(error)
  }
})

router.delete('/profile', requireAuth, async (req, res, next) => {
  try {
    const users = await readUsers()
    const idx = users.findIndex((u) => u.id === req.user.id)
    if (idx === -1) throw createHttpError(404, 'User not found')
    
    const deletedAt = new Date()
    const scheduledDeletionAt = new Date(deletedAt.getTime() + DELETION_GRACE_DAYS)

   users[idx] = {
    ...users[idx],
    isDeleted: true,
    deletedAt: deletedAt.toISOString(),
    scheduledDeletionAt: scheduledDeletionAt.toISOString(),
   }
   await writeUsers(users)

   return res.json({
    message: `Account scheduled for permanent deletion in ${DELETION_GRACE_DAYS} days`,
    scheduledDeletionAt: scheduledDeletionAt.toISOString(),
    graceDays: DELETION_GRACE_DAYS,
   })
  } catch (e) {return next(e)}
})

router.post('/profile/restore', requireAuth, async (req, res, next) => {
  try {
    const users = await readUsers()
    const idx = users.findIndex((u) => u.id === req.user.id)
    if (idx === -1) throw createHttpError(404, 'User not found')
    
    const { isDeleted: _d, deletedAt: _da, scheduleDeletionAt: _s, ...rest} = users[idx]
    users[idx] = rest
    await writeUsers(users)
    return res.json({ user: withoutPassword(users[idx]), message: 'Account deletion cancelled' })
  } catch (e) { return next(e)}
})

router.get('/users', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') throw createHttpError(403, 'Access denied')
    const users = await readUsers()
    return res.json(users.map(withoutPasswordAdmin))
  } catch (e) { return next(e) }
})

router.delete('/users/:id', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') throw createHttpError(403, 'Admin access required')
    const users   = await readUsers()
    const target  = users.find((u) => u.id === req.params.id)
    if (!target)  throw createHttpError(404, 'User not found')
    if (target.role === 'admin') throw createHttpError(403, 'Cannot delete admin accounts')
    await writeUsers(users.filter((u) => u.id !== req.params.id))
    return res.json({ message: `Account "${target.email}" permanently deleted` })
  } catch (e) { return next(e) }
})

router.post('/users/:id/restore', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') throw createHttpError(403, 'Admin access required')
    const users = await readUsers()
    const idx   = users.findIndex((u) => u.id === req.params.id)
    if (idx === -1) throw createHttpError(404, 'User not found')
    const { isDeleted: _d, deletedAt: _da, scheduledDeletionAt: _s, ...rest } = users[idx]
    users[idx] = rest
    await writeUsers(users)
    return res.json({ user: withoutPasswordAdmin(users[idx]), message: 'Account restored' })
  } catch (e) { return next(e) }
})

export default router
