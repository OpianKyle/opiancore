import { useQuery } from "@tanstack/react-query";
import StatsGrid from "@/components/dashboard/stats-grid";
import RecentClients from "@/components/dashboard/recent-clients";
import QuickQuoteForm from "@/components/dashboard/quick-quote-form";
import UpcomingMeetings from "@/components/dashboard/upcoming-meetings";
import QuickActions from "@/components/dashboard/quick-actions";
import RecentDocuments from "@/components/dashboard/recent-documents";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalClients: number;
    activeQuotes: number;
    upcomingMeetings: number;
    monthlyRevenue: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: clients, isLoading: clientsLoading } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });

  const { data: meetings, isLoading: meetingsLoading } = useQuery<any[]>({
    queryKey: ["/api/meetings"],
  });

  return (
    <div className="p-6">
      {/* Stats Overview */}
      <div className="mb-8">
        <StatsGrid stats={stats} isLoading={statsLoading} />
      </div>

      {/* Two Column Layout for Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <RecentClients clients={clients} isLoading={clientsLoading} />
          <QuickQuoteForm clients={clients} />
        </div>

        {/* Sidebar Content */}
        <div className="space-y-6">
          <UpcomingMeetings meetings={meetings} isLoading={meetingsLoading} />
          <QuickActions />
          <RecentDocuments />
        </div>
      </div>
    </div>
  );
}
