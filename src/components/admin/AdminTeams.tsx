import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";  // Import conforme pedido

// Types
interface Team {
  id: number;
  name: string;
  shortName: string;
  country: string;
}

const AdminTeams = () => {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [newTeam, setNewTeam] = useState<Omit<Team, "id">>({
    name: "",
    shortName: "",
    country: ""
  });
  const [loading, setLoading] = useState(false);

  // Carregar times do Supabase ao montar o componente
  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from<Team>("teams")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        toast({
          title: "Erro ao carregar times",
          description: error.message,
          variant: "destructive"
        });
      } else if (data) {
        setTeams(data);
      }
      setLoading(false);
    };

    fetchTeams();
  }, [toast]);

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
  };

  const handleSaveEdit = async () => {
    if (!editingTeam) return;

    // Validação
    if (!editingTeam.name || !editingTeam.shortName || !editingTeam.country) {
      toast({
        title: "Erro ao salvar",
        description: "Todos os campos são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // Atualizar no Supabase
    const { error } = await supabase
      .from("teams")
      .update({
        name: editingTeam.name,
        shortName: editingTeam.shortName,
        country: editingTeam.country,
      })
      .eq("id", editingTeam.id);

    if (error) {
      toast({
        title: "Erro ao atualizar time",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    // Atualizar localmente
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

  const handleDeleteTeam = async (id: number) => {
    const teamToDelete = teams.find(team => team.id === id);
    if (!teamToDelete) return;

    const { error } = await supabase
      .from("teams")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao remover time",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setTeams(teams.filter(team => team.id !== id));

    toast({
      title: "Time removido",
      description: `${teamToDelete.name} foi removido com sucesso`
    });
  };

  const handleAddTeam = async () => {
    // Validação
    if (!newTeam.name || !newTeam.shortName || !newTeam.country) {
      toast({
        title: "Erro ao adicionar",
        description: "Todos os campos são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // Inserir no Supabase
    const { data, error } = await supabase
      .from("teams")
      .insert([newTeam])
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao adicionar time",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setTeams([...teams, data]);

    // Resetar formulário
    setNewTeam({
      name: "",
      shortName: "",
      country: ""
    });

    toast({
      title: "Time adicionado",
      description: `${data.name} foi adicionado com sucesso`
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
              disabled={loading}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Abreviação</label>
            <Input 
              placeholder="Ex: MCI" 
              maxLength={3}
              value={newTeam.shortName}
              onChange={(e) => setNewTeam({...newTeam, shortName: e.target.value.toUpperCase()})}
              disabled={loading}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">País</label>
            <Input 
              placeholder="Ex: Inglaterra" 
              value={newTeam.country}
              onChange={(e) => setNewTeam({...newTeam, country: e.target.value})}
              disabled={loading}
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={handleAddTeam} className="bg-fifa-blue" disabled={loading}>
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
                            <Button variant="outline" size="sm" onClick={handleSaveEdit} disabled={loading}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={loading}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{team.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gray-100">
                            {team.shortName}
                          </Badge>
                        </TableCell>
                        <TableCell>{team.country}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditTeam(team)} disabled={loading}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteTeam(team.id)} disabled={loading}>
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
