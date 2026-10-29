import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Filter, AlertCircle, FileText, Calendar, MapPin, CheckCircle, RefreshCw, Eye } from 'lucide-react';
import { useRouter } from '../router/Router';
import { useAuth } from '../context/AuthContext';
import { ComplaintService } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryBadge, CATEGORY_DEFINITIONS } from '../components/CategoryBadge';

export const CitizenDashboard = ({ onOpenSubmitModal }) => {
  const { navigate } = useRouter();
  const { user, isAuthenticated, isCitizen, isOfficer, loading: authLoading } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/citizen/login');
    } else if (!isCitizen) {
      navigate(isOfficer ? '/officer/dashboard' : '/');
    }
  }, [authLoading, isAuthenticated, isCitizen, isOfficer, navigate]);

  const loadComplaints = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await ComplaintService.getMy();
      setComplaints(data);
      setSelectedComplaint((prev) => {
        if (!prev) return null;
        const updated = data.find((c) => c.complaintId === prev.complaintId);
        return updated || prev;
      });
    } catch (err) {
      if (showLoading) {
        const msg = err.response?.data?.message || err.message || 'Failed to load your complaints.';
        setError(msg);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isCitizen && !authLoading) {
      loadComplaints(true);
      const interval = setInterval(() => {
        loadComplaints(false);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [authLoading, isAuthenticated, isCitizen]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      !search ||
      c.complaintId.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = !categoryFilter || c.category === categoryFilter;
    const matchesStatus = !statusFilter || c.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="citizen-dashboard">
      <div className="container">
        {/* Welcome Header */}
        <div className="dashboard-welcome-banner">
          <div className="welcome-text">
            <h2>Welcome back, {user?.name || 'Citizen'}</h2>
            <p className="welcome-sub">
              Your Voice. Our Responsibility. Track and manage all municipal complaints submitted from your account.
            </p>
          </div>
          <button className="btn btn-primary btn-large" onClick={onOpenSubmitModal}>
            <PlusCircle size={18} />
            <span>Submit New Complaint</span>
          </button>
        </div>

        {/* Dashboard Filter Bar */}
        <div className="dashboard-controls-card">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by Complaint ID, title, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {CATEGORY_DEFINITIONS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <button className="btn btn-outline btn-icon" onClick={loadComplaints} title="Refresh list">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger mb-4">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Complaints List */}
        <div className="complaints-list-section">
          <div className="section-title-row">
            <h3>My Complaints ({filteredComplaints.length})</h3>
          </div>

          {loading ? (
            <div className="loading-state">
              <RefreshCw size={24} className="spin-icon" />
              <p>Loading your complaints from the municipal server...</p>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-icon-wrap">
                <FileText size={40} />
              </div>
              <h3>No complaints found</h3>
              <p>
                {complaints.length === 0
                  ? "You have not submitted any complaints yet. Use the 'Submit New Complaint' button above to report a public service issue in your neighborhood."
                  : 'No complaints match your active search or filter criteria.'}
              </p>
              {complaints.length === 0 && (
                <button className="btn btn-primary" onClick={onOpenSubmitModal}>
                  <PlusCircle size={16} />
                  <span>Report Your First Issue</span>
                </button>
              )}
            </div>
          ) : (
            <div className="complaint-cards-grid">
              {filteredComplaints.map((item) => (
                <div key={item.id} className="citizen-complaint-card" onClick={() => setSelectedComplaint(item)}>
                  <div className="card-top-row">
                    <span className="card-id">{item.complaintId}</span>
                    <StatusBadge status={item.status} />
                  </div>

                  <h4 className="card-title">{item.title}</h4>

                  <p className="card-desc">
                    {item.description.length > 120
                      ? item.description.substring(0, 120) + '...'
                      : item.description}
                  </p>

                  <div className="card-meta">
                    <CategoryBadge category={item.category} displayName={item.categoryDisplayName} />
                    <span className="meta-loc">
                      <MapPin size={13} />
                      <span>{item.location}</span>
                    </span>
                    <span className="meta-date">
                      <Calendar size={13} />
                      <span>{formatDate(item.createdAt)}</span>
                    </span>
                  </div>

                  {item.adminRemark && (
                    <div className="card-remark-preview">
                      <strong>Official Remark:</strong> {item.adminRemark}
                    </div>
                  )}

                  <div className="card-footer-action">
                    <span>View full details & timeline</span>
                    <Eye size={14} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Complaint Detail Modal */}
        {selectedComplaint && (
          <div className="modal-backdrop" onClick={() => setSelectedComplaint(null)}>
            <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-wrap">
                  <span className="modal-ref">{selectedComplaint.complaintId}</span>
                  <h3>{selectedComplaint.title}</h3>
                </div>
                <button className="close-btn" onClick={() => setSelectedComplaint(null)}>
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-status-bar">
                  <div className="status-label">Current Status:</div>
                  <StatusBadge status={selectedComplaint.status} />
                </div>

                <div className="modal-info-grid">
                  <div className="info-item">
                    <span className="info-label">Category</span>
                    <CategoryBadge
                      category={selectedComplaint.category}
                      displayName={selectedComplaint.categoryDisplayName}
                    />
                  </div>
                  <div className="info-item">
                    <span className="info-label">Location</span>
                    <span className="info-val">{selectedComplaint.location}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Submitted On</span>
                    <span className="info-val">{formatDate(selectedComplaint.createdAt)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Last Updated</span>
                    <span className="info-val">{formatDate(selectedComplaint.updatedAt)}</span>
                  </div>
                </div>

                <div className="modal-section">
                  <h4>Full Problem Description</h4>
                  <p className="modal-text">{selectedComplaint.description}</p>
                </div>

                {selectedComplaint.photo && (
                  <div className="modal-section">
                    <h4>Attached Photo Evidence</h4>
                    <div style={{ marginTop: '8px' }}>
                      <img
                        src={selectedComplaint.photo}
                        alt="Complaint evidence"
                        style={{ maxWidth: '100%', maxHeight: '280px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>
                )}

                {selectedComplaint.adminRemark && (
                  <div className="modal-section remark-section">
                    <h4>Municipal Resolution Remarks</h4>
                    <p className="modal-text">{selectedComplaint.adminRemark}</p>
                  </div>
                )}

                {/* Audit Timeline */}
                <div className="modal-section">
                  <h4>Status Progression & History</h4>
                  {selectedComplaint.auditLogs && selectedComplaint.auditLogs.length > 0 ? (
                    <div className="timeline">
                      {selectedComplaint.auditLogs.map((log, index) => (
                        <div key={log.id || index} className="timeline-item">
                          <div className="timeline-marker">
                            <div className="timeline-dot" />
                            {index < selectedComplaint.auditLogs.length - 1 && <div className="timeline-line" />}
                          </div>
                          <div className="timeline-content">
                            <div className="timeline-header">
                              <StatusBadge status={log.toStatus} />
                              <span className="timeline-date">{formatDate(log.createdAt)}</span>
                            </div>
                            {log.remark && <p className="timeline-remark">{log.remark}</p>}
                            {log.updatedBy && <div className="timeline-actor">By: {log.updatedBy}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No additional status logs recorded yet.</p>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setSelectedComplaint(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenDashboard;
