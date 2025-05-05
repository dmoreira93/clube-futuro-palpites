
import React from "react";
import { Prediction } from "@/types/predictions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PredictionItem from "./PredictionItem";

type PredictionsListProps = {
  predictions: Prediction[];
  homeTeamName: string;
  awayTeamName: string;
};

const PredictionsList = ({ predictions, homeTeamName, awayTeamName }: PredictionsListProps) => {
  if (predictions.length === 0) {
    return <p className="text-gray-500 italic py-2">Nenhum palpite registrado para este jogo.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Participante</TableHead>
            <TableHead className="text-center">{homeTeamName || "Time da Casa"}</TableHead>
            <TableHead className="text-center">{awayTeamName || "Time Visitante"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {predictions.map((prediction) => (
            <PredictionItem 
              key={prediction.id}
              prediction={prediction}
              homeTeamName={homeTeamName}
              awayTeamName={awayTeamName}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PredictionsList;
