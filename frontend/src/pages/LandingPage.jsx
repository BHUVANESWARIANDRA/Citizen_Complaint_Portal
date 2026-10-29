import React, { useState, useEffect } from 'react';
import {
  Building2,
  AlertTriangle,
  Droplets,
  Zap,
  Trash2,
  Waves,
  Lightbulb,
  ArrowRight,
  Search,
  CheckCircle,
  Clock,
  ShieldCheck,
  FileText,
  UserCheck,
  User,
  LogIn
} from 'lucide-react';
import { useRouter, Link } from '../router/Router';
import { ComplaintService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const LandingPage = ({ onOpenSubmitModal }) => {
  const { navigate } = useRouter();
  const { isAuthenticated, isCitizen, isOfficer } = useAuth();
  const [stats, setStats] = useState({
    totalComplaints: 0,
    submittedCount: 0,
    underReviewCount: 0,
    inProgressCount: 0,
    resolvedCount: 0,
    rejectedCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await ComplaintService.getStats();
        setStats(data);
      } catch (err) {
        console.warn('Could not fetch real-time complaint statistics:', err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const handleReportClick = () => {
    if (isAuthenticated && isCitizen) {
      if (onOpenSubmitModal) {
        onOpenSubmitModal();
      } else {
        navigate('/citizen/dashboard');
      }
    } else {
      navigate('/citizen/login');
    }
  };

  const categories = [
    {
      title: 'Roads & Potholes',
      desc: 'Cracked tarmac, dangerous potholes, broken dividers, and cave-ins.',
      icon: AlertTriangle,
      color: '#f59e0b',
    },
    {
      title: 'Water Supply',
      desc: 'Pipeline leaks, low pressure, contaminated water, or water supply disruption.',
      icon: Droplets,
      color: '#0284c7',
    },
    {
      title: 'Electricity & Grid',
      desc: 'Transformer sparks, dangling cables, power surges, and frequent outages.',
      icon: Zap,
      color: '#eab308',
    },
    {
      title: 'Sanitation & Garbage',
      desc: 'Overflowing dumpsters, illegal dumping, waste collection delays, and sweepers.',
      icon: Trash2,
      color: '#10b981',
    },
    {
      title: 'Drainage & Sewage',
      desc: 'Blocked monsoon gutters, overflowing manholes, and stagnant waste water.',
      icon: Waves,
      color: '#06b6d4',
    },
    {
      title: 'Streetlights & Safety',
      desc: 'Non-functioning street fixtures, dark pedestrian alleys, and broken poles.',
      icon: Lightbulb,
      color: '#8b5cf6',
    },
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-badge">
            <span className="badge-dot" />
            <span>Smart Citizen Municipal Portal</span>
          </div>

          <h1 className="hero-title">
            Make Your Community <span className="highlight-text">Better.</span>
          </h1>

          <p className="hero-subtitle">
            Report municipal infrastructure issues, monitor real-time repair progress,
            and empower public authorities to resolve community problems faster.
          </p>

          {/* TWO CLEARLY VISIBLE PRIMARY CHOICES: Citizen Login & Officer Login (Section 6) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            maxWidth: '760px',
            margin: '2rem auto 2.5rem auto',
            textAlign: 'left'
          }}>
            {/* Citizen Login Card */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '1.75rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '2px solid #e0f2fe',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.2s',
            }}>
              <div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  backgroundColor: '#e0f2fe',
                  color: '#0284c7',
                  marginBottom: '1rem'
                }}>
                  <User size={26} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                  Citizen Portal
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.25rem' }}>
                  Register and log in to report civic grievances, attach photos, and receive automatic status updates.
                </p>
              </div>

              <div>
                {isAuthenticated && isCitizen ? (
                  <button
                    className="btn btn-primary w-full"
                    onClick={() => navigate('/citizen/dashboard')}
                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                  >
                    <span>Go to My Dashboard</span>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <>
                    <button
                      className="btn btn-primary w-full"
                      onClick={() => navigate('/citizen/login')}
                      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '8px' }}
                    >
                      <LogIn size={16} />
                      <span>Citizen Login</span>
                    </button>
                    <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
                      New citizen? <Link to="/citizen/register" style={{ color: '#0284c7', fontWeight: 600 }}>Create an account</Link>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Officer Login Card */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '1.75rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '2px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.2s',
            }}>
              <div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  marginBottom: '1rem'
                }}>
                  <ShieldCheck size={26} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                  Officer Portal
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.25rem' }}>
                  Dedicated dashboard for municipal officers to inspect complaints, receive notifications, and update progress.
                </p>
              </div>

              <div>
                {isAuthenticated && isOfficer ? (
                  <button
                    className="btn btn-admin w-full"
                    onClick={() => navigate('/officer/dashboard')}
                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                  >
                    <span>Open Officer Console</span>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <>
                    <button
                      className="btn btn-admin w-full"
                      onClick={() => navigate('/officer/login')}
                      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '8px' }}
                    >
                      <ShieldCheck size={16} />
                      <span>Officer Login</span>
                    </button>
                    <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
                      Authorized personnel: <Link to="/officer/register" style={{ color: '#475569', fontWeight: 600 }}>Provision account</Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <button className="btn btn-outline" onClick={() => navigate('/track')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Search size={16} />
              <span>Track Complaint by Reference ID</span>
            </button>
          </div>

          {/* Real Backend Statistics Bar */}
          <div className="hero-stats-banner">
            <div className="stats-header">
              <span className="stats-live-tag">Live Metrics</span>
              <span className="stats-caption">Community Grievances & Resolution Metrics</span>
            </div>

            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">
                  {loadingStats ? '...' : stats.totalComplaints}
                </div>
                <div className="stat-label">Total Complaints Registered</div>
              </div>

              <div className="stat-item">
                <div className="stat-number stat-in-progress">
                  {loadingStats ? '...' : (stats.inProgressCount + stats.underReviewCount)}
                </div>
                <div className="stat-label">Under Active Review & Work</div>
              </div>

              <div className="stat-item">
                <div className="stat-number stat-resolved">
                  {loadingStats ? '...' : stats.resolvedCount}
                </div>
                <div className="stat-label">Civic Issues Resolved</div>
              </div>

              <div className="stat-item">
                <div className="stat-number stat-submitted">
                  {loadingStats ? '...' : stats.submittedCount}
                </div>
                <div className="stat-label">Pending Verification</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Process Explanation */}
      <section className="process-section">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">How It Works</span>
            <h2 className="section-title">Three Steps to a Resolved Complaint</h2>
            <p className="section-subtitle">
              A transparent, streamlined workflow connecting citizens directly with civic engineers.
            </p>
          </div>

          <div className="process-grid">
            <div className="process-card">
              <div className="process-step-num">01</div>
              <div className="process-icon-wrap step-1">
                <FileText size={28} />
              </div>
              <h3 className="process-title">Submit</h3>
              <p className="process-desc">
                Select a category, enter problem details, and attach an optional photo.
                An instant unique reference ID is generated for your records.
              </p>
            </div>

            <div className="process-card">
              <div className="process-step-num">02</div>
              <div className="process-icon-wrap step-2">
                <Clock size={28} />
              </div>
              <h3 className="process-title">Track</h3>
              <p className="process-desc">
                Officers receive notifications, review the issue, and dispatch field crews.
                Status changes update automatically on your citizen dashboard.
              </p>
            </div>

            <div className="process-card">
              <div className="process-step-num">03</div>
              <div className="process-icon-wrap step-3">
                <CheckCircle size={28} />
              </div>
              <h3 className="process-title">Resolve</h3>
              <p className="process-desc">
                The field team completes physical repairs, enters official resolution remarks,
                and marks the issue resolved in the municipal database.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Categories Section */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Public Services</span>
            <h2 className="section-title">What Would You Like to Report?</h2>
            <p className="section-subtitle">
              Dedicated municipal departments address each category with specialized field teams.
            </p>
          </div>

          <div className="categories-grid">
            {categories.map((cat, idx) => {
              const IconComp = cat.icon;
              return (
                <div key={idx} className="category-card" onClick={handleReportClick}>
                  <div className="category-icon" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                    <IconComp size={24} />
                  </div>
                  <h3 className="category-title">{cat.title}</h3>
                  <p className="category-desc">{cat.desc}</p>
                  <div className="category-action">
                    <span>Report issue</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Civic Footer */}
      <footer className="civic-footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo">
                <Building2 size={24} />
                <span>Smart Citizen</span>
              </div>
              <p className="footer-tagline">
                Your Voice. Our Responsibility. Together for cleaner, safer, and better-maintained neighborhoods.
              </p>
            </div>

            <div className="footer-links-col">
              <h4>Citizen Services</h4>
              <ul>
                <li><Link to="/citizen/login">Citizen Login</Link></li>
                <li><Link to="/citizen/register">Register Account</Link></li>
                <li><Link to="/track">Track Complaint</Link></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h4>Officer Services</h4>
              <ul>
                <li><Link to="/officer/login">Officer Sign In</Link></li>
                <li><Link to="/officer/register">Provision Account</Link></li>
                <li><Link to="/officer/dashboard">Officer Dashboard</Link></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h4>Municipal Contacts</h4>
              <ul>
                <li>Emergency Civic Helpline: <strong>1916</strong></li>
                <li>Water Pipeline Control: <strong>1913</strong></li>
                <li>Electricity Breakdown: <strong>1912</strong></li>
                <li>Support: <strong>support@smartcitizen.gov</strong></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Smart Citizen Complaint Management Portal.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
