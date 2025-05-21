import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast"; // assuming useToast is from sonner
import { Plus, Trash, Edit } from "lucide-react"; // Adicione Edit icon
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { calculateGroupClassificationPoints } from "@/lib/scoring"; // Importe a função de pontuação de grupos

// --- Interfaces para tipos das tabelas ---
interface Group {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
  flag_url?: string | null;
  group_id?: string | null;
}

// Interface para um palpite de classificação de grupo do usuário
interface GroupPrediction {
  user_id: string;
  group_id: string;
  first_team_id: string;
  second_team_id: string;
}

// Interface para o resultado real da classificação de grupo (nova tabela `groups_results`)
interface GroupResult {
  group_id: string;
  first_place_team_id: string;
  second_place_team_id: string;
  is_completed: boolean;
}
// --- Fim das Interfaces ---

const AdminGroups = () => {
  const { toast } = useToast();

  const [groups, setGroups] = useState<Group[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false); // Adicionado para indicar carregamento/processamento

  // Estados para adicionar/remover times de grupos
  const [selectedGroupToAddTeam, setSelectedGroupToAddTeam] = useState<string>("");
  const [selectedTeamToAdd, setSelectedTeamToAdd] = useState<string>("");

  // Estados para classificação de grupos
  const [editingClassificationGroupId, setEditingClassificationGroupId] = useState<string | null>(null);
  const [firstPlaceTeamId, setFirstPlaceTeamId] = useState<string>("");
  const [secondPlaceTeamId, setSecondPlaceTeamId] = useState<string>("");
  const [groupRealResults, setGroupRealResults] = useState<GroupResult[]>([]); // Para exibir resultados já salvos

  // --- Funções de Carregamento de Dados ---
  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Buscar grupos
      const { data: groupsData, error: groupsError } = await supabase
        .from<Group>("groups")
        .select("*")
        .order("name");

      if (groupsError) throw new Error(groupsError.message);

      if (groupsData && groupsData.length > 0) {
        setGroups(groupsData);
        // Define o primeiro grupo como selecionado por padrão para adicionar time
        if (!selectedGroupToAddTeam) {
            setSelectedGroupToAddTeam(groupsData[0].id);
        }
      }

      // Buscar times
      const { data: teamsData, error: teamsError } = await supabase
        .from<Team>("teams")
        .select("*")
        .order("name");

      if (teamsError) throw new Error(teamsError.message);
      setTeams(teamsData || []);
      
      // Buscar resultados de classificação de grupos já salvos
      const { data: resultsData, error: resultsError } = await supabase
        .from<GroupResult>("groups_results")
        .select("*");
      
      if (resultsError) throw new Error(resultsError.message);
      setGroupRealResults(resultsData || []);

    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
      console.error("Erro ao carregar dados:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []); // Re-fetch all data when component mounts

  // --- Lógica para Adicionar/Remover Times a Grupos ---
  const availableTeamsForAdding = teams.filter(team => !team.group_id);
  const teamsInSelectedGroup = teams.filter(team => team.group_id === selectedGroupToAddTeam);

  async function handleAddTeam() {
    if (!selectedGroupToAddTeam || !selectedTeamToAdd) {
      toast({
        title: "Seleção inválida",
        description: "Selecione grupo e time para adicionar.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("teams")
        .update({ group_id: selectedGroupToAddTeam, updated_at: new Date().toISOString() })
        .eq("id", selectedTeamToAdd);

      if (error) throw new Error(error.message);

      // Atualizar estado local
      setTeams(prev =>
        prev.map(team =>
          team.id === selectedTeamToAdd ? { ...team, group_id: selectedGroupToAddTeam } : team
        )
      );
      setSelectedTeamToAdd("");
      toast({
        title: "Time adicionado",
        description: "Time adicionado com sucesso ao grupo.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar time",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveTeam(teamId: string) {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("teams")
        .update({ group_id: null, updated_at: new Date().toISOString() })
        .eq("id", teamId);

      if (error) throw new Error(error.message);

      // Atualizar estado local
      setTeams(prev =>
        prev.map(team =>
          team.id === teamId ? { ...team, group_id: null } : team
        )
      );
      toast({
        title: "Time removido",
        description: "Time removido do grupo com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover time",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // --- Lógica para Classificação de Grupos e Cálculo de Pontos ---

  // Handler para iniciar a edição da classificação de um grupo
  const handleEditClassificationClick = async (groupId: string) => {
    setEditingClassificationGroupId(groupId);
    setLoading(true);

    // Buscar a classificação existente para pré-popular
    try {
      const { data, error } = await supabase
        .from("groups_results")
        .select("first_place_team_id, second_place_team_id")
        .eq("group_id", groupId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = "No rows found"
        throw new Error(error.message);
      }
      
      if (data) {
        setFirstPlaceTeamId(data.first_place_team_id);
        setSecondPlaceTeamId(data.second_place_team_id);
      } else {
        setFirstPlaceTeamId("");
        setSecondPlaceTeamId("");
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar classificação do grupo",
        description: error.message,
        variant: "destructive",
      });
      console.error("Erro ao carregar classificação do grupo:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Função para salvar a classificação e acionar o cálculo de pontos
  const processGroupClassificationAndCalculatePoints = async () => {
    if (!editingClassificationGroupId || !firstPlaceTeamId || !secondPlaceTeamId) {
      toast({
        title: "Dados incompletos",
        description: "Selecione o grupo e ambos os classificados.",
        variant: "destructive",
      });
      return;
    }

    if (firstPlaceTeamId === secondPlaceTeamId) {
      toast({
        title: "Seleção inválida",
        description: "Os times classificados não podem ser os mesmos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // 1. **Salvar/Atualizar o resultado real da classificação do grupo na tabela 'groups_results'**
      const { error: upsertResultError } = await supabase
        .from("groups_results")
        .upsert(
          {
            group_id: editingClassificationGroupId,
            first_place_team_id: firstPlaceTeamId,
            second_place_team_id: secondPlaceTeamId,
            is_completed: true, // Marca como finalizado
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'group_id' } // Se o group_id já existe, ele atualiza; senão, insere
        );

      if (upsertResultError) {
        throw new Error(`Erro ao salvar classificação do grupo: ${upsertResultError.message}`);
      }
      toast({
        title: "Classificação salva",
        description: "Classificação do grupo salva com sucesso!",
      });

      // 2. **Buscar TODOS os palpites dos usuários para ESTE grupo específico**
      const { data: userGroupPredictions, error: fetchPredictionsError } = await supabase
        .from<GroupPrediction>("group_predictions") // Sua tabela de palpites de grupo
        .select("user_id, first_team_id, second_team_id")
        .eq("group_id", editingClassificationGroupId);

      if (fetchPredictionsError) {
        throw new Error(`Erro ao buscar palpites de grupo: ${fetchPredictionsError.message}`);
      }

      if (!userGroupPredictions || userGroupPredictions.length === 0) {
        toast({
          title: "Nenhum palpite",
          description: "Nenhum palpite de grupo encontrado para este grupo. Nenhuma pontuação a ser calculada.",
          variant: "info",
        });
        // Sai do modo de edição e reseta estados
        setEditingClassificationGroupId(null);
        setFirstPlaceTeamId("");
        setSecondPlaceTeamId("");
        setLoading(false);
        return;
      }

      // Prepare o objeto de resultado real para a função de pontuação
      const realGroupOrderForCalculation = [firstPlaceTeamId, secondPlaceTeamId];

      // 3. **Iterar sobre cada palpite, calcular os pontos e atualizar a pontuação do usuário**
      // Usaremos Promise.all para executar as atualizações em paralelo, melhorando a performance.
      const scoreUpdatesPromises = userGroupPredictions.map(async (prediction) => {
        const userPredictedOrderForCalculation = [prediction.first_team_id, prediction.second_team_id];

        // Chama a função de pontuação que criamos
        const pointsEarned = calculateGroupClassificationPoints(userPredictedOrderForCalculation, realGroupOrderForCalculation);

        // Buscar a pontuação atual do usuário
        const { data: currentUserData, error: fetchUserError } = await supabase
          .from("users_custom")
          .select("total_score")
          .eq("id", prediction.user_id)
          .single();

        if (fetchUserError && fetchUserError.code !== 'PGRST116') { // PGRST116 = "No rows found"
          console.error(`Erro ao buscar pontuação atual do usuário ${prediction.user_id}:`, fetchUserError.message);
          return; // Pula para o próximo usuário se houver erro
        }

        const currentTotalScore = currentUserData?.total_score || 0;
        const newTotalScore = currentTotalScore + pointsEarned;

        // Atualizar a pontuação total do usuário (usando upsert para robustez)
        const { error: updateScoreError } = await supabase
          .from("users_custom")
          .upsert(
            { id: prediction.user_id, total_score: newTotalScore, updated_at: new Date().toISOString() },
            { onConflict: 'id' } // Se o user_id já existir, ele atualiza; senão, insere
          );

        if (updateScoreError) {
          console.error(`Erro ao atualizar pontuação do usuário ${prediction.user_id}:`, updateScoreError.message);
        } else {
          console.log(`Usuário ${prediction.user_id} ganhou ${pointsEarned} pontos. Nova pontuação: ${newTotalScore}`);
        }
      });

      await Promise.all(scoreUpdatesPromises); // Espera todas as atualizações terminarem

      toast({
        title: "Pontuações atualizadas!",
        description: "Pontuações dos usuários para este grupo foram atualizadas com sucesso.",
      });

      // Recarrega todos os dados para refletir as mudanças na UI
      await fetchAllData();
      // Sai do modo de edição e reseta estados
      setEditingClassificationGroupId(null);
      setFirstPlaceTeamId("");
      setSecondPlaceTeamId("");

    } catch (error: any) {
      console.error("Erro no processamento da classificação do grupo e cálculo de pontos:", error.message);
      toast({
        title: "Erro de processamento",
        description: "Erro ao processar classificação e atualizar pontuações: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para obter o nome do time pelo ID
  const getTeamName = (teamId: string | undefined) => {
    if (!teamId) return "N/A";
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : "Time desconhecido";
  };

  const getGroupName = (groupId: string | null) => {
    if (!groupId) return "N/A";
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : "Grupo desconhecido";
  }


  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Grupos e Times</h1>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* Seção para Adicionar Time a um Grupo */}
      <section className="mb-8 p-4 bg-gray-50 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Adicionar Time a um Grupo</h2>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block mb-1 font-medium text-gray-700">Grupo</label>
            <Select value={selectedGroupToAddTeam} onValueChange={setSelectedGroupToAddTeam} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um grupo" />
              </SelectTrigger>
              <SelectContent>
                {groups.map(group => (
                  <SelectItem key={group.id} value={group.id}>
                    Grupo {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="block mb-1 font-medium text-gray-700">Time</label>
            <Select value={selectedTeamToAdd || ""} onValueChange={setSelectedTeamToAdd} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um time" />
              </SelectTrigger>
              <SelectContent>
                {availableTeamsForAdding.length === 0 ? (
                  <SelectItem disabled value="">Nenhum time disponível</SelectItem>
                ) : (
                  availableTeamsForAdding.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Button onClick={handleAddTeam} className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </div>
        </div>
      </section>

      {/* Seção para Times por Grupo (visualização e remoção) */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Times por Grupo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {groups.map(group => {
            const teamsInGroup = teams.filter(team => team.group_id === group.id);
            return (
              <Card key={group.id} className={teamsInGroup.length === 0 ? "border border-dashed border-gray-300" : ""}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Grupo {group.name}</span>
                    <Badge variant="outline">{teamsInGroup.length} time{teamsInGroup.length !== 1 ? "s" : ""}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {teamsInGroup.length === 0 ? (
                    <p className="text-center italic text-gray-500">Nenhum time adicionado</p>
                  ) : (
                    <ul className="space-y-2">
                      {teamsInGroup.map(team => (
                        <li key={team.id} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                          <div className="flex items-center space-x-2">
                            {team.flag_url && (
                              <img
                                src={team.flag_url}
                                alt={`Bandeira de ${team.name}`}
                                className="w-6 h-4 rounded-sm object-cover"
                              />
                            )}
                            <span>{team.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTeam(team.id)}
                            aria-label={`Remover ${team.name} do grupo`}
                            disabled={loading}
                          >
                            <Trash className="h-4 w-4 text-red-600" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* --- Seção para Classificação Final de Grupos e Pontuação --- */}
      <section className="mb-8 p-4 bg-purple-50 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-purple-800">Classificação Final dos Grupos e Pontuação</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grupo</TableHead>
              <TableHead>1º Lugar (Real)</TableHead>
              <TableHead>2º Lugar (Real)</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => {
              const currentGroupResult = groupRealResults.find(res => res.group_id === group.id);
              const isEditing = editingClassificationGroupId === group.id;
              const teamsInThisGroup = teams.filter(team => team.group_id === group.id);

              return (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">Grupo {group.name}</TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Select value={firstPlaceTeamId} onValueChange={setFirstPlaceTeamId} disabled={loading}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="1º Lugar" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamsInThisGroup.length === 0 ? (
                              <SelectItem disabled value="">Nenhum time neste grupo</SelectItem>
                          ) : (
                              teamsInThisGroup.map(team => (
                                  <SelectItem key={team.id} value={team.id}>
                                      {team.name}
                                  </SelectItem>
                              ))
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      currentGroupResult ? getTeamName(currentGroupResult.first_place_team_id) : "Aguardando"
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Select value={secondPlaceTeamId} onValueChange={setSecondPlaceTeamId} disabled={loading}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="2º Lugar" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamsInThisGroup.length === 0 ? (
                              <SelectItem disabled value="">Nenhum time neste grupo</SelectItem>
                          ) : (
                              teamsInThisGroup.map(team => (
                                  <SelectItem key={team.id} value={team.id}>
                                      {team.name}
                                  </SelectItem>
                              ))
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      currentGroupResult ? getTeamName(currentGroupResult.second_place_team_id) : "Aguardando"
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={currentGroupResult?.is_completed ? "default" : "secondary"}>
                      {currentGroupResult?.is_completed ? "Finalizado" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <div className="flex gap-2 justify-end">
                        <Button onClick={processGroupClassificationAndCalculatePoints} disabled={loading}>
                          {loading ? "Processando..." : "Salvar e Pontuar"}
                        </Button>
                        <Button variant="outline" onClick={() => setEditingClassificationGroupId(null)} disabled={loading}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => handleEditClassificationClick(group.id)} disabled={loading || currentGroupResult?.is_completed}>
                        <Edit className="mr-2 h-4 w-4" />
                        {currentGroupResult?.is_completed ? "Editar" : "Inserir Classificação"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>

    </div>
  );
};

export default AdminGroups;