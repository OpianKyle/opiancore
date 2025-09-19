import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Calendar, 
  Folder, 
  LogOut,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import OpianLogo from "@/assets/opian-logo";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Quotes", href: "/quotes", icon: FileText },
  { name: "Meetings", href: "/meetings", icon: Calendar },
  { name: "Documents", href: "/documents", icon: Folder },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth() as { user: any };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect even if logout fails
      window.location.href = "/";
    }
  };

  const getUserInitials = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <div className="w-64 bg-card border-r border-border fixed h-full z-40 shadow-lg">
      {/* Logo Header */}
      <div className="flex items-center justify-center p-6 border-b border-border">
        <OpianLogo className="h-12 w-auto" />
      </div>
      
      {/* Navigation Menu */}
      <nav className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <a
                    className={cn(
                      "flex items-center p-3 rounded-lg font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                    data-testid={`nav-${item.name.toLowerCase()}`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
        
        {/* User Account Section */}
        <div className="border-t border-border mt-8 pt-4">
          <div className="flex items-center p-3 rounded-lg bg-muted">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-sm mr-3">
              <span data-testid="text-user-initials">{getUserInitials(user)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate" data-testid="text-user-name">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.email || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate" data-testid="text-user-role">
                {user?.role === "admin" ? "Admin" : "Consultant"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
}
