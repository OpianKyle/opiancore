import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import type { Client } from "@shared/schema";

interface RecentClientsProps {
  clients?: Client[];
  isLoading: boolean;
}

export default function RecentClients({ clients, isLoading }: RecentClientsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 animate-pulse">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-muted mr-3"></div>
                  <div>
                    <div className="h-4 bg-muted rounded w-32 mb-1"></div>
                    <div className="h-3 bg-muted rounded w-24"></div>
                  </div>
                </div>
                <div className="w-16 h-6 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentClients = clients?.slice(0, 3) || [];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "prospect":
        return "secondary";
      case "inactive":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-secondary";
      case "prospect":
        return "text-primary";
      case "inactive":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Clients</CardTitle>
          <Link 
            href="/clients"
            className="text-primary hover:text-primary/80 text-sm font-medium"
            data-testid="link-view-all-clients"
          >
            View All
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {recentClients.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No clients yet</p>
            <Link 
              href="/clients"
              className="text-primary hover:text-primary/80 text-sm"
            >
              Add your first client
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentClients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                data-testid={`recent-client-${client.id}`}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm mr-3">
                    <span>{client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground" data-testid={`recent-client-name-${client.id}`}>
                      {client.name}
                    </p>
                    {client.email && (
                      <p className="text-xs text-muted-foreground" data-testid={`recent-client-email-${client.id}`}>
                        {client.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusBadgeVariant(client.status)} className={getStatusColor(client.status)}>
                    {client.status}
                  </Badge>
                  <Button variant="ghost" size="sm" data-testid={`button-view-client-${client.id}`}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
