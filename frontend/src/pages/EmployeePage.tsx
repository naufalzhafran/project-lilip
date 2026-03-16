import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, ChevronRight, Users, UserCheck, UserMinus, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from "@/api/employees";
import { RoleBadge, StatusBadge } from "@/components/Badge";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmployeeForm from "./EmployeeForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import type { Employee, EmployeeFormData } from "@/types";

export default function EmployeePage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setEmployees(await getEmployees());
      setFetchError("");
    } catch {
      setFetchError("Cannot reach the API. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter((e) => e.status === "active").length,
    inactive: employees.filter((e) => e.status === "inactive").length,
    rs: employees.filter((e) => e.role === "recruitment_support").length,
  }), [employees]);

  const filtered = useMemo<Employee[]>(() =>
    employees.filter((e) => {
      const q = search.toLowerCase();
      return (
        (!q || e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)) &&
        (roleFilter === "all" || e.role === roleFilter) &&
        (statusFilter === "all" || e.status === statusFilter)
      );
    }), [employees, search, roleFilter, statusFilter]);

  async function handleAdd(form: EmployeeFormData) {
    setSaving(true);
    try {
      const created = await createEmployee(form);
      setEmployees((p) => [created, ...p]);
      setModal(null);
    } finally { setSaving(false); }
  }

  async function handleEdit(form: EmployeeFormData) {
    setSaving(true);
    try {
      const updated = await updateEmployee(editTarget!.id, form);
      setEmployees((p) => p.map((e) => (e.id === updated.id ? updated : e)));
      setModal(null); setEditTarget(null);
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await deleteEmployee(deleteTarget!.id);
      setEmployees((p) => p.filter((e) => e.id !== deleteTarget!.id));
      setDeleteTarget(null);
    } finally { setSaving(false); }
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {employees.length} team member{employees.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setModal("add")}>
          <Plus data-icon="inline-start" />
          Add Employee
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="shrink-0 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950">
              <Users className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Employees</p>
              <p className="text-2xl font-bold tracking-tight">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="shrink-0 p-2.5 rounded-lg bg-green-50 dark:bg-green-950">
              <UserCheck className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold tracking-tight">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="shrink-0 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800">
              <UserMinus className="size-5 text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Inactive</p>
              <p className="text-2xl font-bold tracking-tight">{stats.inactive}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="shrink-0 p-2.5 rounded-lg bg-violet-50 dark:bg-violet-950">
              <Briefcase className="size-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recruitment Support</p>
              <p className="text-2xl font-bold tracking-tight">{stats.rs}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {fetchError && (
        <Alert variant="destructive">
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}

      {/* Table */}
      <div className="border rounded-md bg-background">
        <div className="p-4 border-b flex flex-wrap gap-2">
          <Input
            className="max-w-xs"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Roles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="recruitment_support">Recruitment Support</SelectItem>
              <SelectItem value="hr_manager">HR Manager</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10">Employee</TableHead>
                <TableHead className="h-10">Role</TableHead>
                <TableHead className="h-10">Status</TableHead>
                <TableHead className="hidden md:table-cell h-10">Joined</TableHead>
                <TableHead className="h-10 text-right w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-8 rounded-full shrink-0" />
                        <div className="flex flex-col gap-1.5">
                          <Skeleton className="h-3.5 w-28" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-32 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-3.5 w-24" /></TableCell>
                    <TableCell><div className="flex justify-end gap-1"><Skeleton className="size-8 rounded-md" /><Skeleton className="size-8 rounded-md" /></div></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((emp) => (
                  <TableRow
                    key={emp.id}
                    className={emp.role === "recruitment_support" ? "cursor-pointer" : ""}
                    onClick={() => emp.role === "recruitment_support" && navigate(`/employees/${emp.id}`)}
                  >
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">{emp.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">{emp.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5"><RoleBadge role={emp.role} /></TableCell>
                    <TableCell className="py-2.5"><StatusBadge status={emp.status} /></TableCell>
                    <TableCell className="hidden md:table-cell py-2.5 text-muted-foreground text-sm">
                      {new Date(emp.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {emp.role === "recruitment_support" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/employees/${emp.id}`)}
                          >
                            View
                            <ChevronRight data-icon="inline-end" />
                          </Button>
                        )}
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => { setEditTarget(emp); setModal("edit"); }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="hover:text-destructive"
                          onClick={() => setDeleteTarget(emp)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={!!modal} onOpenChange={(v) => { if (!v) { setModal(null); setEditTarget(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{modal === "edit" ? "Edit Employee" : "Add Employee"}</DialogTitle>
          </DialogHeader>
          <EmployeeForm
            initial={modal === "edit" ? editTarget : null}
            onSubmit={modal === "edit" ? handleEdit : handleAdd}
            onCancel={() => { setModal(null); setEditTarget(null); }}
            loading={saving}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Employee"
        message={`Are you sure you want to delete ${deleteTarget?.name}? All their recruitment records will also be removed.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={saving}
      />
    </div>
  );
}
