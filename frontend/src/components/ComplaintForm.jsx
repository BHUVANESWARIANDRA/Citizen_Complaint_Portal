import React, { useState } from 'react';
import { Send, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { CATEGORY_DEFINITIONS } from './CategoryBadge';

export const ComplaintForm = ({ onSubmitSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'ROADS_AND_POTHOLES',
    description: '',
    location: '',
    citizenName: '',
    citizenEmail: '',
    citizenPhone: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required.';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters.';
    } else if (formData.title.trim().length > 150) {
      newErrors.title = 'Title must not exceed 150 characters.';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a complaint category.';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required.';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters.';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location or street address is required.';
    }

    if (formData.citizenEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.citizenEmail.trim())) {
        newErrors.citizenEmail = 'Please provide a valid email address.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleReset = () => {
    setFormData({
      title: '',
      category: 'ROADS_AND_POTHOLES',
      description: '',
      location: '',
      citizenName: '',
      citizenEmail: '',
      citizenPhone: '',
    });
    setErrors({});
    setServerError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim(),
        location: formData.location.trim(),
        citizenName: formData.citizenName.trim() || null,
        citizenEmail: formData.citizenEmail.trim() || null,
        citizenPhone: formData.citizenPhone.trim() || null,
      };

      await onSubmitSuccess(payload);
      handleReset();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit complaint. Please ensure backend is running.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card" id="submit-section">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
        <div style={{ background: 'var(--primary-100)', color: 'var(--primary-700)', padding: '0.4rem', borderRadius: '8px' }}>
          <Send size={20} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--slate-900)' }}>
            Submit a Civic Grievance
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
            Report issues regarding municipal services. You will receive an instant tracking ID.
          </p>
        </div>
      </div>

      {serverError && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="title">
              Complaint Title <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              className={`form-control ${errors.title ? 'error' : ''}`}
              placeholder="e.g. Broken Water Pipe Causing Overflow on Main Road"
              value={formData.title}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {errors.title && <div className="error-text">{errors.title}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="category">
              Civic Category <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              id="category"
              name="category"
              className={`form-control ${errors.category ? 'error' : ''}`}
              value={formData.category}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              {CATEGORY_DEFINITIONS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            {errors.category && <div className="error-text">{errors.category}</div>}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="description">
            Detailed Description <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows="3"
            className={`form-control ${errors.description ? 'error' : ''}`}
            placeholder="Describe the problem, severity, duration, and any landmarks to help municipal teams identify the site..."
            value={formData.description}
            onChange={handleChange}
            disabled={isSubmitting}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
            {errors.description ? (
              <span className="error-text">{errors.description}</span>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                Minimum 10 characters required.
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
              {formData.description.length} / 2000
            </span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="location">
            Exact Location / Landmark <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            id="location"
            name="location"
            type="text"
            className={`form-control ${errors.location ? 'error' : ''}`}
            placeholder="e.g. Opposite Government High School, 3rd Cross, Ward 15"
            value={formData.location}
            onChange={handleChange}
            disabled={isSubmitting}
          />
          {errors.location && <div className="error-text">{errors.location}</div>}
        </div>

        <div style={{ margin: '1.5rem 0 0.5rem 0' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--slate-600)', marginBottom: '0.75rem' }}>
            Optional Citizen Contact Information (For SMS/Email Updates)
          </h4>
          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label" htmlFor="citizenName">Full Name</label>
              <input
                id="citizenName"
                name="citizenName"
                type="text"
                className="form-control"
                placeholder="Citizen Name"
                value={formData.citizenName}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="citizenEmail">Email Address</label>
              <input
                id="citizenEmail"
                name="citizenEmail"
                type="email"
                className={`form-control ${errors.citizenEmail ? 'error' : ''}`}
                placeholder="name@example.com"
                value={formData.citizenEmail}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.citizenEmail && <div className="error-text">{errors.citizenEmail}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="citizenPhone">Phone Number</label>
              <input
                id="citizenPhone"
                name="citizenPhone"
                type="tel"
                className="form-control"
                placeholder="10-digit mobile number"
                value={formData.citizenPhone}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReset}
            disabled={isSubmitting}
          >
            <RefreshCw size={15} />
            Reset
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            <Send size={15} />
            {isSubmitting ? 'Submitting Grievance...' : 'Submit Complaint'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ComplaintForm;
