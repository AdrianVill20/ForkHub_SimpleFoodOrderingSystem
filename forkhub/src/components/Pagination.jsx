export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  return (
    <nav className="pagination" aria-label="Pages">
      <button type="button" className="pagination-btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ‹ Prev
      </button>
      <span className="pagination-info">Page {page} of {totalPages}</span>
      <button type="button" className="pagination-btn" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next ›
      </button>
    </nav>
  )
}
