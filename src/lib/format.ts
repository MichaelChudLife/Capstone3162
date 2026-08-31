export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function daysUntil(iso: string): number {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const due = new Date(iso);
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  return Math.round((startOfDue - startOfToday) / 86400000);
}

export function dueLabel(iso: string | null): string {
  if (!iso) return "No due date";
  const d = daysUntil(iso);
  if (d < -1) return `${Math.abs(d)} days overdue`;
  if (d === -1) return "1 day overdue";
  if (d === 0) return "Due today";
  if (d === 1) return "Due tomorrow";
  if (d <= 6) return `Due in ${d} days`;
  return `Due ${formatDate(iso)}`;
}

export type DueTone = "overdue" | "today" | "soon" | "normal";

export function dueTone(iso: string | null): DueTone {
  if (!iso) return "normal";
  const d = daysUntil(iso);
  if (d < 0) return "overdue";
  if (d === 0) return "today";
  if (d <= 3) return "soon";
  return "normal";
}
