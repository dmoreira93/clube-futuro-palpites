
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Volleyball as SoccerBallIcon } from "lucide-react";

type MatchCardProps = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  group: string;
  selected: boolean;
  onClick: (id: string) => void;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR");
};

export const MatchCard = ({
  id,
  homeTeam,
  awayTeam,
  date,
  time,
  group,
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
            <CardTitle className="text-sm font-medium">Grupo {group}</CardTitle>
            <CardDescription>
              {formatDate(date)} • {time}
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
