import type { Member, Priority, TaskStatus } from "@/lib/types";
import { PRIORITY_LABEL, STATUS_LABEL } from "@/lib/types";
import { dueLabel, dueTone } from "@/lib/format";
import { AlertIcon, ClockIcon } from "@/components/icons";

export function Avatar({ member, size = 34 }: { member?: Member; size?: number }) {
  if (!member) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--muted)] font-medium"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        ?
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-white font-semibold"
      style={{ width: size, height: size, background: member.color, fontSize: size * 0.38 }}
      title={member.name}
    >
      {member.initials}
    </span>
  );
}

const statusStyles: Record<TaskStatus, string> = {
  TODO: "bg-[#fbe9e9] text-[#9a5f5f]",
  IN_PROGRESS: "bg-[#f3e6c9] text-[#8a6a2f]",
  DONE: "bg-[#dcebde] text-[#3f7a50]",
};

export function StatusPill({ status }: { status: TaskStatus }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${statusStyles[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

const priorityColor: Record<Priority, string> = {
  HIGH: "#b42318",
  MEDIUM: "#b9821a",
  LOW: "#8a857c",
};

export function PriorityInline({ priority }: { priority: Priority }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: priorityColor[priority] }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: priorityColor[priority] }} />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

const priorityPill: Record<Priority, string> = {
  HIGH: "bg-[#fbe4e4] text-[#b42318]",
  MEDIUM: "bg-[#f6eccf] text-[#b9821a]",
  LOW: "bg-[var(--surface-2)] text-[#8a857c]",
};

export function PriorityTag({ priority }: { priority: Priority }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${priorityPill[priority]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

const dueColor: Record<string, string> = {
  overdue: "#b42318",
  today: "#b9821a",
  soon: "#b9821a",
  normal: "#6f6a61",
};

export function DueText({ dueDate }: { dueDate: string | null }) {
  const tone = dueTone(dueDate);
  return (
    <span className="text-sm font-medium" style={{ color: dueColor[tone] }}>
      {dueLabel(dueDate)}
    </span>
  );
}

export function DueBadge({ dueDate }: { dueDate: string | null }) {
  const tone = dueTone(dueDate);
  const Icon = tone === "overdue" ? AlertIcon : ClockIcon;
  const soft: Record<string, string> = {
    overdue: "bg-[var(--danger-soft)] text-[var(--danger)]",
    today: "bg-[var(--warn-soft)] text-[var(--warn)]",
    soon: "bg-[var(--warn-soft)] text-[var(--warn)]",
    normal: "bg-[var(--surface-2)] text-[var(--muted)]",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${soft[tone]}`}>
      <Icon width={13} height={13} />
      {dueLabel(dueDate)}
    </span>
  );
}
