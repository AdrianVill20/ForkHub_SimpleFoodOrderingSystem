export const PHONE_ERROR_MESSAGE = 'Enter a valid Philippine mobile number (09XXXXXXXXX or +639XXXXXXXXX).'

export function normalizePhone(value) {
  const cleaned = String(value || '').replace(/[\s()-]/g, '')
  if (cleaned.startsWith('+63')) return `0${cleaned.slice(3)}`
  return cleaned
}

export function isValidPhone(value) {
  const normalized = String(value || '').replace(/[\s()-]/g, '')
  return /^(09\d{9}|\+639\d{9})$/.test(normalized)
}
