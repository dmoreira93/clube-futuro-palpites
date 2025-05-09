
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
  time?: string; // Add optional time prop
  selected: boolean;
  onClick: (id: string) => void;
};

const formatDate = (dateStr: string) => {
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
};

const formatTime = (dateStr: string) => {
  return format(new Date(dateStr), "HH:mm", { locale: ptBR });
};

export const MatchCard = ({
  id,
  homeTeam,
  awayTeam,
  date,
  stage,
  time,
  selected,
  onClick,
}: MatchCardProps) => {
  return (
    <Card 
      className={`cursor-pointer transition-all ${
        selected ? "ring-2 ring-fifa-blue" : ""
      }`}
      onClick={() => onClick(id)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-sm font-medium">{stage}</CardTitle>
            <CardDescription>
              {formatDate(date)} • {time || formatTime(date)}
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
