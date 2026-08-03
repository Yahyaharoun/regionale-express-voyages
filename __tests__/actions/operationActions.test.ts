import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createServerClient } from '@supabase/ssr'

// VERY IMPORTANT: Import the mock BEFORE the files that use prisma!
import { prismaMock } from '../utils/prisma.mock'
import { createExpenseAction, validateOperationAction } from '@/actions/operationActions'
import { createAgencyAction } from '@/actions/agencyActions'

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn().mockImplementation((fn: unknown) => fn),
}))

vi.mock('next/headers', () => ({
  cookies: () => ({ getAll: () => [], set: vi.fn() }),
}))

const makeSupabaseMock = (userId: string | null) => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: userId ? { id: userId } : null },
      error: null,
    }),
  },
})

// ================================================================
// RBAC: Qui peut faire quoi ?
// ================================================================
describe('RBAC — Contrôle d\'accès basé sur les rôles', () => {
  beforeEach(() => vi.clearAllMocks())

  // --- createExpenseAction ---
  describe('createExpenseAction', () => {
    it('✅ AGENT peut créer une dépense', async () => {
      ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(makeSupabaseMock('agent-1'))
      // @ts-ignore
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'agent-1', role: 'AGENT', agencyId: '11111111-1111-1111-1111-111111111111',
      })

      const fd = new FormData()
      fd.append('montant', '15000')
      fd.append('commentaire', 'Achat papier')

      // @ts-ignore
      prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock))
      // @ts-ignore
      prismaMock.operation.create.mockResolvedValue({ id: 'op-1', montant: 15000, agencyId: '11111111-1111-1111-1111-111111111111', type: 'DEPENSE', statut: 'BROUILLON' })
      // @ts-ignore
      prismaMock.auditLog.create.mockResolvedValue({})
      // @ts-ignore
      prismaMock.user.findMany.mockResolvedValue([{ id: 'dg-1', role: 'DG' }])
      // @ts-ignore
      prismaMock.notification.createMany.mockResolvedValue({ count: 1 })

      const result = await createExpenseAction(fd)
      expect(result.error).toBeUndefined()
    })

    it('❌ Unauthenticated user est bloqué', async () => {
      ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(makeSupabaseMock(null))

      const fd = new FormData()
      fd.append('montant', '15000')

      const result = await createExpenseAction(fd)
      expect(result).toEqual({ error: 'Non autorisé (IDOR bloqué).' })
    })

    it('❌ Montant négatif est bloqué par Zod', async () => {
      ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(makeSupabaseMock('agent-1'))
      // @ts-ignore
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'agent-1', role: 'AGENT', agencyId: '11111111-1111-1111-1111-111111111111',
      })

      const fd = new FormData()
      fd.append('montant', '-500')
      fd.append('commentaire', 'Test negatif')

      const result = await createExpenseAction(fd)
      expect(result.error).toMatch(/positif/i)
    })

    it('❌ Montant > 10M FCFA est bloqué par Zod', async () => {
      ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(makeSupabaseMock('agent-1'))
      // @ts-ignore
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'agent-1', role: 'AGENT', agencyId: '11111111-1111-1111-1111-111111111111',
      })

      const fd = new FormData()
      fd.append('montant', '99999999')

      const result = await createExpenseAction(fd)
      expect(result.error).toMatch(/10M|maximum/i)
    })
  })

  // --- validateOperationAction ---
  describe('validateOperationAction', () => {
    it('❌ AGENT ne peut pas valider une opération', async () => {
      ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(makeSupabaseMock('agent-1'))
      // @ts-ignore
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'agent-1', role: 'AGENT', agencyId: '11111111-1111-1111-1111-111111111111',
      })

      const result = await validateOperationAction('op-1', 'VALIDEE')
      expect(result).toEqual({ error: 'Permission refusée. Rôle DG ou PDG requis.' })
    })

    it('❌ DG ne peut pas valider une opération d\'une autre agence (anti-IDOR)', async () => {
      ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(makeSupabaseMock('dg-1'))
      // DG appartient à agence A
      // @ts-ignore
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'dg-1', role: 'DG', agencyId: '11111111-1111-1111-1111-111111111111',
      })
      // L'opération appartient à une agence différente B
      // @ts-ignore
      prismaMock.operation.findUnique.mockResolvedValue({ agencyId: '22222222-2222-2222-2222-222222222222' })

      const result = await validateOperationAction('op-1', 'VALIDEE')
      // L'action bloque avec cross-agency IDOR protection
      expect(result.error).toBeDefined()
      expect(result.error).toMatch(/IDOR|agence|autre/i)
    })

    it('✅ DG peut valider une opération de son agence', async () => {
      ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(makeSupabaseMock('dg-1'))
      // @ts-ignore
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'dg-1', role: 'DG', agencyId: '11111111-1111-1111-1111-111111111111',
      })
      // Opération dans la MÊME agence
      // @ts-ignore
      prismaMock.operation.findUnique.mockResolvedValue({ agencyId: '11111111-1111-1111-1111-111111111111', agentId: 'agent-1', statut: 'EN_ATTENTE', montant: 15000, type: 'DEPENSE' })
      // @ts-ignore
      prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock))
      // @ts-ignore
      prismaMock.operation.update.mockResolvedValue({ id: 'op-1', statut: 'VALIDEE' })
      // @ts-ignore
      prismaMock.auditLog.create.mockResolvedValue({})
      // @ts-ignore
      prismaMock.notification.create.mockResolvedValue({})

      const result = await validateOperationAction('op-1', 'VALIDEE')
      expect(result.error).toBeUndefined()
    })
  })

  // --- createAgencyAction ---
  describe('createAgencyAction', () => {
    it('❌ AGENT ne peut pas créer une agence', async () => {
      ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(makeSupabaseMock('agent-1'))
      // @ts-ignore
      prismaMock.user.findUnique.mockResolvedValue({ id: 'agent-1', role: 'AGENT' })

      const fd = new FormData()
      fd.append('nom', 'Agence Piratée')
      fd.append('ville', 'Douala')

      const result = await createAgencyAction(fd)
      expect(result).toEqual({ error: 'Permission refusée. Rôle PDG requis.' })
    })

    it('❌ DG ne peut pas créer une agence', async () => {
      ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(makeSupabaseMock('dg-1'))
      // @ts-ignore
      prismaMock.user.findUnique.mockResolvedValue({ id: 'dg-1', role: 'DG' })

      const fd = new FormData()
      fd.append('nom', 'Fausse Agence')
      fd.append('ville', 'Yaoundé')

      const result = await createAgencyAction(fd)
      expect(result).toEqual({ error: 'Permission refusée. Rôle PDG requis.' })
    })
  })
})

// ================================================================
// VALIDATION: Tests de validation Zod
// ================================================================
describe('Validation des données (Zod)', () => {
  it('Commentaire trop long est rejeté (>500 caractères)', async () => {
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(makeSupabaseMock('agent-1'))
    // @ts-ignore
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'agent-1', role: 'AGENT', agencyId: '11111111-1111-1111-1111-111111111111',
    })

    const fd = new FormData()
    fd.append('montant', '5000')
    fd.append('commentaire', 'a'.repeat(501))

    const result = await createExpenseAction(fd)
    expect(result.error).toMatch(/500/i)
  })
})
