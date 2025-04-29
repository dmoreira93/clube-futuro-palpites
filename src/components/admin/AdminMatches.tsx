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
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash, Calendar, Clock, Edit, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// Types
interface Team {
  id: number;
  name: string;
  shortName: string;
  country: string;
}

interface Match {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
  date: string;
  time: string;
  group: string;
  stadium: string;
  round: string;
}

const AdminMatches = () => {
  const { toast } = useToast();
  
  // Sample data for teams
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

  // Sample data for matches
  const [matches, setMatches] = useState<Match[]>([
    {
      id: 1,
      homeTeamId: 1,
      awayTeamId: 2,
      date: "2025-06-15",
      time: "15:00",
      group: "A",
      stadium: "Santiago Bernabéu",
      round: "Fase de Grupos"
    },
    {
      id: 2,
      homeTeamId: 3,
      awayTeamId: 4,
      date: "2025-06-16",
      time: "18:00",
      group: "B",
      stadium: "Allianz Arena",
      round: "Fase de Grupos"
    }
  ]);

  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  
  const [newMatch, setNewMatch] = useState<Omit<Match, "id">>({
    homeTeamId: 0,
    awayTeamId: 0,
    date: format(new Date(), "yyyy-MM-dd"),
    time: "15:00",
    group: "A",
    stadium: "",
    round: "Fase de Grupos"
  });

  const groups = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const rounds = ["Fase de Grupos", "Oitavas de Final", "Quartas de Final", "Semifinal", "Final"];

  const getTeamById = (id: number) => {
    return teams.find(team => team.id === id);
  };

  const handleAddMatch = () => {
    // Validate
    if (
      newMatch.homeTeamId === 0 || 
      newMatch.awayTeamId === 0 || 
      !newMatch.date || 
      !newMatch.time || 
      !newMatch.stadium
    ) {
      toast({
        title: "Erro ao adicionar partida",
        description: "Todos os campos são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (newMatch.homeTeamId === newMatch.awayTeamId) {
      toast({
        title: "Erro ao adicionar partida",
        description: "Os times da partida não podem ser iguais",
        variant: "destructive"
      });
      return;
    }

    // Create new match with unique ID
    const maxId = matches.length > 0 ? Math.max(...matches.map(m => m.id)) : 0;
    const match = { ...newMatch, id: maxId + 1 };
    
    setMatches([...matches, match]);
    
    // Reset form but keep some fields for convenience
    setNewMatch({
      ...newMatch,
      homeTeamId: 0,
      awayTeamId: 0,
      stadium: ""
    });
    
    toast({
      title: "Partida adicionada",
      description: `${getTeamById(newMatch.homeTeamId)?.name} vs ${getTeamById(newMatch.awayTeamId)?.name} foi adicionada com sucesso`
    });
  };

  const handleDeleteMatch = (id: number) => {
    const matchToDelete = matches.find(match => match.id === id);
    if (!matchToDelete) return;
    
    setMatches(matches.filter(match => match.id !== id));
    
    toast({
      title: "Partida removida",
      description: `${getTeamById(matchToDelete.homeTeamId)?.name} vs ${getTeamById(matchToDelete.awayTeamId)?.name} foi removida com sucesso`
    });
  };

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
  };

  const handleSaveEdit = () => {
    if (!editingMatch) return;
    
    // Validate
    if (
      editingMatch.homeTeamId === 0 || 
      editingMatch.awayTeamId === 0 || 
      !editingMatch.date || 
      !editingMatch.time || 
      !editingMatch.stadium
    ) {
      toast({
        title: "Erro ao salvar partida",
        description: "Todos os campos são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (editingMatch.homeTeamId === editingMatch.awayTeamId) {
      toast({
        title: "Erro ao salvar partida",
        description: "Os times da partida não podem ser iguais",
        variant: "destructive"
      });
      return;
    }
    
    // Update match
    setMatches(matches.map(match => 
      match.id === editingMatch.id ? editingMatch : match
    ));
    
    toast({
      title: "Partida atualizada",
      description: `${getTeamById(editingMatch.homeTeamId)?.name} vs ${getTeamById(editingMatch.awayTeamId)?.name} foi atualizada com sucesso`
    });
    
    setEditingMatch(null);
  };

  const handleCancelEdit = () => {
    setEditingMatch(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "dd/MM/yyyy");
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Gerenciar Partidas</h2>
        <p className="text-gray-600">
          Adicione as partidas do torneio, definindo os times, horários e locais.
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-3">Adicionar Nova Partida</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Time Mandante</label>
            <Select 
              value={newMatch.homeTeamId === 0 ? undefined : String(newMatch.homeTeamId)} 
              onValueChange={value => setNewMatch({...newMatch, homeTeamId: Number(value)})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar Time Mandante" />
              </SelectTrigger>
              <SelectContent>
                {teams.map(team => (
                  <SelectItem key={`home-${team.id}`} value={String(team.id)}>
                    {team.name} ({team.country})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Time Visitante</label>
            <Select 
              value={newMatch.awayTeamId === 0 ? undefined : String(newMatch.awayTeamId)} 
              onValueChange={value => setNewMatch({...newMatch, awayTeamId: Number(value)})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar Time Visitante" />
              </SelectTrigger>
              <SelectContent>
                {teams.map(team => (
                  <SelectItem key={`away-${team.id}`} value={String(team.id)}>
                    {team.name} ({team.country})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Data</label>
            <div className="relative">
              <Input 
                type="date" 
                value={newMatch.date}
                onChange={(e) => setNewMatch({...newMatch, date: e.target.value})}
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Horário</label>
            <div className="relative">
              <Input 
                type="time" 
                value={newMatch.time}
                onChange={(e) => setNewMatch({...newMatch, time: e.target.value})}
              />
              <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Estádio</label>
            <Input 
              placeholder="Ex: Santiago Bernabéu" 
              value={newMatch.stadium}
              onChange={(e) => setNewMatch({...newMatch, stadium: e.target.value})}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Grupo</label>
            <Select 
              value={newMatch.group} 
              onValueChange={value => setNewMatch({...newMatch, group: value})}
            >
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
            <label className="text-sm text-gray-600 mb-1 block">Fase</label>
            <Select 
              value={newMatch.round} 
              onValueChange={value => setNewMatch({...newMatch, round: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar Fase" />
              </SelectTrigger>
              <SelectContent>
                {rounds.map(round => (
                  <SelectItem key={round} value={round}>
                    {round}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="mt-3 flex justify-end">
          <Button onClick={handleAddMatch} className="bg-fifa-blue">
            <Plus className="h-4 w-4 mr-1" /> Adicionar Partida
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Lista de Partidas ({matches.length})</h3>
        <div className="bg-white rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Times</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Estádio</TableHead>
                <TableHead>Fase</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                    Nenhuma partida cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                matches.map(match => (
                  <TableRow key={match.id}>
                    {editingMatch?.id === match.id ? (
                      // Editing mode
                      <>
                        <TableCell>
                          <div className="grid grid-cols-2 gap-2 items-center">
                            <Select 
                              value={String(editingMatch.homeTeamId)} 
                              onValueChange={value => setEditingMatch({...editingMatch, homeTeamId: Number(value)})}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {teams.map(team => (
                                  <SelectItem key={`edit-home-${team.id}`} value={String(team.id)}>
                                    {team.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select 
                              value={String(editingMatch.awayTeamId)} 
                              onValueChange={value => setEditingMatch({...editingMatch, awayTeamId: Number(value)})}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {teams.map(team => (
                                  <SelectItem key={`edit-away-${team.id}`} value={String(team.id)}>
                                    {team.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="date" 
                            value={editingMatch.date}
                            onChange={(e) => setEditingMatch({...editingMatch, date: e.target.value})}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="time" 
                            value={editingMatch.time}
                            onChange={(e) => setEditingMatch({...editingMatch, time: e.target.value})}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={editingMatch.group} 
                            onValueChange={value => setEditingMatch({...editingMatch, group: value})}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {groups.map(group => (
                                <SelectItem key={`edit-group-${group}`} value={group}>
                                  Grupo {group}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input 
                            value={editingMatch.stadium} 
                            onChange={(e) => setEditingMatch({...editingMatch, stadium: e.target.value})}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={editingMatch.round} 
                            onValueChange={value => setEditingMatch({...editingMatch, round: value})}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {rounds.map(round => (
                                <SelectItem key={`edit-round-${round}`} value={round}>
                                  {round}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                          <div className="flex flex-col">
                            <span className="font-medium">{getTeamById(match.homeTeamId)?.name}</span>
                            <span className="text-gray-600">vs</span>
                            <span className="font-medium">{getTeamById(match.awayTeamId)?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(match.date)}</TableCell>
                        <TableCell>{match.time}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gray-100">
                            Grupo {match.group}
                          </Badge>
                        </TableCell>
                        <TableCell>{match.stadium}</TableCell>
                        <TableCell>{match.round}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditMatch(match)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteMatch(match.id)}>
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

export default AdminMatches;
