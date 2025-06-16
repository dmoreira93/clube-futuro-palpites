// src/components/home/RankingTable.tsx - VERSÃO ATUALIZADA

import useParticipantsRanking from "@/hooks/useParticipantsRanking";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import RankingRow from "../ranking/RankingRow";
import { isAIParticipant } from "@/lib/utils";
import { Pool } from '@/types/matches'; // Certifique-se que este tipo existe

// A tabela agora espera receber as configurações do bolão
interface RankingTableProps {
  poolSettings: Pool | null;
}

const RankingTable = ({ poolSettings }: RankingTableProps) => {
  const { participants, loading } = useParticipantsRanking();

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  const realUsers = participants.filter(p => !isAIParticipant(p));

  return (
    <div className="border rounded-lg overflow-hidden shadow-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>Participante</TableHead>
            <TableHead className="text-right">Pontos</TableHead>
            <TableHead className="hidden md:table-cell text-right">Vencedores</TableHead>
            <TableHead className="hidden md:table-cell text-right">Prêmio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.length > 0 ? (
            participants.map((participant, index) => {
              const realUserRank = isAIParticipant(participant) 
                ? -1 
                : realUsers.findIndex(u => u.id === participant.id);

              return (
                <RankingRow
                  key={participant.id}
                  participant={participant}
                  index={index}
                  realUserRank={realUserRank}
                  totalRealParticipants={realUsers.length}
                  poolSettings={poolSettings} // <-- Passando as configurações para cada linha
                />
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                Ainda não há participantes no ranking deste bolão.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default RankingTable;