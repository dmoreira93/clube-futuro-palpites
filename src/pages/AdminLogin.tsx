
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { adminLogin, isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  // If already logged in as admin, redirect to admin panel
  if (isAdmin) {
    return <Navigate to="/admin" />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    
    if (!formData.username || !formData.password) {
      setLoginError("Por favor, preencha todos os campos");
      return;
    }

    setIsSubmitting(true);
    const success = await adminLogin(formData.username, formData.password);
    setIsSubmitting(false);
    
    if (success) {
      navigate("/admin");
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-fifa-blue">Área Restrita</h1>
          <p className="text-gray-600 mt-2">
            Acesso exclusivo para administradores
          </p>
        </div>

        <Card className="shadow-lg border-fifa-blue">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <div className="bg-fifa-blue rounded-full p-3">
                <ShieldAlert className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-center">Administração</CardTitle>
            <CardDescription className="text-center">
              Entre com suas credenciais de administrador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              {loginError && (
                <Alert className="mb-4 bg-destructive/10 border-destructive">
                  <AlertDescription className="text-destructive">
                    {loginError}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Nome de usuário</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Nome de usuário de administrador"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Senha de administrador"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>Credenciais padrão:</p>
                  <p>Usuário: admin</p>
                  <p>Senha: admin123</p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-fifa-blue hover:bg-opacity-90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Autenticando...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Lock className="h-4 w-4 mr-2" />
                      Acessar Painel
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <div className="text-center text-sm text-gray-500">
              Acesso restrito para administradores autorizados.
            </div>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminLogin;
