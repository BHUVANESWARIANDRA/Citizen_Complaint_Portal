import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../components/StatusBadge';

describe('StatusBadge Component', () => {
  it('renders Submitted status correctly', () => {
    render(<StatusBadge status="SUBMITTED" />);
    expect(screen.getByText(/Submitted/i)).toBeInTheDocument();
  });

  it('renders Under Review status correctly', () => {
    render(<StatusBadge status="UNDER_REVIEW" />);
    expect(screen.getByText(/Under Review/i)).toBeInTheDocument();
  });

  it('renders In Progress status correctly', () => {
    render(<StatusBadge status="IN_PROGRESS" />);
    expect(screen.getByText(/In Progress/i)).toBeInTheDocument();
  });

  it('renders Resolved status correctly', () => {
    render(<StatusBadge status="RESOLVED" />);
    expect(screen.getByText(/Resolved/i)).toBeInTheDocument();
  });

  it('renders Rejected status correctly', () => {
    render(<StatusBadge status="REJECTED" />);
    expect(screen.getByText(/Rejected/i)).toBeInTheDocument();
  });
});
