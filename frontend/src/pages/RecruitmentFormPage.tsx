import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { computeIsOntime } from "@/lib/is-ontime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Loader2, Calendar as CalendarIcon, ArrowLeft, FileText } from "lucide-react";
import { format } from "date-fns";
import { parseRecruitmentPDF } from "@/lib/pdf-parser";
import { getEmployees } from "@/api/employees";
import { getRecruitmentById, createRecruitment, updateRecruitment } from "@/api/recruitments";
import type { Employee, RecruitmentFormData } from "@/types";

interface FormState {
  candidate_name: string;
  candidate_role: string;
  company_name: string;
  interview_datetime: string;
  interview_time: string;
  report_sent_datetime: string;
  report_sent_time: string;
  employee_id: string;
}

function toInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function toTimeInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(11, 16);
}

interface DateTimePickerProps {
  label: string;
  dateValue: string;
  timeValue: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
}

function DateTimePicker({ label, dateValue, timeValue, onDateChange, onTimeChange }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(dateValue ? new Date(dateValue) : undefined);

  useEffect(() => {
    if (dateValue) {
      setDate(new Date(dateValue));
    }
  }, [dateValue]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      onDateChange(format(selectedDate, "yyyy-MM-dd"));
    }
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="flex-1 justify-start text-left font-normal"
            >
              <CalendarIcon data-icon="inline-start" />
              {date ? format(date, "PPP") : "Pick date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Input
          type="time"
          className="w-28"
          value={timeValue}
          onChange={(e) => onTimeChange(e.target.value)}
        />
      </div>
    </div>
  );
}

