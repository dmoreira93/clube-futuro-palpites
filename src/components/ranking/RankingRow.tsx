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
  poolSettings: Pool | null;
}

const getPrizeText = (
  isCurrentUserAI: boolean,
  realUserRank: number,
  totalRealUsers: number,
  pool: Pool | null
): string => {
  if (isCurrentUserAI || realUserRank < 0 || totalRealUsers === 0 || !pool || !pool.entry_fee) {
    return "";
  }

  const totalPrizePool = totalRealUsers * pool.entry_fee;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (realUserRank === 0 && pool.prize_percent_1st > 0) return formatCurrency(totalPrizePool * (pool.prize_percent_1st / 100));
  if (realUserRank === 1 && totalRealUsers > 1 && pool.prize_percent_2nd > 0) return formatCurrency(totalPrizePool * (pool.prize_percent_2nd / 100));
  if (realUserRank === 2 && totalRealUsers > 2 && pool.prize_percent_3rd > 0) return formatCurrency(totalPrizePool * (pool.prize_percent_3rd / 100));

  const isLastPlace = realUserRank === totalRealUsers - 1;
  const isAlsoPrizeWinner = realUserRank < 3;
  
  if (pool.enable_punishment && isLastPlace && !isAlsoPrizeWinner) {
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
  
  const participantMatches = (participant as any).matches ?? participant.correctWinners ?? 0;
  const participantAccuracy = participant.accuracy || '0%';

  return (
    <TableRow className={isTopRealUser ? "bg-yellow-100 dark:bg-yellow-900/20" : ""}>
      <TableCell className="text-center font-medium">{index + 1}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={participant.avatar_url || undefined} alt={participant.name} />
            <AvatarFallback>{participant.name ? participant.name.substring(0, 2).toUpperCase() : '??'}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{participant.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">@{participant.username}</div>
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