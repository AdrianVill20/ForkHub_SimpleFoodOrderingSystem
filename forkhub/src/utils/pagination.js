export const PAGE_SIZE = 10

// Returns the rows for the current page and the page count. Clamps the page when the list shrinks.
export function paginate(list, page, pageSize = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize))
  const current = Math.min(Math.max(1, page), totalPages)
  return { rows: list.slice((current - 1) * pageSize, current * pageSize), current, totalPages }
}
