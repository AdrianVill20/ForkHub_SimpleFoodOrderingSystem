import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import Register from './pages/Register'
import DashboardPage from './pages/DashboardPage'
import MenuPage from './pages/MenuPage'
import UserPage from './pages/UserPage'
import CartPage from './pages/CartPage'
import OrderPage from './pages/OrderPage'
import TrackingPage from './pages/TrackingPage'
import AdminPage from './pages/AdminPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/users" element={<UserPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<OrderPage />} />
        <Route path="/tracking" element={<TrackingPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App