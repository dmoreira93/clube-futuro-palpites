// src/components/home/RankingTable.tsx

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
import RankingRow from "@/components/ranking/RankingRow";
import { useParticipantsRanking } from "@/hooks/useParticipantsRanking";
import { Users as UsersIcon } from "lucide-react"; // Adicionado para o estado vazio

const RankingTable = () => {
  const { participants, loading, error } = useParticipantsRanking();

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
          {/* Skeleton mais detalhado para visualização */}
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[60%]" />
                  <Skeleton className="h-4 w-[40%]" />
                </div>
                <Skeleton className="h-4 w-[50px]" />
                <Skeleton className="h-4 w-[50px]" />
                <Skeleton className="h-4 w-[50px]" />
              </div>
            ))}
          </div>
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
          <p>{error}</p>
          <p className="mt-2 text-sm">Verifique sua conexão e os dados do Supabase.</p>
        </div>
      </div>
    );
  }

  // Adicionar tratamento para quando não há participantes
  if (participants.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-fifa-blue text-white p-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrophyIcon className="h-5 w-5 text-fifa-gold" />
            Ranking de Participantes
          </h2>
        </div>
        <div className="text-center text-gray-500 p-8 flex flex-col items-center justify-center">
          <UsersIcon className="h-16 w-16 mb-4 text-gray-400" />
          <p className="text-xl font-semibold mb-2">Nenhum participante ainda!</p>
          <p>Seja o primeiro a fazer um palpite e aparecer no ranking.</p>
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
            {/* REMOVIDO: AQUI REMOVEMOS A COLUNA "Apelido" DO CABEÇALHO */}
            {/* <TableHead>Apelido</TableHead> */}
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