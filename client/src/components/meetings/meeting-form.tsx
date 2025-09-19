import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertMeetingSchema, type Meeting, type InsertMeeting } from "@shared/schema";
import { z } from "zod";

const meetingFormSchema = insertMeetingSchema.extend({
  clientId: z.string().min(1, "Client is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  scheduledAt: z.string().min(1, "Date and time is required"),
  duration: z.number().min(15, "Duration must be at least 15 minutes").default(60),
  location: z.string().optional(),
  agenda: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["scheduled", "confirmed", "completed", "cancelled"]).default("scheduled"),
});

type MeetingFormData = z.infer<typeof meetingFormSchema>;

interface MeetingFormProps {
  meeting?: Meeting;
  onSuccess: () => void;
}

export default function MeetingForm({ meeting, onSuccess }: MeetingFormProps) {
  const { toast } = useToast();
  const isEditing = !!meeting;

  const { data: clients } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });

  const form = useForm<MeetingFormData>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: {
      clientId: "",
      title: "",
      description: "",
      scheduledAt: "",
      duration: 60,
      location: "",
      agenda: "",
      notes: "",
      status: "scheduled",
    },
  });

  useEffect(() => {
    if (meeting) {
      const scheduledAt = new Date(meeting.scheduledAt).toISOString().slice(0, 16);
      
      form.reset({
        clientId: meeting.clientId,
        title: meeting.title,
        description: meeting.description || "",
        scheduledAt,
        duration: meeting.duration,
        location: meeting.location || "",
        agenda: meeting.agenda || "",
        notes: meeting.notes || "",
        status: meeting.status as "scheduled" | "confirmed" | "completed" | "cancelled",
      });
    }
  }, [meeting, form]);

  const createMeetingMutation = useMutation({
    mutationFn: async (data: MeetingFormData) => {
      const payload = {
        ...data,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
      };

      if (isEditing) {
        const response = await apiRequest("PUT", `/api/meetings/${meeting.id}`, payload);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/meetings", payload);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: `Meeting ${isEditing ? "updated" : "scheduled"} successfully`,
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? "update" : "schedule"} meeting`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MeetingFormData) => {
    createMeetingMutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="clientId">Client *</Label>
          <Select
            value={form.watch("clientId")}
            onValueChange={(value) => form.setValue("clientId", value)}
          >
            <SelectTrigger data-testid="select-meeting-client">
              <SelectValue placeholder="Select a client..." />
            </SelectTrigger>
            <SelectContent>
              {clients?.map((client: any) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name} {client.company && `(${client.company})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.clientId && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.clientId.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={form.watch("status")}
            onValueChange={(value) => form.setValue("status", value as "scheduled" | "confirmed" | "completed" | "cancelled")}
          >
            <SelectTrigger data-testid="select-meeting-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="title">Meeting Title *</Label>
        <Input
          id="title"
          {...form.register("title")}
          placeholder="Meeting title"
          data-testid="input-meeting-title"
        />
        {form.formState.errors.title && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...form.register("description")}
          placeholder="Meeting description"
          rows={3}
          className="resize-none"
          data-testid="textarea-meeting-description"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="scheduledAt">Date & Time *</Label>
          <Input
            id="scheduledAt"
            type="datetime-local"
            {...form.register("scheduledAt")}
            data-testid="input-meeting-datetime"
          />
          {form.formState.errors.scheduledAt && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.scheduledAt.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            min="15"
            step="15"
            {...form.register("duration", { valueAsNumber: true })}
            data-testid="input-meeting-duration"
          />
          {form.formState.errors.duration && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.duration.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          {...form.register("location")}
          placeholder="Meeting location or video call link"
          data-testid="input-meeting-location"
        />
      </div>

      <div>
        <Label htmlFor="agenda">Agenda</Label>
        <Textarea
          id="agenda"
          {...form.register("agenda")}
          placeholder="Meeting agenda and topics to discuss"
          rows={3}
          className="resize-none"
          data-testid="textarea-meeting-agenda"
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...form.register("notes")}
          placeholder="Additional notes about the meeting"
          rows={3}
          className="resize-none"
          data-testid="textarea-meeting-notes"
        />
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
          data-testid="button-cancel-meeting"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={createMeetingMutation.isPending}
          data-testid="button-save-meeting"
        >
          {createMeetingMutation.isPending
            ? "Saving..."
            : isEditing
            ? "Update Meeting"
            : "Schedule Meeting"}
        </Button>
      </div>
    </form>
  );
}
