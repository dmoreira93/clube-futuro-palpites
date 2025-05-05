
import React from "react";
import { Match } from "@/types/matches";
import { Accordion } from "@/components/ui/accordion";
import MatchAccordionItem from "./MatchAccordionItem";

type MatchesPredictionsListProps = {
  matches: Match[];
};

const MatchesPredictionsList = ({ matches }: MatchesPredictionsListProps) => {
  if (matches.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhum jogo programado para hoje.</p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {matches.map((match) => (
        <MatchAccordionItem key={match.id} match={match} />
      ))}
    </Accordion>
  );
};

export default MatchesPredictionsList;
