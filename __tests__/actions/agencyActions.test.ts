import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createAgencyAction } from '@/actions/agencyActions'
import { prismaMock } from '../utils/prisma.mock'
import { createServerClient } from '@supabase/ssr'

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
}))

vi.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [],
    setAll: vi.fn(),
  }),
}))

describe('createAgencyAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devrait retourner une erreur si non authentifié', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    }
    ;(createServerClient as any).mockReturnValue(mockSupabase)

    const formData = new FormData()
    formData.append('nom', 'Test Agence')
    
    const result = await createAgencyAction(formData)
    expect(result).toEqual({ error: 'Non autorisé.' })
  })

  it('devrait retourner une erreur si rôle insuffisant (non PDG)', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: '123' } }, error: null }),
      },
    }
    ;(createServerClient as any).mockReturnValue(mockSupabase)
    
    // @ts-ignore
    prismaMock.user.findUnique.mockResolvedValue({ id: '123', role: 'DG' })

    const formData = new FormData()
    formData.append('nom', 'Test Agence')
    
    const result = await createAgencyAction(formData)
    expect(result).toEqual({ error: 'Permission refusée. Rôle PDG requis.' })
  })

  it('devrait valider les entrées avec Zod', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: '123' } }, error: null }),
      },
    }
    ;(createServerClient as any).mockReturnValue(mockSupabase)
    
    // @ts-ignore
    prismaMock.user.findUnique.mockResolvedValue({ id: '123', role: 'PDG' })

    const formData = new FormData()
    // nom vide
    formData.append('nom', '')
    formData.append('ville', 'Yaoundé')
    formData.append('adresse', 'Test')
    
    const result = await createAgencyAction(formData)
    expect(result.error).toBeDefined()
  })
})
