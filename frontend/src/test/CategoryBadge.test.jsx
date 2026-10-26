import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CategoryBadge from '../components/CategoryBadge';

describe('CategoryBadge Component', () => {
  it('renders Roads and potholes label', () => {
    render(<CategoryBadge category="ROADS_AND_POTHOLES" />);
    expect(screen.getByText(/Roads and potholes/i)).toBeInTheDocument();
  });

  it('renders Water supply label', () => {
    render(<CategoryBadge category="WATER_SUPPLY" />);
    expect(screen.getByText(/Water supply/i)).toBeInTheDocument();
  });

  it('renders Streetlights label', () => {
    render(<CategoryBadge category="STREETLIGHTS" />);
    expect(screen.getByText(/Streetlights/i)).toBeInTheDocument();
  });
});
