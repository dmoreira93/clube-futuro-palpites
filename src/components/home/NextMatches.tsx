
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Volleyball as SoccerBallIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Sample data for demonstration
const upcomingMatches = [
  {
    id: 1,
    homeTeam: "Real Madrid",
    awayTeam: "Manchester City",
    date: "2025-06-15",
    time: "15:00",
    group: "A",
    stage: "Fase de Grupos",
  },
  {
    id: 2,
    homeTeam: "Fluminense",
    awayTeam: "Bayern Munich",
    date: "2025-06-15",
    time: "18:00",
    group: "B",
    stage: "Fase de Grupos",
  },
  {
    id: 3,
    homeTeam: "Inter Miami",
    awayTeam: "Al-Hilal",
    date: "2025-06-16",
    time: "15:00",
    group: "C",
    stage: "Fase de Grupos",
  },
];

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR");
};

const NextMatches = () => {
  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-fifa-blue text-white">
        <div className="flex items-center gap-2">
          <SoccerBallIcon className="h-5 w-5 text-fifa-gold" />
          <CardTitle>Próximos Jogos</CardTitle>
        </div>
        <CardDescription className="text-gray-300">
          Prepare seus palpites para estas partidas
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {upcomingMatches.map((match) => (
            <div key={match.id} className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">
                  {formatDate(match.date)} • {match.time}
                </span>
                <Badge variant="outline" className="border-fifa-blue text-fifa-blue">
                  Grupo {match.group}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex-1 text-right">
                  <span className="font-semibold">{match.homeTeam}</span>
                </div>
                <div className="mx-3 px-4 py-1 bg-gray-100 rounded-lg font-bold">
                  vs
                </div>
                <div className="flex-1">
                  <span className="font-semibold">{match.awayTeam}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default NextMatches;
