const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const minimumPasswordLength = 8

export function validateEmail(email) {
  return emailRegex.test(email)
}

export function validatePassword(password) {
  return password.length >= minimumPasswordLength
}

export function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

export { minimumPasswordLength }
