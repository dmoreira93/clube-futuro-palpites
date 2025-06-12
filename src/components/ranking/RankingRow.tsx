// src/components/ranking/RankingRow.tsx - VERSÃO COM CÁLCULO AUTOMÁTICO DE PRÊMIOS

import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Participant } from "@/hooks/useParticipantsRanking";
import { isAIParticipant } from '@/lib/utils';

interface RankingRowProps {
  participant: Participant;
  index: number;
  realUserRank: number;
  totalRealParticipants: number;
}

// --- FUNÇÃO getPrizeText ATUALIZADA ---
const getPrizeText = (
  isCurrentUserAI: boolean,
  realUserRank: number,
  totalRealUsers: number
): string => {
  // Retorna string vazia para IAs, ranks inválidos ou se não houver usuários.
  if (isCurrentUserAI || realUserRank === -1 || totalRealUsers === 0) {
    return "";
  }

  // 1. Calcula o total do prêmio acumulado.
  const totalPrizePool = totalRealUsers * 25;

  // 2. Helper para formatar o valor em Reais (BRL).
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // 3. Verifica e retorna os prêmios para os 3 primeiros colocados.
  if (realUserRank === 0) {
    // 60% para o primeiro lugar
    return formatCurrency(totalPrizePool * 0.60);
  }
  if (realUserRank === 1 && totalRealUsers > 1) {
    // 25% para o segundo lugar
    return formatCurrency(totalPrizePool * 0.25);
  }
  if (realUserRank === 2 && totalRealUsers > 2) {
    // 15% para o terceiro lugar
    return formatCurrency(totalPrizePool * 0.15);
  }

  // 4. Mantém a regra do "café da manhã" para o último colocado,
  //    desde que não seja um dos 3 primeiros (em bolões com 3 ou menos pessoas).
  if (totalRealUsers > 3 && realUserRank === totalRealUsers - 1) {
    return "Paga um café da manhã";
  }

  // Se não se encaixar em nenhuma regra, não há prêmio.
  return "";
};

const RankingRow = ({
  participant,
  index,
  realUserRank,
  totalRealParticipants,
}: RankingRowProps) => {
  const isCurrentUserAI = isAIParticipant(participant);
  const prizeText = getPrizeText(isCurrentUserAI, realUserRank, totalRealParticipants);
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
      
      <TableCell className="hidden md:table-cell text-right">{participant.matches}</TableCell>
      <TableCell className="hidden md:table-cell text-right">{participant.accuracy}</TableCell>
      <TableCell className="hidden md:table-cell text-right font-semibold">{prizeText}</TableCell>
    </TableRow>
  );
};

export default RankingRow;