import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'

export default function Register() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <TopNav />
      <main className="content-wrap">
        <h1 className="section-title">Create ForkHub&apos;s Profile</h1>
        <p className="muted" style={{ textAlign: 'center', marginBottom: 24 }}>
          Fill out the form below to create a ForkHub profile and start ordering.
        </p>

        <div className="form-panel" style={{ maxWidth: 700 }}>
          <label>First Name</label>
          <input className="field" />
          <label>Last Name</label>
          <input className="field" />
          <label>Email Address</label>
          <input className="field" />
          <label>Confirm Email Address</label>
          <input className="field" />
          <label>Primary Phone Number</label>
          <input className="field" />
          <label>Password</label>
          <input className="field" type="password" />
          <label>Confirm Password</label>
          <input className="field" type="password" />

          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <button className="btn-red" onClick={() => navigate('/dashboard')}>
              Continue
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}