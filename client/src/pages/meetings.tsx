import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Calendar, Edit, Trash2, Clock } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import MeetingForm from "@/components/meetings/meeting-form";
import type { Meeting } from "@shared/schema";

export default function Meetings() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const { toast } = useToast();

  const { data: meetings, isLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });

  const { data: clients } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: async (meetingId: string) => {
      await apiRequest("DELETE", `/api/meetings/${meetingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({
        title: "Success",
        description: "Meeting deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete meeting",
        variant: "destructive",
      });
    },
  });

  const handleDeleteMeeting = (meeting: Meeting) => {
    if (confirm(`Are you sure you want to delete the meeting "${meeting.title}"?`)) {
      deleteMeetingMutation.mutate(meeting.id);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "scheduled":
        return "secondary";
      case "confirmed":
        return "default";
      case "completed":
        return "outline";
      case "cancelled":
        return "destructive";
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
      case "completed":
        return "text-muted-foreground";
      case "cancelled":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients?.find((c: any) => c.id === clientId);
    return client?.name || "Unknown Client";
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Meetings</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Meetings</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-meeting">
              <Plus className="mr-2 h-4 w-4" />
              Schedule Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule New Meeting</DialogTitle>
            </DialogHeader>
            <MeetingForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {meetings?.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No meetings scheduled</h3>
          <p className="text-muted-foreground mb-4">
            Get started by scheduling your first meeting with a client.
          </p>
          <Button onClick={() => setIsCreateOpen(true)} data-testid="button-add-first-meeting">
            <Plus className="mr-2 h-4 w-4" />
            Schedule Your First Meeting
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings?.map((meeting: Meeting) => (
            <Card key={meeting.id} className="hover:shadow-md transition-shadow" data-testid={`card-meeting-${meeting.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base" data-testid={`text-meeting-title-${meeting.id}`}>
                      {meeting.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground" data-testid={`text-meeting-client-${meeting.id}`}>
                      with {getClientName(meeting.clientId)}
                    </p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(meeting.status)} className={getStatusColor(meeting.status)}>
                    {meeting.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span data-testid={`text-meeting-date-${meeting.id}`}>
                      {format(new Date(meeting.scheduledAt), "PPP")}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-2 h-4 w-4" />
                    <span data-testid={`text-meeting-time-${meeting.id}`}>
                      {format(new Date(meeting.scheduledAt), "p")} ({meeting.duration} min)
                    </span>
                  </div>
                  {meeting.location && (
                    <p className="text-sm text-muted-foreground" data-testid={`text-meeting-location-${meeting.id}`}>
                      📍 {meeting.location}
                    </p>
                  )}
                  {meeting.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2" data-testid={`text-meeting-description-${meeting.id}`}>
                      {meeting.description}
                    </p>
                  )}
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingMeeting(meeting)}
                      data-testid={`button-edit-meeting-${meeting.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteMeeting(meeting)}
                      disabled={deleteMeetingMutation.isPending}
                      data-testid={`button-delete-meeting-${meeting.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Meeting Dialog */}
      <Dialog open={!!editingMeeting} onOpenChange={() => setEditingMeeting(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Meeting</DialogTitle>
          </DialogHeader>
          {editingMeeting && (
            <MeetingForm
              meeting={editingMeeting}
              onSuccess={() => setEditingMeeting(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
