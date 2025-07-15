import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Logo } from "@/components/Logo";

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cashier");
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string; role: string }) => {
      console.log("Attempting login with:", { username, role });
      return apiRequest("POST", "/api/auth/login", credentials);
    },
    onSuccess: async (response) => {
      console.log("Login successful, processing session data");
      
      // Get user data from login response
      const userData = await response.json();
      
      // Store session in localStorage
      const sessionData = {
        user: userData,
        timestamp: Date.now(),
        expiresAt: Date.now() + (8 * 60 * 60 * 1000) // 8 hours
      };
      localStorage.setItem("liberty_session", JSON.stringify(sessionData));
      
      toast({
        title: "Login realizado com sucesso",
        description: "Você está agora conectado",
      });
      
      console.log("Redirecting to dashboard with page reload");
      
      // Force page reload to reset all state and properly initialize with new session
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    },
    onError: (error) => {
      console.error("Login failed:", error);
      toast({
        title: "Erro de login",
        description: "Verifique suas credenciais",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password, role });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Logo size="md" />
          </div>
          <CardDescription className="text-gray-400">
            Faça login em sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">
                Nome de usuário
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="seu.nome"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-white">
                Função
              </Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Selecione sua função" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="cashier">Caixa</SelectItem>
                  <SelectItem value="server">Empregado</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
