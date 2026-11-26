export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const start = Math.max(1, page - 1)
  const end = Math.min(totalPages, page + 1)
  const pages = []

  if (start > 1) {
    pages.push(1)
    if (start > 2) pages.push('start-ellipsis')
  }
  for (let current = start; current <= end; current += 1) pages.push(current)
  if (end < totalPages) {
    if (end < totalPages - 1) pages.push('end-ellipsis')
    pages.push(totalPages)
  }

  return (
    <nav className="pagination" aria-label="Pages">
      <button type="button" className="pagination-btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ‹ Previous
      </button>
      {pages.map((item) => typeof item === 'number' ? (
        <button
          type="button"
          key={item}
          className={`pagination-btn pagination-page${item === page ? ' is-current' : ''}`}
          aria-current={item === page ? 'page' : undefined}
          aria-label={`Page ${item}`}
          disabled={item === page}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ) : (
        <span className="pagination-ellipsis" key={item} aria-hidden="true">…</span>
      ))}
      <button type="button" className="pagination-btn" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next ›
      </button>
    </nav>
  )
}
