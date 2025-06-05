// src/components/home/RankingTable.tsx

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import RankingRow from "@/components/ranking/RankingRow";
import  useParticipantsRanking  from "@/hooks/useParticipantsRanking";
import { Users as UsersIcon } from "lucide-react";


const RankingTable = () => {
  const { participants, loading, error } = useParticipantsRanking();

  // Função para renderizar o cabeçalho do card
  const renderCardHeader = () => (
    <CardHeader className="bg-fifa-blue text-white pb-4"> {/* Mantém o fundo e cor do texto */}
      <CardTitle>Ranking de Participantes</CardTitle> {/* Removeu text-xl para usar o padrão (text-2xl) */}
      <CardDescription className="text-sm text-gray-300 pt-1"> {/* Tamanho text-sm e cor text-gray-300 */}
        (Obs.: as IAs não serão consideradas para vencedores/perdedores)
      </CardDescription>
    </CardHeader>
  );

  if (loading) {
    return (
      <Card className="shadow-lg">
        {renderCardHeader()}
        <CardContent className="p-4">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="bg-red-500 text-white">
          <CardTitle>Erro ao Carregar Ranking</CardTitle>
          {/* Você pode adicionar a CardDescription aqui também se o erro precisar de um subtitulo */}
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      {renderCardHeader()}
      <CardContent className="p-0">
        {participants.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <UsersIcon className="w-16 h-16 mb-4" />
            <p className="text-lg font-semibold">Nenhum participante encontrado ainda.</p>
            <p className="text-sm text-center">Peça para mais amigos se cadastrarem e fazerem seus palpites!</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="w-[50px] text-center">Pos</TableHead>
                <TableHead>Participante</TableHead>
                <TableHead className="text-right">Pontos</TableHead>
                <TableHead className="text-right">Jogos Pontuados</TableHead>
                <TableHead className="text-right">Acerto</TableHead>
                <TableHead className="text-right">Prêmio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((participant, index) => (
                <RankingRow
                  key={participant.id}
                  participant={participant}
                  index={index}
                  totalParticipants={participants.length}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default RankingTable;