import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { supabase } from '../../supabase'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import '../../styles/Auth.css'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMessage, setForgotMessage] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) throw error

      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    } catch (err) {
      if (err.message === 'Invalid login credentials')
        setError('Incorrect email or password')
      else if (err.message.includes('Email not confirmed'))
        setError('Please verify your email before logging in')
      else
        setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setForgotMessage('')

    if (!forgotEmail) {
      setForgotMessage('Please enter your email')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(forgotEmail)) {
      setForgotMessage('Enter a valid email address')
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        forgotEmail,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      )

      if (error) throw error

      setForgotMessage('Password reset email sent! Check your inbox.')
    } catch (err) {
      console.error(err)
      setForgotMessage('Failed to send reset email. Check your email address.')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-logo" onClick={() => navigate('/')}>CookEase</h1>
          <p className="auth-subtitle">Welcome back!</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group password-group">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="toggle-btn"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="forgot-password">
            <button type="button" onClick={() => setShowForgotModal(true)}>
              Forgot Password?
            </button>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/signup"> Sign up</Link></p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          className="forgot-modal-overlay"
          onClick={() => setShowForgotModal(false)}
        >
          <div className="forgot-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Reset Password</h2>
            <p>Enter your email to receive a password reset link</p>

            {forgotMessage && (
              <div className="auth-error">{forgotMessage}</div>
            )}

            <input
              type="email"
              placeholder="your@email.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />

            <div className="forgot-buttons">
              <button onClick={handleForgotPassword} className="auth-btn">
                Send Reset Link
              </button>
              <button
                onClick={() => setShowForgotModal(false)}
                className="auth-btn"
                style={{ background: '#ccc', color: '#333' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login
