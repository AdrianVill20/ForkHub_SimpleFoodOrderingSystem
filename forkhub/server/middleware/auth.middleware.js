import jwt from 'jsonwebtoken'
import { jwtSecret } from '../config.js'

export function requireAuth(req, res, next) {
  if (!jwtSecret) {
    return res.status(500).json({ message: 'JWT secret is not configured' })
  }

  const authorization = req.headers.authorization || ''
  const [scheme, token] = authorization.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Missing or invalid authorization token' })
  }

  try {
    const payload = jwt.verify(token, jwtSecret)
    req.user = { id: payload.sub, email: payload.email }
    return next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}
