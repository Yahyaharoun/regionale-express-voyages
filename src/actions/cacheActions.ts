"use server";

import { revalidateTag, revalidatePath } from "next/cache";

export async function revalidateOperationsTag() {
  // @ts-ignore
  revalidateTag('operations');
  revalidatePath('/dashboard', 'layout');
  revalidatePath('/dashboard/expenses', 'page');
  revalidatePath('/dashboard/deposits', 'page');
  revalidatePath('/dashboard/recettes', 'page');
  revalidatePath('/dashboard/fournisseurs', 'page');
}
