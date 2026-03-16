import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EmployeeRole, EmployeeStatus } from "@/types";

const ROLE_CFG: Record<EmployeeRole, { label: string; className: string }> = {
  recruitment_support: { label: "Recruitment Support", className: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  hr_manager:          { label: "HR Manager",          className: "border-purple-200 bg-purple-50 text-purple-700" },
  admin:               { label: "Admin",               className: "border-slate-200 bg-slate-100 text-slate-600"   },
};

const STATUS_CFG: Record<EmployeeStatus, { label: string; className: string }> = {
  active:   { label: "Active",   className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  inactive: { label: "Inactive", className: "border-red-200 bg-red-50 text-red-700"             },
};

export function RoleBadge({ role }: { role: EmployeeRole }) {
  const cfg = ROLE_CFG[role] ?? { label: role, className: "" };
  return (
    <Badge variant="outline" className={cn(cfg.className)}>
      {cfg.label}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: EmployeeStatus }) {
  const cfg = STATUS_CFG[status] ?? { label: status, className: "" };
  return (
    <Badge variant="outline" className={cn(cfg.className)}>
      {cfg.label}
    </Badge>
  );
}
