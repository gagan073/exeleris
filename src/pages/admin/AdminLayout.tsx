import { NavLink, Navigate, Outlet } from "react-router-dom";
import {
  BarChart3,
  CreditCard,
  Settings as SettingsIcon,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Overview", icon: BarChart3, end: true },
  { to: "/admin/users", label: "Users", icon: Users, end: false },
  { to: "/admin/experts", label: "Experts", icon: ShieldCheck, end: false },
  { to: "/admin/transactions", label: "Transactions", icon: CreditCard, end: false },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon, end: false },
] as const;

// Shared shell for every Super Admin screen. The route in App.tsx already blocks
// non-admins; this re-checks the role as a second line of defence (requirement:
// nothing here is visible to anyone but the Super Admin).
const AdminLayout = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile || profile.role !== "super_admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20">
        <div className="container mx-auto px-6 py-10">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-accent mb-1">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">
                Super Admin
              </span>
            </div>
            <h1 className="text-4xl font-bold text-foreground">Platform Control</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Watch every transaction and control how the platform earns.
            </p>
          </div>

          <nav className="flex flex-wrap gap-2 border-b border-border mb-8">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors",
                    isActive
                      ? "border-accent text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  )
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
