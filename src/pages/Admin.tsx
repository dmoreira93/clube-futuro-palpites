// src/pages/Admin.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminTeams from "@/components/admin/AdminTeams";
import AdminGroups from "@/components/admin/AdminGroups";
import AdminMatches from "@/components/admin/AdminMatches";
import AdminUsers from "@/components/admin/AdminUsers";
// import AdminPredictions from "@/components/admin/AdminPredictions"; // Removido
// import AdminScoringCriteria from "@/components/admin/AdminScoringCriteria"; // Removido
import AdminTournamentResults from "@/components/admin/AdminTournamentResults"; // NOVO: Importar o componente
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, AlertTriangle, LogOut, Loader2 } from "lucide-react"; // Adicionado Loader2
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Admin = () => {
  const navigate = useNavigate();
  const { isAdmin, user, logout, isLoadingAuth } = useAuth(); // Usar isLoadingAuth do AuthContext
  const [isLoadingComponent, setIsLoadingComponent] = useState(true); // Estado local para o delay

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingComponent(false);
    }, 500); // Pequeno delay para evitar flash

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Se o AuthContext ainda está carregando ou o componente está com delay, não faça nada.
    if (isLoadingAuth || isLoadingComponent) {
      return;
    }

    // Se não for admin, redireciona para o login do admin
    if (!isAdmin) {
      navigate("/admin-login");
    }
  }, [isAdmin, navigate, isLoadingAuth, isLoadingComponent]); // Adicionado isLoadingAuth e isLoadingComponent

  const handleLogout = () => {
    logout();
    navigate("/admin-login");
  };

  // Loader inicial enquanto a autenticação e o delay estão ativos
  if (isLoadingAuth || isLoadingComponent || !isAdmin) { // Se não for admin, também mostra loader antes de redirecionar
    return (
      <Layout>
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-fifa-blue" />
          <p className="ml-2 text-fifa-blue">Carregando painel...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-fifa-blue">
            Painel Administrativo
          </h1>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
        <Alert className="mb-6 bg-yellow-50 border-yellow-300 text-yellow-800">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <AlertTitle>Atenção!</AlertTitle>
          <AlertDescription>
            Você está na área administrativa. As edições feitas aqui afetarão
            diretamente o sistema do bolão.
          </AlertDescription>
        </Alert>

        <Card className="p-4">
          <Tabs defaultValue="teams" className="space-y-4">
            {/* Reorganização e atualização das Tabs */}
            <TabsList className="grid grid-cols-5 md:w-full"> {/* Ajustado para 5 colunas */}
              <TabsTrigger value="teams">Times</TabsTrigger>
              <TabsTrigger value="groups">Grupos</TabsTrigger>
              <TabsTrigger value="matches">Partidas</TabsTrigger>
              <TabsTrigger value="tournament-results">Resultados Finais</TabsTrigger> {/* Nova Aba */}
              <TabsTrigger value="users">Usuários</TabsTrigger>
              {/* Removidas: "predictions" e "scoring" */}
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
            <TabsContent value="tournament-results" className="space-y-4"> {/* Novo Conteúdo */}
              <AdminTournamentResults />
            </TabsContent>
            <TabsContent value="users" className="space-y-4">
              <AdminUsers />
            </TabsContent>
            {/* Conteúdos Removidos: "predictions" e "scoring" */}
          </Tabs>
        </Card>
      </div>
    </Layout>
  );
};

export default Admin;