
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminTeams from "@/components/admin/AdminTeams";
import AdminGroups from "@/components/admin/AdminGroups";
import AdminMatches from "@/components/admin/AdminMatches";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, AlertTriangle, LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Admin = () => {
  const navigate = useNavigate();
  const { isAdmin, user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Small delay to prevent flash of unauthorized content
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/admin-login");
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-fifa-blue border-t-transparent rounded-full inline-block mb-4"></div>
            <p className="text-gray-600">Verificando credenciais...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <Alert className="bg-destructive/20 border-destructive mb-6">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertTitle className="text-destructive">Acesso negado</AlertTitle>
            <AlertDescription>
              Você precisa estar autenticado como administrador para acessar esta área.
            </AlertDescription>
          </Alert>
          
          <div className="text-center mt-8">
            <Button 
              onClick={() => navigate("/admin-login")} 
              className="bg-fifa-blue hover:bg-opacity-90"
            >
              Ir para Login de Administrador
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-fifa-blue" />
            <h1 className="text-3xl font-bold text-fifa-blue">Painel Administrativo</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Olá, {user?.name}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              Sair
            </Button>
          </div>
        </div>

        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertTitle className="text-amber-800">Área restrita</AlertTitle>
          <AlertDescription className="text-amber-700">
            Esta área é exclusiva para administradores. Todas as alterações feitas aqui afetarão diretamente o sistema do bolão.
          </AlertDescription>
        </Alert>

        <Card className="p-4">
          <Tabs defaultValue="teams" className="space-y-4">
            <TabsList className="grid grid-cols-3 md:w-[400px]">
              <TabsTrigger value="teams">Times</TabsTrigger>
              <TabsTrigger value="groups">Grupos</TabsTrigger>
              <TabsTrigger value="matches">Partidas</TabsTrigger>
            </TabsList>
            <TabsContent value="teams" className="space-y-4">
              <AdminTeams />
            </TabsContent>
            <TabsContent value="groups" className="space-y-4">
              <AdminGroups />
            </TabsContent>
            <TabsContent value="matches" className="space-y-4">
              <AdminMatches />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </Layout>
  );
};

export default Admin;
