import React from 'react';
import { Building2, User, ShieldCheck, Terminal, Activity } from 'lucide-react';

export const Navbar = ({ currentTab, onTabChange, isBackendHealthy }) => {
  return (
    <header className="navbar">
      <div className="container">
        <div className="navbar-content">
          <div className="navbar-brand">
            <div className="navbar-logo-icon">
              <Building2 size={22} />
            </div>
            <div>
              <span>Smart Citizen</span>
              <span style={{ fontSize: '0.8rem', display: 'block', color: 'var(--slate-500)', fontWeight: 500 }}>
                Civic Governance & Grievance Portal
              </span>
            </div>
          </div>

          <nav className="nav-links">
            <button
              className={`nav-tab-btn ${currentTab === 'citizen' ? 'active' : ''}`}
              onClick={() => onTabChange('citizen')}
            >
              <User size={16} />
              <span>Citizen Portal</span>
            </button>

            <button
              className={`nav-tab-btn ${currentTab === 'admin' ? 'active' : ''}`}
              onClick={() => onTabChange('admin')}
            >
              <ShieldCheck size={16} />
              <span>Admin Portal</span>
              <span className="admin-tag">Demo</span>
            </button>

            <button
              className={`nav-tab-btn ${currentTab === 'devops' ? 'active' : ''}`}
              onClick={() => onTabChange('devops')}
            >
              <Terminal size={16} />
              <span>DevOps Lab Specs</span>
            </button>

            <div className="system-badge" title="Live status of Spring Boot Backend">
              <div className="pulse-dot" style={{ backgroundColor: isBackendHealthy ? '#10b981' : '#ef4444' }} />
              <span>{isBackendHealthy ? 'API Online' : 'Connecting...'}</span>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
