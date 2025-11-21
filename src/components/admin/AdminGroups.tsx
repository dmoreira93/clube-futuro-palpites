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
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Edit, Loader2, Trophy, Users, CheckCircle, AlertTriangle, Save, X } from "lucide-react";
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
      // Upsert na tabela groups_results
      await supabase
        .from("groups_results")
        .upsert({
          group_id: editingClassificationGroupId,
          first_place_team_id: selectedFirstPlace,
          second_place_team_id: selectedSecondPlace,
          is_completed: true,
        }, { onConflict: 'group_id' });

      toast.success("Classificação salva! Calculando pontos...");

      // Chamada para a função SQL no backend para calcular pontos
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
    if (!teamId) return <span className="text-gray-400 italic">N/A</span>;
    const team = teams.find(team => team.id === teamId);
    return (
        <div className="flex items-center gap-2">
            {team?.flag_url && <img src={team.flag_url} alt={team.name} className="w-5 h-5 rounded-full object-cover border" />}
            <span>{team?.name || "Desconhecido"}</span>
        </div>
    );
  };

  const getTeamsInGroup = (groupId: string) => {
    return teams.filter(team => team.group_id === groupId);
  };

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-fifa-blue flex items-center gap-2">
                <Users className="h-6 w-6 text-fifa-gold" /> Classificação de Grupos
            </h2>
            <p className="text-muted-foreground text-sm">Defina os classificados de cada grupo para calcular a pontuação dos participantes.</p>
        </div>
      </div>

      <Card className="border-t-4 border-t-fifa-blue shadow-md bg-white">
        <CardHeader className="pb-2 border-b border-gray-100 mb-2">
             <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-lg text-gray-800">Grupos do Campeonato</CardTitle>
                    <CardDescription>Total: {groups.length} grupos cadastrados.</CardDescription>
                </div>
                <Trophy className="h-8 w-8 text-gray-100" />
            </div>
        </CardHeader>
        
        <CardContent>
            {loading && groups.length === 0 ? (
                 <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-fifa-blue" /></div>
            ) : (
                <div className="rounded-md border border-gray-200 overflow-hidden">
                    <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                        <TableHead className="font-bold text-fifa-blue">Grupo</TableHead>
                        <TableHead className="font-bold text-fifa-blue">Times</TableHead>
                        <TableHead className="font-bold text-fifa-blue w-[200px]">1º Lugar</TableHead>
                        <TableHead className="font-bold text-fifa-blue w-[200px]">2º Lugar</TableHead>
                        <TableHead className="font-bold text-fifa-blue text-center">Status</TableHead>
                        <TableHead className="font-bold text-fifa-blue text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {groups.map((group) => {
                        const currentGroupResult = groupResults.find(res => res.group_id === group.id);
                        const isEditing = editingClassificationGroupId === group.id;
                        const teamsInGroup = getTeamsInGroup(group.id);

                        return (
                            <TableRow key={group.id} className="hover:bg-blue-50/30 transition-colors">
                            <TableCell className="font-bold text-lg text-fifa-blue align-middle">
                                {group.name}
                            </TableCell>
                            
                            <TableCell className="align-middle">
                                {teamsInGroup.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                    {teamsInGroup.map(team => (
                                        <Badge key={team.id} variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200 font-normal border border-gray-200">
                                            {team.name}
                                        </Badge>
                                    ))}
                                </div>
                                ) : <span className="text-gray-400 text-xs">Nenhum time</span>}
                            </TableCell>
                            
                            <TableCell className="align-middle">
                                {isEditing ? (
                                <Select onValueChange={setSelectedFirstPlace} value={selectedFirstPlace || ""} disabled={loading}>
                                    <SelectTrigger className="w-full border-green-200 bg-green-50 text-green-800 font-medium focus:ring-green-500"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        {teamsInGroup.map((team) => (<SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                                ) : (
                                    <div className="flex items-center gap-2 p-2 rounded bg-green-50/50 border border-green-100 text-green-800 font-medium">
                                        <span className="text-xs font-bold text-green-600">1º</span>
                                        {getTeamNameById(currentGroupResult?.first_place_team_id)}
                                    </div>
                                )}
                            </TableCell>
                            
                            <TableCell className="align-middle">
                                {isEditing ? (
                                <Select onValueChange={setSelectedSecondPlace} value={selectedSecondPlace || ""} disabled={loading}>
                                    <SelectTrigger className="w-full border-blue-200 bg-blue-50 text-blue-800 font-medium focus:ring-blue-500"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        {teamsInGroup.map((team) => (<SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                                ) : (
                                    <div className="flex items-center gap-2 p-2 rounded bg-blue-50/50 border border-blue-100 text-blue-800 font-medium">
                                        <span className="text-xs font-bold text-blue-600">2º</span>
                                        {getTeamNameById(currentGroupResult?.second_place_team_id)}
                                    </div>
                                )}
                            </TableCell>
                            
                            <TableCell className="text-center align-middle">
                                {currentGroupResult?.is_completed ? (
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 gap-1">
                                        <CheckCircle className="w-3 h-3" /> Finalizado
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="border-yellow-300 text-yellow-600 bg-yellow-50 gap-1">
                                        <AlertTriangle className="w-3 h-3" /> Pendente
                                    </Badge>
                                )}
                            </TableCell>
                            
                            <TableCell className="text-right align-middle">
                                {isEditing ? (
                                <div className="flex gap-2 justify-end">
                                    <Button 
                                        onClick={processGroupClassificationAndCalculatePoints} 
                                        disabled={loading} 
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 text-white h-8"
                                    >
                                    {loading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />}
                                    Salvar
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => setEditingClassificationGroupId(null)} 
                                        disabled={loading}
                                        size="sm"
                                        className="h-8 w-8 p-0 text-gray-500"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                ) : (
                                <Button 
                                    onClick={() => handleEditClassificationClick(group.id)} 
                                    disabled={loading} 
                                    variant="outline"
                                    size="sm"
                                    className="h-8 border-fifa-blue text-fifa-blue hover:bg-blue-50"
                                >
                                    <Edit className="mr-2 h-3 w-3" />
                                    {currentGroupResult?.is_completed ? "Corrigir" : "Definir"}
                                </Button>
                                )}
                            </TableCell>
                            </TableRow>
                        );
                        })}
                    </TableBody>
                    </Table>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminGroups;