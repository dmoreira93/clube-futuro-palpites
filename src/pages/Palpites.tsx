import { useState, useEffect, useCallback } from "react";
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
// Ajustes nos tipos de importação para refletir as tabelas separadas
import {
  MatchPrediction, // Renomeado de Prediction para MatchPrediction para clareza
  GroupPrediction,
  FinalPrediction,
  RawGroupPrediction,
  RawFinalPrediction // Manter se necessário para o payload RPC, mas as interfaces diretas da tabela são mais claras
} from "@/types/predictions"; 

// Adicione as interfaces para Teams e Groups, caso não existam em outro lugar
interface Team {
  id: string;
  name: string;
  flag_url: string;
  group_id: string | null;
}

interface Group {
  id: string;
  name: string;
}

const Palpites = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // State for data loading
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [teamsByGroup, setTeamsByGroup] = useState<{ [groupId: string]: Team[] }>({}); 

  // Predictions states
  const [matchPredictions, setMatchPredictions] = useState<{ [matchId: string]: { homeGoals: number; awayGoals: number } }>({});
  const [groupPredictions, setGroupPredictions] = useState<GroupPrediction[]>([]); 
  const [finalPrediction, setFinalPrediction] = useState<FinalPrediction | null>(null);

  // Form input states for group and final predictions
  const [groupPositions, setGroupPositions] = useState<{ [groupId: string]: { first: string; second: string } }>({});
  const [finalPositions, setFinalPositions] = useState({
    champion: '',
    runnerUp: '',
    thirdPlace: '',
    fourthPlace: '',
  });
  const [finalScore, setFinalScore] = useState({ homeGoals: 0, awayGoals: 0 });


  // --- Efeitos de Carregamento de Dados ---
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch Teams
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, name, flag_url, group_id'); 

        if (teamsError) throw teamsError;
        setTeams(teamsData || []);

        // Organizar times por grupo
        const organizedTeamsByGroup: { [groupId: string]: Team[] } = {};
        teamsData?.forEach(team => {
            if (team.group_id) { 
                if (!organizedTeamsByGroup[team.group_id]) {
                    organizedTeamsByGroup[team.group_id] = [];
                }
                organizedTeamsByGroup[team.group_id].push(team);
            }
        });
        setTeamsByGroup(organizedTeamsByGroup);


        // Fetch Groups e ordenar por nome
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select('id, name')
          .order('name', { ascending: true }); 

        if (groupsError) throw groupsError;
        setGroups(groupsData || []);
        

        // Fetch Matches e filtrar times NULL
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('*')
          .order('match_date', { ascending: true });

        if (matchesError) throw matchesError;
        const filteredMatches = matchesData?.filter(match => match.home_team_id !== null && match.away_team_id !== null) || [];
        setMatches(filteredMatches);


        // Fetch existing Match Predictions for the user
        // AGORA PEGANDO DA TABELA 'match_predictions'
        const { data: userMatchPredictions, error: userMatchPredictionsError } = await supabase
          .from('match_predictions') 
          .select('id, match_id, home_score, away_score')
          .eq('user_id', user.id);

        if (userMatchPredictionsError) throw userMatchPredictionsError;
        const initialMatchPredictions = userMatchPredictions.reduce((acc, pred) => {
          acc[pred.match_id] = { homeGoals: pred.home_score, awayGoals: pred.away_score };
          return acc;
        }, {} as { [matchId: string]: { homeGoals: number; awayGoals: number } });
        setMatchPredictions(initialMatchPredictions);


        // Fetch existing Group Predictions for the user
        // AGORA PEGANDO DA TABELA 'group_predictions'
        const { data: userGroupPredictions, error: userGroupPredictionsError } = await supabase
            .from('group_predictions')
            .select('id, group_id, predicted_first_team_id, predicted_second_team_id')
            .eq('user_id', user.id);

        if (userGroupPredictionsError) throw userGroupPredictionsError;
        setGroupPredictions(userGroupPredictions || []);

        const initialGroupPositions: { [groupId: string]: { first: string; second: string } } = {};
        userGroupPredictions?.forEach(pred => {
            initialGroupPositions[pred.group_id] = {
                first: pred.predicted_first_team_id,
                second: pred.predicted_second_team_id,
            };
        });
        setGroupPositions(initialGroupPositions);


        // Fetch existing Final Prediction for the user
        // AGORA PEGANDO DA TABELA 'final_predictions'
        const { data: userFinalPrediction, error: userFinalPredictionError } = await supabase
            .from('final_predictions') 
            .select('id, champion_id, vice_champion_id, third_place_id, fourth_place_id, final_home_score, final_away_score')
            .eq('user_id', user.id)
            .single(); 

        if (userFinalPredictionError && userFinalPredictionError.code !== 'PGRST116') { // PGRST116 é "no rows found"
            throw userFinalPredictionError;
        }

        if (userFinalPrediction) {
            setFinalPrediction(userFinalPrediction);
            setFinalPositions({
                champion: userFinalPrediction.champion_id,
                runnerUp: userFinalPrediction.vice_champion_id,
                thirdPlace: userFinalPrediction.third_place_id,
                fourthPlace: userFinalPrediction.fourth_place_id,
            });
            setFinalScore({
                homeGoals: userFinalPrediction.final_home_score,
                awayGoals: userFinalPrediction.final_away_score,
            });
        }

      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load data.");
        toast.error("Erro ao carregar dados: " + (err.message || "Verifique sua conexão."));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, navigate, user?.id]);


  // --- Funções de Manipulação de State do Formulário ---
  const handleScoreChange = (matchId: string, team: 'home' | 'away', value: string) => {
    const goals = parseInt(value);
    setMatchPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team === 'home' ? 'homeGoals' : 'awayGoals']: isNaN(goals) ? 0 : goals,
      },
    }));
  };

  const handleGroupPositionChange = (groupId: string, position: 'first' | 'second', teamId: string) => {
    setGroupPositions(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        [position]: teamId,
      },
    }));
  };

  const handleFinalPositionChange = (position: 'champion' | 'runnerUp' | 'thirdPlace' | 'fourthPlace', teamId: string) => {
    setFinalPositions(prev => ({
      ...prev,
      [position]: teamId,
    }));
  };

  const handleFinalScoreChange = (type: 'homeGoals' | 'awayGoals', value: string) => {
    const goals = parseInt(value);
    setFinalScore(prev => ({
      ...prev,
      [type]: isNaN(goals) ? 0 : goals,
    }));
  };

  // --- Função de Submissão Principal ---
  const handleSubmitBets = async () => {
    if (!user || !isAuthenticated) {
      toast.error("Você precisa estar logado para salvar palpites.");
      navigate("/login");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // --- SUBMISSÃO DE PALPITES DE PARTIDA ---
      // AGORA PEGANDO DA TABELA 'match_predictions' para carregar palpites de partida existentes
      const loadedMatchPredictions = (await supabase.from('match_predictions')
          .select('id, match_id, home_score, away_score')
          .eq('user_id', user.id)
          ).data || [];

      for (const matchId in matchPredictions) {
        const prediction = matchPredictions[matchId];
        const existingMatchPrediction = loadedMatchPredictions.find(p => p.match_id === matchId);

        if (existingMatchPrediction) {
          const { error: updateError } = await supabase.rpc('update_match_prediction', {
            pred_id: existingMatchPrediction.id,
            home_score_param: prediction.homeGoals, // Parâmetro ajustado
            away_score_param: prediction.awayGoals, // Parâmetro ajustado
          });
          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase.rpc('insert_match_prediction', {
            match_id_param: matchId,
            user_id_param: user.id,
            home_score_param: prediction.homeGoals,
            away_score_param: prediction.awayGoals,
          });
          if (insertError) throw insertError;
        }
      }

      // --- SUBMISSÃO DE PALPITES DE GRUPO ---
      console.log("Submitting Group Predictions:", groupPositions);
      // AGORA PEGANDO DA TABELA 'group_predictions' para carregar palpites de grupo existentes
      const loadedGroupPredictions = (await supabase.from('group_predictions')
          .select('id, group_id, predicted_first_team_id, predicted_second_team_id')
          .eq('user_id', user.id)
          ).data || [];

      for (const groupId in groupPositions) {
        const positions = groupPositions[groupId];
        const existingGroupPred = loadedGroupPredictions.find(p => p.group_id === groupId);

        if (!positions.first || !positions.second) {
            toast.warning(`Por favor, selecione 1º e 2º lugar para o Grupo ${groups.find(g => g.id === groupId)?.name || 'desconhecido'}.`);
            continue; 
        }
        
        // Garante que o 1º e 2º lugar não são o mesmo time
        if (positions.first === positions.second) {
            toast.warning(`No Grupo ${groups.find(g => g.id === groupId)?.name || 'desconhecido'}, 1º e 2º lugar não podem ser o mesmo time.`);
            continue;
        }

        if (existingGroupPred) {
          const { error: updateError } = await supabase.rpc('update_group_prediction', {
            pred_id: existingGroupPred.id,
            first_id_param: positions.first, // Parâmetro ajustado
            second_id_param: positions.second, // Parâmetro ajustado
          });
          if (updateError) {
            console.error(`Erro ao atualizar palpite de grupo ${groupId}:`, updateError);
            throw updateError;
          }
        } else {
          const { error: insertError } = await supabase.rpc('insert_group_prediction', {
            group_id_param: groupId,
            user_id_param: user.id,
            first_team_id_param: positions.first,
            second_team_id_param: positions.second,
          });
          if (insertError) {
            console.error(`Erro ao inserir palpite de grupo ${groupId}:`, insertError);
            throw insertError;
          }
        }
      }

      // --- SUBMISSÃO DE PALPITE FINAL ---
      console.log("Submitting Final Prediction:", finalPositions, finalScore);
      // AGORA PEGANDO DA TABELA 'final_predictions' para carregar o palpite final existente
      const loadedFinalPrediction = (await supabase.from('final_predictions')
          .select('id, champion_id, vice_champion_id, third_place_id, fourth_place_id, final_home_score, final_away_score')
          .eq('user_id', user.id)
          .single()
          ).data;

      // Validação: todos os 4 finalistas devem ser selecionados
      if (!finalPositions.champion || !finalPositions.runnerUp || !finalPositions.thirdPlace || !finalPositions.fourthPlace) {
          toast.warning("Por favor, selecione os 4 primeiros colocados para o palpite final.");
          return;
      }
      // Validação: os 4 finalistas devem ser diferentes
      const uniqueFinalists = new Set([finalPositions.champion, finalPositions.runnerUp, finalPositions.thirdPlace, finalPositions.fourthPlace]);
      if (uniqueFinalists.size !== 4) {
          toast.warning("Os 4 times do palpite final devem ser diferentes.");
          return;
      }

      if (loadedFinalPrediction) { // Se já existe um palpite final
        const { error: updateError } = await supabase.rpc('update_final_prediction', {
          pred_id: loadedFinalPrediction.id,
          champion_id_param: finalPositions.champion,
          vice_champion_id_param: finalPositions.runnerUp,
          third_place_id_param: finalPositions.thirdPlace,
          fourth_place_id_param: finalPositions.fourthPlace,
          final_home_score_param: finalScore.homeGoals,
          final_away_score_param: finalScore.awayGoals,
        });
        if (updateError) {
          console.error("Erro ao atualizar palpite final:", updateError);
          throw updateError;
        }
      } else { // Se não existe um palpite final, insere
        const { error: insertError } = await supabase.rpc('insert_final_prediction', {
          user_id_param: user.id,
          champion_id_param: finalPositions.champion,
          vice_champion_id_param: finalPositions.runnerUp,
          third_place_id_param: finalPositions.thirdPlace,
          fourth_place_id_param: finalPositions.fourthPlace,
          final_home_score_param: finalScore.homeGoals,
          final_away_score_param: finalScore.awayGoals,
        });
        if (insertError) {
          console.error("Erro ao inserir palpite final:", insertError);
          throw insertError;
        }
      }


      toast.success("Palpites salvos com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar palpites:", err);
      setError(err.message || "Falha ao salvar os palpites.");
      toast.error("Erro ao salvar palpites: " + (err.message || "Verifique sua conexão."));
    } finally {
      setSubmitting(false);
    }
  };


  // --- Renderização do Componente ---
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-fifa-blue" />
          <p className="ml-2 text-fifa-blue">Carregando palpites...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertTitle>Erro!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const getTeamName = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.name || 'Time Desconhecido';
  };

  const getTeamLogo = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.flag_url || '/placeholder-team-logo.png';
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-fifa-blue mb-6">Meus Palpites</h1>

        <Tabs defaultValue="matches" className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="matches"><SoccerBallIcon className="mr-2" />Partidas</TabsTrigger>
            <TabsTrigger value="groups"><UsersIcon className="mr-2" />Grupos</TabsTrigger>
            <TabsTrigger value="final"><TrophyIcon className="mr-2" />Final</TabsTrigger>
          </TabsList>

          <TabsContent value="matches">
            <Card className="shadow-lg">
              <CardHeader className="bg-fifa-blue text-white">
                <CardTitle>Palpites de Partidas</CardTitle>
                <CardDescription className="text-gray-200">
                  Preencha os placares das partidas da fase de grupos.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {matches.length === 0 ? (
                  <p className="text-center text-gray-500">Nenhuma partida disponível no momento.</p>
                ) : (
                  matches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-center gap-2 w-1/3 justify-start">
                        <Avatar className="h-6 w-6 flex-shrink-0">
                          <AvatarImage src={getTeamLogo(match.home_team_id)} />
                          <AvatarFallback>{teams.find(t => t.id === match.home_team_id)?.name.substring(0,2)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-gray-700 truncate">{getTeamName(match.home_team_id)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 w-1/3 justify-center">
                        <Input
                          type="number"
                          className="w-16 text-center"
                          value={matchPredictions[match.id]?.homeGoals ?? ''}
                          onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)}
                          min="0"
                        />
                        <span className="font-bold text-gray-700">X</span>
                        <Input
                          type="number"
                          className="w-16 text-center"
                          value={matchPredictions[match.id]?.awayGoals ?? ''}
                          onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                          min="0"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2 w-1/3 justify-end">
                        <span className="font-medium text-gray-700 text-right truncate">{getTeamName(match.away_team_id)}</span>
                        <Avatar className="h-6 w-6 flex-shrink-0">
                          <AvatarImage src={getTeamLogo(match.away_team_id)} />
                          <AvatarFallback>{teams.find(t => t.id === match.away_team_id)?.name.substring(0,2)}</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups">
            <Card className="shadow-lg">
              <CardHeader className="bg-fifa-blue text-white">
                <CardTitle>Classificação dos Grupos</CardTitle>
                <CardDescription className="text-gray-200">
                  Selecione o 1º e 2º lugar de cada grupo.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {groups.length === 0 ? (
                  <p className="text-center text-gray-500">Nenhum grupo disponível no momento.</p>
                ) : (
                  groups.map(group => (
                    <div key={group.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <h3 className="font-bold text-lg text-fifa-blue mb-3">Grupo {group.name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`group-${group.id}-first`}>1º Lugar</Label>
                          <Select
                            value={groupPositions[group.id]?.first || ''}
                            onValueChange={(value) => handleGroupPositionChange(group.id, 'first', value)}
                          >
                            <SelectTrigger id={`group-${group.id}-first`}>
                              <SelectValue placeholder="Selecione o 1º..." />
                            </SelectTrigger>
                            <SelectContent>
                              {teamsByGroup[group.id]?.map(team => (
                                <SelectItem key={team.id} value={team.id}>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-5 w-5">
                                      <AvatarImage src={team.flag_url} />
                                      <AvatarFallback>{team.name.substring(0,2)}</AvatarFallback>
                                    </Avatar>
                                    {team.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor={`group-${group.id}-second`}>2º Lugar</Label>
                          <Select
                            value={groupPositions[group.id]?.second || ''}
                            onValueChange={(value) => handleGroupPositionChange(group.id, 'second', value)}
                          >
                            <SelectTrigger id={`group-${group.id}-second`}>
                              <SelectValue placeholder="Selecione o 2º..." />
                            </SelectTrigger>
                            <SelectContent>
                              {teamsByGroup[group.id]?.map(team => (
                                <SelectItem key={team.id} value={team.id}>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-5 w-5">
                                      <AvatarImage src={team.flag_url} />
                                      <AvatarFallback>{team.name.substring(0,2)}</AvatarFallback>
                                    </Avatar>
                                    {team.name}
                                  </div>
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

          <TabsContent value="final">
            <Card className="shadow-lg">
              <CardHeader className="bg-fifa-blue text-white">
                <CardTitle>Palpite Final</CardTitle>
                <CardDescription className="text-gray-200">
                  Selecione o Campeão, Vice, 3º e 4º colocados, e o placar da final.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <Label htmlFor="champion">Campeão</Label>
                  <Select
                    value={finalPositions.champion}
                    onValueChange={(value) => handleFinalPositionChange('champion', value)}
                  >
                    <SelectTrigger id="champion">
                      <SelectValue placeholder="Selecione o Campeão..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={team.flag_url} />
                              <AvatarFallback>{team.name.substring(0,2)}</AvatarFallback>
                            </Avatar>
                            {team.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="runnerUp">Vice Campeão</Label>
                  <Select
                    value={finalPositions.runnerUp}
                    onValueChange={(value) => handleFinalPositionChange('runnerUp', value)}
                  >
                    <SelectTrigger id="runnerUp">
                      <SelectValue placeholder="Selecione o Vice..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={team.flag_url} />
                              <AvatarFallback>{team.name.substring(0,2)}</AvatarFallback>
                            </Avatar>
                            {team.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="thirdPlace">3º Lugar</Label>
                  <Select
                    value={finalPositions.thirdPlace}
                    onValueChange={(value) => handleFinalPositionChange('thirdPlace', value)}
                  >
                    <SelectTrigger id="thirdPlace">
                      <SelectValue placeholder="Selecione o 3º..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={team.flag_url} />
                              <AvatarFallback>{team.name.substring(0,2)}</AvatarFallback>
                            </Avatar>
                            {team.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="fourthPlace">4º Lugar</Label>
                  <Select
                    value={finalPositions.fourthPlace}
                    onValueChange={(value) => handleFinalPositionChange('fourthPlace', value)}
                  >
                    <SelectTrigger id="fourthPlace">
                      <SelectValue placeholder="Selecione o 4º..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={team.flag_url} />
                              <AvatarFallback>{team.name.substring(0,2)}</AvatarFallback>
                            </Avatar>
                            {team.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between gap-4 mt-6">
                  <Label>Placar da Final:</Label>
                  <Input
                    type="number"
                    className="w-24 text-center"
                    value={finalScore.homeGoals}
                    onChange={(e) => handleFinalScoreChange('homeGoals', e.target.value)}
                    min="0"
                  />
                  <span className="font-bold text-lg">X</span>
                  <Input
                    type="number"
                    className="w-24 text-center"
                    value={finalScore.awayGoals}
                    onChange={(e) => handleFinalScoreChange('awayGoals', e.target.value)}
                    min="0"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="shadow-lg mb-8">
          <CardHeader className="bg-fifa-blue text-white">
            <CardTitle>Confirme seus Palpites</CardTitle>
            <CardDescription className="text-gray-200">
              Clique no botão abaixo para salvar seus palpites
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">

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