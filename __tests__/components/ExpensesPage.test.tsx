import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ExpensesPage from '@/app/dashboard/expenses/page';

vi.mock('@/actions/operationActions', () => ({
  getOperations: vi.fn().mockResolvedValue({
    success: true,
    data: [
      { 
        id: '1', 
        montant: 1500, 
        type: 'DEPENSE', 
        statut: 'EN_ATTENTE', 
        commentaire: 'Test Expense',
        agent: { nom: 'Agent 1', prenom: 'Test' },
        agency: { nom: 'Agence Paris' },
        createdAt: new Date().toISOString()
      }
    ]
  })
}));

describe('Expenses Page', () => {
  it('doit rendre le tableau des dépenses', async () => {
    const PageComponent = await ExpensesPage();
    render(PageComponent);
    
    // Vérification de la structure du tableau
    expect(screen.getByText('Nouvelle Dépense')).toBeInTheDocument();
    expect(screen.getByText('Toutes les Dépenses')).toBeInTheDocument();
    expect(screen.getByText('Test Expense')).toBeInTheDocument(); // Commentaire mocké
  });
});
