// src/pages/AuditoriaPontos.tsx (VERSÃO COMPLETA E DETALHADA)

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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- FUNÇÃO PARA BUSCAR TODOS OS DADOS NECESSÁRIOS ---
const fetchAllAuditData = async (poolId: string | undefined) => {
  if (!poolId) return null;

  // Busca usuários do bolão
  const { data: users, error: usersError } = await supabase.from('users_custom').select('id, name').eq('pool_id', poolId).eq('is_admin', false);
  if (usersError) throw usersError;

  const userIds = users.map(u => u.id);

  // Busca todos os pontos desses usuários
  const { data: points, error: pointsError } = await supabase.from('user_points').select('*').in('user_id', userIds);
  if (pointsError) throw pointsError;

  // Busca dados de apoio para montar o relatório
  const [
    { data: teams },
    { data: matches },
    { data: matchPredictions },
    { data: groupPredictions },
    { data: groups },
    { data: groupsResults },
    { data: finalPredictions },
    { data: tournamentResults }
  ] = await Promise.all([
    supabase.from('teams').select('*'),
    supabase.from('matches').select('*'),
    supabase.from('match_predictions').select('*').in('user_id', userIds),
    supabase.from('group_predictions').select('*').in('user_id', userIds),
    supabase.from('groups').select('*'),
    supabase.from('groups_results').select('*'),
    supabase.from('final_predictions').select('*').in('user_id', userIds),
    supabase.from('tournament_results').select('*')
  ]);

  return { users, points, teams, matches, matchPredictions, groupPredictions, groups, groupsResults, finalPredictions, tournamentResults: tournamentResults || [] };
};

const AuditoriaPontos = () => {
  const { pool } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['fullAuditData', pool?.id],
    queryFn: () => fetchAllAuditData(pool?.id),
    enabled: !!pool?.id,
  });

  // Processa e formata os dados para o relatório detalhado
  const processedData = useMemo(() => {
    if (!data) return [];
    const { users, points, teams, matches, matchPredictions, groupPredictions, groups, groupsResults, finalPredictions, tournamentResults } = data;
    
    // Mapeia IDs para nomes para facilitar a busca
    const teamMap = new Map(teams?.map(t => [t.id, t.name]));

    // Traduz os tipos de ponto para uma descrição amigável
    const pointTypeMap: { [key: string]: string } = {
        exact_score: "Placar Exato",
        match_winner: "Acertou o Vencedor",
        draw: "Acertou Empate",
        home_team_goals: "Acertou Gols Casa",
        away_team_goals: "Acertou Gols Visitante",
        group_classification: "Classificados do Grupo",
        final_champion: "Acertou o Campeão",
        final_runner_up: "Acertou o Vice",
        final_third_place: "Acertou o 3º Lugar",
        final_fourth_place: "Acertou o 4º Lugar",
    };

    return points?.map(point => {
        const user = users?.find(u => u.id === point.user_id);
        const reportRow = {
            id: point.id,
            participante: user?.name || 'N/A',
            data: point.created_at,
            jogo: 'N/A',
            resultado: 'N/A',
            palpite: 'N/A',
            tipo_pontuacao: pointTypeMap[point.points_type] || point.points_type,
            pontos: point.points,
        };

        // Detalhes para pontos de PARTIDAS
        if (point.points_type.includes('match') || ['exact_score', 'draw', 'home_team_goals', 'away_team_goals'].includes(point.points_type)) {
            const prediction = matchPredictions?.find(p => p.id === point.prediction_id);
            const match = matches?.find(m => m.id === prediction?.match_id);
            if (match && prediction) {
                const homeTeam = teamMap.get(match.home_team_id) || 'Time A';
                const awayTeam = teamMap.get(match.away_team_id) || 'Time B';
                reportRow.jogo = `${homeTeam} vs ${awayTeam}`;
                reportRow.resultado = match.is_completed ? `${match.home_score} - ${match.away_score}` : 'Pendente';
                reportRow.palpite = `${prediction.home_score} - ${prediction.away_score}`;
            }
        } 
        // Detalhes para pontos de CLASSIFICAÇÃO DE GRUPO
        else if (point.points_type === 'group_classification') {
            const prediction = groupPredictions?.find(p => p.id === point.prediction_id);
            const group = groups?.find(g => g.id === prediction?.group_id);
            const result = groupsResults?.find(r => r.group_id === prediction?.group_id);
            if (prediction && group && result) {
                reportRow.jogo = `Classificação Grupo ${group.name}`;
                const predFirst = teamMap.get(prediction.predicted_first_team_id);
                const predSecond = teamMap.get(prediction.predicted_second_team_id);
                reportRow.palpite = `1º ${predFirst}, 2º ${predSecond}`;
                const resFirst = teamMap.get(result.first_place_team_id);
                const resSecond = teamMap.get(result.second_place_team_id);
                reportRow.resultado = `1º ${resFirst}, 2º ${resSecond}`;
            }
        }
        // Detalhes para pontos da FASE FINAL
        else if (point.points_type.includes('final')) {
            const prediction = finalPredictions?.find(p => p.user_id === point.user_id); // Assumindo uma previsão final por usuário
            const result = tournamentResults?.[0]; // Assumindo uma linha de resultado final
            if (prediction && result) {
                reportRow.jogo = `Fase Final`;
                if(point.points_type === 'final_champion') {
                  reportRow.palpite = `Campeão: ${teamMap.get(prediction.champion_id) || 'N/A'}`;
                  reportRow.resultado = `Campeão: ${teamMap.get(result.champion_id) || 'N/A'}`;
                } else if (point.points_type === 'final_runner_up') {
                  reportRow.palpite = `Vice: ${teamMap.get(prediction.vice_champion_id) || 'N/A'}`;
                  reportRow.resultado = `Vice: ${teamMap.get(result.runner_up_id) || 'N/A'}`;
                }
            }
        }
        
        return reportRow;
    }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()) || [];
  }, [data]);

  const users = useMemo(() => {
    return data?.users?.sort((a, b) => a.name.localeCompare(b.name)) || [];
  }, [data?.users]);

  const filteredData = useMemo(() => {
    if (selectedUserId === 'all') return processedData;
    return processedData.filter(item => item.participante === users.find(u => u.id === selectedUserId)?.name);
  }, [processedData, selectedUserId, users]);
  
  const totalPoints = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.pontos, 0);
  }, [filteredData]);

  if (isLoading) {
    return <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-fifa-blue" /></div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao Carregar Auditoria</AlertTitle>

        <AlertDescription>{(error as Error).message}</AlertDescription>
      </Alert>
    );
  }

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

          <div className="border rounded-md">
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
                      Nenhum registro de ponto encontrado para a seleção atual.
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