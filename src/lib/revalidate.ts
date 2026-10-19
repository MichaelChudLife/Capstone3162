import { revalidatePath } from "next/cache";
import { bumpWorkspaceVersion } from "./data";

export function revalidateWorkspace(): void {
  bumpWorkspaceVersion();
  revalidatePath("/", "layout");
}
