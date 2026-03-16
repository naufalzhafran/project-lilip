import type { RecruitmentRecord, RecruitmentFormData, RecruitmentWithEmployee } from "@/types";

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

export const getRecruitments = (employeeId: number): Promise<RecruitmentRecord[]> =>
  request<RecruitmentRecord[]>(`/employees/${employeeId}/recruitments`);
export const getRecruitmentById = (id: number): Promise<RecruitmentRecord> =>
  request<RecruitmentRecord>(`/recruitments/${id}`);
export const getAllRecruitments = (): Promise<RecruitmentWithEmployee[]> =>
  request<RecruitmentWithEmployee[]>(`/recruitments`);
export const createRecruitment = (employeeId: number, body: RecruitmentFormData): Promise<RecruitmentRecord> =>
  request<RecruitmentRecord>(`/employees/${employeeId}/recruitments`, {
    method: "POST",
    body: JSON.stringify(body),
  });
export const updateRecruitment = (id: number, body: RecruitmentFormData): Promise<RecruitmentRecord> =>
  request<RecruitmentRecord>(`/recruitments/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const deleteRecruitment = (id: number): Promise<null> =>
  request<null>(`/recruitments/${id}`, { method: "DELETE" });
