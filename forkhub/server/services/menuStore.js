import fs   from 'node:fs/promises'
import path from 'node:path'
import { menuFilePath } from '../config.js'

let writeQueue = Promise.resolve()

function isNotFoundError(error) {
  return error && error.code === 'ENOENT'
}

function parseMenuFile(contents) {
  const parsed = JSON.parse(contents)
  if (!Array.isArray(parsed)) throw new Error('Menu data is not an array')
  return parsed
}

async function ensureMenuFile() {
  const directory = path.dirname(menuFilePath)
  await fs.mkdir(directory, { recursive: true })
  try {
    await fs.access(menuFilePath)
  } catch (error) {
    if (!isNotFoundError(error)) throw error
    await fs.writeFile(menuFilePath, '[]', 'utf8')
  }
}

export async function readMenu() {
  await ensureMenuFile()
  try {
    const contents = await fs.readFile(menuFilePath, 'utf8')
    return parseMenuFile(contents)
  } catch (error) {
    if (error instanceof SyntaxError) {
      const err = new Error('Menu data file contains invalid JSON')
      err.code = 'INVALID_MENU_JSON'
      throw err
    }
    throw error
  }
}

async function writeMenuUnsafe(items) {
  const nextJson = `${JSON.stringify(items, null, 2)}\n`
  const tempPath = `${menuFilePath}.tmp`
  await fs.writeFile(tempPath, nextJson, 'utf8')
  await fs.rename(tempPath, menuFilePath)
}

export async function writeMenu(items) {
  await ensureMenuFile()
  writeQueue = writeQueue.then(
    () => writeMenuUnsafe(items),
    () => writeMenuUnsafe(items),
  )
  return writeQueue
}
