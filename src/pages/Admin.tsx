
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminTeams from "@/components/admin/AdminTeams";
import AdminGroups from "@/components/admin/AdminGroups";
import AdminMatches from "@/components/admin/AdminMatches";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // In a real app, this would be based on authentication

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <Alert className="bg-destructive/20 border-destructive mb-6">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertTitle className="text-destructive">Acesso negado</AlertTitle>
            <AlertDescription>
              Você não tem permissão para acessar esta área. Por favor, contate o administrador.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8 text-fifa-blue" />
          <h1 className="text-3xl font-bold text-fifa-blue">Painel Administrativo</h1>
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
