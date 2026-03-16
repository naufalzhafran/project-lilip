import { useState, useEffect } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Employee, EmployeeFormData } from "@/types";

interface EmployeeFormProps {
  initial: Employee | null;
  onSubmit: (f: EmployeeFormData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

const EMPTY: EmployeeFormData = { name: "", email: "", role: "recruitment_support", status: "active" };

export default function EmployeeForm({ initial, onSubmit, onCancel, loading }: EmployeeFormProps) {
  const [form, setForm] = useState<EmployeeFormData>(initial ?? EMPTY);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(initial ?? EMPTY);
    setError("");
  }, [initial]);

  function set<K extends keyof EmployeeFormData>(field: K, value: EmployeeFormData[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="emp-name">Full Name</Label>
        <Input
          id="emp-name"
          required
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Alice Johnson"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="emp-email">Email Address</Label>
        <Input
          id="emp-email"
          required
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="alice@company.com"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Role</Label>
          <Select value={form.role} onValueChange={(v) => set("role", v as EmployeeFormData["role"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recruitment_support">Recruitment Support</SelectItem>
              <SelectItem value="hr_manager">HR Manager</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => set("status", v as EmployeeFormData["status"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : initial ? "Save Changes" : "Add Employee"}
        </Button>
      </div>
    </form>
  );
}
