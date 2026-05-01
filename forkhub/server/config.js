import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const rootDir = path.resolve(__dirname, '..')
export const usersFilePath = path.join(rootDir, 'data', 'users.json')
export const jwtSecret = process.env.JWT_SECRET || 'dev-only-jwt-secret-change-me'
export const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1h'
export const port = Number(process.env.PORT) || 3001
