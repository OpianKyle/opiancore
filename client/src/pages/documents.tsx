import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Upload, File, Download, Trash2, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Client, Document } from "@shared/schema";

export default function Documents() {
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [uploadingFiles, setUploadingFiles] = useState<FileList | null>(null);
  const { toast } = useToast();

  const { data: clients, isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: documents, isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents", selectedClientId],
    enabled: !!selectedClientId,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ clientId, file }: { clientId: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch(`/api/documents/${clientId}/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Upload failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents", selectedClientId] });
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      setUploadingFiles(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await apiRequest("DELETE", `/api/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents", selectedClientId] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !selectedClientId) return;

    setUploadingFiles(files);
    Array.from(files).forEach(file => {
      uploadMutation.mutate({ clientId: selectedClientId, file });
    });
  };

  const handleDownload = async (document: Document) => {
    try {
      const response = await fetch(`/api/documents/${document.clientId}/${document.id}/download`, {
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = globalThis.document.createElement("a");
      a.href = url;
      a.download = document.originalName;
      globalThis.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      globalThis.document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDocument = (document: Document) => {
    if (confirm(`Are you sure you want to delete "${document.originalName}"?`)) {
      deleteMutation.mutate(document.id);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("word")) return "📝";
    if (mimeType.includes("excel")) return "📊";
    if (mimeType.includes("powerpoint")) return "📽️";
    if (mimeType.includes("image")) return "🖼️";
    return "📁";
  };

  const selectedClient = clients?.find((c: Client) => c.id === selectedClientId);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Documents</h1>
      </div>

      <div className="mb-6">
        <div className="max-w-md">
          <Select value={selectedClientId} onValueChange={setSelectedClientId} disabled={clientsLoading}>
            <SelectTrigger data-testid="select-client">
              <SelectValue placeholder="Select a client to view documents" />
            </SelectTrigger>
            <SelectContent>
              {clients?.map((client: Client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name} {client.company && `(${client.company})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedClientId ? (
        <div className="text-center py-12">
          <Folder className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Select a client</h3>
          <p className="text-muted-foreground">
            Choose a client from the dropdown above to view and manage their documents.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="mr-2 h-5 w-5" />
                Upload Documents for {selectedClient?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  data-testid="input-file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium text-foreground mb-1">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PDF, DOC, XLS, PPT, images up to 10MB
                  </span>
                </label>
              </div>
              {uploadMutation.isPending && (
                <p className="text-sm text-muted-foreground mt-2">
                  Uploading {uploadingFiles?.length || 0} file(s)...
                </p>
              )}
            </CardContent>
          </Card>

          {/* Documents List */}
          {documentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : documents?.length === 0 ? (
            <div className="text-center py-8">
              <File className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <h3 className="text-sm font-medium text-foreground mb-1">No documents yet</h3>
              <p className="text-xs text-muted-foreground">
                Upload the first document for this client.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents?.map((document: Document) => (
                <Card key={document.id} className="hover:shadow-md transition-shadow" data-testid={`card-document-${document.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="text-2xl">
                          {getFileIcon(document.mimeType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground truncate" data-testid={`text-document-name-${document.id}`}>
                            {document.originalName}
                          </h4>
                          <p className="text-xs text-muted-foreground" data-testid={`text-document-size-${document.id}`}>
                            {formatFileSize(document.size)}
                          </p>
                          <p className="text-xs text-muted-foreground" data-testid={`text-document-date-${document.id}`}>
                            {new Date(document.createdAt!).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(document)}
                          data-testid={`button-download-document-${document.id}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDocument(document)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-document-${document.id}`}
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
        </div>
      )}
    </div>
  );
}
