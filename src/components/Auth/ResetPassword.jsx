import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import '../../styles/Auth.css'

function ResetPassword() {
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let mounted = true
    let retryCount = 0
    const maxRetries = 10

    const checkRecoverySession = async () => {
      try {
        // Check if we have recovery tokens in the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const type = hashParams.get('type')
        const accessToken = hashParams.get('access_token')

        if (type !== 'recovery' || !accessToken) {
          if (mounted) {
            setError('Invalid reset link. Please request a new password reset.')
            setIsReady(false)
          }
          return
        }

        // We have valid tokens - try to get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (session && mounted) {
          // Session established successfully
          console.log('Recovery session ready')
          setIsReady(true)
          setError('')
          return
        }

        // No session yet - retry
        if (retryCount < maxRetries && mounted) {
          retryCount++
          console.log(`Retry ${retryCount}/${maxRetries} - waiting for session...`)
          setTimeout(checkRecoverySession, 500) // Retry every 500ms
        } else if (mounted) {
          // Max retries reached
          setError('Failed to process reset link. Please request a new password reset.')
          setIsReady(false)
        }
      } catch (err) {
        console.error('Session check error:', err)
        if (mounted && retryCount < maxRetries) {
          retryCount++
          setTimeout(checkRecoverySession, 500)
        } else if (mounted) {
          setError('Failed to process reset link. Please try again.')
          setIsReady(false)
        }
      }
    }

    // Start checking immediately
    checkRecoverySession()

    // Also listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event)
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session && mounted) {
        setIsReady(true)
        setError('')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (!/(?=.*[a-z])/.test(newPassword) ||
        !/(?=.*[A-Z])/.test(newPassword) ||
        !/(?=.*\d)/.test(newPassword) ||
        !/(?=.*[@$!%*?&])/.test(newPassword)) {
      setError('Password must include uppercase, lowercase, number, and special character')
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      setSuccess(true)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login')
      }, 2000)

    } catch (err) {
      console.error('Password reset error:', err)
      setError(err.message || 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <h1 className="auth-logo" onClick={() => navigate('/')}>CookEase</h1>
            <p className="auth-subtitle">Password Reset Successful</p>
          </div>
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h3>Your password has been reset!</h3>
            <p>Redirecting to login page...</p>
          </div>
        </div>
      </div>
    )
  }

  // Check if we have recovery tokens but session not ready
  const hashParams = new URLSearchParams(window.location.hash.substring(1))
  const hasTokens = hashParams.get('type') === 'recovery' && hashParams.get('access_token')

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-logo" onClick={() => navigate('/')}>CookEase</h1>
          <p className="auth-subtitle">Reset Your Password</p>
        </div>

        {!isReady && hasTokens && !error ? (
          // Has tokens but session not ready - show loading
          <div className="auth-form">
            <div className="auth-info" style={{ textAlign: 'center', color: '#667EAA', padding: '20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
              <p>Processing your reset link...</p>
              <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '8px' }}>This may take a few seconds</p>
            </div>
          </div>
        ) : !isReady ? (
          // No valid session and no tokens, or error occurred
          <div className="auth-form">
            {error && <div className="auth-error">{error}</div>}
            <button 
              onClick={() => navigate('/login')}
              className="auth-btn"
              style={{ marginTop: '16px' }}
            >
              Back to Login
            </button>
          </div>
        ) : (
          // Session ready - show form
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="new-password">New Password</label>
              <input
                type="password"
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 chars, 1 uppercase, 1 lowercase, 1 number, 1 special"
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>
            Remember your password?{' '}
            <button 
              type="button"
              onClick={() => navigate('/login')}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#667EAA', 
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 0,
                font: 'inherit'
              }}
            >
              Back to Login
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword