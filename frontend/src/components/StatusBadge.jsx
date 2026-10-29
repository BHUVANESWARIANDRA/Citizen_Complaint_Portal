import React from 'react';
import { Clock, Eye, Loader2, CheckCircle2, XCircle } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  switch (status) {
    case 'PENDING':
      return (
        <span className="badge badge-submitted">
          <Clock size={12} />
          Pending
        </span>
      );
    case 'SUBMITTED':
      return (
        <span className="badge badge-submitted">
          <Clock size={12} />
          Submitted
        </span>
      );
    case 'UNDER_REVIEW':
      return (
        <span className="badge badge-under-review">
          <Eye size={12} />
          Under Review
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="badge badge-in-progress">
          <Loader2 size={12} />
          In Progress
        </span>
      );
    case 'RESOLVED':
      return (
        <span className="badge badge-resolved">
          <CheckCircle2 size={12} />
          Resolved
        </span>
      );
    case 'REJECTED':
      return (
        <span className="badge badge-rejected">
          <XCircle size={12} />
          Rejected
        </span>
      );
    default:
      return <span className="badge">{status || 'Unknown'}</span>;
  }
};

export default StatusBadge;
