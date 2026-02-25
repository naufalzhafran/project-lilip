import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, User, FileText, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { getAllRecruitments, deleteRecruitment } from "@/api/recruitments";
import { getEmployees } from "@/api/employees";
import ConfirmDialog from "@/components/ConfirmDialog";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { RecruitmentWithEmployee, Employee } from "@/types";

export default function RecruitmentPage() {
  const navigate = useNavigate();
  const [recruitments, setRecruitments] = useState<RecruitmentWithEmployee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<RecruitmentWithEmployee | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const [recData, empData] = await Promise.all([getAllRecruitments(), getEmployees()]);
      setRecruitments(recData);
      setEmployees(empData);
      setFetchError("");
    } catch {
      setFetchError("Cannot reach the API. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const total = recruitments.length;
    const onTime = recruitments.filter((r) => r.is_ontime === true).length;
    const late = recruitments.filter((r) => r.is_ontime === false).length;
    const assessed = onTime + late;
    const rate = assessed > 0 ? Math.round((onTime / assessed) * 100) : null;
    return { total, onTime, late, rate };
  }, [recruitments]);

  const filtered = useMemo<RecruitmentWithEmployee[]>(() =>
    recruitments.filter((r) => {
      const q = search.toLowerCase();
      return (
        (!q || r.candidate_name.toLowerCase().includes(q) || r.candidate_role.toLowerCase().includes(q)) &&
        (employeeFilter === "all" || r.employee_id === Number(employeeFilter))
      );
    }), [recruitments, search, employeeFilter]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteRecruitment(deleteTarget!.id);
      setRecruitments((p) => p.filter((r) => r.id !== deleteTarget!.id));
      setDeleteTarget(null);
    } finally { setDeleting(false); }
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Recruitments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {recruitments.length} record{recruitments.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => navigate("/recruitments/new")} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Recruitment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-background">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="shrink-0 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Records</p>
              <p className="text-2xl font-bold tracking-tight">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-background">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="shrink-0 p-2.5 rounded-lg bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">On Time</p>
              <p className="text-2xl font-bold tracking-tight">{stats.onTime}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-background">
          <CardContent className="p-5 flex items-center gap-4">
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
          <CardContent className="p-5 flex items-center gap-4">
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

      {fetchError && (
        <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
          {fetchError}
        </p>
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
          <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="All Employees" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={String(emp.id)}>{emp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10">Candidate</TableHead>
                <TableHead className="h-10">Role</TableHead>
                <TableHead className="h-10">Employee</TableHead>
                <TableHead className="hidden md:table-cell h-10">Interview</TableHead>
                <TableHead className="hidden md:table-cell h-10">Report Sent</TableHead>
                <TableHead className="hidden sm:table-cell h-10">On Time</TableHead>
                <TableHead className="h-10 text-right w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No data found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{rec.candidate_name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <p className="font-medium">{rec.candidate_name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 text-muted-foreground">{rec.candidate_role}</TableCell>
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        <span>{rec.employee_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-2.5 text-muted-foreground text-sm">
                      {rec.interview_datetime
                        ? new Date(rec.interview_datetime).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                        : "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-2.5 text-muted-foreground text-sm">
                      {rec.report_sent_datetime
                        ? new Date(rec.report_sent_datetime).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                        : "-"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell py-2.5">
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
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => navigate(`/recruitments/${rec.id}/edit`)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
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

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Recruitment"
        message={`Are you sure you want to delete the recruitment record for ${deleteTarget?.candidate_name}?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
