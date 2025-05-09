
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Volleyball as SoccerBallIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type MatchCardProps = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  stage: string;
  time?: string; // Optional time prop
  group?: string; // Add optional group prop
  selected: boolean;
  onClick?: (id: string) => void; // Made onClick optional
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
  group,
  selected,
  onClick,
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
              {group && <span className="ml-2">• Grupo {group}</span>}
            </CardDescription>
          </div>
          <SoccerBallIcon className="h-5 w-5 text-fifa-blue" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <span className="font-semibold">{homeTeam}</span>
          <div className="mx-3 px-4 py-1 bg-gray-100 rounded-lg font-bold">
            vs
          </div>
          <span className="font-semibold">{awayTeam}</span>
        </div>
      </CardContent>
    </Card>
  );
};
