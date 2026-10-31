import React, { useState } from 'react';
import { Search, FileText, Calendar, AlertCircle, ArrowLeft } from 'lucide-react';
import { useRouter, Link } from '../router/Router';
import { ComplaintService } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import { useAuth } from '../context/AuthContext';

export const TrackPage = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();

  const [complaintId, setComplaintId] = useState('');
  const [verification, setVerification] = useState(user?.email || user?.phone || '');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setComplaint(null);

    if (!complaintId.trim()) {
      setError('Please enter a valid complaint reference ID (e.g. CMP-2026-10021).');
      return;
    }

    if (!verification.trim()) {
      setError('Please provide your registered email address or mobile number for privacy verification.');
      return;
    }

    setLoading(true);
    try {
      const data = await ComplaintService.track(complaintId.trim(), verification.trim());
      setComplaint(data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Complaint not found or verification mismatch.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="track-page-wrapper">
      <div className="container">
        {/* Header */}
        <div className="track-header">
          <Link to="/" className="back-link">
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>
          <h1>Track Your Civic Complaint</h1>
          <p>
            Enter your unique complaint reference number and registered contact details
            to view the complaint status and public status updates.
          </p>
        </div>

        {/* Search Card */}
        <div className="track-search-card">
          <form onSubmit={handleSearch} className="track-form">
            <div className="track-input-grid">
              <div className="form-group">
                <label htmlFor="complaintId">
                  Complaint Reference ID <span className="req">*</span>
                </label>
                <div className="input-with-icon">
                  <FileText size={18} className="input-icon" />
                  <input
                    id="complaintId"
                    type="text"
                    placeholder="e.g. CMP-2026-10021"
                    value={complaintId}
                    onChange={(e) => setComplaintId(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="verification">
                  Verification Email or Phone <span className="req">*</span>
                </label>
                <div className="input-with-icon">
                  <Search size={18} className="input-icon" />
                  <input
                    id="verification"
                    type="text"
                    placeholder="Registered email or phone number"
                    value={verification}
                    onChange={(e) => setVerification(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary track-submit-btn" disabled={loading}>
              <Search size={18} />
              <span>{loading ? 'Searching Records...' : 'Track Status'}</span>
            </button>
          </form>

          {error && (
            <div className="alert alert-danger mt-4">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Search Result Display */}
        {complaint && (
          <div className="track-result-card">
            <div className="track-result-header">
              <div className="complaint-ref-badge">
                <span className="ref-label">Complaint Reference:</span>
                <span className="ref-id">{complaint.complaintId}</span>
              </div>
              <StatusBadge status={complaint.status} />
            </div>

            <div className="complaint-meta-row">
              <CategoryBadge category={complaint.category} displayName={complaint.categoryDisplayName} />
              <span className="meta-item">
                <Calendar size={14} />
                <span>Reported on {formatDate(complaint.createdAt)}</span>
              </span>
            </div>

            <div className="complaint-section">
              <h4>Problem Description</h4>
              <p className="complaint-desc-text">{complaint.description}</p>
            </div>

            <div className="complaint-section">
              <h4>Public Status Updates</h4>
              {complaint.publicUpdates && complaint.publicUpdates.length > 0 ? (
                <div className="timeline">
                  {complaint.publicUpdates.map((update, index) => (
                    <div key={`${update.status}-${update.updatedAt}-${index}`} className="timeline-item">
                      <div className="timeline-marker">
                        <div className="timeline-dot" />
                        {index < complaint.publicUpdates.length - 1 && <div className="timeline-line" />}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <StatusBadge status={update.status} />
                          <span className="timeline-date">{formatDate(update.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">Current status: {complaint.status}. No public status updates have been recorded.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackPage;
