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
import RankingRow from "@/components/ranking/RankingRow"; // <--- CAMINHO CORRIGIDO AQUI!
import { useParticipantsRanking } from "@/hooks/useParticipantsRanking";

const RankingTable = () => {
  const { participants, loading, error } = useParticipantsRanking(); // Também pegando o erro

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

  // Adicionar tratamento para erro
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-fifa-blue text-white p-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrophyIcon className="h-5 w-5 text-fifa-gold" />
            Erro ao Carregar Ranking
          </h2>
        </div>
        <div className="p-4 text-center text-red-500">
          {error}
          <p className="mt-2 text-sm">Verifique sua conexão e os dados do Supabase.</p>
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
          {participants.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                Nenhum participante no ranking ainda ou dados insuficientes.
              </TableCell>
            </TableRow>
          ) : (
            participants.map((participant, index) => (
              <RankingRow
                key={participant.id}
                participant={participant}
                index={index}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default RankingTable;