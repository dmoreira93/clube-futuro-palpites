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
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Match } from "@/types/matches";

interface Team {
  id: string;
  name: string;
  flag_url?: string;
  group_id?: string;
}

const AdminMatches = () => {
  const { toast } = useToast();
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editingResult, setEditingResult] = useState<{id: string, homeScore: string, awayScore: string} | null>(null);
  
  const [newMatch, setNewMatch] = useState<Partial<Match>>({
    home_team_id: "",
    away_team_id: "",
    match_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    stage: "Fase de Grupos",
    stadium: "",
  });

  const stages = ["Fase de Grupos", "Oitavas de Final", "Quartas de Final", "Semifinal", "Final"];

  useEffect(() => {
    const fetchTeamsAndMatches = async () => {
      setIsLoading(true);
      try {
        // Fetch teams
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .order('name');
        
        if (teamsError) {
          throw teamsError;
        }
        
        setTeams(teamsData || []);

        // Fetch matches with team details
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select(`
            id, 
            match_date, 
            home_score, 
            away_score, 
            is_finished,
            stage,
            stadium,
            home_team_id, 
            away_team_id,
            home_team:teams!home_team_id(id, name, group_id, flag_url),
            away_team:teams!away_team_id(id, name, group_id, flag_url)
          `)
          .order('match_date', { ascending: true });
        
        if (matchesError) {
          throw matchesError;
        }
        
        setMatches(matchesData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar as equipes ou partidas",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamsAndMatches();
  }, [toast]);

  const getTeamById = (id: string): Team | undefined => {
    return teams.find(team => team.id === id);
  };

  const handleAddMatch = async () => {
    // Validate
    if (
      !newMatch.home_team_id || 
      !newMatch.away_team_id || 
      !newMatch.match_date || 
      !newMatch.stage || 
      !newMatch.stadium
    ) {
      toast({
        title: "Erro ao adicionar partida",
        description: "Todos os campos são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (newMatch.home_team_id === newMatch.away_team_id) {
      toast({
        title: "Erro ao adicionar partida",
        description: "Os times da partida não podem ser iguais",
        variant: "destructive"
      });
      return;
    }

    try {
      // Insert match into database
      const { data, error } = await supabase
        .from('matches')
        .insert({
          home_team_id: newMatch.home_team_id,
          away_team_id: newMatch.away_team_id,
          match_date: newMatch.match_date,
          stage: newMatch.stage,
          stadium: newMatch.stadium,
          is_finished: false,
        })
        .select(`
          id, 
          match_date, 
          home_score, 
          away_score, 
          is_finished,
          stage,
          stadium,
          home_team_id, 
          away_team_id,
          home_team:teams!home_team_id(id, name, group_id, flag_url),
          away_team:teams!away_team_id(id, name, group_id, flag_url)
        `)
        .single();

      if (error) {
        throw error;
      }

      setMatches([...matches, data]);
      
      // Reset form but keep some fields for convenience
      setNewMatch({
        home_team_id: "",
        away_team_id: "",
        match_date: newMatch.match_date,
        stage: newMatch.stage,
        stadium: "",
      });
      
      toast({
        title: "Partida adicionada",
        description: `${getTeamById(newMatch.home_team_id)?.name} vs ${getTeamById(newMatch.away_team_id)?.name} foi adicionada com sucesso`
      });
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar partida",
        description: error.message || "Ocorreu um erro ao salvar a partida",
        variant: "destructive"
      });
      console.error("Error adding match:", error);
    }
  };

  const handleDeleteMatch = async (id: string) => {
    const matchToDelete = matches.find(match => match.id === id);
    if (!matchToDelete) return;
    
    try {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      setMatches(matches.filter(match => match.id !== id));
      
      toast({
        title: "Partida removida",
        description: `A partida foi removida com sucesso`
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover partida",
        description: error.message || "Ocorreu um erro ao remover a partida",
        variant: "destructive"
      });
      console.error("Error deleting match:", error);
    }
  };

  const handleEditMatch = (match: Match) => {
    setEditingMatch({
      ...match,
      match_date: match.match_date ? match.match_date.slice(0, 16) : new Date().toISOString().slice(0, 16) // Format for datetime-local input
    });
  };

  const handleSaveEdit = async () => {
    if (!editingMatch) return;
    
    // Validate
    if (
      !editingMatch.home_team_id || 
      !editingMatch.away_team_id || 
      !editingMatch.match_date || 
      !editingMatch.stage ||
      !editingMatch.stadium
    ) {
      toast({
        title: "Erro ao salvar partida",
        description: "Todos os campos são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (editingMatch.home_team_id === editingMatch.away_team_id) {
      toast({
        title: "Erro ao salvar partida",
        description: "Os times da partida não podem ser iguais",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Update match in database
      const { data, error } = await supabase
        .from('matches')
        .update({
          home_team_id: editingMatch.home_team_id,
          away_team_id: editingMatch.away_team_id,
          match_date: editingMatch.match_date,
          stage: editingMatch.stage,
          stadium: editingMatch.stadium,
        })
        .eq('id', editingMatch.id)
        .select(`
          id, 
          match_date, 
          home_score, 
          away_score, 
          is_finished,
          stage,
          stadium,
          home_team_id, 
          away_team_id,
          home_team:teams!home_team_id(id, name, group_id, flag_url),
          away_team:teams!away_team_id(id, name, group_id, flag_url)
        `)
        .single();

      if (error) {
        throw error;
      }

      // Update match list
      setMatches(matches.map(match => 
        match.id === editingMatch.id ? data : match
      ));
      
      toast({
        title: "Partida atualizada",
        description: "A partida foi atualizada com sucesso"
      });
      
      setEditingMatch(null);
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar partida",
        description: error.message || "Ocorreu um erro ao atualizar a partida",
        variant: "destructive"
      });
      console.error("Error updating match:", error);
    }
  };

  const handleEditResult = (match: Match) => {
    setEditingResult({
      id: match.id,
      homeScore: match.home_score !== null ? String(match.home_score) : "",
      awayScore: match.away_score !== null ? String(match.away_score) : ""
    });
  };

  const handleSaveResult = async () => {
    if (!editingResult) return;

    if (editingResult.homeScore === "" || editingResult.awayScore === "") {
      toast({
        title: "Erro ao registrar resultado",
        description: "Preencha o placar de ambos os times",
        variant: "destructive"
      });
      return;
    }

    try {
      // Update match result in database
      const { data, error } = await supabase
        .from('matches')
        .update({
          home_score: parseInt(editingResult.homeScore),
          away_score: parseInt(editingResult.awayScore),
          is_finished: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingResult.id)
        .select(`
          id, 
          match_date, 
          home_score, 
          away_score, 
          is_finished,
          stage,
          stadium,
          home_team_id, 
          away_team_id,
          home_team:teams!home_team_id(id, name, group_id, flag_url),
          away_team:teams!away_team_id(id, name, group_id, flag_url)
        `)
        .single();

      if (error) {
        throw error;
      }

      // Update match list
      setMatches(matches.map(match => 
        match.id === editingResult.id ? data : match
      ));
      
      // Call function to update user points
      try {
        const { error: pointsError } = await supabase.rpc('update_user_points_for_match', {
          match_id_param: editingResult.id
        });
        
        if (pointsError) {
          console.error("Error updating user points:", pointsError);
          toast({
            title: "Resultado registrado",
            description: "Resultado salvo com sucesso, mas houve um erro ao calcular os pontos",
            variant: "destructive"
          });
          return;
        }
      } catch (pointsError) {
        console.error("Error in RPC call:", pointsError);
      }
      
      toast({
        title: "Resultado registrado",
        description: "Resultado salvo e pontos calculados com sucesso!"
      });
      
      setEditingResult(null);
    } catch (error: any) {
      toast({
        title: "Erro ao registrar resultado",
        description: error.message || "Ocorreu um erro ao salvar o resultado",
        variant: "destructive"
      });
      console.error("Error saving match result:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingMatch(null);
  };

  const handleCancelResult = () => {
    setEditingResult(null);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, "dd/MM/yyyy");
    } catch (e) {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, "HH:mm");
    } catch (e) {
      return "";
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-fifa-blue border-t-transparent rounded-full inline-block mb-4"></div>
          <p className="text-gray-600">Carregando partidas e times...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Gerenciar Partidas</h2>
        <p className="text-gray-600">
          Adicione as partidas do torneio, definindo os times, horários e locais. Registre os resultados das partidas para cálculo automático de pontos.
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-3">Adicionar Nova Partida</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Time Mandante</label>
            <Select 
              value={newMatch.home_team_id || ""} 
              onValueChange={value => setNewMatch({...newMatch, home_team_id: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar Time Mandante" />
              </SelectTrigger>
              <SelectContent>
                {teams.map(team => (
                  <SelectItem key={`home-${team.id}`} value={team.id}>
                    {team.name} {team.group_id ? `(Grupo ${team.group_id})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Time Visitante</label>
            <Select 
              value={newMatch.away_team_id || ""} 
              onValueChange={value => setNewMatch({...newMatch, away_team_id: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar Time Visitante" />
              </SelectTrigger>
              <SelectContent>
                {teams.map(team => (
                  <SelectItem key={`away-${team.id}`} value={team.id}>
                    {team.name} {team.group_id ? `(Grupo ${team.group_id})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Data e Horário</label>
            <div className="relative">
              <Input 
                type="datetime-local" 
                value={newMatch.match_date || ""}
                onChange={(e) => setNewMatch({...newMatch, match_date: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Estádio</label>
            <Input 
              placeholder="Ex: Santiago Bernabéu" 
              value={newMatch.stadium || ""}
              onChange={(e) => setNewMatch({...newMatch, stadium: e.target.value})}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Fase</label>
            <Select 
              value={newMatch.stage || ""} 
              onValueChange={value => setNewMatch({...newMatch, stage: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar Fase" />
              </SelectTrigger>
              <SelectContent>
                {stages.map(stage => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
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
                <TableHead>Estádio</TableHead>
                <TableHead>Fase</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                    Nenhuma partida cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                matches.map(match => (
                  <TableRow key={match.id} className={match.is_finished ? "bg-gray-50" : ""}>
                    {editingMatch?.id === match.id ? (
                      // Editing mode for match details
                      <>
                        <TableCell>
                          <div className="grid grid-cols-2 gap-2 items-center">
                            <Select 
                              value={editingMatch.home_team_id} 
                              onValueChange={value => setEditingMatch({...editingMatch, home_team_id: value})}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {teams.map(team => (
                                  <SelectItem key={`edit-home-${team.id}`} value={team.id}>
                                    {team.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select 
                              value={editingMatch.away_team_id} 
                              onValueChange={value => setEditingMatch({...editingMatch, away_team_id: value})}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {teams.map(team => (
                                  <SelectItem key={`edit-away-${team.id}`} value={team.id}>
                                    {team.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="datetime-local" 
                            value={editingMatch.match_date}
                            onChange={(e) => setEditingMatch({...editingMatch, match_date: e.target.value})}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            value={editingMatch.stadium || ""} 
                            onChange={(e) => setEditingMatch({...editingMatch, stadium: e.target.value})}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={editingMatch.stage} 
                            onValueChange={value => setEditingMatch({...editingMatch, stage: value})}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {stages.map(stage => (
                                <SelectItem key={`edit-stage-${stage}`} value={stage}>
                                  {stage}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {/* Placeholder for result column */}
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
                    ) : editingResult?.id === match.id ? (
                      // Editing mode for result
                      <>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{match.home_team?.name}</span>
                            <span className="text-gray-600">vs</span>
                            <span className="font-medium">{match.away_team?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(match.match_date)}</TableCell>
                        <TableCell>{match.stadium}</TableCell>
                        <TableCell>{match.stage}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              min="0"
                              className="w-16 h-8"
                              value={editingResult.homeScore}
                              onChange={(e) => setEditingResult({...editingResult, homeScore: e.target.value})}
                            />
                            <span>x</span>
                            <Input
                              type="number"
                              min="0"
                              className="w-16 h-8"
                              value={editingResult.awayScore}
                              onChange={(e) => setEditingResult({...editingResult, awayScore: e.target.value})}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={handleSaveResult}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleCancelResult}>
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
                            <span className="font-medium">{match.home_team?.name}</span>
                            <span className="text-gray-600">vs</span>
                            <span className="font-medium">{match.away_team?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{formatDate(match.match_date)}</div>
                            <div className="text-xs text-gray-500">{formatTime(match.match_date)}</div>
                          </div>
                        </TableCell>
                        <TableCell>{match.stadium}</TableCell>
                        <TableCell>{match.stage}</TableCell>
                        <TableCell>
                          {match.is_finished ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                              {match.home_score} x {match.away_score}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="cursor-pointer" onClick={() => handleEditResult(match)}>
                              Registrar resultado
                            </Badge>
                          )}
                        </TableCell>
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
