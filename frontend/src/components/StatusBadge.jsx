import React from 'react';
import { Clock, Loader2, CheckCircle2 } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  switch (status) {
    case 'SUBMITTED':
      return (
        <span className="badge badge-submitted">
          <Clock size={12} />
          Submitted
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
    default:
      return <span className="badge">{status || 'Unknown'}</span>;
  }
};

export default StatusBadge;
