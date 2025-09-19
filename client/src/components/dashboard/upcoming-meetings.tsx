import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Plus } from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";
import type { Meeting } from "@shared/schema";

interface UpcomingMeetingsProps {
  meetings?: Meeting[];
  isLoading: boolean;
}

export default function UpcomingMeetings({ meetings, isLoading }: UpcomingMeetingsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-muted/50 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter for upcoming meetings and sort by scheduled time
  const upcomingMeetings = meetings
    ?.filter(meeting => new Date(meeting.scheduledAt) > new Date() && meeting.status !== 'cancelled')
    ?.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    ?.slice(0, 3) || [];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "scheduled":
        return "secondary";
      case "confirmed":
        return "default";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "text-primary";
      case "confirmed":
        return "text-secondary";
      default:
        return "text-muted-foreground";
    }
  };

  const formatMeetingTime = (scheduledAt: string) => {
    const date = new Date(scheduledAt);
    
    if (isToday(date)) {
      return `Today, ${format(date, "p")}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow, ${format(date, "p")}`;
    } else {
      return format(date, "PPp");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-md">Upcoming Meetings</CardTitle>
          <Link href="/meetings">
            <Button variant="ghost" size="sm" data-testid="button-schedule-new-meeting">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {upcomingMeetings.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-2">No upcoming meetings</p>
            <Link href="/meetings">
              <a className="text-primary hover:text-primary/80 text-sm">Schedule a meeting</a>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="p-3 rounded-lg border border-border bg-muted/50"
                data-testid={`upcoming-meeting-${meeting.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground" data-testid={`meeting-title-${meeting.id}`}>
                      {meeting.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Client Meeting
                    </p>
                    <div className="flex items-center mt-2 text-xs text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      <span data-testid={`meeting-time-${meeting.id}`}>
                        {formatMeetingTime(meeting.scheduledAt.toString())}
                      </span>
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(meeting.status)} className={getStatusColor(meeting.status)}>
                    {meeting.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
