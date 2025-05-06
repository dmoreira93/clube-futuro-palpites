
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MatchCard } from "@/components/results/MatchCard";
import { ResultForm } from "@/components/results/ResultForm";
import { MatchFilter } from "@/components/results/MatchFilter";
import { Match } from "@/hooks/useMatchResults";

// Sample matches data
const matchesData: Match[] = [
  {
    id: "1",
    homeTeam: "Real Madrid",
    awayTeam: "Manchester City",
    date: "2025-06-15",
    time: "15:00",
    group: "A",
    status: "upcoming",
  },
  {
    id: "2",
    homeTeam: "Fluminense",
    awayTeam: "Bayern Munich",
    date: "2025-06-15",
    time: "18:00",
    group: "B",
    status: "upcoming",
  },
  {
    id: "3",
    homeTeam: "Inter Miami",
    awayTeam: "Al-Hilal",
    date: "2025-06-16",
    time: "15:00",
    group: "C",
    status: "upcoming",
  },
];

const Resultados = () => {
  const [filter, setFilter] = useState("all");
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatch(matchId);
  };

  const handleFormComplete = () => {
    setSelectedMatch(null);
  };

  const filteredMatches = filter === "all" 
    ? matchesData 
    : matchesData.filter(match => match.group === filter);

  const selectedMatchData = matchesData.find(m => m.id === selectedMatch);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-fifa-blue">Resultados dos Jogos</h1>
          <p className="text-gray-600 mt-2">
            Administrador: insira os resultados das partidas para atualizar a pontuação dos participantes
          </p>
        </div>

        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertTitle className="text-amber-800">Área restrita</AlertTitle>
          <AlertDescription className="text-amber-700">
            Apenas administradores podem inserir resultados. Os participantes devem aguardar a atualização oficial.
            <strong className="block mt-2">
              Ao registrar um resultado, o sistema calculará automaticamente os pontos dos participantes conforme os critérios estabelecidos.
            </strong>
          </AlertDescription>
        </Alert>

        <MatchFilter value={filter} onValueChange={setFilter} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {filteredMatches.map((match) => (
            <MatchCard 
              key={match.id}
              id={match.id}
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
              date={match.date}
              time={match.time}
              group={match.group}
              selected={selectedMatch === match.id}
              onClick={handleSelectMatch}
            />
          ))}
        </div>

        {selectedMatch && (
          <ResultForm 
            match={selectedMatchData} 
            onComplete={handleFormComplete}
          />
        )}
      </div>
    </Layout>
  );
};

export default Resultados;
