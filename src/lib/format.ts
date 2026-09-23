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

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDateTimeLocal(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amount);
}

export function formatDeadline(iso: string | null): string {
  if (!iso) return "No deadline";
  return new Date(iso).toLocaleString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  });
}
