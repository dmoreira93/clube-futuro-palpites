import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import Layout from "@/components/layout/Layout"; // <-- ADICIONADO: Importe o componente Layout
import { MatchCard } from "@/components/results/MatchCard";
import { MatchFilter } from "@/components/results/MatchFilter";
import { ResultForm } from "@/components/results/ResultForm";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Match } from "@/types/matches"; // Certifique-se de que Match está importado se for um tipo externo

const Resultados = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);

  const groups = [
    { id: 'A', text: 'A' },
    { id: 'B', text: 'B' },
    { id: 'C', text: 'C' },
    { id: 'D', text: 'D' },
    { id: 'E', text: 'E' },
    { id: 'F', text: 'F' },
    { id: 'G', text: 'G' },
    { id: 'H', text: 'H' },
  ];

  const { data: matches = [], isLoading, error } = useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          match_date,
          is_finished,
          stage,
          home_score,
          away_score,
          home_team_id,
          away_team_id,
          home_team:home_team_id(id, name, flag_url, group:group_id(name)),
          away_team:away_team_id(id, name, flag_url, group:group_id(name))
        `) // <--- ALTERADO: Buscando o nome do grupo através da FK
        .order('match_date', { ascending: true });

      if (error) {
        console.error("Erro ao buscar partidas:", error.message);
        throw new Error("Não foi possível carregar as partidas.");
      }
      // Ajuste o tipo de retorno para garantir que o 'group' seja reconhecido
      return data as (Match & {
        home_team: { name: string; flag_url: string; group: { name: string } } | null;
        away_team: { name: string; flag_url: string; group: { name: string } } | null;
      })[] || [];
    },
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao carregar partidas",
        description: "Não foi possível carregar as partidas do banco de dados.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatch(matchId);
  };

  const handleFormComplete = () => {
    setSelectedMatch(null);
  };

  const filteredMatches = matches.filter((match) => {
    if (filter === "all") {
      return true;
    }
    // Verifica se o nome do grupo da equipe da casa (ou de fora) corresponde ao filtro
    // Acessando o nome do grupo através do relacionamento aninhado
    return match.home_team?.group?.name === filter || match.away_team?.group?.name === filter;
  });

  const selectedMatchData = matches.find((m) => m.id === selectedMatch) as Match | undefined;

  if (isLoading) {
    return (
      <Layout> {/* <-- ADICIONADO: Envolvendo com Layout */}
        <div className="max-w-4xl mx-auto flex justify-center items-center min-h-[400px]">
          <div className="animate-spin h-8 w-8 border-4 border-fifa-blue border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout> {/* <-- ADICIONADO: Envolvendo com Layout */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-fifa-blue">Resultados dos Jogos</h1>
          <p className="text-gray-600 mt-2">
            Administrador: insira os resultados das partidas para atualizar a pontuação dos participantes
          </p>
        </div>

        {isAdmin && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <AlertTitle className="text-amber-800">Área restrita</AlertTitle>
            <AlertDescription className="text-amber-700">
              Apenas administradores podem inserir resultados. Os participantes devem aguardar a atualização oficial.
              <strong className="block mt-2">
                Ao registrar um resultado, o sistema calculará automaticamente os pontos dos participantes conforme os critérios estabelecidos.
              </strong>
            </AlertDescription>
          </Alert>
        )}

        <MatchFilter value={filter} onValueChange={setFilter} groups={groups} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {filteredMatches.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-gray-50 rounded-md">
              <p className="text-gray-500">Nenhuma partida encontrada para este filtro.</p>
            </div>
          ) : (
            (filteredMatches as any[]).map((match) => (
              <MatchCard
                key={match.id}
                id={match.id}
                homeTeam={match.home_team?.name || ""}
                awayTeam={match.away_team?.name || ""}
                date={match.match_date ? new Date(match.match_date).toISOString() : ""}
                time={match.match_date ? new Date(match.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                group={match.home_team?.group ? { name: match.home_team.group.name } : undefined} {/* <--- MUDANÇA AQUI: Acessando .group.name */}
                homeTeamFlag={match.home_team?.flag_url || ""}
                awayTeamFlag={match.away_team?.flag_url || ""}
                stage={match.stage || ""}
                selected={selectedMatch === match.id}
                onClick={isAdmin ? handleSelectMatch : undefined}
              />
            ))
          )}
        </div>

        {selectedMatch && isAdmin && (
          <ResultForm match={selectedMatchData} onComplete={handleFormComplete} />
        )}
      </div>
    </Layout>
  );
};

export default Resultados;