// src/pages/Admin.tsx - VERSÃO ATUALIZADA

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminMatches from "@/components/admin/AdminMatches";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminTeams from "@/components/admin/AdminTeams";
import AdminGroups from "@/components/admin/AdminGroups";
import AdminPredictions from "@/components/admin/AdminPredictions";
import AdminTournamentResults from "@/components/admin/AdminTournamentResults";
import AdminScoringCriteria from "@/components/admin/AdminScoringCriteria"; // <-- Usando o seu componente

const Admin = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Painel do Administrador</h1>

      <Tabs defaultValue="matches" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 mb-4">
          <TabsTrigger value="matches">Partidas</TabsTrigger>
          <TabsTrigger value="teams">Times</TabsTrigger>
          <TabsTrigger value="groups">Grupos</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="predictions">Palpites</TabsTrigger>
          <TabsTrigger value="scoring">Pontuação</TabsTrigger>
          <TabsTrigger value="results">Resultados Finais</TabsTrigger>
        </TabsList>

        <TabsContent value="matches">
          <AdminMatches />
        </TabsContent>
        <TabsContent value="teams">
          <AdminTeams />
        </TabsContent>
        <TabsContent value="groups">
          <AdminGroups />
        </TabsContent>
        <TabsContent value="users">
          <AdminUsers />
        </TabsContent>
        <TabsContent value="predictions">
          <AdminPredictions />
        </TabsContent>
        
        <TabsContent value="scoring">
          {/* SEU COMPONENTE SENDO USADO AQUI */}
          <AdminScoringCriteria />
        </TabsContent>

        <TabsContent value="results">
          <AdminTournamentResults />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;