
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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Types
interface Team {
  id: number;
  name: string;
  shortName: string;
  country: string;
}

const AdminTeams = () => {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([
    { id: 1, name: "Real Madrid", shortName: "RMA", country: "Espanha" },
    { id: 2, name: "Manchester City", shortName: "MCI", country: "Inglaterra" },
    { id: 3, name: "Bayern Munich", shortName: "BAY", country: "Alemanha" },
    { id: 4, name: "Fluminense", shortName: "FLU", country: "Brasil" },
  ]);
  
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [newTeam, setNewTeam] = useState<Omit<Team, "id">>({
    name: "",
    shortName: "",
    country: ""
  });

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
  };

  const handleSaveEdit = () => {
    if (!editingTeam) return;
    
    // Validate
    if (!editingTeam.name || !editingTeam.shortName || !editingTeam.country) {
      toast({
        title: "Erro ao salvar",
        description: "Todos os campos são obrigatórios",
        variant: "destructive"
      });
      return;
    }
    
    // Update team
    setTeams(teams.map(team => 
      team.id === editingTeam.id ? editingTeam : team
    ));
    
    toast({
      title: "Time atualizado",
      description: `${editingTeam.name} foi atualizado com sucesso`
    });
    
    setEditingTeam(null);
  };

  const handleCancelEdit = () => {
    setEditingTeam(null);
  };

  const handleDeleteTeam = (id: number) => {
    const teamToDelete = teams.find(team => team.id === id);
    if (!teamToDelete) return;
    
    setTeams(teams.filter(team => team.id !== id));
    
    toast({
      title: "Time removido",
      description: `${teamToDelete.name} foi removido com sucesso`
    });
  };

  const handleAddTeam = () => {
    // Validate
    if (!newTeam.name || !newTeam.shortName || !newTeam.country) {
      toast({
        title: "Erro ao adicionar",
        description: "Todos os campos são obrigatórios",
        variant: "destructive"
      });
      return;
    }
    
    // Create new team with unique ID
    const maxId = teams.length > 0 ? Math.max(...teams.map(t => t.id)) : 0;
    const team = { ...newTeam, id: maxId + 1 };
    
    setTeams([...teams, team]);
    
    // Reset form
    setNewTeam({
      name: "",
      shortName: "",
      country: ""
    });
    
    toast({
      title: "Time adicionado",
      description: `${newTeam.name} foi adicionado com sucesso`
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Gerenciar Times</h2>
        <p className="text-gray-600">Adicione, edite ou remova os times participantes do torneio.</p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-3">Adicionar Novo Time</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Nome do Time</label>
            <Input 
              placeholder="Ex: Manchester City" 
              value={newTeam.name}
              onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Abreviação</label>
            <Input 
              placeholder="Ex: MCI" 
              maxLength={3}
              value={newTeam.shortName}
              onChange={(e) => setNewTeam({...newTeam, shortName: e.target.value.toUpperCase()})}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">País</label>
            <Input 
              placeholder="Ex: Inglaterra" 
              value={newTeam.country}
              onChange={(e) => setNewTeam({...newTeam, country: e.target.value})}
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={handleAddTeam} className="bg-fifa-blue">
            <Plus className="h-4 w-4 mr-1" /> Adicionar Time
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Lista de Times ({teams.length})</h3>
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Abreviação</TableHead>
                <TableHead>País</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                    Nenhum time cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                teams.map(team => (
                  <TableRow key={team.id}>
                    {editingTeam?.id === team.id ? (
                      // Editing mode
                      <>
                        <TableCell>
                          <Input 
                            value={editingTeam.name} 
                            onChange={(e) => setEditingTeam({...editingTeam, name: e.target.value})}
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            value={editingTeam.shortName} 
                            maxLength={3}
                            onChange={(e) => setEditingTeam({...editingTeam, shortName: e.target.value.toUpperCase()})}
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            value={editingTeam.country} 
                            onChange={(e) => setEditingTeam({...editingTeam, country: e.target.value})}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={handleSaveEdit}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      // Display mode
                      <>
                        <TableCell>
                          {team.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gray-100">
                            {team.shortName}
                          </Badge>
                        </TableCell>
                        <TableCell>{team.country}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditTeam(team)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteTeam(team.id)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminTeams;
