// src/components/ranking/RankingRow.tsx - VERSÃO ATUALIZADA

import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Participant } from "@/hooks/useParticipantsRanking";
import { isAIParticipant } from '@/lib/utils';
import { Pool } from '@/types/matches'; // Supondo que você tenha esse tipo

interface RankingRowProps {
  participant: Participant;
  index: number;
  realUserRank: number;
  totalRealParticipants: number;
  poolSettings: Pool | null; // <-- NOVO: Recebe as configs do bolão
}

const getPrizeText = (
  isCurrentUserAI: boolean,
  realUserRank: number,
  totalRealUsers: number,
  pool: Pool | null // <-- NOVO: Recebe as configs do bolão
): string => {
  if (isCurrentUserAI || realUserRank < 0 || totalRealUsers === 0 || !pool) {
    return "";
  }
  
  // Calcula o prêmio apenas se houver uma taxa de entrada (lógica futura)
  // Por enquanto, vamos focar em exibir o percentual
  // const totalPrizePool = totalRealUsers * (pool.entry_fee || 25); // Exemplo
  // const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (realUserRank === 0) {
    return `${pool.prize_percent_1st}% do Prêmio`;
  }
  if (realUserRank === 1 && totalRealUsers > 1) {
    return `${pool.prize_percent_2nd}% do Prêmio`;
  }
  if (realUserRank === 2 && totalRealUsers > 2) {
    return `${pool.prize_percent_3rd}% do Prêmio`;
  }

  // Lógica da punição
  if (pool.enable_punishment && totalRealUsers > 1 && realUserRank === totalRealUsers - 1) {
    // Garante que a punição não sobrescreva o prêmio se houver 2 ou 3 participantes
    if (totalRealUsers > 3 || (totalRealUsers > 1 && realUserRank > 0) && (totalRealUsers > 2 && realUserRank > 1)) {
       return pool.punishment_description || "Punição não descrita";
    }
  }

  return "";
};

const RankingRow = ({
  participant,
  index,
  realUserRank,
  totalRealParticipants,
  poolSettings, // <-- NOVO
}: RankingRowProps) => {
  const isCurrentUserAI = isAIParticipant(participant);
  // --- ATUALIZADO: Passa as configs para a função ---
  const prizeText = getPrizeText(isCurrentUserAI, realUserRank, totalRealParticipants, poolSettings);
  const isTopRealUser = !isCurrentUserAI && realUserRank !== -1 && realUserRank < 3;

  return (
    <TableRow className={isTopRealUser ? "bg-yellow-50" : ""}>
      <TableCell className="text-center font-medium">{index + 1}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={participant.avatar_url || undefined} alt={participant.name} />
            <AvatarFallback>{participant.name ? participant.name.substring(0, 2).toUpperCase() : '??'}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{participant.name}</div>
            <div className="text-xs text-gray-500">@{participant.username}</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right">{participant.points}</TableCell>
      
      <TableCell className="hidden md:table-cell text-right">{participant.exactScores}</TableCell>
      <TableCell className="hidden md:table-cell text-right">{participant.correctWinners}</TableCell>
      <TableCell className="hidden md:table-cell text-right font-semibold text-sm">{prizeText}</TableCell>
    </TableRow>
  );
};

export default RankingRow;