import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

export default function TrackingPage() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <Navbar />

        <div className="dashboard">
          <h1>Tracking</h1>
        </div>
      </div>
    </div>
  )
}