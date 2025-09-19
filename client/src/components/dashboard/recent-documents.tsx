import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

// Mock recent documents for display purposes
const recentDocuments = [
  {
    id: "1",
    name: "Quote_Sample_Corp_Jan2025.pdf",
    uploadedAt: "2 hours ago",
    type: "pdf"
  },
  {
    id: "2",
    name: "Contract_TechCorp.docx",
    uploadedAt: "1 day ago",
    type: "word"
  },
  {
    id: "3",
    name: "Analysis_GlobalInc.xlsx",
    uploadedAt: "3 days ago",
    type: "excel"
  },
];

export default function RecentDocuments() {
  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return "📄";
      case "word":
        return "📝";
      case "excel":
        return "📊";
      default:
        return "📁";
    }
  };

  const getFileIconColor = (type: string) => {
    switch (type) {
      case "pdf":
        return "text-destructive";
      case "word":
        return "text-secondary";
      case "excel":
        return "text-primary";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-md">Recent Documents</CardTitle>
          <Link href="/documents">
            <a className="text-primary hover:text-primary/80 text-sm" data-testid="link-view-all-documents">
              View All
            </a>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentDocuments.map((document) => (
            <div
              key={document.id}
              className="flex items-center p-2 rounded-lg hover:bg-muted/50 transition-colors"
              data-testid={`recent-document-${document.id}`}
            >
              <div className={`p-2 rounded bg-muted mr-3 ${getFileIconColor(document.type)}`}>
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate" data-testid={`document-name-${document.id}`}>
                  {document.name}
                </p>
                <p className="text-xs text-muted-foreground" data-testid={`document-time-${document.id}`}>
                  {document.uploadedAt}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground"
                data-testid={`button-download-document-${document.id}`}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
