// src/pages/Ranking.tsx (VERSÃO FINAL COM CÁLCULO NO FRONTEND)

import { useAuth } from "@/contexts/AuthContext";
import useParticipantsRanking from "@/hooks/useParticipantsRanking";
import RankingRow from "@/components/ranking/RankingRow";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trophy, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMemo } from "react";
import { Participant } from "@/hooks/useParticipantsRanking";
import { isAIParticipant } from "@/lib/utils";

// Função para calcular o prêmio de um participante
const calculatePrize = (participant: Participant, rank: number, totalParticipants: number, pool: any): string => {
  if (!pool || isAIParticipant(participant) || participant.is_admin) {
    return "";
  }
  
  const totalPot = (pool.entry_fee || 0) * totalParticipants;

  if (pool.entry_fee > 0) {
    if (rank === 1 && pool.prize_percent_1st > 0) {
      return `R$ ${(totalPot * pool.prize_percent_1st / 100).toFixed(2).replace('.', ',')}`;
    }
    if (rank === 2 && pool.prize_percent_2nd > 0) {
      return `R$ ${(totalPot * pool.prize_percent_2nd / 100).toFixed(2).replace('.', ',')}`;
    }
    if (rank === 3 && pool.prize_percent_3rd > 0) {
      return `R$ ${(totalPot * pool.prize_percent_3rd / 100).toFixed(2).replace('.', ',')}`;
    }
  }

  if (pool.enable_punishment && rank === totalParticipants && totalParticipants > 3) {
    return pool.punishment_description || "";
  }

  return "";
};


const RankingPage = () => {
  const { pool, user } = useAuth();
  const { participants, loading, error } = useParticipantsRanking();

  // Calcula o ranking e os prêmios aqui
  const rankedParticipants = useMemo(() => {
    const humanParticipantsCount = participants.filter(p => !isAIParticipant(p) && !p.is_admin).length;
    
    return participants.map((participant, index) => {
      const rank = index + 1;
      const prize = calculatePrize(participant, rank, humanParticipantsCount, pool);
      return { ...participant, rank, prize };
    });
  }, [participants, pool]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-fifa-blue" /></div>;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center">
        <Alert variant="destructive" className="max-w-lg mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao Carregar o Ranking</AlertTitle>
          <AlertDescription>Não foi possível buscar os dados. Tente recarregar a página.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-fifa-blue">Ranking do Bolão</h1>
        {pool?.name && <p className="text-lg text-muted-foreground">{pool.name}</p>}
      </div>

      <Card className="max-w-5xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trophy className="text-yellow-500" />Classificação Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">Pos.</TableHead>
                  <TableHead>Participante</TableHead>
                  <TableHead className="text-right">Pontos</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Jogos</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Precisão</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Prêmio/Punição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankedParticipants.length > 0 ? (
                  rankedParticipants.map((participant) => (
                    <RankingRow
                      key={participant.id}
                      participant={participant}
                      index={participant.rank - 1} // O index continua sendo usado para zebra
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">Ainda não há participantes no ranking deste bolão.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RankingPage;