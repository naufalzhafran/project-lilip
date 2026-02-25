import { Users, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate, useMatch } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavItem {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { id: "dashboard", path: "/dashboard", label: "Employees", icon: Users },
  { id: "recruitments", path: "/recruitments", label: "Recruitments", icon: UserPlus },
];

export default function AppSidebar() {
  const navigate = useNavigate();
  const dashboardMatch = useMatch("/dashboard");
  const recruitmentsMatch = useMatch("/recruitments");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-extrabold tracking-wide">
            D
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-bold text-foreground leading-tight">Dashboard</p>
            <p className="text-[11px] text-muted-foreground">Recruitment System</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarMenu>
            {NAV.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  isActive={!!(item.id === "dashboard" ? dashboardMatch : recruitmentsMatch)}
                  onClick={() => navigate(item.path)}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
