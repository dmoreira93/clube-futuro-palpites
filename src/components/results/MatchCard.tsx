// src/components/results/MatchCard.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Volleyball as SoccerBallIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type MatchCardProps = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string; // ISO string expected
  stage: string;
  time?: string; // This prop is actually passed in `Resultados.tsx` as `new Date(match.match_date).toLocaleTimeString`
  group?: { name: string };
  selected: boolean;
  onClick?: (id: string) => void;
  homeTeamFlag?: string;
  awayTeamFlag?: string;
  homeScore?: number | null; // Adicionado para exibir o placar
  awayScore?: number | null; // Adicionado para exibir o placar
};

const formatDate = (dateStr: string) => {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
  } catch (e) {
    // Se a data for inválida, retorna a string original ou uma string vazia
    console.error("Erro ao formatar data:", dateStr, e);
    return dateStr;
  }
};

const formatTime = (dateStr: string) => {
  try {
    return format(new Date(dateStr), "HH:mm", { locale: ptBR });
  } catch (e) {
    // Se a data for inválida, retorna uma string vazia
    console.error("Erro ao formatar hora:", dateStr, e);
    return "";
  }
};

export const MatchCard = ({
  id,
  homeTeam,
  awayTeam,
  date,
  stage,
  time, // 'time' is received, but 'formatTime(date)' is also used directly below.
  group,
  selected,
  onClick,
  homeTeamFlag,
  awayTeamFlag,
  homeScore, // Score prop
  awayScore, // Score prop
}: MatchCardProps) => {
  const handleClick = () => {
    if (onClick) onClick(id);
  };

  // Determina se a partida terminou para exibir o placar ou "vs"
  const isMatchFinished = homeScore !== null && awayScore !== null;

  return (
    <Card
      className={`shadow-md hover:shadow-lg transition-shadow duration-300 ${
        selected ? "border-2 border-fifa-blue" : ""
      } ${onClick ? "cursor-pointer" : ""}`}
      onClick={handleClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex flex-col">
          <CardTitle className="text-sm font-medium">
            {formatDate(date)}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {formatTime(date)} {stage && <span className="ml-2">• {stage}</span>}
            {group && <span className="ml-2">• Grupo {group.name}</span>}
          </CardDescription>
        </div>
        <SoccerBallIcon className="h-5 w-5 text-fifa-blue" />
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 w-2/5">
            <div className="w-6 h-6 flex justify-center flex-shrink-0"> {/* Adicionado flex-shrink-0 */}
              <Avatar className="h-6 w-6">
                {homeTeamFlag ? (
                  <AvatarImage src={homeTeamFlag} alt={homeTeam} />
                ) : (
                  <AvatarFallback className="text-xs">{homeTeam.substring(0, 2)}</AvatarFallback>
                )}
              </Avatar>
            </div>
            <span className="font-semibold truncate">{homeTeam}</span>
          </div>

          {isMatchFinished ? (
            <div className="mx-3 px-4 py-1 bg-fifa-blue text-white rounded-lg font-bold text-lg flex items-center justify-center min-w-[70px]"> {/* Adjusted width */}
              {homeScore} - {awayScore}
            </div>
          ) : (
            <div className="mx-3 px-4 py-1 bg-gray-100 rounded-lg font-bold text-center min-w-[70px]"> {/* Adjusted width */}
              vs
            </div>
          )}
          
          <div className="flex items-center gap-2 justify-end w-2/5">
            <span className="font-semibold truncate">{awayTeam}</span>
            <div className="w-6 h-6 flex justify-center flex-shrink-0"> {/* Adicionado flex-shrink-0 */}
              <Avatar className="h-6 w-6">
                {awayTeamFlag ? (
                  <AvatarImage src={awayTeamFlag} alt={awayTeam} />
                ) : (
                  <AvatarFallback className="text-xs">{awayTeam.substring(0, 2)}</AvatarFallback>
                )}
              </Avatar>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};