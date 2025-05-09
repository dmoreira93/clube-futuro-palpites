
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";

type PredictionItemProps = {
  prediction: {
    id: string;
    home_score: number;
    away_score: number;
    user?: { name: string };
    user_id?: string;
    users?: { name: string };
  };
  homeTeamName: string;
  awayTeamName: string;
};

const PredictionItem = ({ prediction, homeTeamName, awayTeamName }: PredictionItemProps) => {
  // Handles different structures of user data that may come from the database
  const userName = prediction.user?.name || 
                  prediction.users?.name || 
                  "Usuário desconhecido";

  return (
    <TableRow>
      <TableCell>{userName}</TableCell>
      <TableCell className="text-center font-semibold">{prediction.home_score}</TableCell>
      <TableCell className="text-center font-semibold">{prediction.away_score}</TableCell>
    </TableRow>
  );
};

export default PredictionItem;
