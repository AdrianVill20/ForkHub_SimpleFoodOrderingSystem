import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

export default function RegisterPage() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <Navbar />

        <div className="dashboard">
          <h1>Register</h1>
        </div>
      </div>
    </div>
  )
}