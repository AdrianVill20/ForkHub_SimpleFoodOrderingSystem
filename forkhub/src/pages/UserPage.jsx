import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

const sampleUsers = [
  { id: 1, name: 'Lyka Santos', username: 'lyka', role: 'Admin', email: 'lyka@forkhub.com', status: 'Active' },
  { id: 2, name: 'Juan Dela Cruz', username: 'juan', role: 'Customer', email: 'juan@email.com', status: 'Active' },
  { id: 3, name: 'Maria Reyes', username: 'maria', role: 'Customer', email: 'maria@email.com', status: 'Inactive' },
  { id: 4, name: 'Carlo Mendoza', username: 'carlo', role: 'Staff', email: 'carlo@forkhub.com', status: 'Active' },
  { id: 5, name: 'Anna Torres', username: 'anna', role: 'Customer', email: 'anna@email.com', status: 'Active' },
]

export default function UserPage() {
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('All')

  const filtered = sampleUsers.filter((user) => {
    const matchSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'All' || user.role === filterRole
    return matchSearch && matchRole
  })

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <Navbar />
        <div className="dashboard">
          <h1>User Management</h1>
          <p style={{ color: '#888', marginTop: 4 }}>View and manage registered users</p>

          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', gap: 12, marginTop: 24, marginBottom: 20, flexWrap: 'wrap' }}>
            <input
              placeholder="Search by name, username, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: 220,
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: 10,
                fontSize: 14,
                outline: 'none',
              }}
            />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: 10,
                fontSize: 14,
                background: 'white',
                cursor: 'pointer',
              }}
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Staff">Staff</option>
              <option value="Customer">Customer</option>
            </select>
          </div>

          {/* Summary Badge */}
          <p style={{ fontSize: 13, color: '#8d6e63', marginBottom: 12 }}>
            Showing <strong>{filtered.length}</strong> of <strong>{sampleUsers.length}</strong> users
          </p>

          {/* Users Table */}
          <div style={{ background: 'white', borderRadius: 18, boxShadow: '0 10px 18px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#8d6e63', color: 'white' }}>
                  {['#', 'Name', 'Username', 'Email', 'Role', 'Status'].map((h) => (
                    <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>
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
                        transition: 'background 0.2s',
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
                          padding: '4px 12px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          background: user.role === 'Admin' ? '#fce4ec' : user.role === 'Staff' ? '#e8f5e9' : '#e3f2fd',
                          color: user.role === 'Admin' ? '#c62828' : user.role === 'Staff' ? '#2e7d32' : '#1565c0',
                        }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          background: user.status === 'Active' ? '#e8f5e9' : '#f5f5f5',
                          color: user.status === 'Active' ? '#2e7d32' : '#9e9e9e',
                        }}>
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}