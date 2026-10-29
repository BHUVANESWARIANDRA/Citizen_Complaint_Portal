import React, { useState } from 'react';
import { Building2, Search, User, ShieldCheck, LogOut, Menu, X, PlusCircle, CheckCircle } from 'lucide-react';
import { useRouter, Link } from '../router/Router';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ onOpenSubmitModal }) => {
  const { currentPath, navigate } = useRouter();
  const { user, isAuthenticated, isOfficer, isCitizen, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="navbar">
      <div className="container">
        <div className="navbar-content">
          {/* Logo & Civic Branding */}
          <Link to="/" className="navbar-brand" onClick={closeMenu}>
            <div className="navbar-logo-icon">
              <Building2 size={24} />
            </div>
            <div className="brand-text">
              <div className="brand-name">Smart Citizen</div>
              <div className="brand-tagline">Your Voice. Our Responsibility.</div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="nav-links desktop-nav">
            <Link
              to="/"
              className={`nav-tab-btn ${currentPath === '/' ? 'active' : ''}`}
            >
              <span>Home</span>
            </Link>

            <Link
              to="/track"
              className={`nav-tab-btn ${currentPath === '/track' ? 'active' : ''}`}
            >
              <Search size={16} />
              <span>Track Complaint</span>
            </Link>

            {/* If authenticated as Citizen */}
            {isAuthenticated && isCitizen && (
              <>
                <Link
                  to="/citizen/dashboard"
                  className={`nav-tab-btn ${currentPath === '/citizen/dashboard' ? 'active' : ''}`}
                >
                  <User size={16} />
                  <span>My Complaints</span>
                </Link>

                {onOpenSubmitModal && (
                  <button className="nav-submit-btn" onClick={onOpenSubmitModal}>
                    <PlusCircle size={16} />
                    <span>Report Issue</span>
                  </button>
                )}

                <div className="nav-user-pill">
                  <span className="user-name">{user?.name || 'Citizen'}</span>
                  <button className="nav-logout-btn" onClick={handleLogout} title="Sign Out">
                    <LogOut size={16} />
                  </button>
                </div>
              </>
            )}

            {/* If authenticated as Admin/Officer */}
            {isAuthenticated && isOfficer && (
              <>
                <Link
                  to="/officer/dashboard"
                  className={`nav-tab-btn ${currentPath === '/officer/dashboard' || currentPath === '/admin/dashboard' ? 'active' : ''}`}
                >
                  <ShieldCheck size={16} />
                  <span>Officer Dashboard</span>
                </Link>

                <div className="nav-user-pill admin">
                  <span className="user-name">{user?.name || 'Officer'}</span>
                  <button className="nav-logout-btn" onClick={handleLogout} title="Sign Out">
                    <LogOut size={16} />
                  </button>
                </div>
              </>
            )}

            {/* If guest / unauthenticated */}
            {!isAuthenticated && (
              <div className="nav-auth-buttons">
                <Link to="/citizen/login" className="btn btn-outline-nav">
                  Citizen Login
                </Link>
                <Link to="/officer/login" className="btn btn-text-nav">
                  Officer Login
                </Link>
                {onOpenSubmitModal && (
                  <button className="btn btn-primary-nav" onClick={onOpenSubmitModal}>
                    <PlusCircle size={15} />
                    <span>Report Issue</span>
                  </button>
                )}
              </div>
            )}

            {/* Civic Commitment Pill */}
            <div className="civic-motto-pill" title="Smart Citizen Civic Service">
              <CheckCircle size={14} className="motto-icon" />
              <span>Report • Track • Resolve</span>
            </div>
          </nav>

          {/* Mobile Menu Toggle Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer">
            <Link to="/" className="mobile-nav-link" onClick={closeMenu}>
              Home
            </Link>
            <Link to="/track" className="mobile-nav-link" onClick={closeMenu}>
              Track Complaint
            </Link>

            {isAuthenticated ? (
              <>
                {isCitizen && (
                  <Link to="/citizen/dashboard" className="mobile-nav-link" onClick={closeMenu}>
                    My Complaints ({user?.name})
                  </Link>
                )}
                {isOfficer && (
                  <Link to="/officer/dashboard" className="mobile-nav-link" onClick={closeMenu}>
                    Officer Dashboard ({user?.name})
                  </Link>
                )}
                {onOpenSubmitModal && (
                  <button
                    className="mobile-action-btn"
                    onClick={() => {
                      closeMenu();
                      onOpenSubmitModal();
                    }}
                  >
                    Report a Complaint
                  </button>
                )}
                <button className="mobile-logout-btn" onClick={handleLogout}>
                  Sign Out
                </button>
              </>
            ) : (
              <div className="mobile-auth-section">
                <Link to="/citizen/login" className="btn btn-primary w-full" onClick={closeMenu}>
                  Citizen Login
                </Link>
                <Link to="/citizen/register" className="btn btn-outline w-full" onClick={closeMenu}>
                  Register as Citizen
                </Link>
                <Link to="/officer/login" className="btn btn-text w-full" onClick={closeMenu}>
                  Officer Login
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
