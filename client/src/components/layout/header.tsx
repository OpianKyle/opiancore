import { useLocation } from "wouter";
import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QuoteForm from "@/components/quotes/quote-form";

const pageTitles = {
  "/": "Dashboard",
  "/clients": "Clients",
  "/quotes": "Quotes",
  "/meetings": "Meetings",
  "/documents": "Documents",
};

const pageDescriptions = {
  "/": "Welcome back, manage your clients and quotes",
  "/clients": "Manage your client relationships",
  "/quotes": "Create and manage quotes",
  "/meetings": "Schedule and track meetings",
  "/documents": "Organize client documents",
};

export default function Header() {
  const [location] = useLocation();
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  
  const title = pageTitles[location as keyof typeof pageTitles] || "Page";
  const description = pageDescriptions[location as keyof typeof pageDescriptions] || "";

  return (
    <>
      <header className="bg-card border-b border-border p-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">{title}</h1>
            {description && (
              <p className="text-muted-foreground" data-testid="text-page-description">{description}</p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              className="relative"
              data-testid="button-notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center">
                3
              </span>
            </Button>
            <Button
              onClick={() => setIsQuoteModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              data-testid="button-new-quote"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Quote
            </Button>
          </div>
        </div>
      </header>

      {/* Quick Quote Modal */}
      <Dialog open={isQuoteModalOpen} onOpenChange={setIsQuoteModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Quote</DialogTitle>
          </DialogHeader>
          <QuoteForm onSuccess={() => setIsQuoteModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
