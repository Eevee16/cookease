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
  const [banPopup, setBanPopup] = useState(null)
  const [unverifiedEmail, setUnverifiedEmail] = useState(null)

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
    setBanPopup(null)
    setUnverifiedEmail(null)
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

      // ✅ STRICT EMAIL VERIFICATION CHECK
      const confirmed = !!(
        data?.user?.email_confirmed_at ||
        data?.user?.confirmed_at ||
        data?.user?.email_confirmed
      )

      if (!confirmed) {
        await supabase.auth.signOut()
        setUnverifiedEmail(formData.email)
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

      // ✅ PERMANENT BAN - Sign out and show popup
      if (profile.status === "banned") {
        await supabase.auth.signOut()
        
        setBanPopup({
          type: "permanent",
          reason: profile.ban_reason || "Policy violation"
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

        // Ban is still active - sign them out and show popup
        await supabase.auth.signOut()

        const timeRemaining = formatTimeRemaining(now, banUntil)
        
        setBanPopup({
          type: "temporary",
          reason: profile.ban_reason || "Temporary suspension",
          until: banUntil,
          remaining: timeRemaining
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

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: unverifiedEmail,
      })

      if (error) throw error

      alert('Verification email sent! Please check your inbox.')
    } catch (err) {
      console.error(err)
      alert('Failed to send verification email. Please try again.')
    }
  }

  return (
    <div className="auth-page">
      {/* ✅ BAN POPUP OVERLAY */}
      {banPopup && (
        <div className="ban-overlay" onClick={() => setBanPopup(null)}>
          <div className="ban-popup" onClick={(e) => e.stopPropagation()}>
            {banPopup.type === "permanent" ? (
              <>
                <div className="ban-icon permanent">🚫</div>
                <h2>Account Permanently Banned</h2>
                <p className="ban-reason">
                  <strong>Reason:</strong> {banPopup.reason}
                </p>
                <p className="ban-message">
                  Your account has been permanently suspended and you cannot access CookEase.
                </p>
                <p className="ban-contact">
                  If you believe this is a mistake, please contact support at support@cookease.com
                </p>
                <button className="ban-close-btn" onClick={() => setBanPopup(null)}>
                  Close
                </button>
              </>
            ) : (
              <>
                <div className="ban-icon temporary">⏱️</div>
                <h2>Account Temporarily Suspended</h2>
                <p className="ban-reason">
                  <strong>Reason:</strong> {banPopup.reason}
                </p>
                <div className="ban-countdown">
                  <span className="countdown-label">Time Remaining</span>
                  <span className="countdown-time">{banPopup.remaining}</span>
                </div>
                <p className="ban-message">
                  Your account is temporarily suspended. You cannot log in during this period.
                </p>
                <p className="ban-until">
                  Your access will be restored on{" "}
                  <strong>
                    {banPopup.until.toLocaleString("en-PH", {
                      dateStyle: "long",
                      timeStyle: "short",
                    })}
                  </strong>
                </p>
                <button className="ban-close-btn" onClick={() => setBanPopup(null)}>
                  I Understand
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ✅ EMAIL VERIFICATION POPUP */}
      {unverifiedEmail && (
        <div className="ban-overlay" onClick={() => setUnverifiedEmail(null)}>
          <div className="ban-popup" onClick={(e) => e.stopPropagation()}>
            <div className="ban-icon" style={{ color: '#3b82f6' }}>📧</div>
            <h2>Email Not Verified</h2>
            <p className="ban-message">
              You must verify your email address before logging in to CookEase.
            </p>
            <p className="ban-reason">
              <strong>Email:</strong> {unverifiedEmail}
            </p>
            <p className="ban-contact">
              Please check your inbox for the verification email. Don't forget to check your spam folder!
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
              <button 
                className="ban-close-btn" 
                style={{ background: '#10b981', flex: 1 }}
                onClick={handleResendVerification}
              >
                Resend Verification Email
              </button>
              <button 
                className="ban-close-btn" 
                style={{ background: '#6b7280', flex: 1 }}
                onClick={() => setUnverifiedEmail(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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