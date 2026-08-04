"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CategoryRepository } from "@/repositories/categoryRepository";
import { categorySchema } from "@/lib/validations/category";
import { actionRateLimit } from "@/lib/rateLimit";

export async function createCategoryAction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé." };

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser || !['PDG', 'DG', 'DGA'].includes(dbUser.role)) {
      return { error: "Permission refusée. Rôle requis." };
    }

    if (!await actionRateLimit.check(user.userId)) {
      return { error: "Trop de requêtes. Veuillez patienter." };
    }

    const rawData = {
      nom: formData.get("nom") as string,
      description: formData.get("description") as string || undefined,
    };

    const validatedFields = categorySchema.safeParse(rawData);
    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message };
    }

    const category = await CategoryRepository.create(validatedFields.data, user.userId);

    revalidatePath("/dashboard/categories");
    return { success: true, data: category };
  } catch (error) {
    console.error("Error creating category:", error);
    return { error: "Une erreur s'est produite lors de la création de la catégorie." };
  }
}

export async function getCategories() {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé." };

    const categories = await CategoryRepository.findAll();
    return { success: true, data: categories };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { error: "Impossible de récupérer les catégories." };
  }
}

export async function toggleCategoryStatusAction(id: string, currentStatus: boolean) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé." };

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser || !['PDG', 'DG', 'DGA'].includes(dbUser.role)) {
      return { error: "Permission refusée. Rôle PDG/DG requis." };
    }

    await CategoryRepository.update(id, { isActive: !currentStatus }, user.userId);
    revalidatePath("/dashboard/categories");
    
    return { success: true };
  } catch (error) {
    console.error("Error toggling category status:", error);
    return { error: "Erreur lors de la modification du statut." };
  }
}

export async function updateCategoryAction(id: string, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé." };

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser || !['PDG', 'DG', 'DGA'].includes(dbUser.role)) {
      return { error: "Permission refusée. Rôle PDG/DG requis." };
    }

    if (!await actionRateLimit.check(user.userId)) {
      return { error: "Trop de requêtes. Veuillez patienter." };
    }

    const rawData = {
      nom: formData.get("nom") as string,
      description: formData.get("description") as string || undefined,
    };

    const validatedFields = categorySchema.safeParse(rawData);
    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message };
    }

    const category = await CategoryRepository.update(id, validatedFields.data, user.userId);

    revalidatePath("/dashboard/categories");
    return { success: true, data: category };
  } catch (error) {
    console.error("Error updating category:", error);
    return { error: "Une erreur s'est produite lors de la modification." };
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé." };

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser || !['PDG', 'DG', 'DGA'].includes(dbUser.role)) {
      return { error: "Permission refusée. Rôle PDG/DG requis." };
    }

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { depenses: true }
        }
      }
    });

    if (!category) return { error: "Catégorie introuvable." };

    await CategoryRepository.delete(id, user.userId);
    revalidatePath("/dashboard/categories");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { error: "Erreur lors de la suppression." };
  }
}
