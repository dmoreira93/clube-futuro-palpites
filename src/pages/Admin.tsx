// src/pages/Admin.tsx (VERSÃO ATUALIZADA)

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminTeams from "@/components/admin/AdminTeams";
import AdminGroups from "@/components/admin/AdminGroups";
import AdminMatches from "@/components/admin/AdminMatches";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminTournamentResults from "@/components/admin/AdminTournamentResults";
import AdminChampionships from "@/components/admin/AdminChampionships"; // Importado
import AdminScoringCriteria from "@/components/admin/AdminScoringCriteria"; // Importado
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, LogOut, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { PoolSelector } from "@/components/admin/PoolSelector";

const Admin = () => {
  const navigate = useNavigate();
  // Corrigido para usar signOut, conforme definido no AuthContext
  const { isAdmin, signOut, isLoadingAuth } = useAuth();
  const [isLoadingComponent, setIsLoadingComponent] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingComponent(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoadingAuth || isLoadingComponent) {
      return;
    }
    if (!isAdmin) {
      navigate("/admin-login");
    }
  }, [isAdmin, navigate, isLoadingAuth, isLoadingComponent]);

  const handleLogout = () => {
    signOut(); // Usando signOut
    navigate("/admin-login");
  };

  if (isLoadingAuth || isLoadingComponent) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-fifa-blue" />
        <p className="ml-2 text-fifa-blue">Carregando painel...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminProvider>
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

        {/* Seletor de Bolão - NOVO */}
        <PoolSelector />

        <Card className="p-4">
          <Tabs defaultValue="championships" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
              <TabsTrigger value="championships">Campeonatos</TabsTrigger>
              <TabsTrigger value="scoring">Pontuação</TabsTrigger>
              <TabsTrigger value="teams">Times</TabsTrigger>
              <TabsTrigger value="groups">Grupos</TabsTrigger>
              <TabsTrigger value="matches">Partidas</TabsTrigger>
              <TabsTrigger value="tournament-results">Resultados</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
            </TabsList>
            
            <TabsContent value="championships" className="space-y-4">
              <AdminChampionships />
            </TabsContent>

            <TabsContent value="scoring" className="space-y-4">
              <AdminScoringCriteria />
            </TabsContent>

            <TabsContent value="teams" className="space-y-4">
              <AdminTeams />
            </TabsContent>
            <TabsContent value="groups" className="space-y-4">
              <AdminGroups />
            </TabsContent>
            <TabsContent value="matches" className="space-y-4">
              <AdminMatches />
            </TabsContent>
            <TabsContent value="tournament-results" className="space-y-4">
              <AdminTournamentResults />
            </TabsContent>
            <TabsContent value="users" className="space-y-4">
              <AdminUsers />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </AdminProvider>
  );
};

export default Admin;