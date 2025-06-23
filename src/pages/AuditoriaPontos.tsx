// src/pages/AuditoriaPontos.tsx (VERSÃO FINAL COM ORDENAÇÃO E TRADUÇÕES)

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

// --- Função para buscar todos os dados necessários de uma vez ---
const fetchAllAuditData = async (poolId: string | undefined) => {
  if (!poolId) return null;

  const { data: users, error: usersError } = await supabase
    .from('users_custom').select('id, name').eq('pool_id', poolId).eq('is_admin', false);
  if (usersError) throw usersError;

  const userIds = users.map(u => u.id);

  if (userIds.length === 0) {
    return { users: [], points: [], teams: [], matches: [], matchPredictions: [], groupPredictions: [], groups: [], groupsResults: [], finalPredictions: [], tournamentResults: [] };
  }
  
  const [
    { data: points, error: pointsError }, { data: teams, error: teamsError },
    { data: matches, error: matchesError }, { data: matchPredictions, error: mpError },
    { data: groupPredictions, error: gpError }, { data: groups, error: groupsError },
    { data: groupsResults, error: grError }, { data: finalPredictions, error: fpError },
    { data: tournamentResults, error: trError }
  ] = await Promise.all([
    supabase.from('user_points').select('*').in('user_id', userIds),
    supabase.from('teams').select('*'),
    supabase.from('matches').select('*'),
    supabase.from('match_predictions').select('*').in('user_id', userIds),
    supabase.from('group_predictions').select('*').in('user_id', userIds),
    supabase.from('groups').select('*'),
    supabase.from('groups_results').select('*'),
    supabase.from('final_predictions').select('*').in('user_id', userIds),
    supabase.from('tournament_results').select('*')
  ]);

  const anyError = usersError || pointsError || teamsError || matchesError || mpError || gpError || groupsError || grError || fpError || trError;
  if (anyError) throw anyError;

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
    
    if (!points || !users || !teams || !matches || !matchPredictions || !groupPredictions || !groups || !groupsResults || !finalPredictions || !tournamentResults) {
        return [];
    }

    const teamMap = new Map(teams.map(t => [t.id, t.name]));

    const pointTypeTranslations: { [key: string]: string } = {
        'EXACT_SCORE': "Placar Exato",
        'CORRECT_WINNER': "Acertou o Vencedor",
        'PARTIAL_SCORE': "Gols de 1 Time",
        'group_classification': "Classificação de Grupo",
        'final_champion': "Campeão",
        'final_runner_up': "Vice-Campeão",
        'final_third_place': "3º Lugar",
        'final_fourth_place': "4º Lugar",
        'final_score': "Placar da Final",
        'bonus_top_4': "Bônus Top 4 Exato",
        'NO_POINTS': "Sem Pontuação",
    };

    const getPointTypeDescription = (type: string | null) => type ? (pointTypeTranslations[type] || type) : "Não definido";

    const matchPointTypes = new Set(['EXACT_SCORE', 'CORRECT_WINNER', 'PARTIAL_SCORE', 'NO_POINTS']);

    const reportData = points.map(point => {
        const user = users.find(u => u.id === point.user_id);
        const reportRow = {
            id: point.id,
            participante: user?.name || 'N/A',
            data: point.created_at,
            jogo: 'N/A',
            resultado: 'N/A',
            palpite: 'N/A',
            tipo_pontuacao: getPointTypeDescription(point.points_type),
            pontos: point.points,
            sortDate: new Date(point.created_at).getTime() // Data para ordenação
        };

        if (point.points_type && matchPointTypes.has(point.points_type)) {
            const prediction = matchPredictions.find(p => p.id === point.prediction_id);
            const match = matches.find(m => m.id === prediction?.match_id);
            if (match && prediction) {
                const homeTeam = teamMap.get(match.home_team_id) || 'Time A';
                const awayTeam = teamMap.get(match.away_team_id) || 'Time B';
                reportRow.jogo = `${homeTeam} vs ${awayTeam}`;
                reportRow.resultado = match.is_finished ? `${match.home_score} - ${match.away_score}` : 'Pendente';
                reportRow.palpite = `${prediction.home_score} - ${prediction.away_score}`;
                reportRow.sortDate = parseISO(match.match_date).getTime();
            }
        } 
        else if (point.points_type === 'group_classification') {
            const prediction = groupPredictions.find(p => p.id === point.prediction_id);
            const group = groups.find(g => g.id === prediction?.group_id);
            const result = groupsResults.find(r => r.group_id === prediction?.group_id);
            if (prediction && group) {
                reportRow.jogo = `Classificação Grupo ${group.name}`;
                const predFirst = teamMap.get(prediction.predicted_first_team_id) || 'N/A';
                const predSecond = teamMap.get(prediction.predicted_second_team_id) || 'N/A';
                reportRow.palpite = `1º ${predFirst}, 2º ${predSecond}`;
                if (result) {
                    const resFirst = teamMap.get(result.first_place_team_id) || 'N/A';
                    const resSecond = teamMap.get(result.second_place_team_id) || 'N/A';
                    reportRow.resultado = `1º ${resFirst}, 2º ${resSecond}`;
                } else {
                    reportRow.resultado = 'Pendente';
                }
            }
        }
        else if (point.points_type && point.points_type.startsWith('final_')) {
            const prediction = finalPredictions.find(p => p.user_id === point.user_id);
            const result = tournamentResults?.[0]; 
            if (prediction && result) {
                reportRow.jogo = 'Fase Final do Torneio';
                let predTeamId, resTeamId, position = 'N/A';
                switch(point.points_type) {
                    case 'final_champion': position = 'Campeão'; predTeamId = prediction.champion_id; resTeamId = result.champion_id; break;
                    case 'final_runner_up': position = 'Vice'; predTeamId = prediction.runner_up_id; resTeamId = result.runner_up_id; break;
                }
                reportRow.palpite = `${position}: ${teamMap.get(predTeamId) || 'N/A'}`;
                reportRow.resultado = `${position}: ${teamMap.get(resTeamId) || 'N/A'}`;
            }
        }
        
        return reportRow;
    });
    
    // Ordena pelo sortDate (data do jogo ou da criação do ponto)
    return reportData.sort((a, b) => b.sortDate - a.sortDate);

  }, [data]);

  const users = useMemo(() => data?.users?.sort((a, b) => a.name.localeCompare(b.name)) || [], [data?.users]);
  
  const filteredData = useMemo(() => {
    if (selectedUserId === 'all') return processedData;
    const selectedUserName = users.find(u => u.id === selectedUserId)?.name;
    return processedData.filter(item => item.participante === selectedUserName);
  }, [processedData, selectedUserId, users]);
  
  const totalPoints = useMemo(() => filteredData.reduce((sum, item) => sum + item.pontos, 0), [filteredData]);

  if (isLoading) {
    return <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-fifa-blue" /></div>;
  }
  
  // O restante do componente (o return com o JSX) permanece igual.
  // ...
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
                <SelectTrigger className="w-full sm:w-[280px]">
                  <SelectValue placeholder="Filtrar por participante..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Participantes</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
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
                  <TableHead>Resultado Oficial</TableHead>
                  <TableHead>Palpite</TableHead>
                  <TableHead>Critério</TableHead>
                  <TableHead className="text-center">Pontos</TableHead>
                  <TableHead className="text-right">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.participante}</TableCell>
                      <TableCell>{item.jogo}</TableCell>
                      <TableCell>{item.resultado}</TableCell>
                      <TableCell>{item.palpite}</TableCell>
                      <TableCell>{item.tipo_pontuacao}</TableCell>
                      <TableCell className="text-center font-bold">
                        <Badge variant={item.pontos > 0 ? 'default' : 'destructive'}>{item.pontos}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {format(new Date(item.data), 'dd/MM/yy HH:mm', { locale: ptBR })}
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