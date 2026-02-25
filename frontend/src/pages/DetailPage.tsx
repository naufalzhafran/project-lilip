import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, CheckCircle2, XCircle, TrendingUp, FileText } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { getEmployee } from "@/api/employees";
import { getRecruitments, createRecruitment, updateRecruitment, deleteRecruitment } from "@/api/recruitments";
import { RoleBadge, StatusBadge } from "@/components/Badge";
import ConfirmDialog from "@/components/ConfirmDialog";
import RecruitmentForm from "./RecruitmentForm";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import type { Employee, RecruitmentRecord, RecruitmentFormData } from "@/types";
import type React from "react";

function fmtDT(iso: string | null): React.ReactNode {
  if (!iso) return <span className="text-muted-foreground">—</span>;
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [employeeLoading, setEmployeeLoading] = useState(true);
  const [records, setRecords] = useState<RecruitmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"edit" | null>(null);
  const [editTarget, setEditTarget] = useState<RecruitmentRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecruitmentRecord | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEmployeeLoading(true);
    getEmployee(Number(id))
      .then(setEmployee)
      .catch(() => navigate("/employees", { replace: true }))
      .finally(() => setEmployeeLoading(false));
  }, [id]);

  async function load() {
    if (!employee) return;
    try {
      setLoading(true);
      setRecords(await getRecruitments(employee.id));
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [employee?.id]);

  const stats = useMemo(() => {
    const total = records.length;
    const onTime = records.filter((r) => r.is_ontime === true).length;
    const late = records.filter((r) => r.is_ontime === false).length;
    const assessed = onTime + late;
    const rate = assessed > 0 ? Math.round((onTime / assessed) * 100) : null;
    return { total, onTime, late, rate };
  }, [records]);

  async function handleEdit(form: RecruitmentFormData) {
    setSaving(true);
    try {
      const updated = await updateRecruitment(editTarget!.id, form);
      setRecords((p) => p.map((r) => (r.id === updated.id ? updated : r)));
      setModal(null); setEditTarget(null);
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await deleteRecruitment(deleteTarget!.id);
      setRecords((p) => p.filter((r) => r.id !== deleteTarget!.id));
      setDeleteTarget(null);
    } finally { setSaving(false); }
  }

  if (employeeLoading || !employee) {
    return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Back */}
      <Button variant="ghost" size="sm" className="w-fit -ml-2 gap-1.5 text-muted-foreground" onClick={() => navigate("/employees")}>
        <ArrowLeft className="h-4 w-4" /> Employees
      </Button>

      {/* Profile + Stats row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile card */}
        <Card className="bg-background lg:col-span-1">
          <CardContent className="p-5 flex flex-col gap-4 h-full">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-extrabold">
                  {employee.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="text-lg font-bold leading-tight truncate">{employee.name}</h2>
                <p className="text-sm text-muted-foreground mt-0.5 truncate">{employee.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <RoleBadge role={employee.role} />
              <StatusBadge status={employee.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-auto">
              Joined {new Date(employee.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </CardContent>
        </Card>

        {/* Stat cards */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-background">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="shrink-0 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Records</p>
                <p className="text-2xl font-bold tracking-tight">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-background">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="shrink-0 p-2.5 rounded-lg bg-red-50 dark:bg-red-950">
                <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Late</p>
                <p className="text-2xl font-bold tracking-tight">{stats.late}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-background">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="shrink-0 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950">
                <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">On-Time Rate</p>
                <p className="text-2xl font-bold tracking-tight">
                  {stats.rate !== null ? `${stats.rate}%` : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recruitment records */}
      <div className="border rounded-md bg-background">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">Recruitment Records</h3>
            <p className="text-xs text-muted-foreground">{records.length} record{records.length !== 1 ? "s" : ""}</p>
          </div>
          <Button onClick={() => navigate(`/recruitments/new?employeeId=${employee.id}`)} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Record
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10 w-10 text-center">#</TableHead>
                <TableHead className="h-10">Candidate</TableHead>
                <TableHead className="h-10">Role</TableHead>
                <TableHead className="hidden lg:table-cell h-10">Interview</TableHead>
                <TableHead className="hidden lg:table-cell h-10">Report Sent</TableHead>
                <TableHead className="hidden lg:table-cell h-10">On Time</TableHead>
                <TableHead className="h-10 text-right w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No records yet
                  </TableCell>
                </TableRow>
              ) : (
                records.map((rec, idx) => (
                  <TableRow key={rec.id}>
                    <TableCell className="py-2.5 text-center text-muted-foreground text-sm">
                      {records.length - idx}
                    </TableCell>
                    <TableCell className="py-2.5 font-medium">{rec.candidate_name}</TableCell>
                    <TableCell className="py-2.5">
                      <span className="inline-block rounded-md border bg-muted/50 px-2 py-0.5 text-xs">
                        {rec.candidate_role}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell py-2.5 text-muted-foreground text-sm whitespace-nowrap">
                      {fmtDT(rec.interview_datetime)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell py-2.5 text-muted-foreground text-sm whitespace-nowrap">
                      {fmtDT(rec.report_sent_datetime)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell py-2.5">
                      {rec.is_ontime === null || rec.is_ontime === undefined ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span
                          className={
                            rec.is_ontime
                              ? "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                          }
                        >
                          {rec.is_ontime ? "Yes" : "No"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon" variant="ghost"
                          className="h-8 w-8"
                          onClick={() => { setEditTarget(rec); setModal("edit"); }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon" variant="ghost"
                          className="h-8 w-8 hover:text-destructive"
                          onClick={() => setDeleteTarget(rec)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Edit dialog */}
      <Dialog open={!!modal} onOpenChange={(v) => { if (!v) { setModal(null); setEditTarget(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Recruitment Record</DialogTitle>
          </DialogHeader>
          <RecruitmentForm
            initial={editTarget}
            onSubmit={handleEdit}
            onCancel={() => { setModal(null); setEditTarget(null); }}
            loading={saving}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Record"
        message={`Delete the recruitment record for ${deleteTarget?.candidate_name}? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={saving}
      />
    </div>
  );
}
