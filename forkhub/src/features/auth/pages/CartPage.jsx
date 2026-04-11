import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

export default function CartPage() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <Navbar />

        <div className="dashboard">
          <h1>Shopping Cart</h1>
        </div>
      </div>
    </div>
  )
}