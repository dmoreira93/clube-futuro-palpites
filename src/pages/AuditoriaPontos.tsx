// src/pages/AuditoriaPontos.tsx - VERSÃO FINAL COM LÓGICA CORRIGIDA

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

// A função de busca de dados permanece a mesma, mas otimizada.
const fetchAllAuditData = async (poolId: string | undefined) => {
  if (!poolId) return null;
  
  const { data: users, error: usersError } = await supabase.from('users_custom').select('id, name').eq('pool_id', poolId).eq('is_admin', false);
  if (usersError) throw usersError;
  const userIds = users.map(u => u.id);
  if (userIds.length === 0) return { users: [], points: [], teams: [], matches: [], matchPredictions: [], groupPredictions: [], groups: [], groupsResults: [], finalPredictions: [], tournamentResults: null };

  const [
    { data: points }, { data: teams }, { data: matches }, { data: matchPredictions }, 
    { data: groupPredictions }, { data: groups }, { data: groupsResults }, 
    { data: finalPredictions }, { data: tournamentResults }
  ] = await Promise.all([
    supabase.from('user_points').select('*, user:user_id(name)').in('user_id', userIds),
    supabase.from('teams').select('id, name'),
    supabase.from('matches').select('*, home_team:home_team_id(name), away_team:away_team_id(name)'),
    supabase.from('match_predictions').select('*').in('user_id', userIds),
    supabase.from('group_predictions').select('*').in('user_id', userIds),
    supabase.from('groups').select('id, name'),
    supabase.from('groups_results').select('*'),
    supabase.from('final_predictions').select('*').in('user_id', userIds),
    supabase.from('tournament_results').select('*').maybeSingle()
  ]);

  return { users, points, teams, matches, matchPredictions, groupPredictions, groups, groupsResults, finalPredictions, tournamentResults };
};

