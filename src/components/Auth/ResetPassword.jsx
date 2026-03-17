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
  const [recoveryReady, setRecoveryReady] = useState(false)

  useEffect(() => {
    let hasHandledRecovery = false

    // Listen for auth state changes to handle password reset links
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change in reset password:', event, session)

      if (event === 'PASSWORD_RECOVERY' && session && !hasHandledRecovery) {
        // User arrived via password reset link and session is established
        hasHandledRecovery = true
        setError('')
        setRecoveryReady(true)
        console.log('Password recovery session established')
      } else if (event === 'SIGNED_IN' && session && !hasHandledRecovery) {
        // Check if this is a recovery session
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const type = hashParams.get('type')
        if (type === 'recovery') {
          hasHandledRecovery = true
          setError('')
          setRecoveryReady(true)
          console.log('Recovery session signed in')
        }
      } else if (!session && !hasHandledRecovery) {
        // No session - check if we should show error
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const type = hashParams.get('type')
        if (type === 'recovery') {
          // Wait a bit for Supabase to process the tokens
          setTimeout(() => {
            if (!hasHandledRecovery) {
              setError('Processing reset link... Please wait.')
            }
          }, 2000)
        } else {
          setError('Invalid or expired reset link. Please request a new password reset.')
        }
      }
    })

    // Initial check - give Supabase time to process hash tokens
    const checkInitialState = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second

      const { data: { session } } = await supabase.auth.getSession()
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const type = hashParams.get('type')

      if (session && type === 'recovery') {
        hasHandledRecovery = true
        setError('')
        setRecoveryReady(true)
        console.log('Initial recovery session found')
      } else if (type === 'recovery' && !session) {
        // Still no session, but we have recovery tokens - Supabase might still be processing
        setError('Processing reset link... Please wait.')
      } else if (!type || type !== 'recovery') {
        setError('Invalid or expired reset link. Please request a new password reset.')
      }
    }

    checkInitialState()

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Check if we have a valid session first
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('No valid reset session. Please request a new password reset.')
      setLoading(false)
      return
    }

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

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-logo" onClick={() => navigate('/')}>CookEase</h1>
          <p className="auth-subtitle">Reset Your Password</p>
        </div>

        {!recoveryReady ? (
          <div className="auth-form">
            {error && <div className="auth-error">{error}</div>}
            {!error && <div className="auth-info">Processing your reset link...</div>}
          </div>
        ) : (
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