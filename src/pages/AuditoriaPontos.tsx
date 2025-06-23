// src/pages/AuditoriaPontos.tsx (VERSÃO FINAL COM DETALHAMENTO DE GRUPOS/FINAIS)

import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// A função de busca de dados (fetchAllAuditData) permanece a mesma, pois já busca tudo que precisamos.
const fetchAllAuditData = async (poolId: string | undefined) => {
  if (!poolId) return null;
  const { data: users, error: usersError } = await supabase.from('users_custom').select('id, name').eq('pool_id', poolId).eq('is_admin', false);
  if (usersError) throw usersError;
  const userIds = users.map(u => u.id);
  if (userIds.length === 0) return { users: [], points: [], teams: [], matches: [], matchPredictions: [], groupPredictions: [], groups: [], groupsResults: [], finalPredictions: [], tournamentResults: [] };
  const [{ data: points }, { data: teams }, { data: matches }, { data: matchPredictions }, { data: groupPredictions }, { data: groups }, { data: groupsResults }, { data: finalPredictions }, { data: tournamentResults }] = await Promise.all([
    supabase.from('user_points').select('*').in('user_id', userIds), supabase.from('teams').select('*'),
    supabase.from('matches').select('*'), supabase.from('match_predictions').select('*').in('user_id', userIds),
    supabase.from('group_predictions').select('*').in('user_id', userIds),
    supabase.from('groups').select('*'), supabase.from('groups_results').select('*'),
    supabase.from('final_predictions').select('*').in('user_id', userIds), supabase.from('tournament_results').select('*')
  ]);
  const anyError = usersError || !points || !teams || !matches || !matchPredictions || !groupPredictions || !groups || !groupsResults || !finalPredictions || !tournamentResults;
  if (anyError) throw new Error("Falha ao buscar um dos recursos necessários para a auditoria.");
  return { users, points, teams, matches, matchPredictions, groupPredictions, groups, groupsResults, finalPredictions, tournamentResults };
};

