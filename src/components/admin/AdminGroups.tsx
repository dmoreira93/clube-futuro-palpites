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
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

// Interfaces para tipos das tabelas
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

const AdminGroups = () => {
  const { toast } = useToast();

  const [groups, setGroups] = useState<Group[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  // Carregar grupos e times no início
  useEffect(() => {
    async function loadData() {
      // Buscar grupos
      const { data: groupsData, error: groupsError } = await supabase
        .from<Group>("groups")
        .select("*")
        .order("name");

      if (groupsError) {
        toast({
          title: "Erro ao carregar grupos",
          description: groupsError.message,
          variant: "destructive",
        });
        return;
      }
      if (groupsData && groupsData.length > 0) {
        setGroups(groupsData);
        setSelectedGroupId(groupsData[0].id);
      }

      // Buscar times
      const { data: teamsData, error: teamsError } = await supabase
        .from<Team>("teams")
        .select("*")
        .order("name");

      if (teamsError) {
        toast({
          title: "Erro ao carregar times",
          description: teamsError.message,
          variant: "destructive",
        });
        return;
      }
      if (teamsData) {
        setTeams(teamsData);
      }
    }

    loadData();
  }, [toast]);

  // Times disponíveis para adicionar (sem grupo)
  const availableTeams = teams.filter(team => !team.group_id);

  // Times já no grupo selecionado
  const teamsInSelectedGroup = teams.filter(team => team.group_id === selectedGroupId);

  // Adicionar time ao grupo
  async function handleAddTeam() {
    if (!selectedGroupId || !selectedTeamId) {
      toast({
        title: "Seleção inválida",
        description: "Selecione grupo e time para adicionar.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("teams")
      .update({ group_id: selectedGroupId })
      .eq("id", selectedTeamId);

    if (error) {
      toast({
        title: "Erro ao adicionar time",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Atualizar estado local
    setTeams(prev =>
      prev.map(team =>
        team.id === selectedTeamId ? { ...team, group_id: selectedGroupId } : team
      )
    );
    setSelectedTeamId("");
    toast({
      title: "Time adicionado",
      description: "Time adicionado com sucesso ao grupo.",
    });
  }

  // Remover time do grupo (setar group_id para null)
  async function handleRemoveTeam(teamId: string) {
    const { error } = await supabase
      .from("teams")
      .update({ group_id: null })
      .eq("id", teamId);

    if (error) {
      toast({
        title: "Erro ao remover time",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

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
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Grupos e Times</h1>

      <section className="mb-8 p-4 bg-gray-50 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Adicionar Time a um Grupo</h2>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block mb-1 font-medium">Grupo</label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
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
            <label className="block mb-1 font-medium">Time</label>
            <Select value={selectedTeamId || ""} onValueChange={setSelectedTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um time" />
              </SelectTrigger>
              <SelectContent>
                {availableTeams.length === 0 ? (
                  <SelectItem disabled>Nenhum time disponível</SelectItem>
                ) : (
                  availableTeams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Button onClick={handleAddTeam} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Times por Grupo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
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
    </div>
  );
};

export default AdminGroups;
