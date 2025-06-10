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
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Edit, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

// --- Interfaces ---
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

interface GroupResult {
  group_id: string;
  first_place_team_id: string | null;
  second_place_team_id: string | null;
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
      const { data: groupsData, error: groupsError } = await supabase
        .from("groups")
        .select("*")
        .order("name", { ascending: true });
      if (groupsError) throw groupsError;
      setGroups(groupsData as Group[] || []);

      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, flag_url, group_id")
        .order("name", { ascending: true });
      if (teamsError) throw teamsError;
      setTeams(teamsData as Team[] || []);

      const { data: groupResultsData, error: groupResultsError } = await supabase
        .from("groups_results")
        .select("group_id, first_place_team_id, second_place_team_id, is_completed");
      if (groupResultsError) throw groupResultsError;
      setGroupResults(groupResultsData as GroupResult[] || []);

    } catch (error: any) {
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
      // Etapa 1: Salva o resultado final do grupo na tabela 'groups_results'
      await supabase
        .from("groups_results")
        .upsert({
          group_id: editingClassificationGroupId,
          first_place_team_id: selectedFirstPlace,
          second_place_team_id: selectedSecondPlace,
          is_completed: true,
        }, { onConflict: 'group_id' });

      toast.success("Classificação salva! Calculando pontos...");

      // Etapa 2: Chama a nova função SQL para processar os pontos
      const { error: rpcError } = await supabase.rpc('process_group_results', {
        p_group_id: editingClassificationGroupId
      });

      if (rpcError) throw rpcError;

      toast.success(`Pontos do Grupo processados!`);
      
      setEditingClassificationGroupId(null);
      await fetchData();
    } catch (error: any) {
      toast.error("Erro ao salvar/pontuar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTeamNameById = (teamId: string | null) => {
    if (!teamId) return "N/A";
    return teams.find(team => team.id === teamId)?.name || "Desconhecido";
  };

  const getTeamsInGroup = (groupId: string) => {
    return teams.filter(team => team.group_id === groupId);
  };

  return (
    <div className="space-y-6">
      <Card><CardHeader><CardTitle>Gerenciar Classificação de Grupos</CardTitle></CardHeader></Card>
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-fifa-blue">Grupos</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grupo</TableHead>
              <TableHead>Times</TableHead>
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
                        {teamsInGroup.map(team => (<Badge key={team.id} variant="outline">{team.name}</Badge>))}
                      </div>
                    ) : "Nenhum time"}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Select onValueChange={setSelectedFirstPlace} value={selectedFirstPlace || ""} disabled={loading}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{teamsInGroup.map((team) => (<SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>))}</SelectContent>
                      </Select>
                    ) : (getTeamNameById(currentGroupResult?.first_place_team_id))}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Select onValueChange={setSelectedSecondPlace} value={selectedSecondPlace || ""} disabled={loading}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{teamsInGroup.map((team) => (<SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>))}</SelectContent>
                      </Select>
                    ) : (getTeamNameById(currentGroupResult?.second_place_team_id))}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={currentGroupResult?.is_completed ? "default" : "secondary"} className={currentGroupResult?.is_completed ? "bg-green-500 text-white" : "bg-yellow-400 text-black"}>
                      {currentGroupResult?.is_completed ? "Finalizado" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <div className="flex gap-2 justify-end">
                        <Button onClick={processGroupClassificationAndCalculatePoints} disabled={loading} className="bg-fifa-blue">
                          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Salvar e Pontuar
                        </Button>
                        <Button variant="outline" onClick={() => setEditingClassificationGroupId(null)} disabled={loading}>Cancelar</Button>
                      </div>
                    ) : (
                      <Button onClick={() => handleEditClassificationClick(group.id)} disabled={loading || (currentGroupResult?.is_completed && !isEditing)} variant="outline">
                        <Edit className="mr-2 h-4 w-4" />
                        {currentGroupResult?.is_completed ? "Corrigir" : "Inserir"}
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