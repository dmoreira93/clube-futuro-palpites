// src/components/ranking/RankingRow.tsx (VERSÃO SIMPLIFICADA)

import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Participant } from "@/hooks/useParticipantsRanking";

interface RankingRowProps {
  participant: Participant;
  index: number;
}

// Função para formatar o prêmio
const formatPrize = (prize: string | null): string => {
  if (!prize) return "";
  // Verifica se é um número (prêmio) ou texto (punição)
  const numericValue = parseFloat(prize);
  if (!isNaN(numericValue)) {
    return numericValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  return prize; // Retorna o texto da punição
};

const RankingRow = ({ participant, index }: RankingRowProps) => {
  const prizeText = formatPrize(participant.prize);
  const isPrizeWinner = participant.prize && !isNaN(parseFloat(participant.prize));

  return (
    <TableRow className={isPrizeWinner ? "bg-yellow-100 dark:bg-yellow-900/20" : ""}>
      <TableCell className="text-center font-medium">{index + 1}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={participant.avatar_url || undefined} alt={participant.name} />
            <AvatarFallback>{participant.name ? participant.name.substring(0, 2).toUpperCase() : '??'}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{participant.name}</div>
            <div className="text-xs text-muted-foreground">@{participant.username}</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right font-bold">{participant.points}</TableCell>
      <TableCell className="hidden md:table-cell text-right">{participant.matchesPlayed}</TableCell>
      <TableCell className="hidden md:table-cell text-right">{participant.accuracy}</TableCell>
      <TableCell className="hidden md:table-cell text-right font-semibold text-sm">{prizeText}</TableCell>
    </TableRow>
  );
};

export default RankingRow;