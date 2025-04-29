
import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Types
interface Team {
  id: number;
  name: string;
  shortName: string;
  country: string;
}

interface GroupTeam {
  id: number;
  teamId: number;
  groupId: string;
}

const AdminGroups = () => {
  const { toast } = useToast();
  
  // Mock data - in a real app, this would come from an API
  const [teams] = useState<Team[]>([
    { id: 1, name: "Real Madrid", shortName: "RMA", country: "Espanha" },
    { id: 2, name: "Manchester City", shortName: "MCI", country: "Inglaterra" },
    { id: 3, name: "Bayern Munich", shortName: "BAY", country: "Alemanha" },
    { id: 4, name: "Fluminense", shortName: "FLU", country: "Brasil" },
    { id: 5, name: "Inter Miami", shortName: "MIA", country: "EUA" },
    { id: 6, name: "Al-Hilal", shortName: "HIL", country: "Arábia Saudita" },
    { id: 7, name: "Urawa Red", shortName: "URA", country: "Japão" },
    { id: 8, name: "Al Ahly", shortName: "AHL", country: "Egito" },
  ]);

  const [groupTeams, setGroupTeams] = useState<GroupTeam[]>([
    { id: 1, teamId: 1, groupId: "A" },
    { id: 2, teamId: 2, groupId: "B" },
    { id: 3, teamId: 3, groupId: "A" },
    { id: 4, teamId: 4, groupId: "B" },
    { id: 5, teamId: 5, groupId: "C" },
    { id: 6, teamId: 6, groupId: "C" },
    { id: 7, teamId: 7, groupId: "D" },
    { id: 8, teamId: 8, groupId: "D" },
  ]);

  const [groups] = useState<string[]>(["A", "B", "C", "D", "E", "F", "G", "H"]);
  const [selectedGroup, setSelectedGroup] = useState<string>("A");
  const [selectedTeam, setSelectedTeam] = useState<number | "">("");

  const getAvailableTeams = () => {
    // Teams that are not already in a group
    const assignedTeamIds = groupTeams.map(gt => gt.teamId);
    return teams.filter(team => !assignedTeamIds.includes(team.id));
  };

  const getTeamById = (id: number) => {
    return teams.find(team => team.id === id);
  };

  const handleAddTeamToGroup = () => {
    if (selectedTeam === "") {
      toast({
        title: "Erro ao adicionar",
        description: "Selecione um time para adicionar ao grupo",
        variant: "destructive"
      });
      return;
    }

    // Create new group team with unique ID
    const maxId = groupTeams.length > 0 ? Math.max(...groupTeams.map(gt => gt.id)) : 0;
    const newGroupTeam = { 
      id: maxId + 1, 
      teamId: selectedTeam as number, 
      groupId: selectedGroup 
    };
    
    setGroupTeams([...groupTeams, newGroupTeam]);
    
    // Reset selection
    setSelectedTeam("");
    
    toast({
      title: "Time adicionado ao grupo",
      description: `${getTeamById(selectedTeam as number)?.name} foi adicionado ao Grupo ${selectedGroup}`
    });
  };

  const handleRemoveTeamFromGroup = (groupTeamId: number) => {
    const groupTeam = groupTeams.find(gt => gt.id === groupTeamId);
    if (!groupTeam) return;
    
    const team = getTeamById(groupTeam.teamId);
    
    setGroupTeams(groupTeams.filter(gt => gt.id !== groupTeamId));
    
    toast({
      title: "Time removido do grupo",
      description: `${team?.name} foi removido do Grupo ${groupTeam.groupId}`
    });
  };

  const getTeamsInGroup = (groupId: string) => {
    return groupTeams
      .filter(gt => gt.groupId === groupId)
      .map(gt => getTeamById(gt.teamId))
      .filter(Boolean) as Team[];
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Gerenciar Grupos</h2>
        <p className="text-gray-600">
          Organize os times em grupos para a fase de grupos do torneio.
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-3">Adicionar Time a um Grupo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Selecionar Grupo</label>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar Grupo" />
              </SelectTrigger>
              <SelectContent>
                {groups.map(group => (
                  <SelectItem key={group} value={group}>
                    Grupo {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Selecionar Time</label>
            <Select 
              value={selectedTeam === "" ? undefined : String(selectedTeam)} 
              onValueChange={value => setSelectedTeam(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar Time" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableTeams().map(team => (
                  <SelectItem key={team.id} value={String(team.id)}>
                    {team.name} ({team.country})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleAddTeamToGroup} className="bg-fifa-blue w-full">
              <Plus className="h-4 w-4 mr-1" /> Adicionar ao Grupo {selectedGroup}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {groups.map(group => (
          <Card key={group} className={getTeamsInGroup(group).length ? "" : "border-dashed bg-gray-50"}>
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center">
                <span>Grupo {group}</span>
                <Badge variant="outline">
                  {getTeamsInGroup(group).length} time(s)
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getTeamsInGroup(group).length === 0 ? (
                <div className="text-center py-4 text-gray-500 italic">
                  Nenhum time adicionado
                </div>
              ) : (
                <ul className="space-y-2">
                  {getTeamsInGroup(group).map(team => (
                    <li key={team.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <span className="font-medium">{team.name}</span>
                        <Badge variant="outline" className="ml-2 bg-gray-100">
                          {team.shortName}
                        </Badge>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          const groupTeam = groupTeams.find(gt => gt.teamId === team.id);
                          if (groupTeam) handleRemoveTeamFromGroup(groupTeam.id);
                        }}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminGroups;
