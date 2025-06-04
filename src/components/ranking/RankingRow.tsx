// src/components/ranking/RankingRow.tsx

import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Participant } from "@/hooks/useParticipantsRanking"; // <--- Importação correta do tipo Participant

type RankingRowProps = {
  participant: Participant;
  index: number;
  totalParticipants: number; // <--- NOVO: Adicionada a prop totalParticipants
};

const RankingRow = ({ participant, index, totalParticipants }: RankingRowProps) => {

  // Lógica para determinar o texto do prêmio
  const getPrizeText = (position: number, total: number): string => {
    if (position === 0) {
      return "R$ 165,00";
    }
    if (position === 1) {
      return "R$ 68,75";
    }
    if (position === 2) {
      return "R$ 41,25";
    }
    // Para o último colocado, verifique se há mais de um participante para evitar que o 1º também seja "último"
    if (position === total - 1 && total > 1) {
      return "Paga um café da manhã";
    }
    return ""; // Retorna vazio para as outras posições sem prêmio específico
  };

  const prizeText = getPrizeText(index, totalParticipants);

  return (
    <TableRow className={index < 3 ? "bg-yellow-50" : ""}>
      <TableCell className="font-medium text-center">
        {index === 0 ? (
          <span className="inline-flex items-center justify-center bg-fifa-gold text-white rounded-full w-6 h-6 text-xs font-bold">1</span>
        ) : index === 1 ? (
          <span className="inline-flex items-center justify-center bg-gray-300 text-gray-800 rounded-full w-6 h-6 text-xs font-bold">2</span>
        ) : index === 2 ? (
          <span className="inline-flex items-center justify-center bg-amber-700 text-white rounded-full w-6 h-6 text-xs font-bold">3</span>
        ) : (
          index + 1
        )}
      </TableCell>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={participant.avatar_url || undefined} /> {/* Certifique-se de que avatar_url é string | undefined para o src */}
            <AvatarFallback>{participant.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          {participant.name}
        </div>
      </TableCell>
      <TableCell className="text-right font-bold">{participant.points}</TableCell>
      <TableCell className="text-right">{participant.matches}</TableCell>
      <TableCell className="text-right">{participant.accuracy}</TableCell>
      <TableCell className="text-right font-semibold">
        {prizeText} {/* <--- AGORA USA O TEXTO CALCULADO */}
      </TableCell>
    </TableRow>
  );
};

export default RankingRow;