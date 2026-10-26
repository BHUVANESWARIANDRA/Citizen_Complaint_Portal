import React, { useState } from 'react';
import {
  Search,
  Filter,
  PlusCircle,
  Inbox,
  CheckCircle2,
  RefreshCw,
  Compass
} from 'lucide-react';
import ComplaintForm from './ComplaintForm';
import ComplaintCard from './ComplaintCard';
import StatCards from './StatCards';
import { CATEGORY_DEFINITIONS } from './CategoryBadge';

export const CitizenView = ({
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
  onSubmitComplaint,
}) => {
  const [showForm, setShowForm] = useState(true);

  const filterTabs = [
    { key: 'ALL', label: 'All Grievances' },
    { key: 'SUBMITTED', label: 'Submitted' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'RESOLVED', label: 'Resolved' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div style={{ maxWidth: '750px' }}>
            <span
              style={{
                display: 'inline-block',
                background: 'rgba(255,255,255,0.18)',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                marginBottom: '1rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Public Grievance Redressal System
            </span>
            <h1 className="hero-title">
              Empowering Citizens, Resolving Civic Grievances Faster
            </h1>
            <p className="hero-subtitle">
              Report potholes, water leakages, streetlight failures, or garbage dumps directly to your municipality.
              Track real-time engineering work orders and official resolution remarks.
            </p>
            <div className="hero-actions">
              <button
                className="btn btn-teal"
                onClick={() => {
                  setShowForm(true);
                  const el = document.getElementById('submit-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <PlusCircle size={18} />
                <span>Submit Grievance Now</span>
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const el = document.getElementById('browse-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Search size={18} />
                <span>Search & Track Grievance</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        {/* Quick Stats overview */}
        <StatCards
          stats={stats}
          activeFilter={statusFilter}
          onSelectFilter={(filterKey) => setStatusFilter(filterKey)}
        />

        {/* Form Toggle & Submission Form */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-800)' }}>
              Citizen Grievance Submission
            </h2>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Hide Form' : 'Open Complaint Form'}
            </button>
          </div>

          {showForm && (
            <ComplaintForm onSubmitSuccess={onSubmitComplaint} />
          )}
        </div>

        {/* Browse & Search Section */}
        <div id="browse-section" style={{ marginTop: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                Track Public Grievances
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
                Search by unique Complaint ID (e.g., CMP-2026-XXXXX), locality, or issue keyword.
              </p>
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh list from backend"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="filter-bar">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                className="form-control search-input"
                placeholder="Search by Complaint ID (e.g. CMP-2026-10021), title, or location..."
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

          {/* Active Filter indicator */}
          {(searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--slate-600)' }}>
              <span>Filtering by:</span>
              {searchQuery && (
                <span className="category-tag">Search: "{searchQuery}"</span>
              )}
              {statusFilter !== 'ALL' && (
                <span className="category-tag">Status: {statusFilter}</span>
              )}
              {categoryFilter !== 'ALL' && (
                <span className="category-tag">Category: {categoryFilter}</span>
              )}
              <button
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem' }}
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setCategoryFilter('ALL');
                }}
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Complaints List */}
          {loading ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 1rem auto', color: 'var(--primary-600)' }} />
              <p style={{ color: 'var(--slate-600)' }}>Connecting to civic complaint registry...</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="card empty-state">
              <Inbox className="empty-icon" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '0.4rem' }}>
                No Complaints Found
              </h3>
              <p style={{ maxWidth: '400px', margin: '0 auto 1.25rem auto' }}>
                {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                  ? 'No grievances matched your active search and filter criteria. Try clearing filters.'
                  : 'No complaints logged in the system yet. Be the first to report a civic issue!'}
              </p>
              {(searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL') ? (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setCategoryFilter('ALL');
                  }}
                >
                  Reset Search & Filters
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowForm(true)}
                >
                  <PlusCircle size={15} />
                  Submit Grievance
                </button>
              )}
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--slate-500)' }}>
                <span>Showing <strong>{complaints.length}</strong> grievance records</span>
              </div>

              {complaints.map((c) => (
                <ComplaintCard key={c.complaintId} complaint={c} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CitizenView;
