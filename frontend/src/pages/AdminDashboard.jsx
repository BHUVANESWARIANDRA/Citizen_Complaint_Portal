import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Edit3,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle2,
  Calendar,
  MapPin,
  User,
  Clock,
  Building2,
  History,
  Bell,
  BellRing,
  Check,
  CheckCheck
} from 'lucide-react';
import { useRouter } from '../router/Router';
import { useAuth } from '../context/AuthContext';
import { ComplaintService, NotificationService } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryBadge, CATEGORY_DEFINITIONS } from '../components/CategoryBadge';

export const AdminDashboard = () => {
  const { navigate, currentPath } = useRouter();
  const { user, isAuthenticated, isOfficer, isAdmin, loading: authLoading } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    totalComplaints: 0,
    submittedCount: 0,
    underReviewCount: 0,
    inProgressCount: 0,
    resolvedCount: 0,
    rejectedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Notifications State (Section 5)
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Modals
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [editStatusModalComplaint, setEditStatusModalComplaint] = useState(null);
  const [deleteModalComplaint, setDeleteModalComplaint] = useState(null);

  // Form states for status update
  const [newStatus, setNewStatus] = useState('IN_PROGRESS');
  const [adminRemark, setAdminRemark] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Keep the administrator route restricted to administrators.
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate(currentPath === '/admin/dashboard' ? '/admin/login' : '/officer/login');
    } else if (currentPath === '/admin/dashboard' && !isAdmin) {
      navigate(isOfficer ? '/officer/dashboard' : '/citizen/dashboard');
    } else if (!isOfficer) {
      navigate('/citizen/dashboard');
    }
  }, [authLoading, currentPath, isAuthenticated, isAdmin, isOfficer, navigate]);

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [listData, statsData] = await Promise.all([
        ComplaintService.getAll({
          category: categoryFilter || undefined,
          status: statusFilter || undefined,
          search: search || undefined,
        }),
        ComplaintService.getStats(),
      ]);
      setComplaints(listData);
      setStats(statsData);
      setSelectedComplaint((prev) => {
        if (!prev) return null;
        const updated = listData.find((c) => c.complaintId === prev.complaintId);
        return updated || prev;
      });
    } catch (err) {
      if (showLoading) {
        const msg = err.response?.data?.message || err.message || 'Failed to fetch admin console data.';
        setError(msg);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const data = await NotificationService.getAll();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.warn('Could not load officer notifications:', err);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && isOfficer) {
      loadData(true);
      loadNotifications();

      // Section 4 & 5: Polling for real-time status updates and notifications
      const timer = setInterval(() => {
        loadData(false);
        loadNotifications();
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [authLoading, categoryFilter, statusFilter, isAuthenticated, isOfficer]);

  const handleMarkNotificationRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await NotificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.warn('Could not mark notification as read:', err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Could not mark all notifications as read:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const openStatusModal = (complaint) => {
    setEditStatusModalComplaint(complaint);
    setNewStatus(complaint.status === 'SUBMITTED' ? 'PENDING' : complaint.status);
    setAdminRemark(complaint.adminRemark || '');
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!editStatusModalComplaint) return;

    setSavingStatus(true);
    try {
      await ComplaintService.updateStatus(editStatusModalComplaint.complaintId, {
        status: newStatus,
        adminRemark: adminRemark.trim(),
      });

      setFeedbackMessage(`Complaint ${editStatusModalComplaint.complaintId} status updated to ${newStatus}.`);
      setEditStatusModalComplaint(null);
      await loadData();
      setTimeout(() => setFeedbackMessage(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update complaint status.';
      alert('Error updating status: ' + msg);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModalComplaint) return;
    setDeleting(true);
    try {
      await ComplaintService.delete(deleteModalComplaint.complaintId);
      setFeedbackMessage(`Complaint ${deleteModalComplaint.complaintId} deleted successfully.`);
      setDeleteModalComplaint(null);
      await loadData();
      setTimeout(() => setFeedbackMessage(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete complaint.';
      alert('Error: ' + msg);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
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
    <div className="admin-dashboard">
      <div className="container">
        {/* Admin Header with Notification Bell */}
        <div className="admin-console-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="header-badge">
              <ShieldCheck size={18} />
              <span>Municipal Officer Console</span>
            </div>
            <h2>Grievance Management & Dispatch</h2>
            <p>
              Welcome, <strong>{user?.name || 'Officer'}</strong>. Review citizen submissions, update field work status, and log municipal inspection remarks.
            </p>
          </div>

          <button
            className="btn btn-outline"
            style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', backgroundColor: '#fff', border: '1px solid #cbd5e1', cursor: 'pointer' }}
            onClick={() => setShowNotificationsModal(true)}
            title="View Officer Notifications"
          >
            <Bell size={20} style={{ color: unreadCount > 0 ? '#0284c7' : '#64748b' }} />
            <span>Notifications</span>
            {unreadCount > 0 ? (
              <span style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: '0.75rem', fontWeight: 700, borderRadius: '9999px', padding: '2px 8px' }}>
                {unreadCount}
              </span>
            ) : (
              <span style={{ backgroundColor: '#e2e8f0', color: '#475569', fontSize: '0.75rem', borderRadius: '9999px', padding: '2px 6px' }}>
                0
              </span>
            )}
          </button>
        </div>

        {/* Real-time Aggregate Metric Cards */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card total">
            <div className="stat-title">Total Registered</div>
            <div className="stat-value">{stats.totalComplaints}</div>
            <div className="stat-sub">All-time complaints</div>
          </div>

          <div className="admin-stat-card submitted">
            <div className="stat-title">Submitted</div>
            <div className="stat-value">{stats.submittedCount}</div>
            <div className="stat-sub">New uninspected cases</div>
          </div>

          <div className="admin-stat-card under-review">
            <div className="stat-title">Under Review</div>
            <div className="stat-value">{stats.underReviewCount}</div>
            <div className="stat-sub">Division verification</div>
          </div>

          <div className="admin-stat-card in-progress">
            <div className="stat-title">In Progress</div>
            <div className="stat-value">{stats.inProgressCount}</div>
            <div className="stat-sub">Field crew dispatched</div>
          </div>

          <div className="admin-stat-card resolved">
            <div className="stat-title">Resolved</div>
            <div className="stat-value">{stats.resolvedCount}</div>
            <div className="stat-sub">Repairs confirmed</div>
          </div>

          <div className="admin-stat-card rejected">
            <div className="stat-title">Rejected</div>
            <div className="stat-value">{stats.rejectedCount}</div>
            <div className="stat-sub">Invalid or duplicates</div>
          </div>
        </div>

        {feedbackMessage && (
          <div className="alert alert-success mb-4">
            <CheckCircle2 size={18} />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger mb-4">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Filter and Search Controls */}
        <div className="dashboard-controls-card">
          <form onSubmit={handleSearchSubmit} className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by ID, citizen name, location, or problem keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

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

            <button className="btn btn-outline btn-icon" onClick={loadData} title="Refresh records">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Management Table */}
        <div className="admin-table-card">
          <div className="table-header-row">
            <h3>Registered Civic Complaints ({complaints.length})</h3>
          </div>

          {loading ? (
            <div className="loading-state">
              <RefreshCw size={24} className="spin-icon" />
              <p>Fetching complaints from persistent H2 database...</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="empty-state-card">
              <p>No complaints match the selected filter criteria.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Complaint ID</th>
                    <th>Title & Description</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Citizen Details</th>
                    <th>Status</th>
                    <th>Reported Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((item) => (
                    <tr key={item.id}>
                      <td className="font-mono font-bold text-primary">{item.complaintId}</td>
                      <td>
                        <div className="table-title">{item.title}</div>
                        <div className="table-desc-snippet">
                          {item.description.length > 80
                            ? item.description.substring(0, 80) + '...'
                            : item.description}
                        </div>
                      </td>
                      <td>
                        <CategoryBadge category={item.category} displayName={item.categoryDisplayName} />
                      </td>
                      <td>
                        <div className="table-location">
                          <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />
                          {item.location}
                        </div>
                      </td>
                      <td>
                        <div className="citizen-info">
                          <div><strong>{item.citizenName || 'Anonymous'}</strong></div>
                          {item.citizenEmail && <div className="text-muted text-sm">{item.citizenEmail}</div>}
                          {item.citizenPhone && <div className="text-muted text-sm">{item.citizenPhone}</div>}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="text-sm text-muted">{formatDate(item.createdAt)}</td>
                      <td>
                        <div className="action-buttons-cell">
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => setSelectedComplaint(item)}
                            title="Inspect details & timeline"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => openStatusModal(item)}
                            title="Update status & remarks"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => setDeleteModalComplaint(item)}
                            title="Delete complaint"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Update Status Modal */}
        {editStatusModalComplaint && (
          <div className="modal-backdrop" onClick={() => setEditStatusModalComplaint(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Update Complaint Status</h3>
                <button className="close-btn" onClick={() => setEditStatusModalComplaint(null)}>
                  ×
                </button>
              </div>

              <form onSubmit={handleStatusUpdate}>
                <div className="modal-body">
                  <div className="complaint-summary-chip">
                    <strong>{editStatusModalComplaint.complaintId}:</strong> {editStatusModalComplaint.title}
                  </div>

                  <div className="form-group mt-3">
                    <label htmlFor="newStatus">
                      Select New Status <span className="req">*</span>
                    </label>
                    <select
                      id="newStatus"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="form-control"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="adminRemark">
                      Official Municipal Remarks / Inspection Notes <span className="req">*</span>
                    </label>
                    <textarea
                      id="adminRemark"
                      rows={4}
                      placeholder="e.g. Inspected by Junior Engineer. Tenders issued for road repair work."
                      value={adminRemark}
                      onChange={(e) => setAdminRemark(e.target.value)}
                      className="form-control"
                      required
                    />
                    <span className="field-hint">
                      This note will be visible to the citizen and logged permanently in the case audit trail.
                    </span>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setEditStatusModalComplaint(null)}
                    disabled={savingStatus}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={savingStatus}>
                    {savingStatus ? 'Applying Update...' : 'Confirm & Save Status'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalComplaint && (
          <div className="modal-backdrop" onClick={() => setDeleteModalComplaint(null)}>
            <div className="modal-content modal-confirm" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Confirm Deletion</h3>
                <button className="close-btn" onClick={() => setDeleteModalComplaint(null)}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to permanently delete complaint{' '}
                  <strong>{deleteModalComplaint.complaintId}</strong> ("{deleteModalComplaint.title}")?
                </p>
                <div className="alert alert-danger mt-3">
                  This action cannot be undone and will remove the record and its audit history from the municipal database.
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setDeleteModalComplaint(null)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete Record'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Details & Audit Timeline Modal */}
        {selectedComplaint && (
          <div className="modal-backdrop" onClick={() => setSelectedComplaint(null)}>
            <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
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
                    <span className="info-label">Citizen Name</span>
                    <span className="info-val">{selectedComplaint.citizenName || 'Anonymous'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Citizen Email</span>
                    <span className="info-val">{selectedComplaint.citizenEmail || 'Not provided'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Citizen Phone</span>
                    <span className="info-val">{selectedComplaint.citizenPhone || 'Not provided'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Submitted At</span>
                    <span className="info-val">{formatDate(selectedComplaint.createdAt)}</span>
                  </div>
                </div>

                <div className="modal-section">
                  <h4>Citizen Description</h4>
                  <p className="modal-text">{selectedComplaint.description}</p>
                </div>

                {selectedComplaint.photo && (
                  <div className="modal-section">
                    <h4>Attached Photo Evidence</h4>
                    <div style={{ marginTop: '8px' }}>
                      <img
                        src={selectedComplaint.photo}
                        alt="Complaint evidence"
                        style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>
                )}

                {selectedComplaint.adminRemark && (
                  <div className="modal-section remarks-box">
                    <h4>Current Administrative Remark</h4>
                    <p>{selectedComplaint.adminRemark}</p>
                  </div>
                )}

                <div className="modal-section">
                  <h4>Complete Status History & Audit Trail</h4>
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
                            {log.updatedBy && <div className="timeline-actor">Logged by: {log.updatedBy}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No additional status audit logs recorded.</p>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setSelectedComplaint(null)}>
                  Close
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const comp = selectedComplaint;
                    setSelectedComplaint(null);
                    openStatusModal(comp);
                  }}
                >
                  <Edit3 size={15} />
                  <span>Update Status</span>
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Officer Notifications Modal (Section 5) */}
        {showNotificationsModal && (
          <div className="modal-backdrop" onClick={() => setShowNotificationsModal(false)}>
            <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={22} className="text-primary" />
                  <h3>Officer Notifications ({unreadCount} unread)</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {unreadCount > 0 && (
                    <button className="btn btn-sm btn-outline" onClick={handleMarkAllNotificationsRead}>
                      <CheckCheck size={14} />
                      <span>Mark all as read</span>
                    </button>
                  )}
                  <button className="close-btn" onClick={() => setShowNotificationsModal(false)}>
                    ×
                  </button>
                </div>
              </div>

              <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div className="empty-state-card" style={{ padding: '2rem 1rem' }}>
                    <p className="text-muted">No notifications recorded yet. New citizen complaints will appear here.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: n.isRead ? '1px solid #e2e8f0' : '1px solid #3b82f6',
                          backgroundColor: n.isRead ? '#f8fafc' : '#eff6ff',
                          gap: '12px',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0284c7' }}>
                              {n.complaintId}
                            </span>
                            {!n.isRead ? (
                              <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#ef4444', color: '#fff', fontWeight: 600 }}>
                                UNREAD
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#e2e8f0', color: '#64748b' }}>
                                READ
                              </span>
                            )}
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              {formatDate(n.createdAt)}
                            </span>
                          </div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{n.title}</div>
                          {n.citizenName && (
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                              Submitted by: <strong>{n.citizenName}</strong>
                            </div>
                          )}
                        </div>

                        <div>
                          {!n.isRead && (
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={(e) => handleMarkNotificationRead(n.id, e)}
                              title="Mark as read"
                            >
                              <Check size={14} />
                              <span>Mark Read</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowNotificationsModal(false)}>
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

export const OfficerDashboard = AdminDashboard;
export default AdminDashboard;
