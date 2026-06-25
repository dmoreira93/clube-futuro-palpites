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
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Edit, Loader2, Trophy, Users, CheckCircle, AlertTriangle, Save, X, Filter, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export default function AdminGroups() {
  const [championships, setChampionships] = useState<any[]>([]);
  const [selectedChampionship, setSelectedChampionship] = useState<string>("");
  
  const [groups, setGroups] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]); // Todos os times do campeonato
  const [groupResults, setGroupResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Create Group State
  const [newGroupName, setNewGroupName] = useState("");

  // Editing Classification State
  const [editingClassificationGroupId, setEditingClassificationGroupId] = useState<string | null>(null);
  const [firstPlace, setFirstPlace] = useState<string>("");
  const [secondPlace, setSecondPlace] = useState<string>("");

  // Manage Teams in Group State
  const [addingTeamGroupId, setAddingTeamGroupId] = useState<string | null>(null);
  const [teamToAdd, setTeamToAdd] = useState<string>("");

  useEffect(() => {
    fetchChampionships();
  }, []);

  useEffect(() => {
    if (selectedChampionship) fetchData();
    else { setGroups([]); setTeams([]); }
  }, [selectedChampionship]);

  const fetchChampionships = async () => {
    const { data } = await supabase.from("championships").select("id, name");
    setChampionships(data || []);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: groupsData } = await supabase
        .from("groups")
        .select("*")
        .eq("championship_id", selectedChampionship)
        .order("name");
      setGroups(groupsData || []);

      const { data: teamsData } = await supabase
        .from("teams")
        .select("id, name, flag_url, group_id")
        .eq("championship_id", selectedChampionship)
        .order("name");
      setTeams(teamsData || []);

      const { data: resultsData } = await supabase.from("groups_results").select("*");
      setGroupResults(resultsData || []);

    } catch (error: any) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  // --- CRIAÇÃO DE GRUPO ---
  const handleCreateGroup = async () => {
      if (!newGroupName || !selectedChampionship) return toast.error("Preencha o nome do grupo");
      
      const { error } = await supabase.from("groups").insert({
          name: newGroupName,
          championship_id: selectedChampionship
      });

      if (error) toast.error("Erro ao criar grupo");
      else {
          toast.success("Grupo criado!");
          setNewGroupName("");
          fetchData();
      }
  };

  // --- VINCULAR TIME AO GRUPO ---
  const handleAddTeamToGroup = async (groupId: string) => {
      if (!teamToAdd) return;
      const { error } = await supabase.from("teams").update({ group_id: groupId }).eq("id", teamToAdd);
      
      if (error) toast.error("Erro ao adicionar time");
      else {
          toast.success("Time adicionado ao grupo!");
          setTeamToAdd("");
          setAddingTeamGroupId(null);
          fetchData(); // Recarrega para atualizar a lista visual
      }
  };

  const handleRemoveTeamFromGroup = async (teamId: string) => {
      const { error } = await supabase.from("teams").update({ group_id: null }).eq("id", teamId);
      if (!error) {
          toast.success("Time removido do grupo");
          fetchData();
      }
  };

  // --- CLASSIFICAÇÃO (Pontuação) ---
  const handleEditClassification = (group: any) => {
      const res = groupResults.find(r => r.group_id === group.id);
      setEditingClassificationGroupId(group.id);
      setFirstPlace(res?.first_place_team_id || "");
      setSecondPlace(res?.second_place_team_id || "");
  };

  const handleSaveClassification = async (groupId: string) => {
      if (!firstPlace || !secondPlace) return toast.error("Selecione os dois classificados");
      if (firstPlace === secondPlace) return toast.error("Os times devem ser diferentes");

      setLoading(true);
      const { error } = await supabase.from("groups_results").upsert({
          group_id: groupId,
          championship_id: selectedChampionship,
          first_place_team_id: firstPlace,
          second_place_team_id: secondPlace,
          is_completed: true
      }, { onConflict: 'group_id' });

      if (error) {
          toast.error("Erro ao salvar");
      } else {
          // Dispara Pontuação
          const { error: rpcError } = await supabase.rpc('process_group_results', { p_group_id: groupId });
          if (rpcError) toast.error("Erro no cálculo de pontos: " + rpcError.message);
          else toast.success("Salvo e pontos calculados!");
          
          setEditingClassificationGroupId(null);
          fetchData();
      }
      setLoading(false);
  };

  const getTeamsInGroup = (groupId: string) => teams.filter(t => t.group_id === groupId);
  // Times "sem grupo" ou do próprio grupo (para permitir mover)
  const getAvailableTeams = () => teams.filter(t => !t.group_id); 
  const getTeamName = (id: string) => teams.find(t => t.id === id)?.name || "---";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-fifa-blue">Gestão de Grupos</h2>
            <p className="text-muted-foreground">Crie grupos, adicione times e defina os classificados.</p>
        </div>
        <div className="w-64">
            <Select value={selectedChampionship} onValueChange={setSelectedChampionship}>
                <SelectTrigger><SelectValue placeholder="Selecione o Campeonato" /></SelectTrigger>
                <SelectContent>{championships.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
        </div>
      </div>

      {!selectedChampionship ? (
          <div className="text-center py-12 bg-gray-50 border-2 border-dashed rounded-lg">
              <Filter className="h-10 w-10 text-gray-300 mx-auto mb-2"/>
              <p className="text-gray-500">Selecione um campeonato para começar.</p>
          </div>
      ) : (
        <>
            {/* CARD DE CRIAÇÃO DE GRUPO */}
            <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Novo Grupo</CardTitle></CardHeader>
                <CardContent className="flex gap-2">
                    <Input 
                        placeholder="Nome do Grupo (ex: Grupo A)" 
                        value={newGroupName} 
                        onChange={e => setNewGroupName(e.target.value)}
                    />
                    <Button onClick={handleCreateGroup}><Plus className="h-4 w-4 mr-2"/> Criar</Button>
                </CardContent>
            </Card>

            {/* LISTA DE GRUPOS */}
            <div className="grid gap-6">
                {groups.map(group => {
                    const groupTeams = getTeamsInGroup(group.id);
                    const result = groupResults.find(r => r.group_id === group.id);
                    const isEditingClass = editingClassificationGroupId === group.id;
                    const isAddingTeam = addingTeamGroupId === group.id;

                    return (
                        <Card key={group.id} className="overflow-hidden">
                            <CardHeader className="bg-gray-50 py-3 flex flex-row justify-between items-center">
                                <CardTitle className="text-lg text-fifa-blue">{group.name}</CardTitle>
                                <div className="flex gap-2">
                                    {/* Botão Adicionar Time ao Grupo */}
                                    <Button variant="ghost" size="sm" onClick={() => setAddingTeamGroupId(isAddingTeam ? null : group.id)}>
                                        <Plus className="h-4 w-4 mr-1"/> Time
                                    </Button>
                                </div>
                            </CardHeader>
                            
                            {/* Área de Adicionar Time (Toggle) */}
                            {isAddingTeam && (
                                <div className="p-3 bg-blue-50 border-b border-blue-100 flex gap-2 animate-in slide-in-from-top-2">
                                    <Select value={teamToAdd} onValueChange={setTeamToAdd}>
                                        <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione um time sem grupo..."/></SelectTrigger>
                                        <SelectContent>
                                            {getAvailableTeams().map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Button size="sm" onClick={() => handleAddTeamToGroup(group.id)}>Adicionar</Button>
                                </div>
                            )}

                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Times do Grupo</TableHead>
                                            <TableHead className="w-[180px]">1º Lugar (Pontuação)</TableHead>
                                            <TableHead className="w-[180px]">2º Lugar (Pontuação)</TableHead>
                                            <TableHead className="text-right w-[100px]">Status</TableHead>
                                            <TableHead className="text-right w-[100px]">Ação</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            {/* LISTA DE TIMES NO GRUPO */}
                                            <TableCell>
                                                {groupTeams.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {groupTeams.map(t => (
                                                            <Badge key={t.id} variant="secondary" className="pl-1 pr-2 py-1 gap-1 group relative">
                                                                <span 
                                                                    className="cursor-pointer hover:text-red-500" 
                                                                    onClick={() => handleRemoveTeamFromGroup(t.id)} 
                                                                    title="Remover do grupo"
                                                                >
                                                                    <X className="h-3 w-3"/>
                                                                </span>
                                                                {t.name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                ) : <span className="text-gray-400 italic text-xs">Adicione times...</span>}
                                            </TableCell>

                                            {/* CLASSIFICAÇÃO 1º */}
                                            <TableCell>
                                                {isEditingClass ? (
                                                    <Select value={firstPlace} onValueChange={setFirstPlace}>
                                                        <SelectTrigger className="h-8 text-xs bg-green-50 border-green-200"><SelectValue/></SelectTrigger>
                                                        <SelectContent>{groupTeams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                ) : (
                                                    <span className="text-green-700 font-bold text-sm">{getTeamName(result?.first_place_team_id)}</span>
                                                )}
                                            </TableCell>

                                            {/* CLASSIFICAÇÃO 2º */}
                                            <TableCell>
                                                {isEditingClass ? (
                                                    <Select value={secondPlace} onValueChange={setSecondPlace}>
                                                        <SelectTrigger className="h-8 text-xs bg-blue-50 border-blue-200"><SelectValue/></SelectTrigger>
                                                        <SelectContent>{groupTeams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                ) : (
                                                    <span className="text-blue-700 font-bold text-sm">{getTeamName(result?.second_place_team_id)}</span>
                                                )}
                                            </TableCell>

                                            {/* STATUS */}
                                            <TableCell className="text-right">
                                                {result?.is_completed 
                                                    ? <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1"/> OK</Badge>
                                                    : <Badge variant="outline" className="text-yellow-600 border-yellow-400"><AlertTriangle className="h-3 w-3 mr-1"/> Pend.</Badge>
                                                }
                                            </TableCell>

                                            {/* AÇÕES DE SALVAR/EDITAR */}
                                            <TableCell className="text-right">
                                                {isEditingClass ? (
                                                    <div className="flex justify-end gap-1">
                                                        <Button size="icon" className="h-8 w-8 bg-green-600" onClick={() => handleSaveClassification(group.id)}><Save className="h-4 w-4"/></Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingClassificationGroupId(null)}><X className="h-4 w-4"/></Button>
                                                    </div>
                                                ) : (
                                                    <Button size="sm" variant="outline" className="h-8" onClick={() => handleEditClassification(group)}>
                                                        <Edit className="h-3 w-3 mr-1"/> {result?.is_completed ? "Editar" : "Definir"}
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </>
      )}
    </div>
  );
}