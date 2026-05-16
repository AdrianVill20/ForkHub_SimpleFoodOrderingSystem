const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api/auth`
  : 'http://localhost:3001/api/auth'

export async function deleteUser(token) {
  const response = await fetch(`${BASE_URL}/profile`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to delete user account')
  }

  return await response.json()
}
