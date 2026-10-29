import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { useRouter, Link } from '../router/Router';
import { useAuth } from '../context/AuthContext';

export const OfficerLoginPage = () => {
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
      errs.email = 'Official email address is required';
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

      if (response.role !== 'ROLE_ADMIN' && response.role !== 'ROLE_OFFICER') {
        logout();
        setApiError('Access denied. This portal is strictly for authorized municipal officers.');
        return;
      }

      setSuccessMessage('Officer authentication verified. Loading dashboard...');
      setTimeout(() => {
        navigate(response.role === 'ROLE_ADMIN' ? '/admin/dashboard' : '/officer/dashboard');
      }, 700);
    } catch (err) {
      const msg = err.response?.status === 401
        ? 'Sign-in failed. Check your official email and password.'
        : err.response?.data?.message || 'Unable to sign in right now. Please try again.';
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
    <div className="auth-page-wrapper admin-bg">
      <div className="container">
        <div className="auth-card admin-card">
          <div className="auth-header">
            <div className="auth-icon-badge admin">
              <ShieldCheck size={28} />
            </div>
            <h2>Officer Sign In</h2>
            <p>Dedicated access for ward officers, engineers, and municipal authorities.</p>
          </div>

          <div className="admin-notice-banner">
            <ShieldCheck size={16} />
            <span>Authorized Municipal Personnel Only</span>
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
              <label htmlFor="officerEmail">Official Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  id="officerEmail"
                  type="email"
                  name="email"
                  placeholder="e.g. admin.civic@smartcitizen.gov"
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
              <label htmlFor="officerPassword">Officer Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  id="officerPassword"
                  type="password"
                  name="password"
                  placeholder="Enter your officer password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'input-error' : ''}
                  disabled={submitting}
                  autoComplete="current-password"
                />
              </div>
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <button type="submit" className="btn btn-admin w-full" disabled={submitting}>
              {submitting ? 'Verifying Credentials...' : 'Sign In as Officer'}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="demo-hint-box admin-hint">
            <strong>Demonstration Officer Account:</strong>
            <div>Email: <code>officer.demo@smartcitizen.gov</code></div>
            <div>Password: <code>Officer@2026</code></div>
          </div>

          <div className="auth-footer-prompt">
            Need to provision a new officer?{' '}
            <Link to="/officer/register" className="admin-link">
              <KeyRound size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> Provision with Authorization Key
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficerLoginPage;
