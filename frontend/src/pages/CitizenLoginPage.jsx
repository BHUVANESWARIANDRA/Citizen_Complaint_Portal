import React, { useState } from 'react';
import { User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter, Link } from '../router/Router';
import { useAuth } from '../context/AuthContext';

export const CitizenLoginPage = () => {
  const { navigate } = useRouter();
  const { login, logout } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccessMessage('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (response.role !== 'ROLE_CITIZEN') {
        logout();
        setApiError('This sign-in page is for citizen accounts. Please use the officer sign-in page.');
        return;
      }

      setSuccessMessage('Login successful! Redirecting...');
      setTimeout(() => {
        navigate('/citizen/dashboard');
      }, 700);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password.';
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon-badge citizen">
              <User size={28} />
            </div>
            <h2>Citizen Sign In</h2>
            <p>Access your submitted complaints and track municipal resolutions.</p>
          </div>

          {apiError && (
            <div className="alert alert-danger">
              <AlertCircle size={18} />
              <span>{apiError}</span>
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success">
              <CheckCircle2 size={18} />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="e.g. citizen.demo@smartcitizen.gov"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'input-error' : ''}
                  disabled={submitting}
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'input-error' : ''}
                  disabled={submitting}
                  autoComplete="current-password"
                />
              </div>
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign In as Citizen'}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="demo-hint-box">
            <strong>Demonstration Account:</strong>
            <div>Email: <code>citizen.demo@smartcitizen.gov</code></div>
            <div>Password: <code>Citizen@2026</code></div>
          </div>

          <div className="auth-footer-prompt">
            New to Smart Citizen? <Link to="/citizen/register">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenLoginPage;
