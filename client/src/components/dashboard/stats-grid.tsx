import { Users, FileText, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsGridProps {
  stats?: {
    totalClients: number;
    activeQuotes: number;
    upcomingMeetings: number;
    monthlyRevenue: number;
  };
  isLoading: boolean;
}

export default function StatsGrid({ stats, isLoading }: StatsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-muted w-12 h-12"></div>
                <div className="ml-4">
                  <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                  <div className="h-6 bg-muted rounded w-16"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      name: "Total Clients",
      value: stats?.totalClients || 0,
      icon: Users,
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
      testId: "stat-total-clients"
    },
    {
      name: "Active Quotes",
      value: stats?.activeQuotes || 0,
      icon: FileText,
      bgColor: "bg-secondary/10",
      iconColor: "text-secondary",
      testId: "stat-active-quotes"
    },
    {
      name: "Meetings This Week",
      value: stats?.upcomingMeetings || 0,
      icon: Calendar,
      bgColor: "bg-accent",
      iconColor: "text-primary",
      testId: "stat-upcoming-meetings"
    },
    {
      name: "Revenue (MTD)",
      value: `$${(stats?.monthlyRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      bgColor: "bg-secondary/10",
      iconColor: "text-secondary",
      testId: "stat-monthly-revenue"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.name}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${item.bgColor}`}>
                  <Icon className={`${item.iconColor} text-xl h-5 w-5`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">{item.name}</p>
                  <p className="text-2xl font-bold text-foreground" data-testid={item.testId}>
                    {item.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
