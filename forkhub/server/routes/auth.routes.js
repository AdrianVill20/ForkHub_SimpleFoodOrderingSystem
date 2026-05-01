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

function withoutPassword(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
    address: user.address || '',
    createdAt: user.createdAt,
  }
}

function issueToken(user) {
  return jwt.sign({ email: user.email }, jwtSecret, {
    subject: user.id,
    expiresIn: jwtExpiresIn,
  })
}

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
    const user = {
      id: uuidv4(),
      email,
      password: passwordHash,
      firstName,
      lastName,
      phone,
      address,
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
    const userIndex = users.findIndex((item) => item.id === req.user.id)

    if (userIndex === -1) {
      throw createHttpError(404, 'User not found')
    }

    users.splice(userIndex, 1)
    await writeUsers(users)

    return res.json({ message: 'User account deleted successfully' })
  } catch (error) {
    return next(error)
  }
})

export default router
