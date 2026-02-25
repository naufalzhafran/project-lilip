import type { Employee, EmployeeFormData } from "@/types";

const BASE = "http://localhost:8000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (res.status === 204) return null as T;
  const data = await res.json() as T;
  if (!res.ok) throw new Error((data as { detail?: string }).detail || "Request failed");
  return data;
}

export const getEmployees = (): Promise<Employee[]> => request<Employee[]>("/employees");
export const getEmployee = (id: number): Promise<Employee> => request<Employee>(`/employees/${id}`);
export const createEmployee = (body: EmployeeFormData): Promise<Employee> =>
  request<Employee>("/employees", { method: "POST", body: JSON.stringify(body) });
export const updateEmployee = (id: number, body: EmployeeFormData): Promise<Employee> =>
  request<Employee>(`/employees/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const deleteEmployee = (id: number): Promise<null> =>
  request<null>(`/employees/${id}`, { method: "DELETE" });
