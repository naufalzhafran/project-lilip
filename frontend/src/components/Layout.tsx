import { useState, useEffect } from "react";
import { Outlet, useMatch, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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

  const isRecruitmentSubpage = recruitmentsNewMatch || recruitmentsEditMatch;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />

          <Breadcrumb>
            <BreadcrumbList>
              {/* Employees section */}
              {(dashboardMatch || detailMatch) && (
                <>
                  {detailMatch ? (
                    <>
                      <BreadcrumbItem>
                        <BreadcrumbLink
                          className="cursor-pointer"
                          onClick={() => navigate("/dashboard")}
                        >
                          Employees
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      {breadcrumbEmployee && (
                        <>
                          <BreadcrumbSeparator />
                          <BreadcrumbItem>
                            <BreadcrumbPage>{breadcrumbEmployee.name}</BreadcrumbPage>
                          </BreadcrumbItem>
                        </>
                      )}
                    </>
                  ) : (
                    <BreadcrumbItem>
                      <BreadcrumbPage>Employees</BreadcrumbPage>
                    </BreadcrumbItem>
                  )}
                </>
              )}

              {/* Recruitments section */}
              {(recruitmentsListMatch || isRecruitmentSubpage) && (
                <>
                  {isRecruitmentSubpage ? (
                    <>
                      <BreadcrumbItem>
                        <BreadcrumbLink
                          className="cursor-pointer"
                          onClick={() => navigate("/recruitments")}
                        >
                          Recruitments
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>
                          {recruitmentsNewMatch ? "Add Recruitment" : "Edit Recruitment"}
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  ) : (
                    <BreadcrumbItem>
                      <BreadcrumbPage>Recruitments</BreadcrumbPage>
                    </BreadcrumbItem>
                  )}
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
