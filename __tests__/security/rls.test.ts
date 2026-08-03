import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '../utils/prisma.mock'
import { OperationRepository } from '@/repositories/operationRepository'

// Mock next/cache with unstable_cache pass-through
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
}))

describe('Sécurité RLS (Row Level Security)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('OperationRepository.create devrait configurer le contexte RLS atomique', async () => {
    // On mock la transaction pour exécuter le callback immédiatement
    prismaMock.$transaction.mockImplementation(async (callback) => {
      // @ts-ignore
      return callback(prismaMock)
    })

    const data = {
      montant: 15000,
      commentaire: 'Test RLS',
      type: 'DEPENSE' as const,
      statut: 'BROUILLON' as const,
    }

    // @ts-ignore
    prismaMock.operation.create.mockResolvedValue({ id: 'op-new-123', type: 'DEPENSE', statut: 'BROUILLON', montant: 15000, agencyId: 'agency-456', commentaire: 'Test RLS' })
    // @ts-ignore
    prismaMock.auditLog.create.mockResolvedValue({})
    // @ts-ignore
    prismaMock.user.findMany.mockResolvedValue([{ id: 'dg-1', role: 'DG' }])
    // @ts-ignore
    prismaMock.notification.createMany.mockResolvedValue({ count: 1 })

    await OperationRepository.create(data, 'agent-123', 'agency-456')

    // Vérifier que set_config a été appelé 3 fois pour le contexte
    expect(prismaMock.$executeRaw).toHaveBeenCalledTimes(3)
    expect(prismaMock.operation.create).toHaveBeenCalledWith({ data })
  })

  it('OperationRepository.updateStatus devrait configurer le contexte DG pour la validation', async () => {
    prismaMock.$transaction.mockImplementation(async (callback) => {
      // @ts-ignore
      return callback(prismaMock)
    })
    // @ts-ignore
    prismaMock.operation.findUnique.mockResolvedValue({ statut: 'EN_ATTENTE', montant: 5000, agencyId: 'agency-1', type: 'DEPENSE', agentId: 'agent-1' })
    // @ts-ignore
    prismaMock.operation.update.mockResolvedValue({ id: 'op-789', statut: 'VALIDEE', validateurId: 'dg-1' })
    // @ts-ignore
    prismaMock.auditLog.create.mockResolvedValue({})
    // @ts-ignore
    prismaMock.notification.create.mockResolvedValue({})

    await OperationRepository.updateStatus('op-789', 'VALIDEE', 'dg-1', 'DG')

    expect(prismaMock.$executeRaw).toHaveBeenCalledTimes(2)
    expect(prismaMock.operation.update).toHaveBeenCalledWith({
      where: { id: 'op-789' },
      data: { statut: 'VALIDEE', validateurId: 'dg-1' }
    })
  })
})
