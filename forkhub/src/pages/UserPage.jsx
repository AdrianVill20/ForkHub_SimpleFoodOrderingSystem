import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

export default function UserPage() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <Navbar />
        <div className="dashboard">
          <h1>User Management</h1>
        </div>
      </div>
    </div>
  )
}