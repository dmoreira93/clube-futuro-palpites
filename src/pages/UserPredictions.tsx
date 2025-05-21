import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Users as UsersIcon, GoalIcon, WaypointsIcon, AwardIcon } from "lucide-react"; // Adicionado GoalIcon, WaypointsIcon, AwardIcon
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Importando Tabs

// --- NOVAS INTERFACES ---

// Palpites de Partida (existente, renomeada para clareza)
type MatchPrediction = {
  id: string;
  home_score: number;
  away_score: number;
  user: { name: string };
  match: {
    home_team: { name: string };
    away_team: { name: string };
    match_date: string;
    stage: string;
  };
};

// Palpites de Grupo
type GroupPrediction = {
  id: string;
  group_id: string; // O ID do grupo
  predicted_first_team: { name: string }; // Nome do time
  predicted_second_team: { name: string }; // Nome do time
  user: { name: string };
  group_name: string; // Nome do grupo (ex: 'Grupo A')
};

// Palpites Finais
type FinalPrediction = {
  id: string;
  champion: { name: string };
  runner_up: { name: string };
  third_place: { name: string };
  fourth_place: { name: string };
  final_home_score: number;
  final_away_score: number;
  user: { name: string };
};

const UserPredictions = () => {
  // Estados para cada tipo de palpite
  const [matchPredictions, setMatchPredictions] = useState<MatchPrediction[]>([]);
  const [groupPredictions, setGroupPredictions] = useState<GroupPrediction[]>([]);
  const [finalPredictions, setFinalPredictions] = useState<FinalPrediction[]>([]);

  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingFinals, setLoadingFinals] = useState(true);

  const [filterUserId, setFilterUserId] = useState<string>("all");
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [activeTab, setActiveTab] = useState("matches"); // Estado para controlar a aba ativa

  // Função para buscar usuários
  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('users_custom')
        .select('id, name')
        .order('name');

      if (data) {
        setUsers(data);
      }
    };
    fetchUsers();
  }, []);

  // --- FUNÇÕES DE FETCH PARA CADA TIPO DE PALPITE ---

  // Fetch palpites de partidas
  useEffect(() => {
    const fetchMatchPredictions = async () => {
      setLoadingMatches(true);
      try {
        let query = supabase
          .from('match_predictions') // NOVA TABELA: match_predictions
          .select(`
            id,
            home_score,
            away_score,
            user_id,
            match_id,
            matches (
              match_date,
              stage,
              home_team:home_team_id (name),
              away_team:away_team_id (name)
            )
          `);

        if (filterUserId !== "all") {
          query = query.eq('user_id', filterUserId);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data) {
          const formattedData: MatchPrediction[] = data.map(pred => ({
            id: pred.id,
            home_score: pred.home_score,
            away_score: pred.away_score,
            user: { name: users.find(u => u.id === pred.user_id)?.name || "Usuário desconhecido" },
            match: {
              home_team: { name: pred.matches.home_team.name },
              away_team: { name: pred.matches.away_team.name },
              match_date: pred.matches.match_date,
              stage: pred.matches.stage,
            }
          }));
          setMatchPredictions(formattedData);
        } else {
          setMatchPredictions([]);
        }
      } catch (error) {
        console.error('Erro ao buscar palpites de partidas:', error);
        setMatchPredictions([]);
      } finally {
        setLoadingMatches(false);
      }
    };

    if (users.length > 0 || filterUserId === "all") { // Garante que usuários estão carregados ou filtro é 'all'
      fetchMatchPredictions();
    }
  }, [filterUserId, users]); // Dependência de 'users' para garantir que os nomes sejam resolvidos

  // Fetch palpites de grupos
  useEffect(() => {
    const fetchGroupPredictions = async () => {
      setLoadingGroups(true);
      try {
        let query = supabase
          .from('group_predictions') // NOVA TABELA: group_predictions
          .select(`
            id,
            group_id,
            predicted_first_team_id,
            predicted_second_team_id,
            user_id,
            groups (name),
            first_team:predicted_first_team_id (name),
            second_team:predicted_second_team_id (name)
          `);

        if (filterUserId !== "all") {
          query = query.eq('user_id', filterUserId);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data) {
          const formattedData: GroupPrediction[] = data.map(pred => ({
            id: pred.id,
            group_id: pred.group_id,
            predicted_first_team: { name: pred.first_team.name },
            predicted_second_team: { name: pred.second_team.name },
            user: { name: users.find(u => u.id === pred.user_id)?.name || "Usuário desconhecido" },
            group_name: pred.groups.name,
          }));
          setGroupPredictions(formattedData);
        } else {
          setGroupPredictions([]);
        }
      } catch (error) {
        console.error('Erro ao buscar palpites de grupos:', error);
        setGroupPredictions([]);
      } finally {
        setLoadingGroups(false);
      }
    };

    if (users.length > 0 || filterUserId === "all") {
      fetchGroupPredictions();
    }
  }, [filterUserId, users]);

  // Fetch palpites finais
  useEffect(() => {
    const fetchFinalPredictions = async () => {
      setLoadingFinals(true);
      try {
        let query = supabase
          .from('final_predictions') // NOVA TABELA: final_predictions
          .select(`
            id,
            champion_id,
            runner_up_id,
            third_place_id,
            fourth_place_id,
            final_home_score,
            final_away_score,
            user_id,
            champion:champion_id (name),
            runner_up:runner_up_id (name),
            third_place:third_place_id (name),
            fourth_place:fourth_place_id (name)
          `);

        if (filterUserId !== "all") {
          query = query.eq('user_id', filterUserId);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data) {
          const formattedData: FinalPrediction[] = data.map(pred => ({
            id: pred.id,
            champion: { name: pred.champion.name },
            runner_up: { name: pred.runner_up.name },
            third_place: { name: pred.third_place.name },
            fourth_place: { name: pred.fourth_place.name },
            final_home_score: pred.final_home_score,
            final_away_score: pred.final_away_score,
            user: { name: users.find(u => u.id === pred.user_id)?.name || "Usuário desconhecido" },
          }));
          setFinalPredictions(formattedData);
        } else {
          setFinalPredictions([]);
        }
      } catch (error) {
        console.error('Erro ao buscar palpites finais:', error);
        setFinalPredictions([]);
      } finally {
        setLoadingFinals(false);
      }
    };

    if (users.length > 0 || filterUserId === "all") {
      fetchFinalPredictions();
    }
  }, [filterUserId, users]);


  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-fifa-blue">Palpites dos Participantes</h1>
          <p className="text-gray-600 mt-2">
            Veja os palpites de todos os participantes para a Copa Mundial de Clubes FIFA 2025.
          </p>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-fifa-blue">Filtrar Palpites</h2>
          <Select value={filterUserId} onValueChange={setFilterUserId}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Filtrar por participante" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os participantes</SelectItem>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="matches" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="matches">Palpites de Partidas</TabsTrigger>
            <TabsTrigger value="groups">Palpites de Grupos</TabsTrigger>
            <TabsTrigger value="finals">Palpites Finais</TabsTrigger>
          </TabsList>

          {/* ABA: Palpites de Partidas */}
          <TabsContent value="matches">
            <Card className="shadow-lg mt-4">
              <CardHeader className="bg-fifa-blue text-white">
                <CardTitle className="flex items-center gap-2">
                  <GoalIcon className="h-5 w-5" />
                  {filterUserId === "all"
                    ? "Palpites de Partidas de Todos"
                    : `Palpites de Partidas de ${users.find(u => u.id === filterUserId)?.name || "Participante"}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loadingMatches ? (
                  <div className="p-4"><Skeleton className="h-64 w-full" /></div>
                ) : matchPredictions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Nenhum palpite de partida encontrado.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Fase</TableHead>
                          <TableHead>Partida</TableHead>
                          <TableHead>Palpite</TableHead>
                          {filterUserId === "all" && <TableHead>Participante</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {matchPredictions.map((prediction) => (
                          <TableRow key={prediction.id}>
                            <TableCell>{formatDate(prediction.match.match_date)}</TableCell>
                            <TableCell>{prediction.match.stage}</TableCell>
                            <TableCell>{prediction.match.home_team.name} vs {prediction.match.away_team.name}</TableCell>
                            <TableCell>
                              <span className="px-3 py-1 bg-gray-100 rounded-lg font-semibold">
                                {prediction.home_score} - {prediction.away_score}
                              </span>
                            </TableCell>
                            {filterUserId === "all" && (
                              <TableCell className="font-medium">{prediction.user.name}</TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA: Palpites de Grupos */}
          <TabsContent value="groups">
            <Card className="shadow-lg mt-4">
              <CardHeader className="bg-fifa-blue text-white">
                <CardTitle className="flex items-center gap-2">
                  <WaypointsIcon className="h-5 w-5" />
                  {filterUserId === "all"
                    ? "Palpites de Classificação de Grupos de Todos"
                    : `Palpites de Classificação de Grupos de ${users.find(u => u.id === filterUserId)?.name || "Participante"}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loadingGroups ? (
                  <div className="p-4"><Skeleton className="h-64 w-full" /></div>
                ) : groupPredictions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Nenhum palpite de grupo encontrado.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Grupo</TableHead>
                          <TableHead>1º Lugar</TableHead>
                          <TableHead>2º Lugar</TableHead>
                          {filterUserId === "all" && <TableHead>Participante</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupPredictions.map((prediction) => (
                          <TableRow key={prediction.id}>
                            <TableCell>{prediction.group_name}</TableCell>
                            <TableCell className="font-medium">{prediction.predicted_first_team.name}</TableCell>
                            <TableCell className="font-medium">{prediction.predicted_second_team.name}</TableCell>
                            {filterUserId === "all" && (
                              <TableCell className="font-medium">{prediction.user.name}</TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA: Palpites Finais */}
          <TabsContent value="finals">
            <Card className="shadow-lg mt-4">
              <CardHeader className="bg-fifa-blue text-white">
                <CardTitle className="flex items-center gap-2">
                  <AwardIcon className="h-5 w-5" />
                  {filterUserId === "all"
                    ? "Palpites Finais de Todos"
                    : `Palpites Finais de ${users.find(u => u.id === filterUserId)?.name || "Participante"}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loadingFinals ? (
                  <div className="p-4"><Skeleton className="h-64 w-full" /></div>
                ) : finalPredictions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Nenhum palpite final encontrado.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campeão</TableHead>
                          <TableHead>Vice</TableHead>
                          <TableHead>3º Lugar</TableHead>
                          <TableHead>4º Lugar</TableHead>
                          <TableHead>Placar Final</TableHead>
                          {filterUserId === "all" && <TableHead>Participante</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {finalPredictions.map((prediction) => (
                          <TableRow key={prediction.id}>
                            <TableCell className="font-medium">{prediction.champion.name}</TableCell>
                            <TableCell className="font-medium">{prediction.runner_up.name}</TableCell>
                            <TableCell className="font-medium">{prediction.third_place.name}</TableCell>
                            <TableCell className="font-medium">{prediction.fourth_place.name}</TableCell>
                            <TableCell>
                              <span className="px-3 py-1 bg-gray-100 rounded-lg font-semibold">
                                {prediction.final_home_score} - {prediction.final_away_score}
                              </span>
                            </TableCell>
                            {filterUserId === "all" && (
                              <TableCell className="font-medium">{prediction.user.name}</TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default UserPredictions;