export default function RecruitmentFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;
  const employeeIdFromUrl = searchParams.get("employeeId");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [parsingPdf, setParsingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    candidate_name: "",
    candidate_role: "",
    company_name: "",
    interview_datetime: "",
    interview_time: "",
    report_sent_datetime: "",
    report_sent_time: "",
    employee_id: employeeIdFromUrl || "",
  });

  useEffect(() => {
    async function load() {
      try {
        const empData = await getEmployees();
        setEmployees(empData);

        if (isEdit && id) {
          const rec = await getRecruitmentById(Number(id));
          setForm({
            candidate_name: rec.candidate_name,
            candidate_role: rec.candidate_role,
            company_name: "",
            interview_datetime: toInput(rec.interview_datetime),
            interview_time: toTimeInput(rec.interview_datetime),
            report_sent_datetime: toInput(rec.report_sent_datetime),
            report_sent_time: toTimeInput(rec.report_sent_datetime),
            employee_id: String(rec.employee_id),
          });
        }
      } catch {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isEdit]);

  const set = useCallback(<K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [field]: value }));
  }, []);

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file");
      return;
    }

    const url = URL.createObjectURL(file);
    setPdfUrl(url);

    setParsingPdf(true);
    setError("");
    try {
      const parsed = await parseRecruitmentPDF(file);

      const interviewDate = parsed.interview_datetime ? parsed.interview_datetime.slice(0, 10) : "";
      const interviewTime = parsed.interview_datetime ? parsed.interview_datetime.slice(11, 16) : "";
      const reportDate = parsed.report_sent_datetime ? parsed.report_sent_datetime.slice(0, 10) : "";
      const reportTime = parsed.report_sent_datetime ? parsed.report_sent_datetime.slice(11, 16) : "";

      setForm((f) => ({
        ...f,
        candidate_name: parsed.candidate_name || f.candidate_name,
        candidate_role: parsed.candidate_role || f.candidate_role,
        company_name: parsed.company_name || f.company_name,
        interview_datetime: interviewDate || f.interview_datetime,
        interview_time: interviewTime || f.interview_time,
        report_sent_datetime: reportDate || f.report_sent_datetime,
        report_sent_time: reportTime || f.report_sent_time,
      }));
    } catch {
      setError("Failed to parse PDF. Please enter data manually.");
    } finally {
      setParsingPdf(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function combineDateTime(date: string, time: string): string | null {
    if (!date) return null;
    if (!time) return `${date}T00:00`;
    return `${date}T${time}:00`;
  }

  const isOntime = useMemo(() => {
    const interviewIso = form.interview_datetime && form.interview_time
      ? `${form.interview_datetime}T${form.interview_time}`
      : null;
    const reportIso = form.report_sent_datetime && form.report_sent_time
      ? `${form.report_sent_datetime}T${form.report_sent_time}`
      : null;
    return computeIsOntime(interviewIso, reportIso);
  }, [form.interview_datetime, form.interview_time, form.report_sent_datetime, form.report_sent_time]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const interviewDatetime = combineDateTime(form.interview_datetime, form.interview_time);
    const reportDatetime = combineDateTime(form.report_sent_datetime, form.report_sent_time);

    setSaving(true);
    try {
      if (isEdit && id) {
        await updateRecruitment(Number(id), {
          candidate_name: form.candidate_name,
          candidate_role: form.candidate_role,
          interview_datetime: interviewDatetime,
          report_sent_datetime: reportDatetime,
        } as RecruitmentFormData);
      } else {
        await createRecruitment(Number(form.employee_id), {
          candidate_name: form.candidate_name,
          candidate_role: form.candidate_role,
          interview_datetime: interviewDatetime,
          report_sent_datetime: reportDatetime,
        } as RecruitmentFormData);
      }
      navigate("/recruitments");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full">
        <div className="flex-1 p-6">
          <div className="max-w-xl mx-auto flex flex-col gap-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-9 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left side - Form */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-xl mx-auto flex flex-col gap-6">
          <Button
            variant="ghost"
            className="-ml-2 w-fit"
            onClick={() => navigate("/recruitments")}
          >
            <ArrowLeft data-icon="inline-start" />
            Back to Recruitments
          </Button>

          <h1 className="text-xl font-bold">
            {isEdit ? "Edit Recruitment" : "Add Recruitment"}
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                onChange={handlePdfUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={parsingPdf}
                className="w-full"
              >
                {parsingPdf ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Upload data-icon="inline-start" />
                )}
                {parsingPdf ? "Parsing PDF..." : "Upload PDF to auto-fill"}
              </Button>
            </div>

            {!isEdit && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rec-employee">Employee</Label>
                <Select value={form.employee_id} onValueChange={(v) => set("employee_id", v)}>
                  <SelectTrigger id="rec-employee">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={String(emp.id)}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rec-name">Candidate Name</Label>
                <Input
                  id="rec-name"
                  required
                  value={form.candidate_name}
                  onChange={(e) => set("candidate_name", e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rec-role">Candidate Role</Label>
                <Input
                  id="rec-role"
                  required
                  value={form.candidate_role}
                  onChange={(e) => set("candidate_role", e.target.value)}
                  placeholder="e.g. Software Engineer"
                />
              </div>
            </div>

            {form.company_name && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rec-company">Company</Label>
                <Input
                  id="rec-company"
                  value={form.company_name}
                  onChange={(e) => set("company_name", e.target.value)}
                  placeholder="Company name"
                />
              </div>
            )}

            <div className="flex flex-col gap-4">
              <DateTimePicker
                label="Interview Date & Time"
                dateValue={form.interview_datetime}
                timeValue={form.interview_time}
                onDateChange={(v) => set("interview_datetime", v)}
                onTimeChange={(v) => set("interview_time", v)}
              />
              <DateTimePicker
                label="Report Sent Date & Time"
                dateValue={form.report_sent_datetime}
                timeValue={form.report_sent_time}
                onDateChange={(v) => set("report_sent_datetime", v)}
                onTimeChange={(v) => set("report_sent_time", v)}
              />
            </div>

            {isOntime !== null && (
              <div className="flex items-center gap-2 rounded-md border px-3 py-2.5 bg-muted/30">
                <span className="text-sm text-muted-foreground">On Time:</span>
                {isOntime ? (
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Yes</Badge>
                ) : (
                  <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">No</Badge>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => navigate("/recruitments")}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || (!isEdit && !form.employee_id)}>
                {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Record"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - PDF Viewer */}
      <div className="w-1/2 border-l flex flex-col">
        {pdfUrl ? (
          <div className="flex-1">
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-full border-0"
              title="PDF Viewer"
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/10">
            <div className="text-center text-muted-foreground flex flex-col items-center gap-3">
              <FileText className="size-12 opacity-30" />
              <p className="text-sm">Upload a PDF to preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