const AuditoriaPontos = () => {
  const { user: authUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['fullAuditData', authUser?.pool_id],
    queryFn: () => fetchAllAuditData(authUser?.pool_id),
    enabled: !!authUser?.pool_id,
  });

  const processedData = useMemo(() => {
    if (!data || !data.points) return [];
    const { users, points, teams, matches, matchPredictions, groupPredictions, groups, groupsResults, finalPredictions, tournamentResults } = data;

    const teamMap = new Map(teams.map(t => [t.id, t.name]));

    const report = points.map(point => {
      const user = users.find(u => u.id === point.user_id);
      let reportRow = {
        id: point.id,
        participante: user?.name || 'N/A',
        jogo: 'N/A',
        resultado: 'N/A',
        palpite: 'N/A',
        tipo_pontuacao: point.points_type,
        pontos: point.points,
        data: point.created_at,
        sortDate: parseISO(point.created_at).getTime()
      };

      const pointType = point.points_type;
      
      // --- INÍCIO DA LÓGICA CORRIGIDA ---

      // Preenche detalhes para pontos de PARTIDAS
      if (['EXACT_SCORE', 'CORRECT_WINNER', 'CORRECT_DRAW', 'PARTIAL_SCORE', 'NO_POINTS'].includes(pointType)) {
        const prediction = matchPredictions?.find(p => p.id === point.prediction_id);
        const match = matches?.find(m => m.id === prediction?.match_id);
        if (match && prediction) {
            reportRow.jogo = `${match.home_team.name} vs ${match.away_team.name}`;
            reportRow.resultado = match.is_finished ? `${match.home_score} - ${match.away_score}` : 'Pendente';
            reportRow.palpite = `${prediction.home_score} - ${prediction.away_score}`;
            reportRow.sortDate = parseISO(match.match_date).getTime();
        }
      } 
      // Preenche detalhes para pontos de GRUPOS
      else if (pointType.startsWith('GROUP_')) {
          const prediction = groupPredictions?.find(p => p.id === point.prediction_id);
          const group = groups.find(g => g.id === prediction?.group_id);
          const result = groupsResults?.find(r => r.group_id === prediction?.group_id);
          if(prediction && group) {
              reportRow.jogo = `Grupo ${group.name}`;
              reportRow.palpite = `1º ${teamMap.get(prediction.predicted_first_team_id)}, 2º ${teamMap.get(prediction.predicted_second_team_id)}`;
              if (result) {
                  reportRow.resultado = `1º ${teamMap.get(result.first_place_team_id)}, 2º ${teamMap.get(result.second_place_team_id)}`;
              }
          }
      } 
      // Preenche detalhes para pontos da FASE FINAL
      else if (pointType.startsWith('FINAL_')) {
          const prediction = finalPredictions?.find(p => p.id === point.prediction_id);
          if(prediction && tournamentResults) {
              reportRow.jogo = "Fase Final";
              let predTeam, resultTeam;
              switch(pointType) {
                  case 'FINAL_CHAMPION': predTeam = teamMap.get(prediction.champion_id); resultTeam = teamMap.get(tournamentResults.champion_id); break;
                  case 'FINAL_RUNNER_UP': predTeam = teamMap.get(prediction.runner_up_id); resultTeam = teamMap.get(tournamentResults.runner_up_id); break;
                  case 'FINAL_THIRD_PLACE': predTeam = teamMap.get(prediction.third_place_id); resultTeam = teamMap.get(tournamentResults.third_place_id); break;
                  case 'FINAL_FOURTH_PLACE': predTeam = teamMap.get(prediction.fourth_place_id); resultTeam = teamMap.get(tournamentResults.fourth_place_id); break;
                  case 'FINAL_SCORE': 
                    reportRow.palpite = `${prediction.final_home_score} - ${prediction.final_away_score}`;
                    reportRow.resultado = `${tournamentResults.final_home_score} - ${tournamentResults.final_away_score}`;
                    break;
                  case 'FINAL_BONUS':
                    reportRow.palpite = "Top 4 Exato";
                    reportRow.resultado = "Bônus Concedido";
                    break;
              }
              if(predTeam) reportRow.palpite = predTeam;
              if(resultTeam) reportRow.resultado = resultTeam;
          }
      }

      // Tradução dos critérios para texto amigável
      switch(pointType) {
        case 'EXACT_SCORE': reportRow.tipo_pontuacao = 'Placar Exato'; break;
        case 'CORRECT_WINNER': reportRow.tipo_pontuacao = 'Acertou Vencedor'; break;
        case 'CORRECT_DRAW': reportRow.tipo_pontuacao = 'Acertou Empate'; break;
        case 'PARTIAL_SCORE': reportRow.tipo_pontuacao = 'Acerto Parcial'; break;
        case 'GROUP_EXACT': reportRow.tipo_pontuacao = 'Grupo: Class. Exata'; break;
        case 'GROUP_PARTIAL': reportRow.tipo_pontuacao = 'Grupo: Acertou 1 Posição'; break;
        case 'GROUP_INVERTED': reportRow.tipo_pontuacao = 'Grupo: Class. Invertida'; break;
        case 'FINAL_CHAMPION': reportRow.tipo_pontuacao = 'Final: Acertou o Campeão'; break;
        case 'FINAL_RUNNER_UP': reportRow.tipo_pontuacao = 'Final: Acertou o Vice'; break;
        case 'FINAL_THIRD_PLACE': reportRow.tipo_pontuacao = 'Final: Acertou o 3º'; break;
        case 'FINAL_FOURTH_PLACE': reportRow.tipo_pontuacao = 'Final: Acertou o 4º'; break;
        case 'FINAL_SCORE': reportRow.tipo_pontuacao = 'Final: Acertou o Placar'; break;
        case 'FINAL_BONUS': reportRow.tipo_pontuacao = 'Bônus: Crave o Top 4'; break;
        case 'NO_POINTS': reportRow.tipo_pontuacao = 'Sem Pontos'; break;
        default: reportRow.tipo_pontuacao = pointType;
      }

      return reportRow;
    });

    return report.sort((a, b) => b.sortDate - a.sortDate);
  }, [data]);

  const users = useMemo(() => data?.users?.sort((a, b) => a.name.localeCompare(b.name)) || [], [data?.users]);
  
  const filteredData = useMemo(() => {
    if (selectedUserId === 'all') return processedData;
    return processedData.filter(item => {
      const user = data?.users.find(u => u.name === item.participante);
      return user?.id === selectedUserId;
    });
  }, [processedData, selectedUserId, data?.users]);

  const totalPoints = useMemo(() => filteredData.reduce((sum, item) => sum + item.pontos, 0), [filteredData]);

  if (isLoading) return <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-fifa-blue" /></div>;
  if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Erro ao Carregar Auditoria</AlertTitle><AlertDescription>{(error as Error).message}</AlertDescription></Alert>;

  return (
    <div className="container mx-auto max-w-7xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><FileText className="text-fifa-blue" />Auditoria de Pontos</CardTitle>
          <CardDescription>Visualize o detalhe de cada ponto ganho pelos participantes do seu bolão.</CardDescription>
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
                  <TableHead className="hidden md:table-cell">Palpite</TableHead>
                  <TableHead className="hidden md:table-cell">Resultado Oficial</TableHead>
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
                      <TableCell className="hidden md:table-cell">{item.palpite}</TableCell>
                      <TableCell className="hidden md:table-cell">{item.resultado}</TableCell>
                      <TableCell className="hidden md:table-cell">{item.tipo_pontuacao}</TableCell>
                      <TableCell className="text-center font-bold">
                        <Badge variant={item.pontos > 0 ? 'default' : 'secondary'} className={item.pontos > 0 ? 'bg-green-600' : ''}>{item.pontos}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right text-xs">
                        {item.data ? format(parseISO(item.data), 'dd/MM/yy HH:mm', { locale: ptBR }) : ''}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Nenhum registro de ponto encontrado para o filtro selecionado.
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