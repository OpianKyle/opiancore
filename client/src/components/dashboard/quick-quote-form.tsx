import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Client } from "@shared/schema";

interface QuickQuoteFormProps {
  clients?: Client[];
}

export default function QuickQuoteForm({ clients }: QuickQuoteFormProps) {
  const [formData, setFormData] = useState({
    clientId: "",
    title: "",
    description: "",
    estimatedValue: "",
  });
  const { toast } = useToast();

  const createQuoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/quotes", {
        clientId: data.clientId,
        title: data.title,
        description: data.description,
        items: [
          {
            description: data.title,
            quantity: 1,
            rate: parseFloat(data.estimatedValue) || 0,
            amount: parseFloat(data.estimatedValue) || 0,
          }
        ],
        subtotal: data.estimatedValue,
        tax: "0",
        total: data.estimatedValue,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({
        title: "Success",
        description: "Quote created successfully",
      });
      setFormData({
        clientId: "",
        title: "",
        description: "",
        estimatedValue: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create quote",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.title || !formData.estimatedValue) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createQuoteMutation.mutate(formData);
  };

  const handleReset = () => {
    setFormData({
      clientId: "",
      title: "",
      description: "",
      estimatedValue: "",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Quote</CardTitle>
        <p className="text-sm text-muted-foreground">Generate a professional quote for your client</p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">Client</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => setFormData({ ...formData, clientId: value })}
              >
                <SelectTrigger data-testid="select-quick-quote-client">
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} {client.company && `(${client.company})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="estimatedValue">Estimated Value</Label>
              <Input
                id="estimatedValue"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.estimatedValue}
                onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                data-testid="input-quick-quote-value"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="title">Product/Service</Label>
            <Input
              id="title"
              placeholder="Enter product or service name"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              data-testid="input-quick-quote-title"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Notes (Optional)</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Additional notes for this quote..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="resize-none"
              data-testid="textarea-quick-quote-description"
            />
          </div>
          
          <div className="flex space-x-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={createQuoteMutation.isPending}
              data-testid="button-generate-quote"
            >
              <FileText className="mr-2 h-4 w-4" />
              {createQuoteMutation.isPending ? "Creating..." : "Generate Quote"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              data-testid="button-reset-quote-form"
            >
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
