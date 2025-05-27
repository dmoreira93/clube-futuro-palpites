// src/pages/Resultados.tsx
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query"; // Adicionado useQueryClient
import { useToast } from "@/components/ui/use-toast";
import Layout from "@/components/layout/Layout";
import { MatchCard } from "@/components/results/MatchCard";
import { MatchFilter } from "@/components/results/MatchFilter";
import { ResultForm } from "@/components/results/ResultForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Match as MatchType } from "@/types/matches"; // Renomeado para evitar conflito
import { Loader2, AlertTriangle } from "lucide-react"; // Ícones para loading e alerta

// Tipo para os dados retornados pela query, incluindo os nomes dos grupos aninhados
type FetchedMatch = MatchType & {
  home_team: { id: string; name: string; flag_url: string | null; group: { name: string } | null } | null;
  away_team: { id: string; name: string; flag_url: string | null; group: { name: string } | null } | null;
};

const Resultados = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient(); // Para invalidar a query após submissão
  const [filter, setFilter] = useState("all"); // Opções: "all", "fase-de-grupos", "A", "B", ...
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);

  const groups = [
    { id: 'A', text: 'A' }, { id: 'B', text: 'B' }, { id: 'C', text: 'C' }, { id: 'D', text: 'D' },
    { id: 'E', text: 'E' }, { id: 'F', text: 'F' }, { id: 'G', text: 'G' }, { id: 'H', text: 'H' },
  ];

  const { data: matches = [], isLoading, error, refetch } = useQuery<FetchedMatch[]>({ // Especificando o tipo aqui
    queryKey: ['matchesResults'], // Chave de query única para esta tela
    queryFn: async () => {
      const { data, error: queryError } = await supabase
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
        `)
        .not('home_team_id', 'is', null) // Garante que home_team_id não é null
        .not('away_team_id', 'is', null) // Garante que away_team_id não é null
        .order('match_date', { ascending: true });

      if (queryError) {
        console.error("Erro ao buscar partidas:", queryError.message);
        throw new Error(queryError.message || "Não foi possível carregar as partidas.");
      }
      return data as FetchedMatch[] || [];
    },
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao carregar partidas",
        description: error.message || "Não foi possível carregar as partidas do banco de dados.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatch(matchId === selectedMatch ? null : matchId); // Permite deselecionar
  };

  const handleFormComplete = () => {
    setSelectedMatch(null);
    toast({
      title: "Resultado Atualizado",
      description: "A lista de partidas será atualizada em breve.",
    });
    // Invalida a query para forçar o refetch dos dados e mostrar o resultado atualizado
    queryClient.invalidateQueries({ queryKey: ['matchesResults'] });
    // Ou chamar refetch() diretamente, mas invalidateQueries é geralmente preferido
    // refetch(); 
  };

  const filteredMatches = matches.filter((match) => {
    if (!match.home_team || !match.away_team) return false; // Adicionalmente, garante que os times existem

    if (filter === "all") {
      return true;
    }
    if (filter === "fase-de-grupos") {
      return match.stage === "Fase de Grupos";
    }
    // Filtro por grupo específico (A, B, C...)
    return match.home_team?.group?.name === filter || match.away_team?.group?.name === filter;
  });

  const selectedMatchData = matches.find((m) => m.id === selectedMatch);

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto flex justify-center items-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-12 w-12 animate-spin text-fifa-blue" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8"> {/* Aumentado max-w para melhor acomodação */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-fifa-blue">Resultados e Gerenciamento</h1>
          {isAdmin && (
            <p className="text-gray-600 mt-2">
              Insira os resultados das partidas para atualizar a pontuação dos participantes.
            </p>
          )}
           {!isAdmin && (
            <p className="text-gray-600 mt-2">
              Confira os resultados oficiais das partidas do torneio.
            </p>
          )}
        </div>

        {isAdmin && (
          <Alert className="mb-6 bg-amber-50 border-amber-300 text-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <AlertTitle className="font-semibold">Área de Administração</AlertTitle>
            <AlertDescription>
              As alterações aqui impactam diretamente os resultados e pontuações.
              Ao registrar um resultado, o sistema calculará automaticamente os pontos.
            </AlertDescription>
          </Alert>
        )}

        <MatchFilter value={filter} onValueChange={setFilter} groups={groups} />

        {/* Formulário de resultado aparece acima da lista se uma partida estiver selecionada */}
        {isAdmin && selectedMatch && selectedMatchData && (
          <div className="mb-8">
            <ResultForm match={selectedMatchData} onComplete={handleFormComplete} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"> {/* Aumentado o gap */}
          {filteredMatches.length === 0 && !isLoading ? (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg shadow">
              <SoccerBallIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-700">Nenhuma partida encontrada.</p>
              <p className="text-gray-500">
                Verifique os filtros ou aguarde novas partidas serem cadastradas.
              </p>
            </div>
          ) : (
            filteredMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match} // Passa o objeto match inteiro
                selected={selectedMatch === match.id}
                onClick={isAdmin ? handleSelectMatch : undefined} // Só permite click para admin
              />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Resultados;