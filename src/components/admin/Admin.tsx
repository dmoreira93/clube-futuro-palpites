import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminMatches from "@/components/admin/AdminMatches";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminTeams from "@/components/admin/AdminTeams";
import AdminGroups from "@/components/admin/AdminGroups";
import AdminPredictions from "@/components/admin/AdminPredictions";
import AdminTournamentResults from "@/components/admin/AdminTournamentResults";
import AdminScoringCriteria from "@/components/admin/AdminScoringCriteria";
import { 
  Shield, 
  Trophy, 
  Users, 
  Calendar, 
  Settings, 
  Target, 
  FileText, 
  Medal 
} from "lucide-react";

const Admin = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      
      {/* Cabeçalho do Admin */}
      <div className="bg-white border-b border-gray-200 py-8 shadow-sm mb-8">
        <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-2">
                <div className="bg-fifa-blue p-2 rounded-lg">
                    <Shield className="h-6 w-6 text-fifa-gold" />
                </div>
                <h1 className="text-3xl font-bold text-fifa-blue">Painel Administrativo</h1>
            </div>
            <p className="text-gray-500 ml-14">
                Gerencie campeonatos, usuários, resultados e configurações do sistema.
            </p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <Tabs defaultValue="matches" className="w-full space-y-6">
          
          {/* Lista de Abas */}
          <TabsList className="w-full h-auto flex flex-wrap justify-start gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
            <TabsTrigger 
                value="matches" 
                className="flex-1 min-w-[100px] data-[state=active]:bg-fifa-blue data-[state=active]:text-fifa-gold py-3"
            >
                <Calendar className="w-4 h-4 mr-2" /> Partidas
            </TabsTrigger>
            <TabsTrigger 
                value="teams" 
                className="flex-1 min-w-[100px] data-[state=active]:bg-fifa-blue data-[state=active]:text-fifa-gold py-3"
            >
                <Shield className="w-4 h-4 mr-2" /> Times
            </TabsTrigger>
            <TabsTrigger 
                value="groups" 
                className="flex-1 min-w-[100px] data-[state=active]:bg-fifa-blue data-[state=active]:text-fifa-gold py-3"
            >
                <Settings className="w-4 h-4 mr-2" /> Grupos
            </TabsTrigger>
            <TabsTrigger 
                value="users" 
                className="flex-1 min-w-[100px] data-[state=active]:bg-fifa-blue data-[state=active]:text-fifa-gold py-3"
            >
                <Users className="w-4 h-4 mr-2" /> Usuários
            </TabsTrigger>
            <TabsTrigger 
                value="predictions" 
                className="flex-1 min-w-[100px] data-[state=active]:bg-fifa-blue data-[state=active]:text-fifa-gold py-3"
            >
                <Target className="w-4 h-4 mr-2" /> Palpites
            </TabsTrigger>
            <TabsTrigger 
                value="scoring" 
                className="flex-1 min-w-[100px] data-[state=active]:bg-fifa-blue data-[state=active]:text-fifa-gold py-3"
            >
                <FileText className="w-4 h-4 mr-2" /> Pontuação
            </TabsTrigger>
            <TabsTrigger 
                value="results" 
                className="flex-1 min-w-[100px] data-[state=active]:bg-fifa-blue data-[state=active]:text-fifa-gold py-3"
            >
                <Medal className="w-4 h-4 mr-2" /> Resultados Finais
            </TabsTrigger>
            <TabsTrigger 
                value="championships" 
                className="flex-1 min-w-[100px] data-[state=active]:bg-fifa-blue data-[state=active]:text-fifa-gold py-3"
            >
                <Trophy className="w-4 h-4 mr-2" /> Campeonatos
            </TabsTrigger>
          </TabsList>

          {/* Conteúdo das Abas */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm min-h-[500px]">
            <TabsContent value="matches" className="mt-0">
                <AdminMatches />
            </TabsContent>
            <TabsContent value="teams" className="mt-0">
                <AdminTeams />
            </TabsContent>
            <TabsContent value="groups" className="mt-0">
                <AdminGroups />
            </TabsContent>
            <TabsContent value="users" className="mt-0">
                <AdminUsers />
            </TabsContent>
            <TabsContent value="predictions" className="mt-0">
                <AdminPredictions />
            </TabsContent>
            <TabsContent value="scoring" className="mt-0">
                <AdminScoringCriteria />
            </TabsContent>
            <TabsContent value="results" className="mt-0">
                <AdminTournamentResults />
            </TabsContent>
            {/* Adicionei esta aba para o componente de campeonatos que atualizamos antes */}
            <TabsContent value="championships" className="mt-0">
                {/* Você precisará importar AdminChampionships no topo se ainda não estiver */}
                 <div className="text-center py-10 text-gray-500">
                    Componente de Campeonatos (AdminChampionships) deve ser importado aqui.
                </div>
            </TabsContent>
          </div>

        </Tabs>
      </div>
    </div>
  );
};

export default Admin;