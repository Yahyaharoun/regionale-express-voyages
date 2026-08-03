import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LandingPage from '@/app/page';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  ArrowRight: () => <div data-testid="icon-arrow-right" />,
  Shield: () => <div data-testid="icon-shield" />,
  Globe: () => <div data-testid="icon-globe" />,
  Zap: () => <div data-testid="icon-zap" />,
}));

describe('Landing Page', () => {
  it('doit rendre le titre principal', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Gérez toutes vos opérations/i)).toBeInTheDocument();
  });

  it('doit rendre les boutons de navigation', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Accéder au Dashboard/i)).toBeInTheDocument();
  });
});
