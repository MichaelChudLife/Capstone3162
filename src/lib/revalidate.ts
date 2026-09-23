import { revalidatePath } from "next/cache";

export function revalidateWorkspace(): void {
  revalidatePath("/", "layout");
}
