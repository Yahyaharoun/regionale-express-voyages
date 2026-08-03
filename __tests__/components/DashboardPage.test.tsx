import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DashboardPage from '@/app/dashboard/page';

// Mocker les appels réseau ou Server Actions (qui seront appelés côté serveur)
vi.mock('@/actions/operationActions', () => ({
  getOperations: vi.fn().mockResolvedValue({
    success: true,
    data: [
      { id: '1', montant: 1000, type: 'DEPENSE', statut: 'EN_ATTENTE' },
      { id: '2', montant: 5000, type: 'DEPENSE', statut: 'VALIDEE' }
    ]
  })
}));

describe('Dashboard Page (KPIs)', () => {
  it('doit rendre les KPI principaux', async () => {
    // Dans un vrai projet RSC, on testerait le composant asynchrone avec un await
    const PageComponent = await DashboardPage();
    render(PageComponent);
    
    // Vérification de la présence des titres des KPIs
    expect(screen.getByText('Revenus Totaux')).toBeInTheDocument();
    expect(screen.getByText('Dépenses En Attente')).toBeInTheDocument();
    expect(screen.getByText('Opérations Validées')).toBeInTheDocument();
  });
});
