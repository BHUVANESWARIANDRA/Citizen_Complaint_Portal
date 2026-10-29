import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { useRouter, Link } from '../router/Router';
import { useAuth } from '../context/AuthContext';

export const AdminLoginPage = () => {
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

      if (response.role !== 'ROLE_ADMIN') {
        logout();
        setApiError('Access denied. This portal is restricted to authorized municipal administrators.');
        return;
      }

      setSuccessMessage('Administrator authentication verified. Launching console...');
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 700);
    } catch (err) {
      const msg = err.response?.status === 401
        ? 'Sign-in failed. Check your administrator email and password.'
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
            <h2>Municipal Officer Portal</h2>
            <p>Authorized access for ward engineers, sanitation supervisors, and civic officials.</p>
          </div>

          <div className="admin-notice-banner">
            <ShieldCheck size={16} />
            <span>Administrative Access Control Enforced</span>
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
              <label htmlFor="email">Official Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
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
              <label htmlFor="password">Administrator Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Enter administrator password"
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
              {submitting ? 'Verifying Credentials...' : 'Sign In to Console'}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="demo-hint-box admin-hint">
            <strong>Demonstration Administrator:</strong>
            <div>Email: <code>admin.civic@smartcitizen.gov</code></div>
            <div>Password: <code>Admin@2026</code></div>
          </div>

          <div className="auth-footer-prompt">
            Need to provision a new administrator?{' '}
            <Link to="/admin/register" className="admin-link">
              <KeyRound size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> Provision with Setup Key
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
