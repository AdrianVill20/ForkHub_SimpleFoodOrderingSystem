import { Link } from 'react-router-dom'

export default function TopNav({ signedIn = false }) {
  return (
    <header className="top-nav">
      <Link className="top-nav-item" to="/">
        Order Online
      </Link>
      <Link className="top-nav-item" to="/menu">
        Menu
      </Link>
      <Link className="top-nav-item" to="/orders">
        Promotions & E-Vouchers
      </Link>
      <Link className="top-nav-item" to="/tracking">
        Tracker
      </Link>

      <div className="top-nav-right">
        <Link className="top-nav-item" to={signedIn ? '/users' : '/login'}>
          {signedIn ? 'Hi, John Christian' : 'Sign In'}
        </Link>
        <Link className="top-nav-item" to="/cart">
          Cart
        </Link>
      </div>
    </header>
  )
}
