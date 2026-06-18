import { revalidatePath } from "next/cache";

// Local single-user app: after any mutation, refresh everything.
// Simple and always correct; revisit only if it ever feels slow.
export function revalidateAll() {
  revalidatePath("/", "layout");
}
