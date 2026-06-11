import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, ShieldCheck, Star, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Match as MatchType } from "@/types/matches";

type MatchCardProps = {
  match: MatchType & {
    home_team: { name: string; flag_url?: string | null } | null;
    away_team: { name: string; flag_url?: string | null } | null;
    home_score?: number | null;
    away_score?: number | null;
    status?: string | null; // Adicionado explicitamente para mapear a coluna real do banco
  };
  selected: boolean;
  onClick?: (id: string) => void;
};

const formatDate = (dateStr: string) => {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
  } catch (e) {
    console.warn("Erro ao formatar data:", dateStr, e);
    return "Data inválida";
  }
};

const formatTime = (dateStr: string) => {
  try {
    return format(new Date(dateStr), "HH:mm", { locale: ptBR });
  } catch (e) {
    console.warn("Erro ao formatar hora:", dateStr, e);
    return "--:--";
  }
};

export const MatchCard = ({ match, selected, onClick }: MatchCardProps) => {
  const handleClick = () => {
    if (onClick) onClick(match.id);
  };

  //  CORREÇÃO: Validação baseada na coluna real 'status' ou na existência numérica dos scores
  const isMatchFinished = 
    match.status?.toLowerCase() === "finished" || 
    match.status?.toLowerCase() === "encerrado" ||
    (match.home_score !== null && match.away_score !== null && match.home_score !== undefined);

  const homeTeamName = match.home_team?.name || "A definir";
  const awayTeamName = match.away_team?.name || "A definir";
  const homeTeamFlag = match.home_team?.flag_url;
  const awayTeamFlag = match.away_team?.flag_url;

  return (
    <Card
      className={`shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden ${
        selected ? "ring-2 ring-fifa-blue ring-offset-2" : "border-gray-200"
      } ${onClick ? "cursor-pointer" : "cursor-default"}`}
      onClick={handleClick}
    >
      <CardHeader className="p-4 bg-gradient-to-r from-fifa-blue to-fifa-green text-white">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-semibold truncate">
            {match.stage}
          </CardTitle>
          {isMatchFinished ? (
            <ShieldCheck className="h-5 w-5 text-green-300" />
          ) : (
            <CalendarDays className="h-5 w-5 text-blue-200" />
          )}
        </div>
        <CardDescription className="text-xs text-blue-100">
          {formatDate(match.match_date)} às {formatTime(match.match_date)}
          {match.stadium && <span className="block text-xs truncate">Estádio: {match.stadium}</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-center justify-around">
          {/* Time da Casa */}
          <div className="flex flex-col items-center w-2/5 text-center">
            <Avatar className="h-10 w-10 md:h-12 md:w-12 mb-2 border-2 border-gray-200">
              {homeTeamFlag ? (
                <AvatarImage src={homeTeamFlag} alt={homeTeamName} />
              ) : (
                <AvatarFallback className="text-sm bg-gray-200 text-gray-600">
                  {homeTeamName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="font-medium text-sm md:text-base text-gray-800 truncate max-w-full">{homeTeamName}</span>
          </div>

          {/* Placar ou VS */}
          <div className="flex flex-col items-center justify-center px-2">
            {isMatchFinished ? (
              <div className="text-2xl md:text-3xl font-bold text-fifa-blue tabular-nums">
                <span>{match.home_score ?? 0}</span>
                <span className="mx-1 md:mx-2">-</span>
                <span>{match.away_score ?? 0}</span>
              </div>
            ) : (
              <div className="text-xl md:text-2xl font-semibold text-gray-400">VS</div>
            )}
            
            {/* Tratamento para o estado de transição ou erro de carregamento */}
            {(match.status?.toLowerCase() === "finished" && (match.home_score === null || match.away_score === null)) && (
              <Loader2 className="h-5 w-5 animate-spin text-gray-400 mt-1"/>
            )}
          </div>

          {/* Time Visitante */}
          <div className="flex flex-col items-center w-2/5 text-center">
            <Avatar className="h-10 w-10 md:h-12 md:w-12 mb-2 border-2 border-gray-200">
              {awayTeamFlag ? (
                <AvatarImage src={awayTeamFlag} alt={awayTeamName} />
              ) : (
                <AvatarFallback className="text-sm bg-gray-200 text-gray-600">
                  {awayTeamName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="font-medium text-sm md:text-base text-gray-800 truncate max-w-full">{awayTeamName}</span>
          </div>
        </div>
         {selected && onClick && (
          <div className="text-center mt-3">
            <Star className="h-4 w-4 text-yellow-400 inline-block" />
            <span className="text-xs text-gray-500 ml-1">Selecionado para edição</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};