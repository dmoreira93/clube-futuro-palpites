// src/components/home/RankingTable.tsx

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

const RankingTable = () => {
  const { participants, loading } = useParticipantsRanking();

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden shadow-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>Participante</TableHead>
            <TableHead className="text-right">Pontos</TableHead>
            {/* ALTERADO: De 'Jogos' para 'Cravadas' */}
            <TableHead className="hidden md:table-cell text-right">Cravadas</TableHead>
            <TableHead className="hidden md:table-cell text-right">Precisão</TableHead>
            <TableHead className="hidden md:table-cell text-right">Prêmio/Punição</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.length > 0 ? (
            participants.map((participant, index) => (
              <RankingRow
                key={participant.id}
                participant={participant}
                index={index}
              />
            ))
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