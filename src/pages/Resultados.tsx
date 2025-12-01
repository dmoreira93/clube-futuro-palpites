import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
// CORREÇÃO: Voltamos a usar chaves { } pois são exportações nomeadas
import { MatchCard } from "@/components/results/MatchCard";
import { ResultForm } from "@/components/results/ResultForm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Match as MatchType, Team } from "@/types/matches";
import { Loader2, Trophy, Users as UsersIcon, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Interfaces para os dados
type FetchedMatch = MatchType & {
  home_team: Team | null;
  away_team: Team | null;
};

interface GroupResult {
  group_id: string;
  group_name: string;
  first_place_team: Team | null;
  second_place_team: Team | null;
}

interface FinalResult {
  champion: Team | null;
  runner_up: Team | null;
  third_place: Team | null;
  fourth_place: Team | null;
  final_home_score: number | null;
  final_away_score: number | null;
}

const Resultados = () => {
  // CORREÇÃO: Mapeamos 'activePool' (do contexto) para 'pool' (usado neste código)
  const { isAdmin, activePool: pool, userParticipations, switchPool } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMatch, setSelectedMatch] = useState<FetchedMatch | null>(null);

  // LÓGICA DE RECUPERAÇÃO: Se o usuário der refresh ou acessar direto, tenta restaurar o bolão ativo
  useEffect(() => {
    if (!pool) {
      const savedPoolId = localStorage.getItem('activePoolId');
      if (savedPoolId && userParticipations.length > 0) {
        const canSwitch = userParticipations.some(p => p.pool.id === savedPoolId);
        if (canSwitch) {
            switchPool(savedPoolId);
        }
      }
    }
  }, [pool, userParticipations, switchPool]);

  const championshipId = pool?.championship_id;

  // --- QUERY 1: PARTIDAS DA FASE DE GRUPOS ---
  const { data: matches = [], isLoading: isLoadingMatches } = useQuery<FetchedMatch[]>({
    queryKey: ['matchesResultsGroupStage', championshipId],
    queryFn: async () => {
      if (!championshipId) return [];
      const { data, error } = await supabase
        .from('matches')
        .select(`*, home_team:home_team_id(*), away_team:away_team_id(*)`)
        .eq('stage', 'Fase de Grupos')
        .eq('championship_id', championshipId)
        .not('home_team_id', 'is', null)
        .not('away_team_id', 'is', null)
        .order('match_date', { ascending: true });
      
      if (error) throw error;
      return data as FetchedMatch[];
    },
    enabled: !!championshipId,
  });

  // --- QUERY 2: RESULTADOS DOS GRUPOS ---
  const { data: groupResultsData = [], isLoading: isLoadingGroupResults } = useQuery<GroupResult[]>({
    queryKey: ['groupResultsData', championshipId],
    queryFn: async () => {
        if (!championshipId) return [];
        const { data, error } = await supabase
            .from('groups_results')
            .select(`
                *, 
                groups!inner(name, championship_id), 
                first_place_team:first_place_team_id(*), 
                second_place_team:second_place_team_id(*)
            `)
            .eq('groups.championship_id', championshipId);

        if (error) throw error;
        return (data || []).map(item => ({
            group_id: item.group_id,
            group_name: (item.groups as any)?.name || 'N/A',
            first_place_team: item.first_place_team,
            second_place_team: item.second_place_team,
        })) as GroupResult[];
    },
    enabled: !!championshipId,
  });

  // --- QUERY 3: RESULTADOS FINAIS ---
  const { data: finalResultData, isLoading: isLoadingFinalResult } = useQuery<FinalResult | null>({
    queryKey: ['finalResultData', championshipId],
    queryFn: async () => {
      if (!championshipId) return null;
      const { data, error } = await supabase
        .from('tournament_results')
        .select(`
          id, final_home_score, final_away_score,
          champion:champion_id(id, name), 
          runner_up:runner_up_id(id, name), 
          third_place:third_place_id(id, name), 
          fourth_place:fourth_place_id(id, name)
        `)
        .eq('championship_id', championshipId)
        .maybeSingle();
      
      if (error) throw error;
      return data as FinalResult | null;
    },
    enabled: !!championshipId,
  });

  const handleSelectMatch = (matchId: string) => {
    if (!isAdmin) return;
    const match = matches.find(m => m.id === matchId);
    setSelectedMatch(match || null);
  };

  const handleFormComplete = () => {
    toast({ title: "Sucesso!", description: "O resultado foi salvo e os pontos serão reprocessados." });
    setSelectedMatch(null);
    queryClient.invalidateQueries({ queryKey: ['matchesResultsGroupStage'] });
  };

  if (!pool) {
    return (
        <div className="container mx-auto p-8 text-center">
            <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Nenhum Bolão Selecionado</AlertTitle>
            <AlertDescription>Por favor, selecione um bolão no menu "Meus Bolões" para ver os resultados.</AlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-fifa-blue">Resultados da Fase de Grupos</h1>
        <p className="text-muted-foreground mt-1">
            Campeonato: <span className="font-semibold text-fifa-gold">{pool.name}</span>
        </p>
      </div>

      {isAdmin && selectedMatch && (
        <div className="mb-8 animate-in fade-in-50">
          <ResultForm match={selectedMatch} onComplete={handleFormComplete} />
        </div>
      )}

      {isLoadingMatches ? (
        <div className="flex justify-center mt-10">
          <Loader2 className="h-12 w-12 animate-spin text-fifa-blue" />
        </div>
      ) : matches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {matches.map(match => (
            <MatchCard key={match.id} match={match} selected={selectedMatch?.id === match.id} onClick={isAdmin ? handleSelectMatch : undefined} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
            <p className="text-muted-foreground">Nenhuma partida encontrada para este campeonato.</p>
            {isAdmin && <p className="text-xs text-muted-foreground mt-2">Dica: Cadastre os jogos no Painel Admin e vincule-os a este campeonato.</p>}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="text-yellow-500"/> Classificação Final</CardTitle></CardHeader>
              <CardContent>
                  {isLoadingFinalResult ? <Loader2 className="h-6 w-6 animate-spin"/> :
                      finalResultData ? (
                          <ul className="space-y-2">
                              <li><strong>Campeão:</strong> {finalResultData.champion?.name || 'A definir'}</li>
                              <li><strong>Vice:</strong> {finalResultData.runner_up?.name || 'A definir'}</li>
                              <li><strong>3º Lugar:</strong> {finalResultData.third_place?.name || 'A definir'}</li>
                              <li><strong>4º Lugar:</strong> {finalResultData.fourth_place?.name || 'A definir'}</li>
                          </ul>
                      ) : <p className="text-muted-foreground italic">Resultados finais ainda não definidos.</p>
                  }
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><UsersIcon className="text-fifa-blue"/> Classificação dos Grupos</CardTitle></CardHeader>
              <CardContent>
                  {isLoadingGroupResults ? <Loader2 className="h-6 w-6 animate-spin"/> :
                      groupResultsData.length > 0 ? (
                          <div className="space-y-4">
                              {groupResultsData.map(result => (
                                  <div key={result.group_id}>
                                      <h4 className="font-bold">{result.group_name}</h4>
                                      <p className="text-sm">1º: {result.first_place_team?.name || 'A definir'}</p>
                                      <p className="text-sm">2º: {result.second_place_team?.name || 'A definir'}</p>
                                  </div>
                              ))}
                          </div>
                      ) : <p className="text-muted-foreground italic">Resultados dos grupos ainda não definidos.</p>
                  }
              </CardContent>
          </Card>
      </div>
    </div>
  );
};

export default Resultados;