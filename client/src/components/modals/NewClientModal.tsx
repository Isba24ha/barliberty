import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const newClientSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  creditLimit: z.number().min(0, "Limite de crédito deve ser positivo").default(0),
});

type NewClientForm = z.infer<typeof newClientSchema>;

interface NewClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated?: (client: any) => void;
}

export function NewClientModal({ open, onOpenChange, onClientCreated }: NewClientModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<NewClientForm>({
    resolver: zodResolver(newClientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
      creditLimit: 0,
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: NewClientForm) => {
      return apiRequest("POST", "/api/credit-clients", {
        ...data,
        totalCredit: "0.00",
        creditLimit: data.creditLimit.toString(),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Sucesso",
        description: "Cliente criado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/credit-clients"] });
      onClientCreated?.(data);
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar cliente",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NewClientForm) => {
    createClientMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center">
            <UserPlus className="w-5 h-5 mr-2 text-blue-400" />
            Novo Cliente de Crédito
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-300">
                    Nome Completo *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: João Silva"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-300">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="Ex: joao@exemplo.com"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-300">
                    Telefone
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder="Ex: +245 123 456 789"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="creditLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-300">
                    Limite de Crédito
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="bg-gray-700 border-gray-600 text-white"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-300">
                    Endereço
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Endereço completo..."
                      className="bg-gray-700 border-gray-600 text-white min-h-[60px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-300">
                    Observações
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Observações sobre o cliente..."
                      className="bg-gray-700 border-gray-600 text-white min-h-[60px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3">
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="flex-1 border-gray-600 hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createClientMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {createClientMutation.isPending ? "Criando..." : "Criar Cliente"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}