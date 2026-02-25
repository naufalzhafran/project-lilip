import { useState, useEffect, useRef, useMemo } from "react";
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
import { Upload, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { parseRecruitmentPDF } from "@/lib/pdf-parser";
import type { RecruitmentRecord, RecruitmentFormData, Employee, RecruitmentWithEmployee } from "@/types";

interface RecruitmentFormProps {
  initial: (RecruitmentWithEmployee | RecruitmentRecord) | null;
  employees?: Employee[];
  onSubmit: (f: RecruitmentFormData & { employeeId?: number }) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  prefilled?: {
    candidate_name: string;
    candidate_role: string;
    company_name: string;
    interview_datetime: string | null;
    report_sent_datetime: string | null;
  };
}

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
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="flex-1 justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
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

export default function RecruitmentForm({ initial, employees, onSubmit, onCancel, loading, prefilled }: RecruitmentFormProps) {
  const [form, setForm] = useState<FormState>({
    candidate_name: initial?.candidate_name ?? prefilled?.candidate_name ?? "",
    candidate_role: initial?.candidate_role ?? prefilled?.candidate_role ?? "",
    company_name: prefilled?.company_name ?? "",
    interview_datetime: toInput(initial?.interview_datetime) || toInput(prefilled?.interview_datetime) || "",
    interview_time: toTimeInput(initial?.interview_datetime) || toTimeInput(prefilled?.interview_datetime) || "",
    report_sent_datetime: toInput(initial?.report_sent_datetime) || toInput(prefilled?.report_sent_datetime) || "",
    report_sent_time: toTimeInput(initial?.report_sent_datetime) || toTimeInput(prefilled?.report_sent_datetime) || "",
    employee_id: initial?.employee_id ? String(initial.employee_id) : "",
  });
  const [error, setError] = useState("");
  const [parsingPdf, setParsingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm({
      candidate_name: initial?.candidate_name ?? prefilled?.candidate_name ?? "",
      candidate_role: initial?.candidate_role ?? prefilled?.candidate_role ?? "",
      company_name: prefilled?.company_name ?? "",
      interview_datetime: toInput(initial?.interview_datetime) || toInput(prefilled?.interview_datetime) || "",
      interview_time: toTimeInput(initial?.interview_datetime) || toTimeInput(prefilled?.interview_datetime) || "",
      report_sent_datetime: toInput(initial?.report_sent_datetime) || toInput(prefilled?.report_sent_datetime) || "",
      report_sent_time: toTimeInput(initial?.report_sent_datetime) || toTimeInput(prefilled?.report_sent_datetime) || "",
      employee_id: initial?.employee_id ? String(initial.employee_id) : "",
    });
    setError("");
  }, [initial, prefilled]);

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file");
      return;
    }

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
    try {
      const interviewDatetime = combineDateTime(form.interview_datetime, form.interview_time);
      const reportDatetime = combineDateTime(form.report_sent_datetime, form.report_sent_time);
      
      if (initial) {
        await onSubmit({
          candidate_name: form.candidate_name,
          candidate_role: form.candidate_role,
          interview_datetime: interviewDatetime,
          report_sent_datetime: reportDatetime,
        });
      } else {
        await onSubmit({
          candidate_name: form.candidate_name,
          candidate_role: form.candidate_role,
          interview_datetime: interviewDatetime,
          report_sent_datetime: reportDatetime,
          employeeId: Number(form.employee_id),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive font-medium">
          {error}
        </p>
      )}

      {!initial && (
        <>
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
            className="w-full gap-2"
          >
            {parsingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {parsingPdf ? "Parsing PDF..." : "Upload PDF to auto-fill"}
          </Button>
        </>
      )}

      {!initial && !!employees?.length && (
        <div className="grid gap-1.5">
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="rec-name">Candidate Name</Label>
          <Input id="rec-name" required value={form.candidate_name} onChange={(e) => set("candidate_name", e.target.value)} placeholder="Full name" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="rec-role">Candidate Role</Label>
          <Input 
            id="rec-role" 
            required 
            value={form.candidate_role} 
            onChange={(e) => set("candidate_role", e.target.value)} 
            placeholder={form.company_name ? `e.g. ${form.company_name}` : "e.g. Software Engineer"} 
          />
        </div>
      </div>

      {form.company_name && (
        <div className="grid gap-1.5">
          <Label htmlFor="rec-company">Company</Label>
          <Input id="rec-company" value={form.company_name} onChange={(e) => set("company_name", e.target.value)} placeholder="Company name" />
        </div>
      )}

      <div className="space-y-4">
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
        <div className="flex items-center gap-2 rounded-md border px-3 py-2 bg-muted/30">
          <span className="text-sm text-muted-foreground">On Time:</span>
          <span
            className={
              isOntime
                ? "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            }
          >
            {isOntime ? "Yes" : "No"}
          </span>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading || (!initial && !!employees?.length && !form.employee_id)}>
          {loading ? "Saving…" : initial ? "Save Changes" : "Add Record"}
        </Button>
      </div>
    </form>
  );
}
