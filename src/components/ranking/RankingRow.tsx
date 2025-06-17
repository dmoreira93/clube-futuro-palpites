// src/components/ranking/RankingRow.tsx (VERSÃO CORRIGIDA E FINAL)

import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Participant } from "@/hooks/useParticipantsRanking";
import { useAuth } from '@/contexts/AuthContext';
import { Pool } from '@/types/matches';

interface RankingRowProps {
  participant: Participant;
  index: number;
  totalParticipants: number;
}

const RankingRow = ({ participant, index, totalParticipants }: RankingRowProps) => {
  const { pool } = useAuth(); // Pega as regras do bolão do contexto

  const getPrizeText = (
    poolSettings: Pool | null,
    rank: number,
    totalRealUsers: number
  ): string => {
    if (!poolSettings || !poolSettings.entry_fee) return "";

    const totalPrizePool = totalRealUsers * poolSettings.entry_fee;
    const adminFeeMultiplier = 1 - ((poolSettings.admin_fee_percent || 0) / 100.0);
    const finalPrizePool = totalPrizePool * adminFeeMultiplier;

    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (rank === 1 && (poolSettings.prize_percent_1st || 0) > 0) return formatCurrency(finalPrizePool * (poolSettings.prize_percent_1st / 100));
    if (rank === 2 && (poolSettings.prize_percent_2nd || 0) > 0) return formatCurrency(finalPrizePool * (poolSettings.prize_percent_2nd / 100));
    if (rank === 3 && (poolSettings.prize_percent_3rd || 0) > 0) return formatCurrency(finalPrizePool * (poolSettings.prize_percent_3rd / 100));
    
    if (rank === totalRealUsers && totalRealUsers > 3 && poolSettings.enable_punishment) {
      return poolSettings.punishment_description || "Punição";
    }

    return "";
  };

  const prizeText = getPrizeText(pool, index + 1, totalParticipants);
  const isPrizeWinner = prizeText.includes('R$');

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