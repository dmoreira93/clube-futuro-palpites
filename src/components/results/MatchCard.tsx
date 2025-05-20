import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Volleyball as SoccerBallIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type MatchCardProps = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  stage: string;
  time?: string;
  groupText?: string;
  selected: boolean;
  onClick?: (id: string) => void;
  homeTeamFlag?: string;
  awayTeamFlag?: string;
};

const formatDate = (dateStr: string) => {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
  } catch (e) {
    return dateStr;
  }
};

const formatTime = (dateStr: string) => {
  try {
    return format(new Date(dateStr), "HH:mm", { locale: ptBR });
  } catch (e) {
    return "";
  }
};

export const MatchCard = ({
  id,
  homeTeam,
  awayTeam,
  date,
  stage,
  time,
  groupText,
  selected,
  onClick,
  homeTeamFlag,
  awayTeamFlag,
}: MatchCardProps) => {
  const handleClick = () => {
    if (onClick) onClick(id);
  };

  return (
    <Card 
      className={`cursor-pointer transition-all ${
        selected ? "ring-2 ring-fifa-blue" : ""
      }`}
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-sm font-medium">{stage}</CardTitle>
            <CardDescription>
              {formatDate(date)} • {time || formatTime(date)}
              {groupText && <span className="ml-2">• Grupo {groupText}</span>}
            </CardDescription>
          </div>
          <SoccerBallIcon className="h-5 w-5 text-fifa-blue" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 w-2/5">
            <div className="w-6 h-6 flex justify-center">
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
          <div className="mx-3 px-4 py-1 bg-gray-100 rounded-lg font-bold">
            vs
          </div>
          <div className="flex items-center gap-2 justify-end w-2/5">
            <span className="font-semibold truncate">{awayTeam}</span>
            <div className="w-6 h-6 flex justify-center">
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
