import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Participant } from "@/hooks/useParticipantsRanking";
import { isAIParticipant } from '@/lib/utils';
import { Pool } from '@/types/matches';

interface RankingRowProps {
  participant: Participant;
  index: number;
  realUserRank: number;
  totalRealParticipants: number;
  poolSettings: Pool | null; // Recebe as configurações do bolão
}

// Nova função que lê as configurações do bolão em vez de ter valores fixos
const getPrizeText = (
  isCurrentUserAI: boolean,
  realUserRank: number,
  totalRealUsers: number,
  pool: Pool | null // Usa as configurações recebidas
): string => {
  if (isCurrentUserAI || realUserRank < 0 || totalRealUsers === 0 || !pool) {
    return "";
  }

  // Regras de premiação baseadas nas configurações
  if (realUserRank === 0 && pool.prize_percent_1st > 0) {
    return `${pool.prize_percent_1st}% do Prêmio`;
  }
  if (realUserRank === 1 && totalRealUsers > 1 && pool.prize_percent_2nd > 0) {
    return `${pool.prize_percent_2nd}% do Prêmio`;
  }
  if (realUserRank === 2 && totalRealUsers > 2 && pool.prize_percent_3rd > 0) {
    return `${pool.prize_percent_3rd}% do Prêmio`;
  }

  // Regra da punição
  if (pool.enable_punishment && totalRealUsers > 3 && realUserRank === totalRealUsers - 1) {
    return pool.punishment_description || "Punição";
  }

  return "";
};

const RankingRow = ({
  participant,
  index,
  realUserRank,
  totalRealParticipants,
  poolSettings,
}: RankingRowProps) => {
  const isCurrentUserAI = isAIParticipant(participant);
  const prizeText = getPrizeText(isCurrentUserAI, realUserRank, totalRealParticipants, poolSettings);
  const isTopRealUser = !isCurrentUserAI && realUserRank !== -1 && realUserRank < 3;
  
  // Assegurando que a célula de prêmio/penalidade seja exibida
  const participantAccuracy = participant.accuracy || '0%';
  const participantMatches = (participant as any).matches ?? participant.correctWinners ?? 0;

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
      <TableCell className="hidden md:table-cell text-right">{participantMatches}</TableCell>
      <TableCell className="hidden md:table-cell text-right">{participantAccuracy}</TableCell>
      <TableCell className="hidden md:table-cell text-right font-semibold text-sm">{prizeText}</TableCell>
    </TableRow>
  );
};

export default RankingRow;