const AuditoriaPontos = () => {
  const { pool } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['fullAuditData', pool?.id],
    queryFn: () => fetchAllAuditData(pool?.id),
    enabled: !!pool?.id,
  });

  const processedData = useMemo(() => {
    if (!data) return [];
    const { users, points, teams, matches, matchPredictions, groupPredictions, groups, groupsResults, finalPredictions, tournamentResults } = data;
    if (!points || !teams || !groups) return [];

    const teamMap = new Map(teams.map(t => [t.id, t.name]));

    const reportData = points.map(point => {
      const user = users.find(u => u.id === point.user_id);
      const reportRow = {
        id: point.id, participante: user?.name || 'N/A', data: point.created_at,
        jogo: 'N/A', resultado: 'N/A', palpite: 'N/A',
        tipo_pontuacao: point.points_type, pontos: point.points, 
        sortDate: parseISO(point.created_at).getTime()
      };

      const pointType = point.points_type;
      const predictionId = point.prediction_id;

      if (['EXACT_SCORE', 'CORRECT_WINNER', 'CORRECT_DRAW', 'PARTIAL_SCORE', 'NO_POINTS'].includes(pointType)) {
        const prediction = matchPredictions?.find(p => p.id === predictionId);
        const match = matches?.find(m => m.id === prediction?.match_id);
        if (match && prediction) {
            reportRow.jogo = `${teamMap.get(match.home_team_id) || 'Time A'} vs ${teamMap.get(match.away_team_id) || 'Time B'}`;
            reportRow.resultado = match.is_finished ? `${match.home_score} - ${match.away_score}` : 'Pendente';
            reportRow.palpite = `${prediction.home_score} - ${prediction.away_score}`;
            reportRow.sortDate = parseISO(match.match_date).getTime();
            if(pointType === 'CORRECT_WINNER' && match.home_score === match.away_score) {
              reportRow.tipo_pontuacao = 'Acertou o Empate';
            } else {
              reportRow.tipo_pontuacao = 'Acertou o Vencedor';
            }
        }
      } else if (pointType === 'GROUP_CLASSIFICATION') {
        const prediction = groupPredictions?.find(p => p.user_id === point.user_id && point.related_id === p.group_id);
        const group = groups.find(g => g.id === prediction?.group_id);
        const result = groupsResults?.find(r => r.group_id === prediction?.group_id);
        if (prediction && group) {
            reportRow.jogo = `Grupo ${group.name}`;
            reportRow.palpite = `1º ${teamMap.get(prediction.predicted_first_team_id) || 'N/A'}, 2º ${teamMap.get(prediction.predicted_second_team_id) || 'N/A'}`;
            if (result) {
                reportRow.resultado = `1º ${teamMap.get(result.first_place_team_id) || 'N/A'}, 2º ${teamMap.get(result.second_place_team_id) || 'N/A'}`;
                // Lógica para traduzir o critério do grupo
                if (prediction.predicted_first_team_id === result.first_place_team_id && prediction.predicted_second_team_id === result.second_place_team_id) {
                    reportRow.tipo_pontuacao = "Classificação Exata";
                } else if (prediction.predicted_first_team_id === result.second_place_team_id && prediction.predicted_second_team_id === result.first_place_team_id) {
                    reportRow.tipo_pontuacao = "Classificação Invertida";
                } else if (prediction.predicted_first_team_id === result.first_place_team_id || prediction.predicted_second_team_id === result.second_place_team_id) {
                    reportRow.tipo_pontuacao = "Classificação 1 Time";
                }
            } else {
                reportRow.resultado = 'Pendente';
            }
        }
      } else if (pointType && pointType.startsWith('final_')) {
          const prediction = finalPredictions?.find(p => p.user_id === point.user_id);
          const result = tournamentResults?.[0]; 
          if (prediction && result) {
              let position = '';
              let predTeamId, resTeamId;
              switch(pointType) {
                  case 'final_champion': position = 'Campeão'; predTeamId = prediction.champion_id; resTeamId = result.champion_id; break;
                  case 'final_runner_up': position = 'Vice-Campeão'; predTeamId = prediction.runner_up_id; resTeamId = result.runner_up_id; break;
                  case 'final_third_place': position = '3º Colocado'; predTeamId = prediction.third_place_id; resTeamId = result.third_place_id; break;
                  case 'final_fourth_place': position = '4º Colocado'; predTeamId = prediction.fourth_place_id; resTeamId = result.fourth_place_id; break;
                  case 'final_score': position = 'Placar da Final'; break;
              }
              reportRow.jogo = `Fase Final: ${position}`;
              if (pointType === 'final_score') {
                  reportRow.palpite = `${prediction.final_home_score} - ${prediction.final_away_score}`;
                  reportRow.resultado = `${result.final_home_score} - ${result.final_away_score}`;
              } else {
                  reportRow.palpite = teamMap.get(predTeamId) || 'N/A';
                  reportRow.resultado = teamMap.get(resTeamId) || 'N/A';
              }
              reportRow.tipo_pontuacao = `Acerto: ${position}`;
          }
      }
      return reportRow;
    });
    return reportData.sort((a, b) => b.sortDate - a.sortDate);
  }, [data]);

  const users = useMemo(() => data?.users?.sort((a, b) => a.name.localeCompare(b.name)) || [], [data?.users]);
  
  const filteredData = useMemo(() => {
    if (selectedUserId === 'all') return processedData;
    const selectedUserName = users.find(u => u.id === selectedUserId)?.name;
    return processedData.filter(item => item.participante === selectedUserName);
  }, [processedData, selectedUserId, users]);
  
  const totalPoints = useMemo(() => filteredData.reduce((sum, item) => sum + item.pontos, 0), [filteredData]);

  if (isLoading) return <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-fifa-blue" /></div>;
  if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Erro ao Carregar Auditoria</AlertTitle><AlertDescription>{(error as Error).message}</AlertDescription></Alert>;

  return (
    <div className="container mx-auto max-w-7xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><FileText className="text-fifa-blue" />Auditoria de Pontos</CardTitle>
          <CardDescription>Visualize o detalhe de cada ponto ganho por todos os participantes do bolão.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-full sm:w-[280px]"><SelectValue placeholder="Filtrar por participante..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Participantes</SelectItem>
                  {users.map(user => (<SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total de Pontos (Filtro)</p>
              <p className="text-2xl font-bold text-fifa-blue">{totalPoints}</p>
            </div>
          </div>
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participante</TableHead>
                  <TableHead>Jogo/Origem</TableHead>
                  <TableHead className="hidden md:table-cell">Resultado Oficial</TableHead>
                  <TableHead className="hidden md:table-cell">Palpite</TableHead>
                  <TableHead className="hidden md:table-cell">Critério</TableHead>
                  <TableHead className="text-center">Pontos</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.participante}</TableCell>
                      <TableCell>{item.jogo}</TableCell>
                      <TableCell className="hidden md:table-cell">{item.resultado}</TableCell>
                      <TableCell className="hidden md:table-cell">{item.palpite}</TableCell>
                      <TableCell className="hidden md:table-cell">{item.tipo_pontuacao}</TableCell>
                      <TableCell className="text-center font-bold">
                        <Badge variant={item.pontos > 0 ? 'default' : 'destructive'}>{item.pontos}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right text-xs">
                        {format(parseISO(item.data), 'dd/MM/yy HH:mm', { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Nenhum registro de ponto encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditoriaPontos;