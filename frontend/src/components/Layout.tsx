import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { Outlet, useMatch, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import AppSidebar from "@/components/AppSidebar";
import { getEmployee } from "@/api/employees";
import type { Employee } from "@/types";

export default function Layout() {
  const navigate = useNavigate();
  const dashboardMatch = useMatch("/dashboard");
  const recruitmentsListMatch = useMatch("/recruitments");
  const recruitmentsNewMatch = useMatch("/recruitments/new");
  const recruitmentsEditMatch = useMatch("/recruitments/:id/edit");
  const detailMatch = useMatch("/employees/:id");
  const [breadcrumbEmployee, setBreadcrumbEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    if (!detailMatch) {
      setBreadcrumbEmployee(null);
      return;
    }
    const id = Number(detailMatch.params.id);
    getEmployee(id).then(setBreadcrumbEmployee).catch(() => setBreadcrumbEmployee(null));
  }, [detailMatch?.params.id]);

  const isRecruitmentPage = recruitmentsListMatch || recruitmentsNewMatch || recruitmentsEditMatch;

  const getBreadcrumbLabel = () => {
    if (detailMatch) return "Employees";
    if (recruitmentsNewMatch) return "Add Recruitment";
    if (recruitmentsEditMatch) return "Edit Recruitment";
    if (isRecruitmentPage) return "Recruitments";
    if (dashboardMatch) return "Employees";
    return "Employees";
  };

  const getBreadcrumbLink = () => {
    if (detailMatch) return "/dashboard";
    if (recruitmentsNewMatch || recruitmentsEditMatch) return "/recruitments";
    if (isRecruitmentPage) return "/recruitments";
    if (dashboardMatch) return "/dashboard";
    return "/dashboard";
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <nav className="flex items-center gap-1 text-sm min-w-0">
            <span
              className={
                recruitmentsNewMatch || recruitmentsEditMatch
                  ? "text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  : "font-medium text-foreground"
              }
              onClick={() => navigate(getBreadcrumbLink())}
            >
              {getBreadcrumbLabel()}
            </span>
            {!!detailMatch && breadcrumbEmployee && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                <span className="font-medium text-foreground truncate">{breadcrumbEmployee.name}</span>
              </>
            )}
          </nav>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
