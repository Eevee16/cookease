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
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let mounted = true
    let errorTimeout = null

    const handlePasswordRecovery = async () => {
      try {
        // Check if we have recovery parameters in the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const type = hashParams.get('type')
        const accessToken = hashParams.get('access_token')

        if (type !== 'recovery' || !accessToken) {
          // Not a recovery link
          if (mounted) {
            setError('Invalid or expired reset link. Please request a new password reset.')
            setChecking(false)
          }
          return
        }

        // We have recovery parameters - wait for Supabase to process them
        // Set a timeout to show error if session isn't established
        errorTimeout = setTimeout(() => {
          if (mounted && !recoveryReady) {
            setError('Failed to process reset link. Please request a new password reset.')
            setChecking(false)
          }
        }, 5000) // Wait 5 seconds max

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth event:', event, session?.user?.id)

          if (!mounted) return

          if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
            // Recovery session established
            clearTimeout(errorTimeout)
            setError('')
            setRecoveryReady(true)
            setChecking(false)
            console.log('Password recovery ready')
          }
        })

        // Also check current session immediately
        const { data: { session } } = await supabase.auth.getSession()
        if (session && mounted) {
          clearTimeout(errorTimeout)
          setError('')
          setRecoveryReady(true)
          setChecking(false)
        }

        return () => {
          mounted = false
          subscription.unsubscribe()
          clearTimeout(errorTimeout)
        }
      } catch (err) {
        console.error('Recovery check error:', err)
        if (mounted) {
          setError('Failed to process reset link. Please try again.')
          setChecking(false)
        }
      }
    }

    handlePasswordRecovery()

    return () => {
      mounted = false
      if (errorTimeout) clearTimeout(errorTimeout)
    }
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

        {checking ? (
          // Still checking - show loading
          <div className="auth-form">
            <div className="auth-info">Verifying reset link...</div>
          </div>
        ) : !recoveryReady ? (
          // Check complete, but no valid session
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
          // Valid session - show form
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