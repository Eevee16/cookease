// src/components/Auth/Signup.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../../styles/Auth.css';
import { supabase } from '../../supabaseClient';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;
    return score;
  };

  const getStrengthLabel = (score) => {
    if (score <= 2) return 'Weak';
    if (score <= 4) return 'Medium';
    return 'Strong';
  };

  useEffect(() => {
    const newErrors = {};

    if ((formData.firstName && formData.firstName.length < 2) ||
        (formData.lastName && formData.lastName.length < 2)) {
      newErrors.name = 'First and Last name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (formData.password) {
      const strength = calculatePasswordStrength(formData.password);
      setPasswordStrength(strength);

      if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      } else if (!/(?=.*[a-z])/.test(formData.password) ||
                 !/(?=.*[A-Z])/.test(formData.password) ||
                 !/(?=.*\d)/.test(formData.password) ||
                 !/(?=.*[@$!%*?&])/.test(formData.password)) {
        newErrors.password = 'Password must include uppercase, lowercase, number, and special character';
      }
    } else {
      setPasswordStrength(0);
    }

    if (formData.confirmPassword && formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
  }, [formData]);

  const uploadAvatar = async (userId, avatarFile) => {
    const fileExt = avatarFile.name.split('.').pop();

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-avatar-upload-url`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ userId, fileExt }),
      }
    );

    const { signedUrl, path, error: urlError } = await res.json();
    if (urlError) throw new Error(urlError);

    const uploadRes = await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': avatarFile.type },
      body: avatarFile,
    });

    if (!uploadRes.ok) throw new Error('Avatar upload failed');

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(path);

    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      // Step 1: Sign up user
      const { data: userData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${import.meta.env.VITE_SITE_URL || window.location.origin}/login`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!userData.user) throw new Error('Signup failed - no user returned');

      const userId = userData.user.id;

      // Step 2: Upload avatar if provided, then save profile row
      let photoUrl = null;
      if (profileImage) {
        try {
          photoUrl = await uploadAvatar(userId, profileImage);
        } catch (uploadErr) {
          console.error('Avatar upload error:', uploadErr);
          // Don't block signup if avatar upload fails
        }
      }

      // Step 3: Save profile row with all fields including email (NOT NULL)
      // FIX: upsert needs `id` inside the object — .eq() doesn't work with upsert
      // FIX: include email, first_name, last_name so the profile is complete on signup
      const profilePayload = {
        id: userId,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        ...(photoUrl && { photo_url: photoUrl }),
        updated_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      if (upsertError) {
        console.error('Profile upsert error:', upsertError);
        // Don't block signup — user can update profile later
      }

      alert('Account created! Check your email to confirm.');
      navigate('/login', { replace: true });

    } catch (err) {
      console.error('Signup error:', err);

      if (err.message && err.message.includes('rate limit')) {
        setErrors({ general: 'Too many signup attempts. Please wait a minute and try again.' });
      } else {
        setErrors({ general: err.message || 'Signup failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-logo" onClick={() => navigate('/')}>CookEase</h1>
          <p className="auth-subtitle">Create your account</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {errors.general && <div className="auth-error">{errors.general}</div>}

          <div className="name-group">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Juan"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Dela Cruz"
                required
              />
            </div>
          </div>
          {errors.name && <p className="form-error">{errors.name}</p>}

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
            {errors.email && <p className="form-error">{errors.email}</p>}
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
                placeholder="At least 6 chars, 1 uppercase, 1 lowercase, 1 number, 1 special"
                required
              />
              <button type="button" className="toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && <p className="form-error">{errors.password}</p>}
            {formData.password && (
              <div className="password-strength">
                <div className={`strength-bar strength-${passwordStrength}`}></div>
                <span>{getStrengthLabel(passwordStrength)}</span>
              </div>
            )}
          </div>

          <div className="form-group password-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-wrapper">
              <input
                type={showConfirm ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                required
              />
              <button type="button" className="toggle-btn" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="profileImage">Profile Image (Optional)</label>
            <input type="file" id="profileImage" accept="image/*" onChange={handleImageChange} />
            {imagePreview && <img src={imagePreview} alt="Preview" className="image-preview" />}
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Log in</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Signup;