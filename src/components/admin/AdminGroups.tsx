// src/components/admin/AdminGroups.tsx

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
import { toast } from "sonner"; // Usando sonner para toasts
import { Edit, Loader2 } from "lucide-react"; // Adicionado Loader2
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

// Interface para o resultado real da classificação de grupo (tabela `groups_results`)
interface GroupResult {
  group_id: string;
  first_place_team_id: string | null; // Pode ser null antes de preencher
  second_place_team_id: string | null; // Pode ser null antes de preencher
  is_completed: boolean;
}

const AdminGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [groupResults, setGroupResults] = useState<GroupResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingClassificationGroupId, setEditingClassificationGroupId] = useState<string | null>(null);
  const [selectedFirstPlace, setSelectedFirstPlace] = useState<string | null>(null);
  const [selectedSecondPlace, setSelectedSecondPlace] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Groups
      const { data: groupsData, error: groupsError } = await supabase
        .from<Group>("groups")
        .select("*")
        .order("name", { ascending: true });
      if (groupsError) throw groupsError;
      setGroups(groupsData || []);

      // Fetch Teams with their group_id
      const { data: teamsData, error: teamsError } = await supabase
        .from<Team>("teams")
        .select("id, name, flag_url, group_id") // Certifique-se de que group_id é selecionado
        .order("name", { ascending: true });
      if (teamsError) throw teamsError;
      setTeams(teamsData || []);

      // Fetch existing Group Results
      const { data: groupResultsData, error: groupResultsError } = await supabase
        .from<GroupResult>("groups_results")
        .select("group_id, first_place_team_id, second_place_team_id, is_completed");
      if (groupResultsError) throw groupResultsError;
      setGroupResults(groupResultsData || []);

      toast.success("Dados de grupos carregados com sucesso.");
    } catch (error: any) {
      console.error("Erro ao carregar dados de grupos:", error.message);
      toast.error("Erro ao carregar dados de grupos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClassificationClick = (groupId: string) => {
    setEditingClassificationGroupId(groupId);
    const currentResult = groupResults.find(res => res.group_id === groupId);
    setSelectedFirstPlace(currentResult?.first_place_team_id || null);
    setSelectedSecondPlace(currentResult?.second_place_team_id || null);
  };

  const processGroupClassificationAndCalculatePoints = async () => {
    if (!editingClassificationGroupId || !selectedFirstPlace || !selectedSecondPlace) {
      toast.error("Por favor, selecione os dois times classificados.");
      return;
    }

    if (selectedFirstPlace === selectedSecondPlace) {
      toast.error("Os times do 1º e 2º lugar não podem ser o mesmo.");
      return;
    }

    setLoading(true);
    try {
      // 1. Inserir ou atualizar o resultado do grupo
      const existingResult = groupResults.find(res => res.group_id === editingClassificationGroupId);

      let upsertError: any;
      if (existingResult) {
        const { error } = await supabase
          .from("groups_results")
          .update({
            first_place_team_id: selectedFirstPlace,
            second_place_team_id: selectedSecondPlace,
            is_completed: true, // Marcar como concluído ao salvar
          })
          .eq("group_id", editingClassificationGroupId);
        upsertError = error;
      } else {
        const { error } = await supabase
          .from("groups_results")
          .insert({
            group_id: editingClassificationGroupId,
            first_place_team_id: selectedFirstPlace,
            second_place_team_id: selectedSecondPlace,
            is_completed: true, // Marcar como concluído ao salvar
          });
        upsertError = error;
      }

      if (upsertError) throw upsertError;

      // 2. Acionar o cálculo de pontos para todos os palpites de grupo
      // Você precisará buscar todos os palpites de grupo para este grupo
      const { data: groupPredictions, error: predictionsError } = await supabase
        .from("group_predictions")
        .select("user_id, group_id, predicted_first_team_id, predicted_second_team_id"); // Selecione todos os campos necessários
      if (predictionsError) throw predictionsError;

      // Chama a função de pontuação para cada palpite
      for (const prediction of groupPredictions) {
        // A função calculateGroupClassificationPoints precisa ser refatorada para aceitar
        // o palpite, o resultado real, e o user_id para atualizar a tabela user_points
        await calculateGroupClassificationPoints(
          prediction.user_id,
          prediction.group_id,
          prediction.first_team_id,
          prediction.second_team_id,
          selectedFirstPlace, // Resultado real 1º
          selectedSecondPlace // Resultado real 2º
        );
      }

      toast.success("Classificação do grupo salva e pontos calculados com sucesso!");
      setEditingClassificationGroupId(null);
      await fetchData(); // Recarrega os dados para atualizar o estado
    } catch (error: any) {
      console.error("Erro ao processar classificação do grupo:", error.message);
      toast.error("Erro ao salvar classificação ou calcular pontos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTeamNameById = (teamId: string | null) => {
    return teams.find(team => team.id === teamId)?.name || "N/A";
  };

  const getTeamsInGroup = (groupId: string) => {
    return teams.filter(team => team.group_id === groupId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Classificação de Grupos</CardTitle>
        </CardHeader>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-fifa-blue">Grupos</h2>
        {loading && <p>Carregando grupos...</p>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grupo</TableHead>
              <TableHead>Times no Grupo</TableHead>
              <TableHead>1º Lugar</TableHead>
              <TableHead>2º Lugar</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => {
              const currentGroupResult = groupResults.find(res => res.group_id === group.id);
              const isEditing = editingClassificationGroupId === group.id;
              const teamsInGroup = getTeamsInGroup(group.id);

              return (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell>
                    {teamsInGroup.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {teamsInGroup.map(team => (
                          <Badge key={team.id} variant="outline">{team.name}</Badge>
                        ))}
                      </div>
                    ) : "Nenhum time atribuído"}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Select
                        onValueChange={setSelectedFirstPlace}
                        value={selectedFirstPlace || ""}
                        disabled={loading}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Selecione 1º Lugar" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamsInGroup.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      getTeamNameById(currentGroupResult?.first_place_team_id)
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Select
                        onValueChange={setSelectedSecondPlace}
                        value={selectedSecondPlace || ""}
                        disabled={loading}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Selecione 2º Lugar" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamsInGroup.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      getTeamNameById(currentGroupResult?.second_place_team_id)
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
                          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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