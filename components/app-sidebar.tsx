import {
  Calendar,
  Home,
  Inbox,
  Search,
  Settings,
  LayoutDashboard,
  HeartPulse,
  FileText,
  Map,
  Flame,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

import { ThemeSwitcher } from "@/components/theme-switcher";

// Menu items.
const items = [
  {
    title: "Home",
    url: "/home",
    icon: Home,
    variant: "default",
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    variant: "default",
  },
  {
    title: "Live Map",
    url: "/live-map",
    icon: Map,
    variant: "default",
  },
  {
    title: "Wildfire Map",
    url: "/wildfire-tracker",
    icon: Flame,
    variant: "default",
  },
  {
    title: "Emergency",
    url: "/emergency",
    icon: HeartPulse,
    variant: "default",
  },
  {
    title: "Medical Info",
    url: "/medical-info",
    icon: FileText,
    variant: "default",
  },

  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <ThemeSwitcher />
      </SidebarFooter>
    </Sidebar>
  );
}
