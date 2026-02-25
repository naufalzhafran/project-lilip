import { createBrowserRouter, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import EmployeePage from "@/pages/EmployeePage";
import DetailPage from "@/pages/DetailPage";
import RecruitmentPage from "@/pages/RecruitmentPage";
import RecruitmentFormPage from "@/pages/RecruitmentFormPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <EmployeePage /> },
      { path: "employees", element: <EmployeePage /> },
      { path: "employees/:id", element: <DetailPage /> },
      { path: "employees/:employeeId/records/new", element: <RecruitmentFormPage /> },
      { path: "recruitments", element: <RecruitmentPage /> },
      { path: "recruitments/new", element: <RecruitmentFormPage /> },
      { path: "recruitments/:id/edit", element: <RecruitmentFormPage /> },
    ],
  },
]);
