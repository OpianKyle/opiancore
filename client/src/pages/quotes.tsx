import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, FileText, Edit, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import QuoteForm from "@/components/quotes/quote-form";
import type { Quote } from "@shared/schema";

export default function Quotes() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const { toast } = useToast();

  const { data: quotes, isLoading } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  const { data: clients } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      await apiRequest("DELETE", `/api/quotes/${quoteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({
        title: "Success",
        description: "Quote deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete quote",
        variant: "destructive",
      });
    },
  });

  const handleDeleteQuote = (quote: Quote) => {
    if (confirm(`Are you sure you want to delete quote ${quote.quoteNumber}?`)) {
      deleteQuoteMutation.mutate(quote.id);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "draft":
        return "outline";
      case "sent":
        return "secondary";
      case "accepted":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "text-muted-foreground";
      case "sent":
        return "text-primary";
      case "accepted":
        return "text-secondary";
      case "rejected":
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
          <h1 className="text-2xl font-semibold">Quotes</h1>
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
        <h1 className="text-2xl font-semibold text-foreground">Quotes</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-quote">
              <Plus className="mr-2 h-4 w-4" />
              Create Quote
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Quote</DialogTitle>
            </DialogHeader>
            <QuoteForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {quotes?.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No quotes found</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first quote.
          </p>
          <Button onClick={() => setIsCreateOpen(true)} data-testid="button-add-first-quote">
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Quote
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quotes?.map((quote: Quote) => (
            <Card key={quote.id} className="hover:shadow-md transition-shadow" data-testid={`card-quote-${quote.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base" data-testid={`text-quote-number-${quote.id}`}>
                      {quote.quoteNumber}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground" data-testid={`text-quote-client-${quote.id}`}>
                      {getClientName(quote.clientId)}
                    </p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(quote.status)} className={getStatusColor(quote.status)}>
                    {quote.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm" data-testid={`text-quote-title-${quote.id}`}>
                    {quote.title}
                  </h4>
                  {quote.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2" data-testid={`text-quote-description-${quote.id}`}>
                      {quote.description}
                    </p>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-semibold text-foreground" data-testid={`text-quote-total-${quote.id}`}>
                      ${parseFloat(quote.total).toFixed(2)}
                    </span>
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingQuote(quote)}
                        data-testid={`button-edit-quote-${quote.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`button-download-quote-${quote.id}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteQuote(quote)}
                        disabled={deleteQuoteMutation.isPending}
                        data-testid={`button-delete-quote-${quote.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Quote Dialog */}
      <Dialog open={!!editingQuote} onOpenChange={() => setEditingQuote(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Quote</DialogTitle>
          </DialogHeader>
          {editingQuote && (
            <QuoteForm
              quote={editingQuote}
              onSuccess={() => setEditingQuote(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
