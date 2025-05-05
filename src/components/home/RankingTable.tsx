
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy as TrophyIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import RankingRow from "./ranking/RankingRow";
import { useParticipantsRanking } from "@/hooks/useParticipantsRanking";

const RankingTable = () => {
  const { participants, loading } = useParticipantsRanking();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-fifa-blue text-white p-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrophyIcon className="h-5 w-5 text-fifa-gold" />
            Carregando Ranking...
          </h2>
        </div>
        <div className="p-4">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-fifa-blue text-white p-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-fifa-gold" />
          Ranking de Participantes
        </h2>
      </div>
      
      <Table>
        <TableCaption>Classificação atualizada dos participantes</TableCaption>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-12 text-center">Pos.</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Apelido</TableHead>
            <TableHead className="text-right">Pontos</TableHead>
            <TableHead className="text-right">Jogos</TableHead>
            <TableHead className="text-right">Aproveitamento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.map((participant, index) => (
            <RankingRow 
              key={participant.id} 
              participant={participant} 
              index={index} 
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RankingTable;
