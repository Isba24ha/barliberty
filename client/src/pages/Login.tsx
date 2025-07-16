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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string; role: string }) => {
      setIsLoading(true);
      
      // Enhanced input validation
      if (!credentials.username?.trim()) {
        throw new Error("Username é obrigatório");
      }
      if (!credentials.password?.trim()) {
        throw new Error("Password é obrigatório");
      }
      if (!credentials.role?.trim()) {
        throw new Error("Role é obrigatório");
      }
      
      console.log("Attempting login with:", { 
        username: credentials.username, 
        role: credentials.role 
      });
      
      return apiRequest("POST", "/api/auth/login", {
        username: credentials.username.trim(),
        password: credentials.password,
        role: credentials.role.trim()
      });
    },
    onSuccess: async (response) => {
      try {
        console.log("Login successful, processing response");
        
        // Get response data
        const responseData = await response.json();
        console.log("Login response:", responseData);
        
        // Enhanced response validation
        if (!responseData.user) {
          throw new Error("Dados do usuário não recebidos");
        }
        
        const { user, session, message } = responseData;
        
        // Validate user data
        if (!user.id || !user.role || !user.firstName) {
          throw new Error("Dados do usuário incompletos");
        }
        
        // Store enhanced session in localStorage
        const sessionData = {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            profileImageUrl: user.profileImageUrl
          },
          timestamp: Date.now(),
          expiresAt: session?.expiresAt ? new Date(session.expiresAt).getTime() : Date.now() + (8 * 60 * 60 * 1000),
          loginTime: session?.loginTime || new Date().toISOString()
        };
        
        localStorage.setItem("liberty_session", JSON.stringify(sessionData));
        console.log("Session stored in localStorage:", sessionData);
        
        // Clear all queries to force fresh data loading
        queryClient.clear();
        
        // Show brief welcome message
        toast({
          title: "Bem-vindo!",
          description: `Olá, ${user.firstName}!`,
        });
        
        console.log("Redirecting user based on role:", user.role);
        
        // Enhanced role-based redirection
        let redirectPath = "/dashboard";
        let dashboardType = "operational";
        
        if (user.role === "manager") {
          redirectPath = "/manager";
          dashboardType = "management";
        } else if (user.role === "cashier" || user.role === "server") {
          redirectPath = "/dashboard";
          dashboardType = "operational";
        }
        
        console.log(`Redirecting to ${dashboardType} dashboard:`, redirectPath);
        
        // Use client-side routing since session is now properly maintained
        setTimeout(() => {
          setLocation(redirectPath);
          console.log("Client-side navigation completed to:", redirectPath);
        }, 300); // Shorter delay for smoother UX
        
      } catch (error) {
        console.error("Error processing login response:", error);
        toast({
          title: "Erro de processamento",
          description: error instanceof Error ? error.message : "Erro ao processar login",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error("Login failed:", error);
      setIsLoading(false);
      
      // Enhanced error handling
      let errorMessage = "Verifique suas credenciais";
      let errorTitle = "Erro de login";
      
      if (error instanceof Error) {
        if (error.message.includes("400")) {
          errorMessage = "Dados incompletos. Verifique todos os campos.";
        } else if (error.message.includes("401")) {
          errorMessage = "Credenciais inválidas. Verifique username, password e role.";
        } else if (error.message.includes("403")) {
          errorMessage = "Conta desativada. Contacte o administrador.";
          errorTitle = "Acesso negado";
        } else if (error.message.includes("500")) {
          errorMessage = "Erro interno do servidor. Tente novamente.";
          errorTitle = "Erro do servidor";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isLoading) return;
    
    // Client-side validation
    if (!username.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Username é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
    if (!password.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Password é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
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
                className={`bg-gray-700 border-gray-600 text-white ${isLoading ? 'opacity-50' : ''}`}
                placeholder="seu.nome"
                required
                disabled={isLoading}
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
                className={`bg-gray-700 border-gray-600 text-white ${isLoading ? 'opacity-50' : ''}`}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-white">
                Função
              </Label>
              <Select value={role} onValueChange={setRole} disabled={isLoading}>
                <SelectTrigger className={`bg-gray-700 border-gray-600 text-white ${isLoading ? 'opacity-50' : ''}`}>
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
              disabled={isLoading || loginMutation.isPending}
            >
              {isLoading || loginMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Entrando...
                </div>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
