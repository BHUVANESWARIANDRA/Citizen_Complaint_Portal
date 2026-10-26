import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import CitizenView from './components/CitizenView';
import AdminView from './components/AdminView';
import DevOpsInfoView from './components/DevOpsInfoView';
import SuccessModal from './components/SuccessModal';
import { ComplaintService } from './services/api';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState('citizen');
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    totalComplaints: 0,
    submittedCount: 0,
    inProgressCount: 0,
    resolvedCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isBackendHealthy, setIsBackendHealthy] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Fetch complaints and stats from the Spring Boot API
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const filters = {};
      if (statusFilter !== 'ALL') filters.status = statusFilter;
      if (categoryFilter !== 'ALL') filters.category = categoryFilter;
      if (searchQuery.trim()) filters.search = searchQuery.trim();

      const [complaintsData, statsData] = await Promise.all([
        ComplaintService.getAll(filters),
        ComplaintService.getStats(),
      ]);

      setComplaints(complaintsData);
      setStats(statsData);
      setIsBackendHealthy(true);
    } catch (err) {
      console.warn('Backend connection issue:', err.message);
      setIsBackendHealthy(false);
      // Fallback empty list if backend not yet running
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [statusFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Periodic health check
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const health = await ComplaintService.getHealth();
        setIsBackendHealthy(health?.status === 'UP');
      } catch {
        setIsBackendHealthy(false);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Submit a new complaint
  const handleSubmitComplaint = async (formData) => {
    const created = await ComplaintService.create(formData);
    setSubmittedComplaint(created);
    showToast('success', `Complaint successfully created with ID: ${created.complaintId}`);
    loadData(true);
  };

  // Update status (Admin)
  const handleUpdateStatus = async (id, updateData) => {
    try {
      const updated = await ComplaintService.updateStatus(id, updateData);
      showToast('success', `Status for ${updated.complaintId} updated to ${updated.status}.`);
      loadData(true);
    } catch (err) {
      showToast('danger', err.response?.data?.message || 'Failed to update complaint status.');
    }
  };

  // Delete complaint (Admin)
  const handleDeleteComplaint = async (id) => {
    try {
      await ComplaintService.delete(id);
      showToast('success', `Complaint ${id} successfully removed from the registry.`);
      loadData(true);
    } catch (err) {
      showToast('danger', err.response?.data?.message || 'Failed to delete complaint.');
    }
  };

  // Track complaint shortcut from modal
  const handleTrackComplaint = (complaintId) => {
    setCurrentTab('citizen');
    setSearchQuery(complaintId);
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    const el = document.getElementById('browse-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isBackendHealthy={isBackendHealthy}
      />

      {/* Global Toast Notification */}
      {toast && (
        <div className="container" style={{ paddingTop: '1rem' }}>
          <div className={`alert alert-${toast.type}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              style={{ background: 'transparent', fontWeight: 'bold', fontSize: '1rem', color: 'inherit' }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Tab Views */}
      <main style={{ flex: 1 }}>
        {currentTab === 'citizen' && (
          <CitizenView
            complaints={complaints}
            stats={stats}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            onRefresh={() => loadData(false)}
            onSubmitComplaint={handleSubmitComplaint}
          />
        )}

        {currentTab === 'admin' && (
          <AdminView
            complaints={complaints}
            stats={stats}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            onRefresh={() => loadData(false)}
            onUpdateStatus={handleUpdateStatus}
            onDeleteComplaint={handleDeleteComplaint}
          />
        )}

        {currentTab === 'devops' && <DevOpsInfoView />}
      </main>

      {/* Complaint Registration Success Modal */}
      <SuccessModal
        complaint={submittedComplaint}
        onClose={() => setSubmittedComplaint(null)}
        onTrack={handleTrackComplaint}
      />

      {/* Municipal Civic Portal Footer */}
      <footer style={{ background: 'white', borderTop: '1px solid var(--slate-200)', padding: '2rem 0', marginTop: '3rem' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--slate-800)', fontSize: '0.95rem' }}>
              Smart Citizen Complaint Management Portal
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
              B.Tech CSE DevOps Lab Project: Continuous Integration and Continuous Delivery
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.825rem', color: 'var(--slate-600)' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => setCurrentTab('citizen')}>Citizen Portal</span>
            <span style={{ cursor: 'pointer' }} onClick={() => setCurrentTab('admin')}>Admin Console</span>
            <span style={{ cursor: 'pointer' }} onClick={() => setCurrentTab('devops')}>DevOps Lab Guide</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
