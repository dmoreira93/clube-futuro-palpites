// src/components/ranking/RankingRow.tsx (VERSÃO CORRIGIDA)

import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Participant } from "@/hooks/useParticipantsRanking";
import { useAuth } from '@/contexts/AuthContext';

interface RankingRowProps {
  participant: Participant;
  index: number;
  totalParticipants: number; // Agora recebe o total de participantes reais
}

const RankingRow = ({ participant, index, totalParticipants }: RankingRowProps) => {
  const { pool } = useAuth();

  // Lógica de cálculo de prêmio/punição com verificações de segurança para evitar NaN
  const getPrizeText = () => {
    // Se não houver dados do bolão, não calcula nada
    if (!pool) return "";

    const entryFee = pool.entry_fee || 0;
    const adminFee = pool.admin_fee_percent || 0;
    const totalPrizePool = (totalParticipants * entryFee) * (1 - (adminFee / 100.0));
    
    const rank = index + 1;

    // Calcula os prêmios
    if (rank === 1 && (pool.prize_percent_1st || 0) > 0) {
      const prize = totalPrizePool * (pool.prize_percent_1st / 100.0);
      return prize.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    if (rank === 2 && (pool.prize_percent_2nd || 0) > 0) {
      const prize = totalPrizePool * (pool.prize_percent_2nd / 100.0);
      return prize.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    if (rank === 3 && (pool.prize_percent_3rd || 0) > 0) {
      const prize = totalPrizePool * (pool.prize_percent_3rd / 100.0);
      return prize.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // Calcula a punição para o último lugar (se houver mais de 3 participantes reais)
    if (rank === totalParticipants && totalParticipants > 3 && pool.enable_punishment) {
      return pool.punishment_description || "Punição";
    }

    return "";
  };
  
  const prizeText = getPrizeText();
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