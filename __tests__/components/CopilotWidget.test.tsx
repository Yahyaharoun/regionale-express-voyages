import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CopilotWidget } from '@/features/ai/CopilotWidget';

// Mock de @ai-sdk/react car nous ne testons pas l'IA réelle
vi.mock('@ai-sdk/react', () => ({
  useChat: () => ({
    messages: [
      { id: '1', role: 'user', content: 'Bonjour' },
      { id: '2', role: 'assistant', content: 'Comment puis-je vous aider ?' }
    ],
    input: '',
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    isLoading: false
  })
}));

describe('CopilotWidget', () => {
  it('doit rendre le bouton initialement fermé', () => {
    render(<CopilotWidget />);
    // On vérifie que le bouton existe (icône Bot)
    expect(document.querySelector('.fixed.bottom-6')).toBeInTheDocument();
    // La carte détaillée ne doit pas être affichée
    expect(screen.queryByText('Regional Express AI')).not.toBeInTheDocument();
  });

  it('doit ouvrir le widget au clic', () => {
    render(<CopilotWidget />);
    const button = document.querySelector('.fixed.bottom-6') as HTMLElement;
    fireEvent.click(button);
    
    // Le titre doit apparaître
    expect(screen.getByText('Regional Express AI')).toBeInTheDocument();
    // Les messages mockés doivent être visibles
    expect(screen.getByText('Comment puis-je vous aider ?')).toBeInTheDocument();
  });
});
