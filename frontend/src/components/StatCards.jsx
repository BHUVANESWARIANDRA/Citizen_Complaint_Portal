import React from 'react';
import { FileText, Clock, Loader2, CheckCircle2 } from 'lucide-react';

export const StatCards = ({ stats, activeFilter, onSelectFilter }) => {
  const cards = [
    {
      key: 'ALL',
      label: 'Total Complaints',
      value: stats?.totalComplaints ?? 0,
      icon: FileText,
      color: '#3b82f6',
      bgColor: '#eff6ff',
    },
    {
      key: 'SUBMITTED',
      label: 'Submitted (New)',
      value: stats?.submittedCount ?? 0,
      icon: Clock,
      color: '#d97706',
      bgColor: '#fef3c7',
    },
    {
      key: 'IN_PROGRESS',
      label: 'In Progress (Active)',
      value: stats?.inProgressCount ?? 0,
      icon: Loader2,
      color: '#0284c7',
      bgColor: '#e0f2fe',
    },
    {
      key: 'RESOLVED',
      label: 'Resolved (Closed)',
      value: stats?.resolvedCount ?? 0,
      icon: CheckCircle2,
      color: '#16a34a',
      bgColor: '#dcfce7',
    },
  ];

  return (
    <div className="stats-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.key;
        return (
          <div
            key={card.key}
            className={`stat-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelectFilter && onSelectFilter(card.key)}
            style={{
              cursor: onSelectFilter ? 'pointer' : 'default',
              borderColor: isSelected ? card.color : undefined,
              boxShadow: isSelected ? `0 0 0 2px ${card.color}33` : undefined,
            }}
          >
            <div
              className="stat-icon-wrapper"
              style={{ backgroundColor: card.bgColor, color: card.color }}
            >
              <Icon size={26} />
            </div>
            <div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatCards;
