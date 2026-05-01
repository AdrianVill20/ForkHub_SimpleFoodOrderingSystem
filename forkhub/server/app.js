import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.routes.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` })
})

app.use((error, _req, res, _next) => {
  if (error.code === 'INVALID_USERS_JSON') {
    return res.status(500).json({ message: error.message })
  }

  const status = error.status || 500
  return res.status(status).json({
    message: error.message || 'Internal server error',
  })
})

export default app
