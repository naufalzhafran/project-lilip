export type EmployeeRole = "recruitment_support" | "hr_manager" | "admin";
export type EmployeeStatus = "active" | "inactive";

export interface Employee {
  id: number;
  name: string;
  email: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  created_at: string;
}

export interface EmployeeFormData {
  name: string;
  email: string;
  role: EmployeeRole;
  status: EmployeeStatus;
}

export interface RecruitmentRecord {
  id: number;
  employee_id: number;
  candidate_name: string;
  candidate_role: string;
  interview_datetime: string | null;
  report_sent_datetime: string | null;
  is_ontime: boolean | null;
}

export interface RecruitmentFormData {
  candidate_name: string;
  candidate_role: string;
  interview_datetime: string | null;
  report_sent_datetime: string | null;
}

export interface RecruitmentWithEmployee {
  id: number;
  employee_id: number;
  employee_name: string;
  candidate_name: string;
  candidate_role: string;
  interview_datetime: string | null;
  report_sent_datetime: string | null;
  is_ontime: boolean;
  created_at: string;
}
