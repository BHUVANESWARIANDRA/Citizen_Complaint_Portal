import React, { useState } from 'react';
import {
  X,
  Send,
  AlertCircle,
  CheckCircle2,
  Copy,
  Building2,
  MapPin,
  FileText,
  User,
  Mail,
  Phone,
  ArrowRight
} from 'lucide-react';
import { ComplaintService } from '../services/api';
import { CATEGORY_DEFINITIONS } from './CategoryBadge';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../router/Router';

export const SubmitComplaintModal = ({ isOpen, onClose, onComplaintSubmitted }) => {
  const { user, isAuthenticated } = useAuth();
  const { navigate } = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    category: 'ROADS_AND_POTHOLES',
    description: '',
    location: '',
    citizenName: user?.name || '',
    citizenEmail: user?.email || '',
    citizenPhone: user?.phone || '',
    photo: '',
  });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Photo must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [submittedComplaint, setSubmittedComplaint] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) {
      errs.title = 'Complaint title is required';
    } else if (formData.title.trim().length < 5) {
      errs.title = 'Title must be at least 5 characters long';
    }

    if (!formData.category) {
      errs.category = 'Please select a complaint category';
    }

    if (!formData.description.trim()) {
      errs.description = 'Problem description is required';
    } else if (formData.description.trim().length < 10) {
      errs.description = 'Please provide at least 10 characters describing the issue';
    }

    if (!formData.location.trim()) {
      errs.location = 'Location or street address is required';
    }

    if (formData.citizenEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.citizenEmail.trim())) {
      errs.citizenEmail = 'Please enter a valid email address';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await ComplaintService.create({
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim(),
        location: formData.location.trim(),
        citizenName: formData.citizenName.trim() || undefined,
        citizenEmail: formData.citizenEmail.trim() || undefined,
        citizenPhone: formData.citizenPhone.trim() || undefined,
        photo: formData.photo || undefined,
      });

      setSubmittedComplaint(response);
      if (onComplaintSubmitted) {
        onComplaintSubmitted(response);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit complaint. Please try again.';
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (submittedComplaint?.complaintId) {
      navigator.clipboard.writeText(submittedComplaint.complaintId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedComplaint(null);
    setFormData({
      title: '',
      category: 'ROADS_AND_POTHOLES',
      description: '',
      location: '',
      citizenName: user?.name || '',
      citizenEmail: user?.email || '',
      citizenPhone: user?.phone || '',
      photo: '',
    });
    setErrors({});
    setApiError('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleResetAndClose}>
      <div className="modal-content submission-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Building2 size={22} className="modal-icon" />
            <h3>{submittedComplaint ? 'Complaint Submitted Successfully' : 'Report a Civic Issue'}</h3>
          </div>
          <button className="close-btn" onClick={handleResetAndClose}>
            ×
          </button>
        </div>

        {submittedComplaint ? (
          /* Success Screen */
          <div className="modal-body success-body">
            <div className="success-icon-wrap">
              <CheckCircle2 size={56} className="text-emerald" />
            </div>

            <h3>Grievance Registered Successfully</h3>
            <p className="success-sub">
              Your issue has been assigned a municipal tracking reference ID and routed to the respective civic division.
            </p>

            <div className="success-ref-card">
              <span className="ref-card-label">Your Tracking Reference Number</span>
              <div className="ref-card-number">
                <span>{submittedComplaint.complaintId}</span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline copy-btn"
                  onClick={handleCopyId}
                  title="Copy Reference ID"
                >
                  <Copy size={16} />
                  <span>{copied ? 'Copied!' : 'Copy ID'}</span>
                </button>
              </div>
            </div>

            <div className="success-details-summary">
              <div><strong>Title:</strong> {submittedComplaint.title}</div>
              <div><strong>Category:</strong> {submittedComplaint.categoryDisplayName || submittedComplaint.category}</div>
              <div><strong>Location:</strong> {submittedComplaint.location}</div>
            </div>

            <div className="modal-footer success-footer">
              <button
                className="btn btn-outline"
                onClick={() => {
                  handleResetAndClose();
                  navigate('/track');
                }}
              >
                Go to Track Page
              </button>
              <button className="btn btn-primary" onClick={handleResetAndClose}>
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Submission Form */
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body">
              {apiError && (
                <div className="alert alert-danger mb-3">
                  <AlertCircle size={18} />
                  <span>{apiError}</span>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="title">
                  Complaint Title <span className="req">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  placeholder="e.g. Deep pothole on 4th Main Road near City Hospital"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={errors.title ? 'input-error' : ''}
                  disabled={submitting}
                />
                {errors.title && <span className="field-error">{errors.title}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="category">
                  Civic Category <span className="req">*</span>
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={errors.category ? 'input-error' : ''}
                  disabled={submitting}
                >
                  {CATEGORY_DEFINITIONS.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {errors.category && <span className="field-error">{errors.category}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="location">
                  Exact Location / Street Address <span className="req">*</span>
                </label>
                <div className="input-with-icon">
                  <MapPin size={18} className="input-icon" />
                  <input
                    id="location"
                    type="text"
                    placeholder="e.g. Crossroad 5, near Community Hall, Ward 12"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className={errors.location ? 'input-error' : ''}
                    disabled={submitting}
                  />
                </div>
                {errors.location && <span className="field-error">{errors.location}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="description">
                  Detailed Description <span className="req">*</span>
                </label>
                <textarea
                  id="description"
                  rows={4}
                  placeholder="Provide details about the issue: how long it has persisted, potential hazards, and any relevant landmarks..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={errors.description ? 'input-error' : ''}
                  disabled={submitting}
                />
                {errors.description && <span className="field-error">{errors.description}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="complaintPhoto">
                  Optional Photo Evidence
                </label>
                <input
                  id="complaintPhoto"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  disabled={submitting}
                  className="form-control"
                />
                {formData.photo && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={formData.photo}
                      alt="Complaint preview"
                      style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => setFormData((prev) => ({ ...prev, photo: '' }))}
                    >
                      Remove Photo
                    </button>
                  </div>
                )}
                <span className="field-hint">Attach a photo showing the issue (optional, max 2MB).</span>
              </div>

              <div className="form-sub-divider">
                <span>Citizen Contact Information (Optional)</span>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label htmlFor="citizenName">Full Name</label>
                  <input
                    id="citizenName"
                    type="text"
                    placeholder="Your Name"
                    value={formData.citizenName}
                    onChange={(e) => setFormData({ ...formData, citizenName: e.target.value })}
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="citizenEmail">Email Address</label>
                  <input
                    id="citizenEmail"
                    type="email"
                    placeholder="For tracking verification"
                    value={formData.citizenEmail}
                    onChange={(e) => setFormData({ ...formData, citizenEmail: e.target.value })}
                    className={errors.citizenEmail ? 'input-error' : ''}
                    disabled={submitting}
                  />
                  {errors.citizenEmail && <span className="field-error">{errors.citizenEmail}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="citizenPhone">Phone Number</label>
                  <input
                    id="citizenPhone"
                    type="tel"
                    placeholder="For SMS status updates"
                    value={formData.citizenPhone}
                    onChange={(e) => setFormData({ ...formData, citizenPhone: e.target.value })}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleResetAndClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <Send size={16} />
                <span>{submitting ? 'Submitting Grievance...' : 'Submit Complaint'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SubmitComplaintModal;
