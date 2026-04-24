import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

const initialUsers = [
  { id: 1, name: 'Lyka Santos',     username: 'lyka',  role: 'Admin',    email: 'lyka@forkhub.com',  status: 'Active'   },
  { id: 2, name: 'Juan Dela Cruz',  username: 'juan',  role: 'Customer', email: 'juan@email.com',    status: 'Active'   },
  { id: 3, name: 'Maria Reyes',     username: 'maria', role: 'Customer', email: 'maria@email.com',   status: 'Inactive' },
  { id: 4, name: 'Carlo Mendoza',   username: 'carlo', role: 'Admin',    email: 'carlo@forkhub.com', status: 'Active'   },
  { id: 5, name: 'Anna Torres',     username: 'anna',  role: 'Customer', email: 'anna@email.com',    status: 'Active'   },
]

const roleBadge = {
  Admin:    { bg: '#fce4ec', color: '#c62828' },
  Customer: { bg: '#e3f2fd', color: '#1565c0' }
}

export default function UserPage() {
  const [users, setUsers]           = useState(initialUsers)
  const [search, setSearch]         = useState('')
  const [filterRole, setFilterRole] = useState('All')
  const [confirmUser, setConfirmUser] = useState(null)
  const [toast, setToast]           = useState('')

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    const matchSearch =
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    const matchRole = filterRole === 'All' || u.role === filterRole
    return matchSearch && matchRole
  })

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleDelete = () => {
    setUsers((prev) => prev.filter((u) => u.id !== confirmUser.id))
    showToast(`User "${confirmUser.name}" has been removed.`)
    setConfirmUser(null)
  }

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <Navbar />
        <div className="dashboard">
          <h1>User Management</h1>
          <p style={{ color: '#888', marginTop: 4 }}>View and manage registered users</p>

          {/* Search & Filter */}
          <div style={{ display: 'flex', gap: 12, marginTop: 24, marginBottom: 20, flexWrap: 'wrap' }}>
            <input
              placeholder="Search by name, username, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1, minWidth: 220, padding: '12px 16px',
                border: '1px solid #ddd', borderRadius: 10, fontSize: 14, outline: 'none',
              }}
            />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              style={{
                padding: '12px 16px', border: '1px solid #ddd',
                borderRadius: 10, fontSize: 14, background: 'white', cursor: 'pointer',
              }}
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Staff">Staff</option>
              <option value="Customer">Customer</option>
            </select>
          </div>

          <p style={{ fontSize: 13, color: '#8d6e63', marginBottom: 12 }}>
            Showing <strong>{filtered.length}</strong> of <strong>{users.length}</strong> users
          </p>

          {/* Table */}
          <div style={{ background: 'white', borderRadius: 18, boxShadow: '0 10px 18px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#8d6e63', color: 'white' }}>
                  {['#', 'Name', 'Username', 'Email', 'Role', 'Status', 'Action'].map((h) => (
                    <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((user, index) => (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: '1px solid #f0e6de',
                        background: index % 2 === 0 ? 'white' : '#fdf6f0',
                      }}
                    >
                      <td style={{ padding: '14px 18px', color: '#888', fontSize: 13 }}>{user.id}</td>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: '#4e342e' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: '#8d6e63', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 700, flexShrink: 0,
                          }}>
                            {user.name.charAt(0)}
                          </div>
                          {user.name}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#666', fontSize: 13 }}>@{user.username}</td>
                      <td style={{ padding: '14px 18px', color: '#666', fontSize: 13 }}>{user.email}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          background: roleBadge[user.role]?.bg,
                          color: roleBadge[user.role]?.color,
                        }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          background: user.status === 'Active' ? '#e8f5e9' : '#f5f5f5',
                          color: user.status === 'Active' ? '#2e7d32' : '#9e9e9e',
                        }}>
                          {user.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <button
                          onClick={() => setConfirmUser(user)}
                          style={{
                            padding: '6px 14px', background: '#ffebee', color: '#c62828',
                            border: '1px solid #ef9a9a', borderRadius: 8,
                            fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation */}
      {confirmUser && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: 36,
            width: 420, boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: '#ffebee', margin: '0 auto 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
            }}>
              🗑️
            </div>
            <h2 style={{ color: '#4e342e', marginBottom: 10, fontSize: 20 }}>Remove User</h2>
            <p style={{ color: '#888', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Are you sure you want to remove{' '}
              <strong style={{ color: '#c62828' }}>{confirmUser.name}</strong>?
              <br />This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmUser(null)}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid #ddd',
                  background: 'white', color: '#666', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 10, border: 'none',
                  background: '#c62828', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: '#4e342e', color: 'white', padding: '14px 28px',
          borderRadius: 12, fontSize: 14, fontWeight: 500,
          boxShadow: '0 8px 20px rgba(0,0,0,0.2)', zIndex: 2000,
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}