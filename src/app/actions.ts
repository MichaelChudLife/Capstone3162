"use server";

import { revalidatePath } from "next/cache";
import { createTask, setTaskStatus, type NewTaskInput } from "@/lib/data";
import type { TaskStatus } from "@/lib/types";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/events");
  revalidatePath("/reminders");
}

export async function createTaskAction(input: NewTaskInput) {
  createTask(input);
  revalidateAll();
}

export async function moveTaskAction(id: string, status: TaskStatus) {
  setTaskStatus(id, status);
  revalidateAll();
}
