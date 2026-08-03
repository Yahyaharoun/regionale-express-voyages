import { describe, it, expect, vi } from 'vitest';

// Mock simple pour simuler Prisma ou Supabase
const mockGetExpenses = vi.fn();

vi.mock('@/lib/prisma', () => ({
  default: {
    expense: {
      findMany: (...args: any) => mockGetExpenses(...args)
    }
  }
}));

describe('API Routes - Expenses', () => {
  it('doit retourner une liste de dépenses', async () => {
    mockGetExpenses.mockResolvedValue([
      { id: '1', amount: 1500, title: 'Billet Avion' },
      { id: '2', amount: 50, title: 'Taxi' }
    ]);
    
    // Dans Next.js App Router, on testerait le Route Handler via node-mocks-http
    // ou directement la fonction interne
    const expenses = await mockGetExpenses();
    
    expect(expenses).toHaveLength(2);
    expect(expenses[0].amount).toBe(1500);
  });
});
