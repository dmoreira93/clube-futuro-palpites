
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Volleyball as SoccerBallIcon, Trophy as TrophyIcon, Users as UsersIcon, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Match } from "@/types/matches";
import { Prediction, GroupPrediction, FinalPrediction } from "@/types/predictions";

const Palpites = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // State for data loading
  const [loading, setLoading] = useState(true);
  
  // State for all data
  const [matchBets, setMatchBets] = useState<{ [key: string]: { home: string, away: string } }>({});
  const [groupPredictions, setGroupPredictions] = useState<{ [key: string]: { first: string, second: string } }>({});
  const [finalPredictions, setFinalPredictions] = useState({
    champion: "",
    viceChampion: "",
    third: "",
    fourth: "",
  });
  const [userPassword, setUserPassword] = useState("");
  
  // State for matches and teams from database
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [existingPredictions, setExistingPredictions] = useState<Prediction[]>([]);
  const [existingGroupPredictions, setExistingGroupPredictions] = useState<GroupPrediction[]>([]);
  const [existingFinalPredictions, setExistingFinalPredictions] = useState<FinalPrediction[]>([]);
  
  const [submitting, setSubmitting] = useState(false);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast("Você precisa estar logado para acessar esta página", {
        description: "Redirecionando para a página de login"
      });
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);
  
  // Load data from the database
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch matches - FILTERING ONLY GROUP STAGE MATCHES
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select(`
            id, 
            match_date, 
            home_score, 
            away_score, 
            stage, 
            home_team_id, 
            away_team_id,
            home_team:home_team_id(id, name, flag_url),
            away_team:away_team_id(id, name, flag_url),
            is_finished
          `)
          .ilike('stage', '%Grupo%') // Only fetch group stage matches
          .order('match_date', { ascending: true });
          
        if (matchesError) {
          console.error("Error fetching matches:", matchesError);
          toast("Erro ao carregar jogos", { 
            description: "Ocorreu um erro ao buscar os jogos no banco de dados" 
          });
        } else {
          setMatches(matchesData || []);
        }
        
        // Fetch teams
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, name, group_id, flag_url')
          .order('name', { ascending: true });
          
        if (teamsError) {
          console.error("Error fetching teams:", teamsError);
        } else {
          setTeams(teamsData || []);
        }
        
        // Fetch groups
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select('id, name');
          
        if (groupsError) {
          console.error("Error fetching groups:", groupsError);
        } else {
          setGroups(groupsData || []);
        }
        
        // Fetch user's existing predictions if the user is logged in
        if (user?.id) {
          // Match predictions
          const { data: predictionsData, error: predictionsError } = await supabase
            .from('predictions')
            .select('*')
            .eq('user_id', user.id);
            
          if (predictionsError) {
            console.error("Error fetching match predictions:", predictionsError);
          } else {
            setExistingPredictions(predictionsData || []);
            
            // Populate the matchBets state with existing predictions
            const existingBets: { [key: string]: { home: string, away: string } } = {};
            predictionsData?.forEach((prediction: Prediction) => {
              existingBets[prediction.match_id] = {
                home: prediction.home_score.toString(),
                away: prediction.away_score.toString()
              };
            });
            setMatchBets(existingBets);
          }
          
          // Group predictions
          const { data: groupPredictionsData, error: groupPredictionsError } = await supabase
            .from('group_predictions')
            .select('*')
            .eq('user_id', user.id);
            
          if (groupPredictionsError) {
            console.error("Error fetching group predictions:", groupPredictionsError);
          } else {
            setExistingGroupPredictions(groupPredictionsData || []);
            
            // Populate the groupPredictions state with existing predictions
            const existingGroupPreds: { [key: string]: { first: string, second: string } } = {};
            groupPredictionsData?.forEach((prediction: GroupPrediction) => {
              existingGroupPreds[prediction.group_id] = {
                first: prediction.first_team_id,
                second: prediction.second_team_id
              };
            });
            setGroupPredictions(existingGroupPreds);
          }
          
          // Final predictions
          const { data: finalPredictionsData, error: finalPredictionsError } = await supabase
            .from('final_predictions')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (finalPredictionsError) {
            console.error("Error fetching final predictions:", finalPredictionsError);
          } else if (finalPredictionsData) {
            setExistingFinalPredictions([finalPredictionsData]);
            
            // Populate finalPredictions state with existing predictions
            setFinalPredictions({
              champion: finalPredictionsData.champion_id || "",
              viceChampion: finalPredictionsData.vice_champion_id || "",
              third: finalPredictionsData.third_place_id || "",
              fourth: finalPredictionsData.fourth_place_id || ""
            });
          }
        }
        
      } catch (error) {
        console.error("Error fetching data:", error);
        toast("Erro ao carregar dados", { 
          description: "Ocorreu um erro ao buscar os dados no banco de dados" 
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, user?.id]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR");
  };
  
  // Group teams by their group_id
  const teamsByGroup = teams.reduce((acc: any, team) => {
    if (!team.group_id) return acc;
    
    if (!acc[team.group_id]) {
      acc[team.group_id] = [];
    }
    acc[team.group_id].push(team);
    return acc;
  }, {});
  
  // Process groups with their teams for display
  const groupsWithTeams = groups.map(group => ({
    ...group,
    teams: teamsByGroup[group.id] || []
  }));

  const handleMatchBetChange = (matchId: string, team: 'home' | 'away', value: string) => {
    setMatchBets(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId] || { home: '', away: '' },
        [team]: value
      }
    }));
  };

  const handleGroupPredictionChange = (groupId: string, position: 'first' | 'second', value: string) => {
    setGroupPredictions(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId] || { first: '', second: '' },
        [position]: value
      }
    }));
  };

  const handleFinalPredictionChange = (position: keyof typeof finalPredictions, value: string) => {
    setFinalPredictions(prev => ({
      ...prev,
      [position]: value
    }));
  };

  const handleSubmitBets = async () => {
    if (!user?.id) {
      toast("Você precisa estar logado para salvar palpites", { 
        description: "Faça login e tente novamente" 
      });
      return;
    }
    
    if (!userPassword) {
      toast("Senha não informada", { 
        description: "Por favor, digite sua senha para confirmar os palpites" 
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Verify the user's password
      const { data: userData, error: userError } = await supabase
        .from('users_custom')
        .select('id')
        .eq('id', user.id)
        .eq('password', userPassword)
        .single();
        
      if (userError || !userData) {
        toast("Senha incorreta", { 
          description: "A senha informada não confere. Tente novamente." 
        });
        setSubmitting(false);
        return;
      }
      
      // Validate match predictions
      const invalidPredictions = Object.entries(matchBets).filter(([_, scores]) => {
        const homeScore = parseInt(scores.home);
        const awayScore = parseInt(scores.away);
        return isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0;
      });
      
      if (invalidPredictions.length > 0) {
        toast("Palpites inválidos", { 
          description: "Alguns palpites possuem valores inválidos. Verifique e tente novamente." 
        });
        setSubmitting(false);
        return;
      }
      
      // Save match predictions to the database
      let newMatchPredictions = 0;
      let updatedMatchPredictions = 0;
      
      // Process match predictions
      for (const [matchId, scores] of Object.entries(matchBets)) {
        const homeScore = parseInt(scores.home);
        const awayScore = parseInt(scores.away);
        
        if (isNaN(homeScore) || isNaN(awayScore)) continue;
        
        const existingPrediction = existingPredictions.find(p => 
          p.match_id === matchId && p.user_id === user.id
        );
        
        if (existingPrediction) {
          // Update existing prediction
          const { error: updateError } = await supabase
            .from('predictions')
            .update({
              home_score: homeScore,
              away_score: awayScore,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPrediction.id);
            
          if (updateError) {
            console.error(`Error updating prediction ${existingPrediction.id}:`, updateError);
          } else {
            updatedMatchPredictions++;
          }
        } else {
          // Insert new prediction
          const { error: insertError } = await supabase
            .from('predictions')
            .insert({
              match_id: matchId,
              user_id: user.id,
              home_score: homeScore,
              away_score: awayScore
            });
            
          if (insertError) {
            console.error("Error inserting match prediction:", insertError);
          } else {
            newMatchPredictions++;
          }
        }
      }
      
      // Process group predictions
      let newGroupPredictions = 0;
      let updatedGroupPredictions = 0;
      
      for (const [groupId, positions] of Object.entries(groupPredictions)) {
        if (!positions.first || !positions.second) continue;
        
        const existingGroupPrediction = existingGroupPredictions.find(p => 
          p.group_id === groupId && p.user_id === user.id
        );
        
        if (existingGroupPrediction) {
          // Update existing prediction
          const { error: updateError } = await supabase
            .from('group_predictions')
            .update({
              first_team_id: positions.first,
              second_team_id: positions.second,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingGroupPrediction.id);
            
          if (updateError) {
            console.error(`Error updating group prediction:`, updateError);
          } else {
            updatedGroupPredictions++;
          }
        } else {
          // Insert new prediction
          const { error: insertError } = await supabase
            .from('group_predictions')
            .insert({
              group_id: groupId,
              user_id: user.id,
              first_team_id: positions.first,
              second_team_id: positions.second
            });
            
          if (insertError) {
            console.error("Error inserting group prediction:", insertError);
          } else {
            newGroupPredictions++;
          }
        }
      }
      
      // Process final predictions
      let finalPredictionUpdated = false;
      
      if (finalPredictions.champion && finalPredictions.viceChampion && 
          finalPredictions.third && finalPredictions.fourth) {
        
        const existingFinalPrediction = existingFinalPredictions[0];
        
        if (existingFinalPrediction) {
          // Update existing prediction
          const { error: updateError } = await supabase
            .from('final_predictions')
            .update({
              champion_id: finalPredictions.champion,
              vice_champion_id: finalPredictions.viceChampion,
              third_place_id: finalPredictions.third,
              fourth_place_id: finalPredictions.fourth,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingFinalPrediction.id);
            
          if (updateError) {
            console.error("Error updating final prediction:", updateError);
          } else {
            finalPredictionUpdated = true;
          }
        } else {
          // Insert new prediction
          const { error: insertError } = await supabase
            .from('final_predictions')
            .insert({
              user_id: user.id,
              champion_id: finalPredictions.champion,
              vice_champion_id: finalPredictions.viceChampion,
              third_place_id: finalPredictions.third,
              fourth_place_id: finalPredictions.fourth
            });
            
          if (insertError) {
            console.error("Error inserting final prediction:", insertError);
          } else {
            finalPredictionUpdated = true;
          }
        }
      }
      
      // Generate success message
      let successMessage = "";
      
      if (newMatchPredictions > 0 || updatedMatchPredictions > 0) {
        successMessage += `Palpites de jogos: ${newMatchPredictions} novos, ${updatedMatchPredictions} atualizados. `;
      }
      
      if (newGroupPredictions > 0 || updatedGroupPredictions > 0) {
        successMessage += `Classificações de grupos: ${newGroupPredictions} novas, ${updatedGroupPredictions} atualizadas. `;
      }
      
      if (finalPredictionUpdated) {
        successMessage += "Previsão do resultado final salva. ";
      }
      
      if (successMessage) {
        toast("Palpites registrados com sucesso!", { 
          description: successMessage
        });
      } else {
        toast("Nenhum palpite foi alterado", { 
          description: "Nenhuma alteração foi detectada nos palpites"
        });
      }
      
      // Reset password field
      setUserPassword("");
      
    } catch (error) {
      console.error("Error saving predictions:", error);
      toast("Erro ao salvar palpites", { 
        description: "Ocorreu um erro ao processar seus palpites"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-fifa-blue" />
          <p className="mt-4 text-lg text-gray-600">Carregando dados...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-fifa-blue">Meus Palpites</h1>
          <p className="text-gray-600 mt-2">
            Registre aqui seus palpites para o Mundial de Clubes FIFA 2025
          </p>
        </div>

        <Alert className="mb-6">
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Registre seus palpites para a fase de grupos antes do início da competição. Após confirmar seus palpites, eles não poderão ser alterados.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="matches" className="mb-8">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="matches" className="flex items-center gap-2">
              <SoccerBallIcon className="h-4 w-4" />
              Jogos
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              Grupos
            </TabsTrigger>
            <TabsTrigger value="finals" className="flex items-center gap-2">
              <TrophyIcon className="h-4 w-4" />
              Final
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="matches" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Palpites para Jogos</CardTitle>
                <CardDescription>
                  Registre o placar que você acredita para cada jogo da fase de grupos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {matches.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">Nenhum jogo encontrado</p>
                ) : (
                  matches.map((match) => (
                    <div key={match.id} className="p-4 border rounded-md">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-500">
                          {formatDate(match.match_date)} • {match.stage}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 text-right flex items-center justify-end gap-2">
                          {match.home_team?.flag_url && (
                            <div className="w-8 h-8 flex justify-center">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={match.home_team.flag_url} alt={match.home_team?.name || ""} />
                                <AvatarFallback className="text-xs">
                                  {match.home_team?.name?.substring(0, 2) || ""}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          )}
                          <p className="font-medium">{match.home_team?.name}</p>
                          <Input 
                            type="number" 
                            min="0"
                            className="w-16 ml-auto" 
                            value={matchBets[match.id]?.home || ""}
                            onChange={(e) => handleMatchBetChange(match.id, 'home', e.target.value)}
                            disabled={match.is_finished}
                          />
                        </div>
                        <div className="mx-2">vs</div>
                        <div className="flex-1 flex items-center">
                          <Input 
                            type="number" 
                            min="0"
                            className="w-16 mr-2" 
                            value={matchBets[match.id]?.away || ""}
                            onChange={(e) => handleMatchBetChange(match.id, 'away', e.target.value)}
                            disabled={match.is_finished}
                          />
                          <p className="font-medium">{match.away_team?.name}</p>
                          {match.away_team?.flag_url && (
                            <div className="w-8 h-8 ml-2 flex justify-center">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={match.away_team.flag_url} alt={match.away_team?.name || ""} />
                                <AvatarFallback className="text-xs">
                                  {match.away_team?.name?.substring(0, 2) || ""}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="groups" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Classificação nos Grupos</CardTitle>
                <CardDescription>
                  Preveja quais times ficarão em 1º e 2º lugar em cada grupo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {groupsWithTeams.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">Nenhum grupo encontrado</p>
                ) : (
                  groupsWithTeams.map(group => (
                    <div key={group.id} className="p-4 border rounded-md">
                      <h3 className="font-bold mb-3">Grupo {group.name}</h3>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`group-${group.id}-1st`}>1º Lugar</Label>
                          <Select 
                            value={groupPredictions[group.id]?.first || ""} 
                            onValueChange={(value) => handleGroupPredictionChange(group.id, 'first', value)}
                          >
                            <SelectTrigger id={`group-${group.id}-1st`}>
                              <SelectValue placeholder="Selecione um time" />
                            </SelectTrigger>
                            <SelectContent>
                              {group.teams.map((team: any) => (
                                <SelectItem key={team.id} value={team.id}>
                                  {team.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`group-${group.id}-2nd`}>2º Lugar</Label>
                          <Select 
                            value={groupPredictions[group.id]?.second || ""} 
                            onValueChange={(value) => handleGroupPredictionChange(group.id, 'second', value)}
                          >
                            <SelectTrigger id={`group-${group.id}-2nd`}>
                              <SelectValue placeholder="Selecione um time" />
                            </SelectTrigger>
                            <SelectContent>
                              {group.teams.map((team: any) => (
                                <SelectItem key={team.id} value={team.id}>
                                  {team.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="finals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Classificação Final</CardTitle>
                <CardDescription>
                  Preveja quem será o campeão, vice, terceiro e quarto colocados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="champion" className="flex items-center gap-1">
                      <TrophyIcon className="h-4 w-4 text-fifa-gold" /> Campeão
                    </Label>
                    <Select 
                      value={finalPredictions.champion} 
                      onValueChange={(value) => handleFinalPredictionChange('champion', value)}
                    >
                      <SelectTrigger id="champion">
                        <SelectValue placeholder="Selecione um time" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vice-champion">Vice-Campeão</Label>
                    <Select 
                      value={finalPredictions.viceChampion} 
                      onValueChange={(value) => handleFinalPredictionChange('viceChampion', value)}
                    >
                      <SelectTrigger id="vice-champion">
                        <SelectValue placeholder="Selecione um time" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="third-place">Terceiro Lugar</Label>
                    <Select 
                      value={finalPredictions.third} 
                      onValueChange={(value) => handleFinalPredictionChange('third', value)}
                    >
                      <SelectTrigger id="third-place">
                        <SelectValue placeholder="Selecione um time" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fourth-place">Quarto Lugar</Label>
                    <Select 
                      value={finalPredictions.fourth} 
                      onValueChange={(value) => handleFinalPredictionChange('fourth', value)}
                    >
                      <SelectTrigger id="fourth-place">
                        <SelectValue placeholder="Selecione um time" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="shadow-lg mb-8">
          <CardHeader className="bg-fifa-blue text-white">
            <CardTitle>Confirme seus Palpites</CardTitle>
            <CardDescription className="text-gray-200">
              Para salvar seus palpites, digite sua senha e confirme
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Digite sua senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Senha para confirmar seus palpites"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
              />
            </div>
            
            <Button 
              className="w-full bg-fifa-blue hover:bg-opacity-90"
              onClick={handleSubmitBets}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar Palpites'
              )}
            </Button>

            <p className="text-sm text-gray-500 text-center">
              Atenção: Após confirmar, seus palpites ficarão registrados e não poderão ser alterados.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Palpites;
