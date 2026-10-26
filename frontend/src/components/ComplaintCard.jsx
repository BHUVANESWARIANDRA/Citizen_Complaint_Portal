import React, { useState } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  User,
  MessageSquare,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit3
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import CategoryBadge from './CategoryBadge';

export const ComplaintCard = ({
  complaint,
  isAdmin = false,
  onEditStatus,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(complaint.complaintId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="complaint-card">
      <div className="complaint-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span className="complaint-id">{complaint.complaintId}</span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleCopyId}
            title="Copy Complaint ID"
            style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}
          >
            {copied ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <CategoryBadge category={complaint.category} displayName={complaint.categoryDisplayName} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <StatusBadge status={complaint.status} />

          {isAdmin && (
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onEditStatus && onEditStatus(complaint)}
                title="Update Status & Remark"
              >
                <Edit3 size={13} />
                <span>Action</span>
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => onDelete && onDelete(complaint)}
                title="Delete Complaint"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="complaint-title">{complaint.title}</h3>

      <div className="complaint-desc">
        {expanded || complaint.description.length <= 160
          ? complaint.description
          : `${complaint.description.slice(0, 160)}...`}
        {complaint.description.length > 160 && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'transparent',
              color: 'var(--primary-600)',
              fontWeight: 600,
              fontSize: '0.85rem',
              marginLeft: '0.5rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem',
            }}
          >
            {expanded ? (
              <>Less <ChevronUp size={14} /></>
            ) : (
              <>More <ChevronDown size={14} /></>
            )}
          </button>
        )}
      </div>

      <div className="complaint-meta-grid">
        <div className="meta-item">
          <MapPin size={15} color="#64748b" />
          <span><strong>Location:</strong> {complaint.location}</span>
        </div>

        <div className="meta-item">
          <Calendar size={15} color="#64748b" />
          <span><strong>Submitted:</strong> {formatDate(complaint.createdAt)}</span>
        </div>

        <div className="meta-item">
          <Clock size={15} color="#64748b" />
          <span><strong>Updated:</strong> {formatDate(complaint.updatedAt)}</span>
        </div>

        {complaint.citizenName && (
          <div className="meta-item">
            <User size={15} color="#64748b" />
            <span><strong>By:</strong> {complaint.citizenName}</span>
          </div>
        )}
      </div>

      {complaint.adminRemark && (
        <div className="admin-remark-box">
          <div className="admin-remark-title">
            <MessageSquare size={15} />
            <span>Administrator Official Remark:</span>
          </div>
          <p style={{ color: 'var(--slate-700)', margin: 0 }}>{complaint.adminRemark}</p>
        </div>
      )}
    </div>
  );
};

export default ComplaintCard;
