import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import Layout from "@/components/layout/Layout"; // Importe o componente Layout
import { MatchCard } from "@/components/results/MatchCard";
import { MatchFilter } from "@/components/results/MatchFilter";
import { ResultForm } from "@/components/results/ResultForm";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom"; // Importe Link para o botão Voltar
import { Button } from "@/components/ui/button"; // Importe Button
import { ChevronLeft } from "lucide-react"; // Ícone para o botão Voltar

// Definindo tipos para os dados que virão do Supabase para melhor tipagem
interface Team {
  id: string;
  name: string;
  flag_url: string;
  group_id: string; // Este será o NOME do grupo após o join, não o ID
}

interface Group {
  id: string; // ID do grupo no DB
  name: string; // Nome do grupo (e.g., 'A', 'B', 'C')
}

// Tipo para a partida com os dados do join
interface Match {
  id: string;
  match_date: string;
  home_score: number | null; // Pode ser null se o jogo não ocorreu
  away_score: number | null; // Pode ser null se o jogo não ocorreu
  is_finished: boolean;
  stage: string;
  home_team: Team; // Inclui os dados do time da casa (com group_id sendo o nome)
  away_team: Team; // Inclui os dados do time de fora (com group_id sendo o nome)
  group: { name: string }; // Propriedade para o nome do grupo para o MatchCard e filtro
}

const Resultados = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);

  // Query para buscar as partidas e os nomes dos grupos
  const { data: matches = [], isLoading, error } = useQuery<Match[]>({
    queryKey: ['matches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          match_date,
          home_score,
          away_score,
          is_finished,
          stage,
          home_team:teams!home_team_id(id, name, flag_url, group_id:groups(name)),   
          away_team:teams!away_team_id(id, name, flag_url, group_id:groups(name))    
        `)
        .not('home_team_id', 'is', null) // Filtra para jogos com times preenchidos
        .not('away_team_id', 'is', null); // Filtra para jogos com times preenchidos

      if (error) {
        console.error("Erro ao buscar partidas:", error);
        throw new Error(error.message);
      }
      
      // Mapear os dados para incluir o nome do grupo diretamente na partida
      // e garantir que os scores sejam exibidos apenas se a partida estiver finalizada
      const formattedMatches = data.map((match: any) => ({
        ...match,
        // home_team e away_team já vêm com group_id como um objeto { name: '...' }
        // Se houver group_id, extraímos o nome para o MatchCard e filtro
        group: match.home_team?.group_id ? { name: match.home_team.group_id.name } : undefined,
        home_score: match.is_finished ? match.home_score : null, // Mostrar score apenas se finalizado
        away_score: match.is_finished ? match.away_score : null, // Mostrar score apenas se finalizado
      }));

      return formattedMatches as Match[];
    },
  });

  // Query para buscar os grupos dinamicamente para o dropdown de filtro
  const { data: groupsData = [], isLoading: groupsLoading } = useQuery<Group[]>({
    queryKey: ['groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name'); // Assumindo que sua tabela de grupos tem 'id' e 'name'

      if (error) {
        console.error("Erro ao buscar grupos para filtro:", error);
        throw new Error(error.message);
      }
      return data as Group[];
    },
  });

  const handleSelectMatch = (id: string) => {
    setSelectedMatch(selectedMatch === id ? null : id);
  };

  // Lógica de filtro ajustada para usar o nome do grupo
  const filteredMatches = matches.filter((match) => {
    if (filter === "all") {
      return true;
    }
    // Verifica se o nome do grupo existe e se corresponde ao filtro
    return match.group?.name === filter;
  });

  // Mapeia os grupos para o formato esperado pelo MatchFilter
  const filterGroups = groupsData.map(group => ({
    id: group.name, // Usamos o nome do grupo como ID para o filtro
    text: group.name
  }));


  return (
    <Layout> {/* Envolva a página com o componente Layout */}
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        {/* Adiciona a barra de navegação/botão de voltar */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/">
            <Button variant="ghost" className="text-fifa-blue">
              <ChevronLeft className="mr-2 h-4 w-4" /> Voltar ao Início
            </Button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold text-center text-fifa-blue flex-grow">
            Resultados das Partidas
          </h1>
          {/* Adicione um espaço aqui para alinhar o título ao centro se houver um botão à esquerda */}
          <div className="w-24"></div> 
        </div>

        {isLoading && <p>Carregando partidas...</p>}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>
              Não foi possível carregar as partidas: {error.message}
            </AlertDescription>
          </Alert>
        )}

        <MatchFilter 
          value={filter} 
          onValueChange={setFilter} 
          groups={filterGroups} // Passa os grupos dinâmicos para o filtro
          loading={groupsLoading} // Passa o estado de carregamento dos grupos
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {isLoading ? ( // Adiciona um estado de carregamento para as MatchCards
            <div className="col-span-2 text-center py-12 bg-gray-50 rounded-md">
              <p className="text-gray-500">Carregando jogos...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-gray-50 rounded-md">
              <p className="text-gray-500">Nenhuma partida encontrada para este filtro.</p>
            </div>
          ) : (
            (filteredMatches as Match[]).map((match) => (
              <MatchCard
                key={match.id}
                id={match.id}
                homeTeam={match.home_team?.name || ""}
                awayTeam={match.away_team?.name || ""}
                date={match.match_date ? new Date(match.match_date).toISOString() : ""}
                time={match.match_date ? new Date(match.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                group={match.group} // Já é um objeto { name: 'A' }
                homeTeamFlag={match.home_team?.flag_url || ""}
                awayTeamFlag={match.away_team?.flag_url || ""}
                stage={match.stage || ""}
                selected={selectedMatch === match.id}
                onClick={isAdmin ? handleSelectMatch : undefined}
                homeScore={match.home_score} // Passa o score (será null se não finalizado)
                awayScore={match.away_score} // Passa o score (será null se não finalizado)
              />
            ))
          )}
        </div>

        {selectedMatch && isAdmin && (
          <ResultForm
            matchId={selectedMatch}
            onResultSaved={() => {
              toast({
                title: "Resultado salvo!",
                description: "Os pontos dos usuários serão calculados em breve.",
              });
              setSelectedMatch(null); // Limpa a seleção
            }}
            onCancel={() => setSelectedMatch(null)}
          />
        )}
      </div>
    </Layout>
  );
};

export default Resultados;