import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { MatchCard } from "@/components/results/MatchCard";
import { ResultForm } from "@/components/results/ResultForm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Match as MatchType, Team } from "@/types/matches";
import { Loader2, Trophy, Users as UsersIcon, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Interfaces para os dados alinhadas com o banco
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
  const { isAdmin, activePool: pool, userParticipations, switchPool } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMatch, setSelectedMatch] = useState<FetchedMatch | null>(null);

  // Sincronização e Restauração resiliente do Bolão Ativo
  useEffect(() => {
    if (!pool) {
      const savedPoolId = localStorage.getItem('activePoolId');
      if (savedPoolId && userParticipations.length > 0) {
        const poolValido = userParticipations.some(p => p.pool.id === savedPoolId);
        if (poolValido) {
            switchPool(savedPoolId);
        }
      }
    }
  }, [pool, userParticipations, switchPool]);

  // Captura dinâmica do ID do Campeonato associado ao Bolão ativo
  const championshipId = pool?.championship_id || (pool as any)?.tournament_id;

  // --- QUERY 1: PARTIDAS DA FASE DE GRUPOS (FILTRADO POR TORNEIO) ---
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

  // --- QUERY 2: RESULTADOS OFICIAIS DOS GRUPOS (ALINHADO COM MÚLTIPLOS POOLS) ---
  const { data: groupResultsData = [], isLoading: isLoadingGroupResults } = useQuery<GroupResult[]>({
    queryKey: ['groupResultsData', championshipId],
    queryFn: async () => {
        if (!championshipId) return [];
        const { data, error } = await supabase
            .from('groups_results')
            .select(`
                group_id,
                first_place_team:first_place_team_id(*), 
                second_place_team:second_place_team_id(*),
                groups!inner(name, championship_id)
            `)
            .eq('groups.championship_id', championshipId);

        if (error) throw error;
        
        return (data || []).map((item: any) => ({
            group_id: item.group_id,
            group_name: item.groups?.name || 'Grupo',
            first_place_team: item.first_place_team,
            second_place_team: item.second_place_team,
        })) as GroupResult[];
    },
    enabled: !!championshipId,
  });

  // --- QUERY 3: PODIO E CLASSIFICAÇÃO FINAL OFICIAL ---
  const { data: finalResultData = null, isLoading: isLoadingFinalResult } = useQuery<FinalResult | null>({
    queryKey: ['finalResultData', championshipId],
    queryFn: async () => {
      if (!championshipId) return null;
      const { data, error } = await supabase
        .from('tournament_results')
        .select(`
          final_home_score, 
          final_away_score,
          champion:champion_id(*), 
          runner_up:runner_up_id(*), 
          third_place:third_place_id(*), 
          fourth_place:fourth_place_id(*)
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
    toast({ title: "Sucesso!", description: "O resultado foi salvo com sucesso!" });
    setSelectedMatch(null);
    queryClient.invalidateQueries({ queryKey: ['matchesResultsGroupStage', championshipId] });
    queryClient.invalidateQueries({ queryKey: ['groupResultsData', championshipId] });
    queryClient.invalidateQueries({ queryKey: ['finalResultData', championshipId] });
  };

  if (!pool) {
    return (
        <div className="container mx-auto p-8 text-center">
            <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Nenhum Bolão Selecionado</AlertTitle>
            <AlertDescription>Por favor, selecione um bolão no menu lateral ou em "Meus Bolões" para carregar o histórico de resultados.</AlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-fifa-blue">Resultados da Fase de Grupos</h1>
        <p className="text-muted-foreground mt-1">
            Visualizando o escopo de: <span className="font-semibold text-fifa-gold">{pool.name}</span>
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
            <MatchCard 
              key={match.id} 
              match={match} 
              selected={selectedMatch?.id === match.id} 
              onClick={isAdmin ? () => handleSelectMatch(match.id) : undefined} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
            <p className="text-muted-foreground">Nenhuma partida registrada ou processada para este campeonato.</p>
        </div>
      )}
      
      {/* Cards de Tabelas Oficiais de Sincronização */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* Card: Pódio Final */}
          <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="text-yellow-500 h-5 w-5"/> Classificação Final Oficial
                </CardTitle>
              </CardHeader>
              <CardContent>
                  {isLoadingFinalResult ? (
                    <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-fifa-blue"/></div>
                  ) : finalResultData ? (
                      <ul className="space-y-3 font-medium text-gray-700">
                          <li className="flex justify-between border-b pb-1"><span>🏆 Campeão:</span> <span className="font-bold text-fifa-blue">{finalResultData.champion?.name || 'A definir'}</span></li>
                          <li className="flex justify-between border-b pb-1"><span>🥈 Vice-campeão:</span> <span className="text-gray-600">{finalResultData.runner_up?.name || 'A definir'}</span></li>
                          <li className="flex justify-between border-b pb-1"><span>🥉 3º Lugar:</span> <span className="text-orange-700">{finalResultData.third_place?.name || 'A definir'}</span></li>
                          <li className="flex justify-between border-b pb-1"><span>🏅 4º Lugar:</span> <span className="text-gray-500">{finalResultData.fourth_place?.name || 'A definir'}</span></li>
                      </ul>
                  ) : (
                    <p className="text-muted-foreground italic text-center py-4">Pódio final ainda não definido ou publicado.</p>
                  )}
              </CardContent>
          </Card>

          {/* Card: Resultados dos Grupos */}
          <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UsersIcon className="text-fifa-blue h-5 w-5"/> Classificação dos Grupos Oficial
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[300px] overflow-y-auto pr-2">
                  {isLoadingGroupResults ? (
                    <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-fifa-blue"/></div>
                  ) : groupResultsData.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                          {groupResultsData.sort((a,b) => a.group_name.localeCompare(b.group_name)).map(result => (
                              <div key={result.group_id} className="bg-gray-50/60 p-3 rounded-lg border border-gray-100">
                                  <h4 className="font-bold text-fifa-blue border-b pb-1 mb-2 text-sm">{result.group_name}</h4>
                                  <p className="text-xs text-gray-700 font-medium">1º: {result.first_place_team?.name || 'A definir'}</p>
                                  <p className="text-xs text-gray-500 mt-1">2º: {result.second_place_team?.name || 'A definir'}</p>
                              </div>
                          ))}
                      </div>
                  ) : (
                    <p className="text-muted-foreground italic text-center py-4">Ganhadores dos grupos não definidos.</p>
                  )}
              </CardContent>
          </Card>
      </div>
    </div>
  );
};

export default Resultados;