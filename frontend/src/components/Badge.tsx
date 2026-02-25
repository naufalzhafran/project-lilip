import { cn } from "@/lib/utils";
import type { EmployeeRole, EmployeeStatus } from "@/types";

const ROLE_CFG: Record<EmployeeRole, { label: string; className: string }> = {
  recruitment_support: { label: "Recruitment Support", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  hr_manager:          { label: "HR Manager",          className: "bg-purple-100 text-purple-700 border-purple-200" },
  admin:               { label: "Admin",               className: "bg-slate-100  text-slate-600  border-slate-200"  },
};

const STATUS_CFG: Record<EmployeeStatus, { label: string; className: string }> = {
  active:   { label: "Active",   className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  inactive: { label: "Inactive", className: "bg-red-100     text-red-700     border-red-200"     },
};

function StatusPill({ label, className }: { label: string; className: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", className)}>
      {label}
    </span>
  );
}

export function RoleBadge({ role }: { role: EmployeeRole }) {
  const cfg = ROLE_CFG[role] ?? { label: role, className: "bg-slate-100 text-slate-600 border-slate-200" };
  return <StatusPill {...cfg} />;
}

export function StatusBadge({ status }: { status: EmployeeStatus }) {
  const cfg = STATUS_CFG[status] ?? { label: status, className: "bg-slate-100 text-slate-600 border-slate-200" };
  return <StatusPill {...cfg} />;
}
