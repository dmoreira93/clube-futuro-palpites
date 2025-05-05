
import React from "react";
import { Prediction } from "@/types/predictions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type PredictionItemProps = {
  prediction: Prediction;
  homeTeamName: string;
  awayTeamName: string;
};

const PredictionItem = ({ prediction, homeTeamName, awayTeamName }: PredictionItemProps) => {
  return (
    <TableRow key={prediction.id}>
      <TableCell>{prediction.user?.name || "Usuário desconhecido"}</TableCell>
      <TableCell className="text-center font-semibold">{prediction.home_score}</TableCell>
      <TableCell className="text-center font-semibold">{prediction.away_score}</TableCell>
    </TableRow>
  );
};

export default PredictionItem;
