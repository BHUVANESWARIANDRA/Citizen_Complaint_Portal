import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Edit3,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2
} from 'lucide-react';
import StatCards from './StatCards';
import StatusBadge from './StatusBadge';
import CategoryBadge, { CATEGORY_DEFINITIONS } from './CategoryBadge';
import { AdminEditModal, AdminDeleteModal } from './AdminModal';

export const AdminView = ({
  complaints,
  stats,
  loading,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  onRefresh,
  onUpdateStatus,
  onDeleteComplaint,
}) => {
  const [selectedForEdit, setSelectedForEdit] = useState(null);
  const [selectedForDelete, setSelectedForDelete] = useState(null);

  const filterTabs = [
    { key: 'ALL', label: 'All Grievances' },
    { key: 'SUBMITTED', label: 'Submitted (New)' },
    { key: 'IN_PROGRESS', label: 'In Progress (Active)' },
    { key: 'RESOLVED', label: 'Resolved (Closed)' },
  ];

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      {/* Demo Administrator Banner */}
      <div className="alert alert-info" style={{ alignItems: 'flex-start' }}>
        <Info size={22} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.2rem' }}>
            Administrator Portal (Demonstration Mode)
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            This portal demonstrates full administrative workflow: viewing all public complaints, updating resolution status, publishing official remarks, and performing deletions. For educational lab demonstration, authentication is open. In enterprise deployments, secure these endpoints with Spring Security OAuth2/JWT.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)' }}>
            Civic Operations & Grievance Dispatch
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
            Supervise incoming citizen complaints, dispatch maintenance engineers, and publish status updates.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Admin Statistics */}
      <StatCards
        stats={stats}
        activeFilter={statusFilter}
        onSelectFilter={(k) => setStatusFilter(k)}
      />

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search complaints by ID, title, locality, or citizen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--slate-500)" />
          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '180px' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            {CATEGORY_DEFINITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-pills">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              className={`filter-pill ${statusFilter === tab.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Admin Table View */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-800)' }}>
            Grievances Master Registry
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
            Total <strong>{complaints.length}</strong> matching records
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem auto', color: 'var(--primary-600)' }} />
            <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem' }}>Loading complaints data...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--slate-500)' }}>
            <AlertTriangle size={36} style={{ margin: '0 auto 0.75rem auto', color: 'var(--slate-400)' }} />
            <p>No complaints match the selected filter criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>Category</th>
                  <th>Grievance Title & Location</th>
                  <th>Status</th>
                  <th>Citizen Contact</th>
                  <th>Admin Remark</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.complaintId}>
                    <td>
                      <span className="complaint-id">{c.complaintId}</span>
                    </td>
                    <td>
                      <CategoryBadge category={c.category} displayName={c.categoryDisplayName} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{c.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
                        📍 {c.location}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>
                      <div style={{ fontSize: '0.825rem' }}>{c.citizenName || 'Anonymous'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                        {c.citizenEmail || c.citizenPhone || '—'}
                      </div>
                    </td>
                    <td style={{ maxWidth: '240px' }}>
                      {c.adminRemark ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--slate-700)', background: '#eff6ff', padding: '0.35rem 0.6rem', borderRadius: '4px' }}>
                          {c.adminRemark.length > 70 ? `${c.adminRemark.slice(0, 70)}...` : c.adminRemark}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontStyle: 'italic' }}>
                          No remarks added
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedForEdit(c)}
                          title="Update Status & Remark"
                        >
                          <Edit3 size={13} />
                          <span>Update</span>
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setSelectedForDelete(c)}
                          title="Delete Grievance Record"
                        >
                          <Trash2 size={13} />
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

      {/* Admin Action Modals */}
      <AdminEditModal
        complaint={selectedForEdit}
        isOpen={!!selectedForEdit}
        onClose={() => setSelectedForEdit(null)}
        onSave={onUpdateStatus}
      />

      <AdminDeleteModal
        complaint={selectedForDelete}
        isOpen={!!selectedForDelete}
        onClose={() => setSelectedForDelete(null)}
        onConfirm={onDeleteComplaint}
      />
    </div>
  );
};

export default AdminView;
