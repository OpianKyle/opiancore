import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertQuoteSchema, type Quote, type InsertQuote } from "@shared/schema";
import { z } from "zod";

const quoteItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  rate: z.number().min(0, "Rate must be non-negative"),
  amount: z.number().min(0, "Amount must be non-negative"),
});

const quoteFormSchema = insertQuoteSchema.extend({
  clientId: z.string().min(1, "Client is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, "At least one item is required"),
  subtotal: z.number(),
  tax: z.number(),
  total: z.number(),
  validUntil: z.string().optional(),
  status: z.enum(["draft", "sent", "accepted", "rejected"]).default("draft"),
});

type QuoteFormData = z.infer<typeof quoteFormSchema>;

interface QuoteFormProps {
  quote?: Quote;
  onSuccess: () => void;
}

export default function QuoteForm({ quote, onSuccess }: QuoteFormProps) {
  const { toast } = useToast();
  const isEditing = !!quote;

  const { data: clients } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      clientId: "",
      title: "",
      description: "",
      items: [{ description: "", quantity: 1, rate: 0, amount: 0 }],
      subtotal: 0,
      tax: 0,
      total: 0,
      validUntil: "",
      status: "draft",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (quote) {
      const validUntil = quote.validUntil 
        ? new Date(quote.validUntil).toISOString().split('T')[0] 
        : "";
      
      form.reset({
        clientId: quote.clientId,
        title: quote.title,
        description: quote.description || "",
        items: Array.isArray(quote.items) ? quote.items : [{ description: "", quantity: 1, rate: 0, amount: 0 }],
        subtotal: parseFloat(quote.subtotal),
        tax: parseFloat(quote.tax),
        total: parseFloat(quote.total),
        validUntil,
        status: quote.status as "draft" | "sent" | "accepted" | "rejected",
      });
    }
  }, [quote, form]);

  const calculateTotals = () => {
    const items = form.getValues("items");
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const tax = subtotal * 0.1; // 10% tax rate
    const total = subtotal + tax;

    form.setValue("subtotal", subtotal);
    form.setValue("tax", tax);
    form.setValue("total", total);
  };

  const updateItemAmount = (index: number) => {
    const quantity = form.getValues(`items.${index}.quantity`);
    const rate = form.getValues(`items.${index}.rate`);
    const amount = quantity * rate;
    form.setValue(`items.${index}.amount`, amount);
    calculateTotals();
  };

  const createQuoteMutation = useMutation({
    mutationFn: async (data: QuoteFormData) => {
      const payload = {
        ...data,
        items: data.items,
        subtotal: data.subtotal.toString(),
        tax: data.tax.toString(),
        total: data.total.toString(),
        validUntil: data.validUntil ? new Date(data.validUntil).toISOString() : null,
      };

      if (isEditing) {
        const response = await apiRequest("PUT", `/api/quotes/${quote.id}`, payload);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/quotes", payload);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: `Quote ${isEditing ? "updated" : "created"} successfully`,
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? "update" : "create"} quote`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: QuoteFormData) => {
    createQuoteMutation.mutate(data);
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
            <SelectTrigger data-testid="select-quote-client">
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
            onValueChange={(value) => form.setValue("status", value as "draft" | "sent" | "accepted" | "rejected")}
          >
            <SelectTrigger data-testid="select-quote-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Quote Title *</Label>
          <Input
            id="title"
            {...form.register("title")}
            placeholder="Quote title"
            data-testid="input-quote-title"
          />
          {form.formState.errors.title && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.title.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="validUntil">Valid Until</Label>
          <Input
            id="validUntil"
            type="date"
            {...form.register("validUntil")}
            data-testid="input-quote-valid-until"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...form.register("description")}
          placeholder="Quote description"
          rows={3}
          className="resize-none"
          data-testid="textarea-quote-description"
        />
      </div>

      {/* Quote Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quote Items</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ description: "", quantity: 1, rate: 0, amount: 0 })}
              data-testid="button-add-quote-item"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-border rounded-lg">
                <div className="md:col-span-2">
                  <Label htmlFor={`items.${index}.description`}>Description</Label>
                  <Input
                    {...form.register(`items.${index}.description`)}
                    placeholder="Item description"
                    data-testid={`input-quote-item-description-${index}`}
                  />
                </div>

                <div>
                  <Label htmlFor={`items.${index}.quantity`}>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    {...form.register(`items.${index}.quantity`, {
                      valueAsNumber: true,
                      onChange: () => updateItemAmount(index),
                    })}
                    data-testid={`input-quote-item-quantity-${index}`}
                  />
                </div>

                <div>
                  <Label htmlFor={`items.${index}.rate`}>Rate</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...form.register(`items.${index}.rate`, {
                      valueAsNumber: true,
                      onChange: () => updateItemAmount(index),
                    })}
                    data-testid={`input-quote-item-rate-${index}`}
                  />
                </div>

                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      readOnly
                      {...form.register(`items.${index}.amount`, { valueAsNumber: true })}
                      className="bg-muted"
                      data-testid={`input-quote-item-amount-${index}`}
                    />
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        remove(index);
                        calculateTotals();
                      }}
                      data-testid={`button-remove-quote-item-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 space-y-2 max-w-md ml-auto">
            <div className="flex justify-between">
              <Label>Subtotal:</Label>
              <span className="font-medium" data-testid="text-quote-subtotal">
                ${form.watch("subtotal")}
              </span>
            </div>
            <div className="flex justify-between">
              <Label>Tax (10%):</Label>
              <span className="font-medium" data-testid="text-quote-tax">
                ${form.watch("tax")}
              </span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <Label>Total:</Label>
              <span data-testid="text-quote-total">
                ${form.watch("total")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
          data-testid="button-cancel-quote"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={createQuoteMutation.isPending}
          data-testid="button-save-quote"
        >
          {createQuoteMutation.isPending
            ? "Saving..."
            : isEditing
            ? "Update Quote"
            : "Create Quote"}
        </Button>
      </div>
    </form>
  );
}
