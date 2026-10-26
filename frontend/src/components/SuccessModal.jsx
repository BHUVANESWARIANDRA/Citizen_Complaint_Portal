import React, { useState } from 'react';
import { CheckCircle2, Copy, Check, ExternalLink, X } from 'lucide-react';

export const SuccessModal = ({ complaint, onClose, onTrack }) => {
  const [copied, setCopied] = useState(false);

  if (!complaint) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(complaint.complaintId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={22} color="#16a34a" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)' }}>
              Complaint Registered
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', color: 'var(--slate-400)', padding: '0.2rem' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '0.5rem' }}>
            Thank You, Citizen!
          </h4>
          <p style={{ color: 'var(--slate-600)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Your complaint has been logged into the municipal database and routed to the respective civic engineering cell.
          </p>

          <div
            style={{
              background: 'var(--slate-50)',
              border: '2px dashed var(--slate-300)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
              Your Unique Tracking ID
            </div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '1.6rem',
                fontWeight: 800,
                color: 'var(--primary-700)',
                margin: '0.5rem 0',
              }}
            >
              {complaint.complaintId}
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleCopy}
              style={{ marginTop: '0.25rem' }}
            >
              {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Complaint ID'}</span>
            </button>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
            Please retain this Complaint ID to search and track progress under the Citizen Portal.
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Submit Another Complaint
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onTrack(complaint.complaintId);
              onClose();
            }}
          >
            <ExternalLink size={16} />
            Track This Complaint
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
