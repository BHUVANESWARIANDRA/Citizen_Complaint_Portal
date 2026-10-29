import React, { useState } from 'react';
import { ShieldCheck, Mail, Phone, Lock, ArrowRight, AlertCircle, CheckCircle2, KeyRound, User } from 'lucide-react';
import { useRouter, Link } from '../router/Router';
import { useAuth } from '../context/AuthContext';

export const AdminRegisterPage = () => {
  const { navigate } = useRouter();
  const { provisionAdmin, isAdmin } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    setupKey: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      errs.email = 'Official email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    if (!isAdmin && !formData.setupKey.trim()) {
      errs.setupKey = 'Administrator setup key is required for authorization';
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
      await provisionAdmin(
        {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        },
        isAdmin ? '' : formData.setupKey.trim()
      );

      setSuccessMessage('Administrator account provisioned successfully! Launching console...');
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 1000);
    } catch (err) {
      const msg = err.response?.data?.message
        || (err.response?.status === 403
          ? 'Provisioning was not authorized. Verify the key provided by your administrator or sign in with an administrator account.'
          : 'Unable to provision the administrator account right now. Please try again.');
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
              <KeyRound size={28} />
            </div>
            <h2>Administrator Provisioning</h2>
            <p>Protected enrollment for verified municipal supervisors and system admins.</p>
          </div>

          <div className="admin-notice-banner warning">
            <ShieldCheck size={16} />
            <span>Server authorization key verification required</span>
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
              <label htmlFor="name">
                Administrator Name <span className="req">*</span>
              </label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="e.g. Ward Officer Sharma"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'input-error' : ''}
                  disabled={submitting}
                />
              </div>
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Official Email Address <span className="req">*</span>
              </label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="e.g. sharma@smartcitizen.gov"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'input-error' : ''}
                  disabled={submitting}
                />
              </div>
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Official Contact Phone</label>
              <div className="input-with-icon">
                <Phone size={18} className="input-icon" />
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  placeholder="e.g. 9845012345"
                  value={formData.phone}
                  onChange={handleChange}
                  className={errors.phone ? 'input-error' : ''}
                  disabled={submitting}
                />
              </div>
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Password <span className="req">*</span>
              </label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'input-error' : ''}
                  disabled={submitting}
                />
              </div>
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm Password <span className="req">*</span>
              </label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'input-error' : ''}
                  disabled={submitting}
                />
              </div>
              {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
            </div>

            {!isAdmin && <div className="form-group">
              <label htmlFor="setupKey">
                Server Administrator Setup Key <span className="req">*</span>
              </label>
              <div className="input-with-icon">
                <KeyRound size={18} className="input-icon" />
                <input
                  id="setupKey"
                  type="password"
                  name="setupKey"
                  placeholder="Enter ADMIN_PROVISION_KEY"
                  value={formData.setupKey}
                  onChange={handleChange}
                  className={errors.setupKey ? 'input-error' : ''}
                  disabled={submitting}
                />
              </div>
              <span className="field-hint">
                Configured only in the server environment and provided by the system administrator.
              </span>
              {errors.setupKey && <span className="field-error">{errors.setupKey}</span>}
            </div>}

            <button type="submit" className="btn btn-admin w-full" disabled={submitting}>
              {submitting ? 'Verifying Authorization...' : 'Provision Administrator Account'}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="auth-footer-prompt">
            Already have an administrator account? <Link to="/admin/login">Sign in here</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRegisterPage;
