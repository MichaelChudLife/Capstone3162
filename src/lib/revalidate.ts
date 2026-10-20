import { revalidatePath } from "next/cache";
import { bumpWorkspaceVersion } from "./data";

export async function revalidateWorkspace(): Promise<void> {
  await bumpWorkspaceVersion();
  revalidatePath("/", "layout");
}
