import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExpenseForm } from '@/features/expenses/ExpenseForm'
import { createExpenseAction } from '@/actions/operationActions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// Mocks
vi.mock('@/actions/operationActions', () => ({
  createExpenseAction: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('ExpenseForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devrait afficher le formulaire correctement', () => {
    render(<ExpenseForm />)
    expect(screen.getByLabelText(/Montant/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Commentaire/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Soumettre pour validation/i })).toBeInTheDocument()
  })

  it('devrait afficher une erreur si la création échoue', async () => {
    ;(createExpenseAction as any).mockResolvedValue({ error: 'Erreur serveur' })

    render(<ExpenseForm />)
    
    fireEvent.change(screen.getByLabelText(/Montant/i), { target: { value: '15000' } })
    fireEvent.change(screen.getByLabelText(/Commentaire/i), { target: { value: 'Test erreur' } })
    
    fireEvent.click(screen.getByRole('button', { name: /Soumettre pour validation/i }))

    await waitFor(() => {
      expect(createExpenseAction).toHaveBeenCalled()
      expect(toast.error).toHaveBeenCalledWith('Erreur serveur')
      expect(screen.getByText('Erreur serveur')).toBeInTheDocument()
    })
  })

  it('devrait rediriger et afficher un succès si tout est valide', async () => {
    ;(createExpenseAction as any).mockResolvedValue({ success: true })
    const pushMock = vi.fn()
    ;(useRouter as any).mockReturnValue({ push: pushMock })

    render(<ExpenseForm />)
    
    fireEvent.change(screen.getByLabelText(/Montant/i), { target: { value: '15000' } })
    fireEvent.change(screen.getByLabelText(/Commentaire/i), { target: { value: 'Test succès' } })
    
    fireEvent.click(screen.getByRole('button', { name: /Soumettre pour validation/i }))

    await waitFor(() => {
      expect(createExpenseAction).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith('Opération soumise avec succès !')
      expect(pushMock).toHaveBeenCalledWith('/dashboard/expenses')
    })
  })
})
