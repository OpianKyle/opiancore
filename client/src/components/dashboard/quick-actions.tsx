import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Upload, CalendarPlus, BarChart } from "lucide-react";

const quickActions = [
  {
    title: "Add New Client",
    description: "Create a new client profile",
    icon: UserPlus,
    href: "/clients",
    bgColor: "bg-primary/10",
    iconColor: "text-primary",
    testId: "action-add-client"
  },
  {
    title: "Upload Document",
    description: "Add files to client folder",
    icon: Upload,
    href: "/documents",
    bgColor: "bg-secondary/10",
    iconColor: "text-secondary",
    testId: "action-upload-document"
  },
  {
    title: "Schedule Meeting",
    description: "Book time with a client",
    icon: CalendarPlus,
    href: "/meetings",
    bgColor: "bg-accent",
    iconColor: "text-primary",
    testId: "action-schedule-meeting"
  },
  {
    title: "View Reports",
    description: "Analytics and insights",
    icon: BarChart,
    href: "/dashboard",
    bgColor: "bg-muted",
    iconColor: "text-muted-foreground",
    testId: "action-view-reports"
  },
];

export default function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-md">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href}>
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-3"
                  data-testid={action.testId}
                >
                  <div className={`p-2 rounded-lg ${action.bgColor} mr-3`}>
                    <Icon className={`${action.iconColor} h-4 w-4`} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
