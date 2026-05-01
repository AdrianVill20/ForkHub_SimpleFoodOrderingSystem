import fs from 'node:fs/promises'
import path from 'node:path'
import { usersFilePath } from '../config.js'

let writeQueue = Promise.resolve()

function isNotFoundError(error) {
  return error && error.code === 'ENOENT'
}

function parseUsersFile(contents) {
  const parsed = JSON.parse(contents)

  if (!Array.isArray(parsed)) {
    throw new Error('Users data is not an array')
  }

  return parsed
}

async function ensureUsersFile() {
  const directory = path.dirname(usersFilePath)
  await fs.mkdir(directory, { recursive: true })

  try {
    await fs.access(usersFilePath)
  } catch (error) {
    if (!isNotFoundError(error)) throw error
    await fs.writeFile(usersFilePath, '[]', 'utf8')
  }
}

export async function readUsers() {
  await ensureUsersFile()

  try {
    const fileContents = await fs.readFile(usersFilePath, 'utf8')
    return parseUsersFile(fileContents)
  } catch (error) {
    if (error instanceof SyntaxError) {
      const invalidDataError = new Error('Users data file contains invalid JSON')
      invalidDataError.code = 'INVALID_USERS_JSON'
      throw invalidDataError
    }
    throw error
  }
}

async function writeUsersUnsafe(users) {
  const nextJson = `${JSON.stringify(users, null, 2)}\n`
  const tempPath = `${usersFilePath}.tmp`
  await fs.writeFile(tempPath, nextJson, 'utf8')
  await fs.rename(tempPath, usersFilePath)
}

export async function writeUsers(users) {
  await ensureUsersFile()
  writeQueue = writeQueue.then(
    () => writeUsersUnsafe(users),
    () => writeUsersUnsafe(users),
  )
  return writeQueue
}
