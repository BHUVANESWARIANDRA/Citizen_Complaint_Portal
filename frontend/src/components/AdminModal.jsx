import React, { useState, useEffect } from 'react';
import { AlertTriangle, Edit3, X, CheckCircle2, Trash2 } from 'lucide-react';

export const AdminEditModal = ({ complaint, isOpen, onClose, onSave }) => {
  const [status, setStatus] = useState('SUBMITTED');
  const [adminRemark, setAdminRemark] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (complaint) {
      setStatus(complaint.status || 'SUBMITTED');
      setAdminRemark(complaint.adminRemark || '');
    }
  }, [complaint]);

  if (!isOpen || !complaint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(complaint.complaintId, { status, adminRemark });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Edit3 size={20} color="var(--primary-600)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)' }}>
              Update Grievance Status & Remark
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', color: 'var(--slate-400)', padding: '0.2rem' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'var(--slate-50)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>
                Grievance
              </div>
              <div style={{ fontWeight: 700, color: 'var(--slate-800)', marginTop: '0.2rem' }}>
                <span className="complaint-id" style={{ marginRight: '0.5rem' }}>{complaint.complaintId}</span>
                {complaint.title}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="status-select">
                Resolution Workflow Status
              </label>
              <select
                id="status-select"
                className="form-control"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={isSaving}
              >
                <option value="SUBMITTED">Submitted (Pending Inspection)</option>
                <option value="IN_PROGRESS">In Progress (Work Order Dispatched)</option>
                <option value="RESOLVED">Resolved (Work Completed & Verified)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="admin-remark">
                Administrator Official Remark / Field Update
              </label>
              <textarea
                id="admin-remark"
                className="form-control"
                rows="4"
                placeholder="e.g. Field inspection completed by Ward Engineer. Road patch-work completed. Repaired verified on site."
                value={adminRemark}
                onChange={(e) => setAdminRemark(e.target.value)}
                disabled={isSaving}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '0.3rem', display: 'block' }}>
                This remark will be visible to citizens tracking this grievance.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              <CheckCircle2 size={16} />
              {isSaving ? 'Updating...' : 'Save & Publish Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AdminDeleteModal = ({ complaint, isOpen, onClose, onConfirm }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !complaint) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(complaint.complaintId);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} color="#dc2626" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#991b1b' }}>
              Confirm Grievance Deletion
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', color: 'var(--slate-400)', padding: '0.2rem' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ textAlign: 'center', padding: '1.75rem 1.5rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
            }}
          >
            <Trash2 size={28} />
          </div>

          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '0.5rem' }}>
            Delete Complaint {complaint.complaintId}?
          </h4>
          <p style={{ color: 'var(--slate-600)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Are you sure you want to permanently delete this complaint titled <strong>"{complaint.title}"</strong>?
            This operation cannot be undone.
          </p>

          <div className="alert alert-warning" style={{ textAlign: 'left', marginBottom: 0 }}>
            <AlertTriangle size={16} />
            <span style={{ fontSize: '0.8rem' }}>
              B.Tech Lab Note: Real-world audit compliance records soft-delete records. This endpoint performs hard delete for testing.
            </span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={isDeleting}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 size={16} />
            {isDeleting ? 'Deleting...' : 'Yes, Delete Grievance'}
          </button>
        </div>
      </div>
    </div>
  );
};
