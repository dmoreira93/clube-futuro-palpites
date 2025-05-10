
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Prediction } from "@/types/predictions";

type PredictionItemProps = {
  prediction: Prediction;
  homeTeamName: string;
  awayTeamName: string;
};

const PredictionItem = ({ prediction, homeTeamName, awayTeamName }: PredictionItemProps) => {
  // Handles different structures of user data that may come from the database
  const userName = prediction.user?.name || 
                  (prediction.users && 'name' in prediction.users ? prediction.users.name : "Usuário desconhecido");

  return (
    <TableRow>
      <TableCell>{userName}</TableCell>
      <TableCell className="text-center font-semibold">{prediction.home_score}</TableCell>
      <TableCell className="text-center font-semibold">{prediction.away_score}</TableCell>
    </TableRow>
  );
};

export default PredictionItem;
