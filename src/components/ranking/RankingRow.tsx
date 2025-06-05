// src/components/ranking/RankingRow.tsx
import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Participant } from "@/hooks/useParticipantsRanking";
import { isAIParticipant } from '@/utils/utils'; // Ajuste o caminho se necessário (ex: '@/lib/utils')

interface RankingRowProps {
  participant: Participant;
  index: number; // Posição geral na lista exibida (0-based)
  realUserRank: number; // Ranking entre usuários reais (0-based), ou -1 se IA/não aplicável
  totalRealParticipants: number; // Total de usuários reais
}

const getPrizeText = (
  isCurrentUserAI: boolean,
  realUserRank: number,
  totalRealUsers: number
): string => {
  if (isCurrentUserAI || realUserRank === -1 || totalRealUsers === 0) {
    return ""; // Sem texto de prêmio para IAs ou se não houver usuários reais
  }

  // 1º usuário real
  if (realUserRank === 0) {
    return "R$ 165,00";
  }
  // 2º usuário real (garante que haja mais de 1 usuário real)
  if (realUserRank === 1 && totalRealUsers > 1) {
    return "R$  68,75";
  }
  // 3º usuário real (garante que haja mais de 2 usuários reais)
  if (realUserRank === 2 && totalRealUsers > 2) {
    return "R$  41,25";
  }
  // Último usuário real (garante que haja mais de 1 usuário real para não premiar/penalizar o primeiro)
  if (totalRealUsers > 1 && realUserRank === totalRealUsers - 1) {
    return "Paga um café da manhã";
  }
  return "";
};

const RankingRow = ({
  participant,
  index,
  realUserRank,
  totalRealParticipants,
}: RankingRowProps) => {
  const isCurrentUserAI = isAIParticipant(participant); // Verifica se o participante atual é IA
  const prizeText = getPrizeText(isCurrentUserAI, realUserRank, totalRealParticipants);

  // Ajusta o destaque para os 3 primeiros usuários REAIS
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
      <TableCell className="text-right">{participant.matches}</TableCell>
      <TableCell className="text-right">{participant.accuracy}</TableCell>
      <TableCell className="text-right font-semibold">
        {prizeText}
      </TableCell>
    </TableRow>
  );
};

export default RankingRow;