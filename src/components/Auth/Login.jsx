import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import '../../styles/Auth.css'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [banInfo, setBanInfo] = useState(null)

  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMessage, setForgotMessage] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const formatTimeRemaining = (now, until) => {
    const diff = until - now
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) {
      const remainingHours = hours % 24
      return `${days} day${days > 1 ? 's' : ''}${remainingHours > 0 ? ` and ${remainingHours} hour${remainingHours > 1 ? 's' : ''}` : ''}`
    }
    
    return `${hours} hour${hours > 1 ? 's' : ''}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBanInfo(null)
    setLoading(true)

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError

      const confirmed = !!(
        data?.user?.email_confirmed_at ||
        data?.user?.confirmed_at ||
        data?.user?.email_confirmed
      )

      if (!confirmed) {
        await supabase.auth.signOut()
        setError('Please verify your email before logging in')
        setLoading(false)
        return
      }

      // ✅ CHECK BAN STATUS AFTER SUCCESSFUL AUTH
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, status, ban_until, ban_reason")
        .eq("id", data.user.id)
        .single()

      if (profileError) {
        console.error("Profile fetch error:", profileError)
        // If we can't fetch profile, allow login but log the error
        const from = location.state?.from?.pathname || '/'
        navigate(from, { replace: true })
        return
      }

      // ✅ PERMANENT BAN - Sign out and show message
      if (profile.status === "banned") {
        await supabase.auth.signOut()
        
        setBanInfo({
          type: "permanent",
          reason: profile.ban_reason || "Your account has been permanently banned.",
          message: "Your account has been permanently suspended. If you believe this is a mistake, please contact support."
        })
        setLoading(false)
        return
      }

      // ✅ TEMPORARY BAN - Check if expired
      if (profile.status === "tempbanned") {
        const banUntil = new Date(profile.ban_until)
        const now = new Date()

        // If ban has expired, auto-unban them
        if (banUntil <= now) {
          await supabase
            .from("profiles")
            .update({
              status: "active",
              ban_until: null,
              ban_reason: null
            })
            .eq("id", profile.id)

          // Allow them to proceed
          const from = location.state?.from?.pathname || '/'
          navigate(from, { replace: true })
          return
        }

        // Ban is still active - sign them out
        await supabase.auth.signOut()

        const timeRemaining = formatTimeRemaining(now, banUntil)
        
        setBanInfo({
          type: "temporary",
          reason: profile.ban_reason || "Your account has been temporarily suspended.",
          until: banUntil.toLocaleString("en-PH", { 
            dateStyle: "long", 
            timeStyle: "short" 
          }),
          remaining: timeRemaining,
          message: `Your account is temporarily suspended until ${banUntil.toLocaleString("en-PH", { 
            dateStyle: "long", 
            timeStyle: "short" 
          })}.`
        })
        setLoading(false)
        return
      }

      // ✅ USER IS NOT BANNED - Proceed with login
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })

    } catch (err) {
      if (err.message === 'Invalid login credentials')
        setError('Incorrect email or password')
      else if (err.message.includes('Email not confirmed'))
        setError('Please verify your email before logging in')
      else
        setError('Login failed. Please try again.')
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
          redirectTo: `${import.meta.env.VITE_SITE_URL || window.location.origin}/reset-password`,
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

        {/* ✅ BAN NOTIFICATION */}
        {banInfo && (
          <div className={`ban-alert ${banInfo.type === "permanent" ? "ban-alert-permanent" : "ban-alert-temporary"}`}>
            <div className="ban-alert-icon">
              {banInfo.type === "permanent" ? "🚫" : "🕐"}
            </div>
            <div className="ban-alert-content">
              <h3 className="ban-alert-title">
                {banInfo.type === "permanent" 
                  ? "Account Permanently Banned" 
                  : "Account Temporarily Suspended"}
              </h3>
              <p className="ban-alert-message">{banInfo.message}</p>
              {banInfo.type === "temporary" && (
                <div className="ban-alert-details">
                  <p><strong>Time Remaining:</strong> {banInfo.remaining}</p>
                  <p><strong>Access Restored:</strong> {banInfo.until}</p>
                </div>
              )}
              {banInfo.reason && (
                <div className="ban-alert-reason">
                  <strong>Reason:</strong> {banInfo.reason}
                </div>
              )}
              {banInfo.type === "permanent" && (
                <p className="ban-alert-support">
                  If you believe this is a mistake, please contact support at support@cookease.com
                </p>
              )}
            </div>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && !banInfo && <div className="auth-error">{error}</div>}

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
          <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
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